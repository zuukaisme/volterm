import Dexie, { type EntityTable } from "dexie";
import type { Trade, Strategy, DailyJournal, LedgerSettings } from "@/types/ledger";

class LedgerDatabase extends Dexie {
  trades!: EntityTable<Trade, "id">;
  strategies!: EntityTable<Strategy, "id">;
  journals!: EntityTable<DailyJournal, "id">;
  settings!: EntityTable<LedgerSettings, "id">;

  constructor() {
    super("volterm-ledger");
    this.version(1).stores({
      trades: "id, symbol, status, direction, strategyId, timeframe, createdAt, closedAt",
      strategies: "id, name, archived, createdAt",
      journals: "id, date, createdAt",
      settings: "id",
    });
  }
}

let _db: LedgerDatabase | null = null;

export function getLedgerDB(): LedgerDatabase {
  if (!_db) {
    _db = new LedgerDatabase();
  }
  return _db;
}
