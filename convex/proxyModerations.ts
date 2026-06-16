import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * OpenAI-compatible Moderation Proxy
 *
 * POST /v1/moderations
 *
 * Auth: Bearer token using AdalahCredit API key (sk-ac-...)
 * Note: OpenAI moderations are free, but we still log usage
 */

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

function errorResp(message: string, status = 500) {
  return jsonResp({ error: { message, type: "api_error", code: status } }, status);
}

/* ═══════════════════════════════════════════════════════════════
   POST /v1/moderations
   ═══════════════════════════════════════════════════════════════ */

export const moderations = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const start = Date.now();

  /* ── Auth ── */
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResp("Missing or invalid Authorization header", 401);
  }
  const apiKeyRaw = authHeader.slice(7);

  const keyInfo = await ctx.runQuery(internal.proxyInternal.validateApiKey, { rawKey: apiKeyRaw });
  if (!keyInfo) return errorResp("Invalid API key", 401);
  if (keyInfo.status !== "active") return errorResp("API key is revoked or expired", 403);

  /* ── Parse body ── */
  let body: {
    model?: string;
    input?: string | string[];
  };
  try {
    body = await request.json();
  } catch {
    return errorResp("Invalid JSON body", 400);
  }

  if (!body.input) return errorResp("Missing 'input' field", 400);

  const model = body.model ?? "omni-moderation-latest";

  /* ── Find provider (default: OpenAI) ── */
  const providerInfo = await ctx.runQuery(internal.proxyInternal.findProviderForModel, {
    model,
  });

  // Moderation may not be in provider DB — default to OpenAI
  const provider = providerInfo?.provider ?? "openai";

  const providerAuth = await ctx.runQuery(internal.providerAuth.getProviderAuth, {
    provider,
  });
  if (!providerAuth) return errorResp("Provider not configured", 503);

  const baseUrl = providerInfo?.baseUrl || "https://api.openai.com/v1";

  try {
    const resp = await fetch(`${baseUrl}/moderations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(providerAuth.headers as Record<string, string>),
      },
      body: JSON.stringify({ model, input: body.input }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return errorResp(`Provider error: ${errBody}`, resp.status);
    }

    const result = await resp.json();
    const latencyMs = Date.now() - start;

    // Moderations are free, but log for analytics
    await ctx.runMutation(internal.proxyInternal.logUsage, {
      userId: keyInfo.userId,
      apiKeyId: keyInfo.keyId,
      model,
      provider,
      inputTokens: typeof body.input === "string" ? Math.ceil(body.input.length / 4) : body.input.reduce((s, t) => s + Math.ceil(t.length / 4), 0),
      outputTokens: 0,
      latencyMs,
      status: "success",
      cost: 0, // Free
    });

    return jsonResp(result);
  } catch (e: unknown) {
    return errorResp(e instanceof Error ? e.message : "Network error", 502);
  }
});
