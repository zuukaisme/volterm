import { z } from "zod";
import type { DerivSocketManager } from "./websocket";
import type { Candle } from "@/types/market";

const candleItemSchema = z.object({
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  epoch: z.number(),
});

const historyResponseSchema = z.object({
  msg_type: z.string(),
  candles: z.array(candleItemSchema).optional(),
  history: z
    .object({
      prices: z.array(z.number()).optional(),
      times: z.array(z.number()).optional(),
    })
    .optional(),
  pip_size: z.number().optional(),
  error: z
    .object({ code: z.string().optional(), message: z.string().optional() })
    .optional(),
});

export const NATIVE_CANDLE_GRANULARITIES = new Set([
  60, 120, 180, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 86400,
]);

export async function fetchHistoricalCandles(
  connection: DerivSocketManager,
  symbol: string,
  granularitySeconds: number,
  count = 1000
): Promise<Candle[]> {
  const raw = await connection.send({
    ticks_history: symbol,
    style: "candles",
    granularity: granularitySeconds,
    count,
    end: "latest",
  });

  const parsed = historyResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Unexpected ticks_history (candles) response shape from Deriv");
  }
  if (parsed.data.error) {
    throw new Error(parsed.data.error.message ?? "Failed to load historical candles");
  }

  const candles = parsed.data.candles ?? [];
  return candles
    .map((candle): Candle => ({
      time: candle.epoch,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      ticks: 1,
    }))
    .sort((a, b) => a.time - b.time);
}

export type RawTick = { epoch: number; price: number };

export async function fetchHistoricalTicks(
  connection: DerivSocketManager,
  symbol: string,
  count = 5000
): Promise<RawTick[]> {
  const raw = await connection.send({
    ticks_history: symbol,
    style: "ticks",
    count,
    end: "latest",
  });

  const parsed = historyResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Unexpected ticks_history (ticks) response shape from Deriv");
  }
  if (parsed.data.error) {
    throw new Error(parsed.data.error.message ?? "Failed to load historical ticks");
  }

  const prices = parsed.data.history?.prices ?? [];
  const times = parsed.data.history?.times ?? [];
  const length = Math.min(prices.length, times.length);
  const out: RawTick[] = [];
  for (let i = 0; i < length; i += 1) {
    const epoch = times[i];
    const price = prices[i];
    if (epoch === undefined || price === undefined) continue;
    out.push({ epoch, price });
  }
  return out;
}
