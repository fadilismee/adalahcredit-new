import { query } from "./_generated/server";

/**
 * Public query: returns list of model IDs that are actually available
 * (provider has API key, OAuth token, or active connection).
 * Used by frontend Models page to filter the catalog.
 */
export const getAvailableModelIds = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("providerConfigs").collect();

    // Get all active connections
    const allConnections = await ctx.db.query("providerConnections").collect();
    const connectedProviders = new Set<string>();
    for (const c of allConnections) {
      if (c.isActive && !c.needsReconnect) {
        connectedProviders.add(c.provider);
      }
    }

    // Provider alias map
    const PROVIDER_ALIASES: Record<string, string[]> = {
      google: ["gemini-cli", "antigravity", "agy"],
      "gemini-cli": ["google", "antigravity", "agy"],
      antigravity: ["google", "gemini-cli", "agy"],
      agy: ["google", "gemini-cli", "antigravity"],
    };

    const availableModelIds: string[] = [];

    for (const p of all) {
      if (!p.enabled) continue;
      const hasApiKey = !!(p.apiKey || (p.apiKeys && p.apiKeys.length > 0));
      const hasOAuth = !!p.oauthAccessToken;
      const hasCookie = !!(p.sessionCookie || p.sessionToken);
      const hasDirectConn = connectedProviders.has(p.provider);
      const hasAliasConn = (PROVIDER_ALIASES[p.provider] || []).some(
        (alias) => connectedProviders.has(alias)
      );

      if (hasApiKey || hasOAuth || hasCookie || hasDirectConn || hasAliasConn) {
        for (const m of p.models) {
          if (m.enabled) {
            availableModelIds.push(m.modelId);
          }
        }
      }
    }

    return availableModelIds;
  },
});
