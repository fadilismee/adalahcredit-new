import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import {
  ArrowLeft,
  Book,
  Copy,
  Check,
  ChevronDown,
  Zap,
  Key,
  Terminal,
  Globe,
  Shield,
  BarChart3,
  Layers,
  Search,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR NAV DATA
   ═══════════════════════════════════════════════════════════════ */

interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: { id: string; label: string }[];
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction", icon: <Book className="size-3.5" /> },
      { id: "quickstart", label: "Quickstart", icon: <Zap className="size-3.5" /> },
      { id: "authentication", label: "Authentication", icon: <Key className="size-3.5" /> },
    ],
  },
  {
    title: "API Reference",
    items: [
      {
        id: "chat-completions",
        label: "Chat Completions",
        icon: <Terminal className="size-3.5" />,
        children: [
          { id: "chat-create", label: "Create Chat Completion" },
          { id: "chat-streaming", label: "Streaming" },
          { id: "chat-function-calling", label: "Function Calling" },
        ],
      },
      {
        id: "embeddings",
        label: "Embeddings",
        icon: <Layers className="size-3.5" />,
        children: [
          { id: "embed-create", label: "Create Embedding" },
        ],
      },
      {
        id: "images-api",
        label: "Image Generation",
        icon: <Layers className="size-3.5" />,
        children: [
          { id: "images-create", label: "Generate Image" },
        ],
      },
      {
        id: "audio-api",
        label: "Audio",
        icon: <Layers className="size-3.5" />,
        children: [
          { id: "audio-speech", label: "Text to Speech" },
          { id: "audio-transcription", label: "Transcription" },
        ],
      },
      {
        id: "moderations-api",
        label: "Moderations",
        icon: <Shield className="size-3.5" />,
        children: [
          { id: "moderation-create", label: "Create Moderation" },
        ],
      },
      {
        id: "models-api",
        label: "Models",
        icon: <Globe className="size-3.5" />,
        children: [
          { id: "models-list", label: "List Models" },
          { id: "models-retrieve", label: "Retrieve Model" },
        ],
      },
    ],
  },
  {
    title: "Guides",
    items: [
      { id: "smart-routing", label: "Smart Routing", icon: <Zap className="size-3.5" /> },
      { id: "rate-limits", label: "Rate Limits", icon: <Shield className="size-3.5" /> },
      { id: "error-handling", label: "Error Handling", icon: <BarChart3 className="size-3.5" /> },
      { id: "caching", label: "Semantic Caching", icon: <Layers className="size-3.5" /> },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   CODE BLOCK WITH COPY
   ═══════════════════════════════════════════════════════════════ */

function CodeBlock({ code, language = "bash", title }: { code: string; language?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden my-4">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-accent/30">
          <span className="text-[11px] font-medium text-muted-foreground">{title}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language}</span>
        </div>
      )}
      <div className="relative group">
        <pre className="p-4 sm:p-5 overflow-x-auto text-[13px] leading-relaxed">
          <code className="text-foreground/70 font-mono">{code}</code>
        </pre>
        <button
          onClick={copy}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-accent/50 border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent/70"
        >
          {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ENDPOINT BADGE
   ═══════════════════════════════════════════════════════════════ */

function EndpointBadge({ method, path }: { method: string; path: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/30 border border-border my-4 font-mono">
      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${colors[method] || colors.GET}`}>
        {method}
      </span>
      <span className="text-sm text-foreground/70">{path}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PARAM TABLE
   ═══════════════════════════════════════════════════════════════ */

function ParamTable({ params }: { params: { name: string; type: string; required?: boolean; desc: string }[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden my-4">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/30">
            <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Parameter</th>
            <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Type</th>
            <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <code className="text-xs font-mono text-foreground/70">{p.name}</code>
                {p.required && <span className="ml-1.5 text-[9px] text-red-400 font-medium">required</span>}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{p.type}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DOC SECTIONS CONTENT
   ═══════════════════════════════════════════════════════════════ */

const getDocsContent = (t: (key: string) => string): Record<string, () => React.ReactNode> => ({
  introduction: () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{t("docs.title")}</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        {t("docs.introText")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {[
          { icon: <Zap className="size-4 text-amber-400" />, title: t("docs.singleEndpoint"), desc: t("docs.singleEndpointDesc") },
          { icon: <Globe className="size-4 text-blue-400" />, title: t("docs.models300"), desc: t("docs.models300Desc") },
          { icon: <Shield className="size-4 text-emerald-400" />, title: t("docs.enterpriseReady"), desc: t("docs.enterpriseReadyDesc") },
          { icon: <BarChart3 className="size-4 text-purple-400" />, title: t("docs.realTimeAnalytics"), desc: t("docs.realTimeAnalyticsDesc") },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl bg-accent/30 border border-border">
            <div className="mt-0.5">{f.icon}</div>
            <div>
              <div className="text-sm font-medium text-foreground/80">{f.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-3">Base URL</h2>
      <CodeBlock code="https://blessed-sardine-879.convex.site/v1" title="API Base URL" language="url" />
      <p className="text-muted-foreground text-sm leading-relaxed">
        All API requests should be made to this base URL. AdalahCredit is compatible with the OpenAI SDK format,
        so you can use existing OpenAI libraries by simply changing the base URL and API key.
      </p>
    </>
  ),

  quickstart: () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Quickstart</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Get up and running with AdalahCredit in under 2 minutes.
      </p>

      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="size-6 rounded-full bg-accent/50 flex items-center justify-center text-xs text-muted-foreground">1</span>
        Get your API Key
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        Sign up at <span className="text-foreground font-medium">adalahcredit.com</span> and create an API key from your dashboard.
      </p>

      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="size-6 rounded-full bg-accent/50 flex items-center justify-center text-xs text-muted-foreground">2</span>
        Install the SDK
      </h2>
      <CodeBlock code={`# Python\npip install openai\n\n# Node.js\nnpm install openai`} title="Install" language="bash" />

      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="size-6 rounded-full bg-accent/50 flex items-center justify-center text-xs text-muted-foreground">3</span>
        Make your first request
      </h2>
      <CodeBlock
        code={`from openai import OpenAI

client = OpenAI(
    base_url="https://blessed-sardine-879.convex.site/v1",
    api_key="cr-your-api-key"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello, world!"}
    ]
)

print(response.choices[0].message.content)`}
        title="First Request"
        language="python"
      />

      <CodeBlock
        code={`import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://blessed-sardine-879.convex.site/v1",
  apiKey: "cr-your-api-key",
});

const response = await client.chat.completions.create({
  model: "claude-sonnet-4",
  messages: [
    { role: "user", content: "Hello, world!" }
  ],
});

console.log(response.choices[0].message.content);`}
        title="Node.js"
        language="javascript"
      />

      <CodeBlock
        code={`curl https://blessed-sardine-879.convex.site/v1/chat/completions \\
  -H "Authorization: Bearer cr-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-2.5-pro",
    "messages": [
      {"role": "user", "content": "Hello, world!"}
    ]
  }'`}
        title="cURL"
        language="bash"
      />

      <div className="mt-6 p-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/[0.15]">
        <p className="text-sm text-emerald-300">
          <strong>Tip:</strong> Switch models by changing the <code className="px-1.5 py-0.5 bg-accent/50 rounded text-xs">model</code> parameter. No other code changes needed!
        </p>
      </div>
    </>
  ),

  authentication: () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Authentication</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        AdalahCredit uses API keys for authentication. Include your API key in the <code className="px-1.5 py-0.5 bg-accent/50 rounded text-xs text-foreground/70">Authorization</code> header of every request.
      </p>

      <CodeBlock code={`Authorization: Bearer cr-your-api-key`} title="Header Format" language="http" />

      <h2 className="text-lg font-semibold text-foreground mb-3 mt-8">API Key Format</h2>
      <p className="text-muted-foreground text-sm mb-4">
        All AdalahCredit API keys start with the <code className="px-1.5 py-0.5 bg-accent/50 rounded text-xs text-foreground/70">ac-</code> prefix.
      </p>

      <h2 className="text-lg font-semibold text-foreground mb-3 mt-8">Key Types</h2>
      <div className="space-y-3 mb-6">
        {[
          { type: "Live Key", prefix: "cr-live-", desc: "For production. Full access, metered billing." },
          { type: "Test Key", prefix: "cr-test-", desc: "For development. Free tier limits, no charges." },
        ].map((k) => (
          <div key={k.type} className="flex items-start gap-3 p-4 rounded-xl bg-accent/30 border border-border">
            <Key className="size-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground/80">{k.type} <code className="text-xs text-muted-foreground ml-1">{k.prefix}***</code></div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/[0.15]">
        <p className="text-sm text-amber-300">
          <strong>Security:</strong> Never expose your API key in client-side code. Always make API calls from your backend server.
        </p>
      </div>
    </>
  ),

  "chat-completions": () => <ChatCompletionsDoc />,
  "chat-create": () => <ChatCompletionsDoc />,

  "chat-streaming": () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Streaming</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Stream responses token-by-token for real-time output. Set <code className="px-1.5 py-0.5 bg-accent/50 rounded text-xs text-foreground/70">stream: true</code> in your request.
      </p>
      <EndpointBadge method="POST" path="/v1/chat/completions" />
      <CodeBlock
        code={`from openai import OpenAI

client = OpenAI(
    base_url="https://blessed-sardine-879.convex.site/v1",
    api_key="cr-your-api-key"
)

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a poem"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")`}
        title="Streaming Example"
        language="python"
      />
    </>
  ),

  "chat-function-calling": () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Function Calling</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Use function calling (tool use) to let models interact with external systems. AdalahCredit normalizes function calling across all providers.
      </p>
      <CodeBlock
        code={`response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What's the weather in Jakarta?"}],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City name"}
                },
                "required": ["location"]
            }
        }
    }]
)

tool_call = response.choices[0].message.tool_calls[0]
print(tool_call.function.name)       # "get_weather"
print(tool_call.function.arguments)  # '{"location":"Jakarta"}'`}
        title="Function Calling"
        language="python"
      />
    </>
  ),

  embeddings: () => <EmbeddingsDoc />,
  "embed-create": () => <EmbeddingsDoc />,

  "images-api": () => <ImagesDoc />,
  "images-create": () => <ImagesDoc />,

  "audio-api": () => <AudioDoc />,
  "audio-speech": () => <AudioDoc />,
  "audio-transcription": () => <AudioDoc />,

  "moderations-api": () => <ModerationsDoc />,
  "moderation-create": () => <ModerationsDoc />,

  "models-api": () => <ModelsDoc />,
  "models-list": () => <ModelsDoc />,
  "models-retrieve": () => <ModelsDoc />,

  "smart-routing": () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Smart Routing</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        AdalahCredit automatically routes requests to the optimal provider based on cost, latency, and availability.
        If a provider is down, AdalahCredit fails over to an equivalent model in under 100ms.
      </p>
      <h2 className="text-lg font-semibold text-foreground mb-3">Routing Strategies</h2>
      <div className="space-y-3 mb-6">
        {[
          { strategy: "cost", desc: "Route to the cheapest available provider for the model" },
          { strategy: "latency", desc: "Route to the fastest responding provider" },
          { strategy: "quality", desc: "Route to the highest quality endpoint (default)" },
        ].map((s) => (
          <div key={s.strategy} className="flex items-start gap-3 p-4 rounded-xl bg-accent/30 border border-border">
            <Zap className="size-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <code className="text-xs font-mono text-foreground/80">{s.strategy}</code>
              <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <CodeBlock
        code={`response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    extra_headers={
        "X-AC-Routing": "cost"  # or "latency", "quality"
    }
)`}
        title="Custom Routing"
        language="python"
      />
    </>
  ),

  "rate-limits": () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Rate Limits</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Rate limits are applied per API key and vary by plan.
      </p>
      <div className="rounded-xl border border-border overflow-hidden my-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/30">
              <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase">Plan</th>
              <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase">Requests/min</th>
              <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase">Tokens/min</th>
            </tr>
          </thead>
          <tbody className="text-foreground/70">
            <tr className="border-b border-border"><td className="px-4 py-3 text-xs">Starter</td><td className="px-4 py-3 text-xs font-mono">1,000</td><td className="px-4 py-3 text-xs font-mono">200,000</td></tr>
            <tr className="border-b border-border"><td className="px-4 py-3 text-xs">Pro</td><td className="px-4 py-3 text-xs font-mono">10,000</td><td className="px-4 py-3 text-xs font-mono">2,000,000</td></tr>
            <tr><td className="px-4 py-3 text-xs">Enterprise</td><td className="px-4 py-3 text-xs font-mono">Custom</td><td className="px-4 py-3 text-xs font-mono">Custom</td></tr>
          </tbody>
        </table>
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-3 mt-6">Rate Limit Headers</h2>
      <CodeBlock
        code={`X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9847
X-RateLimit-Reset: 1718234400`}
        title="Response Headers"
        language="http"
      />
    </>
  ),

  "error-handling": () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Error Handling</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        AdalahCredit uses standard HTTP status codes and returns JSON error objects.
      </p>
      <div className="rounded-xl border border-border overflow-hidden my-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/30">
              <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase">Code</th>
              <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase">Meaning</th>
            </tr>
          </thead>
          <tbody className="text-foreground/70">
            <tr className="border-b border-border"><td className="px-4 py-3 text-xs font-mono">400</td><td className="px-4 py-3 text-xs">Bad Request — Invalid parameters</td></tr>
            <tr className="border-b border-border"><td className="px-4 py-3 text-xs font-mono">401</td><td className="px-4 py-3 text-xs">Unauthorized — Invalid API key</td></tr>
            <tr className="border-b border-border"><td className="px-4 py-3 text-xs font-mono">429</td><td className="px-4 py-3 text-xs">Rate limited — Too many requests</td></tr>
            <tr className="border-b border-border"><td className="px-4 py-3 text-xs font-mono">500</td><td className="px-4 py-3 text-xs">Server error — Retry with backoff</td></tr>
            <tr><td className="px-4 py-3 text-xs font-mono">503</td><td className="px-4 py-3 text-xs">Provider unavailable — Auto-failover active</td></tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`{
  "error": {
    "type": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Please retry after 2s.",
    "code": 429
  }
}`}
        title="Error Response"
        language="json"
      />
    </>
  ),

  caching: () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Semantic Caching</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        AdalahCredit automatically caches semantically similar queries to reduce costs by up to 70% and improve latency.
      </p>
      <h2 className="text-lg font-semibold text-foreground mb-3">How it works</h2>
      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-6">
        <li>Incoming requests are embedded and compared against recent queries</li>
        <li>If a semantically similar query is found ({">"} 95% similarity), the cached response is returned</li>
        <li>Cache TTL is configurable per API key (default: 1 hour)</li>
      </ol>
      <CodeBlock
        code={`# Disable caching for a specific request
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    extra_headers={
        "X-AC-Cache": "skip"
    }
)`}
        title="Skip Cache"
        language="python"
      />
    </>
  ),
});

/* ── Sub-doc components ── */

function ChatCompletionsDoc() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Chat Completions</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Create a model response for the given chat conversation. Compatible with the OpenAI chat completions format.
      </p>
      <EndpointBadge method="POST" path="/v1/chat/completions" />
      <h2 className="text-lg font-semibold text-foreground mb-3 mt-6">Request Body</h2>
      <ParamTable params={[
        { name: "model", type: "string", required: true, desc: "Model ID (e.g. gpt-4o, claude-sonnet-4, gemini-2.5-pro)" },
        { name: "messages", type: "array", required: true, desc: "Array of message objects with role and content" },
        { name: "temperature", type: "number", desc: "Sampling temperature (0-2). Default: 1" },
        { name: "max_tokens", type: "integer", desc: "Maximum tokens to generate" },
        { name: "stream", type: "boolean", desc: "Enable streaming. Default: false" },
        { name: "tools", type: "array", desc: "Functions the model can call" },
        { name: "top_p", type: "number", desc: "Nucleus sampling. Default: 1" },
      ]} />
      <h2 className="text-lg font-semibold text-foreground mb-3 mt-6">Example</h2>
      <CodeBlock
        code={`curl https://blessed-sardine-879.convex.site/v1/chat/completions \\
  -H "Authorization: Bearer cr-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain quantum computing"}
    ],
    "temperature": 0.7,
    "max_tokens": 1000
  }'`}
        title="Request"
        language="bash"
      />
      <CodeBlock
        code={`{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1718234400,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing leverages..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}`}
        title="Response"
        language="json"
      />
    </>
  );
}

function EmbeddingsDoc() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Embeddings</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Create vector embeddings for text input. Supports OpenAI, Cohere, Voyage, and Jina embedding models.
      </p>
      <EndpointBadge method="POST" path="/v1/embeddings" />
      <ParamTable params={[
        { name: "model", type: "string", required: true, desc: "Embedding model (e.g. text-embedding-3-large)" },
        { name: "input", type: "string | array", required: true, desc: "Text to embed (string or array of strings)" },
      ]} />
      <CodeBlock
        code={`response = client.embeddings.create(
    model="text-embedding-3-large",
    input="AdalahCredit is an API gateway for AI models"
)

vector = response.data[0].embedding
print(f"Dimensions: {len(vector)}")  # 3072`}
        title="Create Embedding"
        language="python"
      />
    </>
  );
}

function ImagesDoc() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Image Generation</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Generate images from text prompts. Supports DALL-E 3, Stable Diffusion, FLUX, Ideogram, and more.
      </p>
      <EndpointBadge method="POST" path="/v1/images/generations" />
      <ParamTable params={[
        { name: "model", type: "string", required: false, desc: "Image model (default: dall-e-3)" },
        { name: "prompt", type: "string", required: true, desc: "Text description of the image to generate" },
        { name: "n", type: "integer", required: false, desc: "Number of images (default: 1)" },
        { name: "size", type: "string", required: false, desc: "Image size: 256x256, 512x512, 1024x1024, 1792x1024" },
        { name: "quality", type: "string", required: false, desc: "Quality: standard or hd" },
      ]} />
      <CodeBlock
        code={`response = client.images.generate(
    model="dall-e-3",
    prompt="A futuristic city skyline at sunset, cyberpunk style",
    size="1024x1024",
    quality="hd",
    n=1
)

image_url = response.data[0].url
print(f"Image URL: {image_url}")`}
        title="Generate Image"
        language="python"
      />
      <CodeBlock
        code={`curl https://blessed-sardine-879.convex.site/v1/images/generations \\
  -H "Authorization: Bearer cr-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "dall-e-3",
    "prompt": "A futuristic city skyline at sunset",
    "size": "1024x1024",
    "n": 1
  }'`}
        title="cURL"
        language="bash"
      />
      <CodeBlock
        code={`{
  "created": 1718234400,
  "data": [
    {
      "url": "https://...",
      "revised_prompt": "A sprawling futuristic city..."
    }
  ]
}`}
        title="Response"
        language="json"
      />
    </>
  );
}

function AudioDoc() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Audio</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Text-to-speech and speech-to-text. Supports OpenAI TTS, ElevenLabs, Deepgram, and AssemblyAI.
      </p>

      <h2 className="text-lg font-semibold text-foreground mb-3">Text to Speech</h2>
      <EndpointBadge method="POST" path="/v1/audio/speech" />
      <ParamTable params={[
        { name: "model", type: "string", required: true, desc: "TTS model (e.g. tts-1, tts-1-hd)" },
        { name: "input", type: "string", required: true, desc: "Text to convert to speech" },
        { name: "voice", type: "string", required: true, desc: "Voice: alloy, echo, fable, onyx, nova, shimmer" },
        { name: "response_format", type: "string", required: false, desc: "Format: mp3, opus, aac, flac (default: mp3)" },
        { name: "speed", type: "number", required: false, desc: "Speed: 0.25 to 4.0 (default: 1.0)" },
      ]} />
      <CodeBlock
        code={`response = client.audio.speech.create(
    model="tts-1-hd",
    voice="nova",
    input="Selamat datang di AdalahCredit API Gateway!"
)

response.stream_to_file("output.mp3")`}
        title="Text to Speech"
        language="python"
      />

      <h2 className="text-lg font-semibold text-foreground mb-3 mt-8">Transcription</h2>
      <EndpointBadge method="POST" path="/v1/audio/transcriptions" />
      <ParamTable params={[
        { name: "model", type: "string", required: true, desc: "Transcription model (e.g. whisper-1)" },
        { name: "file", type: "file", required: true, desc: "Audio file (mp3, mp4, wav, webm, m4a)" },
        { name: "language", type: "string", required: false, desc: "ISO-639-1 language code (e.g. id, en)" },
      ]} />
      <CodeBlock
        code={`audio_file = open("recording.mp3", "rb")
transcript = client.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file,
    language="id"
)

print(transcript.text)`}
        title="Transcribe Audio"
        language="python"
      />
    </>
  );
}

function ModerationsDoc() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Moderations</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Check text content for safety and compliance. Free to use — no credit deducted.
      </p>
      <EndpointBadge method="POST" path="/v1/moderations" />
      <ParamTable params={[
        { name: "model", type: "string", required: false, desc: "Moderation model (default: omni-moderation-latest)" },
        { name: "input", type: "string | array", required: true, desc: "Text to check for safety" },
      ]} />
      <CodeBlock
        code={`response = client.moderations.create(
    input="This is a normal message to check for safety."
)

result = response.results[0]
print(f"Flagged: {result.flagged}")
print(f"Categories: {result.categories}")`}
        title="Create Moderation"
        language="python"
      />
      <CodeBlock
        code={`{
  "id": "modr-abc123",
  "model": "omni-moderation-latest",
  "results": [
    {
      "flagged": false,
      "categories": {
        "sexual": false,
        "hate": false,
        "harassment": false,
        "self-harm": false,
        "violence": false
      },
      "category_scores": {
        "sexual": 0.0001,
        "hate": 0.0002,
        "harassment": 0.0001,
        "self-harm": 0.0000,
        "violence": 0.0001
      }
    }
  ]
}`}
        title="Response"
        language="json"
      />
      <div className="bg-emerald-500/[0.04] border border-emerald-500/[0.08] rounded-xl p-4 mt-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-emerald-400">💡 Gratis:</strong> Moderation endpoint tidak memotong kredit. Gunakan untuk memfilter konten sebelum mengirim ke model lain.
        </p>
      </div>
    </>
  );
}

function ModelsDoc() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Models</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        List and retrieve information about available models.
      </p>

      <h2 className="text-lg font-semibold text-foreground mb-3">List Models</h2>
      <EndpointBadge method="GET" path="/v1/models" />
      <CodeBlock
        code={`curl https://blessed-sardine-879.convex.site/v1/models \\
  -H "Authorization: Bearer cr-your-api-key"`}
        title="List All Models"
        language="bash"
      />

      <h2 className="text-lg font-semibold text-foreground mb-3 mt-8">Retrieve Model</h2>
      <EndpointBadge method="GET" path="/v1/models/{model_id}" />
      <CodeBlock
        code={`curl https://blessed-sardine-879.convex.site/v1/models/gpt-4o \\
  -H "Authorization: Bearer cr-your-api-key"`}
        title="Retrieve Model"
        language="bash"
      />
      <CodeBlock
        code={`{
  "id": "gpt-4o",
  "object": "model",
  "created": 1718234400,
  "owned_by": "openai",
  "pricing": {
    "input_per_1m": 2.50,
    "output_per_1m": 10.00
  },
  "context_window": 128000,
  "capabilities": ["chat", "vision", "function_calling"]
}`}
        title="Response"
        language="json"
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════ */

function Sidebar({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "chat-completions": true, "models-api": true, embeddings: true, "images-api": true, "audio-api": true, "moderations-api": true });

  return (
    <nav className="space-y-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-2">{section.title}</div>
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => {
                    onSelect(item.id);
                    if (item.children) setExpanded((e) => ({ ...e, [item.id]: !e[item.id] }));
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    activeId === item.id ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:text-foreground/70 hover:bg-accent/30"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.children && (
                    <ChevronDown className={`size-3 transition-transform ${expanded[item.id] ? "" : "-rotate-90"}`} />
                  )}
                </button>
                {item.children && expanded[item.id] && (
                  <div className="ml-5 pl-2 border-l border-border mt-0.5 space-y-0.5">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onSelect(child.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          activeId === child.id ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:text-foreground/70 hover:bg-accent/30"
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DOCS PAGE
   ═══════════════════════════════════════════════════════════════ */

export function DocsPage() {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState("introduction");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const docsContent = getDocsContent(t);
  const renderContent = docsContent[activeSection] || docsContent.introduction;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 rounded-lg hover:bg-accent/50">
              <Layers className="size-4 text-muted-foreground" />
            </button>
            <Link to="/" className="flex items-center gap-2 text-foreground">
              <div className="size-7 rounded-lg bg-gradient-to-br from-foreground/10 to-foreground/[0.03] border border-border flex items-center justify-center">
                <Zap className="size-3.5 text-foreground" />
              </div>
              <span className="font-semibold text-sm">AdalahCredit</span>
              <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-full ml-1">Docs</span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-accent/30 border border-border rounded-lg px-3 py-1.5 w-64">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("docs.searchDocs")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-foreground/70 placeholder-muted-foreground outline-none flex-1 ml-1.5"
            />
            <kbd className="text-[9px] text-muted-foreground bg-accent/50 px-1 py-0.5 rounded">⌘K</kbd>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="size-3" />
              {t("nav.home")}
            </Link>
            <a href="https://github.com/adalahcredit" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              GitHub <ExternalLink className="size-3" />
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="flex max-w-[1400px] mx-auto">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto
          border-r border-border bg-background p-4
          transition-transform lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <Sidebar activeId={activeSection} onSelect={(id) => { setActiveSection(id); setSidebarOpen(false); }} />
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-background/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 sm:px-10 lg:px-16 py-10 sm:py-14">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-3xl"
          >
            {renderContent()}
          </motion.div>

          {/* Prev/Next nav */}
          <div className="flex items-center justify-between max-w-3xl mt-16 pt-8 border-t border-border">
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} AdalahCredit. All rights reserved.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
