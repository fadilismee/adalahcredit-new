/**
 * Provider Connections CRUD — Manages OAuth tokens & API keys
 *
 * Ported from OmniRoute: connectionPersistence.ts + model layer
 * Adapted for Convex (mutations/queries instead of SQLite)
 */

import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ══════════════════════════════════════════════════════════════
// QUERIES
// ══════════════════════════════════════════════════════════════

/** List all connections for a given provider */
export const listByProvider = query({
  args: { provider: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("providerConnections")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .collect();
  },
});

/** List all active connections for a given provider */
export const listActiveByProvider = query({
  args: { provider: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("providerConnections")
      .withIndex("by_provider_isActive", (q) =>
        q.eq("provider", args.provider).eq("isActive", true)
      )
      .collect();
  },
});

/** Get all connections across all providers */
export const listAll = query({
  handler: async (ctx) => {
    return ctx.db.query("providerConnections").collect();
  },
});

/** Get a single connection by ID */
export const getById = query({
  args: { connectionId: v.id("providerConnections") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.connectionId);
  },
});

/** Get connection count per provider (for dashboard stats) */
export const getConnectionStats = query({
  handler: async (ctx) => {
    const connections = await ctx.db.query("providerConnections").collect();
    const stats: Record<string, { total: number; active: number }> = {};
    for (const conn of connections) {
      if (!stats[conn.provider]) {
        stats[conn.provider] = { total: 0, active: 0 };
      }
      stats[conn.provider].total++;
      if (conn.isActive) stats[conn.provider].active++;
    }
    return stats;
  },
});

// ══════════════════════════════════════════════════════════════
// INTERNAL QUERIES (for use by HTTP actions)
// ══════════════════════════════════════════════════════════════

/** Internal: list connections by provider */
export const internalListByProvider = internalQuery({
  args: { provider: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("providerConnections")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .collect();
  },
});

/** Internal: get by ID */
export const internalGetById = internalQuery({
  args: { connectionId: v.id("providerConnections") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.connectionId);
  },
});

// ══════════════════════════════════════════════════════════════
// MUTATIONS
// ══════════════════════════════════════════════════════════════

/** Create a new provider connection (multi-account: no 1-per-provider limit) */
export const create = mutation({
  args: {
    provider: v.string(),
    authType: v.string(),
    label: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
    scope: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    projectId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    testStatus: v.optional(v.string()),
    providerSpecificData: v.optional(v.any()),
    userId: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Auto-generate label from email/displayName if not provided
    const label = args.label || args.displayName || args.email || `${args.provider} (${args.authType})`;
    const id = await ctx.db.insert("providerConnections", {
      ...args,
      label,
      isActive: args.isActive ?? true,
      testStatus: args.testStatus ?? "active",
      priority: args.priority ?? 100,
      backoffLevel: 0,
      needsReconnect: false,
      createdAt: now,
      updatedAt: now,
    });
    return { id, ...args };
  },
});

/** Update an existing connection */
export const update = mutation({
  args: {
    connectionId: v.id("providerConnections"),
    label: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
    scope: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    projectId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    testStatus: v.optional(v.string()),
    rateLimitedUntil: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    providerSpecificData: v.optional(v.any()),
    priority: v.optional(v.number()),
    needsReconnect: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { connectionId, ...updates } = args;
    const existing = await ctx.db.get(connectionId);
    if (!existing) throw new Error(`Connection ${connectionId} not found`);
    await ctx.db.patch(connectionId, { ...updates, updatedAt: Date.now() });
    return { ...existing, ...updates };
  },
});

/** Toggle connection active state */
export const toggleActive = mutation({
  args: {
    connectionId: v.id("providerConnections"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
  },
});

/** Delete a connection */
export const remove = mutation({
  args: { connectionId: v.id("providerConnections") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.connectionId);
  },
});

/** Mark connection as rate limited (cooldown period) */
export const setRateLimited = mutation({
  args: {
    connectionId: v.id("providerConnections"),
    rateLimitedUntil: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      rateLimitedUntil: args.rateLimitedUntil,
      updatedAt: Date.now(),
    });
  },
});

/** Update last used timestamp */
export const markUsed = mutation({
  args: { connectionId: v.id("providerConnections") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      lastUsedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ══════════════════════════════════════════════════════════════
// INTERNAL MUTATIONS (for use by HTTP actions)
// ══════════════════════════════════════════════════════════════

/** Internal: create connection (from HTTP action) */
export const internalCreate = internalMutation({
  args: {
    provider: v.string(),
    authType: v.string(),
    label: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
    scope: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    projectId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    testStatus: v.optional(v.string()),
    providerSpecificData: v.optional(v.any()),
    userId: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const label = args.label || args.displayName || args.email || `${args.provider} (${args.authType})`;
    const id = await ctx.db.insert("providerConnections", {
      ...args,
      label,
      isActive: args.isActive ?? true,
      testStatus: args.testStatus ?? "active",
      priority: args.priority ?? 100,
      backoffLevel: 0,
      needsReconnect: false,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

/** Internal: update connection (from HTTP action) */
export const internalUpdate = internalMutation({
  args: {
    connectionId: v.id("providerConnections"),
    label: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
    scope: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    projectId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    testStatus: v.optional(v.string()),
    rateLimitedUntil: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    providerSpecificData: v.optional(v.any()),
    priority: v.optional(v.number()),
    needsReconnect: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { connectionId, ...updates } = args;
    const existing = await ctx.db.get(connectionId);
    if (!existing) throw new Error(`Connection ${connectionId} not found`);
    await ctx.db.patch(connectionId, { ...updates, updatedAt: Date.now() });
    return { id: connectionId };
  },
});

// ══════════════════════════════════════════════════════════════
// UPSERT — The core persistence logic from OmniRoute
// ══════════════════════════════════════════════════════════════

/** Upsert a provider connection — update if same email+provider exists, else create */
export const upsert = internalMutation({
  args: {
    provider: v.string(),
    authType: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
    scope: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    projectId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    testStatus: v.optional(v.string()),
    providerSpecificData: v.optional(v.any()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Normalize display name
    if (!args.name && (args.email || args.displayName)) {
      args.name = args.email || args.displayName;
    }

    // Try to find existing connection by provider + email
    if (args.email) {
      const existing = await ctx.db
        .query("providerConnections")
        .withIndex("by_provider", (q) => q.eq("provider", args.provider))
        .collect();

      const match = existing.find((c) => {
        if (c.email === args.email && c.authType === "oauth") return true;
        return false;
      });

      if (match) {
        await ctx.db.patch(match._id, {
          accessToken: args.accessToken,
          refreshToken: args.refreshToken,
          idToken: args.idToken,
          expiresAt: args.expiresAt,
          expiresIn: args.expiresIn,
          scope: args.scope,
          email: args.email,
          name: args.name,
          displayName: args.displayName,
          apiKey: args.apiKey,
          projectId: args.projectId,
          isActive: true,
          testStatus: "active",
          providerSpecificData: args.providerSpecificData,
          updatedAt: now,
        });
        return { id: match._id, action: "updated" as const };
      }
    }

    // Create new — multi-account: no limit check, always create
    const label = args.email || args.displayName || `${args.provider} (${args.authType})`;
    const id = await ctx.db.insert("providerConnections", {
      ...args,
      label,
      isActive: args.isActive ?? true,
      testStatus: args.testStatus ?? "active",
      priority: 100,
      backoffLevel: 0,
      needsReconnect: false,
      createdAt: now,
      updatedAt: now,
    });
    return { id, action: "created" as const };
  },
});
