"use client";

import type { Trade, TradeStatus } from "@/types/ledger";
import { cn, formatPrice } from "@/lib/utils";

const STATUS_DOT: Record<TradeStatus, string> = {
  planned: "bg-muted-foreground",
  open: "bg-accent",
  win: "bg-up",
  loss: "bg-down",
  breakeven: "bg-accent-2",
  cancelled: "bg-muted-foreground/40",
};

export function TradeRow({
  trade,
  onClick,
}: {
  trade: Trade;
  onClick: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-border hover:bg-surface-raised cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[trade.status])} />
          <span className="font-medium truncate max-w-[160px]">{trade.displayName}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{trade.timeframe}</td>
      <td className={cn("px-4 py-3 text-sm font-medium", trade.direction === "long" ? "text-up" : "text-down")}>
        {trade.direction === "long" ? "Long" : "Short"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {trade.entryPrice !== undefined ? formatPrice(trade.entryPrice) : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {trade.exitPrice !== undefined ? formatPrice(trade.exitPrice) : "—"}
      </td>
      <td className="px-4 py-3 text-sm capitalize">{trade.status}</td>
      <td
        className={cn(
          "px-4 py-3 text-sm font-medium tabular-nums text-right",
          trade.profitLoss === undefined
            ? "text-muted-foreground"
            : trade.profitLoss > 0
              ? "text-up"
              : trade.profitLoss < 0
                ? "text-down"
                : ""
        )}
      >
        {trade.profitLoss !== undefined
          ? `${trade.profitLoss > 0 ? "+" : ""}${formatPrice(trade.profitLoss)}`
          : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground text-right">
        {trade.strategyName ?? "—"}
      </td>
    </tr>
  );
}
