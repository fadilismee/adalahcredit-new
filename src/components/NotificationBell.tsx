import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Bell, CheckCheck, Trash2, X,
  AlertTriangle, Key, TrendingUp, Radio, Megaphone,
  PartyPopper, CreditCard, Shield,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

const TYPE_CONFIG: Record<string, { icon: React.FC<{ className?: string }>; color: string }> = {
  spending_alert: { icon: AlertTriangle, color: "text-amber-400" },
  key_expiry: { icon: Key, color: "text-red-400" },
  usage_milestone: { icon: TrendingUp, color: "text-emerald-400" },
  system: { icon: Radio, color: "text-blue-400" },
  admin_broadcast: { icon: Megaphone, color: "text-purple-400" },
  welcome: { icon: PartyPopper, color: "text-pink-400" },
  payment: { icon: CreditCard, color: "text-green-400" },
  security: { icon: Shield, color: "text-orange-400" },
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)}m lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)}j lalu`;
  return `${Math.floor(s / 86400)}h lalu`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifications = useQuery(api.notifications.listMyNotifications, {}) ?? [];
  const unread = useQuery(api.notifications.unreadCount) ?? 0;
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const clearAll = useMutation(api.notifications.clearAll);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <Bell className="size-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 max-h-[28rem] bg-popover border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notifikasi</h3>
            <div className="flex gap-1">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead({})}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="size-3" /> Baca semua
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => { clearAll({}); }}
                  className="text-xs text-muted-foreground hover:text-destructive ml-2 flex items-center gap-1"
                >
                  <Trash2 className="size-3" /> Hapus semua
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="size-8 mb-2 opacity-30" />
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((n: any) => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                    onClick={() => {
                      if (!n.read) markRead({ notificationId: n._id as Id<"notifications"> });
                      if (n.actionUrl) window.location.href = n.actionUrl;
                    }}
                  >
                    <div className={`size-8 rounded-lg bg-accent/50 flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`size-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification({ notificationId: n._id as Id<"notifications"> }); }}
                          className="text-muted-foreground/50 hover:text-destructive shrink-0"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground/60">{timeAgo(n.createdAt)}</span>
                        {!n.read && <span className="size-1.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
