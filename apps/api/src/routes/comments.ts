import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { courseComments, courses, users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const commentsRouter = new Hono<{ Variables: AppVariables }>();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

// Get paginated comments for a course
commentsRouter.get("/courses/:courseId/comments", zValidator("query", querySchema), async (c) => {
  const courseId = c.req.param("courseId");
  const { page, limit } = c.req.valid("query");
  const offset = (page - 1) * limit;

  const [commentList, countResult] = await Promise.all([
    db.query.courseComments.findMany({
      where: eq(courseComments.courseId, courseId),
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
      orderBy: desc(courseComments.createdAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(courseComments)
      .where(eq(courseComments.courseId, courseId)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    data: commentList.map((comment) => ({
      id: comment.id,
      courseId: comment.courseId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: comment.user,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Create a comment
commentsRouter.post(
  "/courses/:courseId/comments",
  authMiddleware,
  zValidator("json", createCommentSchema),
  async (c) => {
    const user = c.get("user");
    const courseId = c.req.param("courseId");
    const { content } = c.req.valid("json");

    // Verify course exists
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return c.json({ error: "Course not found" }, 404);
    }

    const [comment] = await db
      .insert(courseComments)
      .values({
        userId: user.id,
        courseId,
        content,
      })
      .returning();

    // Fetch user info
    const userInfo = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        id: true,
        address: true,
        username: true,
        avatar: true,
      },
    });

    return c.json(
      {
        id: comment.id,
        courseId: comment.courseId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: userInfo!,
      },
      201
    );
  }
);

// Delete own comment
commentsRouter.delete("/courses/:courseId/comments/:commentId", authMiddleware, async (c) => {
  const user = c.get("user");
  const commentId = c.req.param("commentId");

  const comment = await db.query.courseComments.findFirst({
    where: eq(courseComments.id, commentId),
  });

  if (!comment) {
    return c.json({ error: "Comment not found" }, 404);
  }

  if (comment.userId !== user.id) {
    return c.json({ error: "You can only delete your own comments" }, 403);
  }

  await db.delete(courseComments).where(eq(courseComments.id, commentId));

  return c.json({ success: true });
});

export { commentsRouter };
