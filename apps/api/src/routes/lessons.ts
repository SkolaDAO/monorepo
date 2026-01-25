import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db";
import { courses, chapters, lessons, purchases, lessonProgress } from "../db/schema";
import { authMiddleware, optionalAuthMiddleware, creatorMiddleware } from "../middleware/auth";
import { checkCourseAccess } from "../services/blockchain";
import { createVideo, deleteVideo, generateSignedVideoUrl, getUploadCredentials } from "../services/bunny";
import type { AppVariables } from "../types";

const lessonsRouter = new Hono<{ Variables: AppVariables }>();

const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  isPreview: z.boolean().optional(),
});

const updateLessonSchema = createLessonSchema.partial().extend({
  order: z.number().min(0).optional(),
});

const reorderSchema = z.object({
  lessonIds: z.array(z.string().uuid()),
});

async function checkUserCourseAccess(courseId: string, userId?: string, userAddress?: string): Promise<boolean> {
  if (!userId) return false;

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course) return false;
  if (course.isFree) return true;
  if (course.creatorId === userId) return true;

  if (course.onChainId && userAddress) {
    const hasOnChainAccess = await checkCourseAccess(course.onChainId, userAddress);
    if (hasOnChainAccess) return true;
  }

  const purchase = await db.query.purchases.findFirst({
    where: and(eq(purchases.userId, userId), eq(purchases.courseId, courseId)),
  });

  return !!purchase;
}

lessonsRouter.get("/course/:courseId", optionalAuthMiddleware, async (c) => {
  const courseId = c.req.param("courseId");
  const user = c.get("user");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      chapters: {
        orderBy: asc(chapters.order),
        with: {
          lessons: {
            orderBy: asc(lessons.order),
          },
        },
      },
    },
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const hasAccess = await checkUserCourseAccess(courseId, user?.id, user?.address);

  const chaptersWithLessons = course.chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    order: chapter.order,
    lessons: chapter.lessons.map((lesson) => {
      const canAccess = hasAccess || lesson.isPreview;
      return {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        isPreview: lesson.isPreview,
        videoDuration: lesson.videoDuration,
        hasVideo: !!lesson.videoId,
        canAccess,
        content: canAccess ? lesson.content : null,
      };
    }),
  }));

  return c.json({ chapters: chaptersWithLessons, hasAccess });
});

lessonsRouter.get("/:id", optionalAuthMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, id),
    with: {
      chapter: {
        with: {
          course: true,
        },
      },
    },
  });

  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  const course = lesson.chapter.course;
  let hasAccess = lesson.isPreview || course.isFree;

  if (user && !hasAccess) {
    hasAccess = await checkUserCourseAccess(course.id, user.id, user.address);
  }

  if (!hasAccess) {
    return c.json({ error: "Access denied" }, 403);
  }

  let videoUrl: string | null = null;
  if (lesson.videoId) {
    videoUrl = generateSignedVideoUrl(lesson.videoId);
  }

  return c.json({
    id: lesson.id,
    chapterId: lesson.chapterId,
    title: lesson.title,
    content: lesson.content,
    videoId: lesson.videoId,
    videoDuration: lesson.videoDuration,
    order: lesson.order,
    isPreview: lesson.isPreview,
    videoUrl,
  });
});

lessonsRouter.post(
  "/chapter/:chapterId",
  authMiddleware,
  creatorMiddleware,
  zValidator("json", createLessonSchema),
  async (c) => {
    const chapterId = c.req.param("chapterId");
    const user = c.get("user");
    const data = c.req.valid("json");

    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, chapterId),
      with: {
        course: true,
        lessons: {
          columns: { id: true },
        },
      },
    });

    if (!chapter || chapter.course.creatorId !== user.id) {
      return c.json({ error: "Chapter not found" }, 404);
    }

    const [lesson] = await db
      .insert(lessons)
      .values({
        chapterId,
        title: data.title,
        content: data.content,
        order: chapter.lessons.length + 1,
        isPreview: data.isPreview ?? false,
      })
      .returning();

    return c.json(lesson, 201);
  }
);

lessonsRouter.patch(
  "/:id",
  authMiddleware,
  creatorMiddleware,
  zValidator("json", updateLessonSchema),
  async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const data = c.req.valid("json");

    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
      with: {
        chapter: {
          with: {
            course: true,
          },
        },
      },
    });

    if (!lesson || lesson.chapter.course.creatorId !== user.id) {
      return c.json({ error: "Lesson not found" }, 404);
    }

    const [updated] = await db
      .update(lessons)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, id))
      .returning();

    return c.json(updated);
  }
);

lessonsRouter.post(
  "/chapter/:chapterId/reorder",
  authMiddleware,
  creatorMiddleware,
  zValidator("json", reorderSchema),
  async (c) => {
    const chapterId = c.req.param("chapterId");
    const user = c.get("user");
    const { lessonIds } = c.req.valid("json");

    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, chapterId),
      with: {
        course: true,
      },
    });

    if (!chapter || chapter.course.creatorId !== user.id) {
      return c.json({ error: "Chapter not found" }, 404);
    }

    for (let i = 0; i < lessonIds.length; i++) {
      await db
        .update(lessons)
        .set({ order: i + 1, updatedAt: new Date() })
        .where(and(eq(lessons.id, lessonIds[i]), eq(lessons.chapterId, chapterId)));
    }

    return c.json({ success: true });
  }
);

lessonsRouter.post("/:id/video", authMiddleware, creatorMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, id),
    with: {
      chapter: {
        with: {
          course: true,
        },
      },
    },
  });

  if (!lesson || lesson.chapter.course.creatorId !== user.id) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  const video = await createVideo(`${lesson.chapter.course.title} - ${lesson.title}`);

  await db
    .update(lessons)
    .set({
      videoId: video.guid,
      updatedAt: new Date(),
    })
    .where(eq(lessons.id, id));

  const credentials = getUploadCredentials(video.guid);

  return c.json({
    videoId: video.guid,
    uploadUrl: credentials.url,
    uploadHeaders: credentials.headers,
  });
});

lessonsRouter.delete("/:id/video", authMiddleware, creatorMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, id),
    with: {
      chapter: {
        with: {
          course: true,
        },
      },
    },
  });

  if (!lesson || lesson.chapter.course.creatorId !== user.id) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  if (lesson.videoId) {
    await deleteVideo(lesson.videoId);

    await db
      .update(lessons)
      .set({
        videoId: null,
        videoDuration: null,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, id));
  }

  return c.json({ success: true });
});

lessonsRouter.post("/:id/progress", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, id),
    with: {
      chapter: {
        with: {
          course: true,
        },
      },
    },
  });

  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  const courseId = lesson.chapter.course.id;

  const existing = await db.query.lessonProgress.findFirst({
    where: and(
      eq(lessonProgress.userId, user.id),
      eq(lessonProgress.lessonId, id)
    ),
  });

  if (existing) {
    return c.json({ success: true, alreadyCompleted: true });
  }

  await db.insert(lessonProgress).values({
    userId: user.id,
    lessonId: id,
    courseId,
  });

  return c.json({ success: true, alreadyCompleted: false });
});

lessonsRouter.delete("/:id", authMiddleware, creatorMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, id),
    with: {
      chapter: {
        with: {
          course: true,
        },
      },
    },
  });

  if (!lesson || lesson.chapter.course.creatorId !== user.id) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  if (lesson.videoId) {
    await deleteVideo(lesson.videoId);
  }

  await db.delete(lessons).where(eq(lessons.id, id));

  const remainingLessons = await db.query.lessons.findMany({
    where: eq(lessons.chapterId, lesson.chapterId),
    orderBy: asc(lessons.order),
  });

  for (let i = 0; i < remainingLessons.length; i++) {
    await db
      .update(lessons)
      .set({ order: i + 1 })
      .where(eq(lessons.id, remainingLessons[i].id));
  }

  return c.json({ success: true });
});

export { lessonsRouter };
