"use client";

import { useMemo } from "react";
import type { Trade, Strategy } from "@/types/ledger";
import { StatCard } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";
import { calculateStats } from "@/lib/ledger/stats";
import { cn, formatPrice } from "@/lib/utils";

export function StrategyPerformance({
  strategy,
  trades,
}: {
  strategy: Strategy;
  trades: Trade[];
}) {
  const stats = useMemo(() => calculateStats(trades), [trades]);

  const items = [
    { label: "Total Trades", value: String(stats.totalTrades) },
    { label: "Wins", value: String(stats.totalWins), className: "text-up" },
    { label: "Losses", value: String(stats.totalLosses), className: "text-down" },
    { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%` },
    { label: "Net P&L", value: formatPrice(stats.netPnL), className: stats.netPnL >= 0 ? "text-up" : "text-down" },
    { label: "Avg R", value: stats.averageR !== 0 ? `${stats.averageR.toFixed(2)}` : "—" },
    { label: "Avg Win", value: formatPrice(stats.averageWin), className: "text-up" },
    { label: "Avg Loss", value: formatPrice(stats.averageLoss), className: "text-down" },
    { label: "Profit Factor", value: stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2) },
    { label: "Largest Win", value: formatPrice(stats.largestWin), className: "text-up" },
    { label: "Largest Loss", value: formatPrice(stats.largestLoss), className: "text-down" },
    { label: "Expectancy", value: formatPrice(stats.expectancy), className: stats.expectancy >= 0 ? "text-up" : "text-down" },
  ];

  if (trades.length === 0) {
    return (
      <Card className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No trades recorded for this strategy yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          valueClassName={cn("text-base", item.className)}
        />
      ))}
    </div>
  );
}
