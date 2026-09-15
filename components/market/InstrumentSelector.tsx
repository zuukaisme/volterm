"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketCategory } from "@/types/market";

export function InstrumentSelector({
  categories,
  loading,
  error,
  selectedSymbol,
  onSelect,
}: {
  categories: MarketCategory[];
  loading: boolean;
  error: string | null;
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(
    categories[0]?.key ?? null
  );

  if (loading) {
    return <p className="px-3 py-4 text-sm text-muted-foreground">Loading markets…</p>;
  }
  if (error) {
    return <p className="px-3 py-4 text-sm text-down">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {categories.map((category) => {
        const isOpen = openCategory === category.key;
        return (
          <div key={category.key}>
            <button
              onClick={() => setOpenCategory(isOpen ? null : category.key)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-surface-raised"
            >
              <span>{category.label}</span>
              <ChevronRight
                className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")}
              />
            </button>
            {isOpen ? (
              <ul className="flex flex-col gap-0.5 pb-1 pl-2">
                {category.instruments.map((instrument) => (
                  <li key={instrument.symbol}>
                    <button
                      onClick={() => onSelect(instrument.symbol)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                        selectedSymbol === instrument.symbol
                          ? "bg-accent/15 text-accent"
                          : "text-foreground hover:bg-surface-raised"
                      )}
                    >
                      <span className="truncate">{instrument.displayName}</span>
                      {!instrument.isActive || instrument.isTradingSuspended ? (
                        <span className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-down" />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
