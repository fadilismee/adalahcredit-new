import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import {
  Search, ArrowUpDown, ArrowLeft, Sparkles, Zap, Brain,
  Code2, Image, MessageSquare, FileText, Globe, ChevronDown,
  Music, Video, Box, Shield, Wrench, Mic, Languages, Eye,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   MODEL DATA
   ═══════════════════════════════════════════════════════════════ */

interface Model {
  id: string;
  name: string;
  provider: string;
  providerColor: string;
  category: string;
  contextWindow: string;
  contextTokens: number;
  inputPrice: number;   // per 1M tokens in USD
  outputPrice: number;  // per 1M tokens in USD
  inputPriceRp: number;  // per 1M tokens in Rp
  outputPriceRp: number; // per 1M tokens in Rp
  maxOutput: string;
  capabilities: string[];
  speed: "ultra" | "fast" | "medium" | "slow";
  quality: "standard" | "high" | "premium";
  popular?: boolean;
  new?: boolean;
}

const USD_TO_IDR = 16000;

function usdToRp(usd: number): number {
  return Math.round(usd * USD_TO_IDR);
}

const ALL_MODELS: Model[] = [
  // OpenAI
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", providerColor: "#10a37f", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.50, outputPrice: 10.00, inputPriceRp: usdToRp(2.50), outputPriceRp: usdToRp(10.00), maxOutput: "16K", capabilities: ["chat", "vision", "code", "analysis"], speed: "fast", quality: "premium", popular: true },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", providerColor: "#10a37f", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.15, outputPrice: 0.60, inputPriceRp: usdToRp(0.15), outputPriceRp: usdToRp(0.60), maxOutput: "16K", capabilities: ["chat", "vision", "code"], speed: "fast", quality: "standard", popular: true },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", providerColor: "#10a37f", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 10.00, outputPrice: 30.00, inputPriceRp: usdToRp(10.00), outputPriceRp: usdToRp(30.00), maxOutput: "4K", capabilities: ["chat", "vision", "code", "analysis"], speed: "medium", quality: "premium" },
  { id: "o1", name: "o1", provider: "OpenAI", providerColor: "#10a37f", category: "Reasoning", contextWindow: "200K", contextTokens: 200000, inputPrice: 15.00, outputPrice: 60.00, inputPriceRp: usdToRp(15.00), outputPriceRp: usdToRp(60.00), maxOutput: "100K", capabilities: ["reasoning", "math", "code", "analysis"], speed: "slow", quality: "premium", new: true },
  { id: "o1-mini", name: "o1 Mini", provider: "OpenAI", providerColor: "#10a37f", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 3.00, outputPrice: 12.00, inputPriceRp: usdToRp(3.00), outputPriceRp: usdToRp(12.00), maxOutput: "65K", capabilities: ["reasoning", "math", "code"], speed: "medium", quality: "high" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI", providerColor: "#10a37f", category: "Chat", contextWindow: "1M", contextTokens: 1048576, inputPrice: 2.00, outputPrice: 8.00, inputPriceRp: usdToRp(2.00), outputPriceRp: usdToRp(8.00), maxOutput: "32K", capabilities: ["chat", "vision", "code", "analysis"], speed: "fast", quality: "premium", new: true },

  // Anthropic
  { id: "claude-opus-4", name: "Claude Opus 4", provider: "Anthropic", providerColor: "#d97706", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 15.00, outputPrice: 75.00, inputPriceRp: usdToRp(15.00), outputPriceRp: usdToRp(75.00), maxOutput: "32K", capabilities: ["chat", "code", "analysis", "creative", "vision"], speed: "slow", quality: "premium", new: true },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", providerColor: "#d97706", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 3.00, outputPrice: 15.00, inputPriceRp: usdToRp(3.00), outputPriceRp: usdToRp(15.00), maxOutput: "64K", capabilities: ["chat", "code", "analysis", "creative", "vision"], speed: "fast", quality: "premium", popular: true },
  { id: "claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic", providerColor: "#d97706", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 0.80, outputPrice: 4.00, inputPriceRp: usdToRp(0.80), outputPriceRp: usdToRp(4.00), maxOutput: "8K", capabilities: ["chat", "code", "analysis"], speed: "fast", quality: "high" },

  // Google
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", providerColor: "#4285f4", category: "Chat", contextWindow: "1M", contextTokens: 1048576, inputPrice: 1.25, outputPrice: 10.00, inputPriceRp: usdToRp(1.25), outputPriceRp: usdToRp(10.00), maxOutput: "64K", capabilities: ["chat", "vision", "code", "analysis", "reasoning"], speed: "medium", quality: "premium", popular: true },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", providerColor: "#4285f4", category: "Chat", contextWindow: "1M", contextTokens: 1048576, inputPrice: 0.15, outputPrice: 0.60, inputPriceRp: usdToRp(0.15), outputPriceRp: usdToRp(0.60), maxOutput: "64K", capabilities: ["chat", "vision", "code"], speed: "fast", quality: "high", popular: true },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", providerColor: "#4285f4", category: "Chat", contextWindow: "1M", contextTokens: 1048576, inputPrice: 0.10, outputPrice: 0.40, inputPriceRp: usdToRp(0.10), outputPriceRp: usdToRp(0.40), maxOutput: "8K", capabilities: ["chat", "vision", "code"], speed: "fast", quality: "standard" },

  // Meta
  { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", providerColor: "#0668E1", category: "Chat", contextWindow: "1M", contextTokens: 1048576, inputPrice: 0.20, outputPrice: 0.60, inputPriceRp: usdToRp(0.20), outputPriceRp: usdToRp(0.60), maxOutput: "64K", capabilities: ["chat", "code", "analysis"], speed: "fast", quality: "high", new: true },
  { id: "llama-4-scout", name: "Llama 4 Scout", provider: "Meta", providerColor: "#0668E1", category: "Chat", contextWindow: "512K", contextTokens: 512000, inputPrice: 0.10, outputPrice: 0.30, inputPriceRp: usdToRp(0.10), outputPriceRp: usdToRp(0.30), maxOutput: "32K", capabilities: ["chat", "code"], speed: "fast", quality: "standard", new: true },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "Meta", providerColor: "#0668E1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.18, outputPrice: 0.36, inputPriceRp: usdToRp(0.18), outputPriceRp: usdToRp(0.36), maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },

  // Mistral
  { id: "mistral-large", name: "Mistral Large", provider: "Mistral", providerColor: "#f97316", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.00, outputPrice: 6.00, inputPriceRp: usdToRp(2.00), outputPriceRp: usdToRp(6.00), maxOutput: "8K", capabilities: ["chat", "code", "analysis"], speed: "medium", quality: "high" },
  { id: "mistral-small", name: "Mistral Small", provider: "Mistral", providerColor: "#f97316", category: "Chat", contextWindow: "32K", contextTokens: 32000, inputPrice: 0.20, outputPrice: 0.60, inputPriceRp: usdToRp(0.20), outputPriceRp: usdToRp(0.60), maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "standard" },
  { id: "codestral", name: "Codestral", provider: "Mistral", providerColor: "#f97316", category: "Code", contextWindow: "256K", contextTokens: 256000, inputPrice: 0.30, outputPrice: 0.90, inputPriceRp: usdToRp(0.30), outputPriceRp: usdToRp(0.90), maxOutput: "8K", capabilities: ["code", "analysis"], speed: "fast", quality: "high" },

  // DeepSeek
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", providerColor: "#6366f1", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.55, outputPrice: 2.19, inputPriceRp: usdToRp(0.55), outputPriceRp: usdToRp(2.19), maxOutput: "8K", capabilities: ["reasoning", "math", "code", "analysis"], speed: "medium", quality: "premium", popular: true },
  { id: "deepseek-v3", name: "DeepSeek V3", provider: "DeepSeek", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.27, outputPrice: 1.10, inputPriceRp: usdToRp(0.27), outputPriceRp: usdToRp(1.10), maxOutput: "8K", capabilities: ["chat", "code", "analysis"], speed: "fast", quality: "high" },

  // xAI
  { id: "grok-3", name: "Grok 3", provider: "xAI", providerColor: "#ef4444", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 3.00, outputPrice: 15.00, inputPriceRp: usdToRp(3.00), outputPriceRp: usdToRp(15.00), maxOutput: "16K", capabilities: ["chat", "code", "analysis", "reasoning"], speed: "medium", quality: "premium", new: true },
  { id: "grok-3-mini", name: "Grok 3 Mini", provider: "xAI", providerColor: "#ef4444", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.30, outputPrice: 0.50, inputPriceRp: usdToRp(0.30), outputPriceRp: usdToRp(0.50), maxOutput: "16K", capabilities: ["chat", "code"], speed: "fast", quality: "standard" },

  // Cohere
  { id: "command-a", name: "Command A", provider: "Cohere", providerColor: "#39d98a", category: "Chat", contextWindow: "256K", contextTokens: 256000, inputPrice: 2.50, outputPrice: 10.00, inputPriceRp: usdToRp(2.50), outputPriceRp: usdToRp(10.00), maxOutput: "8K", capabilities: ["chat", "code", "analysis", "rag"], speed: "medium", quality: "high" },
  { id: "command-r-plus", name: "Command R+", provider: "Cohere", providerColor: "#39d98a", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.50, outputPrice: 10.00, inputPriceRp: usdToRp(2.50), outputPriceRp: usdToRp(10.00), maxOutput: "4K", capabilities: ["chat", "rag", "analysis"], speed: "medium", quality: "high" },

  // Groq (Cheap Tier)
  { id: "groq/llama-4-maverick", name: "Llama 4 Maverick", provider: "Groq", providerColor: "#f55036", category: "Chat", contextWindow: "128K", contextTokens: 131072, inputPrice: 0.20, outputPrice: 0.60, inputPriceRp: usdToRp(0.20), outputPriceRp: usdToRp(0.60), maxOutput: "8K", capabilities: ["chat", "code"], speed: "ultra", quality: "high" },
  { id: "groq/llama-4-scout", name: "Llama 4 Scout", provider: "Groq", providerColor: "#f55036", category: "Chat", contextWindow: "128K", contextTokens: 131072, inputPrice: 0.10, outputPrice: 0.30, inputPriceRp: usdToRp(0.10), outputPriceRp: usdToRp(0.30), maxOutput: "8K", capabilities: ["chat", "code"], speed: "ultra", quality: "standard" },
  { id: "groq/gemma2-9b", name: "Gemma 2 9B", provider: "Groq", providerColor: "#f55036", category: "Chat", contextWindow: "8K", contextTokens: 8192, inputPrice: 0.20, outputPrice: 0.20, inputPriceRp: usdToRp(0.20), outputPriceRp: usdToRp(0.20), maxOutput: "8K", capabilities: ["chat"], speed: "ultra", quality: "standard" },

  // Together AI (Cheap Tier)
  { id: "together/qwen-2.5-72b", name: "Qwen 2.5 72B", provider: "Together", providerColor: "#0ea5e9", category: "Chat", contextWindow: "128K", contextTokens: 131072, inputPrice: 0.60, outputPrice: 0.60, inputPriceRp: usdToRp(0.60), outputPriceRp: usdToRp(0.60), maxOutput: "8K", capabilities: ["chat", "code", "analysis"], speed: "fast", quality: "high" },

  // Fireworks AI (Cheap Tier)
  { id: "fw/llama-4-maverick", name: "Llama 4 Maverick", provider: "Fireworks", providerColor: "#ef4444", category: "Chat", contextWindow: "128K", contextTokens: 131072, inputPrice: 0.20, outputPrice: 0.60, inputPriceRp: usdToRp(0.20), outputPriceRp: usdToRp(0.60), maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "fw/qwen-2.5-72b", name: "Qwen 2.5 72B", provider: "Fireworks", providerColor: "#ef4444", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0.90, outputPrice: 0.90, inputPriceRp: usdToRp(0.90), outputPriceRp: usdToRp(0.90), maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },

  // Pollinations (Free)
  { id: "pol/openai", name: "OpenAI (Free)", provider: "Pollinations", providerColor: "#22c55e", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "medium", quality: "standard", popular: true },
  { id: "pol/claude", name: "Claude (Free)", provider: "Pollinations", providerColor: "#22c55e", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "medium", quality: "standard" },

  // Cloudflare (Free)
  { id: "cf/llama-3.3-70b", name: "Llama 3.3 70B", provider: "Cloudflare", providerColor: "#f48120", category: "Chat", contextWindow: "128K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },

  // HuggingFace (Free)
  { id: "hf/qwen-2.5-72b", name: "Qwen 2.5 72B", provider: "HuggingFace", providerColor: "#ffd21e", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "high" },

  // Cerebras (Free)
  { id: "cb/llama-3.3-70b", name: "Llama 3.3 70B", provider: "Cerebras", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "ultra", quality: "high" },
  { id: "cb/llama-4-scout", name: "Llama 4 Scout", provider: "Cerebras", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "ultra", quality: "standard" },

  // NVIDIA NIM (Free)
  { id: "nv/llama-3.3-70b", name: "Llama 3.3 70B", provider: "NVIDIA", providerColor: "#76b900", category: "Chat", contextWindow: "128K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "nv/mistral-large", name: "Mistral Large", provider: "NVIDIA", providerColor: "#76b900", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code", "analysis"], speed: "fast", quality: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: 200+ PROVIDERS
  // ═══════════════════════════════════════════════════════════════
  // Azure OpenAI
  { id: "azure/gpt-4o", name: "GPT-4o (Azure)", provider: "Azure OpenAI", providerColor: "#0078d4", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.5, outputPrice: 10.0, inputPriceRp: usdToRp(2.5), outputPriceRp: usdToRp(10.0), maxOutput: "8K", capabilities: ["chat", "vision", "code"], speed: "fast", quality: "premium" },
  { id: "azure/gpt-4o-mini", name: "GPT-4o Mini (Azure)", provider: "Azure OpenAI", providerColor: "#0078d4", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.15, outputPrice: 0.6, inputPriceRp: usdToRp(0.15), outputPriceRp: usdToRp(0.6), maxOutput: "4K", capabilities: ["chat", "vision", "code"], speed: "fast", quality: "standard" },
  { id: "azure/gpt-4.1", name: "GPT-4.1 (Azure)", provider: "Azure OpenAI", providerColor: "#0078d4", category: "Chat", contextWindow: "1.0M", contextTokens: 1048576, inputPrice: 2.0, outputPrice: 8.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(8.0), maxOutput: "8K", capabilities: ["chat", "vision", "code", "analysis"], speed: "fast", quality: "premium" },
  // Google Vertex AI
  { id: "vertex/gemini-2.5-pro", name: "Gemini 2.5 Pro (Vertex)", provider: "Google Vertex AI", providerColor: "#4285f4", category: "Chat", contextWindow: "1.0M", contextTokens: 1048576, inputPrice: 1.25, outputPrice: 10.0, inputPriceRp: usdToRp(1.25), outputPriceRp: usdToRp(10.0), maxOutput: "8K", capabilities: ["chat", "vision", "code", "analysis"], speed: "fast", quality: "premium" },
  { id: "vertex/gemini-2.5-flash", name: "Gemini 2.5 Flash (Vertex)", provider: "Google Vertex AI", providerColor: "#4285f4", category: "Chat", contextWindow: "1.0M", contextTokens: 1048576, inputPrice: 0.15, outputPrice: 0.6, inputPriceRp: usdToRp(0.15), outputPriceRp: usdToRp(0.6), maxOutput: "4K", capabilities: ["chat", "vision", "code"], speed: "fast", quality: "standard" },
  { id: "vertex/claude-sonnet-4", name: "Claude Sonnet 4 (Vertex)", provider: "Google Vertex AI", providerColor: "#4285f4", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 3.0, outputPrice: 15.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(15.0), maxOutput: "8K", capabilities: ["chat", "code", "analysis"], speed: "fast", quality: "premium" },
  // AWS Bedrock
  { id: "bedrock/claude-sonnet-4", name: "Claude Sonnet 4 (Bedrock)", provider: "AWS Bedrock", providerColor: "#ff9900", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 3.0, outputPrice: 15.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(15.0), maxOutput: "8K", capabilities: ["chat", "code", "analysis"], speed: "fast", quality: "premium" },
  { id: "bedrock/claude-haiku-3.5", name: "Claude 3.5 Haiku (Bedrock)", provider: "AWS Bedrock", providerColor: "#ff9900", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 0.8, outputPrice: 4.0, inputPriceRp: usdToRp(0.8), outputPriceRp: usdToRp(4.0), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "bedrock/llama-4-maverick", name: "Llama 4 Maverick (Bedrock)", provider: "AWS Bedrock", providerColor: "#ff9900", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.2, outputPrice: 0.6, inputPriceRp: usdToRp(0.2), outputPriceRp: usdToRp(0.6), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "bedrock/titan-premier", name: "Amazon Titan Premier", provider: "AWS Bedrock", providerColor: "#ff9900", category: "Chat", contextWindow: "32K", contextTokens: 32000, inputPrice: 0.5, outputPrice: 1.5, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(1.5), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "standard" },
  // AI21 Labs
  { id: "ai21/jamba-1.5-large", name: "Jamba 1.5 Large", provider: "AI21 Labs", providerColor: "#6c5ce7", category: "Chat", contextWindow: "256K", contextTokens: 256000, inputPrice: 2.0, outputPrice: 8.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(8.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "medium", quality: "high" },
  { id: "ai21/jamba-1.5-mini", name: "Jamba 1.5 Mini", provider: "AI21 Labs", providerColor: "#6c5ce7", category: "Chat", contextWindow: "256K", contextTokens: 256000, inputPrice: 0.2, outputPrice: 0.4, inputPriceRp: usdToRp(0.2), outputPriceRp: usdToRp(0.4), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // Aleph Alpha
  { id: "aleph/luminous-supreme", name: "Luminous Supreme", provider: "Aleph Alpha", providerColor: "#1a1a2e", category: "Chat", contextWindow: "32K", contextTokens: 32000, inputPrice: 6.0, outputPrice: 18.0, inputPriceRp: usdToRp(6.0), outputPriceRp: usdToRp(18.0), maxOutput: "8K", capabilities: ["chat", "analysis"], speed: "medium", quality: "premium" },
  { id: "aleph/luminous-extended", name: "Luminous Extended", provider: "Aleph Alpha", providerColor: "#1a1a2e", category: "Chat", contextWindow: "32K", contextTokens: 32000, inputPrice: 2.0, outputPrice: 6.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(6.0), maxOutput: "4K", capabilities: ["chat"], speed: "medium", quality: "high" },
  // Reka AI
  { id: "reka/reka-core", name: "Reka Core", provider: "Reka AI", providerColor: "#ff6b6b", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 3.0, outputPrice: 15.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(15.0), maxOutput: "8K", capabilities: ["chat", "vision", "code"], speed: "medium", quality: "premium" },
  { id: "reka/reka-flash", name: "Reka Flash", provider: "Reka AI", providerColor: "#ff6b6b", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.4, outputPrice: 1.0, inputPriceRp: usdToRp(0.4), outputPriceRp: usdToRp(1.0), maxOutput: "4K", capabilities: ["chat", "vision"], speed: "fast", quality: "high" },
  { id: "reka/reka-edge", name: "Reka Edge", provider: "Reka AI", providerColor: "#ff6b6b", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.1, outputPrice: 0.4, inputPriceRp: usdToRp(0.1), outputPriceRp: usdToRp(0.4), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // Writer
  { id: "writer/palmyra-x-004", name: "Palmyra X 004", provider: "Writer", providerColor: "#7c3aed", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 5.0, outputPrice: 15.0, inputPriceRp: usdToRp(5.0), outputPriceRp: usdToRp(15.0), maxOutput: "8K", capabilities: ["chat", "analysis", "creative"], speed: "medium", quality: "premium" },
  { id: "writer/palmyra-creative", name: "Palmyra Creative", provider: "Writer", providerColor: "#7c3aed", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 3.0, outputPrice: 10.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(10.0), maxOutput: "4K", capabilities: ["chat", "creative"], speed: "medium", quality: "high" },
  // Inflection AI
  { id: "inflection/pi-3.5", name: "Pi 3.5", provider: "Inflection AI", providerColor: "#f472b6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.0, outputPrice: 8.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(8.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  // Perplexity
  { id: "pplx/sonar-pro", name: "Sonar Pro", provider: "Perplexity", providerColor: "#22d3ee", category: "Search", contextWindow: "200K", contextTokens: 200000, inputPrice: 3.0, outputPrice: 15.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(15.0), maxOutput: "8K", capabilities: ["chat", "search", "analysis"], speed: "fast", quality: "premium" },
  { id: "pplx/sonar", name: "Sonar", provider: "Perplexity", providerColor: "#22d3ee", category: "Search", contextWindow: "127K", contextTokens: 127000, inputPrice: 1.0, outputPrice: 1.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(1.0), maxOutput: "4K", capabilities: ["chat", "search"], speed: "fast", quality: "high" },
  { id: "pplx/sonar-reasoning-pro", name: "Sonar Reasoning Pro", provider: "Perplexity", providerColor: "#22d3ee", category: "Reasoning", contextWindow: "127K", contextTokens: 127000, inputPrice: 2.0, outputPrice: 8.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(8.0), maxOutput: "8K", capabilities: ["reasoning", "search"], speed: "medium", quality: "premium" },
  // Baidu (ERNIE)
  { id: "ernie/ernie-4.5", name: "ERNIE 4.5", provider: "Baidu (ERNIE)", providerColor: "#2932e1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.0, outputPrice: 6.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(6.0), maxOutput: "8K", capabilities: ["chat", "analysis"], speed: "fast", quality: "premium" },
  { id: "ernie/ernie-4.0-turbo", name: "ERNIE 4.0 Turbo", provider: "Baidu (ERNIE)", providerColor: "#2932e1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 1.0, outputPrice: 3.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "high" },
  { id: "ernie/ernie-speed", name: "ERNIE Speed", provider: "Baidu (ERNIE)", providerColor: "#2932e1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.1, outputPrice: 0.3, inputPriceRp: usdToRp(0.1), outputPriceRp: usdToRp(0.3), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // Zhipu AI (GLM)
  { id: "glm/glm-4-plus", name: "GLM-4 Plus", provider: "Zhipu AI (GLM)", providerColor: "#4f46e5", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.0, outputPrice: 6.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(6.0), maxOutput: "8K", capabilities: ["chat", "analysis", "vision"], speed: "fast", quality: "premium" },
  { id: "glm/glm-4-flash", name: "GLM-4 Flash", provider: "Zhipu AI (GLM)", providerColor: "#4f46e5", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.1, outputPrice: 0.1, inputPriceRp: usdToRp(0.1), outputPriceRp: usdToRp(0.1), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  { id: "glm/glm-4-long", name: "GLM-4 Long", provider: "Zhipu AI (GLM)", providerColor: "#4f46e5", category: "Chat", contextWindow: "1M", contextTokens: 1000000, inputPrice: 1.0, outputPrice: 1.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(1.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "medium", quality: "high" },
  // Moonshot AI (Kimi)
  { id: "kimi/moonshot-v1-128k", name: "Moonshot V1 128K", provider: "Moonshot AI (Kimi)", providerColor: "#fbbf24", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 1.5, outputPrice: 3.0, inputPriceRp: usdToRp(1.5), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  { id: "kimi/moonshot-v1-32k", name: "Moonshot V1 32K", provider: "Moonshot AI (Kimi)", providerColor: "#fbbf24", category: "Chat", contextWindow: "32K", contextTokens: 32000, inputPrice: 0.5, outputPrice: 1.0, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(1.0), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // 01.AI (Yi)
  { id: "yi/yi-lightning", name: "Yi Lightning", provider: "01.AI (Yi)", providerColor: "#10b981", category: "Chat", contextWindow: "16K", contextTokens: 16384, inputPrice: 0.99, outputPrice: 0.99, inputPriceRp: usdToRp(0.99), outputPriceRp: usdToRp(0.99), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "yi/yi-large", name: "Yi Large", provider: "01.AI (Yi)", providerColor: "#10b981", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 3.0, outputPrice: 9.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(9.0), maxOutput: "8K", capabilities: ["chat", "analysis"], speed: "medium", quality: "premium" },
  // MiniMax
  { id: "minimax/abab-6.5s", name: "ABAB 6.5s", provider: "MiniMax", providerColor: "#ec4899", category: "Chat", contextWindow: "245K", contextTokens: 245760, inputPrice: 1.0, outputPrice: 3.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  { id: "minimax/abab-6.5t", name: "ABAB 6.5t Chat", provider: "MiniMax", providerColor: "#ec4899", category: "Chat", contextWindow: "8K", contextTokens: 8192, inputPrice: 0.5, outputPrice: 1.0, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(1.0), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // Baichuan AI
  { id: "baichuan/baichuan4", name: "Baichuan 4", provider: "Baichuan AI", providerColor: "#06b6d4", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.0, outputPrice: 6.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(6.0), maxOutput: "8K", capabilities: ["chat", "analysis"], speed: "fast", quality: "premium" },
  { id: "baichuan/baichuan3-turbo", name: "Baichuan 3 Turbo", provider: "Baichuan AI", providerColor: "#06b6d4", category: "Chat", contextWindow: "32K", contextTokens: 32000, inputPrice: 0.5, outputPrice: 1.0, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(1.0), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "high" },
  // StepFun (Step)
  { id: "step/step-2-16k", name: "Step 2 16K", provider: "StepFun (Step)", providerColor: "#8b5cf6", category: "Chat", contextWindow: "16K", contextTokens: 16384, inputPrice: 1.5, outputPrice: 5.0, inputPriceRp: usdToRp(1.5), outputPriceRp: usdToRp(5.0), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "step/step-1-flash", name: "Step 1 Flash", provider: "StepFun (Step)", providerColor: "#8b5cf6", category: "Chat", contextWindow: "8K", contextTokens: 8192, inputPrice: 0.2, outputPrice: 0.5, inputPriceRp: usdToRp(0.2), outputPriceRp: usdToRp(0.5), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // Alibaba Cloud (Qwen)
  { id: "qwen/qwen-max", name: "Qwen Max", provider: "Alibaba Cloud (Qwen)", providerColor: "#ff6a00", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 2.0, outputPrice: 6.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(6.0), maxOutput: "8K", capabilities: ["chat", "code", "analysis"], speed: "fast", quality: "premium" },
  { id: "qwen/qwen-plus", name: "Qwen Plus", provider: "Alibaba Cloud (Qwen)", providerColor: "#ff6a00", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.5, outputPrice: 1.5, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(1.5), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "qwen/qwen-turbo", name: "Qwen Turbo", provider: "Alibaba Cloud (Qwen)", providerColor: "#ff6a00", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.1, outputPrice: 0.3, inputPriceRp: usdToRp(0.1), outputPriceRp: usdToRp(0.3), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  { id: "qwen/qwen-long", name: "Qwen Long", provider: "Alibaba Cloud (Qwen)", providerColor: "#ff6a00", category: "Chat", contextWindow: "10M", contextTokens: 10000000, inputPrice: 0.5, outputPrice: 2.0, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(2.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "medium", quality: "high" },
  // ByteDance (Doubao)
  { id: "doubao/doubao-pro-128k", name: "Doubao Pro 128K", provider: "ByteDance (Doubao)", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 1.0, outputPrice: 3.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  { id: "doubao/doubao-lite-128k", name: "Doubao Lite 128K", provider: "ByteDance (Doubao)", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.1, outputPrice: 0.3, inputPriceRp: usdToRp(0.1), outputPriceRp: usdToRp(0.3), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // SenseTime (SenseNova)
  { id: "sensenova/sensenova-5", name: "SenseNova 5", provider: "SenseTime (SenseNova)", providerColor: "#ef4444", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.0, outputPrice: 6.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(6.0), maxOutput: "8K", capabilities: ["chat", "vision", "analysis"], speed: "fast", quality: "premium" },
  // iFlytek (Spark)
  { id: "spark/spark-pro", name: "Spark Pro", provider: "iFlytek (Spark)", providerColor: "#14b8a6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 1.0, outputPrice: 3.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  { id: "spark/spark-lite", name: "Spark Lite", provider: "iFlytek (Spark)", providerColor: "#14b8a6", category: "Chat", contextWindow: "4K", contextTokens: 4096, inputPrice: 0.1, outputPrice: 0.1, inputPriceRp: usdToRp(0.1), outputPriceRp: usdToRp(0.1), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // OpenRouter
  { id: "or/auto", name: "Auto (Best)", provider: "OpenRouter", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  { id: "or/openai/gpt-4o", name: "GPT-4o (OR)", provider: "OpenRouter", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 2.5, outputPrice: 10.0, inputPriceRp: usdToRp(2.5), outputPriceRp: usdToRp(10.0), maxOutput: "8K", capabilities: ["chat", "vision", "code"], speed: "fast", quality: "premium" },
  { id: "or/anthropic/claude-sonnet-4", name: "Claude Sonnet 4 (OR)", provider: "OpenRouter", providerColor: "#6366f1", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 3.0, outputPrice: 15.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(15.0), maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  { id: "or/google/gemini-2.5-flash", name: "Gemini 2.5 Flash (OR)", provider: "OpenRouter", providerColor: "#6366f1", category: "Chat", contextWindow: "1.0M", contextTokens: 1048576, inputPrice: 0.15, outputPrice: 0.6, inputPriceRp: usdToRp(0.15), outputPriceRp: usdToRp(0.6), maxOutput: "4K", capabilities: ["chat", "vision"], speed: "fast", quality: "standard" },
  // Databricks (DBRX)
  { id: "dbrx/dbrx-instruct", name: "DBRX Instruct", provider: "Databricks (DBRX)", providerColor: "#ff3621", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 2.25, outputPrice: 6.75, inputPriceRp: usdToRp(2.25), outputPriceRp: usdToRp(6.75), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "dbrx/meta-llama-3.3-70b", name: "Llama 3.3 70B (DBRX)", provider: "Databricks (DBRX)", providerColor: "#ff3621", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 1.0, outputPrice: 1.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(1.0), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Snowflake (Arctic)
  { id: "snow/arctic-instruct", name: "Arctic Instruct", provider: "Snowflake (Arctic)", providerColor: "#29b5e8", category: "Chat", contextWindow: "4K", contextTokens: 4096, inputPrice: 0.24, outputPrice: 0.24, inputPriceRp: usdToRp(0.24), outputPriceRp: usdToRp(0.24), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // SambaNova
  { id: "sn/llama-3.3-70b", name: "Llama 3.3 70B (SN)", provider: "SambaNova", providerColor: "#ff4500", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.6, outputPrice: 0.6, inputPriceRp: usdToRp(0.6), outputPriceRp: usdToRp(0.6), maxOutput: "4K", capabilities: ["chat", "code"], speed: "ultra", quality: "high" },
  { id: "sn/qwen-2.5-72b", name: "Qwen 2.5 72B (SN)", provider: "SambaNova", providerColor: "#ff4500", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.6, outputPrice: 0.6, inputPriceRp: usdToRp(0.6), outputPriceRp: usdToRp(0.6), maxOutput: "4K", capabilities: ["chat", "code"], speed: "ultra", quality: "high" },
  // DeepInfra
  { id: "di/llama-3.3-70b", name: "Llama 3.3 70B (DI)", provider: "DeepInfra", providerColor: "#6366f1", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.35, outputPrice: 0.4, inputPriceRp: usdToRp(0.35), outputPriceRp: usdToRp(0.4), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "di/qwen-2.5-72b", name: "Qwen 2.5 72B (DI)", provider: "DeepInfra", providerColor: "#6366f1", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.35, outputPrice: 0.4, inputPriceRp: usdToRp(0.35), outputPriceRp: usdToRp(0.4), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "di/mistral-nemo", name: "Mistral Nemo (DI)", provider: "DeepInfra", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.07, outputPrice: 0.07, inputPriceRp: usdToRp(0.07), outputPriceRp: usdToRp(0.07), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  { id: "di/wizardlm-2-8x22b", name: "WizardLM 2 8x22B (DI)", provider: "DeepInfra", providerColor: "#6366f1", category: "Chat", contextWindow: "65K", contextTokens: 65536, inputPrice: 0.65, outputPrice: 0.65, inputPriceRp: usdToRp(0.65), outputPriceRp: usdToRp(0.65), maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "high" },
  // Novita AI
  { id: "novita/llama-3.3-70b", name: "Llama 3.3 70B (Novita)", provider: "Novita AI", providerColor: "#f59e0b", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.39, outputPrice: 0.39, inputPriceRp: usdToRp(0.39), outputPriceRp: usdToRp(0.39), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "novita/deepseek-r1", name: "DeepSeek R1 (Novita)", provider: "Novita AI", providerColor: "#f59e0b", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.55, outputPrice: 2.19, inputPriceRp: usdToRp(0.55), outputPriceRp: usdToRp(2.19), maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "slow", quality: "premium" },
  // SiliconFlow
  { id: "sf/qwen-2.5-72b", name: "Qwen 2.5 72B (SF)", provider: "SiliconFlow", providerColor: "#3b82f6", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.28, outputPrice: 0.28, inputPriceRp: usdToRp(0.28), outputPriceRp: usdToRp(0.28), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "sf/deepseek-v3", name: "DeepSeek V3 (SF)", provider: "SiliconFlow", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.14, outputPrice: 0.28, inputPriceRp: usdToRp(0.14), outputPriceRp: usdToRp(0.28), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "sf/glm-4-9b", name: "GLM-4 9B (SF)", provider: "SiliconFlow", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // Featherless AI
  { id: "fl/qwen-2.5-72b", name: "Qwen 2.5 72B (FL)", provider: "Featherless AI", providerColor: "#a78bfa", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.2, outputPrice: 0.2, inputPriceRp: usdToRp(0.2), outputPriceRp: usdToRp(0.2), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "fl/llama-3.3-70b", name: "Llama 3.3 70B (FL)", provider: "Featherless AI", providerColor: "#a78bfa", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.2, outputPrice: 0.2, inputPriceRp: usdToRp(0.2), outputPriceRp: usdToRp(0.2), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Hyperbolic
  { id: "hyp/llama-3.3-70b", name: "Llama 3.3 70B (Hyp)", provider: "Hyperbolic", providerColor: "#818cf8", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.4, outputPrice: 0.4, inputPriceRp: usdToRp(0.4), outputPriceRp: usdToRp(0.4), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "hyp/qwen-2.5-72b", name: "Qwen 2.5 72B (Hyp)", provider: "Hyperbolic", providerColor: "#818cf8", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.4, outputPrice: 0.4, inputPriceRp: usdToRp(0.4), outputPriceRp: usdToRp(0.4), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "hyp/deepseek-v3", name: "DeepSeek V3 (Hyp)", provider: "Hyperbolic", providerColor: "#818cf8", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.2, outputPrice: 0.2, inputPriceRp: usdToRp(0.2), outputPriceRp: usdToRp(0.2), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Replicate
  { id: "rep/llama-3.3-70b", name: "Llama 3.3 70B (Replicate)", provider: "Replicate", providerColor: "#2563eb", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.65, outputPrice: 2.75, inputPriceRp: usdToRp(0.65), outputPriceRp: usdToRp(2.75), maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "high" },
  { id: "rep/mixtral-8x7b", name: "Mixtral 8x7B (Replicate)", provider: "Replicate", providerColor: "#2563eb", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0.3, outputPrice: 1.0, inputPriceRp: usdToRp(0.3), outputPriceRp: usdToRp(1.0), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Baseten
  { id: "baseten/llama-3.3-70b", name: "Llama 3.3 70B (Baseten)", provider: "Baseten", providerColor: "#10b981", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.6, outputPrice: 0.6, inputPriceRp: usdToRp(0.6), outputPriceRp: usdToRp(0.6), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Modal
  { id: "modal/llama-3.3-70b", name: "Llama 3.3 70B (Modal)", provider: "Modal", providerColor: "#22c55e", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.59, outputPrice: 0.79, inputPriceRp: usdToRp(0.59), outputPriceRp: usdToRp(0.79), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Lepton AI
  { id: "lepton/llama-3.3-70b", name: "Llama 3.3 70B (Lepton)", provider: "Lepton AI", providerColor: "#f97316", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.5, outputPrice: 0.5, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(0.5), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "lepton/mixtral-8x7b", name: "Mixtral 8x7B (Lepton)", provider: "Lepton AI", providerColor: "#f97316", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0.25, outputPrice: 0.25, inputPriceRp: usdToRp(0.25), outputPriceRp: usdToRp(0.25), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Anyscale
  { id: "anyscale/llama-3.3-70b", name: "Llama 3.3 70B (Anyscale)", provider: "Anyscale", providerColor: "#3b82f6", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.5, outputPrice: 0.5, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(0.5), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "anyscale/mixtral-8x22b", name: "Mixtral 8x22B (Anyscale)", provider: "Anyscale", providerColor: "#3b82f6", category: "Chat", contextWindow: "65K", contextTokens: 65536, inputPrice: 0.9, outputPrice: 0.9, inputPriceRp: usdToRp(0.9), outputPriceRp: usdToRp(0.9), maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "high" },
  // Lambda Labs
  { id: "lambda/llama-3.3-70b", name: "Llama 3.3 70B (Lambda)", provider: "Lambda Labs", providerColor: "#7c3aed", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.55, outputPrice: 0.55, inputPriceRp: usdToRp(0.55), outputPriceRp: usdToRp(0.55), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // RunPod Serverless
  { id: "runpod/llama-3.3-70b", name: "Llama 3.3 70B (RunPod)", provider: "RunPod Serverless", providerColor: "#a855f7", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.44, outputPrice: 0.44, inputPriceRp: usdToRp(0.44), outputPriceRp: usdToRp(0.44), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "runpod/qwen-2.5-72b", name: "Qwen 2.5 72B (RunPod)", provider: "RunPod Serverless", providerColor: "#a855f7", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.44, outputPrice: 0.44, inputPriceRp: usdToRp(0.44), outputPriceRp: usdToRp(0.44), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Vast.ai
  { id: "vast/llama-3.3-70b", name: "Llama 3.3 70B (Vast)", provider: "Vast.ai", providerColor: "#6ee7b7", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.3, outputPrice: 0.3, inputPriceRp: usdToRp(0.3), outputPriceRp: usdToRp(0.3), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Akash Network
  { id: "akash/llama-3.3-70b", name: "Llama 3.3 70B (Akash)", provider: "Akash Network", providerColor: "#ef4444", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "akash/deepseek-r1", name: "DeepSeek R1 (Akash)", provider: "Akash Network", providerColor: "#ef4444", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["reasoning", "code"], speed: "slow", quality: "high" },
  // Crusoe Cloud
  { id: "crusoe/llama-3.3-70b", name: "Llama 3.3 70B (Crusoe)", provider: "Crusoe Cloud", providerColor: "#0ea5e9", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.45, outputPrice: 0.45, inputPriceRp: usdToRp(0.45), outputPriceRp: usdToRp(0.45), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "crusoe/deepseek-r1", name: "DeepSeek R1 (Crusoe)", provider: "Crusoe Cloud", providerColor: "#0ea5e9", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.45, outputPrice: 1.8, inputPriceRp: usdToRp(0.45), outputPriceRp: usdToRp(1.8), maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "slow", quality: "premium" },
  // Ollama (Local)
  { id: "ollama/llama-3.3", name: "Llama 3.3 (Local)", provider: "Ollama (Local)", providerColor: "#ffffff", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "high" },
  { id: "ollama/qwen-2.5", name: "Qwen 2.5 (Local)", provider: "Ollama (Local)", providerColor: "#ffffff", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "high" },
  { id: "ollama/deepseek-r1", name: "DeepSeek R1 (Local)", provider: "Ollama (Local)", providerColor: "#ffffff", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["reasoning", "code"], speed: "slow", quality: "high" },
  { id: "ollama/gemma2", name: "Gemma 2 (Local)", provider: "Ollama (Local)", providerColor: "#ffffff", category: "Chat", contextWindow: "8K", contextTokens: 8192, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  { id: "ollama/phi-4", name: "Phi-4 (Local)", provider: "Ollama (Local)", providerColor: "#ffffff", category: "Chat", contextWindow: "16K", contextTokens: 16384, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // LM Studio (Local)
  { id: "lms/any-model", name: "Any Local Model", provider: "LM Studio (Local)", providerColor: "#1e293b", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "high" },
  // Jan (Local)
  { id: "jan/any-model", name: "Any Local Model (Jan)", provider: "Jan (Local)", providerColor: "#3b82f6", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "high" },
  // GPT4All (Local)
  { id: "g4a/any-model", name: "Any Local Model (GPT4All)", provider: "GPT4All (Local)", providerColor: "#22c55e", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "medium", quality: "standard" },
  // llama.cpp Server
  { id: "lcpp/any-model", name: "Any GGUF Model", provider: "llama.cpp Server", providerColor: "#f59e0b", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "high" },
  // vLLM Server
  { id: "vllm/any-model", name: "Any vLLM Model", provider: "vLLM Server", providerColor: "#8b5cf6", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // TGI (HuggingFace)
  { id: "tgi/any-model", name: "Any TGI Model", provider: "TGI (HuggingFace)", providerColor: "#fbbf24", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // LocalAI
  { id: "localai/any-model", name: "Any LocalAI Model", provider: "LocalAI", providerColor: "#10b981", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "medium", quality: "standard" },
  // KoboldCpp (Local)
  { id: "kobold/any-model", name: "Any KoboldCpp Model", provider: "KoboldCpp (Local)", providerColor: "#ef4444", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "creative"], speed: "medium", quality: "standard" },
  // TabbyAPI (Local)
  { id: "tabby/any-model", name: "Any TabbyAPI Model", provider: "TabbyAPI (Local)", providerColor: "#6366f1", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // LongCat (FREE)
  { id: "longcat/gpt-4o", name: "GPT-4o (LongCat)", provider: "LongCat (FREE)", providerColor: "#f97316", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "vision"], speed: "fast", quality: "premium" },
  { id: "longcat/claude-sonnet", name: "Claude Sonnet (LongCat)", provider: "LongCat (FREE)", providerColor: "#f97316", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // ChimeraGPT (FREE)
  { id: "chimera/gpt-4o", name: "GPT-4o (Chimera)", provider: "ChimeraGPT (FREE)", providerColor: "#ec4899", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat"], speed: "fast", quality: "premium" },
  { id: "chimera/claude-sonnet", name: "Claude Sonnet (Chimera)", provider: "ChimeraGPT (FREE)", providerColor: "#ec4899", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat"], speed: "fast", quality: "premium" },
  // FreedomGPT
  { id: "fgpt/liberty", name: "Liberty Model", provider: "FreedomGPT", providerColor: "#dc2626", category: "Chat", contextWindow: "8K", contextTokens: 8192, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "medium", quality: "standard" },
  // OpenFreeGPT
  { id: "ofg/gpt-4", name: "GPT-4 (Free)", provider: "OpenFreeGPT", providerColor: "#22c55e", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "medium", quality: "high" },
  // Perplexity Pro (Cookie)
  { id: "web/perplexity-pro", name: "Perplexity Pro (Web)", provider: "Perplexity Pro (Cookie)", providerColor: "#22d3ee", category: "Search", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "search"], speed: "fast", quality: "premium" },
  // Claude Web (Cookie)
  { id: "web/claude-sonnet-4", name: "Claude Sonnet 4 (Web)", provider: "Claude Web (Cookie)", providerColor: "#d97706", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code", "analysis", "vision"], speed: "fast", quality: "premium" },
  { id: "web/claude-opus-4", name: "Claude Opus 4 (Web)", provider: "Claude Web (Cookie)", providerColor: "#d97706", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code", "analysis"], speed: "slow", quality: "premium" },
  // Gemini Web (Cookie)
  { id: "web/gemini-2.5-pro", name: "Gemini 2.5 Pro (Web)", provider: "Gemini Web (Cookie)", providerColor: "#4285f4", category: "Chat", contextWindow: "1.0M", contextTokens: 1048576, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "vision", "analysis"], speed: "fast", quality: "premium" },
  // DeepSeek Web (Cookie)
  { id: "web/deepseek-r1", name: "DeepSeek R1 (Web)", provider: "DeepSeek Web (Cookie)", providerColor: "#6366f1", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "slow", quality: "premium" },
  { id: "web/deepseek-v3", name: "DeepSeek V3 (Web)", provider: "DeepSeek Web (Cookie)", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Poe (Cookie)
  { id: "poe/gpt-4o", name: "GPT-4o (Poe)", provider: "Poe (Cookie)", providerColor: "#7c3aed", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "vision"], speed: "fast", quality: "premium" },
  { id: "poe/claude-sonnet", name: "Claude Sonnet (Poe)", provider: "Poe (Cookie)", providerColor: "#7c3aed", category: "Chat", contextWindow: "200K", contextTokens: 200000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  { id: "poe/gemini-pro", name: "Gemini Pro (Poe)", provider: "Poe (Cookie)", providerColor: "#7c3aed", category: "Chat", contextWindow: "1.0M", contextTokens: 1048576, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "vision"], speed: "fast", quality: "premium" },
  // You.com (Cookie)
  { id: "you/smart", name: "You Smart", provider: "You.com (Cookie)", providerColor: "#3b82f6", category: "Search", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "search"], speed: "fast", quality: "premium" },
  // Phind (Cookie)
  { id: "phind/phind-70b", name: "Phind 70B", provider: "Phind (Cookie)", providerColor: "#22c55e", category: "Code", contextWindow: "32K", contextTokens: 32768, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code", "search"], speed: "fast", quality: "high" },
  // Cursor (OAuth)
  { id: "cursor/gpt-4o", name: "GPT-4o (Cursor)", provider: "Cursor (OAuth)", providerColor: "#0ea5e9", category: "Code", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  { id: "cursor/claude-sonnet-4", name: "Claude Sonnet 4 (Cursor)", provider: "Cursor (OAuth)", providerColor: "#0ea5e9", category: "Code", contextWindow: "200K", contextTokens: 200000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  { id: "cursor/cursor-small", name: "Cursor Small", provider: "Cursor (OAuth)", providerColor: "#0ea5e9", category: "Code", contextWindow: "16K", contextTokens: 16384, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["code"], speed: "fast", quality: "standard" },
  // Windsurf / Codeium (OAuth)
  { id: "windsurf/cascade", name: "Cascade", provider: "Windsurf / Codeium (OAuth)", providerColor: "#06b6d4", category: "Code", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // Bolt.new (OAuth)
  { id: "bolt/claude-sonnet-4", name: "Claude Sonnet 4 (Bolt)", provider: "Bolt.new (OAuth)", providerColor: "#f59e0b", category: "Code", contextWindow: "200K", contextTokens: 200000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["code", "chat"], speed: "fast", quality: "premium" },
  // v0.dev (OAuth)
  { id: "v0/v0-gen", name: "v0 Generator", provider: "v0.dev (OAuth)", providerColor: "#000000", category: "Code", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["code", "chat"], speed: "fast", quality: "premium" },
  // Replit AI (OAuth)
  { id: "replit/replit-agent", name: "Replit Agent", provider: "Replit AI (OAuth)", providerColor: "#f26207", category: "Code", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["code", "chat"], speed: "fast", quality: "premium" },
  // Sourcegraph Cody (OAuth)
  { id: "cody/claude-sonnet-4", name: "Claude Sonnet 4 (Cody)", provider: "Sourcegraph Cody (OAuth)", providerColor: "#ff5543", category: "Code", contextWindow: "200K", contextTokens: 200000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["code", "chat"], speed: "fast", quality: "premium" },
  { id: "cody/starcoder", name: "StarCoder (Cody)", provider: "Sourcegraph Cody (OAuth)", providerColor: "#ff5543", category: "Code", contextWindow: "8K", contextTokens: 8192, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["code"], speed: "fast", quality: "standard" },
  // Tabnine (OAuth)
  { id: "tabnine/protected", name: "Tabnine Protected", provider: "Tabnine (OAuth)", providerColor: "#6b7280", category: "Code", contextWindow: "8K", contextTokens: 8192, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["code"], speed: "ultra", quality: "high" },
  // Codeium (Free)
  { id: "codeium/autocomplete", name: "Codeium Autocomplete", provider: "Codeium (Free)", providerColor: "#09b6a2", category: "Code", contextWindow: "8K", contextTokens: 8192, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["code"], speed: "ultra", quality: "standard" },
  // Stability AI
  { id: "sd/stable-diffusion-3.5", name: "Stable Diffusion 3.5", provider: "Stability AI", providerColor: "#7c3aed", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 6.5, outputPrice: 0, inputPriceRp: usdToRp(6.5), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "medium", quality: "premium" },
  { id: "sd/sdxl-turbo", name: "SDXL Turbo", provider: "Stability AI", providerColor: "#7c3aed", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["image"], speed: "fast", quality: "high" },
  { id: "sd/stable-image-ultra", name: "Stable Image Ultra", provider: "Stability AI", providerColor: "#7c3aed", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 8.0, outputPrice: 0, inputPriceRp: usdToRp(8.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "slow", quality: "premium" },
  // Ideogram
  { id: "ideogram/v2-turbo", name: "Ideogram V2 Turbo", provider: "Ideogram", providerColor: "#f97316", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 5.0, outputPrice: 0, inputPriceRp: usdToRp(5.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "fast", quality: "premium" },
  { id: "ideogram/v2", name: "Ideogram V2", provider: "Ideogram", providerColor: "#f97316", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 8.0, outputPrice: 0, inputPriceRp: usdToRp(8.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "medium", quality: "premium" },
  // Midjourney
  { id: "mj/v6.1", name: "Midjourney V6.1", provider: "Midjourney", providerColor: "#0000ff", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 10.0, outputPrice: 0, inputPriceRp: usdToRp(10.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "slow", quality: "premium" },
  // Flux (BFL)
  { id: "flux/flux-1.1-pro", name: "Flux 1.1 Pro", provider: "Flux (BFL)", providerColor: "#000000", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 4.0, outputPrice: 0, inputPriceRp: usdToRp(4.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "fast", quality: "premium" },
  { id: "flux/flux-1-schnell", name: "Flux 1 Schnell", provider: "Flux (BFL)", providerColor: "#000000", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 0.3, outputPrice: 0, inputPriceRp: usdToRp(0.3), outputPriceRp: 0, maxOutput: "4K", capabilities: ["image"], speed: "fast", quality: "high" },
  // DALL·E (OpenAI)
  { id: "dalle/dall-e-3", name: "DALL·E 3", provider: "DALL·E (OpenAI)", providerColor: "#10a37f", category: "Image", contextWindow: "4K", contextTokens: 4000, inputPrice: 4.0, outputPrice: 0, inputPriceRp: usdToRp(4.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "medium", quality: "premium" },
  { id: "dalle/gpt-image-1", name: "GPT Image 1", provider: "DALL·E (OpenAI)", providerColor: "#10a37f", category: "Image", contextWindow: "32K", contextTokens: 32000, inputPrice: 5.0, outputPrice: 0, inputPriceRp: usdToRp(5.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "medium", quality: "premium" },
  // Leonardo AI
  { id: "leonardo/phoenix", name: "Leonardo Phoenix", provider: "Leonardo AI", providerColor: "#a855f7", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 5.0, outputPrice: 0, inputPriceRp: usdToRp(5.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "medium", quality: "premium" },
  { id: "leonardo/lightning-xl", name: "Lightning XL", provider: "Leonardo AI", providerColor: "#a855f7", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 1.0, outputPrice: 0, inputPriceRp: usdToRp(1.0), outputPriceRp: 0, maxOutput: "4K", capabilities: ["image"], speed: "fast", quality: "high" },
  // fal.ai
  { id: "fal/flux-pro", name: "Flux Pro (fal)", provider: "fal.ai", providerColor: "#3b82f6", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 3.5, outputPrice: 0, inputPriceRp: usdToRp(3.5), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["image"], speed: "fast", quality: "premium" },
  { id: "fal/flux-schnell", name: "Flux Schnell (fal)", provider: "fal.ai", providerColor: "#3b82f6", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 0.25, outputPrice: 0, inputPriceRp: usdToRp(0.25), outputPriceRp: 0, maxOutput: "4K", capabilities: ["image"], speed: "fast", quality: "high" },
  { id: "fal/aura-flow", name: "AuraFlow (fal)", provider: "fal.ai", providerColor: "#3b82f6", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 0.1, outputPrice: 0, inputPriceRp: usdToRp(0.1), outputPriceRp: 0, maxOutput: "4K", capabilities: ["image"], speed: "fast", quality: "standard" },
  // ElevenLabs
  { id: "eleven/eleven-turbo-v2.5", name: "Turbo v2.5 TTS", provider: "ElevenLabs", providerColor: "#000000", category: "Audio", contextWindow: "5K", contextTokens: 5000, inputPrice: 0.18, outputPrice: 0, inputPriceRp: usdToRp(0.18), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["tts"], speed: "fast", quality: "premium" },
  { id: "eleven/eleven-multilingual-v2", name: "Multilingual v2 TTS", provider: "ElevenLabs", providerColor: "#000000", category: "Audio", contextWindow: "5K", contextTokens: 5000, inputPrice: 0.24, outputPrice: 0, inputPriceRp: usdToRp(0.24), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["tts"], speed: "medium", quality: "premium" },
  // AssemblyAI
  { id: "assembly/universal-2", name: "Universal-2 STT", provider: "AssemblyAI", providerColor: "#0ea5e9", category: "Audio", contextWindow: "N/A", contextTokens: 0, inputPrice: 0.65, outputPrice: 0, inputPriceRp: usdToRp(0.65), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["stt"], speed: "fast", quality: "premium" },
  { id: "assembly/nano", name: "Nano STT", provider: "AssemblyAI", providerColor: "#0ea5e9", category: "Audio", contextWindow: "N/A", contextTokens: 0, inputPrice: 0.12, outputPrice: 0, inputPriceRp: usdToRp(0.12), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["stt"], speed: "fast", quality: "standard" },
  // OpenAI Audio
  { id: "oai/whisper-1", name: "Whisper v3 STT", provider: "OpenAI Audio", providerColor: "#10a37f", category: "Audio", contextWindow: "N/A", contextTokens: 0, inputPrice: 0.006, outputPrice: 0, inputPriceRp: usdToRp(0.006), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["stt"], speed: "fast", quality: "premium" },
  { id: "oai/tts-1-hd", name: "TTS-1 HD", provider: "OpenAI Audio", providerColor: "#10a37f", category: "Audio", contextWindow: "4K", contextTokens: 4096, inputPrice: 0.03, outputPrice: 0, inputPriceRp: usdToRp(0.03), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["tts"], speed: "medium", quality: "premium" },
  { id: "oai/tts-1", name: "TTS-1", provider: "OpenAI Audio", providerColor: "#10a37f", category: "Audio", contextWindow: "4K", contextTokens: 4096, inputPrice: 0.015, outputPrice: 0, inputPriceRp: usdToRp(0.015), outputPriceRp: 0, maxOutput: "4K", capabilities: ["tts"], speed: "fast", quality: "high" },
  // Deepgram
  { id: "dg/nova-2", name: "Nova-2 STT", provider: "Deepgram", providerColor: "#13ef93", category: "Audio", contextWindow: "N/A", contextTokens: 0, inputPrice: 0.36, outputPrice: 0, inputPriceRp: usdToRp(0.36), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["stt"], speed: "fast", quality: "premium" },
  { id: "dg/aura-asteria", name: "Aura Asteria TTS", provider: "Deepgram", providerColor: "#13ef93", category: "Audio", contextWindow: "2K", contextTokens: 2000, inputPrice: 0.015, outputPrice: 0, inputPriceRp: usdToRp(0.015), outputPriceRp: 0, maxOutput: "4K", capabilities: ["tts"], speed: "fast", quality: "high" },
  // Suno
  { id: "suno/v4", name: "Suno v4 Music", provider: "Suno", providerColor: "#f59e0b", category: "Audio", contextWindow: "3K", contextTokens: 3000, inputPrice: 5.0, outputPrice: 0, inputPriceRp: usdToRp(5.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["music"], speed: "slow", quality: "premium" },
  // Udio
  { id: "udio/v1.5", name: "Udio v1.5 Music", provider: "Udio", providerColor: "#3b82f6", category: "Audio", contextWindow: "3K", contextTokens: 3000, inputPrice: 5.0, outputPrice: 0, inputPriceRp: usdToRp(5.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["music"], speed: "slow", quality: "premium" },
  // Runway
  { id: "runway/gen-4", name: "Gen-4 Video", provider: "Runway", providerColor: "#0ea5e9", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 50.0, outputPrice: 0, inputPriceRp: usdToRp(50.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video"], speed: "slow", quality: "premium" },
  { id: "runway/gen-3a-turbo", name: "Gen-3a Turbo", provider: "Runway", providerColor: "#0ea5e9", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 25.0, outputPrice: 0, inputPriceRp: usdToRp(25.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video"], speed: "medium", quality: "premium" },
  // Pika
  { id: "pika/pika-2.2", name: "Pika 2.2 Video", provider: "Pika", providerColor: "#ec4899", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 20.0, outputPrice: 0, inputPriceRp: usdToRp(20.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video"], speed: "slow", quality: "premium" },
  // Luma AI
  { id: "luma/dream-machine", name: "Dream Machine", provider: "Luma AI", providerColor: "#6366f1", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 30.0, outputPrice: 0, inputPriceRp: usdToRp(30.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video"], speed: "slow", quality: "premium" },
  { id: "luma/ray-2", name: "Ray 2", provider: "Luma AI", providerColor: "#6366f1", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 30.0, outputPrice: 0, inputPriceRp: usdToRp(30.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video", "3d"], speed: "slow", quality: "premium" },
  // Kling AI
  { id: "kling/kling-1.6", name: "Kling 1.6 Video", provider: "Kling AI", providerColor: "#ff6b6b", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 20.0, outputPrice: 0, inputPriceRp: usdToRp(20.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video"], speed: "slow", quality: "premium" },
  // MiniMax (Hailuo)
  { id: "hailuo/i2v-01-director", name: "Hailuo Director", provider: "MiniMax (Hailuo)", providerColor: "#ec4899", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 20.0, outputPrice: 0, inputPriceRp: usdToRp(20.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video"], speed: "slow", quality: "premium" },
  // Google Veo
  { id: "veo/veo-3", name: "Veo 3", provider: "Google Veo", providerColor: "#4285f4", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 35.0, outputPrice: 0, inputPriceRp: usdToRp(35.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video"], speed: "slow", quality: "premium" },
  // Voyage AI
  { id: "voyage/voyage-3-large", name: "Voyage 3 Large", provider: "Voyage AI", providerColor: "#6366f1", category: "Embedding", contextWindow: "32K", contextTokens: 32000, inputPrice: 0.18, outputPrice: 0, inputPriceRp: usdToRp(0.18), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["embedding"], speed: "fast", quality: "premium" },
  { id: "voyage/voyage-3-lite", name: "Voyage 3 Lite", provider: "Voyage AI", providerColor: "#6366f1", category: "Embedding", contextWindow: "32K", contextTokens: 32000, inputPrice: 0.02, outputPrice: 0, inputPriceRp: usdToRp(0.02), outputPriceRp: 0, maxOutput: "4K", capabilities: ["embedding"], speed: "fast", quality: "standard" },
  { id: "voyage/voyage-code-3", name: "Voyage Code 3", provider: "Voyage AI", providerColor: "#6366f1", category: "Embedding", contextWindow: "32K", contextTokens: 32000, inputPrice: 0.18, outputPrice: 0, inputPriceRp: usdToRp(0.18), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["embedding", "code"], speed: "fast", quality: "premium" },
  // Jina AI
  { id: "jina/jina-embeddings-v3", name: "Jina Embeddings v3", provider: "Jina AI", providerColor: "#f59e0b", category: "Embedding", contextWindow: "8K", contextTokens: 8192, inputPrice: 0.02, outputPrice: 0, inputPriceRp: usdToRp(0.02), outputPriceRp: 0, maxOutput: "4K", capabilities: ["embedding"], speed: "fast", quality: "high" },
  { id: "jina/jina-colbert-v2", name: "Jina ColBERT v2", provider: "Jina AI", providerColor: "#f59e0b", category: "Embedding", contextWindow: "8K", contextTokens: 8192, inputPrice: 0.02, outputPrice: 0, inputPriceRp: usdToRp(0.02), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["embedding", "rerank"], speed: "fast", quality: "premium" },
  { id: "jina/reader-v2", name: "Jina Reader v2", provider: "Jina AI", providerColor: "#f59e0b", category: "Utility", contextWindow: "N/A", contextTokens: 0, inputPrice: 0.02, outputPrice: 0, inputPriceRp: usdToRp(0.02), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["scraping"], speed: "fast", quality: "high" },
  // Mixedbread AI
  { id: "mxb/mxbai-embed-large", name: "mxbai-embed-large", provider: "Mixedbread AI", providerColor: "#8b5cf6", category: "Embedding", contextWindow: "512", contextTokens: 512, inputPrice: 0.01, outputPrice: 0, inputPriceRp: usdToRp(0.01), outputPriceRp: 0, maxOutput: "4K", capabilities: ["embedding"], speed: "fast", quality: "high" },
  { id: "mxb/mxbai-rerank-large", name: "mxbai-rerank-large", provider: "Mixedbread AI", providerColor: "#8b5cf6", category: "Embedding", contextWindow: "512", contextTokens: 512, inputPrice: 0.05, outputPrice: 0, inputPriceRp: usdToRp(0.05), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["rerank"], speed: "fast", quality: "premium" },
  // Tavily
  { id: "tavily/search", name: "Tavily Search", provider: "Tavily", providerColor: "#10b981", category: "Search", contextWindow: "N/A", contextTokens: 0, inputPrice: 1.0, outputPrice: 0, inputPriceRp: usdToRp(1.0), outputPriceRp: 0, maxOutput: "8K", capabilities: ["search"], speed: "fast", quality: "premium" },
  { id: "tavily/extract", name: "Tavily Extract", provider: "Tavily", providerColor: "#10b981", category: "Search", contextWindow: "N/A", contextTokens: 0, inputPrice: 2.0, outputPrice: 0, inputPriceRp: usdToRp(2.0), outputPriceRp: 0, maxOutput: "8K", capabilities: ["scraping"], speed: "fast", quality: "premium" },
  // Exa
  { id: "exa/search", name: "Exa Search", provider: "Exa", providerColor: "#3b82f6", category: "Search", contextWindow: "N/A", contextTokens: 0, inputPrice: 1.0, outputPrice: 0, inputPriceRp: usdToRp(1.0), outputPriceRp: 0, maxOutput: "8K", capabilities: ["search"], speed: "fast", quality: "premium" },
  { id: "exa/find-similar", name: "Exa Find Similar", provider: "Exa", providerColor: "#3b82f6", category: "Search", contextWindow: "N/A", contextTokens: 0, inputPrice: 0.5, outputPrice: 0, inputPriceRp: usdToRp(0.5), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["search"], speed: "fast", quality: "high" },
  // Serper
  { id: "serper/google-search", name: "Google Search", provider: "Serper", providerColor: "#22c55e", category: "Search", contextWindow: "N/A", contextTokens: 0, inputPrice: 1.0, outputPrice: 0, inputPriceRp: usdToRp(1.0), outputPriceRp: 0, maxOutput: "8K", capabilities: ["search"], speed: "fast", quality: "premium" },
  // Brave Search
  { id: "brave/web-search", name: "Brave Web Search", provider: "Brave Search", providerColor: "#fb542b", category: "Search", contextWindow: "N/A", contextTokens: 0, inputPrice: 1.0, outputPrice: 0, inputPriceRp: usdToRp(1.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["search"], speed: "fast", quality: "high" },
  // Firecrawl
  { id: "firecrawl/scrape", name: "Firecrawl Scrape", provider: "Firecrawl", providerColor: "#f59e0b", category: "Utility", contextWindow: "N/A", contextTokens: 0, inputPrice: 1.0, outputPrice: 0, inputPriceRp: usdToRp(1.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["scraping"], speed: "fast", quality: "premium" },
  { id: "firecrawl/crawl", name: "Firecrawl Crawl", provider: "Firecrawl", providerColor: "#f59e0b", category: "Utility", contextWindow: "N/A", contextTokens: 0, inputPrice: 3.0, outputPrice: 0, inputPriceRp: usdToRp(3.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["scraping"], speed: "slow", quality: "premium" },
  // DeepL
  { id: "deepl/translate", name: "DeepL Translate", provider: "DeepL", providerColor: "#0f2b46", category: "Translation", contextWindow: "50K", contextTokens: 50000, inputPrice: 25.0, outputPrice: 0, inputPriceRp: usdToRp(25.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["translation"], speed: "fast", quality: "premium" },
  // Codestral (Mistral)
  { id: "codestral/codestral-latest", name: "Codestral Latest", provider: "Codestral (Mistral)", providerColor: "#ff7000", category: "Code", contextWindow: "256K", contextTokens: 256000, inputPrice: 0.3, outputPrice: 0.9, inputPriceRp: usdToRp(0.3), outputPriceRp: usdToRp(0.9), maxOutput: "8K", capabilities: ["code"], speed: "fast", quality: "premium" },
  // Qodo (CodiumAI)
  { id: "qodo/cover-agent", name: "Cover Agent", provider: "Qodo (CodiumAI)", providerColor: "#3b82f6", category: "Code", contextWindow: "16K", contextTokens: 16384, inputPrice: 3.0, outputPrice: 0, inputPriceRp: usdToRp(3.0), outputPriceRp: 0, maxOutput: "8K", capabilities: ["code", "testing"], speed: "medium", quality: "premium" },
  // Aider (Self-Hosted)
  { id: "aider/architect", name: "Aider Architect", provider: "Aider (Self-Hosted)", providerColor: "#22c55e", category: "Code", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["code", "chat"], speed: "medium", quality: "premium" },
  // Mathpix
  { id: "mathpix/ocr", name: "Mathpix OCR", provider: "Mathpix", providerColor: "#2563eb", category: "Vision", contextWindow: "N/A", contextTokens: 0, inputPrice: 2.0, outputPrice: 0, inputPriceRp: usdToRp(2.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["ocr", "math"], speed: "fast", quality: "premium" },
  // Unstructured
  { id: "unstruct/partition", name: "Document Partition", provider: "Unstructured", providerColor: "#6366f1", category: "Vision", contextWindow: "N/A", contextTokens: 0, inputPrice: 1.0, outputPrice: 0, inputPriceRp: usdToRp(1.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["ocr", "document"], speed: "medium", quality: "premium" },
  // OctoAI
  { id: "octo/llama-3.3-70b", name: "Llama 3.3 70B (Octo)", provider: "OctoAI", providerColor: "#6366f1", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.4, outputPrice: 0.4, inputPriceRp: usdToRp(0.4), outputPriceRp: usdToRp(0.4), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "octo/qwen-2.5-72b", name: "Qwen 2.5 72B (Octo)", provider: "OctoAI", providerColor: "#6366f1", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.4, outputPrice: 0.4, inputPriceRp: usdToRp(0.4), outputPriceRp: usdToRp(0.4), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Neets.ai
  { id: "neets/llama-3.3-70b", name: "Llama 3.3 70B (Neets)", provider: "Neets.ai", providerColor: "#f59e0b", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.18, outputPrice: 0.18, inputPriceRp: usdToRp(0.18), outputPriceRp: usdToRp(0.18), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // glhf.chat
  { id: "glhf/llama-3.3-70b", name: "Llama 3.3 70B (glhf)", provider: "glhf.chat", providerColor: "#22c55e", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.3, outputPrice: 0.3, inputPriceRp: usdToRp(0.3), outputPriceRp: usdToRp(0.3), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "glhf/qwen-2.5-72b", name: "Qwen 2.5 72B (glhf)", provider: "glhf.chat", providerColor: "#22c55e", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.3, outputPrice: 0.3, inputPriceRp: usdToRp(0.3), outputPriceRp: usdToRp(0.3), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Cloudflare AI Gateway
  { id: "cfgw/openai-proxy", name: "OpenAI Proxy (CF GW)", provider: "Cloudflare AI Gateway", providerColor: "#f48120", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // Martian (Router)
  { id: "martian/router", name: "Martian Router", provider: "Martian (Router)", providerColor: "#ef4444", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // Unify AI (Router)
  { id: "unify/router", name: "Unify Router", provider: "Unify AI (Router)", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // Portkey AI (Gateway)
  { id: "portkey/proxy", name: "Portkey Proxy", provider: "Portkey AI (Gateway)", providerColor: "#8b5cf6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // Helicone (Proxy)
  { id: "helicone/proxy", name: "Helicone OpenAI Proxy", provider: "Helicone (Proxy)", providerColor: "#0ea5e9", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // Together Free
  { id: "tgf/llama-3.3-70b", name: "Llama 3.3 70B (Free)", provider: "Together Free", providerColor: "#0ea5e9", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Groq Free
  { id: "groqf/llama-3.3-70b", name: "Llama 3.3 70B (Groq Free)", provider: "Groq Free", providerColor: "#f55036", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "ultra", quality: "high" },
  // SambaNova Free
  { id: "snf/llama-3.3-70b", name: "Llama 3.3 70B (SN Free)", provider: "SambaNova Free", providerColor: "#ff4500", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "ultra", quality: "high" },
  { id: "snf/deepseek-r1", name: "DeepSeek R1 (SN Free)", provider: "SambaNova Free", providerColor: "#ff4500", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "ultra", quality: "premium" },
  // Cerebras Free
  { id: "cbf/llama-3.3-70b", name: "Llama 3.3 70B (CB Free)", provider: "Cerebras Free", providerColor: "#3b82f6", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "ultra", quality: "high" },
  // DeepSeek Free
  { id: "dsf/deepseek-chat", name: "DeepSeek Chat (Free)", provider: "DeepSeek Free", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // NVIDIA Build (Free)
  { id: "nvf/llama-3.3-70b", name: "Llama 3.3 70B (NV Free)", provider: "NVIDIA Build (Free)", providerColor: "#76b900", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "nvf/deepseek-r1", name: "DeepSeek R1 (NV Free)", provider: "NVIDIA Build (Free)", providerColor: "#76b900", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "slow", quality: "premium" },
  // Cohere Trial (Free)
  { id: "coh-trial/command-r", name: "Command R (Trial)", provider: "Cohere Trial (Free)", providerColor: "#39d98a", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "rag"], speed: "fast", quality: "high" },
  // Mistral Free (La Plateforme)
  { id: "mf/mistral-small", name: "Mistral Small (Free)", provider: "Mistral Free (La Plateforme)", providerColor: "#ff7000", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "standard" },
  // Meshy (3D)
  { id: "meshy/text-to-3d", name: "Text to 3D", provider: "Meshy (3D)", providerColor: "#ec4899", category: "3D", contextWindow: "1K", contextTokens: 1000, inputPrice: 20.0, outputPrice: 0, inputPriceRp: usdToRp(20.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["3d"], speed: "slow", quality: "premium" },
  { id: "meshy/image-to-3d", name: "Image to 3D", provider: "Meshy (3D)", providerColor: "#ec4899", category: "3D", contextWindow: "N/A", contextTokens: 0, inputPrice: 15.0, outputPrice: 0, inputPriceRp: usdToRp(15.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["3d"], speed: "slow", quality: "premium" },
  // Tripo3D
  { id: "tripo/v2", name: "Tripo V2 3D", provider: "Tripo3D", providerColor: "#8b5cf6", category: "3D", contextWindow: "1K", contextTokens: 1000, inputPrice: 15.0, outputPrice: 0, inputPriceRp: usdToRp(15.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["3d"], speed: "slow", quality: "premium" },
  // OpenAI Moderation
  { id: "mod/omni-moderation", name: "Omni Moderation", provider: "OpenAI Moderation", providerColor: "#10a37f", category: "Utility", contextWindow: "32K", contextTokens: 32768, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "N/A", capabilities: ["moderation"], speed: "fast", quality: "premium" },
  // Perspective API (Google)
  { id: "persp/toxicity", name: "Toxicity Analyzer", provider: "Perspective API (Google)", providerColor: "#4285f4", category: "Utility", contextWindow: "20K", contextTokens: 20480, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "N/A", capabilities: ["moderation"], speed: "fast", quality: "premium" },
  // E2B (Code Sandbox)
  { id: "e2b/code-interpreter", name: "Code Interpreter", provider: "E2B (Code Sandbox)", providerColor: "#f59e0b", category: "Utility", contextWindow: "N/A", contextTokens: 0, inputPrice: 0.1, outputPrice: 0, inputPriceRp: usdToRp(0.1), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["code", "sandbox"], speed: "fast", quality: "premium" },
  // Browserbase
  { id: "bb/browser-agent", name: "Browser Agent", provider: "Browserbase", providerColor: "#3b82f6", category: "Utility", contextWindow: "N/A", contextTokens: 0, inputPrice: 5.0, outputPrice: 0, inputPriceRp: usdToRp(5.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["browser", "scraping"], speed: "medium", quality: "premium" },
  // Composio (Tools)
  { id: "composio/tools-proxy", name: "Tools Proxy", provider: "Composio (Tools)", providerColor: "#22c55e", category: "Utility", contextWindow: "N/A", contextTokens: 0, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "N/A", capabilities: ["tools"], speed: "fast", quality: "high" },
  // Naver (HyperCLOVA X)
  { id: "naver/hcx-dash-003", name: "HyperCLOVA X", provider: "Naver (HyperCLOVA X)", providerColor: "#03c75a", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 3.0, outputPrice: 9.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(9.0), maxOutput: "8K", capabilities: ["chat", "analysis"], speed: "fast", quality: "premium" },
  // Kakao (KoGPT)
  { id: "kakao/kogpt", name: "KoGPT", provider: "Kakao (KoGPT)", providerColor: "#fee500", category: "Chat", contextWindow: "32K", contextTokens: 32000, inputPrice: 2.0, outputPrice: 6.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(6.0), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "high" },
  // Sakura Internet (Japan)
  { id: "sakura/llm-jp-70b", name: "LLM-JP 70B", provider: "Sakura Internet (Japan)", providerColor: "#ff69b4", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 1.0, outputPrice: 3.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "high" },
  // Yandex (YandexGPT)
  { id: "yagpt/yandexgpt-pro", name: "YandexGPT Pro", provider: "Yandex (YandexGPT)", providerColor: "#fc3f1d", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 3.0, outputPrice: 9.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(9.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  { id: "yagpt/yandexgpt-lite", name: "YandexGPT Lite", provider: "Yandex (YandexGPT)", providerColor: "#fc3f1d", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0.4, outputPrice: 1.2, inputPriceRp: usdToRp(0.4), outputPriceRp: usdToRp(1.2), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // Sber (GigaChat)
  { id: "giga/gigachat-pro", name: "GigaChat Pro", provider: "Sber (GigaChat)", providerColor: "#21a038", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 3.0, outputPrice: 9.0, inputPriceRp: usdToRp(3.0), outputPriceRp: usdToRp(9.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  // Coze (ByteDance)
  { id: "coze/bot-proxy", name: "Coze Bot Proxy", provider: "Coze (ByteDance)", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "tools"], speed: "fast", quality: "high" },
  // Dify (Self-Hosted)
  { id: "dify/app-proxy", name: "Dify App Proxy", provider: "Dify (Self-Hosted)", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "tools"], speed: "fast", quality: "high" },
  // FlowiseAI (Self-Hosted)
  { id: "flowise/chatflow", name: "Flowise Chatflow", provider: "FlowiseAI (Self-Hosted)", providerColor: "#22c55e", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "tools"], speed: "fast", quality: "high" },
  // Langfuse (Proxy)
  { id: "langfuse/proxy", name: "Langfuse Proxy", provider: "Langfuse (Proxy)", providerColor: "#f59e0b", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // LiteLLM (Proxy)
  { id: "litellm/proxy", name: "LiteLLM Proxy", provider: "LiteLLM (Proxy)", providerColor: "#0ea5e9", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // Semantic Router
  { id: "semr/router", name: "Semantic Router", provider: "Semantic Router", providerColor: "#8b5cf6", category: "Utility", contextWindow: "N/A", contextTokens: 0, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "N/A", capabilities: ["routing"], speed: "fast", quality: "high" },
  // Not Diamond (Router)
  { id: "nd/router", name: "Not Diamond Router", provider: "Not Diamond (Router)", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "routing"], speed: "fast", quality: "premium" },
  // Prediction Guard
  { id: "pg/hermes-3-70b", name: "Hermes 3 70B", provider: "Prediction Guard", providerColor: "#6366f1", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 1.0, outputPrice: 3.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "pg/deepseek-r1-distilled", name: "DeepSeek R1 Distilled", provider: "Prediction Guard", providerColor: "#6366f1", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.5, outputPrice: 1.5, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(1.5), maxOutput: "4K", capabilities: ["reasoning"], speed: "medium", quality: "high" },
  // Upstage
  { id: "solar/solar-pro", name: "Solar Pro", provider: "Upstage", providerColor: "#f59e0b", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 2.0, outputPrice: 6.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(6.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  { id: "solar/solar-mini", name: "Solar Mini", provider: "Upstage", providerColor: "#f59e0b", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 0.15, outputPrice: 0.15, inputPriceRp: usdToRp(0.15), outputPriceRp: usdToRp(0.15), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  { id: "solar/document-ai", name: "Document AI", provider: "Upstage", providerColor: "#f59e0b", category: "Vision", contextWindow: "N/A", contextTokens: 0, inputPrice: 5.0, outputPrice: 0, inputPriceRp: usdToRp(5.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["ocr", "document"], speed: "medium", quality: "premium" },
  // Friendli AI
  { id: "friendli/llama-3.3-70b", name: "Llama 3.3 70B (Friendli)", provider: "Friendli AI", providerColor: "#22c55e", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.35, outputPrice: 0.35, inputPriceRp: usdToRp(0.35), outputPriceRp: usdToRp(0.35), maxOutput: "4K", capabilities: ["chat", "code"], speed: "ultra", quality: "high" },
  { id: "friendli/deepseek-r1", name: "DeepSeek R1 (Friendli)", provider: "Friendli AI", providerColor: "#22c55e", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.55, outputPrice: 2.19, inputPriceRp: usdToRp(0.55), outputPriceRp: usdToRp(2.19), maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "fast", quality: "premium" },
  // Monsoon AI
  { id: "monsoon/llama-3.3-70b", name: "Llama 3.3 70B (Monsoon)", provider: "Monsoon AI", providerColor: "#0ea5e9", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.3, outputPrice: 0.3, inputPriceRp: usdToRp(0.3), outputPriceRp: usdToRp(0.3), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // CentML
  { id: "centml/llama-3.3-70b", name: "Llama 3.3 70B (CentML)", provider: "CentML", providerColor: "#ef4444", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.4, outputPrice: 0.4, inputPriceRp: usdToRp(0.4), outputPriceRp: usdToRp(0.4), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Nebius AI
  { id: "nebius/llama-3.3-70b", name: "Llama 3.3 70B (Nebius)", provider: "Nebius AI", providerColor: "#6366f1", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.28, outputPrice: 0.28, inputPriceRp: usdToRp(0.28), outputPriceRp: usdToRp(0.28), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "nebius/qwen-2.5-72b", name: "Qwen 2.5 72B (Nebius)", provider: "Nebius AI", providerColor: "#6366f1", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.28, outputPrice: 0.28, inputPriceRp: usdToRp(0.28), outputPriceRp: usdToRp(0.28), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "nebius/deepseek-r1", name: "DeepSeek R1 (Nebius)", provider: "Nebius AI", providerColor: "#6366f1", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.55, outputPrice: 2.19, inputPriceRp: usdToRp(0.55), outputPriceRp: usdToRp(2.19), maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "slow", quality: "premium" },
  // Kluster AI
  { id: "kluster/deepseek-r1", name: "DeepSeek R1 (Kluster)", provider: "Kluster AI", providerColor: "#f59e0b", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.55, outputPrice: 2.19, inputPriceRp: usdToRp(0.55), outputPriceRp: usdToRp(2.19), maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "slow", quality: "premium" },
  // Infini AI
  { id: "infini/deepseek-r1", name: "DeepSeek R1 (Infini)", provider: "Infini AI", providerColor: "#3b82f6", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.55, outputPrice: 2.19, inputPriceRp: usdToRp(0.55), outputPriceRp: usdToRp(2.19), maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "medium", quality: "premium" },
  { id: "infini/deepseek-v3", name: "DeepSeek V3 (Infini)", provider: "Infini AI", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.14, outputPrice: 0.28, inputPriceRp: usdToRp(0.14), outputPriceRp: usdToRp(0.28), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Chutes AI
  { id: "chutes/deepseek-r1", name: "DeepSeek R1 (Chutes)", provider: "Chutes AI", providerColor: "#22c55e", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.4, outputPrice: 1.6, inputPriceRp: usdToRp(0.4), outputPriceRp: usdToRp(1.6), maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "slow", quality: "premium" },
  { id: "chutes/llama-3.3-70b", name: "Llama 3.3 70B (Chutes)", provider: "Chutes AI", providerColor: "#22c55e", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.3, outputPrice: 0.3, inputPriceRp: usdToRp(0.3), outputPriceRp: usdToRp(0.3), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Targon (Manifold)
  { id: "targon/deepseek-r1", name: "DeepSeek R1 (Targon)", provider: "Targon (Manifold)", providerColor: "#8b5cf6", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.45, outputPrice: 1.8, inputPriceRp: usdToRp(0.45), outputPriceRp: usdToRp(1.8), maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "slow", quality: "premium" },
  // Nineteen AI
  { id: "nineteen/llama-3.3-70b", name: "Llama 3.3 70B (Nineteen)", provider: "Nineteen AI", providerColor: "#ec4899", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.2, outputPrice: 0.2, inputPriceRp: usdToRp(0.2), outputPriceRp: usdToRp(0.2), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Parasail AI
  { id: "parasail/llama-3.3-70b", name: "Llama 3.3 70B (Parasail)", provider: "Parasail AI", providerColor: "#0ea5e9", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.25, outputPrice: 0.25, inputPriceRp: usdToRp(0.25), outputPriceRp: usdToRp(0.25), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Tencent Hunyuan
  { id: "hunyuan/hunyuan-pro", name: "Hunyuan Pro", provider: "Tencent Hunyuan", providerColor: "#0052d9", category: "Chat", contextWindow: "256K", contextTokens: 256000, inputPrice: 2.0, outputPrice: 6.0, inputPriceRp: usdToRp(2.0), outputPriceRp: usdToRp(6.0), maxOutput: "8K", capabilities: ["chat", "analysis"], speed: "fast", quality: "premium" },
  // Kunlun Tech (Skywork)
  { id: "skywork/skywork-o1", name: "Skywork o1", provider: "Kunlun Tech (Skywork)", providerColor: "#6366f1", category: "Reasoning", contextWindow: "32K", contextTokens: 32768, inputPrice: 1.0, outputPrice: 3.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["reasoning", "chat"], speed: "medium", quality: "high" },
  // Zhiyuan (AquilaChat)
  { id: "aquila/aquilachat-70b", name: "AquilaChat 70B", provider: "Zhiyuan (AquilaChat)", providerColor: "#3b82f6", category: "Chat", contextWindow: "32K", contextTokens: 32768, inputPrice: 1.0, outputPrice: 3.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "high" },
  // ChatGLM Web (Cookie)
  { id: "web/chatglm-4", name: "ChatGLM-4 (Web)", provider: "ChatGLM Web (Cookie)", providerColor: "#4f46e5", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "analysis"], speed: "fast", quality: "premium" },
  // Kimi Web (Cookie)
  { id: "web/kimi", name: "Kimi (Web)", provider: "Kimi Web (Cookie)", providerColor: "#fbbf24", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "search"], speed: "fast", quality: "high" },
  // Doubao Web (Cookie)
  { id: "web/doubao", name: "Doubao (Web)", provider: "Doubao Web (Cookie)", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  // Gradient AI
  { id: "gradient/llama-3.3-70b", name: "Llama 3.3 70B (Gradient)", provider: "Gradient AI", providerColor: "#22c55e", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.3, outputPrice: 0.3, inputPriceRp: usdToRp(0.3), outputPriceRp: usdToRp(0.3), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Predibase
  { id: "predibase/llama-3.3-70b", name: "Llama 3.3 70B (Predibase)", provider: "Predibase", providerColor: "#6366f1", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.35, outputPrice: 0.35, inputPriceRp: usdToRp(0.35), outputPriceRp: usdToRp(0.35), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Corcel (Bittensor)
  { id: "corcel/llama-3.3-70b", name: "Llama 3.3 70B (Corcel)", provider: "Corcel (Bittensor)", providerColor: "#f59e0b", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.25, outputPrice: 0.25, inputPriceRp: usdToRp(0.25), outputPriceRp: usdToRp(0.25), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Venice AI
  { id: "venice/llama-3.3-70b", name: "Llama 3.3 70B (Venice)", provider: "Venice AI", providerColor: "#0ea5e9", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0.5, outputPrice: 0.5, inputPriceRp: usdToRp(0.5), outputPriceRp: usdToRp(0.5), maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "venice/deepseek-r1", name: "DeepSeek R1 (Venice)", provider: "Venice AI", providerColor: "#0ea5e9", category: "Reasoning", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.55, outputPrice: 2.19, inputPriceRp: usdToRp(0.55), outputPriceRp: usdToRp(2.19), maxOutput: "8K", capabilities: ["reasoning", "code"], speed: "slow", quality: "premium" },
  // Resemble AI (Voice)
  { id: "resemble/v2-tts", name: "Resemble v2 TTS", provider: "Resemble AI (Voice)", providerColor: "#8b5cf6", category: "Audio", contextWindow: "5K", contextTokens: 5000, inputPrice: 0.06, outputPrice: 0, inputPriceRp: usdToRp(0.06), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["tts", "voice-clone"], speed: "fast", quality: "premium" },
  // PlayHT
  { id: "playht/play3.0", name: "Play 3.0 TTS", provider: "PlayHT", providerColor: "#ef4444", category: "Audio", contextWindow: "5K", contextTokens: 5000, inputPrice: 0.15, outputPrice: 0, inputPriceRp: usdToRp(0.15), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["tts"], speed: "fast", quality: "premium" },
  // Cartesia (Sonic)
  { id: "cartesia/sonic-2", name: "Sonic 2 TTS", provider: "Cartesia (Sonic)", providerColor: "#3b82f6", category: "Audio", contextWindow: "5K", contextTokens: 5000, inputPrice: 0.1, outputPrice: 0, inputPriceRp: usdToRp(0.1), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["tts"], speed: "fast", quality: "premium" },
  // HeyGen (Avatar)
  { id: "heygen/avatar-v2", name: "Avatar v2", provider: "HeyGen (Avatar)", providerColor: "#22c55e", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 30.0, outputPrice: 0, inputPriceRp: usdToRp(30.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video", "avatar"], speed: "slow", quality: "premium" },
  // Synthesia
  { id: "synthesia/avatar", name: "Synthesia Avatar", provider: "Synthesia", providerColor: "#6366f1", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 35.0, outputPrice: 0, inputPriceRp: usdToRp(35.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video", "avatar"], speed: "slow", quality: "premium" },
  // D-ID
  { id: "d-id/talks", name: "D-ID Talks", provider: "D-ID", providerColor: "#f59e0b", category: "Video", contextWindow: "2K", contextTokens: 2000, inputPrice: 25.0, outputPrice: 0, inputPriceRp: usdToRp(25.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["video", "avatar"], speed: "slow", quality: "premium" },
  // SAM 2 (Meta)
  { id: "sam/sam-2.1", name: "SAM 2.1", provider: "SAM 2 (Meta)", providerColor: "#0ea5e9", category: "Vision", contextWindow: "N/A", contextTokens: 0, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "N/A", capabilities: ["segmentation", "vision"], speed: "fast", quality: "premium" },
  // Roboflow
  { id: "roboflow/object-detect", name: "Object Detection", provider: "Roboflow", providerColor: "#a855f7", category: "Vision", contextWindow: "N/A", contextTokens: 0, inputPrice: 1.0, outputPrice: 0, inputPriceRp: usdToRp(1.0), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["vision", "detection"], speed: "fast", quality: "premium" },
  // Clarifai
  { id: "clarifai/general-image", name: "General Image Recognition", provider: "Clarifai", providerColor: "#3b82f6", category: "Vision", contextWindow: "N/A", contextTokens: 0, inputPrice: 1.2, outputPrice: 0, inputPriceRp: usdToRp(1.2), outputPriceRp: 0, maxOutput: "N/A", capabilities: ["vision"], speed: "fast", quality: "premium" },
  { id: "clarifai/llm-proxy", name: "LLM Proxy (Clarifai)", provider: "Clarifai", providerColor: "#3b82f6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "high" },
  // Prem AI
  { id: "prem/auto", name: "Prem Auto", provider: "Prem AI", providerColor: "#6366f1", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Fireworks Free
  { id: "fwf/llama-3.3-70b", name: "Llama 3.3 70B (FW Free)", provider: "Fireworks Free", providerColor: "#ef4444", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Glama
  { id: "glama/auto", name: "Glama Auto Router", provider: "Glama", providerColor: "#22c55e", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // Requesty
  { id: "requesty/router", name: "Requesty Router", provider: "Requesty", providerColor: "#f59e0b", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat", "code"], speed: "fast", quality: "premium" },
  // LLM Playground (Free)
  { id: "llmpg/gpt-4o", name: "GPT-4o (Playground)", provider: "LLM Playground (Free)", providerColor: "#8b5cf6", category: "Chat", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "8K", capabilities: ["chat"], speed: "fast", quality: "premium" },
  // HF Dedicated Endpoints
  { id: "hfe/custom", name: "Custom HF Endpoint", provider: "HF Dedicated Endpoints", providerColor: "#fbbf24", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Azure ML Endpoints
  { id: "azml/custom", name: "Custom Azure ML", provider: "Azure ML Endpoints", providerColor: "#0078d4", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // AWS SageMaker
  { id: "sm/custom", name: "Custom SageMaker", provider: "AWS SageMaker", providerColor: "#ff9900", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // GCP Vertex Endpoints
  { id: "vtx/custom", name: "Custom Vertex Endpoint", provider: "GCP Vertex Endpoints", providerColor: "#4285f4", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // Arcee AI
  { id: "arcee/supernova-medius", name: "SuperNova Medius", provider: "Arcee AI", providerColor: "#ef4444", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 1.0, outputPrice: 3.0, inputPriceRp: usdToRp(1.0), outputPriceRp: usdToRp(3.0), maxOutput: "4K", capabilities: ["chat", "analysis"], speed: "fast", quality: "high" },
  // Codestral Mamba (Free)
  { id: "csf/codestral-mamba", name: "Codestral Mamba (Free)", provider: "Codestral Mamba (Free)", providerColor: "#ff7000", category: "Code", contextWindow: "256K", contextTokens: 256000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["code"], speed: "fast", quality: "high" },
  // HuggingChat (Cookie)
  { id: "web/qwen-2.5-72b-hc", name: "Qwen 2.5 72B (HuggingChat)", provider: "HuggingChat (Cookie)", providerColor: "#fbbf24", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  { id: "web/llama-3.3-70b-hc", name: "Llama 3.3 70B (HuggingChat)", provider: "HuggingChat (Cookie)", providerColor: "#fbbf24", category: "Chat", contextWindow: "131K", contextTokens: 131072, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code"], speed: "fast", quality: "high" },
  // DuckDuckGo AI (Free)
  { id: "duck/gpt-4o-mini", name: "GPT-4o Mini (Duck)", provider: "DuckDuckGo AI (Free)", providerColor: "#de5833", category: "Chat", contextWindow: "8K", contextTokens: 8192, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  { id: "duck/claude-haiku", name: "Claude Haiku (Duck)", provider: "DuckDuckGo AI (Free)", providerColor: "#de5833", category: "Chat", contextWindow: "8K", contextTokens: 8192, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat"], speed: "fast", quality: "standard" },
  // Blackbox AI (Free)
  { id: "blackbox/blackboxai", name: "BlackboxAI", provider: "Blackbox AI (Free)", providerColor: "#1a1a2e", category: "Code", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "4K", capabilities: ["chat", "code", "search"], speed: "fast", quality: "high" },

  // ═══ Phase 3: Embeddings ═══
  { id: "text-embedding-3-large", name: "Text Embedding 3 Large", provider: "OpenAI", providerColor: "#10a37f", category: "Embedding", contextWindow: "8K", contextTokens: 8191, inputPrice: 0.13, outputPrice: 0, inputPriceRp: usdToRp(0.13), outputPriceRp: 0, maxOutput: "3072 dims", capabilities: ["embedding"], speed: "fast", quality: "premium", popular: true },
  { id: "text-embedding-3-small", name: "Text Embedding 3 Small", provider: "OpenAI", providerColor: "#10a37f", category: "Embedding", contextWindow: "8K", contextTokens: 8191, inputPrice: 0.02, outputPrice: 0, inputPriceRp: usdToRp(0.02), outputPriceRp: 0, maxOutput: "1536 dims", capabilities: ["embedding"], speed: "fast", quality: "standard", popular: true },
  { id: "voyage-3-large", name: "Voyage 3 Large", provider: "Voyage AI", providerColor: "#6366f1", category: "Embedding", contextWindow: "32K", contextTokens: 32000, inputPrice: 0.18, outputPrice: 0, inputPriceRp: usdToRp(0.18), outputPriceRp: 0, maxOutput: "2048 dims", capabilities: ["embedding"], speed: "fast", quality: "premium", new: true },
  { id: "voyage-3-lite", name: "Voyage 3 Lite", provider: "Voyage AI", providerColor: "#6366f1", category: "Embedding", contextWindow: "32K", contextTokens: 32000, inputPrice: 0.02, outputPrice: 0, inputPriceRp: usdToRp(0.02), outputPriceRp: 0, maxOutput: "512 dims", capabilities: ["embedding"], speed: "ultra", quality: "standard" },
  { id: "embed-v4.0", name: "Embed v4.0", provider: "Cohere", providerColor: "#39d98a", category: "Embedding", contextWindow: "128K", contextTokens: 128000, inputPrice: 0.10, outputPrice: 0, inputPriceRp: usdToRp(0.10), outputPriceRp: 0, maxOutput: "1024 dims", capabilities: ["embedding", "multilingual"], speed: "fast", quality: "high", new: true },
  { id: "jina-embeddings-v3", name: "Jina Embeddings v3", provider: "Jina AI", providerColor: "#f59e0b", category: "Embedding", contextWindow: "8K", contextTokens: 8192, inputPrice: 0.02, outputPrice: 0, inputPriceRp: usdToRp(0.02), outputPriceRp: 0, maxOutput: "1024 dims", capabilities: ["embedding", "multilingual"], speed: "fast", quality: "high" },

  // ═══ Phase 3: Image Generation ═══
  { id: "dall-e-3", name: "DALL-E 3", provider: "OpenAI", providerColor: "#10a37f", category: "Image", contextWindow: "4K", contextTokens: 4000, inputPrice: 40.00, outputPrice: 0, inputPriceRp: usdToRp(40.00), outputPriceRp: 0, maxOutput: "1024×1024", capabilities: ["image"], speed: "medium", quality: "premium", popular: true },
  { id: "dall-e-3-hd", name: "DALL-E 3 HD", provider: "OpenAI", providerColor: "#10a37f", category: "Image", contextWindow: "4K", contextTokens: 4000, inputPrice: 80.00, outputPrice: 0, inputPriceRp: usdToRp(80.00), outputPriceRp: 0, maxOutput: "1792×1024", capabilities: ["image"], speed: "slow", quality: "premium" },
  { id: "sdxl-1.0", name: "Stable Diffusion XL", provider: "Stability AI", providerColor: "#a855f7", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 2.00, outputPrice: 0, inputPriceRp: usdToRp(2.00), outputPriceRp: 0, maxOutput: "1024×1024", capabilities: ["image"], speed: "fast", quality: "high", popular: true },
  { id: "sd3.5-large", name: "Stable Diffusion 3.5 Large", provider: "Stability AI", providerColor: "#a855f7", category: "Image", contextWindow: "77", contextTokens: 77, inputPrice: 6.50, outputPrice: 0, inputPriceRp: usdToRp(6.50), outputPriceRp: 0, maxOutput: "1024×1024", capabilities: ["image"], speed: "medium", quality: "premium", new: true },
  { id: "flux-1.1-pro", name: "FLUX 1.1 Pro", provider: "Black Forest Labs", providerColor: "#ec4899", category: "Image", contextWindow: "512", contextTokens: 512, inputPrice: 4.00, outputPrice: 0, inputPriceRp: usdToRp(4.00), outputPriceRp: 0, maxOutput: "1024×1024", capabilities: ["image"], speed: "fast", quality: "premium", popular: true, new: true },
  { id: "flux-schnell", name: "FLUX Schnell", provider: "Black Forest Labs", providerColor: "#ec4899", category: "Image", contextWindow: "512", contextTokens: 512, inputPrice: 0.30, outputPrice: 0, inputPriceRp: usdToRp(0.30), outputPriceRp: 0, maxOutput: "1024×1024", capabilities: ["image"], speed: "ultra", quality: "standard" },
  { id: "ideogram-v2", name: "Ideogram v2", provider: "Ideogram", providerColor: "#3b82f6", category: "Image", contextWindow: "512", contextTokens: 512, inputPrice: 5.00, outputPrice: 0, inputPriceRp: usdToRp(5.00), outputPriceRp: 0, maxOutput: "1024×1024", capabilities: ["image", "text-in-image"], speed: "medium", quality: "premium", new: true },

  // ═══ Phase 3: Audio ═══
  { id: "tts-1", name: "TTS-1", provider: "OpenAI", providerColor: "#10a37f", category: "Audio", contextWindow: "4K", contextTokens: 4096, inputPrice: 15.00, outputPrice: 0, inputPriceRp: usdToRp(15.00), outputPriceRp: 0, maxOutput: "Audio", capabilities: ["tts"], speed: "fast", quality: "standard", popular: true },
  { id: "tts-1-hd", name: "TTS-1 HD", provider: "OpenAI", providerColor: "#10a37f", category: "Audio", contextWindow: "4K", contextTokens: 4096, inputPrice: 30.00, outputPrice: 0, inputPriceRp: usdToRp(30.00), outputPriceRp: 0, maxOutput: "Audio HD", capabilities: ["tts"], speed: "medium", quality: "premium" },
  { id: "whisper-1", name: "Whisper-1", provider: "OpenAI", providerColor: "#10a37f", category: "Audio", contextWindow: "25min", contextTokens: 0, inputPrice: 6.00, outputPrice: 0, inputPriceRp: usdToRp(6.00), outputPriceRp: 0, maxOutput: "Text", capabilities: ["stt", "transcription"], speed: "fast", quality: "high", popular: true },
  { id: "eleven-multilingual-v2", name: "Eleven Multilingual v2", provider: "ElevenLabs", providerColor: "#f97316", category: "Audio", contextWindow: "5K", contextTokens: 5000, inputPrice: 24.00, outputPrice: 0, inputPriceRp: usdToRp(24.00), outputPriceRp: 0, maxOutput: "Audio", capabilities: ["tts", "multilingual"], speed: "fast", quality: "premium", new: true },
  { id: "deepgram-nova-2", name: "Nova-2", provider: "Deepgram", providerColor: "#22d3ee", category: "Audio", contextWindow: "Unlimited", contextTokens: 0, inputPrice: 3.60, outputPrice: 0, inputPriceRp: usdToRp(3.60), outputPriceRp: 0, maxOutput: "Text", capabilities: ["stt", "transcription", "multilingual"], speed: "ultra", quality: "high" },

  // ═══ Phase 3: Moderation ═══
  { id: "omni-moderation-latest", name: "Omni Moderation Latest", provider: "OpenAI", providerColor: "#10a37f", category: "Moderation", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "Labels", capabilities: ["moderation", "safety"], speed: "fast", quality: "premium", new: true },
  { id: "text-moderation-stable", name: "Text Moderation Stable", provider: "OpenAI", providerColor: "#10a37f", category: "Moderation", contextWindow: "128K", contextTokens: 128000, inputPrice: 0, outputPrice: 0, inputPriceRp: 0, outputPriceRp: 0, maxOutput: "Labels", capabilities: ["moderation", "safety"], speed: "ultra", quality: "high" },

  // ═══ Phase 3: Reranking ═══
  { id: "rerank-v3.5", name: "Rerank v3.5", provider: "Cohere", providerColor: "#39d98a", category: "Utility", contextWindow: "4K", contextTokens: 4096, inputPrice: 2.00, outputPrice: 0, inputPriceRp: usdToRp(2.00), outputPriceRp: 0, maxOutput: "Scores", capabilities: ["reranking", "search"], speed: "fast", quality: "premium", new: true },
  { id: "voyage-rerank-2", name: "Voyage Rerank 2", provider: "Voyage AI", providerColor: "#6366f1", category: "Utility", contextWindow: "8K", contextTokens: 8000, inputPrice: 2.00, outputPrice: 0, inputPriceRp: usdToRp(2.00), outputPriceRp: 0, maxOutput: "Scores", capabilities: ["reranking", "search"], speed: "fast", quality: "high", new: true },
];

// Provider/category/capability lists are now computed dynamically in the component
// based on which models are available (see activeProviders/activeCategories/activeCapabilities).

const CAPABILITY_ICONS: Record<string, typeof Sparkles> = {
  chat: MessageSquare,
  code: Code2,
  vision: Image,
  analysis: Brain,
  reasoning: Sparkles,
  math: Zap,
  creative: FileText,
  rag: Globe,
  search: Globe,
  image: Image,
  tts: Mic,
  stt: Mic,
  music: Music,
  video: Video,
  "3d": Box,
  embedding: FileText,
  rerank: ArrowUpDown,
  reranking: ArrowUpDown,
  scraping: Globe,
  translation: Languages,
  moderation: Shield,
  safety: Shield,
  multilingual: Languages,
  transcription: Mic,
  "text-in-image": FileText,
  tools: Wrench,
  sandbox: Code2,
  browser: Globe,
  routing: Zap,
  ocr: Eye,
  document: FileText,
  detection: Eye,
  segmentation: Eye,
  avatar: Video,
  "voice-clone": Mic,
  testing: Shield,
};

type SortKey = "name" | "inputPrice" | "outputPrice" | "contextTokens" | "provider";
type ViewMode = "cards" | "table";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function ModelsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [capability, setCapability] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showCount, setShowCount] = useState(24);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  // Fetch available model IDs from backend
  const availableModelIds = useQuery(api.publicModels.getAvailableModelIds) ?? [];
  const availableSet = useMemo(() => new Set(availableModelIds), [availableModelIds]);

  // Build base model list based on availability toggle
  const baseModels = useMemo(() =>
    showOnlyAvailable && availableSet.size > 0
      ? ALL_MODELS.filter((m) => availableSet.has(m.id))
      : ALL_MODELS,
    [showOnlyAvailable, availableSet]
  );

  const activeProviders = useMemo(() => [...new Set(baseModels.map((m) => m.provider))], [baseModels]);
  const activeCategories = useMemo(() => [...new Set(baseModels.map((m) => m.category))], [baseModels]);
  const activeCapabilities = useMemo(() => [...new Set(baseModels.flatMap((m) => m.capabilities))], [baseModels]);

  const filtered = useMemo(() => {
    let result = baseModels;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q) || m.id.includes(q));
    }
    if (provider !== "all") result = result.filter((m) => m.provider === provider);
    if (category !== "all") result = result.filter((m) => m.category === category);
    if (capability !== "all") result = result.filter((m) => m.capabilities.includes(capability));

    result.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
      return 0;
    });
    return result;
  }, [baseModels, search, provider, category, capability, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const fmtRp = (usd: number) => {
    if (usd === 0) return "Gratis";
    const rp = usd * USD_TO_IDR;
    if (rp < 10) return `Rp ${rp.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    return `Rp ${rp.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-xl z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="text-lg font-semibold text-foreground">{t("models.title")}</h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              {availableSet.size > 0 ? `${availableSet.size} available` : `${ALL_MODELS.length} models`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/signup" className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors">
              {t("nav.getApiKey")}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t("models.catalogTitle")}</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {t("models.catalogDesc")}
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("models.search")}
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* Provider filter */}
          <div className="relative">
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm bg-card border border-border rounded-lg text-foreground cursor-pointer focus:outline-none">
              <option value="all">{t("models.allProviders")}</option>
              {activeProviders.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm bg-card border border-border rounded-lg text-foreground cursor-pointer focus:outline-none">
              <option value="all">{t("models.allCategories")}</option>
              {activeCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Capability filter */}
          <div className="relative">
            <select value={capability} onChange={(e) => setCapability(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm bg-card border border-border rounded-lg text-foreground cursor-pointer focus:outline-none">
              <option value="all">{t("models.allCapabilities")}</option>
              {activeCapabilities.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Available only toggle */}
          <button
            onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              showOnlyAvailable
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {showOnlyAvailable ? "✓ Available Only" : "Show All"}
            {availableSet.size > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({availableSet.size})
              </span>
            )}
          </button>

          {/* View toggle */}
          <div className="flex bg-card border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("cards")} className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "cards" ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}>Cards</button>
            <button onClick={() => setViewMode("table")} className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "table" ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}>Table</button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-4">
          {filtered.length > showCount
            ? `Showing ${showCount} of ${filtered.length} ${t("models.found")}`
            : `${filtered.length} ${t("models.found")}`}
        </p>

        {/* ─── CARDS VIEW ─── */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.slice(0, showCount).map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-card border border-border rounded-xl p-4 hover:border-emerald-500/30 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                      {m.popular && <span className="text-[9px] font-medium bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Popular</span>}
                      {m.new && <span className="text-[9px] font-medium bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">New</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.providerColor }} />
                      <span className="text-xs text-muted-foreground">{m.provider}</span>
                      <span className="text-[10px] text-muted-foreground/50">•</span>
                      <span className="text-xs text-muted-foreground">{m.category}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                    m.speed === "ultra" ? "bg-cyan-500/10 text-cyan-400" :
                    m.speed === "fast" ? "bg-green-500/10 text-green-400" :
                    m.speed === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>{m.speed}</span>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-accent/30 rounded-lg">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Input / 1M token</p>
                    <p className="text-xs font-semibold text-foreground">{fmtRp(m.inputPrice)}</p>
                    <p className="text-[10px] text-muted-foreground">{m.inputPrice === 0 ? "" : `$${m.inputPrice.toFixed(2)}`}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Output / 1M token</p>
                    <p className="text-xs font-semibold text-foreground">{fmtRp(m.outputPrice)}</p>
                    <p className="text-[10px] text-muted-foreground">{m.outputPrice === 0 ? "" : `$${m.outputPrice.toFixed(2)}`}</p>
                  </div>
                </div>

                {/* Specs */}
                <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground">
                  <span>Context: {m.contextWindow}</span>
                  <span>•</span>
                  <span>Max output: {m.maxOutput}</span>
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1.5">
                  {m.capabilities.map((c) => {
                    const Icon = CAPABILITY_ICONS[c] || Sparkles;
                    return (
                      <span key={c} className="inline-flex items-center gap-1 text-[9px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">
                        <Icon className="size-2.5" />{c}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── TABLE VIEW ─── */}
        {viewMode === "table" && (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("name")}>
                    <span className="flex items-center gap-1">Model <ArrowUpDown className="size-3" /></span>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("provider")}>
                    <span className="flex items-center gap-1">Provider <ArrowUpDown className="size-3" /></span>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Kategori</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Context</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("inputPrice")}>
                    <span className="flex items-center gap-1">Input/1M <ArrowUpDown className="size-3" /></span>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("outputPrice")}>
                    <span className="flex items-center gap-1">Output/1M <ArrowUpDown className="size-3" /></span>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Max Output</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Speed</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Capabilities</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, showCount).map((m, i) => (
                  <tr key={m.id} className={`border-b border-border/50 hover:bg-accent/20 transition-colors ${i % 2 ? "bg-accent/5" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{m.name}</span>
                        {m.popular && <span className="text-[8px] font-medium bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded">★</span>}
                        {m.new && <span className="text-[8px] font-medium bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded">NEW</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.providerColor }} />
                        <span className="text-muted-foreground">{m.provider}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.category}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.contextWindow}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-foreground font-medium">{fmtRp(m.inputPrice)}</span>
                        <span className="text-muted-foreground text-[10px] ml-1">{m.inputPrice === 0 ? "" : `($${m.inputPrice.toFixed(2)})` }</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-foreground font-medium">{fmtRp(m.outputPrice)}</span>
                        <span className="text-muted-foreground text-[10px] ml-1">{m.outputPrice === 0 ? "" : `($${m.outputPrice.toFixed(2)})` }</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.maxOutput}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        m.speed === "ultra" ? "bg-cyan-500/10 text-cyan-400" :
                        m.speed === "fast" ? "bg-green-500/10 text-green-400" :
                        m.speed === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>{m.speed}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.capabilities.map((c) => (
                          <span key={c} className="text-[8px] text-muted-foreground bg-accent/50 px-1 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Tidak ada model yang cocok dengan filter.</p>
          </div>
        )}

        {/* Show More / Show Less */}
        {filtered.length > 24 && (
          <div className="flex justify-center gap-3 mt-6">
            {showCount < filtered.length && (
              <button
                onClick={() => setShowCount(Math.min(showCount + 24, filtered.length))}
                className="text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-6 py-2.5 rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                Show More ({Math.min(24, filtered.length - showCount)} more)
              </button>
            )}
            {showCount < filtered.length && (
              <button
                onClick={() => setShowCount(filtered.length)}
                className="text-sm font-medium text-muted-foreground border border-border px-6 py-2.5 rounded-lg hover:text-foreground hover:bg-accent transition-colors"
              >
                Show All ({filtered.length})
              </button>
            )}
            {showCount > 24 && (
              <button
                onClick={() => { setShowCount(24); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="text-sm font-medium text-muted-foreground border border-border px-6 py-2.5 rounded-lg hover:text-foreground hover:bg-accent transition-colors"
              >
                Collapse
              </button>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center space-y-4 border-t border-border pt-8">
          <h3 className="text-lg font-semibold text-foreground">Siap mulai?</h3>
          <p className="text-sm text-muted-foreground">Akses semua model di atas dengan satu API key.</p>
          <div className="flex justify-center gap-3">
            <Link to="/signup" className="text-sm font-medium bg-foreground text-background px-6 py-2.5 rounded-lg hover:opacity-90 transition-colors">
              Dapatkan API Key Gratis
            </Link>
            <Link to="/docs" className="text-sm font-medium text-muted-foreground border border-border px-6 py-2.5 rounded-lg hover:text-foreground hover:bg-accent transition-colors">
              Dokumentasi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
