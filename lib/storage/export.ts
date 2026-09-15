import { getAllTrades } from "./trades";
import { getAllStrategies } from "./strategies";
import { getAllJournals } from "./journals";
import { getSettings } from "./settings";
import type { LedgerBackup } from "@/types/ledger";

export async function exportBackup(): Promise<LedgerBackup> {
  const [trades, strategies, journals, settings] = await Promise.all([
    getAllTrades(),
    getAllStrategies(),
    getAllJournals(),
    getSettings(),
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    trades,
    strategies,
    journals,
    settings,
  };
}

export function downloadJSON(data: LedgerBackup, filename?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `volterm-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(trades: LedgerBackup["trades"]) {
  if (trades.length === 0) return;
  const headers = [
    "id",
    "symbol",
    "displayName",
    "direction",
    "status",
    "timeframe",
    "entryPrice",
    "exitPrice",
    "stopLoss",
    "takeProfit",
    "positionSize",
    "riskAmount",
    "profitLoss",
    "riskReward",
    "strategyName",
    "setup",
    "entryReason",
    "exitReason",
    "notes",
    "tags",
    "emotion",
    "confidence",
    "discipline",
    "isPlanned",
    "followedStrategy",
    "openedAt",
    "closedAt",
    "createdAt",
    "updatedAt",
  ];
  const rows = trades.map((t) =>
    headers
      .map((h) => {
        const val = t[h as keyof typeof t];
        if (val === undefined || val === null) return "";
        if (Array.isArray(val)) return `"${val.join(",")}"`;
        if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes("\n"))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return String(val);
      })
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `volterm-trades-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
