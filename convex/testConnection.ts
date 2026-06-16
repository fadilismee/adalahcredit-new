/**
 * POST /api/test-connection
 *
 * Tests a saved provider connection by actually calling the provider's API.
 * Adapted from KeiRouter: gateway/admin.go → adminTestAccount + validateAccountCredentials
 *
 * Body: { connectionId: string }
 * Response: { id: string, status: "ok"|"error", message: string, latencyMs: number }
 *
 * Flow:
 *   1. Get connection from DB
 *   2. If OAuth + token expired → refresh first
 *   3. Make a lightweight probe to the provider
 *   4. Return result + update test status in DB
 *   5. On success: clear needsReconnect flag
 */

import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/** Provider base URLs for probing */
const PROBE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
  "gemini-cli": "https://generativelanguage.googleapis.com/v1beta",
  antigravity: "https://generativelanguage.googleapis.com/v1beta",
  agy: "https://generativelanguage.googleapis.com/v1beta",
  mistral: "https://api.mistral.ai/v1",
  xai: "https://api.x.ai/v1",
  deepseek: "https://api.deepseek.com/v1",
  cohere: "https://api.cohere.com/v2",
  meta: "https://api.together.xyz/v1",
  codex: "https://api.openai.com/v1",
  claude: "https://api.anthropic.com/v1",
  github: "https://api.githubcopilot.com",
  qwen: "https://chat.qwen.ai/api",
  "kimi-coding": "https://api.kimi.ai/v1",
};

/**
 * Probe a provider with the given token/key to verify it's valid.
 * Uses the lightest possible request per provider.
 */
async function probeProvider(
  provider: string,
  token: string,
  authType: string
): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  const base = PROBE_URLS[provider] || "";
  if (!base) {
    return { ok: true, message: "No probe endpoint configured (skipped)", latencyMs: 0 };
  }

  const start = Date.now();

  try {
    // Provider-specific probe
    if (provider === "anthropic" || provider === "claude") {
      const resp = await fetch(`${base}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": token,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      const latencyMs = Date.now() - start;
      if (resp.ok) {
        const data = await resp.json();
        return {
          ok: true,
          message: `✓ Model: ${data.model || "claude"} • Input: ${data.usage?.input_tokens || 0} tokens`,
          latencyMs,
        };
      }
      if (resp.status === 429) {
        return { ok: true, message: "✓ Key valid (rate limited)", latencyMs };
      }
      const err = await resp.text().catch(() => "");
      return {
        ok: resp.status !== 401 && resp.status !== 403,
        message: `Error ${resp.status}: ${err.slice(0, 200)}`,
        latencyMs,
      };
    }

    if (
      provider === "google" ||
      provider === "gemini-cli" ||
      provider === "antigravity" ||
      provider === "agy"
    ) {
      // Google: if OAuth, use Bearer token; if API key, use ?key=
      let url: string;
      let headers: Record<string, string> = {};
      if (authType === "oauth") {
        url = `${base}/models?pageSize=1`;
        headers = { Authorization: `Bearer ${token}` };
      } else {
        url = `${base}/models?key=${token}&pageSize=1`;
      }
      const resp = await fetch(url, { headers });
      const latencyMs = Date.now() - start;
      if (resp.ok) {
        const data = await resp.json();
        return {
          ok: true,
          message: `✓ Found ${data.models?.length || 0} models`,
          latencyMs,
        };
      }
      const err = await resp.text().catch(() => "");
      return { ok: false, message: `Error ${resp.status}: ${err.slice(0, 200)}`, latencyMs };
    }

    if (provider === "cohere") {
      const resp = await fetch(`${base}/models`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const latencyMs = Date.now() - start;
      if (resp.ok) {
        const data = await resp.json();
        return { ok: true, message: `✓ Found ${data.models?.length || 0} models`, latencyMs };
      }
      const err = await resp.text().catch(() => "");
      return { ok: false, message: `Error ${resp.status}: ${err.slice(0, 200)}`, latencyMs };
    }

    if (provider === "github") {
      // GitHub Copilot: validate via token exchange
      const resp = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const latencyMs = Date.now() - start;
      if (resp.ok) {
        const data = await resp.json();
        return { ok: true, message: `✓ GitHub user: ${data.login || "unknown"}`, latencyMs };
      }
      return { ok: false, message: `GitHub auth failed (${resp.status})`, latencyMs };
    }

    // Default: OpenAI-compatible /models endpoint
    const resp = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const latencyMs = Date.now() - start;
    if (resp.ok) {
      const data = await resp.json();
      const count = data.data?.length || data.models?.length || 0;
      return { ok: true, message: `✓ Found ${count} models`, latencyMs };
    }
    if (resp.status === 429) {
      return { ok: true, message: "✓ Key valid (rate limited)", latencyMs };
    }
    const err = await resp.text().catch(() => "");
    return {
      ok: resp.status !== 401 && resp.status !== 403,
      message: `Error ${resp.status}: ${err.slice(0, 200)}`,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : "unknown";
    return { ok: false, message: `Connection failed: ${msg}`, latencyMs };
  }
}

export const testConnection = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  let body: { connectionId: string };
  try {
    body = await request.json();
  } catch {
    return jsonResp({ status: "error", message: "Invalid JSON", latencyMs: 0 }, 400);
  }

  if (!body.connectionId) {
    return jsonResp({ status: "error", message: "Missing connectionId", latencyMs: 0 }, 400);
  }

  // Get connection from DB
  const conn = await ctx.runQuery(internal.providerConnections.internalGetById, {
    connectionId: body.connectionId as any,
  });

  if (!conn) {
    return jsonResp({ status: "error", message: "Connection not found", latencyMs: 0 }, 404);
  }

  // If OAuth + token expired → refresh first
  let token = conn.accessToken || conn.apiKey || "";
  if (conn.authType === "oauth" && conn.expiresAt) {
    const expiryMs = new Date(conn.expiresAt).getTime();
    if (expiryMs < Date.now() + 60_000 && conn.refreshToken) {
      // Token expired or expiring within 60s — refresh
      const refreshed = await ctx.runMutation(
        internal.proxyConnections.refreshConnectionToken,
        { connectionId: body.connectionId as any }
      );
      if (refreshed) {
        token = refreshed.accessToken;
      }
    }
  }

  if (!token) {
    // Update test result
    await ctx.runMutation(internal.proxyConnections.updateTestResult, {
      connectionId: body.connectionId as any,
      result: "error",
      message: "No credentials available",
    });
    return jsonResp({
      id: body.connectionId,
      provider: conn.provider,
      status: "error",
      message: "No credentials available (token missing or refresh failed)",
      latencyMs: 0,
    });
  }

  // Probe the provider
  const result = await probeProvider(conn.provider, token, conn.authType);

  // Update test result in DB
  await ctx.runMutation(internal.proxyConnections.updateTestResult, {
    connectionId: body.connectionId as any,
    result: result.ok ? "ok" : "error",
    message: result.message,
  });

  return jsonResp({
    id: body.connectionId,
    provider: conn.provider,
    label: conn.label || conn.email || conn.name,
    status: result.ok ? "ok" : "error",
    message: result.message,
    latencyMs: result.latencyMs,
  });
});
