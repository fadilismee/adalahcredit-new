/**
 * EditConnectionModal — Edit connection name, priority, label
 *
 * KeiRouter import: priority field for routing order
 */

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import type { ConnectionData } from "./ConnectionRow";

interface EditConnectionModalProps {
  isOpen: boolean;
  connection: ConnectionData | null;
  onSave: (id: string, data: { name?: string; displayName?: string; label?: string; priority?: number }) => Promise<void>;
  onClose: () => void;
}

export function EditConnectionModal({
  isOpen,
  connection,
  onSave,
  onClose,
}: EditConnectionModalProps) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [label, setLabel] = useState("");
  const [priority, setPriority] = useState(100);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (connection && isOpen) {
      setName(connection.name || "");
      setDisplayName(connection.displayName || "");
      setLabel(connection.label || "");
      setPriority(connection.priority ?? 100);
      setSaved(false);
    }
  }, [connection, isOpen]);

  const handleSave = async () => {
    if (!connection) return;
    setSaving(true);
    try {
      await onSave(connection._id, {
        name: name || undefined,
        displayName: displayName || undefined,
        label: label || undefined,
        priority,
      });
      setSaved(true);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !connection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Edit Connection</h2>
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Provider */}
          <div className="rounded-lg bg-muted/30 border border-border p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Provider</div>
            <div className="text-xs font-medium text-foreground">{connection.provider}</div>
          </div>

          {/* Email (read-only) */}
          {connection.email && (
            <div className="rounded-lg bg-muted/30 border border-border p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Email</div>
              <div className="text-xs text-foreground/80 font-mono">{connection.email}</div>
            </div>
          )}

          {/* Label */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Work Account, Personal..."
              className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground/50 outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground/50 outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. My OpenAI Key"
              className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground/50 outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Priority <span className="normal-case font-normal">(lower = higher priority)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="999"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-accent/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
              />
              <input
                type="number"
                min="1"
                max="999"
                value={priority}
                onChange={(e) => setPriority(Math.max(1, Math.min(999, parseInt(e.target.value) || 100)))}
                className="w-16 text-xs text-center bg-background border border-border rounded-lg px-2 py-1.5 text-foreground outline-none focus:border-foreground/30"
              />
            </div>
            <p className="text-[9px] text-muted-foreground">
              Connections with lower priority numbers are tried first in the routing chain.
            </p>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              saved
                ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {saving ? (
              <><Loader2 className="size-4 animate-spin" /> Saving...</>
            ) : saved ? (
              <>✓ Saved</>
            ) : (
              <><Save className="size-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditConnectionModal;
