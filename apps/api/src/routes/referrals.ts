import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { users, referralStats, purchases } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";

const referralsRouter = new Hono<{ Variables: AppVariables }>();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

referralsRouter.get("/stats", authMiddleware, async (c) => {
  const user = c.get("user");

  const stats = await db.query.referralStats.findFirst({
    where: eq(referralStats.userId, user.id),
  });

  const referredUsers = await db.query.users.findMany({
    where: eq(users.referredBy, user.id),
    columns: {
      id: true,
      address: true,
      username: true,
      avatar: true,
      createdAt: true,
    },
    orderBy: desc(users.createdAt),
    limit: 10,
  });

  return c.json({
    referralCode: (await db.query.users.findFirst({ where: eq(users.id, user.id) }))?.referralCode,
    totalReferrals: stats?.totalReferrals ?? 0,
    totalEarningsUsd: stats?.totalEarningsUsd ?? "0",
    recentReferrals: referredUsers,
  });
});

referralsRouter.get("/earnings", authMiddleware, zValidator("query", querySchema), async (c) => {
  const user = c.get("user");
  const { page, limit } = c.req.valid("query");
  const offset = (page - 1) * limit;

  const [earningsList, countResult] = await Promise.all([
    db.query.purchases.findMany({
      where: eq(purchases.referrerId, user.id),
      with: {
        course: {
          columns: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
        user: {
          columns: {
            id: true,
            address: true,
            username: true,
          },
        },
      },
      orderBy: desc(purchases.purchasedAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(purchases)
      .where(eq(purchases.referrerId, user.id)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    data: earningsList.map((p) => ({
      id: p.id,
      course: p.course,
      buyer: p.user,
      earning: p.referralEarning,
      purchasedAt: p.purchasedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

referralsRouter.get("/code/:code", async (c) => {
  const code = c.req.param("code");

  const user = await db.query.users.findFirst({
    where: eq(users.referralCode, code.toUpperCase()),
    columns: {
      id: true,
      username: true,
      avatar: true,
    },
  });

  if (!user) {
    return c.json({ error: "Invalid referral code" }, 404);
  }

  return c.json({ valid: true, referrer: user });
});

referralsRouter.post("/regenerate", authMiddleware, async (c) => {
  const user = c.get("user");

  const newCode = generateReferralCode();

  await db
    .update(users)
    .set({ referralCode: newCode, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return c.json({ referralCode: newCode });
});

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export { referralsRouter };
