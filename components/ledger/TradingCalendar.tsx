"use client";

import { useState, useMemo } from "react";
import type { Trade } from "@/types/ledger";
import { TradeCard } from "./TradeCard";
import { cn } from "@/lib/utils";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function TradingCalendar({
  trades,
  onSelectDay,
}: {
  trades: Trade[];
  onSelectDay: (date: string) => void;
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const pnlByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trades) {
      const date = new Date(t.closedAt ?? t.createdAt).toISOString().slice(0, 10);
      map.set(date, (map.get(date) ?? 0) + (t.profitLoss ?? 0));
    }
    return map;
  }, [trades]);

  const tradeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trades) {
      const date = new Date(t.createdAt).toISOString().slice(0, 10);
      map.set(date, (map.get(date) ?? 0) + 1);
    }
    return map;
  }, [trades]);

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const result: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      result.push(date.toISOString().slice(0, 10));
    }
    return result;
  }, [firstDay, daysInMonth, viewDate]);

  const totalMonthPnL = useMemo(() => {
    let total = 0;
    days.forEach((d) => {
      if (d) total += pnlByDate.get(d) ?? 0;
    });
    return total;
  }, [days, pnlByDate]);

  const moveMonth = (delta: number) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => moveMonth(-1)}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            ‹
          </button>
          <button
            onClick={() => moveMonth(1)}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            ›
          </button>
        </div>
        <div className="text-sm font-semibold">{monthLabel}</div>
        <div className={cn("text-sm font-medium tabular-nums", totalMonthPnL >= 0 ? "text-up" : "text-down")}>
          {totalMonthPnL > 0 ? "+" : ""}{totalMonthPnL.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-muted-foreground py-1">{d}</div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const pnl = pnlByDate.get(date) ?? 0;
          const count = tradeCounts.get(date) ?? 0;
          const isToday = date === today.toISOString().slice(0, 10);
          const hasTrades = count > 0;
          return (
            <button
              key={date}
              onClick={() => hasTrades && onSelectDay(date)}
              className={cn(
                "aspect-square rounded-lg border text-xs flex flex-col items-center justify-center transition-colors",
                hasTrades ? "cursor-pointer hover:border-accent" : "cursor-default",
                isToday ? "border-accent" : "border-transparent"
              )}
            >
              <span className="text-xs font-medium">{date.slice(8)}</span>
              {hasTrades && (
                <span className="flex items-center gap-0.5 mt-0.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", pnl > 0 ? "bg-up" : pnl < 0 ? "bg-down" : "bg-muted-foreground/40")} />
                  {count > 1 && <span className="text-[9px] text-muted-foreground">{count}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
        <PlayLegend />
      </div>
    </div>
  );
}

function PlayLegend() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-up" /> Green = profitable
      </span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-down" /> Red = losing
      </span>
    </div>
  );
}