import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/* ═══════════════════════════════════════════════════════════════
   REFERRAL QUERIES
   ═══════════════════════════════════════════════════════════════ */

export const getMyReferrals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerId", (q) => q.eq("referrerId", userId))
      .collect();

    const totalEarned = referrals
      .filter((r) => r.paidOut)
      .reduce((s, r) => s + r.rewardCents, 0);

    const pendingEarnings = referrals
      .filter((r) => !r.paidOut && r.status === "active")
      .reduce((s, r) => s + r.rewardCents, 0);

    const activeCount = referrals.filter((r) => r.status === "active").length;
    const pendingCount = referrals.filter((r) => r.status === "pending").length;

    // Determine reward tier
    const totalReferrals = referrals.length;
    let tier = "Bronze";
    let nextTier = "Silver";
    let progress = totalReferrals;
    let needed = 5;
    if (totalReferrals >= 25) {
      tier = "Platinum";
      nextTier = "Max";
      progress = totalReferrals;
      needed = totalReferrals;
    } else if (totalReferrals >= 15) {
      tier = "Gold";
      nextTier = "Platinum";
      progress = totalReferrals - 15;
      needed = 10;
    } else if (totalReferrals >= 5) {
      tier = "Silver";
      nextTier = "Gold";
      progress = totalReferrals - 5;
      needed = 10;
    }

    return {
      referralCode: profile.referralCode,
      referralLink: `https://adalahcredit.com/signup?ref=${profile.referralCode}`,
      stats: {
        totalReferred: totalReferrals,
        activeCount,
        pendingCount,
        totalEarned: `$${(totalEarned / 100).toFixed(2)}`,
        pendingEarnings: `$${(pendingEarnings / 100).toFixed(2)}`,
      },
      tier: {
        current: tier,
        next: nextTier,
        progress,
        needed,
      },
      // FIX H9: Don't leak userId/referredUserId in referral history
      history: referrals.map((r) => ({
        _id: r._id,
        status: r.status,
        rewardCents: r.rewardCents,
        paidOut: r.paidOut,
        createdAt: r.createdAt,
        date: new Date(r.createdAt).toLocaleDateString(),
        earnedFormatted: `$${(r.rewardCents / 100).toFixed(2)}`,
      })),
    };
  },
});
