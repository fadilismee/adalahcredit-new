import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/adminGuard";

/* ═══════════════════════════════════════════════════════════════
   STATUS PAGE QUERIES (public — no auth required)
   ═══════════════════════════════════════════════════════════════ */

export const getAllServices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("serviceStatus").collect();
  },
});

export const getRecentIncidents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit ?? 10);
  },
});

export const getActiveIncidents = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("incidents")
      .withIndex("by_status")
      .collect();
    return all.filter((i) => i.status !== "resolved");
  },
});

/* ═══════════════════════════════════════════════════════════════
   STATUS MUTATIONS (admin only)
   ═══════════════════════════════════════════════════════════════ */

export const updateServiceStatus = mutation({
  args: {
    serviceName: v.string(),
    status: v.union(
      v.literal("operational"),
      v.literal("degraded"),
      v.literal("partial_outage"),
      v.literal("major_outage")
    ),
    uptimePercent: v.number(),
  },
  handler: async (ctx, { serviceName, status, uptimePercent }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("serviceStatus")
      .withIndex("by_serviceName", (q) => q.eq("serviceName", serviceName))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { status, uptimePercent, updatedAt: now, lastCheckedAt: now });
    } else {
      await ctx.db.insert("serviceStatus", {
        serviceName,
        status,
        uptimePercent,
        lastCheckedAt: now,
        updatedAt: now,
      });
    }
  },
});

export const createIncident = mutation({
  args: {
    title: v.string(),
    severity: v.union(v.literal("minor"), v.literal("major"), v.literal("critical")),
    affectedServices: v.array(v.string()),
    message: v.string(),
  },
  handler: async (ctx, { title, severity, affectedServices, message }) => {
    await requireAdmin(ctx);
    const now = Date.now();
    return await ctx.db.insert("incidents", {
      title,
      severity,
      status: "investigating",
      affectedServices,
      updates: [{
        message,
        status: "investigating",
        timestamp: now,
      }],
      createdAt: now,
    });
  },
});

export const resolveIncident = mutation({
  args: {
    incidentId: v.id("incidents"),
    message: v.string(),
  },
  handler: async (ctx, { incidentId, message }) => {
    await requireAdmin(ctx);
    const incident = await ctx.db.get(incidentId);
    if (!incident) throw new Error("Incident not found");

    const now = Date.now();
    await ctx.db.patch(incidentId, {
      status: "resolved",
      resolvedAt: now,
      updates: [
        ...incident.updates,
        { message, status: "resolved", timestamp: now },
      ],
    });
  },
});
