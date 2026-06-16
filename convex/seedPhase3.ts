import { mutation } from "./_generated/server";

/** Phase 3: Seed embedding, image, audio, and moderation models */
export const seedPhase3Models = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let added = 0;

    const phase3Providers = [
      /* ═══════════════════════════════════════════════════════
         EMBEDDING MODELS
         ═══════════════════════════════════════════════════════ */
      {
        provider: "openai-embeddings",
        displayName: "OpenAI Embeddings",
        enabled: true,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.openai.com/v1",
        fallbackPriority: 10,
        models: [
          { modelId: "text-embedding-3-small", displayName: "Text Embedding 3 Small", enabled: true, inputPricePer1M: 0.02, outputPricePer1M: 0, maxTokens: 8191, rateLimit: 10000 },
          { modelId: "text-embedding-3-large", displayName: "Text Embedding 3 Large", enabled: true, inputPricePer1M: 0.13, outputPricePer1M: 0, maxTokens: 8191, rateLimit: 10000 },
          { modelId: "text-embedding-ada-002", displayName: "Ada V2 Embedding", enabled: true, inputPricePer1M: 0.10, outputPricePer1M: 0, maxTokens: 8191, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "voyage-embeddings",
        displayName: "Voyage AI Embeddings",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.voyageai.com/v1",
        fallbackPriority: 15,
        models: [
          { modelId: "voyage-3", displayName: "Voyage 3", enabled: true, inputPricePer1M: 0.06, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 5000 },
          { modelId: "voyage-3-lite", displayName: "Voyage 3 Lite", enabled: true, inputPricePer1M: 0.02, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 10000 },
          { modelId: "voyage-code-3", displayName: "Voyage Code 3", enabled: true, inputPricePer1M: 0.06, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 5000 },
          { modelId: "voyage-finance-2", displayName: "Voyage Finance 2", enabled: true, inputPricePer1M: 0.12, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 3000 },
          { modelId: "voyage-law-2", displayName: "Voyage Law 2", enabled: true, inputPricePer1M: 0.12, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 3000 },
          { modelId: "voyage-multilingual-2", displayName: "Voyage Multilingual 2", enabled: true, inputPricePer1M: 0.12, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "cohere-embeddings",
        displayName: "Cohere Embeddings",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.cohere.ai/v1",
        fallbackPriority: 15,
        models: [
          { modelId: "embed-english-v3.0", displayName: "Embed English V3", enabled: true, inputPricePer1M: 0.10, outputPricePer1M: 0, maxTokens: 512, rateLimit: 10000 },
          { modelId: "embed-multilingual-v3.0", displayName: "Embed Multilingual V3", enabled: true, inputPricePer1M: 0.10, outputPricePer1M: 0, maxTokens: 512, rateLimit: 10000 },
          { modelId: "embed-english-light-v3.0", displayName: "Embed English Light V3", enabled: true, inputPricePer1M: 0.01, outputPricePer1M: 0, maxTokens: 512, rateLimit: 20000 },
          { modelId: "embed-multilingual-light-v3.0", displayName: "Embed Multilingual Light V3", enabled: true, inputPricePer1M: 0.01, outputPricePer1M: 0, maxTokens: 512, rateLimit: 20000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "jina-embeddings",
        displayName: "Jina AI Embeddings",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.jina.ai/v1",
        fallbackPriority: 15,
        models: [
          { modelId: "jina-embeddings-v3", displayName: "Jina Embeddings V3", enabled: true, inputPricePer1M: 0.02, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 10000 },
          { modelId: "jina-colbert-v2", displayName: "Jina ColBERT V2", enabled: true, inputPricePer1M: 0.02, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 10000 },
          { modelId: "jina-clip-v2", displayName: "Jina CLIP V2 (Multimodal)", enabled: true, inputPricePer1M: 0.02, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "mixedbread-embeddings",
        displayName: "Mixedbread Embeddings",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.mixedbread.ai/v1",
        fallbackPriority: 20,
        models: [
          { modelId: "mxbai-embed-large-v1", displayName: "mxbai Embed Large V1", enabled: true, inputPricePer1M: 0.01, outputPricePer1M: 0, maxTokens: 512, rateLimit: 10000 },
          { modelId: "mxbai-embed-2d-large-v1", displayName: "mxbai Embed 2D Large V1", enabled: true, inputPricePer1M: 0.01, outputPricePer1M: 0, maxTokens: 512, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },

      /* ═══════════════════════════════════════════════════════
         IMAGE GENERATION MODELS
         ═══════════════════════════════════════════════════════ */
      {
        provider: "openai-images",
        displayName: "OpenAI Images (DALL-E)",
        enabled: true,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.openai.com/v1",
        fallbackPriority: 10,
        models: [
          { modelId: "dall-e-3", displayName: "DALL-E 3", enabled: true, inputPricePer1M: 40000, outputPricePer1M: 0, maxTokens: 4000, rateLimit: 50 },
          { modelId: "dall-e-2", displayName: "DALL-E 2", enabled: true, inputPricePer1M: 20000, outputPricePer1M: 0, maxTokens: 1000, rateLimit: 50 },
          { modelId: "gpt-image-1", displayName: "GPT Image 1", enabled: true, inputPricePer1M: 10000, outputPricePer1M: 40000, maxTokens: 32000, rateLimit: 100 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "stability-images",
        displayName: "Stability AI",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.stability.ai/v1",
        fallbackPriority: 15,
        models: [
          { modelId: "stable-diffusion-xl-1024-v1-0", displayName: "SDXL 1.0", enabled: true, inputPricePer1M: 2000, outputPricePer1M: 0, maxTokens: 77, rateLimit: 150 },
          { modelId: "stable-diffusion-3-medium", displayName: "SD 3 Medium", enabled: true, inputPricePer1M: 3500, outputPricePer1M: 0, maxTokens: 77, rateLimit: 100 },
          { modelId: "stable-diffusion-3-large", displayName: "SD 3 Large", enabled: true, inputPricePer1M: 6500, outputPricePer1M: 0, maxTokens: 77, rateLimit: 50 },
          { modelId: "stable-image-ultra", displayName: "Stable Image Ultra", enabled: true, inputPricePer1M: 8000, outputPricePer1M: 0, maxTokens: 77, rateLimit: 50 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "flux-images",
        displayName: "Black Forest Labs (Flux)",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.bfl.ml/v1",
        fallbackPriority: 15,
        models: [
          { modelId: "flux-1-pro", displayName: "Flux 1 Pro", enabled: true, inputPricePer1M: 55000, outputPricePer1M: 0, maxTokens: 512, rateLimit: 50 },
          { modelId: "flux-1-dev", displayName: "Flux 1 Dev", enabled: true, inputPricePer1M: 25000, outputPricePer1M: 0, maxTokens: 512, rateLimit: 100 },
          { modelId: "flux-1-schnell", displayName: "Flux 1 Schnell", enabled: true, inputPricePer1M: 3000, outputPricePer1M: 0, maxTokens: 512, rateLimit: 200 },
          { modelId: "flux-1.1-pro", displayName: "Flux 1.1 Pro", enabled: true, inputPricePer1M: 40000, outputPricePer1M: 0, maxTokens: 512, rateLimit: 50 },
          { modelId: "flux-1.1-pro-ultra", displayName: "Flux 1.1 Pro Ultra", enabled: true, inputPricePer1M: 60000, outputPricePer1M: 0, maxTokens: 512, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "ideogram-images",
        displayName: "Ideogram",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.ideogram.ai",
        fallbackPriority: 20,
        models: [
          { modelId: "ideogram-v2", displayName: "Ideogram V2", enabled: true, inputPricePer1M: 80000, outputPricePer1M: 0, maxTokens: 512, rateLimit: 30 },
          { modelId: "ideogram-v2-turbo", displayName: "Ideogram V2 Turbo", enabled: true, inputPricePer1M: 50000, outputPricePer1M: 0, maxTokens: 512, rateLimit: 50 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "leonardo-images",
        displayName: "Leonardo AI",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://cloud.leonardo.ai/api/rest/v1",
        fallbackPriority: 20,
        models: [
          { modelId: "leonardo-phoenix", displayName: "Leonardo Phoenix", enabled: true, inputPricePer1M: 10000, outputPricePer1M: 0, maxTokens: 1024, rateLimit: 50 },
          { modelId: "leonardo-kino-xl", displayName: "Leonardo Kino XL", enabled: true, inputPricePer1M: 12000, outputPricePer1M: 0, maxTokens: 1024, rateLimit: 50 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "replicate-images",
        displayName: "Replicate",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.replicate.com/v1",
        fallbackPriority: 20,
        models: [
          { modelId: "replicate/sdxl", displayName: "SDXL (Replicate)", enabled: true, inputPricePer1M: 2500, outputPricePer1M: 0, maxTokens: 77, rateLimit: 100 },
          { modelId: "replicate/flux-schnell", displayName: "Flux Schnell (Replicate)", enabled: true, inputPricePer1M: 3000, outputPricePer1M: 0, maxTokens: 512, rateLimit: 100 },
          { modelId: "replicate/playground-v2.5", displayName: "Playground V2.5 (Replicate)", enabled: true, inputPricePer1M: 2000, outputPricePer1M: 0, maxTokens: 77, rateLimit: 100 },
        ],
        createdAt: now, updatedAt: now,
      },

      /* ═══════════════════════════════════════════════════════
         AUDIO / SPEECH MODELS
         ═══════════════════════════════════════════════════════ */
      {
        provider: "openai-audio",
        displayName: "OpenAI Audio",
        enabled: true,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.openai.com/v1",
        fallbackPriority: 10,
        models: [
          { modelId: "whisper-1", displayName: "Whisper V3 (STT)", enabled: true, inputPricePer1M: 6000, outputPricePer1M: 0, maxTokens: 25000000, rateLimit: 500 },
          { modelId: "tts-1", displayName: "TTS 1", enabled: true, inputPricePer1M: 15000, outputPricePer1M: 0, maxTokens: 4096, rateLimit: 500 },
          { modelId: "tts-1-hd", displayName: "TTS 1 HD", enabled: true, inputPricePer1M: 30000, outputPricePer1M: 0, maxTokens: 4096, rateLimit: 200 },
          { modelId: "gpt-4o-audio-preview", displayName: "GPT-4o Audio Preview", enabled: true, inputPricePer1M: 2500, outputPricePer1M: 10000, maxTokens: 128000, rateLimit: 500 },
          { modelId: "gpt-4o-mini-audio-preview", displayName: "GPT-4o Mini Audio Preview", enabled: true, inputPricePer1M: 150, outputPricePer1M: 600, maxTokens: 128000, rateLimit: 1000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "elevenlabs-audio",
        displayName: "ElevenLabs",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.elevenlabs.io/v1",
        fallbackPriority: 15,
        models: [
          { modelId: "eleven_multilingual_v2", displayName: "ElevenLabs Multilingual V2", enabled: true, inputPricePer1M: 18000, outputPricePer1M: 0, maxTokens: 5000, rateLimit: 100 },
          { modelId: "eleven_turbo_v2_5", displayName: "ElevenLabs Turbo V2.5", enabled: true, inputPricePer1M: 9000, outputPricePer1M: 0, maxTokens: 5000, rateLimit: 200 },
          { modelId: "eleven_flash_v2_5", displayName: "ElevenLabs Flash V2.5", enabled: true, inputPricePer1M: 4500, outputPricePer1M: 0, maxTokens: 5000, rateLimit: 300 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "deepgram-audio",
        displayName: "Deepgram",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.deepgram.com/v1",
        fallbackPriority: 15,
        models: [
          { modelId: "deepgram-nova-2", displayName: "Deepgram Nova 2 (STT)", enabled: true, inputPricePer1M: 3600, outputPricePer1M: 0, maxTokens: 0, rateLimit: 500 },
          { modelId: "deepgram-nova-2-medical", displayName: "Deepgram Nova 2 Medical", enabled: true, inputPricePer1M: 7500, outputPricePer1M: 0, maxTokens: 0, rateLimit: 200 },
          { modelId: "deepgram-aura", displayName: "Deepgram Aura (TTS)", enabled: true, inputPricePer1M: 15000, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 200 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "assemblyai-audio",
        displayName: "AssemblyAI",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.assemblyai.com/v2",
        fallbackPriority: 20,
        models: [
          { modelId: "assemblyai-best", displayName: "AssemblyAI Best (STT)", enabled: true, inputPricePer1M: 6500, outputPricePer1M: 0, maxTokens: 0, rateLimit: 200 },
          { modelId: "assemblyai-nano", displayName: "AssemblyAI Nano (STT)", enabled: true, inputPricePer1M: 3200, outputPricePer1M: 0, maxTokens: 0, rateLimit: 500 },
        ],
        createdAt: now, updatedAt: now,
      },

      /* ═══════════════════════════════════════════════════════
         MODERATION MODELS
         ═══════════════════════════════════════════════════════ */
      {
        provider: "openai-moderation",
        displayName: "OpenAI Moderation",
        enabled: true,
        authType: "api_key" as const,
        tier: "free" as const,
        baseUrl: "https://api.openai.com/v1",
        fallbackPriority: 10,
        models: [
          { modelId: "omni-moderation-latest", displayName: "Omni Moderation", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 10000 },
          { modelId: "text-moderation-latest", displayName: "Text Moderation", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 10000 },
          { modelId: "text-moderation-stable", displayName: "Text Moderation Stable", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },

      /* ═══════════════════════════════════════════════════════
         RERANKING MODELS
         ═══════════════════════════════════════════════════════ */
      {
        provider: "cohere-rerank",
        displayName: "Cohere Rerank",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.cohere.ai/v1",
        fallbackPriority: 15,
        models: [
          { modelId: "rerank-english-v3.0", displayName: "Rerank English V3", enabled: true, inputPricePer1M: 2000, outputPricePer1M: 0, maxTokens: 4096, rateLimit: 3000 },
          { modelId: "rerank-multilingual-v3.0", displayName: "Rerank Multilingual V3", enabled: true, inputPricePer1M: 2000, outputPricePer1M: 0, maxTokens: 4096, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "voyage-rerank",
        displayName: "Voyage Rerank",
        enabled: false,
        authType: "api_key" as const,
        tier: "api_key" as const,
        baseUrl: "https://api.voyageai.com/v1",
        fallbackPriority: 15,
        models: [
          { modelId: "rerank-2", displayName: "Voyage Rerank 2", enabled: true, inputPricePer1M: 2000, outputPricePer1M: 0, maxTokens: 8000, rateLimit: 3000 },
          { modelId: "rerank-2-lite", displayName: "Voyage Rerank 2 Lite", enabled: true, inputPricePer1M: 500, outputPricePer1M: 0, maxTokens: 4000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
    ];

    // Insert providers that don't already exist
    for (const p of phase3Providers) {
      const existing = await ctx.db
        .query("providerConfigs")
        .withIndex("by_provider", (q) => q.eq("provider", p.provider))
        .first();

      if (!existing) {
        await ctx.db.insert("providerConfigs", {
          provider: p.provider,
          displayName: p.displayName,
          enabled: p.enabled,
          authType: p.authType,
          tier: p.tier,
          baseUrl: p.baseUrl,
          fallbackPriority: p.fallbackPriority,
          models: p.models,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        });
        added++;
      }
    }

    const totalModels = phase3Providers.reduce((s, p) => s + p.models.length, 0);
    return {
      message: `Phase 3: Added ${added} new providers with ${totalModels} models (embeddings, images, audio, moderation, reranking)`,
    };
  },
});
