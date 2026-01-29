import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { courseLikes, courses } from "../db/schema";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const likesRouter = new Hono<{ Variables: AppVariables }>();

// Toggle like on a course
likesRouter.post("/courses/:courseId/like", authMiddleware, async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("courseId");

  // Verify course exists
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  // Check if already liked
  const existingLike = await db.query.courseLikes.findFirst({
    where: and(eq(courseLikes.userId, user.id), eq(courseLikes.courseId, courseId)),
  });

  if (existingLike) {
    // Unlike
    await db.delete(courseLikes).where(eq(courseLikes.id, existingLike.id));
  } else {
    // Like
    await db.insert(courseLikes).values({
      userId: user.id,
      courseId,
    });
  }

  // Get updated count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(courseLikes)
    .where(eq(courseLikes.courseId, courseId));

  return c.json({
    liked: !existingLike,
    likeCount: Number(countResult?.count ?? 0),
  });
});

// Get like status for a course
likesRouter.get("/courses/:courseId/likes", optionalAuthMiddleware, async (c) => {
  const courseId = c.req.param("courseId");
  const user = c.get("user");

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(courseLikes)
    .where(eq(courseLikes.courseId, courseId));

  let isLiked = false;
  if (user) {
    const existingLike = await db.query.courseLikes.findFirst({
      where: and(eq(courseLikes.userId, user.id), eq(courseLikes.courseId, courseId)),
    });
    isLiked = !!existingLike;
  }

  return c.json({
    likeCount: Number(countResult?.count ?? 0),
    isLiked,
  });
});

// Get IDs of all courses the user has liked
likesRouter.get("/courses/liked-ids", authMiddleware, async (c) => {
  const user = c.get("user");

  const likes = await db.query.courseLikes.findMany({
    where: eq(courseLikes.userId, user.id),
    columns: { courseId: true },
  });

  return c.json(likes.map((l) => l.courseId));
});

export { likesRouter };
