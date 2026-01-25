import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const usersRouter = new Hono<{ Variables: AppVariables }>();

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

usersRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: {
      id: true,
      address: true,
      username: true,
      avatar: true,
      bio: true,
      isCreator: true,
      creatorTier: true,
      createdAt: true,
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

usersRouter.get("/address/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const user = await db.query.users.findFirst({
    where: eq(users.address, address),
    columns: {
      id: true,
      address: true,
      username: true,
      avatar: true,
      bio: true,
      isCreator: true,
      creatorTier: true,
      createdAt: true,
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

usersRouter.patch("/me", authMiddleware, zValidator("json", updateProfileSchema), async (c) => {
  const authUser = c.get("user");
  const data = c.req.valid("json");

  if (data.username) {
    const existing = await db.query.users.findFirst({
      where: eq(users.username, data.username),
    });

    if (existing && existing.id !== authUser.id) {
      return c.json({ error: "Username already taken" }, 400);
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, authUser.id))
    .returning();

  return c.json({
    id: updated.id,
    address: updated.address,
    username: updated.username,
    avatar: updated.avatar,
    bio: updated.bio,
    isCreator: updated.isCreator,
    creatorTier: updated.creatorTier,
  });
});

usersRouter.post("/sync-creator", authMiddleware, async (c) => {
  const authUser = c.get("user");

  const { checkIsCreator, getCreatorInfo } = await import("../services/blockchain");

  console.log("[sync-creator] Checking creator status for:", authUser.address);
  const isCreator = await checkIsCreator(authUser.address);
  console.log("[sync-creator] isCreator result:", isCreator);

  if (!isCreator) {
    if (authUser.isCreator) {
      await db
        .update(users)
        .set({
          isCreator: false,
          creatorTier: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, authUser.id));
    }
    return c.json({ isCreator: false, tier: null });
  }

  const info = await getCreatorInfo(authUser.address);

  await db
    .update(users)
    .set({
      isCreator: true,
      creatorTier: "starter",
      creatorRegisteredAt: info ? new Date(Number(info.paidAt) * 1000) : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, authUser.id));

  return c.json({ isCreator: true, tier: "starter" });
});

export { usersRouter };
