import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const notificationsRouter = new Hono<{ Variables: AppVariables }>();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()),
});

notificationsRouter.get("/", authMiddleware, zValidator("query", querySchema), async (c) => {
  const user = c.get("user");
  const { page, limit, unreadOnly } = c.req.valid("query");
  const offset = (page - 1) * limit;

  const conditions = [eq(notifications.userId, user.id)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  const [notificationList, countResult, unreadCount] = await Promise.all([
    db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: desc(notifications.createdAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false))),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    data: notificationList,
    unreadCount: Number(unreadCount[0]?.count ?? 0),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

notificationsRouter.get("/unread-count", authMiddleware, async (c) => {
  const user = c.get("user");

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  return c.json({ count: Number(result?.count ?? 0) });
});

notificationsRouter.post("/mark-read", authMiddleware, zValidator("json", markReadSchema), async (c) => {
  const user = c.get("user");
  const { notificationIds } = c.req.valid("json");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, user.id), inArray(notifications.id, notificationIds)));

  return c.json({ success: true });
});

notificationsRouter.post("/mark-all-read", authMiddleware, async (c) => {
  const user = c.get("user");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  return c.json({ success: true });
});

notificationsRouter.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

  return c.json({ success: true });
});

export { notificationsRouter };
