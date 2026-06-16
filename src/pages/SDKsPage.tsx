import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Star,
  GitBranch,
  Terminal,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

interface SDK {
  language: string;
  package: string;
  version: string;
  install: string;
  github: string;
  stars: string;
  description: string;
  example: string;
  color: string;
}

const SDKS: SDK[] = [
  {
    language: "Python",
    package: "credit-ai",
    version: "2.4.0",
    install: "pip install credit-ai",
    github: "github.com/credit-ai/credit-python",
    stars: "2.8K",
    description: "Official Python SDK with async support, streaming, and type hints. Works with Python 3.8+.",
    color: "from-blue-500/20 to-yellow-500/20",
    example: `from adalahcredit import AdalahCredit

client = AdalahCredit(api_key="ac-live-sk_your_key")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing"}
    ],
    temperature=0.7,
    max_tokens=2048
)

print(response.choices[0].message.content)

# Streaming
stream = client.chat.completions.create(
    model="claude-sonnet-4",
    messages=[{"role": "user", "content": "Write a poem"}],
    stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")`,
  },
  {
    language: "Node.js",
    package: "credit-ai",
    version: "2.4.0",
    install: "npm install credit-ai",
    github: "github.com/credit-ai/credit-node",
    stars: "1.9K",
    description: "TypeScript-first Node.js SDK with ESM/CJS support. Full type safety and streaming.",
    color: "from-green-500/20 to-emerald-500/20",
    example: `import AdalahCredit from 'adalahcredit';

const client = new AdalahCredit({ apiKey: 'ac-live-sk_your_key' });

const response = await client.chat.completions.create({
  model: 'gemini-2.5-pro',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing' }
  ],
  temperature: 0.7,
  maxTokens: 2048
});

console.log(response.choices[0].message.content);

// Streaming
const stream = await client.chat.completions.create({
  model: 'claude-sonnet-4',
  messages: [{ role: 'user', content: 'Write a poem' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}`,
  },
  {
    language: "Go",
    package: "credit-go",
    version: "2.4.0",
    install: "go get github.com/credit-ai/credit-go",
    github: "github.com/credit-ai/credit-go",
    stars: "890",
    description: "Idiomatic Go SDK with context support, connection pooling, and streaming via channels.",
    color: "from-cyan-500/20 to-blue-500/20",
    example: `package main

import (
    "context"
    "fmt"
    "github.com/credit-ai/credit-go"
)

func main() {
    client := credit.NewClient("ac-live-sk_your_key")

    resp, err := client.Chat.Completions.Create(
        context.Background(),
        &credit.ChatCompletionRequest{
            Model: "gpt-4o",
            Messages: []credit.Message{
                {Role: "user", Content: "Explain quantum computing"},
            },
            Temperature: credit.Float64(0.7),
            MaxTokens:   credit.Int(2048),
        },
    )
    if err != nil {
        panic(err)
    }

    fmt.Println(resp.Choices[0].Message.Content)
}`,
  },
  {
    language: "Rust",
    package: "credit-rs",
    version: "0.8.0",
    install: 'cargo add credit-rs',
    github: "github.com/credit-ai/credit-rs",
    stars: "420",
    description: "Async Rust SDK built on tokio with zero-copy deserialization. Supports streaming via async iterators.",
    color: "from-orange-500/20 to-red-500/20",
    example: `use credit_rs::{Client, ChatCompletionRequest, Message};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new("ac-live-sk_your_key");

    let response = client
        .chat()
        .completions()
        .create(ChatCompletionRequest {
            model: "gpt-4o".into(),
            messages: vec![
                Message::user("Explain quantum computing"),
            ],
            temperature: Some(0.7),
            max_tokens: Some(2048),
            ..Default::default()
        })
        .await?;

    println!("{}", response.choices[0].message.content);
    Ok(())
}`,
  },
];

const FEATURES = [
  "OpenAI-compatible API — drop-in replacement, just change the base URL",
  "Full streaming support across all languages",
  "Automatic retry with exponential backoff",
  "Type-safe request/response objects",
  "Built-in rate limit handling (auto-retry on 429)",
  "Comprehensive error types and messages",
];

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative bg-[#0a0a0c] border border-border rounded-lg overflow-hidden group">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <span className="text-[10px] text-muted-foreground font-mono">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground/70 transition-colors"
        >
          {copied ? <><Check className="size-3 text-emerald-400" /> Copied</> : <><Copy className="size-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[11px] text-muted-foreground leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export function SDKsPage() {
  const [activeSDK, setActiveSDK] = useState(0);
  const sdk = SDKS[activeSDK];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
              <Zap className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold">AdalahCredit</span>
            <span className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">SDKs</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Dashboard</Link>
            <Link to="/docs" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Docs →</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 sm:py-16">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">SDKs & Libraries</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Official client libraries for every major language. OpenAI-compatible — just change the base URL and API key.
          </p>
        </motion.div>

        {/* Language tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {SDKS.map((s, i) => (
            <button
              key={s.language}
              onClick={() => setActiveSDK(i)}
              className={`shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeSDK === i
                  ? "bg-foreground text-background"
                  : "bg-accent/50 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {s.language}
            </button>
          ))}
        </div>

        {/* SDK detail */}
        <motion.div key={sdk.language} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Info card */}
            <div className={`bg-gradient-to-br ${sdk.color} border border-border rounded-xl p-5`}>
              <h2 className="text-lg font-bold text-foreground mb-1">{sdk.language} SDK</h2>
              <p className="text-xs text-muted-foreground mb-4">{sdk.description}</p>

              <div className="space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <code className="text-foreground/70 font-mono">{sdk.package}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="text-foreground/70 tabular-nums">v{sdk.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stars</span>
                  <span className="text-foreground/70 flex items-center gap-1"><Star className="size-3 text-amber-400" />{sdk.stars}</span>
                </div>
              </div>

              <a href={`https://${sdk.github}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground transition-colors">
                <GitBranch className="size-3" /> {sdk.github} <ExternalLink className="size-2.5" />
              </a>
            </div>

            {/* Install */}
            <div className="lg:col-span-2">
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Terminal className="size-3.5" /> Installation
              </h3>
              <CodeBlock code={sdk.install} lang="terminal" />

              <div className="mt-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <BookOpen className="size-3.5" /> Quick Start
                </h3>
                <CodeBlock code={sdk.example} lang={sdk.language.toLowerCase()} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Compatibility note */}
        <div className="bg-blue-500/[0.04] border border-blue-500/20 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-medium text-blue-400 mb-2">💡 OpenAI Compatible</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Already using the OpenAI SDK? You can switch to AdalahCredit with just 2 lines — no code changes needed:
          </p>
          <CodeBlock
            code={`# Python — just change base_url and api_key
from openai import OpenAI

client = OpenAI(
    base_url="https://api.adalahcredit.com/v1",
    api_key="ac-live-sk_your_key"
)

# All your existing code works unchanged!
response = client.chat.completions.create(
    model="gpt-4o",  # or any AdalahCredit-supported model
    messages=[{"role": "user", "content": "Hello!"}]
)`}
            lang="python"
          />
        </div>

        {/* Features */}
        <div className="bg-accent/30 border border-border rounded-xl p-5 mb-8">
          <h3 className="text-sm font-medium text-foreground mb-3">All SDKs Include</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-6 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to AdalahCredit
          </Link>
          <Link to="/docs" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">
            Full API Reference →
          </Link>
        </div>
      </main>
    </div>
  );
}
