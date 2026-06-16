import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Model Aliases — users can map custom names to real models.
 * Example: "my-fast" → "gpt-4o-mini"
 */

/* ═══════════════════════════════════════════════════════════════
   LIST aliases for current user
   ═══════════════════════════════════════════════════════════════ */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return ctx.db
      .query("modelAliases")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

/* ═══════════════════════════════════════════════════════════════
   CREATE alias
   ═══════════════════════════════════════════════════════════════ */

export const create = mutation({
  args: {
    alias: v.string(),
    targetModel: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { alias, targetModel, description }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check for duplicate alias
    const existing = await ctx.db
      .query("modelAliases")
      .withIndex("by_userId_alias", (q) =>
        q.eq("userId", userId).eq("alias", alias)
      )
      .first();
    if (existing) throw new Error(`Alias "${alias}" already exists`);

    return ctx.db.insert("modelAliases", {
      userId,
      alias,
      targetModel,
      description,
      createdAt: Date.now(),
    });
  },
});

/* ═══════════════════════════════════════════════════════════════
   UPDATE alias
   ═══════════════════════════════════════════════════════════════ */

export const update = mutation({
  args: {
    aliasId: v.id("modelAliases"),
    targetModel: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { aliasId, targetModel, description }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const alias = await ctx.db.get(aliasId);
    if (!alias) throw new Error("Alias not found");

    const patch: Record<string, string> = {};
    if (targetModel !== undefined) patch.targetModel = targetModel;
    if (description !== undefined) patch.description = description;

    await ctx.db.patch(aliasId, patch);
  },
});

/* ═══════════════════════════════════════════════════════════════
   DELETE alias
   ═══════════════════════════════════════════════════════════════ */

export const remove = mutation({
  args: { aliasId: v.id("modelAliases") },
  handler: async (ctx, { aliasId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const alias = await ctx.db.get(aliasId);
    if (!alias) throw new Error("Alias not found");

    await ctx.db.delete(aliasId);
  },
});
