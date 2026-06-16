import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const CATEGORIES = ["All", "Engineering", "Product", "Tutorials", "Company"];

/* Hardcoded fallback while DB is empty */
const FALLBACK_POSTS = [
  { slug: "smart-routing", title: "Introducing Smart Routing: Automatic model selection based on your prompt", excerpt: "We're launching Smart Routing — an intelligent system that analyzes your prompt and automatically selects the best model.", tags: ["Product"], author: "Alex Rahman", publishedAt: 1718000000000 },
  { slug: "uptime", title: "How we achieved 99.99% uptime with multi-region failover", excerpt: "A deep dive into AdalahCredit's infrastructure architecture, including multi-region deployment and automated failover.", tags: ["Engineering"], author: "Sarah Chen", publishedAt: 1717400000000 },
  { slug: "getting-started", title: "Getting started with AdalahCredit: From zero to first API call in 3 minutes", excerpt: "A step-by-step tutorial for developers new to AdalahCredit.", tags: ["Tutorials"], author: "Mike Torres", publishedAt: 1716800000000 },
  { slug: "model-comparison", title: "Comparing GPT-4o, Claude Sonnet 4, and Gemini 2.5 Pro for production use", excerpt: "We benchmarked the three most popular models across 15 real-world tasks.", tags: ["Engineering"], author: "Lisa Park", publishedAt: 1716200000000 },
  { slug: "series-a", title: "AdalahCredit raises $12M Series A to build the universal AI gateway", excerpt: "We're thrilled to announce our Series A funding led by Benchmark.", tags: ["Company"], author: "Alex Rahman", publishedAt: 1715600000000 },
  { slug: "rag-pipeline", title: "Building a RAG pipeline with AdalahCredit's streaming API", excerpt: "Learn how to build a production-ready RAG pipeline using AdalahCredit's streaming API.", tags: ["Tutorials"], author: "Mike Torres", publishedAt: 1715000000000 },
];

export function BlogPage() {
  const dbPosts = useQuery(api.blogFunctions.listPublished);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Merge DB posts with fallback
  type PostLike = { slug: string; title: string; excerpt: string; tags?: string[]; author?: string; publishedAt: number; content?: string };
  const allPosts = ((dbPosts && dbPosts.length > 0 ? dbPosts : FALLBACK_POSTS) as PostLike[]).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.tags?.[0] || "General",
    author: p.author || "Team",
    publishedAt: p.publishedAt || 0,
  }));

  const filtered = allPosts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const initials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
              <Zap className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold">AdalahCredit</span>
            <span className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">Blog</span>
          </Link>
          <Link to="/changelog" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Changelog →</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Blog</h1>
          <p className="text-sm text-muted-foreground">Engineering deep dives, product updates, tutorials, and company news.</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === c ? "bg-foreground text-background" : "bg-accent/50 text-muted-foreground hover:text-foreground border border-border"
                }`}>{c}</button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input type="text" placeholder="Search posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-accent/50 border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-foreground/70 placeholder:text-muted-foreground outline-none focus:border-border w-full sm:w-56" />
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {filtered.map((post, i) => (
            <Link key={post.slug || i} to={`/blog/${post.slug || slugify(post.title)}`}>
            <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="group flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5 bg-accent/30 border border-border rounded-xl p-4 sm:p-5 hover:border-border transition-all cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-medium text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">{post.category}</span>
                  <span className="text-[10px] text-muted-foreground">{fmtDate(post.publishedAt)}</span>
                </div>
                <h3 className="text-sm font-medium text-foreground/80 mb-1 group-hover:text-foreground transition-colors">{post.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-1">{post.excerpt}</p>
              </div>
              <div className="shrink-0 flex items-center gap-3 sm:pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="size-5 rounded-full bg-accent/50 flex items-center justify-center text-[7px] font-bold text-muted-foreground">{initials(post.author)}</div>
                  <span className="text-[10px] text-muted-foreground">{post.author}</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </motion.article>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16"><p className="text-sm text-muted-foreground">No posts found.</p></div>
        )}

        {/* Loading skeleton */}
        {dbPosts === undefined && (
          <div className="space-y-3 mt-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-accent/30 border border-border rounded-xl p-5 animate-pulse">
                <div className="h-3 bg-accent/50 rounded w-1/4 mb-3" />
                <div className="h-4 bg-accent/50 rounded w-3/4 mb-2" />
                <div className="h-3 bg-accent/50 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-6 mt-10 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to AdalahCredit
          </Link>
          <Link to="/changelog" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Changelog →</Link>
        </div>
      </main>
    </div>
  );
}
