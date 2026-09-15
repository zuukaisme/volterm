"use client";

import { ChevronDown, Wifi, WifiOff } from "lucide-react";
import { cn, formatChange, formatClockTime, formatPercent, formatPrice } from "@/lib/utils";
import type { ConnectionState, Instrument, PriceSnapshot } from "@/types/market";

const STATUS_LABEL: Record<ConnectionState, string> = {
  connected: "LIVE",
  connecting: "CONNECTING",
  reconnecting: "RECONNECTING",
  disconnected: "OFFLINE",
  error: "ERROR",
};

const STATUS_COLOR: Record<ConnectionState, string> = {
  connected: "bg-up",
  connecting: "bg-accent",
  reconnecting: "bg-accent-2",
  disconnected: "bg-muted-foreground",
  error: "bg-down",
};

export function PriceHeader({
  instrument,
  priceSnapshot,
  connectionState,
  onOpenSearch,
}: {
  instrument: Instrument | null;
  priceSnapshot: PriceSnapshot;
  connectionState: ConnectionState;
  onOpenSearch: () => void;
}) {
  const isUp = (priceSnapshot.change ?? 0) >= 0;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
      <button
        onClick={onOpenSearch}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {instrument ? instrument.displayName : "Select a market"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="tabular-nums text-lg font-semibold text-foreground">
              {formatPrice(priceSnapshot.price, instrument?.pipSize)}
            </span>
            <span
              className={cn(
                "tabular-nums text-xs font-medium",
                isUp ? "text-up" : "text-down"
              )}
            >
              {formatChange(priceSnapshot.change, instrument?.pipSize)} (
              {formatPercent(priceSnapshot.changePercent)})
            </span>
          </div>
        </div>
      </button>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 rounded-full bg-surface-raised px-2 py-1">
          {connectionState === "connected" ? (
            <Wifi className="h-3 w-3 text-up" />
          ) : (
            <WifiOff className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_COLOR[connectionState])} />
            {STATUS_LABEL[connectionState]}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {formatClockTime(priceSnapshot.lastUpdate)}
        </span>
      </div>
    </div>
  );
}
