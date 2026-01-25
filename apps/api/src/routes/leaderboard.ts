import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, count, countDistinct, sum } from "drizzle-orm";
import { db } from "../db";
import { users, courses, purchases, creatorStats } from "../db/schema";
import type { AppVariables } from "../types";

const leaderboardRouter = new Hono<{ Variables: AppVariables }>();

const POINTS_PER_COURSE = 10;
const POINTS_PER_STUDENT = 1;
const POINTS_PER_100_USD = 5;

function calculatePoints(coursesCount: number, studentsCount: number, earningsUsd: number): number {
  return (
    coursesCount * POINTS_PER_COURSE +
    studentsCount * POINTS_PER_STUDENT +
    Math.floor(earningsUsd / 100) * POINTS_PER_100_USD
  );
}

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

leaderboardRouter.get("/creators", zValidator("query", querySchema), async (c) => {
  const { limit, offset } = c.req.valid("query");

  const leaderboard = await db.query.creatorStats.findMany({
    with: {
      user: {
        columns: {
          id: true,
          address: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: desc(creatorStats.points),
    limit,
    offset,
  });

  const totalCount = await db
    .select({ count: count() })
    .from(creatorStats);

  const entries = leaderboard.map((entry, index) => ({
    rank: offset + index + 1,
    user: entry.user,
    stats: {
      coursesCount: entry.coursesCount,
      studentsCount: entry.studentsCount,
      totalEarnings: entry.totalEarningsUsd,
    },
    points: entry.points,
  }));

  return c.json({
    data: entries,
    pagination: {
      total: Number(totalCount[0]?.count ?? 0),
      limit,
      offset,
    },
  });
});

leaderboardRouter.get("/creators/:userId", async (c) => {
  const userId = c.req.param("userId");

  const stats = await db.query.creatorStats.findFirst({
    where: eq(creatorStats.userId, userId),
    with: {
      user: {
        columns: {
          id: true,
          address: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  if (!stats) {
    return c.json({ error: "Creator not found" }, 404);
  }

  const rankResult = await db
    .select({ count: count() })
    .from(creatorStats)
    .where(sql`${creatorStats.points} > ${stats.points}`);

  const rank = Number(rankResult[0]?.count ?? 0) + 1;

  return c.json({
    rank,
    user: stats.user,
    stats: {
      coursesCount: stats.coursesCount,
      studentsCount: stats.studentsCount,
      totalEarnings: stats.totalEarningsUsd,
    },
    points: stats.points,
  });
});

leaderboardRouter.post("/refresh", async (c) => {
  const creators = await db.query.users.findMany({
    where: eq(users.isCreator, true),
    columns: { id: true },
  });

  for (const creator of creators) {
    const coursesResult = await db
      .select({ count: count() })
      .from(courses)
      .where(eq(courses.creatorId, creator.id));

    const studentsResult = await db
      .select({ count: countDistinct(purchases.userId) })
      .from(purchases)
      .innerJoin(courses, eq(purchases.courseId, courses.id))
      .where(eq(courses.creatorId, creator.id));

    const earningsResult = await db
      .select({ total: sum(purchases.paidAmount) })
      .from(purchases)
      .innerJoin(courses, eq(purchases.courseId, courses.id))
      .where(eq(courses.creatorId, creator.id));

    const coursesCount = Number(coursesResult[0]?.count ?? 0);
    const studentsCount = Number(studentsResult[0]?.count ?? 0);
    const totalEarnings = Number(earningsResult[0]?.total ?? 0);
    const points = calculatePoints(coursesCount, studentsCount, totalEarnings);

    await db
      .insert(creatorStats)
      .values({
        userId: creator.id,
        coursesCount,
        studentsCount,
        totalEarningsUsd: String(totalEarnings),
        points,
      })
      .onConflictDoUpdate({
        target: creatorStats.userId,
        set: {
          coursesCount,
          studentsCount,
          totalEarningsUsd: String(totalEarnings),
          points,
          updatedAt: new Date(),
        },
      });
  }

  return c.json({ success: true, refreshedCount: creators.length });
});

export { leaderboardRouter };
