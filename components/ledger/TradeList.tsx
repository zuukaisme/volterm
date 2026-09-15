"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { TradeCard } from "./TradeCard";
import { TradeRow } from "./TradeRow";
import type { Trade, TradeStatus, TradeFilter } from "@/types/ledger";
import { cn } from "@/lib/utils";

export function TradeList({
  trades,
  onSelect,
  onNewTrade,
}: {
  trades: Trade[];
  onSelect: (trade: Trade) => void;
  onNewTrade: () => void;
}) {
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDirection, setFilterDirection] = useState("");
  const [filterTimeframe, setFilterTimeframe] = useState("");
  const [filterStrategy, setFilterStrategy] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const filteredTrades = useMemo(() => {
    let result = [...trades];

    if (statusTab === "wins") result = result.filter((t) => t.status === "win");
    else if (statusTab === "losses") result = result.filter((t) => t.status === "loss");
    else if (statusTab === "breakeven") result = result.filter((t) => t.status === "breakeven");

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.displayName.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q) ||
          (t.strategyName ?? "").toLowerCase().includes(q) ||
          (t.tags ?? []).some((tag) => tag.includes(q))
      );
    }

    if (filterDirection) result = result.filter((t) => t.direction === filterDirection);
    if (filterTimeframe) result = result.filter((t) => t.timeframe === filterTimeframe);
    if (filterStrategy) result = result.filter((t) => t.strategyId === filterStrategy);
    if (filterTag) result = result.filter((t) => (t.tags ?? []).includes(filterTag));

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [trades, statusTab, search, filterDirection, filterTimeframe, filterStrategy, filterTag]);

  const counts = useMemo(() => ({
    all: trades.length,
    wins: trades.filter((t) => t.status === "win").length,
    losses: trades.filter((t) => t.status === "loss").length,
    breakeven: trades.filter((t) => t.status === "breakeven").length,
  }), [trades]);

  const hasFilters = filterDirection || filterTimeframe || filterStrategy || filterTag;

  const statusTabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "wins", label: "Wins", count: counts.wins },
    { key: "losses", label: "Losses", count: counts.losses },
    { key: "breakeven", label: "BE", count: counts.breakeven },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-11 w-11 flex items-center justify-center rounded-lg border transition-colors",
              hasFilters
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <Button onClick={onNewTrade} size="md">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-surface-raised">
            <Select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} className="w-auto h-9 text-xs">
              <option value="">All directions</option>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </Select>
            <Select value={filterTimeframe} onChange={(e) => setFilterTimeframe(e.target.value)} className="w-auto h-9 text-xs">
              <option value="">All timeframes</option>
              {["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"].map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </Select>
            <Input
              placeholder="Tag filter..."
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-28 h-9 text-xs"
            />
            {hasFilters && (
              <button
                onClick={() => {
                  setFilterDirection("");
                  setFilterTimeframe("");
                  setFilterStrategy("");
                  setFilterTag("");
                }}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      <Tabs tabs={statusTabs} value={statusTab} onChange={setStatusTab} />

      <div className="flex-1 overflow-y-auto">
        {filteredTrades.length === 0 ? (
          <EmptyState
            icon={<ArrowUpRight className="h-8 w-8" />}
            title="No trades yet"
            description="Record your first trade to start building your journal."
            action={
              <Button onClick={onNewTrade} size="sm">
                <Plus className="h-3.5 w-3.5" />
                Record Trade
              </Button>
            }
          />
        ) : (
          <>
            <div className="md:hidden p-3 space-y-2">
              {filteredTrades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} onClick={() => onSelect(trade)} />
              ))}
            </div>

            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="px-4 py-2 text-left font-medium">Instrument</th>
                    <th className="px-4 py-2 text-left font-medium">TF</th>
                    <th className="px-4 py-2 text-left font-medium">Side</th>
                    <th className="px-4 py-2 text-left font-medium">Entry</th>
                    <th className="px-4 py-2 text-left font-medium">Exit</th>
                    <th className="px-4 py-2 text-left font-medium">Result</th>
                    <th className="px-4 py-2 text-right font-medium">P&L</th>
                    <th className="px-4 py-2 text-right font-medium">Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((trade) => (
                    <TradeRow key={trade.id} trade={trade} onClick={() => onSelect(trade)} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
