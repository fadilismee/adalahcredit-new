import { mutation } from "./_generated/server";
import { resolveModelTier } from "./subscriptionEngine";

/**
 * One-time migration: delete old subscriptionPlans that use the legacy schema
 * (have creditsIdr instead of creditsCents, missing new fields).
 */
export const deleteOldSubscriptionPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query("subscriptionPlans").collect();
    let deleted = 0;
    for (const plan of plans) {
      await ctx.db.delete(plan._id);
      deleted++;
    }
    return { deleted, message: `Deleted ${deleted} old subscription plans` };
  },
});

/**
 * Auto-assign model tiers to all provider configs (no auth needed, run from CLI).
 */
export const autoAssignModelTiers = mutation({
  args: {},
  handler: async (ctx) => {
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

    return { success: true, message: `Updated ${updated} provider configs with model tiers` };
  },
});
