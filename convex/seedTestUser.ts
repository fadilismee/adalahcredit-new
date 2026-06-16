import { createAccount, retrieveAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/* ═══════════════════════════════════════════════════════════════
   TEST ACCOUNTS — easy to remember
   ═══════════════════════════════════════════════════════════════ */

const TEST_USER = {
  email: "user@test.local",
  password: "test123",
  name: "Test User",
  role: "user" as const,
};

const TEST_ADMIN = {
  email: "admin@test.local",
  password: "admin123",
  name: "Admin",
  role: "admin" as const,
};

/* ═══════════════════════════════════════════════════════════════
   Internal mutation: create or update profile with role
   ═══════════════════════════════════════════════════════════════ */

export const _ensureTestProfile = internalMutation({
  args: {
    email: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, { email, displayName, role }) => {
    // Find the user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    if (!user) return;

    // Check existing profile
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      // Update role if needed
      if (existing.role !== role) {
        await ctx.db.patch(existing._id, { role });
      }
      return;
    }

    // Create profile
    const myRefCode =
      "CR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = Date.now();

    await ctx.db.insert("profiles", {
      userId: user._id,
      displayName,
      plan: role === "admin" ? "enterprise" : "free",
      role,
      onboardingCompleted: true,
      referralCode: myRefCode,
      createdAt: now,
    });

    // Create subscription
    await ctx.db.insert("subscriptions", {
      userId: user._id,
      plan: role === "admin" ? "enterprise" : "free",
      status: "active",
      monthlyCredits: role === "admin" ? 999999 : 500,
      usedCredits: 0,
      currentPeriodStart: now,
      currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      createdAt: now,
    });
  },
});

/* ═══════════════════════════════════════════════════════════════
   Seed a single test account
   ═══════════════════════════════════════════════════════════════ */

async function seedOne(
  ctx: any,
  account: { email: string; password: string; name: string; role: "user" | "admin" }
): Promise<string> {
  // Check if already exists
  try {
    await retrieveAccount(ctx, {
      provider: "test",
      account: { id: account.email },
    });
    // Already exists — just ensure profile role is correct
    await ctx.runMutation(internal.seedTestUser._ensureTestProfile, {
      email: account.email,
      displayName: account.name,
      role: account.role,
    });
    return `${account.email}: already exists (profile ensured)`;
  } catch {
    // Doesn't exist, create
  }

  try {
    // Pass plain password — createAccount will hash it via the provider's crypto config
    await createAccount(ctx, {
      provider: "test",
      account: {
        id: account.email,
        secret: account.password,
      },
      profile: {
        email: account.email,
        name: account.name,
        emailVerificationTime: Date.now(),
      },
      shouldLinkViaEmail: false,
    });

    // Create profile with correct role
    await ctx.runMutation(internal.seedTestUser._ensureTestProfile, {
      email: account.email,
      displayName: account.name,
      role: account.role,
    });

    return `${account.email}: created successfully`;
  } catch (error) {
    return `${account.email}: FAILED — ${error}`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Main seed action
   ═══════════════════════════════════════════════════════════════ */

export const seedTestUser = internalAction({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const results: string[] = [];

    results.push(await seedOne(ctx, TEST_USER));
    results.push(await seedOne(ctx, TEST_ADMIN));

    const allOk = results.every((r) => !r.includes("FAILED"));
    return {
      success: allOk,
      message: results.join("\n"),
    };
  },
});

/* ═══════════════════════════════════════════════════════════════
   Reset: delete old test accounts so they can be re-created
   ═══════════════════════════════════════════════════════════════ */

export const _deleteTestAccounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const emails = ["user@test.local", "admin@test.local"];
    for (const email of emails) {
      // Find user
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), email))
        .first();
      if (!user) continue;

      // Delete auth accounts
      const authAccounts = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
      for (const a of authAccounts) {
        await ctx.db.delete(a._id);
      }

      // Delete auth sessions
      const sessions = await ctx.db
        .query("authSessions")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
      for (const s of sessions) {
        // Delete refresh tokens for this session
        const tokens = await ctx.db
          .query("authRefreshTokens")
          .filter((q) => q.eq(q.field("sessionId"), s._id))
          .collect();
        for (const t of tokens) {
          await ctx.db.delete(t._id);
        }
        await ctx.db.delete(s._id);
      }

      // Delete profile
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (profile) await ctx.db.delete(profile._id);

      // Delete subscription
      const sub = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (sub) await ctx.db.delete(sub._id);

      // Delete user
      await ctx.db.delete(user._id);
    }
    return "Test accounts deleted";
  },
});

export const resetAndSeed = internalAction({
  args: {},
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx) => {
    // Step 1: delete old accounts
    await ctx.runMutation(internal.seedTestUser._deleteTestAccounts, {});

    // Step 2: re-create with correct password hashing
    const results: string[] = [];
    results.push(await seedOne(ctx, TEST_USER));
    results.push(await seedOne(ctx, TEST_ADMIN));

    const allOk = results.every((r) => !r.includes("FAILED"));
    return {
      success: allOk,
      message: "Reset + " + results.join("\n"),
    };
  },
});
