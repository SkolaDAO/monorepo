import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../db";
import { reports, courses, users, messages } from "../db/schema";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const reportsRouter = new Hono<{ Variables: AppVariables }>();

const createReportSchema = z.object({
  reportType: z.enum(["course", "user", "message"]),
  targetId: z.string().uuid(),
  reason: z.enum([
    "spam",
    "scam",
    "inappropriate_content",
    "harassment",
    "copyright",
    "misleading",
    "other",
  ]),
  description: z.string().max(1000).optional(),
});

reportsRouter.post("/", authMiddleware, zValidator("json", createReportSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  if (data.reportType === "course") {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, data.targetId),
    });
    if (!course) {
      return c.json({ error: "Course not found" }, 404);
    }
    if (course.creatorId === user.id) {
      return c.json({ error: "Cannot report your own course" }, 400);
    }
  } else if (data.reportType === "user") {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, data.targetId),
    });
    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }
    if (targetUser.id === user.id) {
      return c.json({ error: "Cannot report yourself" }, 400);
    }
  } else if (data.reportType === "message") {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, data.targetId),
    });
    if (!message) {
      return c.json({ error: "Message not found" }, 404);
    }
    if (message.senderId === user.id) {
      return c.json({ error: "Cannot report your own message" }, 400);
    }
  }

  const existingReport = await db.query.reports.findFirst({
    where: and(
      eq(reports.reporterId, user.id),
      eq(reports.reportType, data.reportType),
      data.reportType === "course"
        ? eq(reports.targetCourseId, data.targetId)
        : data.reportType === "user"
        ? eq(reports.targetUserId, data.targetId)
        : eq(reports.targetMessageId, data.targetId),
      eq(reports.status, "pending")
    ),
  });

  if (existingReport) {
    return c.json({ error: "You have already reported this" }, 400);
  }

  const [report] = await db
    .insert(reports)
    .values({
      reporterId: user.id,
      reportType: data.reportType,
      targetCourseId: data.reportType === "course" ? data.targetId : null,
      targetUserId: data.reportType === "user" ? data.targetId : null,
      targetMessageId: data.reportType === "message" ? data.targetId : null,
      reason: data.reason,
      description: data.description,
    })
    .returning();

  return c.json(report, 201);
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["pending", "reviewed", "resolved", "dismissed", "all"]).default("pending"),
  type: z.enum(["course", "user", "message", "all"]).default("all"),
});

reportsRouter.get("/", authMiddleware, adminMiddleware, zValidator("query", querySchema), async (c) => {
  const { page, limit, status, type } = c.req.valid("query");
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status !== "all") {
    conditions.push(eq(reports.status, status));
  }
  if (type !== "all") {
    conditions.push(eq(reports.reportType, type));
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const [reportList, countResult] = await Promise.all([
    db.query.reports.findMany({
      where: whereCondition,
      with: {
        reporter: {
          columns: {
            id: true,
            address: true,
            username: true,
            avatar: true,
          },
        },
        targetCourse: {
          columns: {
            id: true,
            title: true,
            thumbnail: true,
          },
          with: {
            creator: {
              columns: {
                id: true,
                address: true,
                username: true,
              },
            },
          },
        },
        targetUser: {
          columns: {
            id: true,
            address: true,
            username: true,
            avatar: true,
          },
        },
        targetMessage: {
          columns: {
            id: true,
            content: true,
            createdAt: true,
          },
          with: {
            sender: {
              columns: {
                id: true,
                address: true,
                username: true,
              },
            },
          },
        },
        reviewer: {
          columns: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: desc(reports.createdAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(whereCondition),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    data: reportList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

reportsRouter.get("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const report = await db.query.reports.findFirst({
    where: eq(reports.id, id),
    with: {
      reporter: {
        columns: {
          id: true,
          address: true,
          username: true,
          avatar: true,
        },
      },
      targetCourse: {
        with: {
          creator: {
            columns: {
              id: true,
              address: true,
              username: true,
            },
          },
        },
      },
      targetUser: {
        columns: {
          id: true,
          address: true,
          username: true,
          avatar: true,
          isBanned: true,
        },
      },
      targetMessage: {
        with: {
          sender: {
            columns: {
              id: true,
              address: true,
              username: true,
            },
          },
        },
      },
      reviewer: {
        columns: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!report) {
    return c.json({ error: "Report not found" }, 404);
  }

  return c.json(report);
});

const updateReportSchema = z.object({
  status: z.enum(["reviewed", "resolved", "dismissed"]),
  reviewNotes: z.string().max(1000).optional(),
});

reportsRouter.patch("/:id", authMiddleware, adminMiddleware, zValidator("json", updateReportSchema), async (c) => {
  const id = c.req.param("id");
  const admin = c.get("user");
  const data = c.req.valid("json");

  const report = await db.query.reports.findFirst({
    where: eq(reports.id, id),
  });

  if (!report) {
    return c.json({ error: "Report not found" }, 404);
  }

  const [updated] = await db
    .update(reports)
    .set({
      status: data.status,
      reviewNotes: data.reviewNotes,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    })
    .where(eq(reports.id, id))
    .returning();

  return c.json(updated);
});

reportsRouter.get("/stats", authMiddleware, adminMiddleware, async (c) => {
  const [pending, reviewed, resolved, dismissed] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "reviewed")),
    db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "resolved")),
    db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "dismissed")),
  ]);

  const byType = await db
    .select({
      type: reports.reportType,
      count: sql<number>`count(*)`,
    })
    .from(reports)
    .where(eq(reports.status, "pending"))
    .groupBy(reports.reportType);

  return c.json({
    total: {
      pending: Number(pending[0]?.count ?? 0),
      reviewed: Number(reviewed[0]?.count ?? 0),
      resolved: Number(resolved[0]?.count ?? 0),
      dismissed: Number(dismissed[0]?.count ?? 0),
    },
    byType: byType.reduce((acc, { type, count }) => {
      acc[type] = Number(count);
      return acc;
    }, {} as Record<string, number>),
  });
});

export { reportsRouter };
