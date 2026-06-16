import { httpAction } from "./_generated/server";

/**
 * POST /api/test-provider
 *
 * Body: { provider: string, apiKey: string, baseUrl?: string }
 * Response: { success: boolean, message: string, latencyMs: number }
 *
 * Makes a lightweight API call to verify the key is valid.
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

const DEFAULT_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
  mistral: "https://api.mistral.ai/v1",
  xai: "https://api.x.ai/v1",
  deepseek: "https://api.deepseek.com/v1",
  cohere: "https://api.cohere.com/v2",
  meta: "https://api.together.xyz/v1",
  freemodel: "https://freemodel.dev/v1",
  groq: "https://api.groq.com/openai/v1",
  fireworks: "https://api.fireworks.ai/inference/v1",
  together: "https://api.together.xyz/v1",
  openrouter: "https://openrouter.ai/api/v1",
  perplexity: "https://api.perplexity.ai",
};

export const testProvider = httpAction(async (_ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  let body: { provider: string; apiKey: string; baseUrl?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResp({ success: false, message: "Invalid JSON", latencyMs: 0 }, 400);
  }

  const { provider, apiKey, baseUrl } = body;
  if (!provider || !apiKey) {
    return jsonResp({ success: false, message: "Missing provider or apiKey", latencyMs: 0 }, 400);
  }

  const base = baseUrl || DEFAULT_URLS[provider] || "";
  const start = Date.now();

  try {
    let testResp: Response;
    let resultInfo = "";

    if (provider === "anthropic") {
      // Anthropic: use a minimal messages request
      testResp = await fetch(`${base}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      const data = await testResp.json();
      if (testResp.ok) {
        resultInfo = `Model: ${data.model || "claude"} • Tokens: ${data.usage?.input_tokens || 0}+${data.usage?.output_tokens || 0}`;
      } else {
        const err = data?.error?.message || JSON.stringify(data);
        const latencyMs = Date.now() - start;
        // Auth error = key is invalid; other errors might mean key is valid but other issue
        if (testResp.status === 401 || testResp.status === 403) {
          return jsonResp({ success: false, message: `Authentication failed: ${err}`, latencyMs });
        }
        // 400/429/500 etc might still mean key is valid
        if (testResp.status === 429) {
          return jsonResp({ success: true, message: `Key valid ✓ (rate limited) — ${err}`, latencyMs });
        }
        return jsonResp({ success: false, message: `Error ${testResp.status}: ${err}`, latencyMs });
      }
    } else if (provider === "google") {
      // Google: list models
      testResp = await fetch(`${base}/models?key=${apiKey}&pageSize=1`);
      const data = await testResp.json();
      if (testResp.ok) {
        const count = data.models?.length || 0;
        resultInfo = `Found ${count} models`;
      } else {
        const err = data?.error?.message || JSON.stringify(data);
        const latencyMs = Date.now() - start;
        return jsonResp({ success: false, message: `Error: ${err}`, latencyMs });
      }
    } else if (provider === "cohere") {
      // Cohere v2: list models
      testResp = await fetch(`${base}/models`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const data = await testResp.json();
      if (testResp.ok) {
        const count = data.models?.length || 0;
        resultInfo = `Found ${count} models`;
      } else {
        const err = data?.message || JSON.stringify(data);
        const latencyMs = Date.now() - start;
        if (testResp.status === 401) {
          return jsonResp({ success: false, message: `Authentication failed: ${err}`, latencyMs });
        }
        return jsonResp({ success: false, message: `Error ${testResp.status}: ${err}`, latencyMs });
      }
    } else {
      // OpenAI-compatible (openai, mistral, xai, deepseek, meta/together)
      testResp = await fetch(`${base}/models`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const data = await testResp.json();
      if (testResp.ok) {
        const count = data.data?.length || 0;
        resultInfo = `Found ${count} models`;
      } else {
        const err = data?.error?.message || JSON.stringify(data);
        const latencyMs = Date.now() - start;
        if (testResp.status === 401 || testResp.status === 403) {
          return jsonResp({ success: false, message: `Authentication failed: ${err}`, latencyMs });
        }
        if (testResp.status === 429) {
          return jsonResp({ success: true, message: `Key valid ✓ (rate limited)`, latencyMs });
        }
        return jsonResp({ success: false, message: `Error ${testResp.status}: ${err}`, latencyMs });
      }
    }

    const latencyMs = Date.now() - start;
    return jsonResp({ success: true, message: `Key valid ✓ — ${resultInfo}`, latencyMs });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return jsonResp({ success: false, message: `Connection failed: ${err.message || "unknown"}`, latencyMs }, 502);
  }
});
