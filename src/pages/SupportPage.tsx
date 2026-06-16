import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowLeft,
  Send,
  MessageSquare,
  BookOpen,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Bug,
  CreditCard,
  Shield,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

const CONTACT_CHANNELS = [
  { icon: Mail, title: "Email Support", detail: "support@adalahcredit.com", sub: "Response within 4 hours (Pro & Enterprise)", href: "mailto:support@adalahcredit.com" },
  { icon: MessageSquare, title: "Discord Community", detail: "discord.gg/credit-ai", sub: "Get help from the community & team", href: "#" },
  { icon: BookOpen, title: "Documentation", detail: "docs.adalahcredit.com", sub: "Guides, API reference, examples", href: "/docs" },
];

const TICKET_CATEGORIES = [
  { value: "technical", label: "Technical Issue", icon: Bug },
  { value: "billing", label: "Billing & Payment", icon: CreditCard },
  { value: "security", label: "Security Concern", icon: Shield },
  { value: "feature", label: "Feature Request", icon: HelpCircle },
  { value: "other", label: "Other", icon: MessageSquare },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", desc: "General question, no impact" },
  { value: "medium", label: "Medium", desc: "Some impact on development" },
  { value: "high", label: "High", desc: "Production impact, workaround available" },
  { value: "critical", label: "Critical", desc: "Production down, no workaround" },
];

const SUPPORT_FAQ = [
  { q: "How long does it take to get a response?", a: "Starter plans: 24 hours. Pro plans: 4 hours. Enterprise: 1 hour with dedicated support channel. Critical issues are prioritized regardless of plan." },
  { q: "Where can I check API uptime?", a: "Visit our Status Page at adalahcredit.com/status for real-time uptime monitoring, incident history, and subscribe to notifications." },
  { q: "How do I report a security vulnerability?", a: "Please email security@adalahcredit.com with details. Do NOT disclose security issues publicly. We have a responsible disclosure program and will respond within 24 hours." },
  { q: "Can I get a refund?", a: "AdalahCredit usage is non-refundable, but if you experienced service issues (downtime exceeding SLA), you may be eligible for service credits. Contact billing@adalahcredit.com." },
  { q: "How do I upgrade my plan?", a: "Go to Dashboard → Billing → Change Plan. Upgrades take effect immediately. Downgrades take effect at the next billing cycle." },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const submitTicket = useMutation(api.supportFunctions.submitTicket);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = e.target as HTMLFormElement;
      const data = new FormData(form);
      const catMap: Record<string, "billing" | "technical" | "general" | "bug" | "feature_request"> = {
        technical: "technical", billing: "billing", security: "technical", feature: "feature_request", other: "general",
      };
      const id = await submitTicket({
        email: data.get("email") as string,
        name: data.get("name") as string || (data.get("email") as string).split("@")[0],
        subject: data.get("subject") as string,
        message: data.get("message") as string,
        category: catMap[category] || "general",
      });
      setTicketId(String(id).slice(-8).toUpperCase());
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">Support</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Dashboard</Link>
            <Link to="/status" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400" /> System Status
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 sm:py-16">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">How can we help?</h1>
          <p className="text-sm text-muted-foreground">Get support from our team or find answers in the docs.</p>
        </motion.div>

        {/* Contact channels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          {CONTACT_CHANNELS.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="bg-accent/30 border border-border rounded-xl p-5 hover:border-border transition-colors group"
            >
              <div className="size-9 rounded-lg bg-accent/50 flex items-center justify-center mb-3 group-hover:bg-accent/50 transition-colors">
                <c.icon className="size-4 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground/80 mb-0.5">{c.title}</h3>
              <p className="text-xs text-blue-400 mb-1">{c.detail}</p>
              <p className="text-[10px] text-muted-foreground">{c.sub}</p>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ticket form */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Submit a Ticket</h2>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-8 text-center"
              >
                <CheckCircle2 className="size-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-foreground mb-1">Ticket Submitted!</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  We've received your request and will respond within the SLA for your plan.
                </p>
                <div className="inline-flex items-center gap-2 text-[10px] text-muted-foreground bg-accent/50 px-3 py-1.5 rounded-lg">
                  <Clock className="size-3" /> Ticket ID: #{ticketId || "CR-XXXX"}
                </div>
                <button onClick={() => setSubmitted(false)} className="block mx-auto mt-4 text-xs text-muted-foreground hover:text-foreground/70 transition-colors">
                  Submit another ticket
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {TICKET_CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors ${
                          category === c.value
                            ? "bg-accent/50 border-border text-foreground"
                            : "bg-accent/30 border-border text-muted-foreground hover:text-foreground/70"
                        }`}
                      >
                        <c.icon className="size-3.5" />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground/70 outline-none focus:border-border transition-colors"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground/70 placeholder-muted-foreground outline-none focus:border-border transition-colors"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground/70 placeholder-muted-foreground outline-none focus:border-border transition-colors"
                    required
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Subject</label>
                  <input
                    name="subject"
                    type="text"
                    placeholder="Brief description of the issue"
                    className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground/70 placeholder-muted-foreground outline-none focus:border-border transition-colors"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Describe your issue in detail. Include error messages, API request IDs, or steps to reproduce if applicable."
                    className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2.5 text-xs text-foreground/70 placeholder-muted-foreground outline-none focus:border-border transition-colors resize-none leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium bg-foreground text-background px-4 py-2.5 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  {loading ? "Submitting..." : "Submit Ticket"}
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Frequently Asked</h2>
            <div className="space-y-2">
              {SUPPORT_FAQ.map((faq, i) => (
                <div key={i} className="bg-accent/30 border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-3.5 text-left hover:bg-accent/30 transition-colors"
                  >
                    <span className="text-xs font-medium text-foreground/70 pr-4">{faq.q}</span>
                    <ChevronDown className={`size-3.5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-3.5 pb-3.5">
                      <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Response times */}
            <div className="mt-6 bg-accent/30 border border-border rounded-xl p-5">
              <h3 className="text-xs font-medium text-foreground/70 mb-3 flex items-center gap-1.5">
                <Clock className="size-3.5" /> Response Times by Plan
              </h3>
              <div className="space-y-2">
                {[
                  { plan: "Starter", time: "24 hours", channels: "Email" },
                  { plan: "Pro", time: "4 hours", channels: "Email, Discord" },
                  { plan: "Enterprise", time: "1 hour", channels: "Email, Discord, Dedicated Slack" },
                ].map((r) => (
                  <div key={r.plan} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{r.plan}</span>
                    <div className="text-right">
                      <span className="text-foreground/70 font-medium">{r.time}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{r.channels}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border mt-12 pt-6 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to AdalahCredit
          </Link>
          <a href="mailto:urgent@adalahcredit.com" className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1">
            <AlertTriangle className="size-3" /> Emergency: urgent@adalahcredit.com
          </a>
        </div>
      </main>
    </div>
  );
}
