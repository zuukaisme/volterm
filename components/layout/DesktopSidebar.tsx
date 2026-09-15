"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { InstrumentSelector } from "@/components/market/InstrumentSelector";
import { Watchlist } from "@/components/market/Watchlist";
import type { Instrument, MarketCategory, PriceSnapshot } from "@/types/market";

type Tab = "browse" | "watchlist";

export function DesktopSidebar({
  instruments,
  categories,
  loading,
  error,
  selectedSymbol,
  onSelect,
  isWatched,
  onToggleWatch,
  watchlistSymbols,
  watchlistPrices,
  instrumentsBySymbol,
  onRemoveFromWatchlist,
  onMoveWatchlistUp,
  onMoveWatchlistDown,
}: {
  instruments: Instrument[];
  categories: MarketCategory[];
  loading: boolean;
  error: string | null;
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
  onToggleWatch: (symbol: string) => void;
  watchlistSymbols: string[];
  watchlistPrices: Record<string, PriceSnapshot>;
  instrumentsBySymbol: Map<string, Instrument>;
  onRemoveFromWatchlist: (symbol: string) => void;
  onMoveWatchlistUp: (symbol: string) => void;
  onMoveWatchlistDown: (symbol: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("browse");

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex border-b border-border">
        {(["browse", "watchlist"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              "flex-1 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              tab === value
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {value === "browse" ? "Markets" : `Watchlist (${watchlistSymbols.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "browse" ? (
          <>
            <SymbolSearch
              instruments={instruments}
              loading={loading}
              error={error}
              isWatched={isWatched}
              onToggleWatch={onToggleWatch}
              onSelect={(instrument) => onSelect(instrument.symbol)}
            />
            <div className="border-t border-border">
              <InstrumentSelector
                categories={categories}
                loading={loading}
                error={error}
                selectedSymbol={selectedSymbol}
                onSelect={onSelect}
              />
            </div>
          </>
        ) : (
          <Watchlist
            symbols={watchlistSymbols}
            prices={watchlistPrices}
            instrumentsBySymbol={instrumentsBySymbol}
            selectedSymbol={selectedSymbol}
            onSelect={onSelect}
            onRemove={onRemoveFromWatchlist}
            onMoveUp={onMoveWatchlistUp}
            onMoveDown={onMoveWatchlistDown}
          />
        )}
      </div>
    </aside>
  );
}
