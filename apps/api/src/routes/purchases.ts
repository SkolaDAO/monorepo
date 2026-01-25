import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { purchases, courses, users, notifications, referralStats, creatorStats } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { checkCourseAccess } from "../services/blockchain";
import type { AppVariables } from "../types";

const purchasesRouter = new Hono<{ Variables: AppVariables }>();

const recordPurchaseSchema = z.object({
  courseId: z.string().uuid(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  paidAmount: z.string(),
  paymentToken: z.enum(["ETH", "USDC"]),
  referralCode: z.string().optional(),
});

purchasesRouter.post("/record", authMiddleware, zValidator("json", recordPurchaseSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, data.courseId),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const existingPurchase = await db.query.purchases.findFirst({
    where: and(eq(purchases.userId, user.id), eq(purchases.courseId, data.courseId)),
  });

  if (existingPurchase) {
    return c.json({ error: "Already purchased" }, 400);
  }

  const existingTx = await db.query.purchases.findFirst({
    where: eq(purchases.txHash, data.txHash),
  });

  if (existingTx) {
    return c.json({ error: "Transaction already recorded" }, 400);
  }

  let referrerId: string | undefined;
  let referralEarning: string | undefined;

  if (data.referralCode) {
    const referrer = await db.query.users.findFirst({
      where: eq(users.referralCode, data.referralCode.toUpperCase()),
    });

    if (referrer && referrer.id !== user.id && referrer.id !== course.creatorId) {
      referrerId = referrer.id;
      const priceUsd = parseFloat(course.priceUsd);
      referralEarning = (priceUsd * 0.03).toFixed(8);
    }
  }

  const [purchase] = await db
    .insert(purchases)
    .values({
      userId: user.id,
      courseId: data.courseId,
      txHash: data.txHash,
      paidAmount: data.paidAmount,
      paymentToken: data.paymentToken,
      referrerId,
      referralEarning,
    })
    .returning();

  await db.insert(notifications).values({
    userId: course.creatorId,
    type: "purchase",
    title: "New course sale!",
    body: `Someone purchased "${course.title}"`,
    data: { courseId: course.id, purchaseId: purchase.id },
  });

  if (referrerId && referralEarning) {
    await db
      .update(referralStats)
      .set({
        totalReferrals: sql`${referralStats.totalReferrals} + 1`,
        totalEarningsUsd: sql`${referralStats.totalEarningsUsd} + ${referralEarning}`,
        updatedAt: new Date(),
      })
      .where(eq(referralStats.userId, referrerId));

    await db.insert(notifications).values({
      userId: referrerId,
      type: "referral_earning",
      title: "Referral earning!",
      body: `You earned $${referralEarning} from a referral purchase`,
      data: { courseId: course.id, purchaseId: purchase.id, earning: referralEarning },
    });
  }

  const creatorEarning = parseFloat(data.paidAmount) * 0.92;
  await db
    .insert(creatorStats)
    .values({
      userId: course.creatorId,
      coursesCount: 0,
      studentsCount: 1,
      totalEarningsUsd: String(creatorEarning),
      points: 1 + Math.floor(creatorEarning / 100) * 5,
    })
    .onConflictDoUpdate({
      target: creatorStats.userId,
      set: {
        studentsCount: sql`${creatorStats.studentsCount} + 1`,
        totalEarningsUsd: sql`${creatorStats.totalEarningsUsd} + ${String(creatorEarning)}`,
        points: sql`${creatorStats.points} + 1 + ${Math.floor(creatorEarning / 100) * 5}`,
        updatedAt: new Date(),
      },
    });

  return c.json(purchase, 201);
});

purchasesRouter.get("/verify/:courseId", authMiddleware, async (c) => {
  const courseId = c.req.param("courseId");
  const user = c.get("user");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  if (course.creatorId === user.id) {
    return c.json({ hasAccess: true, isCreator: true });
  }

  const purchase = await db.query.purchases.findFirst({
    where: and(eq(purchases.userId, user.id), eq(purchases.courseId, courseId)),
  });

  if (purchase) {
    return c.json({ hasAccess: true, purchase });
  }

  if (course.onChainId) {
    const onChainAccess = await checkCourseAccess(course.onChainId, user.address);
    if (onChainAccess) {
      return c.json({ hasAccess: true, onChain: true });
    }
  }

  return c.json({ hasAccess: false });
});

export { purchasesRouter };
