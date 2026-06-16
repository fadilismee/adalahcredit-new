import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* ═══════════════════════════════════════════════════════════════
   QUERIES
   ═══════════════════════════════════════════════════════════════ */

export const listMyKeys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("apiKeys")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getKeyStats = query({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, { keyId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = await ctx.db.get(keyId);
    if (!key || key.userId !== userId) throw new Error("Key not found");

    // FIX H8: Use bounded query (last 30 days) instead of unbounded .collect()
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentLogs = await ctx.db
      .query("usageLogs")
      .withIndex("by_apiKeyId", (q) => q.eq("apiKeyId", keyId))
      .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
      .take(10000);

    const last24h = recentLogs.filter((l) => l.createdAt > oneDayAgo);
    const totalRequests = recentLogs.length;
    const totalCost = recentLogs.reduce((sum, l) => sum + l.cost, 0);

    return {
      totalRequests,
      last24hRequests: last24h.length,
      totalCost,
    };
  },
});

/* ═══════════════════════════════════════════════════════════════
   MUTATIONS
   ═══════════════════════════════════════════════════════════════ */

export const createKey = mutation({
  args: {
    name: v.string(),
    rateLimit: v.optional(v.number()),
    monthlyLimit: v.optional(v.number()),
    allowedModels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check key limit based on plan
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const existingKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const activeKeys = existingKeys.filter((k) => k.status === "active");
    const limits: Record<string, number> = { free: 2, starter: 5, pro: 20, enterprise: 100 };
    const plan = profile?.plan ?? "free";
    if (activeKeys.length >= (limits[plan] ?? 2)) {
      throw new Error(`Key limit reached for ${plan} plan. Upgrade to create more keys.`);
    }

    // FIX C15: Use crypto.getRandomValues instead of Math.random() for secure key generation
    const randomBytes = crypto.getRandomValues(new Uint8Array(36));
    const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    const randomPart = Array.from(randomBytes, (b) =>
      charset.charAt(b % charset.length)
    ).join("").substring(0, 48);
    const fullKey = `sk-ac-${randomPart}`;
    const keyPrefix = `sk-ac-...${randomPart.slice(-6)}`;

    // SHA-256 hash (Web Crypto API)
    const encoder = new TextEncoder();
    const data = encoder.encode(fullKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const keyId = await ctx.db.insert("apiKeys", {
      userId,
      name: args.name,
      keyPrefix,
      keyHash,
      status: "active",
      rateLimit: args.rateLimit ?? 60,
      monthlyLimit: args.monthlyLimit,
      allowedModels: args.allowedModels,
      createdAt: Date.now(),
    });

    return { keyId, fullKey }; // Return full key ONCE — user must save it
  },
});

export const revokeKey = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, { keyId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = await ctx.db.get(keyId);
    if (!key || key.userId !== userId) throw new Error("Key not found");

    await ctx.db.patch(keyId, { status: "revoked" });
    return { success: true };
  },
});

export const updateKeyName = mutation({
  args: {
    keyId: v.id("apiKeys"),
    name: v.string(),
  },
  handler: async (ctx, { keyId, name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = await ctx.db.get(keyId);
    if (!key || key.userId !== userId) throw new Error("Key not found");

    await ctx.db.patch(keyId, { name });
    return { success: true };
  },
});

export const deleteKey = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, { keyId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = await ctx.db.get(keyId);
    if (!key || key.userId !== userId) throw new Error("Key not found");

    await ctx.db.delete(keyId);
    return { success: true };
  },
});
