import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { feedback, courses, lessons } from "../db/schema";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const feedbackRouter = new Hono<{ Variables: AppVariables }>();

const createFeedbackSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid().optional(),
  clarity: z.number().int().min(1).max(5),
  usefulness: z.number().int().min(1).max(5),
  engagement: z.number().int().min(1).max(5),
  difficulty: z.enum(["too_easy", "just_right", "too_hard"]),
  wouldRecommend: z.boolean(),
  generalFeedback: z.string().max(2000).nullable().optional(),
});

feedbackRouter.post("/", authMiddleware, zValidator("json", createFeedbackSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, data.courseId),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  if (data.lessonId) {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, data.lessonId),
    });
    if (!lesson) {
      return c.json({ error: "Lesson not found" }, 404);
    }
  }

  const existingFeedback = await db.query.feedback.findFirst({
    where: and(
      eq(feedback.userId, user.id),
      eq(feedback.courseId, data.courseId),
      data.lessonId ? eq(feedback.lessonId, data.lessonId) : sql`${feedback.lessonId} IS NULL`
    ),
  });

  if (existingFeedback) {
    const [updated] = await db
      .update(feedback)
      .set({
        clarity: data.clarity,
        usefulness: data.usefulness,
        engagement: data.engagement,
        difficulty: data.difficulty,
        wouldRecommend: data.wouldRecommend,
        generalFeedback: data.generalFeedback ?? null,
      })
      .where(eq(feedback.id, existingFeedback.id))
      .returning();
    return c.json(updated);
  }

  const [created] = await db
    .insert(feedback)
    .values({
      userId: user.id,
      courseId: data.courseId,
      lessonId: data.lessonId ?? null,
      clarity: data.clarity,
      usefulness: data.usefulness,
      engagement: data.engagement,
      difficulty: data.difficulty,
      wouldRecommend: data.wouldRecommend,
      generalFeedback: data.generalFeedback ?? null,
    })
    .returning();

  return c.json(created, 201);
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  courseId: z.string().uuid().optional(),
});

feedbackRouter.get("/", authMiddleware, adminMiddleware, zValidator("query", querySchema), async (c) => {
  const { page, limit, courseId } = c.req.valid("query");
  const offset = (page - 1) * limit;

  const conditions = [];
  if (courseId) {
    conditions.push(eq(feedback.courseId, courseId));
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const [feedbackList, countResult] = await Promise.all([
    db.query.feedback.findMany({
      where: whereCondition,
      with: {
        user: {
          columns: {
            id: true,
            address: true,
            username: true,
            avatar: true,
          },
        },
        course: {
          columns: {
            id: true,
            title: true,
          },
        },
        lesson: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: desc(feedback.createdAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(feedback)
      .where(whereCondition),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    data: feedbackList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

feedbackRouter.get("/course/:courseId/stats", authMiddleware, async (c) => {
  const courseId = c.req.param("courseId");
  const user = c.get("user");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  if (course.creatorId !== user.id && !user.isAdmin) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const stats = await db
    .select({
      count: sql<number>`count(*)`,
      avgClarity: sql<number>`avg(clarity)`,
      avgUsefulness: sql<number>`avg(usefulness)`,
      avgEngagement: sql<number>`avg(engagement)`,
      recommendCount: sql<number>`sum(case when would_recommend then 1 else 0 end)`,
    })
    .from(feedback)
    .where(eq(feedback.courseId, courseId));

  const difficultyStats = await db
    .select({
      difficulty: feedback.difficulty,
      count: sql<number>`count(*)`,
    })
    .from(feedback)
    .where(eq(feedback.courseId, courseId))
    .groupBy(feedback.difficulty);

  const stat = stats[0];
  const total = Number(stat?.count ?? 0);

  return c.json({
    totalResponses: total,
    averageRatings: {
      clarity: Number(stat?.avgClarity ?? 0).toFixed(1),
      usefulness: Number(stat?.avgUsefulness ?? 0).toFixed(1),
      engagement: Number(stat?.avgEngagement ?? 0).toFixed(1),
    },
    recommendationRate: total > 0 ? ((Number(stat?.recommendCount ?? 0) / total) * 100).toFixed(0) : "0",
    difficultyDistribution: difficultyStats.reduce(
      (acc, { difficulty, count }) => {
        acc[difficulty] = Number(count);
        return acc;
      },
      {} as Record<string, number>
    ),
  });
});

feedbackRouter.get("/course/:courseId/rating", async (c) => {
  const courseId = c.req.param("courseId");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const stats = await db
    .select({
      count: sql<number>`count(*)`,
      avgClarity: sql<number>`avg(clarity)`,
      avgUsefulness: sql<number>`avg(usefulness)`,
      avgEngagement: sql<number>`avg(engagement)`,
      recommendCount: sql<number>`sum(case when would_recommend then 1 else 0 end)`,
    })
    .from(feedback)
    .where(eq(feedback.courseId, courseId));

  const stat = stats[0];
  const total = Number(stat?.count ?? 0);

  if (total === 0) {
    return c.json({
      hasRating: false,
      totalReviews: 0,
      averageRating: null,
      recommendationRate: null,
    });
  }

  const avgClarity = Number(stat?.avgClarity ?? 0);
  const avgUsefulness = Number(stat?.avgUsefulness ?? 0);
  const avgEngagement = Number(stat?.avgEngagement ?? 0);
  const overallAverage = (avgClarity + avgUsefulness + avgEngagement) / 3;

  return c.json({
    hasRating: true,
    totalReviews: total,
    averageRating: Number(overallAverage.toFixed(1)),
    recommendationRate: Number(((Number(stat?.recommendCount ?? 0) / total) * 100).toFixed(0)),
  });
});

export { feedbackRouter };
