import { mutation } from "./_generated/server";
import { requireAdmin } from "./lib/adminGuard";


/** Phase 2: Seed 200++ providers (won't duplicate existing) */
export const seedPhase2Providers = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    let added = 0;

    const phase2Providers = [
      {
        provider: "azure-openai", displayName: "Azure OpenAI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://{resource}.openai.azure.com/openai/deployments", fallbackPriority: 20,
        models: [
          { modelId: "azure/gpt-4o", displayName: "GPT-4o (Azure)", enabled: true, inputPricePer1M: 2.5, outputPricePer1M: 10.0, maxTokens: 128000, rateLimit: 10000 },
          { modelId: "azure/gpt-4o-mini", displayName: "GPT-4o Mini (Azure)", enabled: true, inputPricePer1M: 0.15, outputPricePer1M: 0.6, maxTokens: 128000, rateLimit: 30000 },
          { modelId: "azure/gpt-4.1", displayName: "GPT-4.1 (Azure)", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 8.0, maxTokens: 1048576, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "vertex-ai", displayName: "Google Vertex AI", enabled: false,
        authType: "service_account" as const, tier: "api_key" as const,
        baseUrl: "https://{region}-aiplatform.googleapis.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "vertex/gemini-2.5-pro", displayName: "Gemini 2.5 Pro (Vertex)", enabled: true, inputPricePer1M: 1.25, outputPricePer1M: 10.0, maxTokens: 1048576, rateLimit: 10000 },
          { modelId: "vertex/gemini-2.5-flash", displayName: "Gemini 2.5 Flash (Vertex)", enabled: true, inputPricePer1M: 0.15, outputPricePer1M: 0.6, maxTokens: 1048576, rateLimit: 30000 },
          { modelId: "vertex/claude-sonnet-4", displayName: "Claude Sonnet 4 (Vertex)", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 15.0, maxTokens: 200000, rateLimit: 8000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "aws-bedrock", displayName: "AWS Bedrock", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://bedrock-runtime.{region}.amazonaws.com", fallbackPriority: 20,
        models: [
          { modelId: "bedrock/claude-sonnet-4", displayName: "Claude Sonnet 4 (Bedrock)", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 15.0, maxTokens: 200000, rateLimit: 8000 },
          { modelId: "bedrock/claude-haiku-3.5", displayName: "Claude 3.5 Haiku (Bedrock)", enabled: true, inputPricePer1M: 0.8, outputPricePer1M: 4.0, maxTokens: 200000, rateLimit: 15000 },
          { modelId: "bedrock/llama-4-maverick", displayName: "Llama 4 Maverick (Bedrock)", enabled: true, inputPricePer1M: 0.2, outputPricePer1M: 0.6, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "bedrock/titan-premier", displayName: "Amazon Titan Premier", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 1.5, maxTokens: 32000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "ai21", displayName: "AI21 Labs", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.ai21.com/studio/v1", fallbackPriority: 20,
        models: [
          { modelId: "ai21/jamba-1.5-large", displayName: "Jamba 1.5 Large", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 8.0, maxTokens: 256000, rateLimit: 5000 },
          { modelId: "ai21/jamba-1.5-mini", displayName: "Jamba 1.5 Mini", enabled: true, inputPricePer1M: 0.2, outputPricePer1M: 0.4, maxTokens: 256000, rateLimit: 15000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "aleph-alpha", displayName: "Aleph Alpha", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.aleph-alpha.com", fallbackPriority: 20,
        models: [
          { modelId: "aleph/luminous-supreme", displayName: "Luminous Supreme", enabled: true, inputPricePer1M: 6.0, outputPricePer1M: 18.0, maxTokens: 32000, rateLimit: 3000 },
          { modelId: "aleph/luminous-extended", displayName: "Luminous Extended", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 32000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "reka", displayName: "Reka AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.reka.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "reka/reka-core", displayName: "Reka Core", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 15.0, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "reka/reka-flash", displayName: "Reka Flash", enabled: true, inputPricePer1M: 0.4, outputPricePer1M: 1.0, maxTokens: 128000, rateLimit: 15000 },
          { modelId: "reka/reka-edge", displayName: "Reka Edge", enabled: true, inputPricePer1M: 0.1, outputPricePer1M: 0.4, maxTokens: 128000, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "writer", displayName: "Writer", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.writer.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "writer/palmyra-x-004", displayName: "Palmyra X 004", enabled: true, inputPricePer1M: 5.0, outputPricePer1M: 15.0, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "writer/palmyra-creative", displayName: "Palmyra Creative", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 10.0, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "inflection", displayName: "Inflection AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.inflection.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "inflection/pi-3.5", displayName: "Pi 3.5", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 8.0, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "perplexity", displayName: "Perplexity", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.perplexity.ai", fallbackPriority: 20,
        models: [
          { modelId: "pplx/sonar-pro", displayName: "Sonar Pro", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 15.0, maxTokens: 200000, rateLimit: 5000 },
          { modelId: "pplx/sonar", displayName: "Sonar", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 1.0, maxTokens: 127000, rateLimit: 15000 },
          { modelId: "pplx/sonar-reasoning-pro", displayName: "Sonar Reasoning Pro", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 8.0, maxTokens: 127000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "baidu", displayName: "Baidu (ERNIE)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1", fallbackPriority: 20,
        models: [
          { modelId: "ernie/ernie-4.5", displayName: "ERNIE 4.5", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "ernie/ernie-4.0-turbo", displayName: "ERNIE 4.0 Turbo", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 3.0, maxTokens: 128000, rateLimit: 10000 },
          { modelId: "ernie/ernie-speed", displayName: "ERNIE Speed", enabled: true, inputPricePer1M: 0.1, outputPricePer1M: 0.3, maxTokens: 128000, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "zhipu", displayName: "Zhipu AI (GLM)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://open.bigmodel.cn/api/paas/v4", fallbackPriority: 20,
        models: [
          { modelId: "glm/glm-4-plus", displayName: "GLM-4 Plus", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "glm/glm-4-flash", displayName: "GLM-4 Flash", enabled: true, inputPricePer1M: 0.1, outputPricePer1M: 0.1, maxTokens: 128000, rateLimit: 30000 },
          { modelId: "glm/glm-4-long", displayName: "GLM-4 Long", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 1.0, maxTokens: 1000000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "moonshot", displayName: "Moonshot AI (Kimi)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.moonshot.cn/v1", fallbackPriority: 20,
        models: [
          { modelId: "kimi/moonshot-v1-128k", displayName: "Moonshot V1 128K", enabled: true, inputPricePer1M: 1.5, outputPricePer1M: 3.0, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "kimi/moonshot-v1-32k", displayName: "Moonshot V1 32K", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 1.0, maxTokens: 32000, rateLimit: 15000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "01ai", displayName: "01.AI (Yi)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.01.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "yi/yi-lightning", displayName: "Yi Lightning", enabled: true, inputPricePer1M: 0.99, outputPricePer1M: 0.99, maxTokens: 16384, rateLimit: 10000 },
          { modelId: "yi/yi-large", displayName: "Yi Large", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 9.0, maxTokens: 32768, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "minimax", displayName: "MiniMax", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.minimax.chat/v1", fallbackPriority: 20,
        models: [
          { modelId: "minimax/abab-6.5s", displayName: "ABAB 6.5s", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 3.0, maxTokens: 245760, rateLimit: 5000 },
          { modelId: "minimax/abab-6.5t", displayName: "ABAB 6.5t Chat", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 1.0, maxTokens: 8192, rateLimit: 15000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "baichuan", displayName: "Baichuan AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.baichuan-ai.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "baichuan/baichuan4", displayName: "Baichuan 4", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "baichuan/baichuan3-turbo", displayName: "Baichuan 3 Turbo", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 1.0, maxTokens: 32000, rateLimit: 15000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "stepfun", displayName: "StepFun (Step)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.stepfun.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "step/step-2-16k", displayName: "Step 2 16K", enabled: true, inputPricePer1M: 1.5, outputPricePer1M: 5.0, maxTokens: 16384, rateLimit: 5000 },
          { modelId: "step/step-1-flash", displayName: "Step 1 Flash", enabled: true, inputPricePer1M: 0.2, outputPricePer1M: 0.5, maxTokens: 8192, rateLimit: 20000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "alibaba", displayName: "Alibaba Cloud (Qwen)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", fallbackPriority: 20,
        models: [
          { modelId: "qwen/qwen-max", displayName: "Qwen Max", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "qwen/qwen-plus", displayName: "Qwen Plus", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 1.5, maxTokens: 131072, rateLimit: 15000 },
          { modelId: "qwen/qwen-turbo", displayName: "Qwen Turbo", enabled: true, inputPricePer1M: 0.1, outputPricePer1M: 0.3, maxTokens: 131072, rateLimit: 30000 },
          { modelId: "qwen/qwen-long", displayName: "Qwen Long", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 2.0, maxTokens: 10000000, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "doubao", displayName: "ByteDance (Doubao)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3", fallbackPriority: 20,
        models: [
          { modelId: "doubao/doubao-pro-128k", displayName: "Doubao Pro 128K", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 3.0, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "doubao/doubao-lite-128k", displayName: "Doubao Lite 128K", enabled: true, inputPricePer1M: 0.1, outputPricePer1M: 0.3, maxTokens: 128000, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "sensetime", displayName: "SenseTime (SenseNova)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.sensenova.cn/v1", fallbackPriority: 20,
        models: [
          { modelId: "sensenova/sensenova-5", displayName: "SenseNova 5", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "iflytek", displayName: "iFlytek (Spark)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://spark-api-open.xf-yun.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "spark/spark-pro", displayName: "Spark Pro", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 3.0, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "spark/spark-lite", displayName: "Spark Lite", enabled: true, inputPricePer1M: 0.1, outputPricePer1M: 0.1, maxTokens: 4096, rateLimit: 20000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "openrouter", displayName: "OpenRouter", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://openrouter.ai/api/v1", fallbackPriority: 20,
        models: [
          { modelId: "or/auto", displayName: "Auto (Best)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 10000 },
          { modelId: "or/openai/gpt-4o", displayName: "GPT-4o (OR)", enabled: true, inputPricePer1M: 2.5, outputPricePer1M: 10.0, maxTokens: 128000, rateLimit: 10000 },
          { modelId: "or/anthropic/claude-sonnet-4", displayName: "Claude Sonnet 4 (OR)", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 15.0, maxTokens: 200000, rateLimit: 8000 },
          { modelId: "or/google/gemini-2.5-flash", displayName: "Gemini 2.5 Flash (OR)", enabled: true, inputPricePer1M: 0.15, outputPricePer1M: 0.6, maxTokens: 1048576, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "databricks", displayName: "Databricks (DBRX)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://{workspace}.cloud.databricks.com/serving-endpoints", fallbackPriority: 20,
        models: [
          { modelId: "dbrx/dbrx-instruct", displayName: "DBRX Instruct", enabled: true, inputPricePer1M: 2.25, outputPricePer1M: 6.75, maxTokens: 32768, rateLimit: 5000 },
          { modelId: "dbrx/meta-llama-3.3-70b", displayName: "Llama 3.3 70B (DBRX)", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 1.0, maxTokens: 131072, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "snowflake", displayName: "Snowflake (Arctic)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.snowflake.com/cortex/v1", fallbackPriority: 20,
        models: [
          { modelId: "snow/arctic-instruct", displayName: "Arctic Instruct", enabled: true, inputPricePer1M: 0.24, outputPricePer1M: 0.24, maxTokens: 4096, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "sambanova", displayName: "SambaNova", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.sambanova.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "sn/llama-3.3-70b", displayName: "Llama 3.3 70B (SN)", enabled: true, inputPricePer1M: 0.6, outputPricePer1M: 0.6, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "sn/qwen-2.5-72b", displayName: "Qwen 2.5 72B (SN)", enabled: true, inputPricePer1M: 0.6, outputPricePer1M: 0.6, maxTokens: 131072, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "deepinfra", displayName: "DeepInfra", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.deepinfra.com/v1/openai", fallbackPriority: 30,
        models: [
          { modelId: "di/llama-3.3-70b", displayName: "Llama 3.3 70B (DI)", enabled: true, inputPricePer1M: 0.35, outputPricePer1M: 0.4, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "di/qwen-2.5-72b", displayName: "Qwen 2.5 72B (DI)", enabled: true, inputPricePer1M: 0.35, outputPricePer1M: 0.4, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "di/mistral-nemo", displayName: "Mistral Nemo (DI)", enabled: true, inputPricePer1M: 0.07, outputPricePer1M: 0.07, maxTokens: 128000, rateLimit: 30000 },
          { modelId: "di/wizardlm-2-8x22b", displayName: "WizardLM 2 8x22B (DI)", enabled: true, inputPricePer1M: 0.65, outputPricePer1M: 0.65, maxTokens: 65536, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "novita", displayName: "Novita AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.novita.ai/v3/openai", fallbackPriority: 30,
        models: [
          { modelId: "novita/llama-3.3-70b", displayName: "Llama 3.3 70B (Novita)", enabled: true, inputPricePer1M: 0.39, outputPricePer1M: 0.39, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "novita/deepseek-r1", displayName: "DeepSeek R1 (Novita)", enabled: true, inputPricePer1M: 0.55, outputPricePer1M: 2.19, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "siliconflow", displayName: "SiliconFlow", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.siliconflow.cn/v1", fallbackPriority: 30,
        models: [
          { modelId: "sf/qwen-2.5-72b", displayName: "Qwen 2.5 72B (SF)", enabled: true, inputPricePer1M: 0.28, outputPricePer1M: 0.28, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "sf/deepseek-v3", displayName: "DeepSeek V3 (SF)", enabled: true, inputPricePer1M: 0.14, outputPricePer1M: 0.28, maxTokens: 128000, rateLimit: 10000 },
          { modelId: "sf/glm-4-9b", displayName: "GLM-4 9B (SF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "featherless", displayName: "Featherless AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.featherless.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "fl/qwen-2.5-72b", displayName: "Qwen 2.5 72B (FL)", enabled: true, inputPricePer1M: 0.2, outputPricePer1M: 0.2, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "fl/llama-3.3-70b", displayName: "Llama 3.3 70B (FL)", enabled: true, inputPricePer1M: 0.2, outputPricePer1M: 0.2, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "hyperbolic", displayName: "Hyperbolic", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.hyperbolic.xyz/v1", fallbackPriority: 30,
        models: [
          { modelId: "hyp/llama-3.3-70b", displayName: "Llama 3.3 70B (Hyp)", enabled: true, inputPricePer1M: 0.4, outputPricePer1M: 0.4, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "hyp/qwen-2.5-72b", displayName: "Qwen 2.5 72B (Hyp)", enabled: true, inputPricePer1M: 0.4, outputPricePer1M: 0.4, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "hyp/deepseek-v3", displayName: "DeepSeek V3 (Hyp)", enabled: true, inputPricePer1M: 0.2, outputPricePer1M: 0.2, maxTokens: 128000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "replicate", displayName: "Replicate", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.replicate.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "rep/llama-3.3-70b", displayName: "Llama 3.3 70B (Replicate)", enabled: true, inputPricePer1M: 0.65, outputPricePer1M: 2.75, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "rep/mixtral-8x7b", displayName: "Mixtral 8x7B (Replicate)", enabled: true, inputPricePer1M: 0.3, outputPricePer1M: 1.0, maxTokens: 32768, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "baseten", displayName: "Baseten", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://model-{id}.api.baseten.co/production/predict", fallbackPriority: 30,
        models: [
          { modelId: "baseten/llama-3.3-70b", displayName: "Llama 3.3 70B (Baseten)", enabled: true, inputPricePer1M: 0.6, outputPricePer1M: 0.6, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "modal", displayName: "Modal", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.modal.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "modal/llama-3.3-70b", displayName: "Llama 3.3 70B (Modal)", enabled: true, inputPricePer1M: 0.59, outputPricePer1M: 0.79, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "lepton", displayName: "Lepton AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://llama3-3-70b.lepton.run/api/v1", fallbackPriority: 30,
        models: [
          { modelId: "lepton/llama-3.3-70b", displayName: "Llama 3.3 70B (Lepton)", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 0.5, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "lepton/mixtral-8x7b", displayName: "Mixtral 8x7B (Lepton)", enabled: true, inputPricePer1M: 0.25, outputPricePer1M: 0.25, maxTokens: 32768, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "anyscale", displayName: "Anyscale", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.endpoints.anyscale.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "anyscale/llama-3.3-70b", displayName: "Llama 3.3 70B (Anyscale)", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 0.5, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "anyscale/mixtral-8x22b", displayName: "Mixtral 8x22B (Anyscale)", enabled: true, inputPricePer1M: 0.9, outputPricePer1M: 0.9, maxTokens: 65536, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "lambda", displayName: "Lambda Labs", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.lambdalabs.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "lambda/llama-3.3-70b", displayName: "Llama 3.3 70B (Lambda)", enabled: true, inputPricePer1M: 0.55, outputPricePer1M: 0.55, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "runpod", displayName: "RunPod Serverless", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.runpod.ai/v2", fallbackPriority: 30,
        models: [
          { modelId: "runpod/llama-3.3-70b", displayName: "Llama 3.3 70B (RunPod)", enabled: true, inputPricePer1M: 0.44, outputPricePer1M: 0.44, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "runpod/qwen-2.5-72b", displayName: "Qwen 2.5 72B (RunPod)", enabled: true, inputPricePer1M: 0.44, outputPricePer1M: 0.44, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "vast", displayName: "Vast.ai", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.vast.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "vast/llama-3.3-70b", displayName: "Llama 3.3 70B (Vast)", enabled: true, inputPricePer1M: 0.3, outputPricePer1M: 0.3, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "akash", displayName: "Akash Network", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://chatapi.akash.network/api/v1", fallbackPriority: 30,
        models: [
          { modelId: "akash/llama-3.3-70b", displayName: "Llama 3.3 70B (Akash)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 3000 },
          { modelId: "akash/deepseek-r1", displayName: "DeepSeek R1 (Akash)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "crusoe", displayName: "Crusoe Cloud", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://inference.crusoecloud.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "crusoe/llama-3.3-70b", displayName: "Llama 3.3 70B (Crusoe)", enabled: true, inputPricePer1M: 0.45, outputPricePer1M: 0.45, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "crusoe/deepseek-r1", displayName: "DeepSeek R1 (Crusoe)", enabled: true, inputPricePer1M: 0.45, outputPricePer1M: 1.8, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "ollama", displayName: "Ollama (Local)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:11434/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "ollama/llama-3.3", displayName: "Llama 3.3 (Local)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 9999 },
          { modelId: "ollama/qwen-2.5", displayName: "Qwen 2.5 (Local)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 9999 },
          { modelId: "ollama/deepseek-r1", displayName: "DeepSeek R1 (Local)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 9999 },
          { modelId: "ollama/gemma2", displayName: "Gemma 2 (Local)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 9999 },
          { modelId: "ollama/phi-4", displayName: "Phi-4 (Local)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 16384, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "lmstudio", displayName: "LM Studio (Local)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:1234/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "lms/any-model", displayName: "Any Local Model", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "jan", displayName: "Jan (Local)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:1337/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "jan/any-model", displayName: "Any Local Model (Jan)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "gpt4all", displayName: "GPT4All (Local)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:4891/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "g4a/any-model", displayName: "Any Local Model (GPT4All)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "llamacpp", displayName: "llama.cpp Server", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:8080/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "lcpp/any-model", displayName: "Any GGUF Model", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "vllm", displayName: "vLLM Server", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:8000/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "vllm/any-model", displayName: "Any vLLM Model", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "tgi", displayName: "TGI (HuggingFace)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:8080/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "tgi/any-model", displayName: "Any TGI Model", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "localai", displayName: "LocalAI", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:8080/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "localai/any-model", displayName: "Any LocalAI Model", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "koboldcpp", displayName: "KoboldCpp (Local)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:5001/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "kobold/any-model", displayName: "Any KoboldCpp Model", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "tabbyapi", displayName: "TabbyAPI (Local)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:5000/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "tabby/any-model", displayName: "Any TabbyAPI Model", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "longcat", displayName: "LongCat (FREE)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "https://api.longcat.fun/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "longcat/gpt-4o", displayName: "GPT-4o (LongCat)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
          { modelId: "longcat/claude-sonnet", displayName: "Claude Sonnet (LongCat)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "chimeragpt", displayName: "ChimeraGPT (FREE)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://chimeragpt.adventblocks.cc/v1", fallbackPriority: 40,
        quotaType: "requests_per_day" as const,
        quotaLimit: 100, quotaUsed: 0,
        models: [
          { modelId: "chimera/gpt-4o", displayName: "GPT-4o (Chimera)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
          { modelId: "chimera/claude-sonnet", displayName: "Claude Sonnet (Chimera)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "freedomgpt", displayName: "FreedomGPT", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "https://api.freedomgpt.com/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "fgpt/liberty", displayName: "Liberty Model", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "openfreegpt", displayName: "OpenFreeGPT", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "https://api.openfreegpt.com/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "ofg/gpt-4", displayName: "GPT-4 (Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "perplexity-web", displayName: "Perplexity Pro (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://www.perplexity.ai/api", fallbackPriority: 10,
        quotaType: "requests_per_day" as const,
        quotaLimit: 300, quotaUsed: 0,
        models: [
          { modelId: "web/perplexity-pro", displayName: "Perplexity Pro (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "claude-web", displayName: "Claude Web (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://claude.ai/api", fallbackPriority: 10,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "web/claude-sonnet-4", displayName: "Claude Sonnet 4 (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
          { modelId: "web/claude-opus-4", displayName: "Claude Opus 4 (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "gemini-web", displayName: "Gemini Web (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://gemini.google.com/api", fallbackPriority: 10,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "web/gemini-2.5-pro", displayName: "Gemini 2.5 Pro (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 1048576, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "deepseek-web", displayName: "DeepSeek Web (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://chat.deepseek.com/api", fallbackPriority: 10,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "web/deepseek-r1", displayName: "DeepSeek R1 (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
          { modelId: "web/deepseek-v3", displayName: "DeepSeek V3 (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "poe", displayName: "Poe (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://poe.com/api", fallbackPriority: 10,
        quotaType: "requests_per_day" as const,
        quotaLimit: 100, quotaUsed: 0,
        models: [
          { modelId: "poe/gpt-4o", displayName: "GPT-4o (Poe)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
          { modelId: "poe/claude-sonnet", displayName: "Claude Sonnet (Poe)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 30 },
          { modelId: "poe/gemini-pro", displayName: "Gemini Pro (Poe)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 1048576, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "you", displayName: "You.com (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://you.com/api", fallbackPriority: 10,
        quotaType: "requests_per_day" as const,
        quotaLimit: 100, quotaUsed: 0,
        models: [
          { modelId: "you/smart", displayName: "You Smart", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "phind", displayName: "Phind (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://www.phind.com/api", fallbackPriority: 10,
        quotaType: "requests_per_day" as const,
        quotaLimit: 50, quotaUsed: 0,
        models: [
          { modelId: "phind/phind-70b", displayName: "Phind 70B", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "cursor", displayName: "Cursor (OAuth)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://api2.cursor.sh/v1", fallbackPriority: 10,
        oauthAuthUrl: "https://cursor.sh/oauth/authorize",
        oauthTokenUrl: "https://cursor.sh/oauth/token",
        quotaType: "requests_per_day" as const,
        quotaLimit: 500, quotaUsed: 0,
        models: [
          { modelId: "cursor/gpt-4o", displayName: "GPT-4o (Cursor)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 60 },
          { modelId: "cursor/claude-sonnet-4", displayName: "Claude Sonnet 4 (Cursor)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
          { modelId: "cursor/cursor-small", displayName: "Cursor Small", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 16384, rateLimit: 120 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "windsurf", displayName: "Windsurf / Codeium (OAuth)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://api.codeium.com/v1", fallbackPriority: 10,
        oauthAuthUrl: "https://windsurf.com/oauth/authorize",
        oauthTokenUrl: "https://windsurf.com/oauth/token",
        quotaType: "requests_per_day" as const,
        quotaLimit: 500, quotaUsed: 0,
        models: [
          { modelId: "windsurf/cascade", displayName: "Cascade", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 60 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "bolt", displayName: "Bolt.new (OAuth)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://api.bolt.new/v1", fallbackPriority: 10,
        oauthAuthUrl: "https://bolt.new/oauth/authorize",
        oauthTokenUrl: "https://bolt.new/oauth/token",
        quotaType: "requests_per_day" as const,
        quotaLimit: 200, quotaUsed: 0,
        models: [
          { modelId: "bolt/claude-sonnet-4", displayName: "Claude Sonnet 4 (Bolt)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "v0-dev", displayName: "v0.dev (OAuth)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://api.v0.dev/v1", fallbackPriority: 10,
        oauthAuthUrl: "https://v0.dev/oauth/authorize",
        oauthTokenUrl: "https://v0.dev/oauth/token",
        quotaType: "requests_per_day" as const,
        quotaLimit: 200, quotaUsed: 0,
        models: [
          { modelId: "v0/v0-gen", displayName: "v0 Generator", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "replit", displayName: "Replit AI (OAuth)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://api.replit.com/v1", fallbackPriority: 10,
        oauthAuthUrl: "https://replit.com/oauth/authorize",
        oauthTokenUrl: "https://replit.com/oauth/token",
        quotaType: "requests_per_day" as const,
        quotaLimit: 300, quotaUsed: 0,
        models: [
          { modelId: "replit/replit-agent", displayName: "Replit Agent", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "sourcegraph", displayName: "Sourcegraph Cody (OAuth)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://sourcegraph.com/.api/completions/stream", fallbackPriority: 10,
        oauthAuthUrl: "https://sourcegraph.com/oauth/authorize",
        oauthTokenUrl: "https://sourcegraph.com/oauth/token",
        quotaType: "requests_per_day" as const,
        quotaLimit: 500, quotaUsed: 0,
        models: [
          { modelId: "cody/claude-sonnet-4", displayName: "Claude Sonnet 4 (Cody)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
          { modelId: "cody/starcoder", displayName: "StarCoder (Cody)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 120 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "tabnine", displayName: "Tabnine (OAuth)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://api.tabnine.com/v1", fallbackPriority: 10,
        oauthAuthUrl: "https://app.tabnine.com/oauth/authorize",
        oauthTokenUrl: "https://app.tabnine.com/oauth/token",
        quotaType: "unlimited" as const,
        models: [
          { modelId: "tabnine/protected", displayName: "Tabnine Protected", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 120 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "codeium", displayName: "Codeium (Free)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.codeium.com/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "codeium/autocomplete", displayName: "Codeium Autocomplete", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 300 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "stability", displayName: "Stability AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.stability.ai/v2beta", fallbackPriority: 20,
        models: [
          { modelId: "sd/stable-diffusion-3.5", displayName: "Stable Diffusion 3.5", enabled: true, inputPricePer1M: 6.5, outputPricePer1M: 0, maxTokens: 77, rateLimit: 5000 },
          { modelId: "sd/sdxl-turbo", displayName: "SDXL Turbo", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 77, rateLimit: 10000 },
          { modelId: "sd/stable-image-ultra", displayName: "Stable Image Ultra", enabled: true, inputPricePer1M: 8.0, outputPricePer1M: 0, maxTokens: 77, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "ideogram", displayName: "Ideogram", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.ideogram.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "ideogram/v2-turbo", displayName: "Ideogram V2 Turbo", enabled: true, inputPricePer1M: 5.0, outputPricePer1M: 0, maxTokens: 77, rateLimit: 5000 },
          { modelId: "ideogram/v2", displayName: "Ideogram V2", enabled: true, inputPricePer1M: 8.0, outputPricePer1M: 0, maxTokens: 77, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "midjourney", displayName: "Midjourney", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.midjourney.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "mj/v6.1", displayName: "Midjourney V6.1", enabled: true, inputPricePer1M: 10.0, outputPricePer1M: 0, maxTokens: 77, rateLimit: 1000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "flux", displayName: "Flux (BFL)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.bfl.ml/v1", fallbackPriority: 20,
        models: [
          { modelId: "flux/flux-1.1-pro", displayName: "Flux 1.1 Pro", enabled: true, inputPricePer1M: 4.0, outputPricePer1M: 0, maxTokens: 77, rateLimit: 5000 },
          { modelId: "flux/flux-1-schnell", displayName: "Flux 1 Schnell", enabled: true, inputPricePer1M: 0.3, outputPricePer1M: 0, maxTokens: 77, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "dalle", displayName: "DALL·E (OpenAI)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.openai.com/v1/images", fallbackPriority: 20,
        models: [
          { modelId: "dalle/dall-e-3", displayName: "DALL·E 3", enabled: true, inputPricePer1M: 4.0, outputPricePer1M: 0, maxTokens: 4000, rateLimit: 5000 },
          { modelId: "dalle/gpt-image-1", displayName: "GPT Image 1", enabled: true, inputPricePer1M: 5.0, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "leonardo", displayName: "Leonardo AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://cloud.leonardo.ai/api/rest/v1", fallbackPriority: 20,
        models: [
          { modelId: "leonardo/phoenix", displayName: "Leonardo Phoenix", enabled: true, inputPricePer1M: 5.0, outputPricePer1M: 0, maxTokens: 77, rateLimit: 5000 },
          { modelId: "leonardo/lightning-xl", displayName: "Lightning XL", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 0, maxTokens: 77, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "fal", displayName: "fal.ai", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://fal.run", fallbackPriority: 30,
        models: [
          { modelId: "fal/flux-pro", displayName: "Flux Pro (fal)", enabled: true, inputPricePer1M: 3.5, outputPricePer1M: 0, maxTokens: 77, rateLimit: 5000 },
          { modelId: "fal/flux-schnell", displayName: "Flux Schnell (fal)", enabled: true, inputPricePer1M: 0.25, outputPricePer1M: 0, maxTokens: 77, rateLimit: 10000 },
          { modelId: "fal/aura-flow", displayName: "AuraFlow (fal)", enabled: true, inputPricePer1M: 0.1, outputPricePer1M: 0, maxTokens: 77, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "elevenlabs", displayName: "ElevenLabs", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.elevenlabs.io/v1", fallbackPriority: 20,
        models: [
          { modelId: "eleven/eleven-turbo-v2.5", displayName: "Turbo v2.5 TTS", enabled: true, inputPricePer1M: 0.18, outputPricePer1M: 0, maxTokens: 5000, rateLimit: 5000 },
          { modelId: "eleven/eleven-multilingual-v2", displayName: "Multilingual v2 TTS", enabled: true, inputPricePer1M: 0.24, outputPricePer1M: 0, maxTokens: 5000, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "assemblyai", displayName: "AssemblyAI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.assemblyai.com/v2", fallbackPriority: 20,
        models: [
          { modelId: "assembly/universal-2", displayName: "Universal-2 STT", enabled: true, inputPricePer1M: 0.65, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
          { modelId: "assembly/nano", displayName: "Nano STT", enabled: true, inputPricePer1M: 0.12, outputPricePer1M: 0, maxTokens: 0, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "openai-audio", displayName: "OpenAI Audio", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.openai.com/v1/audio", fallbackPriority: 20,
        models: [
          { modelId: "oai/whisper-1", displayName: "Whisper v3 STT", enabled: true, inputPricePer1M: 0.006, outputPricePer1M: 0, maxTokens: 0, rateLimit: 10000 },
          { modelId: "oai/tts-1-hd", displayName: "TTS-1 HD", enabled: true, inputPricePer1M: 0.03, outputPricePer1M: 0, maxTokens: 4096, rateLimit: 5000 },
          { modelId: "oai/tts-1", displayName: "TTS-1", enabled: true, inputPricePer1M: 0.015, outputPricePer1M: 0, maxTokens: 4096, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "deepgram", displayName: "Deepgram", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.deepgram.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "dg/nova-2", displayName: "Nova-2 STT", enabled: true, inputPricePer1M: 0.36, outputPricePer1M: 0, maxTokens: 0, rateLimit: 10000 },
          { modelId: "dg/aura-asteria", displayName: "Aura Asteria TTS", enabled: true, inputPricePer1M: 0.015, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "suno", displayName: "Suno", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://studio-api.suno.ai", fallbackPriority: 20,
        models: [
          { modelId: "suno/v4", displayName: "Suno v4 Music", enabled: true, inputPricePer1M: 5.0, outputPricePer1M: 0, maxTokens: 3000, rateLimit: 1000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "udio", displayName: "Udio", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://www.udio.com/api/v1", fallbackPriority: 20,
        models: [
          { modelId: "udio/v1.5", displayName: "Udio v1.5 Music", enabled: true, inputPricePer1M: 5.0, outputPricePer1M: 0, maxTokens: 3000, rateLimit: 1000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "runway", displayName: "Runway", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.runwayml.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "runway/gen-4", displayName: "Gen-4 Video", enabled: true, inputPricePer1M: 50.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 500 },
          { modelId: "runway/gen-3a-turbo", displayName: "Gen-3a Turbo", enabled: true, inputPricePer1M: 25.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 1000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "pika", displayName: "Pika", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.pika.art/v1", fallbackPriority: 20,
        models: [
          { modelId: "pika/pika-2.2", displayName: "Pika 2.2 Video", enabled: true, inputPricePer1M: 20.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 1000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "luma", displayName: "Luma AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.lumalabs.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "luma/dream-machine", displayName: "Dream Machine", enabled: true, inputPricePer1M: 30.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 500 },
          { modelId: "luma/ray-2", displayName: "Ray 2", enabled: true, inputPricePer1M: 30.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 500 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "kling", displayName: "Kling AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.klingai.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "kling/kling-1.6", displayName: "Kling 1.6 Video", enabled: true, inputPricePer1M: 20.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 1000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "minimax-video", displayName: "MiniMax (Hailuo)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.minimax.chat/v1/video_generation", fallbackPriority: 20,
        models: [
          { modelId: "hailuo/i2v-01-director", displayName: "Hailuo Director", enabled: true, inputPricePer1M: 20.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 500 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "veo", displayName: "Google Veo", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://generativelanguage.googleapis.com/v1beta", fallbackPriority: 20,
        models: [
          { modelId: "veo/veo-3", displayName: "Veo 3", enabled: true, inputPricePer1M: 35.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 500 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "voyage", displayName: "Voyage AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.voyageai.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "voyage/voyage-3-large", displayName: "Voyage 3 Large", enabled: true, inputPricePer1M: 0.18, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 10000 },
          { modelId: "voyage/voyage-3-lite", displayName: "Voyage 3 Lite", enabled: true, inputPricePer1M: 0.02, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 30000 },
          { modelId: "voyage/voyage-code-3", displayName: "Voyage Code 3", enabled: true, inputPricePer1M: 0.18, outputPricePer1M: 0, maxTokens: 32000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "jina", displayName: "Jina AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.jina.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "jina/jina-embeddings-v3", displayName: "Jina Embeddings v3", enabled: true, inputPricePer1M: 0.02, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 10000 },
          { modelId: "jina/jina-colbert-v2", displayName: "Jina ColBERT v2", enabled: true, inputPricePer1M: 0.02, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 10000 },
          { modelId: "jina/reader-v2", displayName: "Jina Reader v2", enabled: true, inputPricePer1M: 0.02, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "mixedbread", displayName: "Mixedbread AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.mixedbread.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "mxb/mxbai-embed-large", displayName: "mxbai-embed-large", enabled: true, inputPricePer1M: 0.01, outputPricePer1M: 0, maxTokens: 512, rateLimit: 30000 },
          { modelId: "mxb/mxbai-rerank-large", displayName: "mxbai-rerank-large", enabled: true, inputPricePer1M: 0.05, outputPricePer1M: 0, maxTokens: 512, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "tavily", displayName: "Tavily", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.tavily.com", fallbackPriority: 20,
        models: [
          { modelId: "tavily/search", displayName: "Tavily Search", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
          { modelId: "tavily/extract", displayName: "Tavily Extract", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "exa", displayName: "Exa", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.exa.ai", fallbackPriority: 20,
        models: [
          { modelId: "exa/search", displayName: "Exa Search", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
          { modelId: "exa/find-similar", displayName: "Exa Find Similar", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "serper", displayName: "Serper", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://google.serper.dev", fallbackPriority: 20,
        models: [
          { modelId: "serper/google-search", displayName: "Google Search", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "brave-search", displayName: "Brave Search", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.search.brave.com/res/v1", fallbackPriority: 20,
        models: [
          { modelId: "brave/web-search", displayName: "Brave Web Search", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "firecrawl", displayName: "Firecrawl", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.firecrawl.dev/v1", fallbackPriority: 20,
        models: [
          { modelId: "firecrawl/scrape", displayName: "Firecrawl Scrape", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
          { modelId: "firecrawl/crawl", displayName: "Firecrawl Crawl", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "deepl", displayName: "DeepL", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api-free.deepl.com/v2", fallbackPriority: 20,
        models: [
          { modelId: "deepl/translate", displayName: "DeepL Translate", enabled: true, inputPricePer1M: 25.0, outputPricePer1M: 0, maxTokens: 50000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "codestral", displayName: "Codestral (Mistral)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://codestral.mistral.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "codestral/codestral-latest", displayName: "Codestral Latest", enabled: true, inputPricePer1M: 0.3, outputPricePer1M: 0.9, maxTokens: 256000, rateLimit: 12000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "qodo", displayName: "Qodo (CodiumAI)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.qodo.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "qodo/cover-agent", displayName: "Cover Agent", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 0, maxTokens: 16384, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "aider", displayName: "Aider (Self-Hosted)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "http://localhost:8888/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "aider/architect", displayName: "Aider Architect", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "mathpix", displayName: "Mathpix", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.mathpix.com/v3", fallbackPriority: 20,
        models: [
          { modelId: "mathpix/ocr", displayName: "Mathpix OCR", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "unstructured", displayName: "Unstructured", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.unstructuredapp.io", fallbackPriority: 20,
        models: [
          { modelId: "unstruct/partition", displayName: "Document Partition", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "octoai", displayName: "OctoAI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://text.octoai.run/v1", fallbackPriority: 30,
        models: [
          { modelId: "octo/llama-3.3-70b", displayName: "Llama 3.3 70B (Octo)", enabled: true, inputPricePer1M: 0.4, outputPricePer1M: 0.4, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "octo/qwen-2.5-72b", displayName: "Qwen 2.5 72B (Octo)", enabled: true, inputPricePer1M: 0.4, outputPricePer1M: 0.4, maxTokens: 131072, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "neets", displayName: "Neets.ai", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.neets.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "neets/llama-3.3-70b", displayName: "Llama 3.3 70B (Neets)", enabled: true, inputPricePer1M: 0.18, outputPricePer1M: 0.18, maxTokens: 131072, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "glhf", displayName: "glhf.chat", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://glhf.chat/api/openai/v1", fallbackPriority: 30,
        models: [
          { modelId: "glhf/llama-3.3-70b", displayName: "Llama 3.3 70B (glhf)", enabled: true, inputPricePer1M: 0.3, outputPricePer1M: 0.3, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "glhf/qwen-2.5-72b", displayName: "Qwen 2.5 72B (glhf)", enabled: true, inputPricePer1M: 0.3, outputPricePer1M: 0.3, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "cloudflare-ai-gateway", displayName: "Cloudflare AI Gateway", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://gateway.ai.cloudflare.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "cfgw/openai-proxy", displayName: "OpenAI Proxy (CF GW)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "martian", displayName: "Martian (Router)", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://withmartian.com/api/openai/v1", fallbackPriority: 30,
        models: [
          { modelId: "martian/router", displayName: "Martian Router", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "unify", displayName: "Unify AI (Router)", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.unify.ai/v0", fallbackPriority: 30,
        models: [
          { modelId: "unify/router", displayName: "Unify Router", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "portkey", displayName: "Portkey AI (Gateway)", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.portkey.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "portkey/proxy", displayName: "Portkey Proxy", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "helicone", displayName: "Helicone (Proxy)", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://oai.helicone.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "helicone/proxy", displayName: "Helicone OpenAI Proxy", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "together-free", displayName: "Together Free", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.together.xyz/v1", fallbackPriority: 40,
        quotaType: "requests_per_day" as const,
        quotaLimit: 100, quotaUsed: 0,
        models: [
          { modelId: "tgf/llama-3.3-70b", displayName: "Llama 3.3 70B (Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "groq-free", displayName: "Groq Free", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.groq.com/openai/v1", fallbackPriority: 40,
        quotaType: "requests_per_minute" as const,
        quotaLimit: 30, quotaUsed: 0,
        models: [
          { modelId: "groqf/llama-3.3-70b", displayName: "Llama 3.3 70B (Groq Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "sambanova-free", displayName: "SambaNova Free", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.sambanova.ai/v1", fallbackPriority: 40,
        quotaType: "requests_per_minute" as const,
        quotaLimit: 10, quotaUsed: 0,
        models: [
          { modelId: "snf/llama-3.3-70b", displayName: "Llama 3.3 70B (SN Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 10 },
          { modelId: "snf/deepseek-r1", displayName: "DeepSeek R1 (SN Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 10 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "cerebras-free", displayName: "Cerebras Free", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.cerebras.ai/v1", fallbackPriority: 40,
        quotaType: "requests_per_minute" as const,
        quotaLimit: 30, quotaUsed: 0,
        models: [
          { modelId: "cbf/llama-3.3-70b", displayName: "Llama 3.3 70B (CB Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "deepseek-free", displayName: "DeepSeek Free", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.deepseek.com/v1", fallbackPriority: 40,
        quotaType: "requests_per_day" as const,
        quotaLimit: 50, quotaUsed: 0,
        models: [
          { modelId: "dsf/deepseek-chat", displayName: "DeepSeek Chat (Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "nvidia-free", displayName: "NVIDIA Build (Free)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://integrate.api.nvidia.com/v1", fallbackPriority: 40,
        quotaType: "requests_per_day" as const,
        quotaLimit: 200, quotaUsed: 0,
        models: [
          { modelId: "nvf/llama-3.3-70b", displayName: "Llama 3.3 70B (NV Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
          { modelId: "nvf/deepseek-r1", displayName: "DeepSeek R1 (NV Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "cohere-trial", displayName: "Cohere Trial (Free)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.cohere.ai/v1", fallbackPriority: 40,
        quotaType: "requests_per_minute" as const,
        quotaLimit: 20, quotaUsed: 0,
        models: [
          { modelId: "coh-trial/command-r", displayName: "Command R (Trial)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 20 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "mistral-free", displayName: "Mistral Free (La Plateforme)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.mistral.ai/v1", fallbackPriority: 40,
        quotaType: "requests_per_minute" as const,
        quotaLimit: 30, quotaUsed: 0,
        models: [
          { modelId: "mf/mistral-small", displayName: "Mistral Small (Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "meshy", displayName: "Meshy (3D)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.meshy.ai/v2", fallbackPriority: 20,
        models: [
          { modelId: "meshy/text-to-3d", displayName: "Text to 3D", enabled: true, inputPricePer1M: 20.0, outputPricePer1M: 0, maxTokens: 1000, rateLimit: 500 },
          { modelId: "meshy/image-to-3d", displayName: "Image to 3D", enabled: true, inputPricePer1M: 15.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 500 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "tripo", displayName: "Tripo3D", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.tripo3d.ai/v2", fallbackPriority: 20,
        models: [
          { modelId: "tripo/v2", displayName: "Tripo V2 3D", enabled: true, inputPricePer1M: 15.0, outputPricePer1M: 0, maxTokens: 1000, rateLimit: 500 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "openai-moderation", displayName: "OpenAI Moderation", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.openai.com/v1/moderations", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "mod/omni-moderation", displayName: "Omni Moderation", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "perspective", displayName: "Perspective API (Google)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://commentanalyzer.googleapis.com/v1alpha1", fallbackPriority: 40,
        quotaType: "requests_per_minute" as const,
        quotaLimit: 60, quotaUsed: 0,
        models: [
          { modelId: "persp/toxicity", displayName: "Toxicity Analyzer", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 20480, rateLimit: 60 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "e2b", displayName: "E2B (Code Sandbox)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.e2b.dev", fallbackPriority: 20,
        models: [
          { modelId: "e2b/code-interpreter", displayName: "Code Interpreter", enabled: true, inputPricePer1M: 0.1, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "browserbase", displayName: "Browserbase", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.browserbase.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "bb/browser-agent", displayName: "Browser Agent", enabled: true, inputPricePer1M: 5.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 1000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "composio", displayName: "Composio (Tools)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://backend.composio.dev/api/v2", fallbackPriority: 20,
        models: [
          { modelId: "composio/tools-proxy", displayName: "Tools Proxy", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "naver", displayName: "Naver (HyperCLOVA X)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://clovastudio.apigw.ntruss.com/testapp/v1", fallbackPriority: 20,
        models: [
          { modelId: "naver/hcx-dash-003", displayName: "HyperCLOVA X", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 9.0, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "kakao", displayName: "Kakao (KoGPT)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.kakaobrain.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "kakao/kogpt", displayName: "KoGPT", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 32000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "sakura", displayName: "Sakura Internet (Japan)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.sakura.io/v1", fallbackPriority: 20,
        models: [
          { modelId: "sakura/llm-jp-70b", displayName: "LLM-JP 70B", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 3.0, maxTokens: 32768, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "yandex", displayName: "Yandex (YandexGPT)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://llm.api.cloud.yandex.net/foundationModels/v1", fallbackPriority: 20,
        models: [
          { modelId: "yagpt/yandexgpt-pro", displayName: "YandexGPT Pro", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 9.0, maxTokens: 32768, rateLimit: 5000 },
          { modelId: "yagpt/yandexgpt-lite", displayName: "YandexGPT Lite", enabled: true, inputPricePer1M: 0.4, outputPricePer1M: 1.2, maxTokens: 32768, rateLimit: 15000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "sber", displayName: "Sber (GigaChat)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://gigachat.devices.sberbank.ru/api/v1", fallbackPriority: 20,
        models: [
          { modelId: "giga/gigachat-pro", displayName: "GigaChat Pro", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 9.0, maxTokens: 32768, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "coze", displayName: "Coze (ByteDance)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.coze.com/v3", fallbackPriority: 20,
        models: [
          { modelId: "coze/bot-proxy", displayName: "Coze Bot Proxy", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "dify", displayName: "Dify (Self-Hosted)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "http://localhost:3000/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "dify/app-proxy", displayName: "Dify App Proxy", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "flowise", displayName: "FlowiseAI (Self-Hosted)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "http://localhost:3000/api/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "flowise/chatflow", displayName: "Flowise Chatflow", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 9999 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "langfuse", displayName: "Langfuse (Proxy)", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://cloud.langfuse.com/api", fallbackPriority: 30,
        models: [
          { modelId: "langfuse/proxy", displayName: "Langfuse Proxy", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "litellm", displayName: "LiteLLM (Proxy)", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "http://localhost:4000/v1", fallbackPriority: 30,
        models: [
          { modelId: "litellm/proxy", displayName: "LiteLLM Proxy", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "semantic-router", displayName: "Semantic Router", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.semanticrouter.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "semr/router", displayName: "Semantic Router", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "not-diamond", displayName: "Not Diamond (Router)", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://not-diamond-server.onrender.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "nd/router", displayName: "Not Diamond Router", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "predictionguard", displayName: "Prediction Guard", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.predictionguard.com", fallbackPriority: 20,
        models: [
          { modelId: "pg/hermes-3-70b", displayName: "Hermes 3 70B", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 3.0, maxTokens: 32768, rateLimit: 5000 },
          { modelId: "pg/deepseek-r1-distilled", displayName: "DeepSeek R1 Distilled", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 1.5, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "upstage", displayName: "Upstage", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.upstage.ai/v1/solar", fallbackPriority: 20,
        models: [
          { modelId: "solar/solar-pro", displayName: "Solar Pro", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 32768, rateLimit: 5000 },
          { modelId: "solar/solar-mini", displayName: "Solar Mini", enabled: true, inputPricePer1M: 0.15, outputPricePer1M: 0.15, maxTokens: 32768, rateLimit: 15000 },
          { modelId: "solar/document-ai", displayName: "Document AI", enabled: true, inputPricePer1M: 5.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 3000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "friendli", displayName: "Friendli AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://inference.friendli.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "friendli/llama-3.3-70b", displayName: "Llama 3.3 70B (Friendli)", enabled: true, inputPricePer1M: 0.35, outputPricePer1M: 0.35, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "friendli/deepseek-r1", displayName: "DeepSeek R1 (Friendli)", enabled: true, inputPricePer1M: 0.55, outputPricePer1M: 2.19, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "monsoon", displayName: "Monsoon AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.monsoon.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "monsoon/llama-3.3-70b", displayName: "Llama 3.3 70B (Monsoon)", enabled: true, inputPricePer1M: 0.3, outputPricePer1M: 0.3, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "centml", displayName: "CentML", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.centml.com/openai/v1", fallbackPriority: 30,
        models: [
          { modelId: "centml/llama-3.3-70b", displayName: "Llama 3.3 70B (CentML)", enabled: true, inputPricePer1M: 0.4, outputPricePer1M: 0.4, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "nebius", displayName: "Nebius AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.studio.nebius.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "nebius/llama-3.3-70b", displayName: "Llama 3.3 70B (Nebius)", enabled: true, inputPricePer1M: 0.28, outputPricePer1M: 0.28, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "nebius/qwen-2.5-72b", displayName: "Qwen 2.5 72B (Nebius)", enabled: true, inputPricePer1M: 0.28, outputPricePer1M: 0.28, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "nebius/deepseek-r1", displayName: "DeepSeek R1 (Nebius)", enabled: true, inputPricePer1M: 0.55, outputPricePer1M: 2.19, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "kluster", displayName: "Kluster AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.kluster.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "kluster/deepseek-r1", displayName: "DeepSeek R1 (Kluster)", enabled: true, inputPricePer1M: 0.55, outputPricePer1M: 2.19, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "infini-ai", displayName: "Infini AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://cloud.infini-ai.com/maas/v1", fallbackPriority: 30,
        models: [
          { modelId: "infini/deepseek-r1", displayName: "DeepSeek R1 (Infini)", enabled: true, inputPricePer1M: 0.55, outputPricePer1M: 2.19, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "infini/deepseek-v3", displayName: "DeepSeek V3 (Infini)", enabled: true, inputPricePer1M: 0.14, outputPricePer1M: 0.28, maxTokens: 128000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "chutes", displayName: "Chutes AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://llm.chutes.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "chutes/deepseek-r1", displayName: "DeepSeek R1 (Chutes)", enabled: true, inputPricePer1M: 0.4, outputPricePer1M: 1.6, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "chutes/llama-3.3-70b", displayName: "Llama 3.3 70B (Chutes)", enabled: true, inputPricePer1M: 0.3, outputPricePer1M: 0.3, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "targon", displayName: "Targon (Manifold)", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.targon.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "targon/deepseek-r1", displayName: "DeepSeek R1 (Targon)", enabled: true, inputPricePer1M: 0.45, outputPricePer1M: 1.8, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "nineteen", displayName: "Nineteen AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.nineteen.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "nineteen/llama-3.3-70b", displayName: "Llama 3.3 70B (Nineteen)", enabled: true, inputPricePer1M: 0.2, outputPricePer1M: 0.2, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "parasail", displayName: "Parasail AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.parasail.io/v1", fallbackPriority: 30,
        models: [
          { modelId: "parasail/llama-3.3-70b", displayName: "Llama 3.3 70B (Parasail)", enabled: true, inputPricePer1M: 0.25, outputPricePer1M: 0.25, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "tencent", displayName: "Tencent Hunyuan", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://hunyuan.tencentcloudapi.com", fallbackPriority: 20,
        models: [
          { modelId: "hunyuan/hunyuan-pro", displayName: "Hunyuan Pro", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 256000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "kunlun", displayName: "Kunlun Tech (Skywork)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.tiangong.cn/v1", fallbackPriority: 20,
        models: [
          { modelId: "skywork/skywork-o1", displayName: "Skywork o1", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 3.0, maxTokens: 32768, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "zhiyuan", displayName: "Zhiyuan (AquilaChat)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://open.bigmodel.cn/api/v1", fallbackPriority: 20,
        models: [
          { modelId: "aquila/aquilachat-70b", displayName: "AquilaChat 70B", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 3.0, maxTokens: 32768, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "chatglm-web", displayName: "ChatGLM Web (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://chatglm.cn/api", fallbackPriority: 10,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "web/chatglm-4", displayName: "ChatGLM-4 (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "kimi-web", displayName: "Kimi Web (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://kimi.moonshot.cn/api", fallbackPriority: 10,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "web/kimi", displayName: "Kimi (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "doubao-web", displayName: "Doubao Web (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://www.doubao.com/api", fallbackPriority: 10,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "web/doubao", displayName: "Doubao (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "gradient", displayName: "Gradient AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.gradient.ai/api/v1", fallbackPriority: 30,
        models: [
          { modelId: "gradient/llama-3.3-70b", displayName: "Llama 3.3 70B (Gradient)", enabled: true, inputPricePer1M: 0.3, outputPricePer1M: 0.3, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "predibase", displayName: "Predibase", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.predibase.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "predibase/llama-3.3-70b", displayName: "Llama 3.3 70B (Predibase)", enabled: true, inputPricePer1M: 0.35, outputPricePer1M: 0.35, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "corcel", displayName: "Corcel (Bittensor)", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.corcel.io/v1", fallbackPriority: 30,
        models: [
          { modelId: "corcel/llama-3.3-70b", displayName: "Llama 3.3 70B (Corcel)", enabled: true, inputPricePer1M: 0.25, outputPricePer1M: 0.25, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "venice", displayName: "Venice AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.venice.ai/api/v1", fallbackPriority: 20,
        models: [
          { modelId: "venice/llama-3.3-70b", displayName: "Llama 3.3 70B (Venice)", enabled: true, inputPricePer1M: 0.5, outputPricePer1M: 0.5, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "venice/deepseek-r1", displayName: "DeepSeek R1 (Venice)", enabled: true, inputPricePer1M: 0.55, outputPricePer1M: 2.19, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "resemble", displayName: "Resemble AI (Voice)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://app.resemble.ai/api/v2", fallbackPriority: 20,
        models: [
          { modelId: "resemble/v2-tts", displayName: "Resemble v2 TTS", enabled: true, inputPricePer1M: 0.06, outputPricePer1M: 0, maxTokens: 5000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "play-ht", displayName: "PlayHT", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.play.ht/api/v2", fallbackPriority: 20,
        models: [
          { modelId: "playht/play3.0", displayName: "Play 3.0 TTS", enabled: true, inputPricePer1M: 0.15, outputPricePer1M: 0, maxTokens: 5000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "cartesia", displayName: "Cartesia (Sonic)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.cartesia.ai", fallbackPriority: 20,
        models: [
          { modelId: "cartesia/sonic-2", displayName: "Sonic 2 TTS", enabled: true, inputPricePer1M: 0.1, outputPricePer1M: 0, maxTokens: 5000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "heygen", displayName: "HeyGen (Avatar)", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.heygen.com/v2", fallbackPriority: 20,
        models: [
          { modelId: "heygen/avatar-v2", displayName: "Avatar v2", enabled: true, inputPricePer1M: 30.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 500 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "synthesia", displayName: "Synthesia", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.synthesia.io/v2", fallbackPriority: 20,
        models: [
          { modelId: "synthesia/avatar", displayName: "Synthesia Avatar", enabled: true, inputPricePer1M: 35.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 500 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "d-id", displayName: "D-ID", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.d-id.com", fallbackPriority: 20,
        models: [
          { modelId: "d-id/talks", displayName: "D-ID Talks", enabled: true, inputPricePer1M: 25.0, outputPricePer1M: 0, maxTokens: 2000, rateLimit: 500 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "segment-anything", displayName: "SAM 2 (Meta)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "https://api.segment-anything.com/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "sam/sam-2.1", displayName: "SAM 2.1", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "roboflow", displayName: "Roboflow", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://detect.roboflow.com", fallbackPriority: 20,
        models: [
          { modelId: "roboflow/object-detect", displayName: "Object Detection", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 0, maxTokens: 0, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "clarifai", displayName: "Clarifai", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.clarifai.com/v2", fallbackPriority: 20,
        models: [
          { modelId: "clarifai/general-image", displayName: "General Image Recognition", enabled: true, inputPricePer1M: 1.2, outputPricePer1M: 0, maxTokens: 0, rateLimit: 10000 },
          { modelId: "clarifai/llm-proxy", displayName: "LLM Proxy (Clarifai)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "prem", displayName: "Prem AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.premai.io/v1", fallbackPriority: 30,
        models: [
          { modelId: "prem/auto", displayName: "Prem Auto", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "fireworks-free", displayName: "Fireworks Free", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.fireworks.ai/inference/v1", fallbackPriority: 40,
        quotaType: "requests_per_day" as const,
        quotaLimit: 100, quotaUsed: 0,
        models: [
          { modelId: "fwf/llama-3.3-70b", displayName: "Llama 3.3 70B (FW Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "glama", displayName: "Glama", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://glama.ai/api/gateway/v1", fallbackPriority: 30,
        models: [
          { modelId: "glama/auto", displayName: "Glama Auto Router", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "requesty", displayName: "Requesty", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://router.requesty.ai/v1", fallbackPriority: 30,
        models: [
          { modelId: "requesty/router", displayName: "Requesty Router", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "llmplayground", displayName: "LLM Playground (Free)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "https://api.llmplayground.net/v1", fallbackPriority: 40,
        quotaType: "requests_per_day" as const,
        quotaLimit: 50, quotaUsed: 0,
        models: [
          { modelId: "llmpg/gpt-4o", displayName: "GPT-4o (Playground)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 10 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "endpoints", displayName: "HF Dedicated Endpoints", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://{endpoint}.us-east-1.aws.endpoints.huggingface.cloud/v1", fallbackPriority: 20,
        models: [
          { modelId: "hfe/custom", displayName: "Custom HF Endpoint", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "azure-ml", displayName: "Azure ML Endpoints", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://{endpoint}.{region}.inference.ml.azure.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "azml/custom", displayName: "Custom Azure ML", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "sagemaker", displayName: "AWS SageMaker", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://runtime.sagemaker.{region}.amazonaws.com", fallbackPriority: 20,
        models: [
          { modelId: "sm/custom", displayName: "Custom SageMaker", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "gcp-vertex-endpoints", displayName: "GCP Vertex Endpoints", enabled: false,
        authType: "service_account" as const, tier: "api_key" as const,
        baseUrl: "https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/endpoints", fallbackPriority: 20,
        models: [
          { modelId: "vtx/custom", displayName: "Custom Vertex Endpoint", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "arcee", displayName: "Arcee AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.arcee.ai/v2", fallbackPriority: 20,
        models: [
          { modelId: "arcee/supernova-medius", displayName: "SuperNova Medius", enabled: true, inputPricePer1M: 1.0, outputPricePer1M: 3.0, maxTokens: 131072, rateLimit: 5000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "mistral-codestral-free", displayName: "Codestral Mamba (Free)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://codestral.mistral.ai/v1", fallbackPriority: 40,
        quotaType: "requests_per_minute" as const,
        quotaLimit: 30, quotaUsed: 0,
        models: [
          { modelId: "csf/codestral-mamba", displayName: "Codestral Mamba (Free)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 256000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "huggingchat", displayName: "HuggingChat (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "free" as const,
        baseUrl: "https://huggingface.co/chat/api", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "web/qwen-2.5-72b-hc", displayName: "Qwen 2.5 72B (HuggingChat)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
          { modelId: "web/llama-3.3-70b-hc", displayName: "Llama 3.3 70B (HuggingChat)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "duck-ai", displayName: "DuckDuckGo AI (Free)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "https://duckduckgo.com/duckchat/v1", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "duck/gpt-4o-mini", displayName: "GPT-4o Mini (Duck)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 30 },
          { modelId: "duck/claude-haiku", displayName: "Claude Haiku (Duck)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 8192, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "blackbox", displayName: "Blackbox AI (Free)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "https://api.blackbox.ai/api/chat", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "blackbox/blackboxai", displayName: "BlackboxAI", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
    ];

    for (const p of phase2Providers) {
      const exists = await ctx.db
        .query("providerConfigs")
        .withIndex("by_provider", (q) => q.eq("provider", p.provider))
        .unique();
      if (exists) continue;
      await ctx.db.insert("providerConfigs", p);
      added++;
    }

    return { message: `Phase 2: Added ${added} new providers (total 200++)` };
  },
});
