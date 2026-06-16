import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, isAdmin } from "./lib/adminGuard";

/* ═══════════════════════════════════════════════════════════════
   PRICING QUERIES
   ═══════════════════════════════════════════════════════════════ */

/** Get global pricing config */
export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    return config ?? {
      key: "global",
      markupPercent: 30,
      usdToIdr: 16500,
      minMarkupIdr: 500,
      updatedAt: Date.now(),
    };
  },
});

/** Get subscription plans */
export const getPlans = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query("subscriptionPlans").collect();
    if (plans.length === 0) {
      // Return defaults if not seeded
      return [
        { planId: "starter", name: "Starter", priceIdr: 99000, creditsIdr: 150000, maxKeys: 5, features: ["5 API keys", "Kredit Rp 150.000/bulan", "Email support", "Usage analytics"], popular: false, enabled: true },
        { planId: "pro", name: "Pro", priceIdr: 299000, creditsIdr: 500000, maxKeys: 20, features: ["20 API keys", "Kredit Rp 500.000/bulan", "Priority support", "Advanced analytics", "Team management", "Webhook notifications"], popular: true, enabled: true },
        { planId: "enterprise", name: "Enterprise", priceIdr: 999000, creditsIdr: 2000000, maxKeys: 100, features: ["100 API keys", "Kredit Rp 2.000.000/bulan", "Dedicated support", "Custom SLA", "SSO & RBAC", "Audit logs", "Custom rate limits"], popular: false, enabled: true },
      ];
    }
    return plans.filter((p) => p.enabled);
  },
});

/** Get all model prices with sell prices in IDR */
export const getModelPrices = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();

    const markupPercent = config?.markupPercent ?? 30;
    const usdToIdr = config?.usdToIdr ?? 16500;

    // Check if caller is admin — only admins see cost prices
    const adminId = await isAdmin(ctx);

    const providers = await ctx.db.query("providerConfigs").collect();

    return providers
      .filter((p) => p.enabled)
      .map((p) => ({
        provider: p.provider,
        displayName: p.displayName,
        models: p.models
          .filter((m) => m.enabled)
          .map((m) => {
            const sellInput = m.sellInputPer1M ?? Math.ceil(m.inputPricePer1M * usdToIdr * (1 + markupPercent / 100));
            const sellOutput = m.sellOutputPer1M ?? Math.ceil(m.outputPricePer1M * usdToIdr * (1 + markupPercent / 100));

            return {
              modelId: m.modelId,
              displayName: m.displayName,
              // Only show cost prices to admins
              costInputPer1M: adminId ? m.inputPricePer1M : 0,
              costOutputPer1M: adminId ? m.outputPricePer1M : 0,
              sellInputPer1M: sellInput,
              sellOutputPer1M: sellOutput,
              maxTokens: m.maxTokens,
            };
          }),
      }));
  },
});

/* ═══════════════════════════════════════════════════════════════
   ADMIN MUTATIONS (all require admin role)
   ═══════════════════════════════════════════════════════════════ */

/** Update global pricing config */
export const updateConfig = mutation({
  args: {
    markupPercent: v.number(),
    usdToIdr: v.number(),
    minMarkupIdr: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();

    const data = { key: "global", ...args, updatedAt: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("pricingConfig", data);
    }

    return { success: true };
  },
});

/** Update a single model's sell price */
export const updateModelPrice = mutation({
  args: {
    provider: v.string(),
    modelId: v.string(),
    sellInputPer1M: v.optional(v.number()),
    sellOutputPer1M: v.optional(v.number()),
  },
  handler: async (ctx, { provider, modelId, sellInputPer1M, sellOutputPer1M }) => {
    await requireAdmin(ctx);

    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .unique();

    if (!config) throw new Error("Provider not found");

    const updatedModels = config.models.map((m) =>
      m.modelId === modelId ? { ...m, sellInputPer1M, sellOutputPer1M } : m
    );

    await ctx.db.patch(config._id, { models: updatedModels, updatedAt: Date.now() });
    return { success: true };
  },
});

/** Apply markup percentage to all models (reset custom prices) */
export const applyMarkupToAll = mutation({
  args: { markupPercent: v.number() },
  handler: async (ctx, { markupPercent }) => {
    await requireAdmin(ctx);

    // Update global config
    const existing = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();

    const usdToIdr = existing?.usdToIdr ?? 16500;
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { markupPercent, updatedAt: now });
    } else {
      await ctx.db.insert("pricingConfig", { key: "global", markupPercent, usdToIdr, minMarkupIdr: 500, updatedAt: now });
    }

    // Reset all custom sell prices (so they use the global markup)
    const providers = await ctx.db.query("providerConfigs").collect();
    for (const p of providers) {
      const updatedModels = p.models.map((m) => ({
        ...m,
        sellInputPer1M: undefined,
        sellOutputPer1M: undefined,
      }));
      await ctx.db.patch(p._id, { models: updatedModels, updatedAt: now });
    }

    return { success: true, message: `Applied ${markupPercent}% markup to all models` };
  },
});

/** Upsert subscription plan (legacy — use subscriptionEngine.upsertPlan for full config) */
export const upsertPlan = mutation({
  args: {
    planId: v.string(),
    name: v.string(),
    priceIdr: v.number(),
    creditsCents: v.optional(v.number()),
    maxKeys: v.number(),
    rateLimit: v.optional(v.number()),
    dailyRequestLimit: v.optional(v.number()),
    modelTier: v.optional(v.string()),
    allowedModelTiers: v.optional(v.array(v.string())),
    features: v.array(v.string()),
    popular: v.boolean(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();

    const data = {
      ...args,
      creditsCents: args.creditsCents ?? 500,
      rateLimit: args.rateLimit ?? 30,
      dailyRequestLimit: args.dailyRequestLimit ?? 1000,
      modelTier: args.modelTier ?? "starter",
      allowedModelTiers: args.allowedModelTiers ?? ["free", "starter"],
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("subscriptionPlans", data);
    }

    return { success: true };
  },
});

/* ═══════════════════════════════════════════════════════════════
   SEED
   ═══════════════════════════════════════════════════════════════ */

export const seedPricing = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Seed global pricing config
    const existingConfig = await ctx.db.query("pricingConfig").first();
    if (!existingConfig) {
      await ctx.db.insert("pricingConfig", {
        key: "global",
        markupPercent: 30,
        usdToIdr: 16500,
        minMarkupIdr: 500,
        updatedAt: now,
      });
    }

    // Seed subscription plans
    const existingPlans = await ctx.db.query("subscriptionPlans").first();
    if (!existingPlans) {
      const plans = [
        {
          planId: "starter",
          name: "Starter",
          priceIdr: 50000,
          creditsCents: 500,
          maxKeys: 5,
          rateLimit: 30,
          dailyRequestLimit: 1000,
          modelTier: "starter",
          allowedModelTiers: ["free", "starter"],
          features: ["Model Free + Mid-tier", "5 API keys", "$5 credit/bulan", "30 req/menit", "Email support"],
          popular: false,
          enabled: true,
          updatedAt: now,
        },
        {
          planId: "pro",
          name: "Pro",
          priceIdr: 150000,
          creditsCents: 2000,
          maxKeys: 20,
          rateLimit: 60,
          dailyRequestLimit: 5000,
          modelTier: "pro",
          allowedModelTiers: ["free", "starter", "pro"],
          features: ["Semua model Starter + Premium", "GPT-4o, Claude Sonnet, Gemini Pro", "20 API keys", "$20 credit/bulan", "60 req/menit", "Priority support"],
          popular: true,
          enabled: true,
          updatedAt: now,
        },
        {
          planId: "enterprise",
          name: "Ultimate",
          priceIdr: 500000,
          creditsCents: 10000,
          maxKeys: 100,
          rateLimit: 120,
          dailyRequestLimit: 0,
          modelTier: "ultimate",
          allowedModelTiers: ["free", "starter", "pro", "ultimate"],
          features: ["Semua model (o3, Claude Opus, Grok-3)", "100 API keys", "$100 credit/bulan", "120 req/menit", "Unlimited request/hari", "Dedicated support", "SLA guarantee"],
          popular: false,
          enabled: true,
          updatedAt: now,
        },
      ];

      for (const plan of plans) {
        await ctx.db.insert("subscriptionPlans", plan);
      }
    }

    return { message: "Pricing config and plans seeded" };
  },
});
