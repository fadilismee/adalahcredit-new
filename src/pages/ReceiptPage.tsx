import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Zap, Printer, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

const fmtIDR = (n: number) =>
  "Rp " + n.toLocaleString("id-ID");
const fmtUSD = (cents: number) =>
  "$" + (cents / 100).toFixed(2);

export default function ReceiptPage() {
  const [params] = useSearchParams();
  const orderId = params.get("id");

  const order = useQuery(
    api.payments.getOrderById,
    orderId ? { orderId: orderId as Id<"paymentOrders"> } : "skip"
  );

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">No order ID provided</p>
      </div>
    );
  }

  if (order === undefined) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="size-6 border-2 border-border border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center flex-col gap-3">
        <XCircle className="size-8 text-red-400" />
        <p className="text-muted-foreground">Order not found</p>
        <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Dashboard</Link>
      </div>
    );
  }

  // FIX M25: Complete status mapping including "rejected"
  const statusColor: Record<string, string> = {
    confirmed: "text-emerald-400",
    paid: "text-emerald-400",
    pending: "text-amber-400",
    expired: "text-muted-foreground",
    failed: "text-red-400",
    rejected: "text-red-400",
    cancelled: "text-muted-foreground",
  };
  const color = statusColor[order.status] || "text-muted-foreground";

  const StatusIcon = (order.status === "confirmed" || order.status === "paid")
    ? CheckCircle2
    : (order.status === "pending")
    ? Clock
    : XCircle; // covers rejected, failed, expired, cancelled

  const date = new Date(order.createdAt);
  const confirmDate = order.confirmedAt ? new Date(order.confirmedAt) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* No-print header */}
      <div className="print:hidden px-6 py-4 flex items-center justify-between border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-accent/50 px-4 py-2 rounded-lg"
        >
          <Printer className="size-4" /> Print / Save PDF
        </button>
      </div>

      {/* Receipt content */}
      <div className="max-w-2xl mx-auto p-6 sm:p-10">
        <div className="bg-background border border-border rounded-2xl p-8 sm:p-10 print:border-none print:bg-white print:text-black print:rounded-none">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-foreground flex items-center justify-center print:bg-black">
                <Zap className="size-5 text-background print:text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">AdalahCredit</h1>
                <p className="text-xs text-muted-foreground print:text-gray-500">Payment Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground print:text-gray-500">Receipt No.</p>
              <p className="text-sm font-mono">{orderId.slice(-8).toUpperCase()}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mb-6">
            <StatusIcon className={`size-5 ${color} print:text-black`} />
            <span className={`text-sm font-medium uppercase ${color} print:text-black`}>
              {order.status}
            </span>
          </div>

          {/* Details table */}
          <div className="space-y-0 border border-border rounded-xl overflow-hidden print:border-gray-200">
            <Row label="Date" value={date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} />
            <Row label="Payment Method" value={order.paymentMethod || order.gateway.replace("_", " ").toUpperCase()} />
            <Row label="Amount (IDR)" value={fmtIDR(order.amount)} highlight />
            <Row label="Credits Added" value={fmtUSD(order.creditAmount)} highlight />
            {order.externalRef && <Row label="Reference" value={order.externalRef} mono />}
            {confirmDate && (
              <Row label="Confirmed" value={confirmDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + confirmDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} />
            )}
            {order.adminNote && <Row label="Admin Note" value={order.adminNote} />}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border print:border-gray-200">
            <p className="text-[11px] text-muted-foreground print:text-gray-400 text-center">
              This is a computer-generated receipt. No signature required.
              <br />
              AdalahCredit — Unified AI API Gateway • adalahcredit.com
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:text-black { color: black !important; }
          .print\\:border-gray-200 { border-color: #e5e7eb !important; }
          .print\\:border-none { border: none !important; }
          .print\\:bg-background { background: black !important; }
          .print\\:text-foreground { color: white !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0 print:border-gray-100">
      <span className="text-xs text-muted-foreground print:text-gray-500">{label}</span>
      <span className={`text-sm ${highlight ? "font-semibold" : ""} ${mono ? "font-mono text-xs" : ""} print:text-black`}>
        {value}
      </span>
    </div>
  );
}
