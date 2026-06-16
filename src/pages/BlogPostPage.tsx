import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft, Calendar, User, Tag, Clock } from "lucide-react";

// Fallback posts for when DB is empty
const FALLBACK_POSTS: Record<string, { title: string; author: string; category: string; date: string; readTime: string; content: string }> = {
  "introducing-smart-routing": {
    title: "Introducing Smart Routing: Automatic model selection based on your prompt",
    author: "Alex Rahman",
    category: "Product",
    date: "Jun 9, 2024",
    readTime: "5 min read",
    content: `We're launching Smart Routing — an intelligent system that analyzes your prompt and automatically selects the best AI model for the task.

## Why Smart Routing?

Different AI models excel at different tasks. GPT-4o is great for general conversation, Claude excels at code and analysis, and Gemini shines with large context windows. But choosing the right model for every request is tedious.

Smart Routing solves this by analyzing your prompt in real-time and routing it to the optimal model based on:

- **Task type** — coding, writing, analysis, math, creative
- **Complexity** — simple queries go to faster/cheaper models
- **Context length** — long documents route to models with larger windows
- **Cost optimization** — balances quality vs. cost based on your preferences

## How it works

Simply use \`smart\` as your model name:

\`\`\`python
response = client.chat.completions.create(
    model="smart",
    messages=[{"role": "user", "content": "Write a React component"}]
)
# Routes to Claude Sonnet 4 (best for code)
\`\`\`

## Performance

In our benchmarks across 1,000 diverse prompts:
- **94% accuracy** in model selection vs. human experts
- **32% cost reduction** compared to always using GPT-4o
- **18% faster** average response times

Smart Routing is available now for all Pro and Enterprise plans.`,
  },
  "multi-region-failover": {
    title: "How we achieved 99.99% uptime with multi-region failover",
    author: "Sarah Chen",
    category: "Engineering",
    date: "Jun 3, 2024",
    readTime: "8 min read",
    content: `A deep dive into AdalahCredit's infrastructure architecture, including multi-region deployment and automated failover.

## The Challenge

When your customers depend on your API gateway for every AI request, downtime isn't an option. We set an ambitious target: 99.99% uptime — that's less than 53 minutes of downtime per year.

## Architecture

Our infrastructure spans three regions:

1. **US-East (Primary)** — Virginia, handles ~60% of traffic
2. **EU-West (Secondary)** — Frankfurt, serves European customers
3. **AP-Southeast (Tertiary)** — Singapore, serves Asian customers

Each region runs independently with its own:
- Load balancers (Cloudflare)
- Application servers (edge workers)
- Provider key pools
- Response cache layer

## Failover Logic

When a region detects degraded performance:

1. Health checks fail for 3 consecutive intervals (15 seconds)
2. DNS automatically shifts traffic to the nearest healthy region
3. The failover happens in under 30 seconds
4. Once recovered, traffic gradually shifts back

## Results

Since deploying multi-region failover:
- **99.997%** actual uptime over 6 months
- **< 200ms** average failover time
- **Zero** complete outages

We'll continue investing in reliability as we scale to handle millions of requests per day.`,
  },
  "getting-started-tutorial": {
    title: "Getting started with AdalahCredit: From zero to first API call in 3 minutes",
    author: "Mike Torres",
    category: "Tutorials",
    date: "May 27, 2024",
    readTime: "3 min read",
    content: `A step-by-step tutorial for developers new to AdalahCredit.

## Step 1: Create an account

Sign up at adalahcredit.com/signup. You'll get $5 in free credits — enough for thousands of API calls.

## Step 2: Get your API key

After signing up, you'll go through our onboarding flow. Click "Generate API Key" and copy your key. It starts with ac-live-.

## Step 3: Make your first request

\`\`\`bash
curl https://api.adalahcredit.com/v1/chat/completions \\
  -H "Authorization: Bearer ac-live-sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello!"}]}'
\`\`\`

## Step 4: Try different models

The beauty of AdalahCredit is one API key works with any model:

\`\`\`python
# OpenAI
response = client.chat.completions.create(model="gpt-4o", ...)

# Anthropic
response = client.chat.completions.create(model="claude-sonnet-4", ...)

# Google
response = client.chat.completions.create(model="gemini-2.5-pro", ...)
\`\`\`

All with the same API key and endpoint!

## What's next?

- Check out our Documentation for advanced features
- Try the API Playground to test models
- Compare models on our Compare page

Happy coding!`,
  },
};

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const dbPosts = useQuery(api.blogFunctions.listPublished);

  // Try to find in DB first
  const dbPost = dbPosts?.find((p: { title: string; slug?: string }) => (p.slug || slugify(p.title)) === slug);

  // Then try fallback
  const fallback = slug ? FALLBACK_POSTS[slug] : null;

  if (dbPosts === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-3/4" />
          <div className="h-4 bg-card rounded w-1/2" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-card rounded" style={{ width: `${90 - i * 5}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const post = dbPost
    ? {
        title: dbPost.title,
        author: dbPost.author,
        category: dbPost.tags?.[0] ?? "General",
        date: new Date(dbPost.publishedAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        readTime: `${Math.max(1, Math.round((dbPost.content?.length ?? 500) / 1000))} min read`,
        content: dbPost.content ?? "",
      }
    : fallback;

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
          <p className="text-muted-foreground">The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300">
            <ArrowLeft className="size-4" /> Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-xl z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" /> Back to Blog
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Meta */}
        <div className="mb-8 space-y-4">
          <span className="inline-block text-xs font-medium bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">
            <Tag className="size-3 inline mr-1" />{post.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><User className="size-3.5" />{post.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="size-3.5" />{post.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{post.readTime}</span>
          </div>
        </div>

        {/* Content — rendered as markdown-ish */}
        <div className="prose prose-invert max-w-none">
          {post.content.split("\n\n").map((block: string, i: number) => {
            if (block.startsWith("## ")) {
              return <h2 key={i} className="text-xl font-semibold text-foreground mt-8 mb-3">{block.replace("## ", "")}</h2>;
            }
            if (block.startsWith("```")) {
              const lines = block.split("\n");
              const code = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
              return (
                <pre key={i} className="bg-card border border-border rounded-xl p-4 overflow-x-auto my-4">
                  <code className="text-sm text-emerald-300 font-mono">{code}</code>
                </pre>
              );
            }
            if (block.startsWith("- ")) {
              return (
                <ul key={i} className="list-disc list-inside space-y-1 text-foreground/80 my-3">
                  {block.split("\n").map((item: string, j: number) => (
                    <li key={j}>{item.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "$1")}</li>
                  ))}
                </ul>
              );
            }
            if (block.match(/^1\. /)) {
              return (
                <ol key={i} className="list-decimal list-inside space-y-1 text-foreground/80 my-3">
                  {block.split("\n").map((item: string, j: number) => (
                    <li key={j}>{item.replace(/^\d+\.\s/, "")}</li>
                  ))}
                </ol>
              );
            }
            return <p key={i} className="text-foreground/80 leading-relaxed my-3">{block}</p>;
          })}
        </div>

        {/* Back */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            <ArrowLeft className="size-4" /> All posts
          </Link>
        </div>
      </article>
    </div>
  );
}
