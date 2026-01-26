import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const usersRouter = new Hono<{ Variables: AppVariables }>();

const socialsSchema = z.object({
  twitter: z.string().max(100).optional().nullable(),
  github: z.string().max(100).optional().nullable(),
  website: z.string().url().max(200).optional().nullable(),
  linkedin: z.string().max(100).optional().nullable(),
  youtube: z.string().max(100).optional().nullable(),
  discord: z.string().max(100).optional().nullable(),
}).optional();

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  socials: socialsSchema,
});

// Get current user profile
usersRouter.get("/me", authMiddleware, async (c) => {
  const authUser = c.get("user");

  const user = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
    columns: {
      id: true,
      address: true,
      username: true,
      avatar: true,
      bio: true,
      socials: true,
      isCreator: true,
      isVerified: true,
      isAdmin: true,
      creatorTier: true,
      referralCode: true,
      createdAt: true,
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

// Get user by ID
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
      socials: true,
      isCreator: true,
      isVerified: true,
      creatorTier: true,
      createdAt: true,
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

// Get user by address
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
      socials: true,
      isCreator: true,
      isVerified: true,
      creatorTier: true,
      createdAt: true,
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

// Update current user profile
usersRouter.patch("/me", authMiddleware, zValidator("json", updateProfileSchema), async (c) => {
  const authUser = c.get("user");
  const data = c.req.valid("json");

  // Check username uniqueness
  if (data.username) {
    const existing = await db.query.users.findFirst({
      where: eq(users.username, data.username),
    });

    if (existing && existing.id !== authUser.id) {
      return c.json({ error: "Username already taken" }, 400);
    }
  }

  // Clean up socials - remove empty strings and convert to null
  const cleanSocials = data.socials
    ? Object.fromEntries(
        Object.entries(data.socials).map(([k, v]) => [k, v?.trim() || null])
      )
    : undefined;

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.username !== undefined) updateData.username = data.username || null;
  if (data.avatar !== undefined) updateData.avatar = data.avatar || null;
  if (data.bio !== undefined) updateData.bio = data.bio || null;
  if (cleanSocials !== undefined) updateData.socials = cleanSocials;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, authUser.id))
    .returning();

  return c.json({
    id: updated.id,
    address: updated.address,
    username: updated.username,
    avatar: updated.avatar,
    bio: updated.bio,
    socials: updated.socials,
    isCreator: updated.isCreator,
    creatorTier: updated.creatorTier,
  });
});

// Sync creator status from blockchain
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
