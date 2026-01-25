import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db";
import { users, sessions, referralStats } from "../db/schema";
import { createNonce, verifySiweMessage } from "../lib/siwe";
import { createAccessToken, createRefreshToken } from "../lib/jwt";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const auth = new Hono<{ Variables: AppVariables }>();

const verifySchema = z.object({
  message: z.string(),
  signature: z.string(),
  referralCode: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

auth.get("/nonce", (c) => {
  const nonce = createNonce();
  return c.json({ nonce });
});

auth.post("/verify", zValidator("json", verifySchema), async (c) => {
  const { message, signature, referralCode } = c.req.valid("json");

  const result = await verifySiweMessage(message, signature);
  if (!result) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const { address } = result;
  const normalizedAddress = address.toLowerCase();

  let user = await db.query.users.findFirst({
    where: eq(users.address, normalizedAddress),
  });

  if (!user) {
    let referrerId: string | undefined;

    if (referralCode) {
      const referrer = await db.query.users.findFirst({
        where: eq(users.referralCode, referralCode),
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const newReferralCode = generateReferralCode();

    const [newUser] = await db
      .insert(users)
      .values({
        address: normalizedAddress,
        referralCode: newReferralCode,
        referredBy: referrerId,
      })
      .returning();

    await db.insert(referralStats).values({
      userId: newUser.id,
    });

    user = newUser;
  }

  if (!user) {
    return c.json({ error: "Failed to create user" }, 500);
  }

  const refreshToken = await createRefreshToken();
  const accessToken = await createAccessToken(user.id, user.address);

  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
    expiresAt: refreshExpiresAt,
  });

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      address: user.address,
      username: user.username,
      avatar: user.avatar,
      isCreator: user.isCreator,
      creatorTier: user.creatorTier,
      referralCode: user.referralCode,
    },
  });
});

auth.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.refreshToken, refreshToken), gt(sessions.expiresAt, new Date())),
    with: { user: true },
  });

  if (!session || !session.user) {
    return c.json({ error: "Invalid or expired refresh token" }, 401);
  }

  const sessionUser = session.user as { id: string; address: string };

  await db.delete(sessions).where(eq(sessions.id, session.id));

  const newRefreshToken = await createRefreshToken();
  const accessToken = await createAccessToken(sessionUser.id, sessionUser.address);

  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId: sessionUser.id,
    refreshToken: newRefreshToken,
    expiresAt: refreshExpiresAt,
  });

  return c.json({
    accessToken,
    refreshToken: newRefreshToken,
  });
});

auth.post("/logout", authMiddleware, async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ success: true });
  }

  const user = c.get("user");

  await db.delete(sessions).where(eq(sessions.userId, user.id));

  return c.json({ success: true });
});

auth.get("/me", authMiddleware, async (c) => {
  const authUser = c.get("user");

  const user = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
    with: {
      referralStats: true,
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user.id,
    address: user.address,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    isCreator: user.isCreator,
    creatorTier: user.creatorTier,
    referralCode: user.referralCode,
    referralStats: user.referralStats,
    createdAt: user.createdAt,
  });
});

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export { auth };
