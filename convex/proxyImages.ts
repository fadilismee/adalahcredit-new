import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * OpenAI-compatible Image Generation Proxy
 *
 * POST /v1/images/generations
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

/* ── Per-image cost table (USD) ── */
const IMAGE_COSTS: Record<string, number> = {
  "dall-e-3": 0.04,         // $0.04/image (1024x1024)
  "dall-e-3-hd": 0.08,      // $0.08/image HD
  "dall-e-2": 0.02,
  "stable-diffusion-xl": 0.002,
  "flux-1-pro": 0.05,
  "flux-1-dev": 0.025,
  "flux-1-schnell": 0.003,
  "midjourney": 0.10,
};

/* ═══════════════════════════════════════════════════════════════
   POST /v1/images/generations
   ═══════════════════════════════════════════════════════════════ */

export const imageGenerations = httpAction(async (ctx, request) => {
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
    prompt?: string;
    n?: number;
    size?: string;
    quality?: string;
    response_format?: string;
    style?: string;
  };
  try {
    body = await request.json();
  } catch {
    return errorResp("Invalid JSON body", 400);
  }

  const model = body.model ?? "dall-e-3";
  const prompt = body.prompt;
  if (!prompt) return errorResp("Missing 'prompt' field", 400);

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
    return errorResp(`Image model '${resolvedModel}' not found.`, 400);
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
    prompt,
  };
  if (body.n) providerBody.n = body.n;
  if (body.size) providerBody.size = body.size;
  if (body.quality) providerBody.quality = body.quality;
  if (body.response_format) providerBody.response_format = body.response_format;
  if (body.style) providerBody.style = body.style;

  const baseUrl = providerInfo.baseUrl || "https://api.openai.com/v1";

  /* ── Retry with exponential backoff (max 3 attempts) ── */
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
    }

    try {
      const resp = await fetch(`${baseUrl}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(providerAuth.headers as Record<string, string>),
        },
        body: JSON.stringify(providerBody),
      });

      if (resp.status >= 500 || resp.status === 429) {
        lastError = `Provider returned ${resp.status}`;
        continue;
      }

      if (!resp.ok) {
        const errBody = await resp.text();
        return errorResp(`Provider error: ${errBody}`, resp.status);
      }

      const result = await resp.json();
      const latencyMs = Date.now() - start;

      // Calculate cost per image
      const numImages = body.n ?? 1;
      const isHD = body.quality === "hd";
      const costKey = isHD ? `${realModel}-hd` : realModel;
      const perImageCost = IMAGE_COSTS[costKey] ?? IMAGE_COSTS[realModel] ?? 0.04;
      const costCents = Math.ceil(perImageCost * numImages * 100);

      // Log usage
      await ctx.runMutation(internal.proxyInternal.logUsage, {
        userId: keyInfo.userId,
        apiKeyId: keyInfo.keyId,
        model: resolvedModel,
        provider: providerInfo.provider,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs,
        status: "success",
        cost: costCents,
      });

      return jsonResp(result);
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : "Network error";
    }
  }

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
