import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, or, like } from "drizzle-orm";
import { db } from "../db";
import { users, courses, messages, reports, notifications, chatRooms } from "../db/schema";
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

// ============ Creator Whitelisting ============

const whitelistCreatorSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

adminRouter.post("/creators/whitelist", zValidator("json", whitelistCreatorSchema), async (c) => {
  const { address } = c.req.valid("json");
  const normalizedAddress = address.toLowerCase();

  // Check if user exists
  let user = await db.query.users.findFirst({
    where: eq(users.address, normalizedAddress),
  });

  if (user) {
    if (user.isCreator) {
      return c.json({ error: "User is already a creator" }, 400);
    }

    // Update existing user to be a creator
    await db
      .update(users)
      .set({
        isCreator: true,
        creatorRegisteredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  } else {
    // Create new user as a whitelisted creator
    const [newUser] = await db
      .insert(users)
      .values({
        address: normalizedAddress,
        isCreator: true,
        creatorRegisteredAt: new Date(),
      })
      .returning();
    user = newUser;
  }

  return c.json({
    success: true,
    message: "Creator whitelisted successfully",
    user: {
      id: user.id,
      address: normalizedAddress,
      isCreator: true,
    },
  });
});

adminRouter.post("/creators/:id/remove", async (c) => {
  const userId = c.req.param("id");

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  if (!user.isCreator) {
    return c.json({ error: "User is not a creator" }, 400);
  }

  await db
    .update(users)
    .set({
      isCreator: false,
      creatorRegisteredAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return c.json({ success: true, message: "Creator status removed" });
});

const creatorsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

adminRouter.get("/creators", zValidator("query", creatorsQuerySchema), async (c) => {
  const { page, limit, search } = c.req.valid("query");
  const offset = (page - 1) * limit;

  let whereCondition = eq(users.isCreator, true);
  if (search) {
    whereCondition = and(
      eq(users.isCreator, true),
      or(
        like(users.address, `%${search.toLowerCase()}%`),
        like(users.username, `%${search}%`)
      )
    ) as typeof whereCondition;
  }

  const [creatorList, countResult] = await Promise.all([
    db.query.users.findMany({
      where: whereCondition,
      orderBy: desc(users.creatorRegisteredAt),
      limit,
      offset,
      columns: {
        id: true,
        address: true,
        username: true,
        avatar: true,
        isCreator: true,
        creatorTier: true,
        creatorRegisteredAt: true,
        createdAt: true,
      },
      with: {
        creatorStats: {
          columns: {
            coursesCount: true,
            studentsCount: true,
            totalEarningsUsd: true,
          },
        },
      },
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereCondition),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    data: creatorList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ============ Channel & Message Browsing ============

const channelsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.enum(["dm", "community", "all"]).default("all"),
  search: z.string().optional(),
});

adminRouter.get("/channels", zValidator("query", channelsQuerySchema), async (c) => {
  const { page, limit, type, search: _search } = c.req.valid("query");
  const offset = (page - 1) * limit;

  let whereCondition;
  if (type !== "all") {
    whereCondition = eq(chatRooms.type, type);
  }

  const [roomList, countResult] = await Promise.all([
    db.query.chatRooms.findMany({
      where: whereCondition,
      with: {
        course: {
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
        participantOneUser: {
          columns: {
            id: true,
            address: true,
            username: true,
            avatar: true,
          },
        },
        participantTwoUser: {
          columns: {
            id: true,
            address: true,
            username: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: desc(messages.createdAt),
          limit: 1,
          columns: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: desc(chatRooms.lastMessageAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(chatRooms)
      .where(whereCondition),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  // Transform to include message count
  const enrichedRooms = await Promise.all(
    roomList.map(async (room) => {
      const [messageCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(eq(messages.roomId, room.id));

      return {
        ...room,
        messageCount: Number(messageCount?.count ?? 0),
        lastMessage: room.messages[0] || null,
      };
    })
  );

  return c.json({
    data: enrichedRooms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

const channelMessagesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

adminRouter.get("/channels/:id/messages", zValidator("query", channelMessagesQuerySchema), async (c) => {
  const roomId = c.req.param("id");
  const { page, limit } = c.req.valid("query");
  const offset = (page - 1) * limit;

  const room = await db.query.chatRooms.findFirst({
    where: eq(chatRooms.id, roomId),
    with: {
      course: {
        columns: {
          id: true,
          title: true,
        },
      },
      participantOneUser: {
        columns: {
          id: true,
          address: true,
          username: true,
        },
      },
      participantTwoUser: {
        columns: {
          id: true,
          address: true,
          username: true,
        },
      },
    },
  });

  if (!room) {
    return c.json({ error: "Channel not found" }, 404);
  }

  const [messageList, countResult] = await Promise.all([
    db.query.messages.findMany({
      where: eq(messages.roomId, roomId),
      with: {
        sender: {
          columns: {
            id: true,
            address: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: desc(messages.createdAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.roomId, roomId)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    room,
    data: messageList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Delete course endpoint (admin)
adminRouter.delete("/courses/:id", async (c) => {
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

  // Soft delete by hiding and marking as deleted
  await db
    .update(courses)
    .set({
      isHidden: true,
      isPublished: false,
      hiddenAt: new Date(),
      hiddenReason: "Deleted by admin",
      updatedAt: new Date(),
    })
    .where(eq(courses.id, courseId));

  await db.insert(notifications).values({
    userId: course.creator.id,
    type: "system",
    title: "Course Removed",
    body: `Your course "${course.title}" has been removed from the platform.`,
    data: { courseId },
  });

  return c.json({ success: true, message: "Course deleted successfully" });
});

export { adminRouter };
