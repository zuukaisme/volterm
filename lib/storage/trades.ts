import { getLedgerDB } from "./db";
import type { Trade, TradeFilter } from "@/types/ledger";
import { generateId } from "@/lib/utils";

const db = () => getLedgerDB();

export async function createTrade(data: Partial<Trade>): Promise<Trade> {
  const now = Date.now();
  const trade: Trade = {
    symbol: data.symbol ?? "",
    displayName: data.displayName ?? "",
    direction: data.direction ?? "long",
    status: data.status ?? "planned",
    timeframe: data.timeframe ?? "1H",
    createdAt: now,
    updatedAt: now,
    ...data,
    id: data.id ?? generateId(),
  };
  await db().trades.add(trade);
  return trade;
}

export async function updateTrade(id: string, data: Partial<Trade>): Promise<void> {
  await db().trades.update(id, { ...data, updatedAt: Date.now() });
}

export async function deleteTrade(id: string): Promise<void> {
  await db().trades.delete(id);
}

export async function getTrade(id: string): Promise<Trade | undefined> {
  return db().trades.get(id);
}

export async function getAllTrades(): Promise<Trade[]> {
  return db().trades.toArray();
}

export async function getTradesByStatus(status: Trade["status"]): Promise<Trade[]> {
  return db().trades.where("status").equals(status).toArray();
}

export async function getTradesByStrategy(strategyId: string): Promise<Trade[]> {
  return db().trades.where("strategyId").equals(strategyId).toArray();
}

export async function getTradesBySymbol(symbol: string): Promise<Trade[]> {
  return db().trades.where("symbol").equals(symbol).toArray();
}

export async function searchTrades(query: string): Promise<Trade[]> {
  const q = query.toLowerCase();
  const all = await db().trades.toArray();
  return all.filter(
    (t) =>
      t.symbol.toLowerCase().includes(q) ||
      t.displayName.toLowerCase().includes(q) ||
      (t.strategyName ?? "").toLowerCase().includes(q) ||
      (t.notes ?? "").toLowerCase().includes(q) ||
      (t.setup ?? "").toLowerCase().includes(q) ||
      (t.entryReason ?? "").toLowerCase().includes(q) ||
      (t.exitReason ?? "").toLowerCase().includes(q) ||
      (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
  );
}

export async function filterTrades(filter: TradeFilter): Promise<Trade[]> {
  let trades = await db().trades.toArray();

  if (filter.dateFrom) trades = trades.filter((t) => t.createdAt >= filter.dateFrom!);
  if (filter.dateTo) trades = trades.filter((t) => t.createdAt <= filter.dateTo!);
  if (filter.symbol) trades = trades.filter((t) => t.symbol === filter.symbol);
  if (filter.direction) trades = trades.filter((t) => t.direction === filter.direction);
  if (filter.status) trades = trades.filter((t) => t.status === filter.status);
  if (filter.strategyId) trades = trades.filter((t) => t.strategyId === filter.strategyId);
  if (filter.timeframe) trades = trades.filter((t) => t.timeframe === filter.timeframe);
  if (filter.isPlanned !== undefined) trades = trades.filter((t) => t.isPlanned === filter.isPlanned);
  if (filter.followedStrategy !== undefined)
    trades = trades.filter((t) => t.followedStrategy === filter.followedStrategy);
  if (filter.emotion) trades = trades.filter((t) => t.emotion === filter.emotion);
  if (filter.tags && filter.tags.length > 0) {
    trades = trades.filter((t) => filter.tags!.some((tag) => (t.tags ?? []).includes(tag)));
  }

  return trades.sort((a, b) => b.createdAt - a.createdAt);
}

export async function duplicateTrade(id: string): Promise<Trade | null> {
  const original = await db().trades.get(id);
  if (!original) return null;
  const now = Date.now();
  const copy: Trade = {
    ...original,
    id: generateId(),
    status: "planned",
    profitLoss: undefined,
    exitPrice: undefined,
    closedAt: undefined,
    createdAt: now,
    updatedAt: now,
  };
  delete (copy as Record<string, unknown>)["screenshot"];
  await db().trades.add(copy);
  return copy;
}

export async function getTradesForDateRange(start: number, end: number): Promise<Trade[]> {
  const all = await db().trades.toArray();
  return all.filter((t) => t.createdAt >= start && t.createdAt <= end);
}

export async function getTradesCount(): Promise<number> {
  return db().trades.count();
}
