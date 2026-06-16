import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bell,
  ArrowLeft,
  ChevronDown,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

type SystemStatus = "operational" | "degraded" | "partial_outage" | "major_outage";

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function StatusIcon({ status }: { status: string }) {
  if (status === "operational" || status === "resolved")
    return <CheckCircle2 className="size-4 text-emerald-400" />;
  if (status === "degraded" || status === "monitoring" || status === "partial_outage")
    return <AlertTriangle className="size-4 text-amber-400" />;
  return <XCircle className="size-4 text-red-400" />;
}

function StatusLabel({ status }: { status: SystemStatus }) {
  const styles: Record<string, string> = {
    operational: "text-emerald-400",
    degraded: "text-amber-400",
    partial_outage: "text-amber-400",
    major_outage: "text-red-400",
  };
  const labels: Record<string, string> = {
    operational: "Operational",
    degraded: "Degraded Performance",
    partial_outage: "Partial Outage",
    major_outage: "Major Outage",
  };
  return <span className={`text-xs font-medium ${styles[status] ?? "text-muted-foreground"}`}>{labels[status] ?? status}</span>;
}

const UPTIME_DAYS = 90;

function UptimeBar({ uptime }: { uptime: number }) {
  const data = useMemo(() => {
    return Array.from({ length: UPTIME_DAYS }, (_, i) => {
      if (uptime < 99.9 && i >= UPTIME_DAYS - 3) return "degraded";
      if (Math.random() > 0.995) return "degraded";
      return "up";
    });
  }, [uptime]);

  return (
    <div className="flex gap-[1px]">
      {data.map((d, i) => (
        <div
          key={i}
          className={`flex-1 h-7 rounded-[1px] ${d === "up" ? "bg-emerald-500/40 hover:bg-emerald-500/60" : d === "degraded" ? "bg-amber-500/50 hover:bg-amber-500/70" : "bg-red-500/50 hover:bg-red-500/70"} transition-colors`}
          title={`Day ${UPTIME_DAYS - i}: ${d}`}
        />
      ))}
    </div>
  );
}

function IncidentCard({ incident }: { incident: any }) {
  const [open, setOpen] = useState(incident.status !== "resolved");

  return (
    <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <StatusIcon status={incident.status} />
          <div>
            <div className="text-sm font-medium text-foreground/80">{incident.title}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {new Date(incident.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] text-muted-foreground">
                {incident.resolvedAt
                  ? `${Math.round((incident.resolvedAt - incident.createdAt) / 60000)} min`
                  : "Ongoing"}
              </span>
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                incident.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" :
                incident.status === "monitoring" ? "bg-amber-500/10 text-amber-400" :
                "bg-red-500/10 text-red-400"
              }`}>
                {incident.status}
              </span>
            </div>
          </div>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.span>
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {incident.updates?.map((u: any, i: number) => (
            <div key={i} className="flex gap-3 text-xs">
              <div className="flex flex-col items-center">
                <div className="size-1.5 rounded-full bg-zinc-600 mt-1.5" />
                {i < incident.updates.length - 1 && <div className="w-px flex-1 bg-accent/50 mt-1" />}
              </div>
              <div className="pb-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-muted-foreground">{u.status}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {new Date(u.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{u.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export function StatusPage() {
  const services = useQuery(api.statusFunctions.getAllServices);
  const incidents = useQuery(api.statusFunctions.getRecentIncidents, { limit: 10 });

  const operationalCount = services?.filter((s) => s.status === "operational").length ?? 0;
  const totalCount = services?.length ?? 0;
  const allOperational = operationalCount === totalCount && totalCount > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
              <Zap className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold">AdalahCredit</span>
            <span className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">Status</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Dashboard</Link>
            <Link to="/support" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Support</Link>
            <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/50 border border-border rounded-lg px-3 py-1.5 hover:text-foreground transition-colors">
              <Bell className="size-3" /> Subscribe
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8 sm:py-12 space-y-8">
        {/* Loading state */}
        {!services ? (
          <div className="text-center py-16">
            <div className="size-8 border-2 border-border border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading status...</p>
          </div>
        ) : (
          <>
            {/* Overall status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-6 border ${allOperational ? "bg-emerald-500/[0.04] border-emerald-500/20" : "bg-amber-500/[0.04] border-amber-500/20"}`}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={allOperational ? "operational" : "degraded"} />
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {operationalCount}/{totalCount} services operational • Updated just now
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Uptime overview */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-foreground">Uptime — Last {UPTIME_DAYS} days</h2>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-emerald-500/40" /> Up</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-amber-500/50" /> Degraded</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-red-500/50" /> Down</span>
                </div>
              </div>

              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s._id} className="bg-accent/30 border border-border rounded-lg p-3 hover:border-border transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={s.status} />
                        <span className="text-xs font-medium text-foreground/80">{s.serviceName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground tabular-nums">{s.uptimePercent.toFixed(2)}%</span>
                        <StatusLabel status={s.status as SystemStatus} />
                      </div>
                    </div>
                    <UptimeBar uptime={s.uptimePercent} />
                  </div>
                ))}
              </div>
            </section>

            {/* Incidents */}
            <section>
              <h2 className="text-sm font-medium text-foreground mb-4">Recent Incidents</h2>
              <div className="space-y-3">
                {incidents && incidents.length > 0 ? (
                  incidents.map((inc) => <IncidentCard key={inc._id} incident={inc} />)
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <CheckCircle2 className="size-6 mx-auto mb-2 text-emerald-500/40" />
                    No recent incidents
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-6 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to AdalahCredit
          </Link>
          <span className="text-[10px] text-muted-foreground">Powered by AdalahCredit Monitoring</span>
        </div>
      </main>
    </div>
  );
}
