"use client";

import { cn, formatPercent, formatPrice } from "@/lib/utils";
import type { Instrument, PriceSnapshot } from "@/types/market";

export function TickerTape({
  symbols,
  prices,
  instrumentsBySymbol,
  selectedSymbol,
  onSelect,
}: {
  symbols: string[];
  prices: Record<string, PriceSnapshot>;
  instrumentsBySymbol: Map<string, Instrument>;
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
}) {
  if (symbols.length === 0) return null;

  return (
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-border bg-surface px-2 py-1.5">
      {symbols.map((symbol) => {
        const instrument = instrumentsBySymbol.get(symbol);
        const snapshot = prices[symbol];
        const price = snapshot?.price ?? null;
        const change = snapshot?.change ?? null;
        const pct = snapshot?.changePercent ?? null;
        const up = (change ?? 0) >= 0;
        const active = symbol === selectedSymbol;
        return (
          <button
            key={symbol}
            type="button"
            onClick={() => onSelect(symbol)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums transition-colors",
              active
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
            )}
          >
            <span className="max-w-[8rem] truncate">{instrument?.displayName ?? symbol}</span>
            <span className="font-semibold text-foreground">
              {formatPrice(price, instrument?.pipSize)}
            </span>
            <span className={up ? "text-up" : "text-down"}>{formatPercent(pct)}</span>
          </button>
        );
      })}
    </div>
  );
}