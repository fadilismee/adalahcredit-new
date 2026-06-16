import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin, requireAdmin } from "./lib/adminGuard";
import { writeAuditLog } from "./auditLog";

/* ═══════════════════════════════════════════════════════════════
   PAYMENT QUERIES
   ═══════════════════════════════════════════════════════════════ */

/** Get all enabled payment gateways (public — for top-up page) */
export const getActiveGateways = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("paymentGateways").collect();
    return all
      .filter((g) => g.enabled)
      .map((g) => ({
        gateway: g.gateway,
        displayName: g.displayName,
        // Only expose safe fields
        ...(g.gateway === "manual_qris" && {
          qrisImageUrl: g.qrisImageUrl,
          qrisAccountName: g.qrisAccountName,
          qrisInstructions: g.qrisInstructions,
        }),
      }));
  },
});

/** Get user's payment history */
export const getMyOrders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("paymentOrders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 20);
  },
});

/** Admin: get all payment gateway configs */
export const getAllGatewayConfigs = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await isAdmin(ctx);
    if (!adminId) return [];
    return await ctx.db.query("paymentGateways").collect();
  },
});

/** Admin: get all pending orders (for manual QRIS confirmation) */
export const getPendingOrders = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await isAdmin(ctx);
    if (!adminId) return [];

    const pending = await ctx.db
      .query("paymentOrders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const enriched = await Promise.all(
      pending.map(async (order) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", order.userId))
          .unique();
        // FIX H5: userEmail was using displayName — fetch actual email from users table
        const userDoc = await ctx.db.get(order.userId);
        return {
          ...order,
          userName: profile?.displayName ?? "Unknown",
          userEmail: userDoc?.email ?? "",
        };
      })
    );

    return enriched;
  },
});

/* ═══════════════════════════════════════════════════════════════
   PAYMENT MUTATIONS
   ═══════════════════════════════════════════════════════════════ */

// IDR to USD credit conversion (rough: 1 USD ≈ 16,000 IDR)
const IDR_TO_USD_CENTS = 0.00625; // 1 IDR = 0.00625 cents

const TOP_UP_PACKAGES = [
  { amountIDR: 50000, creditCents: 300, label: "Rp 50.000 → $3.00" },
  { amountIDR: 100000, creditCents: 650, label: "Rp 100.000 → $6.50" },
  { amountIDR: 250000, creditCents: 1700, label: "Rp 250.000 → $17.00" },
  { amountIDR: 500000, creditCents: 3500, label: "Rp 500.000 → $35.00" },
  { amountIDR: 1000000, creditCents: 7500, label: "Rp 1.000.000 → $75.00" },
  { amountIDR: 2500000, creditCents: 20000, label: "Rp 2.500.000 → $200.00" },
];

export const getTopUpPackages = query({
  args: {},
  handler: async (_ctx) => TOP_UP_PACKAGES,
});

/** Create a payment order */
export const createOrder = mutation({
  args: {
    gateway: v.union(v.literal("duitku"), v.literal("tripay"), v.literal("manual_qris")),
    amountIDR: v.number(),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, { gateway, amountIDR, paymentMethod }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    // FIX H2: Reject zero or negative amounts
    if (amountIDR <= 0) throw new Error("Amount must be positive");

    // FIX H6: Rate limit — max 5 pending orders per user
    const existingPending = await ctx.db
      .query("paymentOrders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .take(6);
    if (existingPending.length >= 5) {
      throw new Error("Terlalu banyak order pending. Selesaikan atau batalkan order sebelumnya.");
    }

    // Find matching package
    const pkg = TOP_UP_PACKAGES.find((p) => p.amountIDR === amountIDR);
    const creditAmount = pkg
      ? pkg.creditCents
      : Math.round(amountIDR * IDR_TO_USD_CENTS);

    // Check gateway is enabled
    const gwConfig = await ctx.db
      .query("paymentGateways")
      .withIndex("by_gateway", (q) => q.eq("gateway", gateway))
      .unique();

    if (!gwConfig || !gwConfig.enabled) {
      throw new Error(`Payment gateway ${gateway} is not enabled`);
    }

    const orderId = await ctx.db.insert("paymentOrders", {
      userId,
      gateway,
      amount: amountIDR,
      creditAmount,
      status: "pending",
      paymentMethod: paymentMethod ?? gateway,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24h
      createdAt: now,
    });

    // For Duitku/Tripay: in production, call their API here to get payment URL
    // For now, return the order ID for the frontend to handle
    if (gateway === "duitku") {
      // In production: call https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry
      return {
        orderId,
        gateway,
        // Mock payment URL for demo
        paymentUrl: `https://sandbox.duitku.com/topup/topuprequest?ref=${orderId}`,
        message: "Redirecting to Duitku...",
      };
    }

    if (gateway === "tripay") {
      // In production: call https://tripay.co.id/api/transaction/create
      return {
        orderId,
        gateway,
        paymentUrl: `https://tripay.co.id/checkout/${orderId}`,
        message: "Redirecting to Tripay...",
      };
    }

    // Manual QRIS — no redirect, user pays and uploads proof
    return {
      orderId,
      gateway,
      message: "Silakan scan QRIS dan upload bukti pembayaran",
    };
  },
});

/** Upload payment proof (for manual QRIS) */
export const uploadPaymentProof = mutation({
  args: {
    orderId: v.id("paymentOrders"),
    proofImageUrl: v.string(),
  },
  handler: async (ctx, { orderId, proofImageUrl }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(orderId);
    if (!order || order.userId !== userId) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order is not pending");

    await ctx.db.patch(orderId, {
      proofImageUrl,
      status: "paid", // awaiting admin confirmation
    });

    return { success: true, message: "Bukti pembayaran berhasil diupload. Menunggu konfirmasi admin." };
  },
});

/** Admin: confirm manual payment */
export const confirmPayment = mutation({
  args: {
    orderId: v.id("paymentOrders"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { orderId, adminNote }) => {
    const adminUserId = await requireAdmin(ctx);

    const order = await ctx.db.get(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "paid" && order.status !== "pending") {
      throw new Error("Order cannot be confirmed");
    }

    const now = Date.now();

    // Update order status FIRST to prevent double-confirm race
    await ctx.db.patch(orderId, {
      status: "confirmed",
      confirmedBy: adminUserId,
      confirmedAt: now,
      adminNote,
    });

    // Add credits to user's subscription
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", order.userId))
      .first();

    if (sub) {
      await ctx.db.patch(sub._id, {
        monthlyCredits: sub.monthlyCredits + order.creditAmount,
      });
    } else {
      // Create subscription if doesn't exist
      await ctx.db.insert("subscriptions", {
        userId: order.userId,
        plan: "free",
        status: "active",
        monthlyCredits: 500 + order.creditAmount,
        usedCredits: 0,
        currentPeriodStart: now,
        currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
        createdAt: now,
      });
    }

    // Create transaction
    await ctx.db.insert("transactions", {
      userId: order.userId,
      type: "credit",
      amount: order.creditAmount,
      description: `Top-up via ${order.gateway} — Rp ${order.amount.toLocaleString()}`,
      status: "completed",
      createdAt: now,
    });

    // Audit log
    await writeAuditLog(ctx, {
      actorId: adminUserId,
      action: "payment.confirmed",
      resource: "paymentOrders",
      resourceId: orderId,
      details: JSON.stringify({ amount: order.amount, credits: order.creditAmount, gateway: order.gateway }),
    });

    return { success: true };
  },
});

/** Admin: reject payment */
export const rejectPayment = mutation({
  args: {
    orderId: v.id("paymentOrders"),
    adminNote: v.string(),
  },
  handler: async (ctx, { orderId, adminNote }) => {
    const adminUserId = await requireAdmin(ctx);

    const order = await ctx.db.get(orderId);
    if (!order) throw new Error("Order not found");

    await ctx.db.patch(orderId, {
      status: "failed",
      confirmedBy: adminUserId,
      confirmedAt: Date.now(),
      adminNote,
    });

    // Audit log
    await writeAuditLog(ctx, {
      actorId: adminUserId,
      action: "payment.rejected",
      resource: "paymentOrders",
      resourceId: orderId,
      details: JSON.stringify({ reason: adminNote }),
    });

    return { success: true };
  },
});

/* ═══════════════════════════════════════════════════════════════
   ADMIN: GATEWAY CONFIG
   ═══════════════════════════════════════════════════════════════ */

export const upsertGatewayConfig = mutation({
  args: {
    gateway: v.union(v.literal("duitku"), v.literal("tripay"), v.literal("manual_qris")),
    enabled: v.boolean(),
    displayName: v.string(),
    sandbox: v.boolean(),
    // Duitku
    merchantCode: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    callbackUrl: v.optional(v.string()),
    // Tripay
    tripayApiKey: v.optional(v.string()),
    tripayPrivateKey: v.optional(v.string()),
    tripayMerchantCode: v.optional(v.string()),
    // Manual QRIS
    qrisImageUrl: v.optional(v.string()),
    qrisAccountName: v.optional(v.string()),
    qrisInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("paymentGateways")
      .withIndex("by_gateway", (q) => q.eq("gateway", args.gateway))
      .unique();

    const data = { ...args, updatedAt: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("paymentGateways", data);
    }

    return { success: true };
  },
});

/* ═══════════════════════════════════════════════════════════════
   GET ORDER BY ID — for receipt/invoice page
   ═══════════════════════════════════════════════════════════════ */

export const getOrderById = query({
  args: { orderId: v.id("paymentOrders") },
  handler: async (ctx, { orderId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const order = await ctx.db.get(orderId);
    if (!order || order.userId !== userId) return null;
    return order;
  },
});
