"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { Instrument, PriceSnapshot } from "@/types/market";

export function Watchlist({
  symbols,
  prices,
  instrumentsBySymbol,
  selectedSymbol,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  symbols: string[];
  prices: Record<string, PriceSnapshot>;
  instrumentsBySymbol: Map<string, Instrument>;
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onMoveUp: (symbol: string) => void;
  onMoveDown: (symbol: string) => void;
}) {
  if (symbols.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        Your watchlist is empty. Star a market from search to add it here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5 p-2">
      {symbols.map((symbol, index) => {
        const instrument = instrumentsBySymbol.get(symbol);
        const snapshot = prices[symbol];
        return (
          <li
            key={symbol}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-2 transition-colors",
              selectedSymbol === symbol ? "bg-accent/10" : "hover:bg-surface-raised"
            )}
          >
            <button
              onClick={() => onSelect(symbol)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  snapshot?.connected ? "bg-up" : "bg-muted-foreground"
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">
                  {instrument?.displayName ?? symbol}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {instrument?.submarketDisplay ?? symbol}
                </span>
              </span>
              <span className="shrink-0 font-mono text-sm tabular-nums text-foreground">
                {formatPrice(snapshot?.price ?? null, instrument?.pipSize)}
              </span>
            </button>

            <div className="flex shrink-0 items-center">
              <button
                onClick={() => onMoveUp(symbol)}
                disabled={index === 0}
                aria-label="Move up"
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onMoveDown(symbol)}
                disabled={index === symbols.length - 1}
                aria-label="Move down"
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onRemove(symbol)}
                aria-label="Remove from watchlist"
                className="p-1 text-muted-foreground hover:text-down"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
