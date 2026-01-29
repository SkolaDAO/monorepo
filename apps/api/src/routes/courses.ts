import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, and, sql, ilike, or, inArray } from "drizzle-orm";
import { db } from "../db";
import { courses, purchases, chatRooms, creatorStats, courseCategories, categories, lessonProgress, feedback, courseLikes, courseComments } from "../db/schema";
import { authMiddleware, optionalAuthMiddleware, creatorMiddleware } from "../middleware/auth";
import { checkCourseAccess } from "../services/blockchain";
import type { AppVariables } from "../types";

const MAX_FREE_COURSES = 100;
const FREE_TRIAL_COURSE_LIMIT = 1; // Non-creators can create 1 free course

const coursesRouter = new Hono<{ Variables: AppVariables }>();

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  priceUsd: z.string().regex(/^\d+(\.\d{1,2})?$/),
  isFree: z.boolean().optional(),
  previewPercentage: z.number().min(0).max(100).optional(),
  onChainId: z.number().int().positive().optional(),
});

const updateCourseSchema = createCourseSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  creatorId: z.string().uuid().optional(),
  category: z.string().optional(),
  free: z.enum(["true", "false"]).optional(),
});

coursesRouter.get("/", zValidator("query", querySchema), optionalAuthMiddleware, async (c) => {
  const { page, limit, search, creatorId, category, free } = c.req.valid("query");
  const offset = (page - 1) * limit;

  const conditions = [eq(courses.isPublished, true), eq(courses.isHidden, false)];

  if (search) {
    conditions.push(
      or(ilike(courses.title, `%${search}%`), ilike(courses.description, `%${search}%`)) ?? sql`true`
    );
  }

  if (creatorId) {
    conditions.push(eq(courses.creatorId, creatorId));
  }

  if (free === "true") {
    conditions.push(eq(courses.isFree, true));
  } else if (free === "false") {
    conditions.push(eq(courses.isFree, false));
  }

  let courseIdsInCategory: string[] | undefined;
  if (category) {
    const categoryRecord = await db.query.categories.findFirst({
      where: eq(categories.slug, category),
    });
    if (categoryRecord) {
      const categoryEntries = await db.query.courseCategories.findMany({
        where: eq(courseCategories.categoryId, categoryRecord.id),
        columns: { courseId: true },
      });
      courseIdsInCategory = categoryEntries.map((cc) => cc.courseId);
      if (courseIdsInCategory.length > 0) {
        conditions.push(inArray(courses.id, courseIdsInCategory));
      } else {
        return c.json({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }
  }

  const [courseList, countResult] = await Promise.all([
    db.query.courses.findMany({
      where: and(...conditions),
      with: {
        creator: {
          columns: {
            id: true,
            address: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        chapters: {
          with: {
            lessons: {
              columns: { id: true },
            },
          },
        },
        courseCategories: {
          with: {
            category: true,
          },
        },
      },
      orderBy: desc(courses.createdAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  const courseIds = courseList.map((c) => c.id);

  const [purchaseCounts, progressCounts, ratings, likeCounts, commentCounts] = await Promise.all([
    courseIds.length > 0
      ? db
          .select({
            courseId: purchases.courseId,
            count: sql<number>`count(distinct ${purchases.userId})`,
          })
          .from(purchases)
          .where(inArray(purchases.courseId, courseIds))
          .groupBy(purchases.courseId)
      : [],
    courseIds.length > 0
      ? db
          .select({
            courseId: lessonProgress.courseId,
            count: sql<number>`count(distinct ${lessonProgress.userId})`,
          })
          .from(lessonProgress)
          .where(inArray(lessonProgress.courseId, courseIds))
          .groupBy(lessonProgress.courseId)
      : [],
    courseIds.length > 0
      ? db
          .select({
            courseId: feedback.courseId,
            avgRating: sql<number>`round(avg((${feedback.clarity} + ${feedback.usefulness} + ${feedback.engagement}) / 3.0), 1)`,
            reviewCount: sql<number>`count(*)`,
          })
          .from(feedback)
          .where(inArray(feedback.courseId, courseIds))
          .groupBy(feedback.courseId)
      : [],
    courseIds.length > 0
      ? db
          .select({
            courseId: courseLikes.courseId,
            count: sql<number>`count(*)`,
          })
          .from(courseLikes)
          .where(inArray(courseLikes.courseId, courseIds))
          .groupBy(courseLikes.courseId)
      : [],
    courseIds.length > 0
      ? db
          .select({
            courseId: courseComments.courseId,
            count: sql<number>`count(*)`,
          })
          .from(courseComments)
          .where(inArray(courseComments.courseId, courseIds))
          .groupBy(courseComments.courseId)
      : [],
  ]);

  const purchaseCountMap = new Map(purchaseCounts.map((p) => [p.courseId, Number(p.count)]));
  const progressCountMap = new Map(progressCounts.map((p) => [p.courseId, Number(p.count)]));
  const ratingMap = new Map(ratings.map((r) => [r.courseId, { avgRating: Number(r.avgRating), reviewCount: Number(r.reviewCount) }]));
  const likeCountMap = new Map(likeCounts.map((l) => [l.courseId, Number(l.count)]));
  const commentCountMap = new Map(commentCounts.map((cc) => [cc.courseId, Number(cc.count)]));

  return c.json({
    data: courseList.map((course) => {
      const studentCount = course.isFree
        ? progressCountMap.get(course.id) || 0
        : purchaseCountMap.get(course.id) || 0;
      const rating = ratingMap.get(course.id);

      return {
        ...course,
        lessonCount: course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0),
        categories: course.courseCategories.map((cc) => cc.category),
        studentCount,
        rating: rating ? { average: rating.avgRating, count: rating.reviewCount } : null,
        likeCount: likeCountMap.get(course.id) || 0,
        commentCount: commentCountMap.get(course.id) || 0,
        chapters: undefined,
        courseCategories: undefined,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

coursesRouter.get("/my", authMiddleware, async (c) => {
  const user = c.get("user");

  const courseList = await db.query.courses.findMany({
    where: eq(courses.creatorId, user.id),
    with: {
      chapters: {
        with: {
          lessons: {
            columns: { id: true },
          },
        },
      },
      purchases: {
        columns: {
          id: true,
        },
      },
    },
    orderBy: desc(courses.createdAt),
  });

  return c.json({
    data: courseList.map((course) => ({
      ...course,
      lessonCount: course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0),
      purchaseCount: course.purchases.length,
      chapters: undefined,
      purchases: undefined,
    })),
  });
});

coursesRouter.get("/purchased", authMiddleware, async (c) => {
  const user = c.get("user");

  const purchasedCourses = await db.query.purchases.findMany({
    where: eq(purchases.userId, user.id),
    with: {
      course: {
        with: {
          creator: {
            columns: {
              id: true,
              address: true,
              username: true,
              avatar: true,
              isVerified: true,
            },
          },
          chapters: {
            with: {
              lessons: {
                columns: { id: true },
              },
            },
          },
        },
      },
    },
    orderBy: desc(purchases.purchasedAt),
  });

  return c.json({
    data: purchasedCourses.map((p) => ({
      ...p.course,
      lessonCount: p.course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0),
      chapters: undefined,
      purchasedAt: p.purchasedAt,
    })),
  });
});

coursesRouter.get("/:id", optionalAuthMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, id),
    with: {
      creator: {
        columns: {
          id: true,
          address: true,
          username: true,
          avatar: true,
          bio: true,
          socials: true,
          isVerified: true,
        },
      },
      chapters: {
        orderBy: (chapters, { asc }) => asc(chapters.order),
        with: {
          lessons: {
            orderBy: (lessons, { asc }) => asc(lessons.order),
            columns: {
              id: true,
              title: true,
              order: true,
              isPreview: true,
              videoDuration: true,
            },
          },
        },
      },
      courseCategories: {
        with: {
          category: true,
        },
      },
    },
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  let hasAccess = false;
  
  if (course.isFree) {
    hasAccess = true;
  } else if (user) {
    if (course.creatorId === user.id) {
      hasAccess = true;
    } else if (course.onChainId) {
      hasAccess = await checkCourseAccess(course.onChainId, user.address);
    } else {
      const purchase = await db.query.purchases.findFirst({
        where: and(eq(purchases.userId, user.id), eq(purchases.courseId, course.id)),
      });
      hasAccess = !!purchase;
    }
  }

  const lessonCount = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  // Get student count from purchases
  const [studentCountResult] = await db
    .select({ count: sql<number>`count(distinct ${purchases.userId})` })
    .from(purchases)
    .where(eq(purchases.courseId, course.id));
  
  const studentCount = Number(studentCountResult?.count ?? 0);

  return c.json({
    ...course,
    categories: course.courseCategories.map((cc) => cc.category),
    courseCategories: undefined,
    hasAccess,
    lessonCount,
    studentCount,
  });
});

// Allow non-creators to create ONE free course (trial), otherwise require creator status
coursesRouter.post("/", authMiddleware, zValidator("json", createCourseSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");
  const isFree = data.isFree ?? false;

  // Check existing courses for this user
  const existingCourses = await db.query.courses.findMany({
    where: eq(courses.creatorId, user.id),
    columns: { id: true, isFree: true },
  });

  const existingFreeCourses = existingCourses.filter((c) => c.isFree);
  const totalCourses = existingCourses.length;

  // Non-creators can only create free courses, and only up to FREE_TRIAL_COURSE_LIMIT
  if (!user.isCreator) {
    if (!isFree) {
      return c.json({
        error: "Become a creator to create paid courses",
        code: "CREATOR_REQUIRED_FOR_PAID",
      }, 403);
    }

    if (totalCourses >= FREE_TRIAL_COURSE_LIMIT) {
      return c.json({
        error: "Become a creator to create more courses",
        code: "FREE_TRIAL_LIMIT_REACHED",
        currentCount: totalCourses,
        maxTrialCourses: FREE_TRIAL_COURSE_LIMIT,
      }, 403);
    }
  }

  // Creators have a higher limit for free courses
  if (user.isCreator && isFree && existingFreeCourses.length >= MAX_FREE_COURSES) {
    return c.json({
      error: `You have reached the maximum of ${MAX_FREE_COURSES} free courses`,
      currentCount: existingFreeCourses.length,
      maxCount: MAX_FREE_COURSES,
    }, 403);
  }

  const [course] = await db
    .insert(courses)
    .values({
      creatorId: user.id,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      priceUsd: isFree ? "0" : data.priceUsd,
      isFree,
      previewPercentage: isFree ? 100 : (data.previewPercentage ?? 5),
      onChainId: data.onChainId,
    })
    .returning();

  await db.insert(chatRooms).values({
    courseId: course.id,
    type: "community",
  });

  await db
    .insert(creatorStats)
    .values({
      userId: user.id,
      coursesCount: 1,
      studentsCount: 0,
      totalEarningsUsd: "0",
      points: 10,
    })
    .onConflictDoUpdate({
      target: creatorStats.userId,
      set: {
        coursesCount: sql`${creatorStats.coursesCount} + 1`,
        points: sql`${creatorStats.points} + 10`,
        updatedAt: new Date(),
      },
    });

  return c.json(course, 201);
});

coursesRouter.patch("/:id", authMiddleware, creatorMiddleware, zValidator("json", updateCourseSchema), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const data = c.req.valid("json");

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, id), eq(courses.creatorId, user.id)),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const [updated] = await db
    .update(courses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id))
    .returning();

  return c.json(updated);
});

const setCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid()).max(3),
});

coursesRouter.put("/:id/categories", authMiddleware, creatorMiddleware, zValidator("json", setCategoriesSchema), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const { categoryIds } = c.req.valid("json");

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, id), eq(courses.creatorId, user.id)),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  await db.delete(courseCategories).where(eq(courseCategories.courseId, id));

  if (categoryIds.length > 0) {
    await db.insert(courseCategories).values(
      categoryIds.map((categoryId) => ({
        courseId: id,
        categoryId,
      }))
    );
  }

  const updatedCategories = await db.query.courseCategories.findMany({
    where: eq(courseCategories.courseId, id),
    with: {
      category: true,
    },
  });

  return c.json({
    categories: updatedCategories.map((cc) => cc.category),
  });
});

coursesRouter.post("/:id/publish", authMiddleware, creatorMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, id), eq(courses.creatorId, user.id)),
    with: {
      chapters: {
        with: {
          lessons: true,
        },
      },
    },
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const lessonCount = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  if (lessonCount === 0) {
    return c.json({ error: "Course must have at least one lesson" }, 400);
  }

  const [updated] = await db
    .update(courses)
    .set({
      isPublished: true,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id))
    .returning();

  return c.json(updated);
});

coursesRouter.post("/:id/unpublish", authMiddleware, creatorMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, id), eq(courses.creatorId, user.id)),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const [updated] = await db
    .update(courses)
    .set({
      isPublished: false,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id))
    .returning();

  return c.json(updated);
});

// Check what courses a user can create (works for creators and non-creators)
coursesRouter.get("/creation-eligibility", authMiddleware, async (c) => {
  const user = c.get("user");

  const existingCourses = await db.query.courses.findMany({
    where: eq(courses.creatorId, user.id),
    columns: { id: true, isFree: true },
  });

  const existingFreeCourses = existingCourses.filter((c) => c.isFree);
  const totalCourses = existingCourses.length;

  if (user.isCreator) {
    return c.json({
      isCreator: true,
      canCreateFree: existingFreeCourses.length < MAX_FREE_COURSES,
      canCreatePaid: true,
      freeCoursesCount: existingFreeCourses.length,
      maxFreeCourses: MAX_FREE_COURSES,
      totalCourses,
    });
  }

  // Non-creator
  const canCreateTrial = totalCourses < FREE_TRIAL_COURSE_LIMIT;

  return c.json({
    isCreator: false,
    canCreateFree: canCreateTrial,
    canCreatePaid: false,
    trialCoursesUsed: totalCourses,
    maxTrialCourses: FREE_TRIAL_COURSE_LIMIT,
    totalCourses,
  });
});

coursesRouter.get("/free-course-limits", authMiddleware, async (c) => {
  const user = c.get("user");

  const existingFreeCourses = await db.query.courses.findMany({
    where: and(eq(courses.creatorId, user.id), eq(courses.isFree, true)),
    columns: { id: true },
  });

  return c.json({
    currentCount: existingFreeCourses.length,
    maxCount: MAX_FREE_COURSES,
    canCreateFree: existingFreeCourses.length < MAX_FREE_COURSES,
  });
});

coursesRouter.delete("/:id", authMiddleware, creatorMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, id), eq(courses.creatorId, user.id)),
    with: {
      purchases: true,
    },
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  if (course.purchases.length > 0) {
    return c.json({ error: "Cannot delete course with existing purchases" }, 400);
  }

  await db.delete(courses).where(eq(courses.id, id));

  return c.json({ success: true });
});

export { coursesRouter };
