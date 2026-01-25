import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db";
import { chapters, courses } from "../db/schema";
import { authMiddleware, creatorMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const chaptersRouter = new Hono<{ Variables: AppVariables }>();

const createChapterSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

const updateChapterSchema = createChapterSchema.partial();

const reorderSchema = z.object({
  chapterIds: z.array(z.string().uuid()),
});

chaptersRouter.get("/course/:courseId", async (c) => {
  const courseId = c.req.param("courseId");

  const chapterList = await db.query.chapters.findMany({
    where: eq(chapters.courseId, courseId),
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
    orderBy: asc(chapters.order),
  });

  return c.json({ data: chapterList });
});

chaptersRouter.post(
  "/course/:courseId",
  authMiddleware,
  creatorMiddleware,
  zValidator("json", createChapterSchema),
  async (c) => {
    const courseId = c.req.param("courseId");
    const user = c.get("user");
    const data = c.req.valid("json");

    const course = await db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), eq(courses.creatorId, user.id)),
    });

    if (!course) {
      return c.json({ error: "Course not found" }, 404);
    }

    const existingChapters = await db.query.chapters.findMany({
      where: eq(chapters.courseId, courseId),
      columns: { id: true },
    });

    const [chapter] = await db
      .insert(chapters)
      .values({
        courseId,
        title: data.title,
        description: data.description,
        order: existingChapters.length + 1,
      })
      .returning();

    return c.json(chapter, 201);
  }
);

chaptersRouter.patch(
  "/:id",
  authMiddleware,
  creatorMiddleware,
  zValidator("json", updateChapterSchema),
  async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const data = c.req.valid("json");

    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id),
      with: {
        course: {
          columns: { creatorId: true },
        },
      },
    });

    if (!chapter || chapter.course.creatorId !== user.id) {
      return c.json({ error: "Chapter not found" }, 404);
    }

    const [updated] = await db
      .update(chapters)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, id))
      .returning();

    return c.json(updated);
  }
);

chaptersRouter.delete("/:id", authMiddleware, creatorMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, id),
    with: {
      course: {
        columns: { id: true, creatorId: true },
      },
      lessons: {
        columns: { id: true },
      },
    },
  });

  if (!chapter || chapter.course.creatorId !== user.id) {
    return c.json({ error: "Chapter not found" }, 404);
  }

  if (chapter.lessons.length > 0) {
    return c.json({ error: "Cannot delete chapter with lessons. Delete lessons first." }, 400);
  }

  await db.delete(chapters).where(eq(chapters.id, id));

  const remainingChapters = await db.query.chapters.findMany({
    where: eq(chapters.courseId, chapter.course.id),
    orderBy: asc(chapters.order),
  });

  for (let i = 0; i < remainingChapters.length; i++) {
    await db
      .update(chapters)
      .set({ order: i + 1 })
      .where(eq(chapters.id, remainingChapters[i].id));
  }

  return c.json({ success: true });
});

chaptersRouter.post(
  "/course/:courseId/reorder",
  authMiddleware,
  creatorMiddleware,
  zValidator("json", reorderSchema),
  async (c) => {
    const courseId = c.req.param("courseId");
    const user = c.get("user");
    const { chapterIds } = c.req.valid("json");

    const course = await db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), eq(courses.creatorId, user.id)),
    });

    if (!course) {
      return c.json({ error: "Course not found" }, 404);
    }

    for (let i = 0; i < chapterIds.length; i++) {
      await db
        .update(chapters)
        .set({ order: i + 1, updatedAt: new Date() })
        .where(and(eq(chapters.id, chapterIds[i]), eq(chapters.courseId, courseId)));
    }

    return c.json({ success: true });
  }
);

export { chaptersRouter };
