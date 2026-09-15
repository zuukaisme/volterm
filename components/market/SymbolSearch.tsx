"use client";

import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Instrument } from "@/types/market";

type MatchedInstrument = {
  instrument: Instrument;
  matchedAlias: string | null;
};

function searchInstruments(instruments: Instrument[], query: string): MatchedInstrument[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return instruments.map((instrument) => ({ instrument, matchedAlias: null }));
  }

  const results: MatchedInstrument[] = [];
  for (const instrument of instruments) {
    const haystacks = [
      instrument.symbol.toLowerCase(),
      instrument.displayName.toLowerCase(),
      instrument.submarketDisplay.toLowerCase(),
    ];
    const directMatch = haystacks.some((value) => value.includes(trimmed));

    const matchedAlias = instrument.aliases.find((alias) =>
      alias.aliasName.toLowerCase().includes(trimmed)
    );

    if (directMatch || matchedAlias) {
      results.push({ instrument, matchedAlias: matchedAlias ? matchedAlias.aliasName : null });
    }
  }
  return results;
}

export function SymbolSearch({
  instruments,
  loading,
  error,
  isWatched,
  onToggleWatch,
  onSelect,
}: {
  instruments: Instrument[];
  loading: boolean;
  error: string | null;
  isWatched: (symbol: string) => boolean;
  onToggleWatch: (symbol: string) => void;
  onSelect: (instrument: Instrument) => void;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchInstruments(instruments, query), [instruments, query]);

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="relative px-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search markets..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">Loading instruments…</p>
      ) : error ? (
        <p className="px-3 py-4 text-sm text-down">{error}</p>
      ) : results.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">No markets match &quot;{query}&quot;.</p>
      ) : (
        <ul className="flex max-h-[60vh] flex-col overflow-y-auto">
          {results.map(({ instrument, matchedAlias }) => (
            <li key={instrument.symbol}>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-surface-raised">
                <button
                  onClick={() => onSelect(instrument)}
                  className="flex min-w-0 flex-1 flex-col items-start text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {instrument.displayName}
                    </span>
                    {!instrument.isActive || instrument.isTradingSuspended ? (
                      <Badge className="bg-down/15 text-down">Closed</Badge>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {instrument.submarketDisplay}
                    {matchedAlias ? (
                      <span className="italic">also known as &quot;{matchedAlias}&quot; on Weltrade</span>
                    ) : null}
                  </span>
                </button>
                <button
                  onClick={() => onToggleWatch(instrument.symbol)}
                  aria-label="Toggle watchlist"
                  className={cn(
                    "shrink-0 rounded-full p-1.5 hover:bg-surface",
                    isWatched(instrument.symbol) ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  <Star
                    className="h-4 w-4"
                    fill={isWatched(instrument.symbol) ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
