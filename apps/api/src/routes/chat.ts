import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, or, desc, gt } from "drizzle-orm";
import { db } from "../db";
import { chatRooms, messages, courses, purchases, users, notifications } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { checkCourseAccess } from "../services/blockchain";
import type { AppVariables } from "../types";

const chatRouter = new Hono<{ Variables: AppVariables }>();

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  before: z.string().datetime().optional(),
});

chatRouter.get("/rooms", authMiddleware, async (c) => {
  const user = c.get("user");

  const rooms = await db.query.chatRooms.findMany({
    where: or(
      eq(chatRooms.participantOne, user.id),
      eq(chatRooms.participantTwo, user.id)
    ),
    with: {
      course: {
        columns: {
          id: true,
          title: true,
          thumbnail: true,
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
        limit: 1,
        orderBy: desc(messages.createdAt),
        columns: {
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: desc(chatRooms.lastMessageAt),
  });

  const purchasedCourses = await db.query.purchases.findMany({
    where: eq(purchases.userId, user.id),
    with: {
      course: true,
    },
  });

  const courseIds = purchasedCourses.map((p) => p.courseId);

  const communityRoomsList = await db.query.chatRooms.findMany({
    where: and(
      eq(chatRooms.type, "community"),
    ),
    with: {
      course: {
        columns: {
          id: true,
          title: true,
          thumbnail: true,
        },
      },
    },
  });

  const communityRooms = communityRoomsList.filter((r) => r.course && courseIds.includes(r.course.id));

  const dmRooms = rooms.filter((r) => r.type === "dm").map((room) => {
    const otherUser = room.participantOne === user.id ? room.participantTwoUser : room.participantOneUser;
    return {
      id: room.id,
      type: room.type,
      otherUser,
      lastMessage: room.messages[0] || null,
      lastMessageAt: room.lastMessageAt,
    };
  });

  return c.json({
    dmRooms,
    communityRooms,
  });
});

chatRouter.get("/rooms/:roomId/messages", authMiddleware, zValidator("query", querySchema), async (c) => {
  const roomId = c.req.param("roomId");
  const user = c.get("user");
  const { page, limit, before } = c.req.valid("query");

  const room = await db.query.chatRooms.findFirst({
    where: eq(chatRooms.id, roomId),
    with: {
      course: true,
    },
  });

  if (!room) {
    return c.json({ error: "Room not found" }, 404);
  }

  const hasAccess = await verifyRoomAccess(room, user.id, user.address);
  if (!hasAccess) {
    return c.json({ error: "Access denied" }, 403);
  }

  const conditions = [eq(messages.roomId, roomId)];
  if (before) {
    conditions.push(gt(messages.createdAt, new Date(before)));
  }

  const messageList = await db.query.messages.findMany({
    where: and(...conditions),
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
    offset: (page - 1) * limit,
  });

  return c.json({
    messages: messageList.reverse(),
    hasMore: messageList.length === limit,
  });
});

chatRouter.post("/rooms/:roomId/messages", authMiddleware, zValidator("json", sendMessageSchema), async (c) => {
  const roomId = c.req.param("roomId");
  const user = c.get("user");
  const { content } = c.req.valid("json");

  const room = await db.query.chatRooms.findFirst({
    where: eq(chatRooms.id, roomId),
    with: {
      course: true,
    },
  });

  if (!room) {
    return c.json({ error: "Room not found" }, 404);
  }

  const hasAccess = await verifyRoomAccess(room, user.id, user.address);
  if (!hasAccess) {
    return c.json({ error: "Access denied" }, 403);
  }

  const [message] = await db
    .insert(messages)
    .values({
      roomId,
      senderId: user.id,
      content,
    })
    .returning();

  await db
    .update(chatRooms)
    .set({ lastMessageAt: new Date() })
    .where(eq(chatRooms.id, roomId));

  if (room.type === "dm") {
    const recipientId = room.participantOne === user.id ? room.participantTwo : room.participantOne;
    if (recipientId) {
      await db.insert(notifications).values({
        userId: recipientId,
        type: "message",
        title: "New message",
        body: content.slice(0, 100),
        data: { roomId, messageId: message.id },
      });
    }
  }

  const sender = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      id: true,
      address: true,
      username: true,
      avatar: true,
    },
  });

  return c.json({
    ...message,
    sender,
  }, 201);
});

chatRouter.post("/dm/:userId", authMiddleware, async (c) => {
  const targetUserId = c.req.param("userId");
  const user = c.get("user");

  if (targetUserId === user.id) {
    return c.json({ error: "Cannot start chat with yourself" }, 400);
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
  });

  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  const existingRoom = await db.query.chatRooms.findFirst({
    where: and(
      eq(chatRooms.type, "dm"),
      or(
        and(eq(chatRooms.participantOne, user.id), eq(chatRooms.participantTwo, targetUserId)),
        and(eq(chatRooms.participantOne, targetUserId), eq(chatRooms.participantTwo, user.id))
      )
    ),
  });

  if (existingRoom) {
    return c.json({ roomId: existingRoom.id });
  }

  const [room] = await db
    .insert(chatRooms)
    .values({
      type: "dm",
      participantOne: user.id,
      participantTwo: targetUserId,
    })
    .returning();

  return c.json({ roomId: room.id }, 201);
});

chatRouter.get("/course/:courseId/community", authMiddleware, async (c) => {
  const courseId = c.req.param("courseId");
  const user = c.get("user");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  let hasAccess = course.creatorId === user.id;
  if (!hasAccess && course.onChainId) {
    hasAccess = await checkCourseAccess(course.onChainId, user.address);
  }
  if (!hasAccess) {
    const purchase = await db.query.purchases.findFirst({
      where: and(eq(purchases.userId, user.id), eq(purchases.courseId, courseId)),
    });
    hasAccess = !!purchase;
  }

  if (!hasAccess) {
    return c.json({ error: "Access denied" }, 403);
  }

  const existingRoom = await db.query.chatRooms.findFirst({
    where: and(eq(chatRooms.courseId, courseId), eq(chatRooms.type, "community")),
  });

  if (existingRoom) {
    return c.json({ roomId: existingRoom.id });
  }

  const [room] = await db
    .insert(chatRooms)
    .values({
      courseId: course.id,
      type: "community",
    })
    .returning();

  return c.json({ roomId: room.id });
});

interface RoomWithCourse {
  type: string;
  participantOne: string | null;
  participantTwo: string | null;
  course: { id: string; creatorId: string; onChainId: number | null } | null;
}

async function verifyRoomAccess(
  room: RoomWithCourse,
  userId: string,
  userAddress: string
): Promise<boolean> {
  if (room.type === "dm") {
    return room.participantOne === userId || room.participantTwo === userId;
  }

  if (room.type === "community" && room.course) {
    if (room.course.creatorId === userId) return true;

    if (room.course.onChainId) {
      return checkCourseAccess(room.course.onChainId, userAddress);
    }

    const purchase = await db.query.purchases.findFirst({
      where: and(eq(purchases.userId, userId), eq(purchases.courseId, room.course.id)),
    });
    return !!purchase;
  }

  return false;
}

export { chatRouter };
