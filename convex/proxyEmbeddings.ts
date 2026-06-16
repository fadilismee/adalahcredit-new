import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * OpenAI-compatible Embeddings Proxy
 *
 * POST /v1/embeddings
 *
 * Auth: Bearer token using AdalahCredit API key (sk-ac-...)
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
   POST /v1/embeddings
   ═══════════════════════════════════════════════════════════════ */

export const embeddings = httpAction(async (ctx, request) => {
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
    encoding_format?: string;
    dimensions?: number;
  };
  try {
    body = await request.json();
  } catch {
    return errorResp("Invalid JSON body", 400);
  }

  const model = body.model ?? "text-embedding-3-small";
  const input = body.input;
  if (!input) return errorResp("Missing 'input' field", 400);

  /* ── Resolve model alias ── */
  const resolvedModel = await ctx.runQuery(internal.proxyInternal.resolveModelAlias, {
    userId: keyInfo.userId,
    model,
  });

  /* ── Find provider ── */
  const providerInfo = await ctx.runQuery(internal.proxyInternal.findProviderForModel, {
    model: resolvedModel,
  });
  if (!providerInfo) {
    return errorResp(`Embedding model '${resolvedModel}' not found. Use GET /v1/models for available models.`, 400);
  }

  /* ── Check credits ── */
  const creditCheck = await ctx.runQuery(internal.proxyInternal.checkCredits, {
    userId: keyInfo.userId,
  });
  if (!creditCheck.hasCredits) return errorResp("Insufficient credits", 402);

  /* ── Check spending limits ── */
  const spendingCheck = await ctx.runQuery(internal.proxyInternal.checkSpendingLimit, {
    userId: keyInfo.userId,
    apiKeyId: keyInfo.keyId,
  });
  if (spendingCheck.blocked) return errorResp("Monthly spending limit reached", 429);

  /* ── Forward to provider ── */
  const providerAuth = await ctx.runQuery(internal.providerAuth.getProviderAuth, {
    provider: providerInfo.provider,
  });
  if (!providerAuth) return errorResp("Provider not configured", 503);

  const realModel = resolvedModel.includes("/")
    ? resolvedModel.split("/").slice(1).join("/")
    : resolvedModel;

  const providerBody: Record<string, unknown> = {
    model: realModel,
    input,
  };
  if (body.encoding_format) providerBody.encoding_format = body.encoding_format;
  if (body.dimensions) providerBody.dimensions = body.dimensions;

  const baseUrl = providerInfo.baseUrl || "https://api.openai.com/v1";

  /* ── Retry with exponential backoff (max 3 attempts) ── */
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
    }

    try {
      const resp = await fetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(providerAuth.headers as Record<string, string>),
        },
        body: JSON.stringify(providerBody),
      });

      if (resp.status >= 500 || resp.status === 429) {
        lastError = `Provider returned ${resp.status}`;
        continue; // retry
      }

      if (!resp.ok) {
        const errBody = await resp.text();
        return errorResp(`Provider error: ${errBody}`, resp.status);
      }

      const result = await resp.json();
      const latencyMs = Date.now() - start;

      // Calculate tokens (estimate from input length if not provided)
      const inputTokens = result.usage?.total_tokens ??
        (typeof input === "string" ? Math.ceil(input.length / 4) : input.reduce((s: number, t: string) => s + Math.ceil(t.length / 4), 0));

      // Calculate cost
      const costCents = (inputTokens / 1_000_000) * providerInfo.inputPricePer1M * 100;

      // Log usage
      await ctx.runMutation(internal.proxyInternal.logUsage, {
        userId: keyInfo.userId,
        apiKeyId: keyInfo.keyId,
        model: resolvedModel,
        provider: providerInfo.provider,
        inputTokens,
        outputTokens: 0,
        latencyMs,
        status: "success",
        cost: Math.ceil(costCents),
      });

      return jsonResp(result);
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : "Network error";
    }
  }

  // All retries failed
  await ctx.runMutation(internal.proxyInternal.logUsage, {
    userId: keyInfo.userId,
    apiKeyId: keyInfo.keyId,
    model: resolvedModel,
    provider: providerInfo.provider,
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: Date.now() - start,
    status: "error",
    cost: 0,
    errorMessage: lastError,
  });

  return errorResp(`All retries failed: ${lastError}`, 502);
});
