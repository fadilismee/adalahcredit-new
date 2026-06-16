import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin, requireAdmin } from "./lib/adminGuard";
import { writeAuditLog } from "./auditLog";


/* ═══════════════════════════════════════════════════════════════
   PLAN DEFAULTS — fallback if DB subscriptionPlans not seeded
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_PLANS: Record<string, {
  name: string;
  priceIdr: number;
  creditsCents: number;
  maxKeys: number;
  rateLimit: number;
  dailyRequestLimit: number;
  modelTier: string;
  allowedModelTiers: string[];
  features: string[];
}> = {
  free: {
    name: "Free",
    priceIdr: 0,
    creditsCents: 100,        // $1.00 monthly
    maxKeys: 2,
    rateLimit: 10,            // 10 RPM
    dailyRequestLimit: 200,
    modelTier: "free",
    allowedModelTiers: ["free"],
    features: [
      "Model open-source (Llama, Gemma, Mixtral)",
      "2 API keys",
      "10 request/menit",
      "200 request/hari",
      "Community support",
    ],
  },
  starter: {
    name: "Starter",
    priceIdr: 50000,
    creditsCents: 500,        // $5.00 monthly
    maxKeys: 5,
    rateLimit: 30,
    dailyRequestLimit: 1000,
    modelTier: "starter",
    allowedModelTiers: ["free", "starter"],
    features: [
      "Semua model Free",
      "Gemini Flash, DeepSeek V3, Command-R+",
      "5 API keys",
      "30 request/menit",
      "1.000 request/hari",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    priceIdr: 150000,
    creditsCents: 2000,       // $20.00 monthly
    maxKeys: 20,
    rateLimit: 60,
    dailyRequestLimit: 5000,
    modelTier: "pro",
    allowedModelTiers: ["free", "starter", "pro"],
    features: [
      "Semua model Starter",
      "GPT-4o, Claude Sonnet, Gemini Pro",
      "20 API keys",
      "60 request/menit",
      "5.000 request/hari",
      "Priority support",
      "Webhook & alias",
    ],
  },
  enterprise: {
    name: "Ultimate",
    priceIdr: 500000,
    creditsCents: 10000,      // $100.00 monthly
    maxKeys: 100,
    rateLimit: 120,
    dailyRequestLimit: 0,     // unlimited
    modelTier: "ultimate",
    allowedModelTiers: ["free", "starter", "pro", "ultimate"],
    features: [
      "Semua model Pro",
      "GPT-o3, Claude Opus, Grok-3",
      "100 API keys",
      "120 request/menit",
      "Unlimited request/hari",
      "Dedicated support",
      "SLA guarantee",
      "Custom model alias",
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════
   MODEL TIER MAPPING — auto-assign tier to models by provider
   ═══════════════════════════════════════════════════════════════ */

// Map provider → default model tier
const PROVIDER_TIER_MAP: Record<string, string> = {
  // Free tier — open-source via free providers
  groq: "free",
  cerebras: "free",
  sambanova: "free",
  "nvidia-nim": "free",
  together: "free",
  fireworks: "free",

  // Starter tier — mid-range / cheap paid
  deepseek: "starter",
  cohere: "starter",
  mistral: "starter",
  "together-paid": "starter",

  // Pro tier — premium
  openai: "pro",
  anthropic: "pro",
  google: "starter",    // Gemini Flash = starter, Pro = pro (override by model)
  xai: "pro",

  // Default
  openrouter: "starter",
};

// Specific model overrides (provider-agnostic, match by model ID pattern)
const MODEL_TIER_OVERRIDES: [RegExp, string][] = [
  // Ultimate tier
  [/^o[34]-/, "ultimate"],
  [/claude.*opus/i, "ultimate"],
  [/grok-3$/i, "ultimate"],
  [/gpt-4\.5/i, "ultimate"],

  // Pro tier
  [/gpt-4o(?!-mini)/i, "pro"],
  [/claude.*sonnet/i, "pro"],
  [/gemini.*2\.5.*pro/i, "pro"],
  [/gemini.*pro/i, "pro"],
  [/grok-2/i, "pro"],
  [/deepseek-r1$/i, "pro"],

  // Starter tier
  [/gpt-4o-mini/i, "starter"],
  [/claude.*haiku/i, "starter"],
  [/gemini.*flash/i, "starter"],
  [/deepseek-v3/i, "starter"],
  [/command-r/i, "starter"],
  [/mistral-large/i, "starter"],
  [/mistral-medium/i, "starter"],

  // Free tier
  [/llama/i, "free"],
  [/gemma/i, "free"],
  [/mixtral/i, "free"],
  [/phi-/i, "free"],
  [/qwen/i, "free"],
];

/** Resolve model tier: explicit > override > provider default > "starter" */
export function resolveModelTier(modelId: string, provider: string, explicitTier?: string): string {
  if (explicitTier) return explicitTier;

  // Check specific model overrides
  for (const [pattern, tier] of MODEL_TIER_OVERRIDES) {
    if (pattern.test(modelId)) return tier;
  }

  // Provider default
  return PROVIDER_TIER_MAP[provider.toLowerCase()] ?? "starter";
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC QUERIES
   ═══════════════════════════════════════════════════════════════ */

/** Get all plan details for pricing page */
export const getPlans = query({
  args: {},
  handler: async (ctx) => {
    const dbPlans = await ctx.db.query("subscriptionPlans").collect();

    if (dbPlans.length > 0) {
      return dbPlans
        .filter((p) => p.enabled)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    // Fallback to defaults
    return Object.entries(DEFAULT_PLANS).map(([planId, p], i) => ({
      _id: planId as any,
      _creationTime: 0,
      planId,
      ...p,
      popular: planId === "pro",
      enabled: true,
      sortOrder: i,
      updatedAt: Date.now(),
    }));
  },
});

/** Get current user's subscription + balance info */
export const getMyPlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const planId = sub?.plan ?? profile?.plan ?? "free";
    const planConfig = DEFAULT_PLANS[planId] ?? DEFAULT_PLANS.free;

    // Get DB plan config if available
    const dbPlan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_planId", (q) => q.eq("planId", planId))
      .unique();

    const monthlyCredits = sub?.monthlyCredits ?? planConfig.creditsCents;
    const usedCredits = sub?.usedCredits ?? 0;
    const balance = sub?.balance ?? 0;
    const remaining = monthlyCredits - usedCredits;
    const daysLeft = sub
      ? Math.max(0, Math.ceil((sub.currentPeriodEnd - Date.now()) / (24 * 60 * 60 * 1000)))
      : 30;

    return {
      plan: planId,
      planName: dbPlan?.name ?? planConfig.name,
      status: sub?.status ?? "active",
      // Credits
      monthlyCredits,
      usedCredits,
      remainingCredits: Math.max(0, remaining),
      balance,       // PAYG balance (USD cents)
      totalAvailable: Math.max(0, remaining) + balance, // total spendable
      // Limits
      maxKeys: dbPlan?.maxKeys ?? planConfig.maxKeys,
      rateLimit: dbPlan?.rateLimit ?? planConfig.rateLimit,
      dailyRequestLimit: dbPlan?.dailyRequestLimit ?? planConfig.dailyRequestLimit,
      // Model access
      modelTier: dbPlan?.modelTier ?? planConfig.modelTier,
      allowedModelTiers: dbPlan?.allowedModelTiers ?? planConfig.allowedModelTiers,
      // Period
      currentPeriodStart: sub?.currentPeriodStart ?? Date.now(),
      currentPeriodEnd: sub?.currentPeriodEnd ?? Date.now() + 30 * 24 * 60 * 60 * 1000,
      daysLeft,
      autoRenew: sub?.autoRenew ?? false,
      // Formatted
      monthlyCreditsFormatted: `$${(monthlyCredits / 100).toFixed(2)}`,
      usedCreditsFormatted: `$${(usedCredits / 100).toFixed(2)}`,
      remainingFormatted: `$${(Math.max(0, remaining) / 100).toFixed(2)}`,
      balanceFormatted: `$${(balance / 100).toFixed(2)}`,
      totalAvailableFormatted: `$${((Math.max(0, remaining) + balance) / 100).toFixed(2)}`,
    };
  },
});

/** Get user's subscription orders history */
export const getMySubscriptionOrders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("subscriptionOrders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 20);
  },
});

/* ═══════════════════════════════════════════════════════════════
   USER MUTATIONS — Subscribe / Upgrade / Top-up
   ═══════════════════════════════════════════════════════════════ */

/** Create a subscription order (plan purchase/upgrade) */
export const createSubscriptionOrder = mutation({
  args: {
    plan: v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, { plan, paymentMethod }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    // Get plan config
    const dbPlan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_planId", (q) => q.eq("planId", plan))
      .unique();
    const planConfig = dbPlan ?? DEFAULT_PLANS[plan];
    if (!planConfig) throw new Error("Plan not found");
    const priceIdr = "priceIdr" in planConfig ? planConfig.priceIdr : 0;

    // Check for existing pending order
    const pendingOrders = await ctx.db
      .query("subscriptionOrders")
      .withIndex("by_userId_status", (q) => q.eq("userId", userId).eq("status", "pending"))
      .collect();

    // Expire old pending orders
    for (const old of pendingOrders) {
      await ctx.db.patch(old._id, { status: "expired" });
    }

    // Determine order type
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const type = !sub || sub.plan === "free" ? "new" as const : "upgrade" as const;

    const orderId = await ctx.db.insert("subscriptionOrders", {
      userId,
      type,
      plan,
      amountIdr: priceIdr,
      status: "pending",
      paymentMethod: paymentMethod ?? "manual_transfer",
      expiresAt: now + 24 * 60 * 60 * 1000,
      createdAt: now,
    });

    return {
      orderId,
      amountIdr: priceIdr,
      plan,
      message: `Order dibuat! Silakan transfer Rp ${priceIdr.toLocaleString("id-ID")} dan upload bukti bayar.`,
    };
  },
});

/** Create PAYG top-up order */
export const createTopUpOrder = mutation({
  args: {
    amountIdr: v.number(),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, { amountIdr, paymentMethod }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    // Get pricing config for conversion rate
    const pricingConfig = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();

    const usdToIdr = pricingConfig?.usdToIdr ?? 16000;
    const creditCents = Math.round((amountIdr / usdToIdr) * 100);

    const orderId = await ctx.db.insert("subscriptionOrders", {
      userId,
      type: "topup",
      amountIdr,
      creditAmountCents: creditCents,
      status: "pending",
      paymentMethod: paymentMethod ?? "manual_transfer",
      expiresAt: now + 24 * 60 * 60 * 1000,
      createdAt: now,
    });

    return {
      orderId,
      amountIdr,
      creditCents,
      creditFormatted: `$${(creditCents / 100).toFixed(2)}`,
      message: `Top-up order dibuat! Transfer Rp ${amountIdr.toLocaleString("id-ID")} → $${(creditCents / 100).toFixed(2)} credit.`,
    };
  },
});

/** Upload proof of payment for subscription order */
export const uploadSubscriptionProof = mutation({
  args: {
    orderId: v.id("subscriptionOrders"),
    proofImageUrl: v.string(),
  },
  handler: async (ctx, { orderId, proofImageUrl }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(orderId);
    if (!order || order.userId !== userId) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order sudah diproses");

    await ctx.db.patch(orderId, {
      proofImageUrl,
      status: "paid",
    });

    return { success: true, message: "Bukti bayar diupload. Menunggu konfirmasi admin." };
  },
});

/* ═══════════════════════════════════════════════════════════════
   ADMIN MUTATIONS — Confirm / Reject subscription orders
   ═══════════════════════════════════════════════════════════════ */

/** Admin: get all pending subscription orders */
export const getPendingSubscriptionOrders = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await isAdmin(ctx);
    if (!adminId) return [];

    const orders = await ctx.db
      .query("subscriptionOrders")
      .withIndex("by_status", (q) => q.eq("status", "paid"))
      .collect();

    // Also get pending (not yet paid) for visibility
    const pendingRaw = await ctx.db
      .query("subscriptionOrders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const allOrders = [...orders, ...pendingRaw];

    return await Promise.all(
      allOrders.map(async (order) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", order.userId))
          .unique();
        return {
          ...order,
          userName: profile?.displayName ?? "Unknown",
          currentPlan: profile?.plan ?? "free",
        };
      })
    );
  },
});

/** Admin: get all subscription orders (history) */
export const getAllSubscriptionOrders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const adminId = await isAdmin(ctx);
    if (!adminId) return [];

    const orders = await ctx.db
      .query("subscriptionOrders")
      .order("desc")
      .take(limit ?? 50);

    return await Promise.all(
      orders.map(async (order) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", order.userId))
          .unique();
        return {
          ...order,
          userName: profile?.displayName ?? "Unknown",
          currentPlan: profile?.plan ?? "free",
        };
      })
    );
  },
});

/** Admin: confirm subscription order → activate plan or add credits */
export const confirmSubscriptionOrder = mutation({
  args: {
    orderId: v.id("subscriptionOrders"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { orderId, adminNote }) => {
    const adminUserId = await requireAdmin(ctx);
    const order = await ctx.db.get(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "paid" && order.status !== "pending") {
      throw new Error("Order cannot be confirmed in current status");
    }

    const now = Date.now();

    // Mark order as confirmed
    await ctx.db.patch(orderId, {
      status: "confirmed",
      confirmedBy: adminUserId,
      confirmedAt: now,
      adminNote,
    });

    if (order.type === "topup") {
      // ── PAYG Top-up: add to balance ──
      const sub = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", order.userId))
        .first();

      const creditCents = order.creditAmountCents ?? 0;

      if (sub) {
        await ctx.db.patch(sub._id, {
          balance: (sub.balance ?? 0) + creditCents,
        });
      } else {
        // Create free sub with balance
        await ctx.db.insert("subscriptions", {
          userId: order.userId,
          plan: "free",
          status: "active",
          monthlyCredits: DEFAULT_PLANS.free.creditsCents,
          usedCredits: 0,
          balance: creditCents,
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
          autoRenew: false,
          createdAt: now,
        });
      }

      // Transaction record
      await ctx.db.insert("transactions", {
        userId: order.userId,
        type: "credit",
        amount: creditCents,
        description: `PAYG Top-up — Rp ${order.amountIdr.toLocaleString()}`,
        status: "completed",
        createdAt: now,
      });
    } else {
      // ── Plan subscription: activate/upgrade plan ──
      const plan = order.plan!;
      const planConfig = DEFAULT_PLANS[plan] ?? DEFAULT_PLANS.starter;
      const dbPlan = await ctx.db
        .query("subscriptionPlans")
        .withIndex("by_planId", (q) => q.eq("planId", plan))
        .unique();
      const creditsCents = dbPlan?.creditsCents ?? planConfig.creditsCents;

      const sub = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", order.userId))
        .first();

      const periodEnd = now + 30 * 24 * 60 * 60 * 1000;

      if (sub) {
        await ctx.db.patch(sub._id, {
          plan,
          status: "active",
          monthlyCredits: creditsCents,
          usedCredits: 0,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          autoRenew: true,
        });
      } else {
        await ctx.db.insert("subscriptions", {
          userId: order.userId,
          plan,
          status: "active",
          monthlyCredits: creditsCents,
          usedCredits: 0,
          balance: 0,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          autoRenew: true,
          createdAt: now,
        });
      }

      // Update profile plan
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", order.userId))
        .unique();
      if (profile) {
        await ctx.db.patch(profile._id, { plan });
      }

      // Transaction
      await ctx.db.insert("transactions", {
        userId: order.userId,
        type: "charge",
        amount: order.amountIdr,
        description: `${order.type === "new" ? "Langganan" : "Upgrade"} ${planConfig.name} — Rp ${order.amountIdr.toLocaleString()}`,
        status: "completed",
        createdAt: now,
      });
    }

    // Notification to user
    await ctx.db.insert("notifications", {
      userId: order.userId,
      type: "payment",
      title: order.type === "topup" ? "Top-up Berhasil!" : "Langganan Aktif!",
      message: order.type === "topup"
        ? `Saldo $${((order.creditAmountCents ?? 0) / 100).toFixed(2)} berhasil ditambahkan.`
        : `Plan ${order.plan?.toUpperCase()} berhasil diaktifkan. Selamat menikmati!`,
      read: false,
      actionUrl: "/dashboard",
      createdAt: now,
    });

    // Audit log
    await writeAuditLog(ctx, {
      actorId: adminUserId,
      action: order.type === "topup" ? "topup.confirmed" : "subscription.confirmed",
      resource: "subscriptionOrders",
      resourceId: orderId,
      details: JSON.stringify({
        plan: order.plan,
        amountIdr: order.amountIdr,
        credits: order.creditAmountCents,
        type: order.type,
      }),
    });

    return { success: true };
  },
});

/** Admin: reject subscription order */
export const rejectSubscriptionOrder = mutation({
  args: {
    orderId: v.id("subscriptionOrders"),
    adminNote: v.string(),
  },
  handler: async (ctx, { orderId, adminNote }) => {
    const adminUserId = await requireAdmin(ctx);
    const order = await ctx.db.get(orderId);
    if (!order) throw new Error("Order not found");

    await ctx.db.patch(orderId, {
      status: "rejected",
      confirmedBy: adminUserId,
      confirmedAt: Date.now(),
      adminNote,
    });

    // Notify user
    await ctx.db.insert("notifications", {
      userId: order.userId,
      type: "payment",
      title: "Pembayaran Ditolak",
      message: `Pembayaran Rp ${order.amountIdr.toLocaleString()} ditolak. Alasan: ${adminNote}`,
      read: false,
      actionUrl: "/dashboard",
      createdAt: Date.now(),
    });

    await writeAuditLog(ctx, {
      actorId: adminUserId,
      action: "subscription.rejected",
      resource: "subscriptionOrders",
      resourceId: orderId,
      details: JSON.stringify({ reason: adminNote }),
    });

    return { success: true };
  },
});

/* ═══════════════════════════════════════════════════════════════
   ADMIN: Manage plan configs in DB
   ═══════════════════════════════════════════════════════════════ */

/** Admin: upsert a subscription plan */
export const upsertPlan = mutation({
  args: {
    planId: v.string(),
    name: v.string(),
    priceIdr: v.number(),
    creditsCents: v.number(),
    maxKeys: v.number(),
    rateLimit: v.number(),
    dailyRequestLimit: v.number(),
    modelTier: v.string(),
    allowedModelTiers: v.array(v.string()),
    features: v.array(v.string()),
    popular: v.boolean(),
    enabled: v.boolean(),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();

    const data = { ...args, updatedAt: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("subscriptionPlans", data);
    }

    return { success: true };
  },
});

/** Admin: seed all default plans into DB */
export const seedPlans = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();

    let i = 0;
    for (const [planId, config] of Object.entries(DEFAULT_PLANS)) {
      const existing = await ctx.db
        .query("subscriptionPlans")
        .withIndex("by_planId", (q) => q.eq("planId", planId))
        .unique();

      if (!existing) {
        await ctx.db.insert("subscriptionPlans", {
          planId,
          ...config,
          popular: planId === "pro",
          enabled: true,
          sortOrder: i,
          updatedAt: now,
        });
      }
      i++;
    }

    return { success: true, message: "Plans seeded" };
  },
});

/** Admin: set model tier for a specific model */
export const setModelTier = mutation({
  args: {
    provider: v.string(),
    modelId: v.string(),
    tier: v.string(),
  },
  handler: async (ctx, { provider, modelId, tier }) => {
    await requireAdmin(ctx);

    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .first();

    if (!config) throw new Error("Provider not found");

    const updatedModels = config.models.map((m) =>
      m.modelId === modelId ? { ...m, tier } : m
    );

    await ctx.db.patch(config._id, { models: updatedModels, updatedAt: Date.now() });
    return { success: true };
  },
});

/** Admin: bulk assign model tiers using auto-resolve logic */
export const autoAssignModelTiers = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const configs = await ctx.db.query("providerConfigs").collect();
    let updated = 0;

    for (const config of configs) {
      let changed = false;
      const updatedModels = config.models.map((m) => {
        const newTier = resolveModelTier(m.modelId, config.provider, m.tier);
        if (m.tier !== newTier) {
          changed = true;
          return { ...m, tier: newTier };
        }
        return m;
      });

      if (changed) {
        await ctx.db.patch(config._id, { models: updatedModels, updatedAt: Date.now() });
        updated++;
      }
    }

    return { success: true, message: `Updated ${updated} provider configs` };
  },
});

/* ═══════════════════════════════════════════════════════════════
   INTERNAL QUERIES — Used by proxy for access control
   ═══════════════════════════════════════════════════════════════ */

/** Check if user's plan allows access to a model, and check credits/balance */
export const checkModelAccess = internalQuery({
  args: {
    userId: v.id("users"),
    modelId: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, { userId, modelId, provider }) => {
    // Get user subscription
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const plan = sub?.plan ?? "free";

    // Get plan config
    const dbPlan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_planId", (q) => q.eq("planId", plan))
      .unique();

    const allowedTiers = dbPlan?.allowedModelTiers ?? DEFAULT_PLANS[plan]?.allowedModelTiers ?? ["free"];
    const planRateLimit = dbPlan?.rateLimit ?? DEFAULT_PLANS[plan]?.rateLimit ?? 10;
    const dailyLimit = dbPlan?.dailyRequestLimit ?? DEFAULT_PLANS[plan]?.dailyRequestLimit ?? 200;

    // Resolve model tier
    const providerConfig = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .first();

    let modelTier = "starter"; // default
    if (providerConfig) {
      const modelConfig = providerConfig.models.find((m) => m.modelId === modelId);
      modelTier = resolveModelTier(modelId, provider, modelConfig?.tier);
    } else {
      modelTier = resolveModelTier(modelId, provider);
    }

    const tierAllowed = allowedTiers.includes(modelTier);

    // Check credits: plan credits first, then PAYG balance
    const monthlyCredits = sub?.monthlyCredits ?? DEFAULT_PLANS[plan]?.creditsCents ?? 0;
    const usedCredits = sub?.usedCredits ?? 0;
    const remainingPlanCredits = monthlyCredits - usedCredits;
    const balance = sub?.balance ?? 0;
    const totalAvailable = Math.max(0, remainingPlanCredits) + balance;
    const hasCredits = totalAvailable > 0;

    // Check subscription period
    const now = Date.now();
    const periodExpired = sub ? now > sub.currentPeriodEnd : false;

    return {
      allowed: tierAllowed && hasCredits && !periodExpired,
      tierAllowed,
      hasCredits,
      periodExpired,
      modelTier,
      userPlan: plan,
      allowedTiers,
      remainingPlanCredits: Math.max(0, remainingPlanCredits),
      balance,
      totalAvailable,
      planRateLimit,
      dailyLimit,
      // Helpful error info
      upgradeNeeded: !tierAllowed,
      topUpNeeded: !hasCredits,
      renewNeeded: periodExpired,
    };
  },
});

/** Deduct cost from user's credits (plan first, then PAYG balance) */
export const deductCredits = internalMutation({
  args: {
    userId: v.id("users"),
    costCents: v.number(),
  },
  handler: async (ctx, { userId, costCents }) => {
    if (costCents <= 0) return;

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!sub) return;

    const remaining = sub.monthlyCredits - sub.usedCredits;

    if (remaining >= costCents) {
      // Deduct entirely from plan credits
      await ctx.db.patch(sub._id, {
        usedCredits: sub.usedCredits + costCents,
      });
    } else {
      // Use remaining plan credits + deduct rest from balance
      const fromBalance = costCents - Math.max(0, remaining);
      await ctx.db.patch(sub._id, {
        usedCredits: sub.monthlyCredits, // maxed out
        balance: Math.max(0, (sub.balance ?? 0) - fromBalance),
      });
    }
  },
});

/** Get model tier info for display (public) */
export const getModelTiers = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("providerConfigs").collect();
    const result: { modelId: string; provider: string; tier: string; displayName: string }[] = [];

    for (const config of configs) {
      if (!config.enabled) continue;
      for (const m of config.models) {
        if (!m.enabled) continue;
        result.push({
          modelId: m.modelId,
          provider: config.provider,
          tier: resolveModelTier(m.modelId, config.provider, m.tier),
          displayName: m.displayName,
        });
      }
    }

    return result;
  },
});
