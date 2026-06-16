/**
 * OAuth HTTP Actions — Convex HTTP action handlers for provider OAuth
 *
 * Handles: authorize, exchange, device-code, poll, import-token
 * Ported from OmniRoute: src/app/api/oauth/[provider]/[action]/route.ts
 *
 * These are httpAction handlers that get registered in http.ts
 */

import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { generatePKCE } from "./oauthPkce";
import {
  getProvider,
  getProviderNames,
  type MappedTokens,
} from "./oauthProviders";
import { IMPORT_TOKEN_PROVIDERS, DEVICE_CODE_PROVIDERS } from "./oauthConstants";

// ══════════════════════════════════════════════════════════════
// CORS HELPERS
// ══════════════════════════════════════════════════════════════

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function corsJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function corsOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ══════════════════════════════════════════════════════════════
// HELPER: Parse provider + action from URL path
// ══════════════════════════════════════════════════════════════

function parseRoute(request: Request): { provider: string; action: string } | null {
  const url = new URL(request.url);
  // Expected paths:
  //   /api/provider-oauth-v2/authorize?provider=claude
  //   /api/provider-oauth-v2/exchange?provider=claude
  //   /api/provider-oauth-v2/device-code?provider=github
  //   /api/provider-oauth-v2/poll?provider=github
  //   /api/provider-oauth-v2/import-token?provider=cursor
  //   /api/provider-oauth-v2/list-providers
  const pathParts = url.pathname.split("/").filter(Boolean);
  // ['api', 'provider-oauth-v2', 'authorize']
  const action = pathParts[pathParts.length - 1] || "";
  const provider = url.searchParams.get("provider") || "";
  return { provider, action };
}

// ══════════════════════════════════════════════════════════════
// GET HANDLER — authorize, device-code, list-providers
// ══════════════════════════════════════════════════════════════

export const oauthGetHandler = httpAction(async (_ctx, request) => {
  if (request.method === "OPTIONS") return corsOptions();

  try {
    const route = parseRoute(request);
    if (!route) return corsJson({ error: "Invalid route" }, 400);

    const { provider, action } = route;
    const url = new URL(request.url);

    // ── LIST PROVIDERS ──────────────────────────────────────────
    if (action === "list-providers") {
      const providers = getProviderNames();
      const result = providers.map((name) => {
        const p = getProvider(name);
        return {
          name,
          flowType: p.flowType,
          hasImportToken: IMPORT_TOKEN_PROVIDERS.has(name),
          isDeviceCode: DEVICE_CODE_PROVIDERS.has(name),
        };
      });
      return corsJson({ providers: result });
    }

    // Provider required for remaining actions
    if (!provider) {
      return corsJson({ error: "Missing 'provider' query param" }, 400);
    }

    // Validate provider exists
    let providerData;
    try {
      providerData = getProvider(provider);
    } catch {
      return corsJson({ error: `Unknown provider: ${provider}` }, 400);
    }

    // ── AUTHORIZE ───────────────────────────────────────────────
    if (action === "authorize") {
      if (providerData.flowType === "import_token") {
        return corsJson({
          error: `${provider} uses import-token flow, not browser OAuth`,
          flowType: "import_token",
          supported: false,
        }, 400);
      }
      if (providerData.flowType === "device_code") {
        return corsJson({
          error: `${provider} uses device-code flow, not browser OAuth`,
          flowType: "device_code",
          supported: false,
        }, 400);
      }

      const redirectUri = url.searchParams.get("redirect_uri") || "http://localhost:8080/callback";
      const pkce = await generatePKCE();

      let authUrl: string | null = null;
      if (providerData.buildAuthUrl) {
        if (providerData.flowType === "authorization_code_pkce") {
          authUrl = providerData.buildAuthUrl(
            providerData.config,
            redirectUri,
            pkce.state,
            pkce.codeChallenge
          );
        } else {
          authUrl = providerData.buildAuthUrl(providerData.config, redirectUri, pkce.state);
        }
      }

      return corsJson({
        authUrl,
        state: pkce.state,
        codeVerifier: pkce.codeVerifier,
        codeChallenge: pkce.codeChallenge,
        redirectUri,
        flowType: providerData.flowType,
      });
    }

    // ── DEVICE CODE ─────────────────────────────────────────────
    if (action === "device-code") {
      if (providerData.flowType !== "device_code") {
        return corsJson(
          { error: `${provider} does not support device code flow` },
          400
        );
      }

      if (!providerData.requestDeviceCode) {
        return corsJson(
          { error: `${provider} device code not implemented` },
          500
        );
      }

      const pkce = await generatePKCE();

      // Some providers need PKCE code challenge, some don't
      const needsPKCE = provider === "qwen";
      const deviceData = await providerData.requestDeviceCode(
        providerData.config,
        needsPKCE ? pkce.codeChallenge : undefined
      );

      return corsJson({
        ...deviceData,
        codeVerifier: needsPKCE ? pkce.codeVerifier : undefined,
      });
    }

    return corsJson({ error: `Unknown GET action: ${action}` }, 400);
  } catch (error: any) {
    console.error("OAuth GET error:", error);
    return corsJson({ error: error.message || "Internal server error" }, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// POST HANDLER — exchange, poll, import-token
// ══════════════════════════════════════════════════════════════

export const oauthPostHandler = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") return corsOptions();

  try {
    const route = parseRoute(request);
    if (!route) return corsJson({ error: "Invalid route" }, 400);

    const { provider, action } = route;

    if (!provider && action !== "list-providers") {
      return corsJson({ error: "Missing 'provider' query param" }, 400);
    }

    let providerData;
    try {
      providerData = getProvider(provider);
    } catch {
      return corsJson({ error: `Unknown provider: ${provider}` }, 400);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      if (action !== "poll") {
        return corsJson({ error: "Invalid JSON body" }, 400);
      }
    }

    // ── EXCHANGE ─────────────────────────────────────────────────
    if (action === "exchange") {
      const { code, redirectUri, codeVerifier, state } = body;

      if (!code) return corsJson({ error: "Missing 'code'" }, 400);
      if (!redirectUri) return corsJson({ error: "Missing 'redirectUri'" }, 400);

      if (providerData.flowType === "authorization_code_pkce" && !codeVerifier) {
        return corsJson(
          { error: `Code verifier required for ${provider} OAuth` },
          400
        );
      }

      if (!providerData.exchangeToken) {
        return corsJson({ error: `${provider} doesn't support code exchange` }, 400);
      }

      // 1. Exchange code for tokens
      const rawTokens = await providerData.exchangeToken(
        providerData.config,
        code,
        redirectUri,
        codeVerifier,
        state
      );

      // 2. Post-exchange (get user info etc.)
      let extra = null;
      if (providerData.postExchange) {
        extra = await providerData.postExchange(rawTokens);
      }

      // 3. Map tokens
      const tokenData = providerData.mapTokens(rawTokens, extra);

      // 4. Persist connection via Convex mutation
      const connection = await persistConnection(ctx, provider, tokenData);

      return corsJson({
        success: true,
        connection: {
          id: connection.id,
          provider,
          email: tokenData.email,
          displayName: tokenData.displayName || tokenData.name || tokenData.email,
        },
      });
    }

    // ── POLL (Device Code Flow) ──────────────────────────────────
    if (action === "poll") {
      const { deviceCode, codeVerifier, extraData } = body;

      if (!deviceCode) return corsJson({ error: "Missing 'deviceCode'" }, 400);

      if (!providerData.pollToken) {
        return corsJson({ error: `${provider} doesn't support polling` }, 400);
      }

      const result = await providerData.pollToken(
        providerData.config,
        deviceCode,
        codeVerifier,
        extraData
      );

      if (result.ok && result.data.access_token) {
        // Success! Run postExchange and persist
        let extra = null;
        if (providerData.postExchange) {
          extra = await providerData.postExchange(result.data);
        }
        const tokenData = providerData.mapTokens(result.data, extra);
        const connection = await persistConnection(ctx, provider, tokenData);

        return corsJson({
          success: true,
          connection: {
            id: connection.id,
            provider,
            email: tokenData.email,
            displayName: tokenData.displayName || tokenData.name || tokenData.email,
          },
        });
      }

      // Pending or error
      const isPending =
        result.data?.error === "authorization_pending" ||
        result.data?.error === "slow_down";

      return corsJson({
        success: false,
        error: result.data?.error || "unknown",
        errorDescription: result.data?.error_description,
        pending: isPending,
      });
    }

    // ── IMPORT TOKEN ─────────────────────────────────────────────
    if (action === "import-token") {
      const { token } = body;

      if (!token) return corsJson({ error: "Missing 'token'" }, 400);
      if (!IMPORT_TOKEN_PROVIDERS.has(provider)) {
        return corsJson(
          { error: `import-token not supported for ${provider}` },
          400
        );
      }

      // Validate if provider has validator
      if (providerData.validateImportToken) {
        const validation = providerData.validateImportToken(token);
        if (!validation.valid) {
          return corsJson({ error: validation.reason || "Invalid token" }, 400);
        }
      }

      // Map the raw token (no exchange step)
      const tokenData = providerData.mapTokens({ accessToken: token });
      const connection = await persistConnection(ctx, provider, tokenData);

      return corsJson({
        success: true,
        connection: {
          id: connection.id,
          provider,
          email: tokenData.email,
          displayName: tokenData.displayName || tokenData.name || tokenData.email,
        },
      });
    }

    return corsJson({ error: `Unknown POST action: ${action}` }, 400);
  } catch (error: any) {
    console.error("OAuth POST error:", error);
    return corsJson({ error: error.message || "Internal server error" }, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// HELPER — Persist connection via Convex internal mutation
// ══════════════════════════════════════════════════════════════

async function persistConnection(
  ctx: any,
  provider: string,
  tokenData: MappedTokens
): Promise<{ id: string }> {
  // Normalize name
  const name = tokenData.name || tokenData.displayName || tokenData.email || undefined;
  const displayName = tokenData.displayName || tokenData.name || tokenData.email || undefined;

  // Calculate expiry
  const expiresAt = tokenData.expiresIn
    ? new Date(Date.now() + tokenData.expiresIn * 1000).toISOString()
    : undefined;

  // Use upsert to handle existing connections
  const result = await ctx.runMutation(internal.providerConnections.upsert, {
    provider,
    authType: "oauth",
    accessToken: tokenData.accessToken || undefined,
    refreshToken: tokenData.refreshToken || undefined,
    idToken: tokenData.idToken || undefined,
    expiresAt,
    expiresIn: tokenData.expiresIn || undefined,
    scope: tokenData.scope || undefined,
    email: tokenData.email || undefined,
    name,
    displayName,
    apiKey: tokenData.apiKey || undefined,
    projectId: tokenData.projectId || undefined,
    isActive: true,
    testStatus: "active",
    providerSpecificData: tokenData.providerSpecificData || undefined,
  });

  return { id: String(result.id) };
}
