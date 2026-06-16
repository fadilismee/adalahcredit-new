import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * OpenAI-compatible Audio Transcription Proxy
 *
 * POST /v1/audio/transcriptions
 * POST /v1/audio/speech (text-to-speech)
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

/* ── Cost per minute (USD) ── */
const AUDIO_COSTS: Record<string, number> = {
  "whisper-1": 0.006,       // $0.006/min
  "whisper-large-v3": 0.006,
  "tts-1": 0.015,           // $15/1M chars ≈ $0.015/1K chars
  "tts-1-hd": 0.030,
  "elevenlabs": 0.018,
};

/* ═══════════════════════════════════════════════════════════════
   POST /v1/audio/transcriptions
   ═══════════════════════════════════════════════════════════════ */

export const audioTranscriptions = httpAction(async (ctx, request) => {
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

  /* ── Forward multipart form data directly to provider ── */
  // Audio transcription uses multipart/form-data, pass through as-is
  const formData = await request.formData().catch(() => null);
  if (!formData) return errorResp("Expected multipart/form-data", 400);

  const model = (formData.get("model") as string) ?? "whisper-1";

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
    return errorResp(`Audio model '${resolvedModel}' not found.`, 400);
  }

  const providerAuth = await ctx.runQuery(internal.providerAuth.getProviderAuth, {
    provider: providerInfo.provider,
  });
  if (!providerAuth) return errorResp("Provider not configured", 503);

  const realModel = resolvedModel.includes("/")
    ? resolvedModel.split("/").slice(1).join("/")
    : resolvedModel;

  // Update model in form data
  formData.set("model", realModel);

  const baseUrl = providerInfo.baseUrl || "https://api.openai.com/v1";

  /* ── Retry with exponential backoff ── */
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
    }

    try {
      const resp = await fetch(`${baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          ...(providerAuth.headers as Record<string, string>),
          // Don't set Content-Type — fetch sets it with boundary for FormData
        },
        body: formData,
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

      // Estimate duration from response or use latency as rough proxy
      const durationMinutes = result.duration ? result.duration / 60 : (latencyMs / 1000) / 60;
      const costPerMinute = AUDIO_COSTS[realModel] ?? 0.006;
      const costCents = Math.ceil(durationMinutes * costPerMinute * 100);

      await ctx.runMutation(internal.proxyInternal.logUsage, {
        userId: keyInfo.userId,
        apiKeyId: keyInfo.keyId,
        model: resolvedModel,
        provider: providerInfo.provider,
        inputTokens: 0,
        outputTokens: Math.ceil(durationMinutes * 150), // ~150 words/min estimate
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

/* ═══════════════════════════════════════════════════════════════
   POST /v1/audio/speech (TTS)
   ═══════════════════════════════════════════════════════════════ */

export const audioSpeech = httpAction(async (ctx, request) => {
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
    input?: string;
    voice?: string;
    response_format?: string;
    speed?: number;
  };
  try {
    body = await request.json();
  } catch {
    return errorResp("Invalid JSON body", 400);
  }

  if (!body.input) return errorResp("Missing 'input' field", 400);

  const model = body.model ?? "tts-1";

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
    return errorResp(`TTS model '${resolvedModel}' not found.`, 400);
  }

  /* ── Check credits ── */
  const creditCheck = await ctx.runQuery(internal.proxyInternal.checkCredits, {
    userId: keyInfo.userId,
  });
  if (!creditCheck.hasCredits) return errorResp("Insufficient credits", 402);

  const providerAuth = await ctx.runQuery(internal.providerAuth.getProviderAuth, {
    provider: providerInfo.provider,
  });
  if (!providerAuth) return errorResp("Provider not configured", 503);

  const realModel = resolvedModel.includes("/")
    ? resolvedModel.split("/").slice(1).join("/")
    : resolvedModel;

  const providerBody: Record<string, unknown> = {
    model: realModel,
    input: body.input,
    voice: body.voice ?? "alloy",
  };
  if (body.response_format) providerBody.response_format = body.response_format;
  if (body.speed) providerBody.speed = body.speed;

  const baseUrl = providerInfo.baseUrl || "https://api.openai.com/v1";

  try {
    const resp = await fetch(`${baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(providerAuth.headers as Record<string, string>),
      },
      body: JSON.stringify(providerBody),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return errorResp(`Provider error: ${errBody}`, resp.status);
    }

    const latencyMs = Date.now() - start;

    // Cost based on character count
    const charCount = body.input.length;
    const costPerChar = model.includes("hd") ? 0.00003 : 0.000015;
    const costCents = Math.ceil(charCount * costPerChar * 100);

    await ctx.runMutation(internal.proxyInternal.logUsage, {
      userId: keyInfo.userId,
      apiKeyId: keyInfo.keyId,
      model: resolvedModel,
      provider: providerInfo.provider,
      inputTokens: charCount,
      outputTokens: 0,
      latencyMs,
      status: "success",
      cost: costCents,
    });

    // Return audio binary directly
    const audioData = await resp.arrayBuffer();
    return new Response(audioData, {
      status: 200,
      headers: {
        "Content-Type": resp.headers.get("Content-Type") ?? "audio/mpeg",
        ...CORS_HEADERS,
      },
    });
  } catch (e: unknown) {
    return errorResp(e instanceof Error ? e.message : "Network error", 502);
  }
});
