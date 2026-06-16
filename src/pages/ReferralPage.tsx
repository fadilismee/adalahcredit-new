import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, ArrowLeft, Copy, Check, Gift, Users, DollarSign,
  Share2, Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const HOW_IT_WORKS = [
  { step: "1", title: "Bagikan link kamu", desc: "Kirim link referral unik kamu ke teman dan kolega.", icon: <Share2 className="size-5" /> },
  { step: "2", title: "Mereka daftar", desc: "Mereka buat akun AdalahCredit dan dapat Rp 160.000 kredit gratis.", icon: <Users className="size-5" /> },
  { step: "3", title: "Keduanya dapat reward", desc: "Saat mereka pakai Rp 400.000+, kalian berdua dapat Rp 240.000 kredit API.", icon: <Gift className="size-5" /> },
];

const TIERS = [
  { range: "1-5 referrals", reward: "Rp 240.000 / referral", bonus: "" },
  { range: "6-15 referrals", reward: "Rp 320.000 / referral", bonus: "+Rp 800.000 bonus milestone" },
  { range: "16-50 referrals", reward: "Rp 400.000 / referral", bonus: "+Rp 3.200.000 bonus milestone" },
  { range: "50+ referrals", reward: "Rp 480.000 / referral", bonus: "VIP Partner status 🏆" },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const referralData = useQuery(api.referralFunctions.getMyReferrals);

  const referralLink = referralData?.referralLink ?? "https://adalahcredit.com/signup?ref=...";
  const referralCode = referralData?.referralCode ?? "...";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <span className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">Referral</span>
          </Link>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Dashboard →</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 sm:py-16">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-5">
            <Gift className="size-7 text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Kasih Rp 160rb, Dapat Rp 240rb</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Bagikan AdalahCredit ke jaringan kamu. Mereka dapat Rp 160.000 kredit gratis, dan kamu dapat Rp 240.000 untuk setiap referral yang convert.
          </p>
        </motion.div>

        {/* Referral link */}
        <div className="bg-gradient-to-r from-amber-500/[0.04] to-orange-500/[0.04] border border-amber-500/10 rounded-xl p-5 mb-10">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Your referral link</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-[#0a0a0c] border border-border rounded-lg px-4 py-2.5 overflow-x-auto">
              <code className="text-xs text-foreground/70 font-mono whitespace-nowrap">{referralLink}</code>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-colors"
            >
              {copied ? <><Check className="size-3.5 text-emerald-600" /> Copied!</> : <><Copy className="size-3.5" /> Copy Link</>}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Kode referral kamu: <code className="text-muted-foreground">{referralCode}</code></p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Total Referred", value: referralData?.stats.totalReferred ?? 0, icon: <Users className="size-4 text-blue-400" /> },
            { label: "Pending", value: referralData?.stats.pendingCount ?? 0, icon: <Share2 className="size-4 text-amber-400" /> },
            { label: "Total Earned", value: referralData?.stats.totalEarned ?? "$0.00", icon: <DollarSign className="size-4 text-emerald-400" /> },
            { label: "Pending Earnings", value: referralData?.stats.pendingEarnings ?? "$0.00", icon: <Gift className="size-4 text-purple-400" /> },
          ].map((s) => (
            <div key={s.label} className="bg-accent/30 border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-[10px] text-muted-foreground">{s.label}</span></div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tier Progress */}
        {referralData?.tier && (
          <div className="bg-accent/30 border border-border rounded-xl p-5 mb-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-400" />
                <span className="text-sm font-medium text-foreground">Tier: {referralData.tier.current}</span>
              </div>
              {referralData.tier.next !== "Max" && (
                <span className="text-[10px] text-muted-foreground">Next: {referralData.tier.next}</span>
              )}
            </div>
            {referralData.tier.next !== "Max" && (
              <div className="h-2 bg-accent/50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min((referralData.tier.progress / referralData.tier.needed) * 100, 100)}%` }} />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">{referralData.tier.progress}/{referralData.tier.needed} referrals to {referralData.tier.next}</p>
          </div>
        )}

        {/* How it works */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-5">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="bg-accent/30 border border-border rounded-xl p-5 text-center">
                <div className="mx-auto size-10 rounded-xl bg-accent/50 flex items-center justify-center text-muted-foreground mb-3">
                  {item.icon}
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reward tiers */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <Trophy className="size-5 text-amber-400" /> Reward Tiers
          </h2>
          <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
            {TIERS.map((tier, i) => (
              <div key={tier.range} className={`flex items-center justify-between px-5 py-4 ${i !== TIERS.length - 1 ? "border-b border-border" : ""} ${referralData?.tier.current === tier.range.split(" ")[0] ? "bg-amber-500/[0.03]" : ""}`}>
                <div>
                  <span className="text-xs font-medium text-foreground/70">{tier.range}</span>
                  {tier.bonus && <span className="ml-2 text-[9px] text-amber-400">{tier.bonus}</span>}
                </div>
                <span className="text-xs font-mono text-muted-foreground">{tier.reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-5">Referral History</h2>
          {!referralData ? (
            <div className="bg-accent/30 border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : referralData.history.length === 0 ? (
            <div className="bg-accent/30 border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Belum ada referral. Share link kamu untuk mulai mendapatkan reward!
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-2">
                {referralData.history.map((r) => (
                  <div key={r._id} className="bg-accent/30 border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-foreground/70 font-mono">{r.date}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${
                        r.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        <span className={`size-1.5 rounded-full ${r.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} />
                        {r.status}
                      </span>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{r.earnedFormatted}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block bg-accent/30 border border-border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Reward</th>
                      <th className="text-right py-3 px-5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralData.history.map((r) => (
                      <tr key={r._id} className="border-b border-border hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-5 text-foreground/70">{r.date}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${
                            r.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                          }`}>
                            <span className={`size-1.5 rounded-full ${r.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} />
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right text-muted-foreground font-mono">{r.earnedFormatted}</td>
                        <td className="py-3 px-5 text-right text-muted-foreground">{r.paidOut ? "✓ Paid" : "Pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-6 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to AdalahCredit
          </Link>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Dashboard →</Link>
        </div>
      </main>
    </div>
  );
}
