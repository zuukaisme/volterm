"use client";

import { useMemo } from "react";
import type { Trade, Strategy } from "@/types/ledger";
import { StatCard } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";
import {
  calculateStats,
  calculatePnLByDay,
  calculatePnLBySymbol,
  calculatePnLByStrategy,
  calculateWinRateByTimeframe,
} from "@/lib/ledger/stats";
import { cn, formatPrice } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { EquityCurve } from "./EquityCurve";

function BarChart({
  data,
  color,
  height = 80,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return <EmptyState title="No data" className="py-8" />;
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.slice(-20).map((d, i) => {
        const barHeight = Math.max((Math.abs(d.value) / max) * 100, 2);
        const positive = d.value >= 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full" title={`${d.label}: ${d.value}`}>
            <div
              className="w-full rounded-t"
              style={{
                height: `${barHeight}%`,
                backgroundColor: positive ? (color ?? "var(--color-up)") : (color ? "var(--color-down)" : "var(--color-down)"),
                opacity: positive ? 0.9 : 0.9,
              }}
            />
            {data.length <= 10 && <span className="text-[8px] text-muted-foreground truncate w-full text-center">{d.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function LedgerDashboard({
  trades,
  strategies,
}: {
  trades: Trade[];
  strategies: Strategy[];
}) {
  const stats = useMemo(() => calculateStats(trades), [trades]);

  const pnlByDay = useMemo(() => {
    const map = calculatePnLByDay(trades);
    return Array.from(map.entries())
      .map(([label, value]) => ({ label: label.slice(5), value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [trades]);

  const pnlBySymbol = useMemo(() => {
    const map = calculatePnLBySymbol(trades);
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [trades]);

  const pnlByStrategy = useMemo(() => {
    const map = calculatePnLByStrategy(trades);
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [trades]);

  const winRateByTf = useMemo(() => calculateWinRateByTimeframe(trades), [trades]);

  const strategyLookup = useMemo(() => {
    const m = new Map<string, Strategy>();
    strategies.forEach((s) => m.set(s.id, s));
    return m;
  }, [strategies]);

  if (trades.length === 0) {
    return (
      <EmptyState
        title="No trades yet"
        description="Your dashboard will populate as you record trades in the ledger."
        className="h-full"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Net P&L" value={formatPrice(stats.netPnL)}
          valueClassName={cn(stats.netPnL >= 0 ? "text-up" : "text-down", "text-base")} />
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} valueClassName="text-base" />
        <StatCard label="Trades" value={String(stats.totalTrades)} valueClassName="text-base" />
        <StatCard label="P.Factor" value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} valueClassName="text-base" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Avg Win" value={formatPrice(stats.averageWin)} valueClassName="text-sm text-up" />
        <StatCard label="Avg Loss" value={formatPrice(stats.averageLoss)} valueClassName="text-sm text-down" />
        <StatCard label="Wins/Losses" value={`${stats.totalWins}/${stats.totalLosses}`} valueClassName="text-sm" />
      </div>

      <Card>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">P&L by Day</h3>
        <BarChart data={pnlByDay} height={120} />
      </Card>

      <Card>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Equity Curve</h3>
        <EquityCurve trades={trades} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pnlBySymbol.length > 0 && (
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">P&L by Instrument</h3>
            <div className="space-y-2">
              {pnlBySymbol.slice(0, 8).map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm truncate">{item.label}</span>
                  <span className={cn("text-sm font-medium tabular-nums", item.value >= 0 ? "text-up" : "text-down")}>
                    {item.value > 0 ? "+" : ""}{formatPrice(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {pnlByStrategy.length > 0 && (
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">P&L by Strategy</h3>
            <div className="space-y-2">
              {pnlByStrategy.slice(0, 8).map((item) => {
                const strategy = Array.from(strategyLookup.values()).find((s) => s.name === item.label);
                return (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm truncate">{strategy?.name ?? item.label}</span>
                    <span className={cn("text-sm font-medium tabular-nums", item.value >= 0 ? "text-up" : "text-down")}>
                      {item.value > 0 ? "+" : ""}{formatPrice(item.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {winRateByTf.size > 0 && (
        <Card>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Win Rate by Timeframe</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Array.from(winRateByTf.entries()).map(([tf, rate]) => (
              <div key={tf} className="text-center py-2 rounded-lg bg-surface-raised">
                <div className="text-lg font-semibold tabular-nums">{rate.toFixed(0)}%</div>
                <div className="text-[11px] text-muted-foreground">{tf}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">More Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] text-muted-foreground">Current Win Streak</div>
            <div className="text-sm font-medium">🔥 {stats.currentWinStreak}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Current Loss Streak</div>
            <div className="text-sm font-medium text-down">{stats.currentLosingStreak}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Max Drawdown</div>
            <div className="text-sm font-medium text-down">{formatPrice(stats.maxDrawdown)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Average Win</div>
            <div className="text-sm font-medium text-up">{formatPrice(stats.averageWin)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Average Loss</div>
            <div className="text-sm font-medium text-down">{formatPrice(stats.averageLoss)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Expectancy</div>
            <div className={cn("text-sm font-medium", stats.expectancy >= 0 ? "text-up" : "text-down")}>
              {formatPrice(stats.expectancy)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Breakeven</div>
            <div className="text-sm font-medium">{stats.totalBreakeven}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Largest Win</div>
            <div className="text-sm font-medium text-up">{formatPrice(stats.largestWin)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Largest Loss</div>
            <div className="text-sm font-medium text-down">{formatPrice(stats.largestLoss)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}