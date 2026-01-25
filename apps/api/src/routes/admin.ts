import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { users, courses, messages, reports, notifications } from "../db/schema";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const adminRouter = new Hono<{ Variables: AppVariables }>();

adminRouter.use("*", authMiddleware, adminMiddleware);

const banUserSchema = z.object({
  reason: z.string().min(1).max(500),
});

adminRouter.post("/users/:id/ban", zValidator("json", banUserSchema), async (c) => {
  const userId = c.req.param("id");
  const { reason } = c.req.valid("json");

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  if (user.isAdmin) {
    return c.json({ error: "Cannot ban an admin" }, 400);
  }

  if (user.isBanned) {
    return c.json({ error: "User is already banned" }, 400);
  }

  await db
    .update(users)
    .set({
      isBanned: true,
      bannedAt: new Date(),
      bannedReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await db.insert(notifications).values({
    userId,
    type: "system",
    title: "Account Suspended",
    body: `Your account has been suspended. Reason: ${reason}`,
  });

  return c.json({ success: true, message: "User banned successfully" });
});

adminRouter.post("/users/:id/unban", async (c) => {
  const userId = c.req.param("id");

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  if (!user.isBanned) {
    return c.json({ error: "User is not banned" }, 400);
  }

  await db
    .update(users)
    .set({
      isBanned: false,
      bannedAt: null,
      bannedReason: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await db.insert(notifications).values({
    userId,
    type: "system",
    title: "Account Restored",
    body: "Your account has been restored. You can now access the platform again.",
  });

  return c.json({ success: true, message: "User unbanned successfully" });
});

const hideCourseSchema = z.object({
  reason: z.string().min(1).max(500),
});

adminRouter.post("/courses/:id/hide", zValidator("json", hideCourseSchema), async (c) => {
  const courseId = c.req.param("id");
  const { reason } = c.req.valid("json");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      creator: {
        columns: { id: true },
      },
    },
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  if (course.isHidden) {
    return c.json({ error: "Course is already hidden" }, 400);
  }

  await db
    .update(courses)
    .set({
      isHidden: true,
      hiddenAt: new Date(),
      hiddenReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, courseId));

  await db.insert(notifications).values({
    userId: course.creator.id,
    type: "system",
    title: "Course Hidden",
    body: `Your course "${course.title}" has been hidden from the marketplace. Reason: ${reason}`,
    data: { courseId },
  });

  return c.json({ success: true, message: "Course hidden successfully" });
});

adminRouter.post("/courses/:id/unhide", async (c) => {
  const courseId = c.req.param("id");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      creator: {
        columns: { id: true },
      },
    },
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  if (!course.isHidden) {
    return c.json({ error: "Course is not hidden" }, 400);
  }

  await db
    .update(courses)
    .set({
      isHidden: false,
      hiddenAt: null,
      hiddenReason: null,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, courseId));

  await db.insert(notifications).values({
    userId: course.creator.id,
    type: "system",
    title: "Course Restored",
    body: `Your course "${course.title}" has been restored to the marketplace.`,
    data: { courseId },
  });

  return c.json({ success: true, message: "Course unhidden successfully" });
});

adminRouter.delete("/messages/:id", async (c) => {
  const messageId = c.req.param("id");

  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });

  if (!message) {
    return c.json({ error: "Message not found" }, 404);
  }

  await db.delete(messages).where(eq(messages.id, messageId));

  return c.json({ success: true, message: "Message deleted successfully" });
});

adminRouter.post("/users/:id/make-admin", async (c) => {
  const userId = c.req.param("id");

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  if (user.isAdmin) {
    return c.json({ error: "User is already an admin" }, 400);
  }

  await db
    .update(users)
    .set({
      isAdmin: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return c.json({ success: true, message: "User is now an admin" });
});

adminRouter.post("/users/:id/remove-admin", async (c) => {
  const userId = c.req.param("id");
  const admin = c.get("user");

  if (userId === admin.id) {
    return c.json({ error: "Cannot remove your own admin status" }, 400);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  if (!user.isAdmin) {
    return c.json({ error: "User is not an admin" }, 400);
  }

  await db
    .update(users)
    .set({
      isAdmin: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return c.json({ success: true, message: "Admin status removed" });
});

const usersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  banned: z.enum(["true", "false", "all"]).default("all"),
});

adminRouter.get("/users", zValidator("query", usersQuerySchema), async (c) => {
  const { page, limit, banned } = c.req.valid("query");
  const offset = (page - 1) * limit;

  let whereCondition;
  if (banned === "true") {
    whereCondition = eq(users.isBanned, true);
  } else if (banned === "false") {
    whereCondition = eq(users.isBanned, false);
  }

  const [userList, countResult] = await Promise.all([
    db.query.users.findMany({
      where: whereCondition,
      orderBy: desc(users.createdAt),
      limit,
      offset,
      columns: {
        id: true,
        address: true,
        username: true,
        avatar: true,
        isCreator: true,
        isAdmin: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
      },
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereCondition),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    data: userList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

const coursesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  hidden: z.enum(["true", "false", "all"]).default("all"),
});

adminRouter.get("/courses", zValidator("query", coursesQuerySchema), async (c) => {
  const { page, limit, hidden } = c.req.valid("query");
  const offset = (page - 1) * limit;

  let whereCondition;
  if (hidden === "true") {
    whereCondition = eq(courses.isHidden, true);
  } else if (hidden === "false") {
    whereCondition = eq(courses.isHidden, false);
  }

  const [courseList, countResult] = await Promise.all([
    db.query.courses.findMany({
      where: whereCondition,
      with: {
        creator: {
          columns: {
            id: true,
            address: true,
            username: true,
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
      .where(whereCondition),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    data: courseList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

adminRouter.get("/stats", async (c) => {
  const [
    totalUsers,
    totalCreators,
    totalCourses,
    totalBannedUsers,
    totalHiddenCourses,
    pendingReports,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isCreator, true)),
    db.select({ count: sql<number>`count(*)` }).from(courses),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isBanned, true)),
    db.select({ count: sql<number>`count(*)` }).from(courses).where(eq(courses.isHidden, true)),
    db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "pending")),
  ]);

  return c.json({
    totalUsers: Number(totalUsers[0]?.count ?? 0),
    totalCreators: Number(totalCreators[0]?.count ?? 0),
    totalCourses: Number(totalCourses[0]?.count ?? 0),
    totalBannedUsers: Number(totalBannedUsers[0]?.count ?? 0),
    totalHiddenCourses: Number(totalHiddenCourses[0]?.count ?? 0),
    pendingReports: Number(pendingReports[0]?.count ?? 0),
  });
});

export { adminRouter };
