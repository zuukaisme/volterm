import type { Trade } from "@/types/ledger";
import type { ChartTradeMarker } from "@/components/chart/TradingChart";

const ENTRY_LONG_COLOR = "#2fd98a";
const ENTRY_SHORT_COLOR = "#f0555a";
const EXIT_COLOR = "#4c8dff";
const SL_COLOR = "#f0555a";
const TP_COLOR = "#2fd98a";

export function buildTradeMarkers(trades: Trade[]): ChartTradeMarker[] {
  const markers: ChartTradeMarker[] = [];

  for (const trade of trades) {
    const isLong = trade.direction === "long";
    const entryTime = trade.openedAt ?? trade.createdAt;
    const closedTime = trade.closedAt ?? trade.createdAt;

    if (trade.entryPrice !== undefined) {
      markers.push({
        time: entryTime,
        tradeId: trade.id,
        price: trade.entryPrice,
        position: "atPriceBottom",
        shape: isLong ? "arrowUp" : "arrowDown",
        color: isLong ? ENTRY_LONG_COLOR : ENTRY_SHORT_COLOR,
        text: "Entry",
      });
    }

    if (trade.exitPrice !== undefined && (trade.status === "win" || trade.status === "loss" || trade.status === "breakeven")) {
      markers.push({
        time: closedTime,
        tradeId: trade.id,
        price: trade.exitPrice,
        position: "atPriceTop",
        shape: "circle",
        color: EXIT_COLOR,
        text: "Exit",
      });
    }

    if (trade.stopLoss !== undefined) {
      markers.push({
        time: entryTime,
        tradeId: trade.id,
        price: trade.stopLoss,
        position: "atPriceBottom",
        shape: "square",
        color: SL_COLOR,
        text: "SL",
      });
    }

    if (trade.takeProfit !== undefined) {
      markers.push({
        time: entryTime,
        tradeId: trade.id,
        price: trade.takeProfit,
        position: "atPriceTop",
        shape: "square",
        color: TP_COLOR,
        text: "TP",
      });
    }
  }

  return markers;
}