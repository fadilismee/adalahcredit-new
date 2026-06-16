import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAdmin } from "./lib/adminGuard";

/* ═══════════════════════════════════════════════════════════════
   PROFILE QUERIES
   ═══════════════════════════════════════════════════════════════ */

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    const user = await ctx.db.get(userId);
    return {
      ...profile,
      email: user?.email ?? "",
    };
  },
});

/** FIX C1: Require admin auth — no unauthenticated profile reads */
export const getProfileByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) return null;

    // Only allow admin or the user themselves to read a profile
    if (callerId !== userId) {
      const callerProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", callerId))
        .unique();
      if (!callerProfile || callerProfile.role !== "admin") return null;
    }

    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

/* ═══════════════════════════════════════════════════════════════
   PROFILE MUTATIONS
   ═══════════════════════════════════════════════════════════════ */

export const createProfile = mutation({
  args: {
    displayName: v.string(),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, { displayName, referralCode }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) return existing._id;

    // FIX C16: Generate unique referral code with collision check
    let myRefCode = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = "CR-" + Array.from(
        crypto.getRandomValues(new Uint8Array(4)),
        (b) => b.toString(36).padStart(2, "0")
      ).join("").substring(0, 6).toUpperCase();
      const dup = await ctx.db
        .query("profiles")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", candidate))
        .unique();
      if (!dup) {
        myRefCode = candidate;
        break;
      }
    }
    if (!myRefCode) {
      // Extreme fallback — timestamp-based
      myRefCode = "CR-" + Date.now().toString(36).slice(-6).toUpperCase();
    }

    // FIX C6: Remove admin@test.local backdoor.
    // Admin role must be assigned explicitly via updateRole mutation or seed script.
    const role = "user";
    const plan = "free";

    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      userId,
      displayName,
      plan,
      role,
      onboardingCompleted: false,
      referralCode: myRefCode,
      referredBy: referralCode,
      createdAt: now,
    });

    // Create subscription
    await ctx.db.insert("subscriptions", {
      userId,
      plan,
      status: "active",
      monthlyCredits: 500,
      usedCredits: 0,
      currentPeriodStart: now,
      currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      createdAt: now,
    });

    // If referred, create referral record
    if (referralCode) {
      const referrer = await ctx.db
        .query("profiles")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
        .unique();
      if (referrer) {
        await ctx.db.insert("referrals", {
          referrerId: referrer.userId,
          referredUserId: userId,
          referredEmail: "",
          status: "pending",
          rewardCents: 500, // $5 reward
          paidOut: false,
          createdAt: now,
        });
      }
    }

    // Send welcome notification
    await ctx.scheduler.runAfter(0, internal.notifications._sendWelcome, { userId });

    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatar: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const updates: Record<string, unknown> = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.onboardingCompleted !== undefined) updates.onboardingCompleted = args.onboardingCompleted;

    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});


/** Admin: update user role */
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, { userId, role }) => {
    await requireAdmin(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { role });
    return { success: true };
  },
});

/** Mark onboarding as complete */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return;

    await ctx.db.patch(profile._id, { onboardingCompleted: true });
  },
});
