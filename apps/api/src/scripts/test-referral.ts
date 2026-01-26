/**
 * Test script for referral system
 * Run: cd apps/api && npx tsx src/scripts/test-referral.ts
 */

import { db } from "../db";
import { users, purchases, referralStats, courses } from "../db/schema";
import { eq, sql } from "drizzle-orm";

async function testReferral() {
  console.log("🧪 Testing referral system...\n");

  // 1. Get a referrer (any user with referralCode, prefer Skola)
  let referrer = await db.query.users.findFirst({
    where: eq(users.username, "Skola"),
  });

  if (!referrer) {
    // Fall back to any user
    referrer = await db.query.users.findFirst();
  }

  if (!referrer) {
    console.error("❌ No users found. Create a user first.");
    process.exit(1);
  }

  console.log(`📍 Referrer: ${referrer.username} (${referrer.referralCode})`);

  // 2. Get referrer's current stats
  const statsBefore = await db.query.referralStats.findFirst({
    where: eq(referralStats.userId, referrer.id),
  });

  console.log(`📊 Stats before:`, statsBefore || "No stats row yet");

  // 3. Get a course
  const course = await db.query.courses.findFirst();
  if (!course) {
    console.error("❌ No courses found.");
    process.exit(1);
  }

  // 4. Create a fake buyer
  const [buyer] = await db
    .insert(users)
    .values({
      address: `0xTest${Date.now().toString(16)}`,
      username: `test_buyer_${Date.now()}`,
    })
    .returning();

  console.log(`👤 Created test buyer: ${buyer.username}`);

  // 5. Simulate purchase with referral
  const referralEarning = (parseFloat(course.priceUsd) * 0.03).toFixed(8);
  
  const [purchase] = await db
    .insert(purchases)
    .values({
      userId: buyer.id,
      courseId: course.id,
      txHash: `0x${"0".repeat(62)}${Date.now().toString(16).slice(-2)}`,
      paidAmount: course.priceUsd,
      paymentToken: "USDC",
      referrerId: referrer.id,
      referralEarning,
    })
    .returning();

  console.log(`💳 Created purchase with referral earning: $${referralEarning}`);

  // 6. Update referral stats (same logic as in purchases.ts)
  await db
    .insert(referralStats)
    .values({
      userId: referrer.id,
      totalReferrals: 1,
      totalEarningsUsd: referralEarning,
    })
    .onConflictDoUpdate({
      target: referralStats.userId,
      set: {
        totalReferrals: sql`${referralStats.totalReferrals} + 1`,
        totalEarningsUsd: sql`${referralStats.totalEarningsUsd} + ${referralEarning}`,
        updatedAt: new Date(),
      },
    });

  // 7. Check stats after
  const statsAfter = await db.query.referralStats.findFirst({
    where: eq(referralStats.userId, referrer.id),
  });

  console.log(`📊 Stats after:`, statsAfter);

  // 8. Verify
  const before = statsBefore?.totalReferrals ?? 0;
  const after = statsAfter?.totalReferrals ?? 0;

  if (after > before) {
    console.log(`\n✅ SUCCESS! Referral count increased: ${before} → ${after}`);
  } else {
    console.log(`\n❌ FAILED! Referral count didn't increase: ${before} → ${after}`);
  }

  // 9. Cleanup (optional)
  const cleanup = process.argv.includes("--cleanup");
  if (cleanup) {
    await db.delete(purchases).where(eq(purchases.id, purchase.id));
    await db.delete(users).where(eq(users.id, buyer.id));
    console.log("🧹 Cleaned up test data");
  } else {
    console.log("\n💡 Run with --cleanup to remove test data");
  }

  process.exit(0);
}

testReferral().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
