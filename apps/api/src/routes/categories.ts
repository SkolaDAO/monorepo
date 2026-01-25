import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql, asc } from "drizzle-orm";
import { db } from "../db";
import { categories, courses, courseCategories } from "../db/schema";
import type { AppVariables } from "../types";

const categoriesRouter = new Hono<{ Variables: AppVariables }>();

categoriesRouter.get("/", async (c) => {
  const categoryList = await db.query.categories.findMany({
    orderBy: asc(categories.order),
  });

  const categoriesWithCounts = await Promise.all(
    categoryList.map(async (category) => {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(courseCategories)
        .innerJoin(courses, eq(courseCategories.courseId, courses.id))
        .where(
          and(
            eq(courseCategories.categoryId, category.id),
            eq(courses.isPublished, true),
            eq(courses.isHidden, false)
          )
        );

      return {
        ...category,
        courseCount: Number(countResult[0]?.count ?? 0),
      };
    })
  );

  return c.json({ data: categoriesWithCounts });
});

categoriesRouter.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) {
    return c.json({ error: "Category not found" }, 404);
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(courseCategories)
    .innerJoin(courses, eq(courseCategories.courseId, courses.id))
    .where(
      and(
        eq(courseCategories.categoryId, category.id),
        eq(courses.isPublished, true),
        eq(courses.isHidden, false)
      )
    );

  return c.json({
    ...category,
    courseCount: Number(countResult[0]?.count ?? 0),
  });
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

categoriesRouter.get("/:slug/courses", zValidator("query", querySchema), async (c) => {
  const slug = c.req.param("slug");
  const { page, limit } = c.req.valid("query");
  const offset = (page - 1) * limit;

  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) {
    return c.json({ error: "Category not found" }, 404);
  }

  const courseCategoryEntries = await db.query.courseCategories.findMany({
    where: eq(courseCategories.categoryId, category.id),
    with: {
      course: {
        with: {
          creator: {
            columns: {
              id: true,
              address: true,
              username: true,
              avatar: true,
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
      },
    },
  });

  const allCourses = courseCategoryEntries
    .map((cc) => cc.course)
    .filter((course) => course.isPublished && !course.isHidden);

  const sortedCourses = allCourses.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const paginatedCourses = sortedCourses.slice(offset, offset + limit);

  const total = allCourses.length;

  return c.json({
    category,
    data: paginatedCourses.map((course) => ({
      ...course,
      lessonCount: course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0),
      categories: course.courseCategories.map((cc) => cc.category),
      chapters: undefined,
      courseCategories: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export { categoriesRouter };
