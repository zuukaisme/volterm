import { z } from "zod";
import type { DerivSocketManager } from "./websocket";
import { getAliasesForSymbol } from "@/lib/market/aliases";
import { titleCaseFromSlug } from "@/lib/utils";
import type { Instrument } from "@/types/market";

const activeSymbolItemSchema = z.object({
  exchange_is_open: z.number(),
  is_trading_suspended: z.number(),
  market: z.string(),
  pip_size: z.number(),
  subgroup: z.string(),
  submarket: z.string(),
  trade_count: z.number().optional(),
  underlying_symbol: z.string(),
  underlying_symbol_name: z.string(),
  underlying_symbol_type: z.string(),
});

const activeSymbolsResponseSchema = z.object({
  msg_type: z.string(),
  active_symbols: z.array(activeSymbolItemSchema).optional(),
  error: z
    .object({ code: z.string().optional(), message: z.string().optional() })
    .optional(),
});

const SYNTHETIC_MARKET_KEYS = ["synthetic_index", "synthetic"];

const SUBMARKET_DISPLAY_NAMES: Record<string, string> = {
  random_index: "Volatility Indices",
  random_daily: "Daily Reset Indices",
  random_nightly: "Nightly Reset Indices",
  crash_index: "Crash/Boom Indices",
  crash_boom: "Crash/Boom Indices",
  step_index: "Step Indices",
  jump_index: "Jump Indices",
  range_break: "Range Break Indices",
  dex: "DEX Indices",
  dxi: "DEX Indices",
  synthetics: "Other Synthetic Indices",
  forex_basket: "Forex Baskets",
  commodity_basket: "Commodity Baskets",
};

export function submarketDisplayName(submarket: string): string {
  return SUBMARKET_DISPLAY_NAMES[submarket] ?? titleCaseFromSlug(submarket);
}

export function marketDisplayName(market: string): string {
  if (SYNTHETIC_MARKET_KEYS.includes(market)) return "Synthetic Indices";
  return titleCaseFromSlug(market);
}

export function isSyntheticMarket(market: string): boolean {
  return SYNTHETIC_MARKET_KEYS.includes(market);
}

export async function fetchActiveSymbols(
  connection: DerivSocketManager
): Promise<Instrument[]> {
  const raw = await connection.send({ active_symbols: "brief" });
  const parsed = activeSymbolsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Unexpected active_symbols response shape from Deriv");
  }
  if (parsed.data.error) {
    throw new Error(parsed.data.error.message ?? "Failed to load instruments");
  }

  const items = parsed.data.active_symbols ?? [];

  return items.map((item): Instrument => ({
    symbol: item.underlying_symbol,
    displayName: item.underlying_symbol_name,
    market: item.market,
    marketDisplay: marketDisplayName(item.market),
    submarket: item.submarket,
    submarketDisplay: submarketDisplayName(item.submarket),
    pipSize: item.pip_size,
    isActive: item.exchange_is_open === 1,
    isTradingSuspended: item.is_trading_suspended === 1,
    aliases: getAliasesForSymbol(item.underlying_symbol),
  }));
}
