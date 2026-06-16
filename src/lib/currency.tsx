import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Currency = "IDR" | "USD";

const EXCHANGE_RATE = 16000; // 1 USD = 16,000 IDR (approximate)

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Format a USD cent amount to the selected currency */
  fmt: (usdCents: number) => string;
  /** Format raw number (already in USD dollars) */
  fmtDollars: (usd: number) => string;
  /** Toggle between IDR and USD */
  toggle: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    const stored = localStorage.getItem("currency");
    if (stored === "IDR" || stored === "USD") return stored;
    return "IDR"; // Default to Rupiah
  });

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  const fmt = (usdCents: number): string => {
    const usd = usdCents / 100;
    if (currency === "USD") {
      return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    const idr = usd * EXCHANGE_RATE;
    return `Rp ${idr.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const fmtDollars = (usd: number): string => {
    if (currency === "USD") {
      return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    }
    const idr = usd * EXCHANGE_RATE;
    if (idr < 1) {
      return `Rp ${idr.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    }
    return `Rp ${idr.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const toggle = () => setCurrency((c) => (c === "IDR" ? "USD" : "IDR"));

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt, fmtDollars, toggle }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

/** Currency toggle button for the dashboard */
export function CurrencyToggle({ className = "" }: { className?: string }) {
  const { currency, toggle } = useCurrency();
  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent border border-border ${className}`}
      title={currency === "IDR" ? "Switch to USD" : "Switch to Rupiah"}
    >
      <span className="text-sm">{currency === "IDR" ? "🇮🇩" : "🇺🇸"}</span>
      <span>{currency === "IDR" ? "Rp" : "USD"}</span>
    </button>
  );
}
