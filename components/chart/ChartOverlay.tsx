"use client";

import { ChevronsRight, ScanLine, X } from "lucide-react";
import { cn, formatChange, formatPercent, formatPrice } from "@/lib/utils";
import type { ChartType, IndicatorId, IndicatorState } from "@/types/chart";

export type LegendCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  prevClose: number | null;
};

const INDICATOR_META: { id: IndicatorId; label: string; color: string }[] = [
  { id: "ema20", label: "EMA 20", color: "#4c8dff" },
  { id: "ema50", label: "EMA 50", color: "#b98cff" },
  { id: "sma200", label: "SMA 200", color: "#f5a623" },
  { id: "bollinger", label: "BB (20)", color: "#5b6b82" },
  { id: "rsi", label: "RSI (14)", color: "#b98cff" },
  { id: "macd", label: "MACD", color: "#4c8dff" },
];

function formatLegendTime(epoch: number | null, daily: boolean): string {
  if (!epoch) return "—";
  const date = new Date(epoch * 1000);
  if (daily || Number.isNaN(date.getTime())) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ChartOverlay({
  title,
  chartType,
  legend,
  hovering,
  sessionChange,
  sessionChangePercent,
  pipSize,
  daily,
  indicators,
  onToggleIndicator,
  onFitContent,
  onGoToLatest,
}: {
  title: string;
  chartType: ChartType;
  legend: LegendCandle | null;
  hovering: boolean;
  sessionChange: number | null;
  sessionChangePercent: number | null;
  pipSize: number;
  daily: boolean;
  indicators: IndicatorState;
  onToggleIndicator: (id: IndicatorId, next: boolean) => void;
  onFitContent: () => void;
  onGoToLatest: () => void;
}) {
  const isUp = legend ? legend.close >= legend.open : (sessionChange ?? 0) >= 0;
  const valueColor = isUp ? "text-up" : "text-down";
  const displayChange =
    hovering && legend && legend.prevClose !== null
      ? legend.close - legend.prevClose
      : (sessionChange ?? null);
  const displayChangePercent =
    hovering && legend && legend.prevClose !== null && legend.prevClose !== 0
      ? ((legend.close - legend.prevClose) / legend.prevClose) * 100
      : (sessionChangePercent ?? null);
  const changeUp = (displayChange ?? 0) >= 0;

  const activeIndicators = INDICATOR_META.filter((meta) => Boolean(indicators[meta.id]));

  return (
    <>
      <div className="pointer-events-none absolute left-2 top-2 z-20 flex max-w-[72%] flex-col items-start gap-1.5">
        <div className="rounded-lg border border-border bg-surface/90 px-2.5 py-1.5 font-mono text-[11px] leading-tight shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-semibold text-foreground">{title}</span>
            <span className="text-muted-foreground">
              {formatLegendTime(legend?.time ?? null, daily)}
            </span>
          </div>

          {legend ? (
            chartType === "candles" ? (
              <div className="mt-1 grid grid-cols-[1fr_1fr] gap-x-3 gap-y-0.5">
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground">O</span>
                  <span className={valueColor}>{formatPrice(legend.open, pipSize)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground">H</span>
                  <span className={valueColor}>{formatPrice(legend.high, pipSize)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground">L</span>
                  <span className={valueColor}>{formatPrice(legend.low, pipSize)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground">C</span>
                  <span className={valueColor}>{formatPrice(legend.close, pipSize)}</span>
                </span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-muted-foreground">Last</span>
                <span className={valueColor}>{formatPrice(legend.close, pipSize)}</span>
              </div>
            )
          ) : (
            <div className="mt-1 text-muted-foreground">Loading…</div>
          )}

          {displayChange !== null ? (
            <div
              className={cn(
                "mt-0.5 text-[10px]",
                changeUp ? "text-up" : "text-down"
              )}
            >
              {formatChange(displayChange, pipSize)} ({formatPercent(displayChangePercent)})
            </div>
          ) : null}
        </div>

        {activeIndicators.length > 0 ? (
          <div className="pointer-events-auto flex flex-wrap gap-1">
            {activeIndicators.map((meta) => (
              <button
                key={meta.id}
                type="button"
                title={`Remove ${meta.label}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onToggleIndicator(meta.id, false)}
                className="flex items-center gap-1 rounded-full border border-border bg-surface/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow backdrop-blur transition-colors hover:text-foreground"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label}
                <X className="h-2.5 w-2.5 opacity-60" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="pointer-events-auto absolute right-2 top-14 z-20 flex flex-col gap-1.5"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          title="Fit all data"
          aria-label="Fit all data"
          onClick={onFitContent}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/90 text-muted-foreground shadow backdrop-blur transition-colors hover:text-foreground"
        >
          <ScanLine className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Go to latest"
          aria-label="Go to latest bar"
          onClick={onGoToLatest}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/90 text-muted-foreground shadow backdrop-blur transition-colors hover:text-foreground"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}