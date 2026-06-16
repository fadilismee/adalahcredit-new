import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Language = "curl" | "python" | "javascript" | "go";

const LANG_LABELS: Record<Language, { label: string; color: string }> = {
  curl: { label: "cURL", color: "text-green-400" },
  python: { label: "Python", color: "text-blue-400" },
  javascript: { label: "JavaScript", color: "text-yellow-400" },
  go: { label: "Go", color: "text-cyan-400" },
};

function generateSnippet(
  lang: Language,
  opts: { baseUrl: string; apiKey: string; model: string; prompt: string }
): string {
  const { baseUrl, apiKey, model, prompt } = opts;

  switch (lang) {
    case "curl":
      return `curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": "${prompt}"}
    ],
    "temperature": 0.7
  }'`;

    case "python":
      return `from openai import OpenAI

client = OpenAI(
    api_key="${apiKey}",
    base_url="${baseUrl}/v1"
)

response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "user", "content": "${prompt}"}
    ],
    temperature=0.7
)

print(response.choices[0].message.content)`;

    case "javascript":
      return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "${apiKey}",
  baseURL: "${baseUrl}/v1",
});

const response = await client.chat.completions.create({
  model: "${model}",
  messages: [
    { role: "user", content: "${prompt}" },
  ],
  temperature: 0.7,
});

console.log(response.choices[0].message.content);`;

    case "go":
      return `package main

import (
    "context"
    "fmt"
    openai "github.com/sashabaranov/go-openai"
)

func main() {
    config := openai.DefaultConfig("${apiKey}")
    config.BaseURL = "${baseUrl}/v1"
    client := openai.NewClientWithConfig(config)

    resp, err := client.CreateChatCompletion(
        context.Background(),
        openai.ChatCompletionRequest{
            Model: "${model}",
            Messages: []openai.ChatCompletionMessage{
                {Role: openai.ChatMessageRoleUser, Content: "${prompt}"},
            },
            Temperature: 0.7,
        },
    )
    if err != nil {
        panic(err)
    }
    fmt.Println(resp.Choices[0].Message.Content)
}`;
  }
}

interface CodeSnippetsProps {
  baseUrl: string;
  apiKey?: string;
  model?: string;
  prompt?: string;
}

export function CodeSnippets({
  baseUrl,
  apiKey = "sk-ac-YOUR_API_KEY",
  model = "gpt-4o",
  prompt = "Hello, how are you?",
}: CodeSnippetsProps) {
  const [lang, setLang] = useState<Language>("curl");
  const [copied, setCopied] = useState(false);

  const snippet = generateSnippet(lang, { baseUrl, apiKey, model, prompt });

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
      {/* Language tabs */}
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex gap-1">
          {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                lang === l
                  ? `bg-accent ${LANG_LABELS[l].color} font-medium`
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {LANG_LABELS[l].label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" /> Copied!
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copy
            </>
          )}
        </button>
      </div>

      {/* Code block */}
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="text-foreground/80 font-mono whitespace-pre">{snippet}</code>
      </pre>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Embedding/Image/Audio snippet variants
   ═══════════════════════════════════════════════════════════════ */

export function EmbeddingSnippet({ baseUrl, apiKey = "sk-ac-YOUR_API_KEY" }: { baseUrl: string; apiKey?: string }) {
  const [copied, setCopied] = useState(false);
  const code = `curl ${baseUrl}/v1/embeddings \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "text-embedding-3-small",
    "input": "Hello world"
  }'`;

  return (
    <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[11px] text-emerald-400 font-medium">Embeddings</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
          {copied ? <><Check className="size-3 text-emerald-400" /> Copied!</> : <><Copy className="size-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="text-foreground/80 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export function ImageSnippet({ baseUrl, apiKey = "sk-ac-YOUR_API_KEY" }: { baseUrl: string; apiKey?: string }) {
  const [copied, setCopied] = useState(false);
  const code = `curl ${baseUrl}/v1/images/generations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "dall-e-3",
    "prompt": "A futuristic city at sunset",
    "size": "1024x1024"
  }'`;

  return (
    <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[11px] text-purple-400 font-medium">Image Generation</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
          {copied ? <><Check className="size-3 text-emerald-400" /> Copied!</> : <><Copy className="size-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="text-foreground/80 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
