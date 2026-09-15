import { getLedgerDB } from "./db";
import type { LedgerBackup, Trade, Strategy, DailyJournal } from "@/types/ledger";
import { z } from "zod/v4";

const tradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  displayName: z.string(),
  direction: z.enum(["long", "short"]),
  status: z.enum(["planned", "open", "win", "loss", "breakeven", "cancelled"]),
  timeframe: z.string(),
  entryPrice: z.number().optional(),
  exitPrice: z.number().optional(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  positionSize: z.number().optional(),
  riskAmount: z.number().optional(),
  profitLoss: z.number().optional(),
  riskReward: z.number().optional(),
  strategyId: z.string().optional(),
  strategyName: z.string().optional(),
  setup: z.string().optional(),
  entryReason: z.string().optional(),
  exitReason: z.string().optional(),
  notes: z.string().optional(),
  screenshot: z.string().optional(),
  openedAt: z.number().optional(),
  closedAt: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  tags: z.array(z.string()).optional(),
  emotion: z.string().optional(),
  confidence: z.number().optional(),
  discipline: z.number().optional(),
  isPlanned: z.boolean().optional(),
  followedStrategy: z.boolean().optional(),
});

const strategySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  entryRules: z.array(z.string()).optional(),
  confirmationRules: z.array(z.string()).optional(),
  exitRules: z.array(z.string()).optional(),
  preferredTimeframes: z.array(z.string()).optional(),
  preferredSymbols: z.array(z.string()).optional(),
  notes: z.string().optional(),
  archived: z.boolean().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const journalSchema = z.object({
  id: z.string(),
  date: z.string(),
  marketOverview: z.string().optional(),
  plan: z.string().optional(),
  goals: z.string().optional(),
  lessons: z.string().optional(),
  mistakes: z.string().optional(),
  mood: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const backupSchema = z.object({
  version: z.number(),
  exportedAt: z.number(),
  trades: z.array(tradeSchema),
  strategies: z.array(strategySchema),
  journals: z.array(journalSchema),
  settings: z
    .object({
      id: z.string(),
      lastBackupAt: z.number().optional(),
      defaultAccountBalance: z.number().optional(),
      defaultRiskPercent: z.number().optional(),
      currency: z.string().optional(),
      showTradeMarkers: z.boolean().optional(),
      updatedAt: z.number(),
    })
    .nullable()
    .optional(),
});

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  preview: {
    trades: number;
    strategies: number;
    journals: number;
  } | null;
};

export function validateBackup(data: unknown): ValidationResult {
  const result = backupSchema.safeParse(data);
  if (result.success) {
    return {
      valid: true,
      errors: [],
      preview: {
        trades: result.data.trades.length,
        strategies: result.data.strategies.length,
        journals: result.data.journals.length,
      },
    };
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    preview: null,
  };
}

export async function importBackup(
  data: LedgerBackup,
  mode: "merge" | "replace"
): Promise<{ trades: number; strategies: number; journals: number }> {
  const db = getLedgerDB();

  if (mode === "replace") {
    await Promise.all([
      db.trades.clear(),
      db.strategies.clear(),
      db.journals.clear(),
    ]);
  }

  let tradesImported = 0;
  let strategiesImported = 0;
  let journalsImported = 0;

  if (data.trades.length > 0) {
    if (mode === "replace") {
      await db.trades.bulkAdd(data.trades);
      tradesImported = data.trades.length;
    } else {
      for (const trade of data.trades) {
        const existing = await db.trades.get(trade.id);
        if (existing) {
          await db.trades.put(trade);
        } else {
          await db.trades.add(trade);
        }
        tradesImported++;
      }
    }
  }

  if (data.strategies.length > 0) {
    if (mode === "replace") {
      await db.strategies.bulkAdd(data.strategies);
      strategiesImported = data.strategies.length;
    } else {
      for (const strategy of data.strategies) {
        const existing = await db.strategies.get(strategy.id);
        if (existing) {
          await db.strategies.put(strategy);
        } else {
          await db.strategies.add(strategy);
        }
        strategiesImported++;
      }
    }
  }

  if (data.journals.length > 0) {
    if (mode === "replace") {
      await db.journals.bulkAdd(data.journals);
      journalsImported = data.journals.length;
    } else {
      for (const journal of data.journals) {
        const existing = await db.journals.get(journal.id);
        if (existing) {
          await db.journals.put(journal);
        } else {
          await db.journals.add(journal);
        }
        journalsImported++;
      }
    }
  }

  if (data.settings) {
    await db.settings.put({ ...data.settings, id: "default" });
  }

  return { trades: tradesImported, strategies: strategiesImported, journals: journalsImported };
}
