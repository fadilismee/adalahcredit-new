import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher, useI18n } from "../lib/i18n";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Zap,
  Shield,
  BarChart3,
  Globe,
  Code2,
  Terminal,
  Cpu,
  Activity,
  Clock,
  Layers,
  RefreshCw,
  Star,
  ArrowUpRight,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   PROVIDER LOGOS (inline SVG for reliability)
   ═══════════════════════════════════════════════════════════════ */

function OpenAILogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function AnthropicLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.304 3.541h-3.48l6.696 16.918h3.48L17.304 3.541zM6.696 3.541L0 20.459h3.48l1.385-3.544h7.075l1.385 3.544H16.8L10.08 3.541H6.696zm.59 10.767l2.304-5.898 2.304 5.898H7.286z" />
    </svg>
  );
}

function GoogleLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MetaLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6.915 4.03c-1.968 0-3.326 1.09-4.587 3.124C1.326 8.852.5 11.27.5 12.868c0 2.071 1.272 3.632 3.469 3.632 1.57 0 2.727-.753 4.622-3.652.656-1.005 1.334-2.158 2.018-3.236l.738-1.164c.801-1.263 1.663-2.428 2.607-3.26 1.138-1.003 2.376-1.405 3.585-1.405 2.04 0 3.725 1.14 4.476 3.043.58 1.466.726 3.063.726 4.136 0 3.478-1.452 6.434-3.923 8.238l-1.13-.88c2.139-1.557 3.38-4.146 3.38-7.269 0-.898-.122-2.344-.617-3.593-.521-1.316-1.54-2.403-3.166-2.403-1.38 0-2.456.734-3.61 1.953-.733.774-1.459 1.767-2.22 2.96l-.702 1.104c-1.588 2.497-2.122 3.164-2.776 3.96-1.003 1.222-1.96 1.716-3.261 1.716C2.082 16.5.5 14.568.5 12.07c0-1.86.94-4.537 2.079-6.395C4.038 3.534 5.579 2.53 7.125 2.53c1.394 0 2.442.658 3.382 1.63l-.88 1.093c-.684-.773-1.485-1.222-2.712-1.222z" />
    </svg>
  );
}

function MistralLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="0" y="2" width="4" height="4" />
      <rect x="20" y="2" width="4" height="4" />
      <rect x="0" y="8" width="4" height="4" />
      <rect x="8" y="8" width="4" height="4" />
      <rect x="20" y="8" width="4" height="4" />
      <rect x="0" y="14" width="4" height="4" />
      <rect x="4" y="14" width="4" height="4" />
      <rect x="8" y="14" width="4" height="4" />
      <rect x="12" y="14" width="4" height="4" />
      <rect x="20" y="14" width="4" height="4" />
      <rect x="16" y="8" width="4" height="4" />
    </svg>
  );
}

function CohereLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8.55 14.13c1.697 0 3.073-.392 4.148-1.246a4.148 4.148 0 0 0 1.617-3.404A4.07 4.07 0 0 0 12.698 5.8C11.39 4.565 9.664 4 7.517 4H2v16h4.283v-5.87h2.267zm-.675-6.51h-.908v3.276h.908c1.442 0 2.164-.531 2.164-1.638 0-1.107-.722-1.638-2.164-1.638z" />
      <circle cx="18" cy="16.5" r="3.5" />
    </svg>
  );
}

function XAILogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M2.7 3l7.5 10.5L2.5 21h1.7l6.7-6.5L16.1 21H22l-7.8-11L21.5 3h-1.7L13.5 9.3 8.6 3H2.7zm2.5 1.2h2.6l11.1 15.6h-2.6L5.2 4.2z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

const PRICING = [
  {
    name: "Starter",
    price: "Rp 0",
    period: "Gratis selamanya",
    desc: "Untuk prototyping & eksperimen",
    features: ["Rp 79.000 kredit gratis", "Akses semua model", "1K req/min", "Community support", "Basic analytics"],
    cta: "Mulai Gratis",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp 459.000",
    period: "/bulan",
    desc: "Untuk production workloads",
    features: ["Rp 799.000 kredit included", "Priority routing", "10K req/min", "Priority support", "Advanced analytics", "Custom rate limits", "Webhook alerts"],
    cta: "Mulai Sekarang",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Full control at scale",
    features: ["Volume discounts", "Dedicated endpoints", "Unlimited req/min", "24/7 SLA", "SSO & RBAC", "On-prem option", "Custom models", "SOC2 & HIPAA"],
    cta: "Hubungi Sales",
    href: "/support",
    highlight: false,
  },
];


/* ═══════════════════════════════════════════════════════════════
   SHARED ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════════════ */

function Navbar() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50" : ""}`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-6 h-14 sm:h-16">
        <a href="/" className="flex items-center gap-2">
          <div className="size-7 sm:size-8 rounded-lg bg-foreground flex items-center justify-center">
            <Zap className="size-3.5 sm:size-4 text-background" />
          </div>
          <span className="text-sm sm:text-[15px] font-semibold text-foreground">AdalahCredit</span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground">
          {[{ key: "features", label: t("nav.features") }, { key: "pricing", label: t("nav.pricing") }].map((item) => (
            <a key={item.key} href={`#${item.key}`} className="hover:text-foreground transition-colors">{item.label}</a>
          ))}
          <a href="/models" className="hover:text-foreground transition-colors">{t("nav.models")}</a>
          <a href="/docs" className="hover:text-foreground transition-colors">{t("nav.docs")}</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <a href="/login" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{t("nav.login")}</a>
          <a href="/signup" className="text-[13px] font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors">{t("nav.getApiKey")}</a>
        </div>

        <button type="button" aria-label="Toggle menu" className="md:hidden text-foreground p-1" onClick={() => setOpen(!open)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 px-5 overflow-hidden"
          >
            <div className="py-4 space-y-1">
              {["Models", "Features", "Pricing"].map((l) => (
                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)} className="block text-sm text-foreground/70 py-2.5">{l}</a>
              ))}
              <a href="/docs" onClick={() => setOpen(false)} className="block text-sm text-foreground/70 py-2.5">{t("nav.docs")}</a>
              <a href="/models" onClick={() => setOpen(false)} className="block text-sm text-foreground/70 py-2.5">All Models</a>
              <div className="flex items-center gap-3 py-2.5">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <a href="/login" onClick={() => setOpen(false)} className="block text-sm text-foreground/70 py-2.5">{t("nav.login")}</a>
              <a href="/signup" className="block text-sm font-medium bg-foreground text-background text-center py-2.5 rounded-lg mt-3">{t("nav.getApiKey")}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════ */

/* ── Fake API log data ── */
const API_LOG_ENTRIES = [
  { time: "12:04:31.241", method: "POST", model: "gpt-4o", tokens: 1847, latency: "312ms", status: 200, user: "sk-***f8a2" },
  { time: "12:04:31.108", method: "POST", model: "claude-opus-4", tokens: 3201, latency: "1.2s", status: 200, user: "sk-***9c1d" },
  { time: "12:04:30.994", method: "POST", model: "gemini-2.5-pro", tokens: 892, latency: "245ms", status: 200, user: "sk-***4e7b" },
  { time: "12:04:30.871", method: "POST", model: "llama-4-maverick", tokens: 2156, latency: "189ms", status: 200, user: "sk-***a3f0" },
  { time: "12:04:30.655", method: "POST", model: "grok-3", tokens: 1433, latency: "402ms", status: 200, user: "sk-***7d2e" },
  { time: "12:04:30.412", method: "POST", model: "claude-sonnet-4", tokens: 967, latency: "198ms", status: 200, user: "sk-***b8c1" },
  { time: "12:04:30.198", method: "POST", model: "gpt-4.1", tokens: 4521, latency: "2.1s", status: 200, user: "sk-***e4a9" },
  { time: "12:04:29.987", method: "POST", model: "mistral-large", tokens: 1102, latency: "167ms", status: 200, user: "sk-***2f6c" },
  { time: "12:04:29.801", method: "POST", model: "deepseek-r1", tokens: 5840, latency: "3.4s", status: 200, user: "sk-***d1b8" },
  { time: "12:04:29.654", method: "POST", model: "gemini-2.5-flash", tokens: 456, latency: "87ms", status: 200, user: "sk-***c5e3" },
  { time: "12:04:29.432", method: "POST", model: "command-r-plus", tokens: 2890, latency: "445ms", status: 200, user: "sk-***a9d4" },
  { time: "12:04:29.201", method: "POST", model: "o3", tokens: 7123, latency: "4.8s", status: 200, user: "sk-***f2c7" },
  { time: "12:04:28.998", method: "POST", model: "codestral", tokens: 1567, latency: "234ms", status: 200, user: "sk-***8e1a" },
  { time: "12:04:28.776", method: "POST", model: "qwen-3", tokens: 934, latency: "156ms", status: 200, user: "sk-***b4f6" },
  { time: "12:04:28.543", method: "POST", model: "llama-4-scout", tokens: 1789, latency: "178ms", status: 200, user: "sk-***d7a2" },
  { time: "12:04:28.321", method: "POST", model: "claude-opus-4", tokens: 2445, latency: "987ms", status: 200, user: "sk-***c3e8" },
  { time: "12:04:28.109", method: "POST", model: "gpt-4o", tokens: 612, latency: "143ms", status: 200, user: "sk-***a1b5" },
  { time: "12:04:27.887", method: "POST", model: "gemini-2.5-pro", tokens: 3678, latency: "1.5s", status: 200, user: "sk-***e9c2" },
  { time: "12:04:27.654", method: "POST", model: "grok-3", tokens: 1098, latency: "321ms", status: 200, user: "sk-***f6d4" },
  { time: "12:04:27.432", method: "POST", model: "mistral-large", tokens: 2234, latency: "289ms", status: 200, user: "sk-***b2a7" },
];

const MODEL_COLORS: Record<string, string> = {
  "gpt-4o": "#10a37f",
  "gpt-4.1": "#10a37f",
  "o3": "#10a37f",
  "claude-opus-4": "#d4a27f",
  "claude-sonnet-4": "#d4a27f",
  "gemini-2.5-pro": "#4285F4",
  "gemini-2.5-flash": "#34A853",
  "llama-4-maverick": "#0668E1",
  "llama-4-scout": "#0668E1",
  "grok-3": "#a0a0a0",
  "mistral-large": "#F7D046",
  "codestral": "#F7D046",
  "deepseek-r1": "#4D6BFE",
  "command-r-plus": "#39594D",
  "qwen-3": "#FF6A00",
};

function LiveApiLog() {
  const logRef = useRef<HTMLDivElement>(null);
  const tripled = [...API_LOG_ENTRIES, ...API_LOG_ENTRIES, ...API_LOG_ENTRIES];

  return (
    <div className="relative w-full h-[340px] sm:h-[420px] lg:h-[480px] rounded-xl border border-border bg-background/80 overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-background">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-500/60" />
          <div className="size-2.5 rounded-full bg-yellow-500/60" />
          <div className="size-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground ml-2">api-gateway.log — live</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-500/80 font-mono">streaming</span>
        </div>
      </div>

      {/* Scrolling log entries */}
      <div className="relative h-[calc(100%-36px)] overflow-hidden">
        {/* Top & bottom fade masks */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent z-10" />

        <div ref={logRef} className="animate-scroll-log">
          {tripled.map((entry, idx) => (
            <div
              key={`${entry.time}-${idx}`}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-[7px] hover:bg-accent/30 transition-colors font-mono"
            >
              <span className="text-[10px] text-muted-foreground/50 shrink-0 hidden sm:inline">{entry.time}</span>
              <span className="text-[10px] font-semibold text-green-500/70 shrink-0">
                {entry.status}
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0">{entry.method}</span>
              <span
                className="text-[10px] sm:text-[11px] font-medium truncate shrink-0 min-w-0"
                style={{ color: MODEL_COLORS[entry.model] || "#888" }}
              >
                {entry.model}
              </span>
              <span className="text-[10px] text-muted-foreground/50 shrink-0 hidden md:inline">{entry.tokens} tok</span>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">{entry.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const url = "https://api.adalahcredit.com/v1/chat/completions";

  return (
    <section className="relative pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-20 px-5 sm:px-6 overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0v60H0' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left — Text */}
        <div>
          <motion.a
            href="/changelog"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs sm:text-[13px] text-muted-foreground border border-border rounded-full px-3 sm:px-4 py-1.5 mb-5 sm:mb-6 hover:border-border hover:text-foreground/70 transition-all"
          >
            <Sparkles className="size-3" />
            {t("hero.badge")}
            <ChevronRight className="size-3" />
          </motion.a>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
            className="text-[clamp(2rem,6vw,4rem)] font-bold leading-[1.08] tracking-tight text-foreground mb-4 sm:mb-5"
          >
            One API key for
            <br />
            <span className="text-muted-foreground">{t("hero.title2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 sm:mb-8 leading-relaxed"
          >
            {t("hero.subtitle")}
            One endpoint. No vendor lock-in.
          </motion.p>

          {/* API URL bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="inline-flex items-center gap-2 sm:gap-3 bg-accent/50 border border-border rounded-lg px-3 sm:px-4 py-2.5 mb-5 sm:mb-6 max-w-full overflow-x-auto"
          >
            <Terminal className="size-3.5 text-muted-foreground shrink-0" />
            <code className="text-xs sm:text-sm text-muted-foreground font-mono whitespace-nowrap">{url}</code>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-muted-foreground hover:text-foreground/70 transition-colors shrink-0"
            >
              {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
            </button>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-start gap-3"
          >
            <a href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-medium bg-foreground text-background px-6 py-3 rounded-lg hover:opacity-90 transition-all">
              Get Free API Key <ArrowRight className="size-3.5" />
            </a>
            <a href="/docs" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm text-muted-foreground px-6 py-3 rounded-lg border border-border hover:border-border hover:text-foreground/70 transition-all">
              <Code2 className="size-3.5" />
              Documentation
            </a>
          </motion.div>
        </div>

        {/* Right — Live API Log */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        >
          <LiveApiLog />
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROVIDERS STRIP (infinite scroll)
   ═══════════════════════════════════════════════════════════════ */

/* ── Scattered provider pills for the models section ── */
/* ── Model pills for marquee rows ── */
const MODEL_ROW_1 = [
  { name: "GPT-4o", provider: "OpenAI", logo: OpenAILogo, color: "#10a37f" },
  { name: "Claude Opus 4", provider: "Anthropic", logo: AnthropicLogo, color: "#d4a27f" },
  { name: "Gemini 2.5 Pro", provider: "Google", logo: GoogleLogo, color: "#4285F4" },
  { name: "Llama 4 Maverick", provider: "Meta", logo: MetaLogo, color: "#0668E1" },
  { name: "Grok 3", provider: "xAI", logo: XAILogo, color: "#a0a0a0" },
  { name: "Mistral Large", provider: "Mistral", logo: MistralLogo, color: "#F7D046" },
  { name: "Command R+", provider: "Cohere", logo: CohereLogo, color: "#39594D" },
  { name: "DeepSeek R1", provider: "DeepSeek", logo: null, color: "#4D6BFE" },
  { name: "Qwen 3 235B", provider: "Alibaba", logo: null, color: "#FF6A00" },
  { name: "DBRX", provider: "Databricks", logo: null, color: "#FF3621" },
  { name: "Phi-4", provider: "Microsoft", logo: null, color: "#00BCF2" },
  { name: "Jamba 1.5", provider: "AI21", logo: null, color: "#6C5CE7" },
];

const MODEL_ROW_2 = [
  { name: "GPT-5.5", provider: "OpenAI", logo: OpenAILogo, color: "#10a37f" },
  { name: "Claude Sonnet 4", provider: "Anthropic", logo: AnthropicLogo, color: "#d4a27f" },
  { name: "Gemini 2.5 Flash", provider: "Google", logo: GoogleLogo, color: "#34A853" },
  { name: "Llama 4 Scout", provider: "Meta", logo: MetaLogo, color: "#0668E1" },
  { name: "Codestral", provider: "Mistral", logo: MistralLogo, color: "#F7D046" },
  { name: "DeepSeek V3", provider: "DeepSeek", logo: null, color: "#4D6BFE" },
  { name: "Qwen 3 30B", provider: "Alibaba", logo: null, color: "#FF6A00" },
  { name: "Grok 3 Mini", provider: "xAI", logo: XAILogo, color: "#a0a0a0" },
  { name: "Command R", provider: "Cohere", logo: CohereLogo, color: "#39594D" },
  { name: "WizardLM 2", provider: "Microsoft", logo: null, color: "#00BCF2" },
  { name: "Nemotron", provider: "NVIDIA", logo: null, color: "#76B900" },
  { name: "Yi Lightning", provider: "01.AI", logo: null, color: "#FF4500" },
];

const MODEL_ROW_3 = [
  { name: "o3", provider: "OpenAI", logo: OpenAILogo, color: "#10a37f" },
  { name: "o4-mini", provider: "OpenAI", logo: OpenAILogo, color: "#10a37f" },
  { name: "Claude Haiku 3.5", provider: "Anthropic", logo: AnthropicLogo, color: "#d4a27f" },
  { name: "Gemini Nano", provider: "Google", logo: GoogleLogo, color: "#EA4335" },
  { name: "Mistral Small", provider: "Mistral", logo: MistralLogo, color: "#F7D046" },
  { name: "Llama 3.3 70B", provider: "Meta", logo: MetaLogo, color: "#0668E1" },
  { name: "Qwen Coder", provider: "Alibaba", logo: null, color: "#FF6A00" },
  { name: "Arctic", provider: "Snowflake", logo: null, color: "#29B5E8" },
  { name: "Gemma 3", provider: "Google", logo: GoogleLogo, color: "#4285F4" },
  { name: "Pixtral Large", provider: "Mistral", logo: MistralLogo, color: "#F7D046" },
  { name: "InternLM 3", provider: "Shanghai AI", logo: null, color: "#E040FB" },
  { name: "Falcon 3", provider: "TII", logo: null, color: "#8B5CF6" },
];

const MODEL_ROW_4 = [
  { name: "GPT-4o Mini", provider: "OpenAI", logo: OpenAILogo, color: "#10a37f" },
  { name: "Claude Instant", provider: "Anthropic", logo: AnthropicLogo, color: "#d4a27f" },
  { name: "Gemini Pro", provider: "Google", logo: GoogleLogo, color: "#FBBC04" },
  { name: "Mixtral 8x22B", provider: "Mistral", logo: MistralLogo, color: "#F7D046" },
  { name: "Solar Pro", provider: "Upstage", logo: null, color: "#FF6B6B" },
  { name: "StableLM 2", provider: "Stability", logo: null, color: "#A855F7" },
  { name: "Aya Expanse", provider: "Cohere", logo: CohereLogo, color: "#39594D" },
  { name: "Grok 2", provider: "xAI", logo: XAILogo, color: "#a0a0a0" },
  { name: "DeepSeek Coder", provider: "DeepSeek", logo: null, color: "#4D6BFE" },
  { name: "Cohere Embed", provider: "Cohere", logo: CohereLogo, color: "#39594D" },
  { name: "Voyage 3", provider: "Voyage AI", logo: null, color: "#06B6D4" },
  { name: "Jina Embed", provider: "Jina AI", logo: null, color: "#F59E0B" },
];

function ModelPill({ model }: { model: { name: string; provider: string; logo: React.FC<{ className?: string }> | null; color: string } }) {
  return (
    <div className="shrink-0 inline-flex items-center gap-2 bg-accent/30 border border-border rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5 hover:border-border hover:bg-accent/50 transition-colors cursor-default group">
      <div className="size-5 sm:size-6 rounded-full bg-accent/50 flex items-center justify-center shrink-0" style={{ color: model.color }}>
        {model.logo ? <model.logo className="size-3 sm:size-3.5" /> : (
          <span className="text-[8px] sm:text-[9px] font-bold">{model.provider.slice(0, 2)}</span>
        )}
      </div>
      <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground/80 whitespace-nowrap transition-colors">{model.name}</span>
    </div>
  );
}

function ModelMarqueeRow({ models, reverse = false, speed = "60s" }: { models: typeof MODEL_ROW_1; reverse?: boolean; speed?: string }) {
  const tripled = [...models, ...models, ...models];
  return (
    <div className="overflow-hidden mask-gradient">
      <div
        className={`flex gap-3 w-max ${reverse ? "animate-scroll-reverse" : "animate-scroll"}`}
        style={{ animationDuration: speed }}
      >
        {tripled.map((m, i) => (
          <ModelPill key={`${m.name}-${i}`} model={m} />
        ))}
      </div>
    </div>
  );
}

function ScatteredModelsSection() {
  const { t } = useI18n();
  return (
    <Section id="models" className="py-16 sm:py-28 border-y border-border overflow-hidden">
      <div className="text-center mb-10 sm:mb-14 px-5">
        <motion.p variants={fadeUp} className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">Models</motion.p>
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-foreground">{t("landing.modelsTitle")}</motion.h2>
        <motion.p variants={fadeUp} className="text-sm text-muted-foreground mt-2">Every major provider. Always up to date.</motion.p>
      </div>

      {/* Full-width marquee rows — alternating directions */}
      <div className="space-y-3 sm:space-y-4">
        <ModelMarqueeRow models={MODEL_ROW_1} speed="50s" />
        <ModelMarqueeRow models={MODEL_ROW_2} reverse speed="55s" />
        <ModelMarqueeRow models={MODEL_ROW_3} speed="48s" />
        <ModelMarqueeRow models={MODEL_ROW_4} reverse speed="52s" />
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOKEN PRICING CARDS (staggered, auto-scroll right)
   ═══════════════════════════════════════════════════════════════ */

const TOKEN_PRICES = [
  { model: "GPT-4o", provider: "OpenAI", logo: OpenAILogo, color: "#10a37f", input: "$2.50", output: "$10.00" },
  { model: "GPT-5.5", provider: "OpenAI", logo: OpenAILogo, color: "#10a37f", input: "$5.00", output: "$15.00" },
  { model: "o3", provider: "OpenAI", logo: OpenAILogo, color: "#10a37f", input: "$10.00", output: "$40.00" },
  { model: "Claude Opus 4", provider: "Anthropic", logo: AnthropicLogo, color: "#d4a27f", input: "$15.00", output: "$75.00" },
  { model: "Claude Sonnet 4", provider: "Anthropic", logo: AnthropicLogo, color: "#d4a27f", input: "$3.00", output: "$15.00" },
  { model: "Gemini 2.5 Pro", provider: "Google", logo: GoogleLogo, color: "#4285F4", input: "$1.25", output: "$10.00" },
  { model: "Gemini 2.5 Flash", provider: "Google", logo: GoogleLogo, color: "#34A853", input: "$0.15", output: "$0.60" },
  { model: "Llama 4 Maverick", provider: "Meta", logo: MetaLogo, color: "#0668E1", input: "$0.20", output: "$0.60" },
  { model: "Grok 3", provider: "xAI", logo: XAILogo, color: "#a0a0a0", input: "$3.00", output: "$15.00" },
  { model: "Mistral Large", provider: "Mistral", logo: MistralLogo, color: "#F7D046", input: "$2.00", output: "$6.00" },
  { model: "Codestral", provider: "Mistral", logo: MistralLogo, color: "#F7D046", input: "$0.30", output: "$0.90" },
  { model: "Command R+", provider: "Cohere", logo: CohereLogo, color: "#39594D", input: "$2.50", output: "$10.00" },
  { model: "DeepSeek R1", provider: "DeepSeek", logo: null, color: "#4D6BFE", input: "$0.55", output: "$2.19" },
  { model: "Qwen 3", provider: "Alibaba", logo: null, color: "#FF6A00", input: "$0.30", output: "$1.20" },
];

function TokenPricingRow({ items, reverse = false }: { items: typeof TOKEN_PRICES; reverse?: boolean }) {
  const tripled = [...items, ...items, ...items];
  return (
    <div className={`flex gap-3 sm:gap-4 w-max ${reverse ? "animate-scroll-reverse" : "animate-scroll"}`}>
      {tripled.map((t, i) => (
        <div
          key={`${t.model}-${i}`}
          className="shrink-0 w-[200px] sm:w-[240px] bg-accent/30 border border-border rounded-xl p-4 sm:p-5 hover:border-border transition-colors group"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="size-7 sm:size-8 rounded-lg bg-accent/50 flex items-center justify-center shrink-0" style={{ color: t.color }}>
              {t.logo ? <t.logo className="size-3.5 sm:size-4" /> : (
                <span className="text-[9px] font-bold">{t.provider.slice(0, 2)}</span>
              )}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">{t.model}</div>
              <div className="text-[10px] text-muted-foreground">{t.provider}</div>
            </div>
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">Input / 1M</div>
              <div className="text-xs sm:text-sm font-semibold text-foreground/70">{t.input}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground mb-0.5">Output / 1M</div>
              <div className="text-xs sm:text-sm font-semibold text-foreground/70">{t.output}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TokenPricingMarquee() {
  const { t } = useI18n();
  const row1 = TOKEN_PRICES.slice(0, 7);
  const row2 = TOKEN_PRICES.slice(7);

  return (
    <Section className="py-12 sm:py-20 overflow-hidden">
      <div className="text-center mb-8 sm:mb-12 px-5">
        <motion.p variants={fadeUp} className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">{t("pricing.transparentPricing")}</motion.p>
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-foreground">{t("pricing.payPerToken")}</motion.h2>
        <motion.p variants={fadeUp} className="text-sm text-muted-foreground mt-2">{t("pricing.perMillion")}</motion.p>
      </div>

      <div className="space-y-3 sm:space-y-4 mask-gradient">
        <TokenPricingRow items={row1} />
        <TokenPricingRow items={row2} reverse />
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CODE SHOWCASE
   ═══════════════════════════════════════════════════════════════ */

function CodeShowcase() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"python" | "node" | "curl">("node");

  const codeBlocks = {
    node: [
      { code: `import AdalahCredit from "adalahcredit"`, cls: "" },
      { code: ``, cls: "" },
      { code: `const ng = new AdalahCredit({`, cls: "" },
      { code: `  apiKey: process.env.CREDIT_KEY`, cls: "text-green-400/80" },
      { code: `})`, cls: "" },
      { code: ``, cls: "" },
      { code: `const res = await ng.chat.completions.create({`, cls: "" },
      { code: `  model: "claude-opus-4",`, cls: "text-amber-400/80" },
      { code: `  messages: [`, cls: "" },
      { code: `    { role: "user", content: "Hello" }`, cls: "text-green-400/80" },
      { code: `  ],`, cls: "" },
      { code: `  stream: true`, cls: "" },
      { code: `})`, cls: "" },
    ],
    python: [
      { code: `from adalahcredit import AdalahCredit`, cls: "" },
      { code: ``, cls: "" },
      { code: `ng = AdalahCredit(`, cls: "" },
      { code: `    api_key=os.environ["CREDIT_KEY"]`, cls: "text-green-400/80" },
      { code: `)`, cls: "" },
      { code: ``, cls: "" },
      { code: `response = ng.chat.completions.create(`, cls: "" },
      { code: `    model="claude-opus-4",`, cls: "text-amber-400/80" },
      { code: `    messages=[`, cls: "" },
      { code: `        {"role": "user", "content": "Hello"}`, cls: "text-green-400/80" },
      { code: `    ],`, cls: "" },
      { code: `    stream=True`, cls: "" },
      { code: `)`, cls: "" },
    ],
    curl: [
      { code: `curl https://api.adalahcredit.com/v1/chat/completions \\`, cls: "" },
      { code: `  -H "Authorization: Bearer $CREDIT_KEY" \\`, cls: "text-green-400/80" },
      { code: `  -H "Content-Type: application/json" \\`, cls: "" },
      { code: `  -d '{`, cls: "" },
      { code: `    "model": "claude-opus-4",`, cls: "text-amber-400/80" },
      { code: `    "messages": [`, cls: "" },
      { code: `      {"role": "user", "content": "Hello"}`, cls: "text-green-400/80" },
      { code: `    ],`, cls: "" },
      { code: `    "stream": true`, cls: "" },
      { code: `  }'`, cls: "" },
    ],
  };

  return (
    <Section className="py-16 sm:py-24 px-5 sm:px-6 border-t border-border">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
        {/* Left */}
        <div>
          <motion.p variants={fadeUp} className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">{t("landing.integration")}</motion.p>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            {t("landing.fiveLines1")}
            <br />{t("landing.fiveLines2")}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
            {t("landing.integrationDesc")}
          </motion.p>

          <div className="space-y-3 sm:space-y-4">
            {[
              { icon: Code2, t: "OpenAI-compatible", d: "Drop-in replacement, zero code changes" },
              { icon: Activity, t: "Full streaming", d: "SSE for all supported models" },
              { icon: Cpu, t: "Every language", d: "Python, Node.js, Go, Rust, and more" },
            ].map((f) => (
              <motion.div key={f.t} variants={fadeUp} className="flex items-start gap-3">
                <div className="size-8 rounded-md bg-accent/50 border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground/80">{f.t}</div>
                  <div className="text-xs text-muted-foreground">{f.d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right — code block with tabs */}
        <motion.div variants={fadeUp} className="bg-background border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-secondary" />
              <div className="size-2.5 rounded-full bg-secondary" />
              <div className="size-2.5 rounded-full bg-secondary" />
            </div>
            <div className="flex gap-1">
              {(["node", "python", "curl"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setTab(lang)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded transition-colors ${tab === lang ? "text-foreground bg-accent/70" : "text-muted-foreground hover:text-muted-foreground"}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 sm:p-5 font-mono text-[12px] sm:text-[13px] leading-6 overflow-x-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {codeBlocks[tab].map((l, i) => (
                  <div key={i} className="flex">
                    <span className="w-6 sm:w-8 text-right text-muted-foreground select-none pr-3 sm:pr-4 text-[11px] leading-6">{i + 1}</span>
                    <span className={l.cls || "text-muted-foreground"}>{l.code}</span>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FEATURES
   ═══════════════════════════════════════════════════════════════ */

function Features() {
  const { t } = useI18n();
  const items = [
    { icon: RefreshCw, title: t("features.smartRouting"), desc: t("features.smartRoutingDesc") },
    { icon: Shield, title: t("features.enterpriseSecurity"), desc: t("features.enterpriseSecurityDesc") },
    { icon: Globe, title: t("features.realTimeAnalytics"), desc: t("features.realTimeAnalyticsDesc") },
    { icon: Clock, title: t("features.semanticCache"), desc: t("features.semanticCacheDesc") },
    { icon: Layers, title: t("features.unifiedBilling"), desc: t("features.unifiedBillingDesc") },
    { icon: BarChart3, title: t("features.sdksAndPlugins"), desc: t("features.sdksAndPluginsDesc") },
  ];

  return (
    <Section id="features" className="py-16 sm:py-24 px-5 sm:px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <motion.p variants={fadeUp} className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">{t("nav.features")}</motion.p>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-foreground">{t("features.title")}</motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-accent/50 rounded-xl overflow-hidden border border-border">
          {items.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              className="bg-background p-6 sm:p-8"
            >
              <f.icon className="size-5 text-muted-foreground mb-4" strokeWidth={1.5} />
              <h3 className="text-sm sm:text-[15px] font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════════════════════════ */

function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    { n: "01", title: t("howItWorks.step1"), desc: t("howItWorks.step1Desc") },
    { n: "02", title: t("howItWorks.step2"), desc: t("howItWorks.step2Desc") },
    { n: "03", title: t("howItWorks.step3"), desc: t("howItWorks.step3Desc") },
    { n: "04", title: t("howItWorks.step4"), desc: t("howItWorks.step4Desc") },
  ];

  return (
    <Section className="py-16 sm:py-24 px-5 sm:px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <motion.p variants={fadeUp} className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">{t("howItWorks.title")}</motion.p>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-foreground">{t("howItWorks.title")}</motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((s, i) => (
            <motion.div key={s.n} variants={fadeUp}>
              <div className="text-4xl sm:text-5xl font-bold text-foreground/[0.04] mb-3 sm:mb-4">{s.n}</div>
              <h3 className="text-sm sm:text-[15px] font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              {i < 3 && <div className="hidden lg:block h-px bg-gradient-to-r from-white/[0.04] to-transparent mt-6" />}
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════════════════════════ */

function Testimonials() {
  const { t } = useI18n();
  const items = [
    { name: "Andi Pratama", role: "CTO, TokoByte", text: "Dengan AdalahCredit, tim kami hemat 40+ jam engineering per bulan. Satu integrasi, semua model langsung jalan.", initials: "AP" },
    { name: "Rina Wijaya", role: "Lead Engineer, DataSatu", text: "Auto-failover jadi game-changer buat kami. Uptime naik dari 99.5% ke 99.99% tanpa effort tambahan.", initials: "RW" },
    { name: "Budi Santoso", role: "Founder, KodeAI", text: "Kami test 12 model berbeda dalam satu sore. Tanpa AdalahCredit, itu butuh berminggu-minggu setup.", initials: "BS" },
  ];

  return (
    <Section className="py-16 sm:py-24 px-5 sm:px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <motion.p variants={fadeUp} className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-8 sm:mb-12 text-center">{t("testimonials.title")}</motion.p>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {items.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="border border-border rounded-xl p-5 sm:p-6 hover:border-border transition-colors"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="size-3 sm:size-3.5 fill-amber-500/60 text-amber-500/60" />)}
              </div>
              <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed mb-5 sm:mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-accent/50 flex items-center justify-center text-[11px] font-medium text-muted-foreground">
                  {t.initials}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRICING
   ═══════════════════════════════════════════════════════════════ */

function PricingSection() {
  const { t } = useI18n();
  return (
    <Section id="pricing" className="py-16 sm:py-24 px-5 sm:px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <motion.p variants={fadeUp} className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">{t("nav.pricing")}</motion.p>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-foreground">{t("pricing.title")}</motion.h2>
          <motion.p variants={fadeUp} className="text-sm text-muted-foreground mt-3">{t("pricing.subtitle")}</motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
          {PRICING.map((p) => (
            <motion.div
              key={p.name}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`rounded-xl border p-6 sm:p-8 flex flex-col transition-colors ${
                p.highlight
                  ? "bg-accent/30 border-border"
                  : "bg-accent/30 border-border hover:border-border"
              }`}
            >
              {p.highlight && (
                <span className="text-[10px] font-semibold bg-foreground text-background px-2 py-0.5 rounded self-start mb-3 sm:mb-4">POPULAR</span>
              )}
              <h3 className="text-base sm:text-lg font-semibold text-foreground">{p.name}</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 mb-4 sm:mb-6">{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">{p.price}</span>
                {p.period && <span className="text-xs sm:text-sm text-muted-foreground">{p.period}</span>}
              </div>
              <a
                href={p.href}
                className={`block w-full py-2.5 rounded-lg text-sm font-medium text-center transition-colors mb-6 sm:mb-8 ${
                  p.highlight
                    ? "bg-foreground text-background hover:opacity-90"
                    : "bg-accent/50 text-foreground/70 border border-border hover:bg-accent/70"
                }`}
              >
                {p.cta}
              </a>
              <div className="space-y-2.5 sm:space-y-3 mt-auto">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground">
                    <Check className="size-3.5 text-muted-foreground shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════ */

function FAQ() {
  const { t } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqData = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
  ];

  return (
    <Section id="faq" className="py-16 sm:py-24 px-5 sm:px-6 border-t border-border">
      <div className="max-w-2xl mx-auto">
        <motion.p variants={fadeUp} className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4 text-center">FAQ</motion.p>
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-8 sm:mb-12">{t("faq.title")}</motion.h2>

        <div className="divide-y divide-border">
          {faqData.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <motion.div key={i} variants={fadeUp}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between py-4 sm:py-5 text-left group"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                >
                  <span className="text-xs sm:text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors pr-4">{item.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4 sm:pb-5">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════════════════════════ */

function CTA() {
  const { t } = useI18n();
  return (
    <Section className="py-16 sm:py-24 px-5 sm:px-6 border-t border-border">
      <div className="max-w-2xl mx-auto text-center">
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
          Start building with every AI model
        </motion.h2>
        <motion.p variants={fadeUp} className="text-sm text-muted-foreground mb-6 sm:mb-8">{t("cta.subtitle")}</motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-medium bg-foreground text-background px-6 py-3 rounded-lg hover:opacity-90 transition-all">
            Get Started Free <ArrowRight className="size-3.5" />
          </a>
          <a href="/support" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm text-muted-foreground px-6 py-3 rounded-lg border border-border hover:border-border transition-all">
            Talk to Sales <ArrowUpRight className="size-3.5" />
          </a>
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  const { t } = useI18n();
  const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
    [t("footer.product")]: [
      { label: "API Reference", href: "/docs" },
      { label: t("nav.models"), href: "/models" },
      { label: t("nav.pricing"), href: "/#pricing" },
      { label: t("nav.changelog"), href: "/changelog" },
      { label: t("footer.status"), href: "/status" },
      { label: "Playground", href: "/playground" },
    ],
    [t("footer.resources")]: [
      { label: t("nav.docs"), href: "/docs" },
      { label: "SDK Libraries", href: "/sdks" },
      { label: t("nav.blog"), href: "/blog" },
      { label: t("nav.support"), href: "/support" },
      { label: t("footer.compare"), href: "/compare" },
    ],
    [t("footer.company")]: [
      { label: t("footer.privacy"), href: "/privacy" },
      { label: t("footer.terms"), href: "/terms" },
      { label: t("footer.referral"), href: "/referral" },
      { label: t("nav.login"), href: "/login" },
      { label: t("login.signUp"), href: "/signup" },
    ],
  };

  return (
    <footer className="border-t border-border py-10 sm:py-12 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 sm:mb-12">
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-3">
              <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
                <Zap className="size-3.5 text-background" />
              </div>
              <span className="text-sm font-semibold text-foreground">AdalahCredit</span>
            </a>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("footer.tagline").split("\n")[0]}<br />{t("footer.tagline").split("\n")[1]}</p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-medium text-muted-foreground mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.label}><a href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground">{t("footer.copyright")}</span>
          <div className="flex gap-5">
            {[
              { label: "Twitter", href: "https://twitter.com/adalahcredit" },
              { label: "GitHub", href: "https://github.com/adalahcredit" },
              { label: "Discord", href: "https://discord.gg/adalahcredit" },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">{s.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent">
      <Navbar />
      <Hero />
      <ScatteredModelsSection />
      <TokenPricingMarquee />
      <CodeShowcase />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingSection />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
