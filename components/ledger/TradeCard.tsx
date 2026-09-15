"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Trade, TradeStatus } from "@/types/ledger";
import { cn, formatPrice } from "@/lib/utils";

const STATUS_STYLES: Record<TradeStatus, string> = {
  planned: "bg-muted-foreground/15 text-muted-foreground",
  open: "bg-accent/15 text-accent",
  win: "bg-up/15 text-up",
  loss: "bg-down/15 text-down",
  breakeven: "bg-accent-2/15 text-accent-2",
  cancelled: "bg-muted-foreground/10 text-muted-foreground",
};

export function TradeCard({
  trade,
  onClick,
}: {
  trade: Trade;
  onClick: () => void;
}) {
  const isLong = trade.direction === "long";

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-surface hover:bg-surface-raised transition-colors cursor-pointer"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          isLong ? "bg-up/10 text-up" : "bg-down/10 text-down"
        )}
      >
        {isLong ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{trade.displayName}</span>
          <span className="text-[11px] text-muted-foreground">{trade.timeframe}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {trade.entryPrice !== undefined && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatPrice(trade.entryPrice)}
            </span>
          )}
          {trade.exitPrice !== undefined && (
            <>
              <span className="text-[10px] text-muted-foreground">→</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatPrice(trade.exitPrice)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", STATUS_STYLES[trade.status])}>
          {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
        </span>
        {trade.profitLoss !== undefined && (
          <div
            className={cn(
              "text-sm font-medium tabular-nums mt-1",
              trade.profitLoss > 0 ? "text-up" : trade.profitLoss < 0 ? "text-down" : "text-muted-foreground"
            )}
          >
            {trade.profitLoss > 0 ? "+" : ""}
            {formatPrice(trade.profitLoss)}
          </div>
        )}
      </div>
    </div>
  );
}
