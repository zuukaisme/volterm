import type { Trade } from "@/types/ledger";

export type LedgerStats = {
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  totalBreakeven: number;
  totalCancelled: number;
  totalPlanned: number;
  winRate: number;
  netPnL: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  averageR: number;
  largestWin: number;
  largestLoss: number;
  currentWinStreak: number;
  currentLosingStreak: number;
  maxDrawdown: number;
  expectancy: number;
};

export function calculateStats(trades: Trade[]): LedgerStats {
  const closed = trades.filter((t) => t.status === "win" || t.status === "loss" || t.status === "breakeven");
  const wins = trades.filter((t) => t.status === "win");
  const losses = trades.filter((t) => t.status === "loss");
  const breakeven = trades.filter((t) => t.status === "breakeven");

  const winPnLs = wins.map((t) => t.profitLoss ?? 0).filter((v) => v > 0);
  const lossPnLs = losses.map((t) => t.profitLoss ?? 0).filter((v) => v < 0);

  const totalWinAmount = winPnLs.reduce((a, b) => a + b, 0);
  const totalLossAmount = Math.abs(lossPnLs.reduce((a, b) => a + b, 0));

  const sorted = [...closed].sort((a, b) => (a.closedAt ?? a.createdAt) - (b.closedAt ?? b.createdAt));
  let currentWinStreak = 0;
  let currentLosingStreak = 0;
  let maxWinStreak = 0;
  let maxLosingStreak = 0;
  let tempWin = 0;
  let tempLoss = 0;

  for (const t of sorted) {
    if (t.status === "win") {
      tempWin++;
      tempLoss = 0;
      maxWinStreak = Math.max(maxWinStreak, tempWin);
    } else if (t.status === "loss") {
      tempLoss++;
      tempWin = 0;
      maxLosingStreak = Math.max(maxLosingStreak, tempLoss);
    } else {
      tempWin = 0;
      tempLoss = 0;
    }
  }
  currentWinStreak = tempWin;
  currentLosingStreak = tempLoss;

  let maxDrawdown = 0;
  let peak = 0;
  let equity = 0;
  for (const t of sorted) {
    equity += t.profitLoss ?? 0;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const netPnL = closed.reduce((a, t) => a + (t.profitLoss ?? 0), 0);
  const winCount = wins.length;
  const lossCount = losses.length;
  const totalClosed = winCount + lossCount;

  return {
    totalTrades: trades.length,
    totalWins: winCount,
    totalLosses: lossCount,
    totalBreakeven: breakeven.length,
    totalCancelled: trades.filter((t) => t.status === "cancelled").length,
    totalPlanned: trades.filter((t) => t.status === "planned").length,
    winRate: totalClosed > 0 ? (winCount / totalClosed) * 100 : 0,
    netPnL,
    profitFactor: totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? Infinity : 0,
    averageWin: winCount > 0 ? totalWinAmount / winCount : 0,
    averageLoss: lossCount > 0 ? totalLossAmount / lossCount : 0,
    averageR: closed.length > 0 ? netPnL / closed.length : 0,
    largestWin: winPnLs.length > 0 ? Math.max(...winPnLs) : 0,
    largestLoss: lossPnLs.length > 0 ? Math.min(...lossPnLs) : 0,
    currentWinStreak,
    currentLosingStreak,
    maxDrawdown,
    expectancy: totalClosed > 0 ? netPnL / totalClosed : 0,
  };
}

export function calculatePnLByDay(trades: Trade[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of trades) {
    if (t.profitLoss === undefined) continue;
    const date = new Date(t.closedAt ?? t.createdAt).toISOString().slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + t.profitLoss);
  }
  return map;
}

export function calculatePnLBySymbol(trades: Trade[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of trades) {
    if (t.profitLoss === undefined) continue;
    map.set(t.displayName, (map.get(t.displayName) ?? 0) + t.profitLoss);
  }
  return map;
}

export function calculatePnLByStrategy(trades: Trade[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of trades) {
    if (t.profitLoss === undefined || !t.strategyName) continue;
    map.set(t.strategyName, (map.get(t.strategyName) ?? 0) + t.profitLoss);
  }
  return map;
}

export function calculateWinRateByTimeframe(trades: Trade[]): Map<string, number> {
  const map = new Map<string, { wins: number; total: number }>();
  for (const t of trades) {
    if (t.status !== "win" && t.status !== "loss") continue;
    const entry = map.get(t.timeframe) ?? { wins: 0, total: 0 };
    entry.total++;
    if (t.status === "win") entry.wins++;
    map.set(t.timeframe, entry);
  }
  const result = new Map<string, number>();
  for (const [tf, { wins, total }] of map) {
    result.set(tf, total > 0 ? (wins / total) * 100 : 0);
  }
  return result;
}

export function calculateEquityCurve(trades: Trade[]): { date: string; equity: number }[] {
  const sorted = [...trades]
    .filter((t) => t.profitLoss !== undefined)
    .sort((a, b) => (a.closedAt ?? a.createdAt) - (b.closedAt ?? b.createdAt));

  let equity = 0;
  return sorted.map((t) => {
    equity += t.profitLoss!;
    return { date: new Date(t.closedAt ?? t.createdAt).toISOString().slice(0, 10), equity };
  });
}
