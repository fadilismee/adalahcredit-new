import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Zap, ArrowLeft, Check, Crown, CreditCard,
  Wallet, ArrowRight, Clock, Star, Rocket, Upload, X,
  ChevronDown, ChevronUp, Layers,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const PAY_AS_GO_PACKAGES = [
  { amountIdr: 25000, label: "Rp 25.000", bonus: "", creditHint: "~$1.56" },
  { amountIdr: 50000, label: "Rp 50.000", bonus: "", creditHint: "~$3.12" },
  { amountIdr: 100000, label: "Rp 100.000", bonus: "+5%", creditHint: "~$6.56" },
  { amountIdr: 250000, label: "Rp 250.000", bonus: "+8%", creditHint: "~$16.87" },
  { amountIdr: 500000, label: "Rp 500.000", bonus: "+12%", creditHint: "~$35.00" },
  { amountIdr: 1000000, label: "Rp 1.000.000", bonus: "+15%", creditHint: "~$71.87" },
];

const TIER_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  free: { label: "Free", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20", icon: <Layers className="size-3" /> },
  starter: { label: "Starter", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: <Star className="size-3" /> },
  pro: { label: "Pro", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: <Crown className="size-3" /> },
  ultimate: { label: "Ultimate", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: <Rocket className="size-3" /> },
};

const fmtIdr = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

type TopUpMode = "subscription" | "payasgo";
type PayStep = "choose" | "confirm" | "upload" | "done";

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export function TopUpPage() {
  const [mode, setMode] = useState<TopUpMode>("subscription");
  const [step, setStep] = useState<PayStep>("choose");
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showModelTiers, setShowModelTiers] = useState(false);

  const plans = useQuery(api.subscriptionEngine.getPlans);
  const myPlan = useQuery(api.subscriptionEngine.getMyPlan);
  const myOrders = useQuery(api.subscriptionEngine.getMySubscriptionOrders, { limit: 10 });
  const modelTiers = useQuery(api.subscriptionEngine.getModelTiers);

  const createSubOrder = useMutation(api.subscriptionEngine.createSubscriptionOrder);
  const createTopUp = useMutation(api.subscriptionEngine.createTopUpOrder);
  const uploadProof = useMutation(api.subscriptionEngine.uploadSubscriptionProof);

  /* ── Handlers ── */
  const handleSubscribe = async (planId: string) => {
    setSelectedPlanId(planId);
    setOrderError(null);
    setOrderLoading(true);
    try {
      const result = await createSubOrder({
        plan: planId as "starter" | "pro" | "enterprise",
        paymentMethod: "manual_transfer",
      });
      setOrderId(result.orderId as string);
      setStep("confirm");
    } catch (err: any) {
      setOrderError(err.message || "Gagal membuat order");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleTopUp = async (amountIdr: number) => {
    setSelectedPkg(amountIdr);
    setOrderError(null);
    setOrderLoading(true);
    try {
      const result = await createTopUp({ amountIdr, paymentMethod: "manual_transfer" });
      setOrderId(result.orderId as string);
      setStep("confirm");
    } catch (err: any) {
      setOrderError(err.message || "Gagal membuat order");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleUploadProof = async () => {
    if (!orderId || !proofUrl.trim()) return;
    setUploadLoading(true);
    try {
      await uploadProof({
        orderId: orderId as any,
        proofImageUrl: proofUrl.trim(),
      });
      setStep("done");
    } catch (err: any) {
      setOrderError(err.message || "Gagal upload bukti");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleReset = () => {
    setStep("choose");
    setSelectedPkg(null);
    setSelectedPlanId(null);
    setOrderId(null);
    setOrderError(null);
    setProofUrl("");
  };

  /* ── Model tier summary ── */
  const tierCounts = modelTiers
    ? modelTiers.reduce((acc, m) => {
        acc[m.tier] = (acc[m.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-4" />
            </Link>
            <div className="h-5 w-px bg-accent/50" />
            <Link to="/" className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-foreground flex items-center justify-center">
                <Zap className="size-3.5 text-background" />
              </div>
              <span className="text-sm font-semibold">AdalahCredit</span>
            </Link>
          </div>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Dashboard →
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Top Up & Langganan</h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Pilih paket langganan untuk akses model AI premium, atau top-up saldo PAYG (Pay-As-You-Go).
          </p>
        </div>

        {/* Current plan banner */}
        {myPlan && (
          <div className="mb-8 bg-accent/30 border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`size-8 rounded-lg flex items-center justify-center ${
                myPlan.plan === "enterprise" ? "bg-amber-500/20" :
                myPlan.plan === "pro" ? "bg-purple-500/20" :
                myPlan.plan === "starter" ? "bg-blue-500/20" : "bg-zinc-500/20"
              }`}>
                {myPlan.plan === "enterprise" ? <Rocket className="size-4 text-amber-400" /> :
                 myPlan.plan === "pro" ? <Crown className="size-4 text-purple-400" /> :
                 myPlan.plan === "starter" ? <Star className="size-4 text-blue-400" /> :
                 <Layers className="size-4 text-zinc-400" />}
              </div>
              <div>
                <div className="text-sm font-medium">Plan: {myPlan.planName}</div>
                <div className="text-[10px] text-muted-foreground">
                  Credits: {myPlan.remainingFormatted} sisa • Saldo: {myPlan.balanceFormatted} • Total: {myPlan.totalAvailableFormatted}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Clock className="size-3" />
              {myPlan.daysLeft} hari lagi
            </div>
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex items-center justify-center gap-1 mb-8 bg-accent/30 border border-border rounded-xl p-1 max-w-sm mx-auto">
          <button
            onClick={() => { setMode("subscription"); handleReset(); }}
            className={`flex-1 py-2 px-4 text-xs font-medium rounded-lg transition-all ${
              mode === "subscription" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Crown className="size-3 inline mr-1.5" />
            Langganan
          </button>
          <button
            onClick={() => { setMode("payasgo"); handleReset(); }}
            className={`flex-1 py-2 px-4 text-xs font-medium rounded-lg transition-all ${
              mode === "payasgo" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="size-3 inline mr-1.5" />
            Pay-As-You-Go
          </button>
        </div>

        {/* Error banner */}
        {orderError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-3 flex items-center gap-2">
            <X className="size-3.5 flex-shrink-0" />
            {orderError}
            <button onClick={() => setOrderError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* ═══ SUBSCRIPTION MODE ═══ */}
        {mode === "subscription" && step === "choose" && (
          <div>
            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {plans?.map((plan) => {
                const isCurrent = myPlan?.plan === plan.planId;
                const isDowngrade = myPlan && plans && (plans.findIndex(p => p.planId === myPlan.plan) > plans.findIndex(p => p.planId === plan.planId));
                const tierInfo = TIER_LABELS[("modelTier" in plan ? plan.modelTier : plan.planId) as string] ?? TIER_LABELS.starter;

                return (
                  <div
                    key={plan.planId}
                    className={`relative bg-accent/20 border rounded-xl p-5 transition-all hover:border-foreground/30 ${
                      plan.popular ? "border-purple-500/40 ring-1 ring-purple-500/20" : "border-border"
                    } ${isCurrent ? "ring-2 ring-emerald-500/30" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                        Popular
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                        Current
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        {tierInfo.icon}
                        <h3 className="text-sm font-semibold">{plan.name}</h3>
                      </div>
                      <div className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border ${tierInfo.color}`}>
                        {tierInfo.label} Tier
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl font-bold">{plan.priceIdr === 0 ? "Gratis" : fmtIdr(plan.priceIdr)}</span>
                      {plan.priceIdr > 0 && <span className="text-xs text-muted-foreground">/bulan</span>}
                    </div>

                    <div className="mb-4 text-[10px] text-muted-foreground space-y-0.5">
                      {"creditsCents" in plan && plan.creditsCents ? (
                        <div>💰 ${(plan.creditsCents / 100).toFixed(0)} credit/bulan</div>
                      ) : null}
                      {"rateLimit" in plan && plan.rateLimit ? (
                        <div>⚡ {plan.rateLimit} req/menit</div>
                      ) : null}
                      {"dailyRequestLimit" in plan && plan.dailyRequestLimit !== undefined ? (
                        <div>📊 {plan.dailyRequestLimit === 0 ? "Unlimited" : `${plan.dailyRequestLimit.toLocaleString()}`} req/hari</div>
                      ) : null}
                    </div>

                    <ul className="space-y-1.5 mb-5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-foreground/70">
                          <Check className="size-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {plan.planId === "free" ? (
                      <button disabled className="w-full py-2 text-xs font-medium rounded-lg bg-accent/50 text-muted-foreground cursor-default">
                        {isCurrent ? "Plan Aktif" : "Default"}
                      </button>
                    ) : isCurrent ? (
                      <button disabled className="w-full py-2 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-400 cursor-default">
                        <Check className="size-3 inline mr-1" /> Aktif
                      </button>
                    ) : isDowngrade ? (
                      <button disabled className="w-full py-2 text-xs font-medium rounded-lg bg-accent/50 text-muted-foreground cursor-default">
                        Downgrade
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.planId)}
                        disabled={orderLoading}
                        className={`w-full py-2 text-xs font-medium rounded-lg transition-all ${
                          plan.popular
                            ? "bg-purple-500 hover:bg-purple-400 text-white"
                            : "bg-foreground text-background hover:opacity-90"
                        } disabled:opacity-50`}
                      >
                        {orderLoading ? "Loading..." : "Langganan Sekarang"}
                        <ArrowRight className="size-3 inline ml-1" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Model tier info */}
            <div className="bg-accent/20 border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowModelTiers(!showModelTiers)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Model per Tier</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({Object.entries(tierCounts).map(([t, c]) => `${t}: ${c}`).join(", ")})
                  </span>
                </div>
                {showModelTiers ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
              </button>

              {showModelTiers && modelTiers && (
                <div className="border-t border-border p-4">
                  {["free", "starter", "pro", "ultimate"].map((tier) => {
                    const models = modelTiers.filter((m) => m.tier === tier);
                    if (models.length === 0) return null;
                    const info = TIER_LABELS[tier] ?? TIER_LABELS.starter;
                    return (
                      <div key={tier} className="mb-4 last:mb-0">
                        <div className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border mb-2 ${info.color}`}>
                          {info.icon} {info.label} ({models.length} model)
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {models.map((m) => (
                            <span key={`${m.provider}-${m.modelId}`} className="text-[10px] px-2 py-0.5 bg-accent/50 rounded-md text-muted-foreground">
                              {m.displayName || m.modelId}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PAY-AS-YOU-GO MODE ═══ */}
        {mode === "payasgo" && step === "choose" && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-1">Top Up Saldo PAYG</h2>
              <p className="text-xs text-muted-foreground">
                Saldo PAYG tidak hangus per bulan — bisa dipakai kapanpun sebagai cadangan atau tanpa langganan.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto mb-6">
              {PAY_AS_GO_PACKAGES.map((pkg) => (
                <button
                  key={pkg.amountIdr}
                  onClick={() => handleTopUp(pkg.amountIdr)}
                  disabled={orderLoading}
                  className="relative bg-accent/20 border border-border rounded-xl p-4 hover:border-foreground/30 transition-all group disabled:opacity-50"
                >
                  {pkg.bonus && (
                    <div className="absolute -top-1.5 right-3 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      {pkg.bonus}
                    </div>
                  )}
                  <div className="text-sm font-bold mb-0.5">{pkg.label}</div>
                  <div className="text-[10px] text-muted-foreground">{pkg.creditHint} credit</div>
                </button>
              ))}
            </div>

            {myPlan && (myPlan.balance > 0) && (
              <div className="text-center text-xs text-muted-foreground">
                Saldo PAYG saat ini: <span className="text-emerald-400 font-medium">{myPlan.balanceFormatted}</span>
              </div>
            )}
          </div>
        )}

        {/* ═══ CONFIRM ORDER (transfer instructions) ═══ */}
        {step === "confirm" && orderId && (
          <div className="max-w-md mx-auto">
            <div className="bg-accent/20 border border-border rounded-xl p-6 text-center">
              <div className="size-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="size-5 text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold mb-2">Transfer Pembayaran</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {mode === "subscription"
                  ? `Silakan transfer untuk aktivasi plan ${selectedPlanId?.toUpperCase()}`
                  : `Silakan transfer untuk top-up saldo ${fmtIdr(selectedPkg ?? 0)}`
                }
              </p>

              <div className="bg-accent/40 rounded-lg p-4 mb-4 space-y-2 text-left">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">BCA / BRI / Dana / GoPay</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="font-medium text-emerald-400">
                    {mode === "subscription"
                      ? fmtIdr(plans?.find(p => p.planId === selectedPlanId)?.priceIdr ?? 0)
                      : fmtIdr(selectedPkg ?? 0)
                    }
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-[10px]">{String(orderId).slice(-8)}</span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mb-4">
                Setelah transfer, upload bukti bayar (screenshot / foto) di bawah. Admin akan konfirmasi dalam 1-24 jam.
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="Paste link/URL bukti bayar..."
                  className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40"
                />
                <button
                  onClick={handleUploadProof}
                  disabled={!proofUrl.trim() || uploadLoading}
                  className="w-full py-2.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  <Upload className="size-3 inline mr-1.5" />
                  {uploadLoading ? "Uploading..." : "Upload Bukti Bayar"}
                </button>
                <button
                  onClick={() => setStep("done")}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Upload nanti saja →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ DONE ═══ */}
        {step === "done" && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-accent/20 border border-border rounded-xl p-8">
              <div className="size-14 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check className="size-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {proofUrl ? "Bukti Bayar Diterima!" : "Order Dibuat!"}
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                {proofUrl
                  ? "Admin akan mengkonfirmasi pembayaran Anda dalam 1-24 jam. Anda akan menerima notifikasi setelah dikonfirmasi."
                  : "Jangan lupa upload bukti bayar di halaman Dashboard > Billing agar bisa segera diproses."
                }
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-xs font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-all"
                >
                  Ke Dashboard
                </Link>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-accent/30 transition-colors"
                >
                  Top Up Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ORDER HISTORY ═══ */}
        {step === "choose" && myOrders && myOrders.length > 0 && (
          <div className="mt-8 bg-accent/20 border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <h3 className="text-xs font-medium">Riwayat Order Langganan & Top-up</h3>
            </div>
            <div className="divide-y divide-border">
              {myOrders.map((o) => (
                <div key={o._id} className="p-4 flex items-center justify-between hover:bg-accent/20 transition-colors">
                  <div>
                    <div className="text-xs text-foreground/80">
                      {o.type === "topup" ? "Top-up PAYG" : `Langganan ${o.plan?.toUpperCase() ?? ""}`}
                      {" — "}{fmtIdr(o.amountIdr)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {o.creditAmountCents ? ` • $${(o.creditAmountCents / 100).toFixed(2)} credit` : ""}
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                    o.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" :
                    o.status === "paid" ? "bg-blue-500/10 text-blue-400" :
                    o.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                    o.status === "rejected" ? "bg-red-500/10 text-red-400" :
                    "bg-zinc-500/10 text-zinc-400"
                  }`}>
                    {o.status === "confirmed" ? "✓ Dikonfirmasi" :
                     o.status === "paid" ? "Menunggu Konfirmasi" :
                     o.status === "pending" ? "Belum Bayar" :
                     o.status === "rejected" ? "Ditolak" :
                     o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
