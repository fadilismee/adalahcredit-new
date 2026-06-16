import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Activity, DollarSign, Zap, Clock } from "lucide-react";
import { useState } from "react";

const COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

/* ═══════════════════════════════════════════════════════════════
   USER: Usage Over Time (requests + cost line chart)
   ═══════════════════════════════════════════════════════════════ */

export function UsageOverTimeChart() {
  const [days, setDays] = useState(7);
  const data = useQuery(api.analytics.myDailyUsage, { days }) ?? [];

  const hasData = data.length > 0;

  return (
    <div className="bg-accent/30 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Request Volume</h3>
        </div>
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-[10px] px-2 py-1 rounded-md transition-colors ${days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#gradReq)" strokeWidth={2} name="Requests" />
            <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" name="Errors" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Belum ada data usage
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USER: Cost Over Time
   ═══════════════════════════════════════════════════════════════ */

export function CostOverTimeChart() {
  const data = useQuery(api.analytics.myDailyUsage, { days: 30 }) ?? [];
  const hasData = data.length > 0;

  return (
    <div className="bg-accent/30 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="size-4 text-emerald-400" />
        <h3 className="text-sm font-semibold">Cost (30 hari)</h3>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`$${v.toFixed(4)}`, "Cost"]}
            />
            <Bar dataKey="cost" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Belum ada data cost
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USER: Model Breakdown (pie chart)
   ═══════════════════════════════════════════════════════════════ */

export function ModelBreakdownChart() {
  const data = useQuery(api.analytics.myModelBreakdown, { days: 30 }) ?? [];
  const hasData = data.length > 0;

  return (
    <div className="bg-accent/30 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="size-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Model Usage</h3>
      </div>

      {hasData ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="requests"
                nameKey="model"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">
            {data.slice(0, 5).map((m, i) => (
              <div key={m.model} className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate flex-1">{m.model}</span>
                <span className="tabular-nums font-medium">{m.requests}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
          Belum ada data model
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USER: Latency Over Time
   ═══════════════════════════════════════════════════════════════ */

export function LatencyChart() {
  const data = useQuery(api.analytics.myDailyUsage, { days: 14 }) ?? [];
  const hasData = data.length > 0;

  return (
    <div className="bg-accent/30 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="size-4 text-blue-400" />
        <h3 className="text-sm font-semibold">Avg Latency (14 hari)</h3>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `${v}ms`} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`${Math.round(v)}ms`, "Latency"]}
            />
            <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
          Belum ada data latency
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN: Revenue & Request Charts
   ═══════════════════════════════════════════════════════════════ */

export function AdminRevenueChart() {
  const data = useQuery(api.analytics.adminDailyStats, { days: 30 }) ?? [];
  const hasData = data.length > 0;

  return (
    <div className="bg-accent/30 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="size-4 text-emerald-400" />
        <h3 className="text-sm font-semibold">Revenue (30 hari)</h3>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `$${v}`} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#gradRev)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Belum ada data revenue
        </div>
      )}
    </div>
  );
}

export function AdminUserGrowthChart() {
  const data = useQuery(api.analytics.adminUserGrowth, { days: 30 }) ?? [];
  const hasData = data.length > 0;

  return (
    <div className="bg-accent/30 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="size-4 text-purple-400" />
        <h3 className="text-sm font-semibold">User Growth (30 hari)</h3>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="signups" fill="#a855f7" radius={[4, 4, 0, 0]} name="Signups" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Belum ada data growth
        </div>
      )}
    </div>
  );
}
