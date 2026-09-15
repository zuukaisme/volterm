import { getDerivConnection } from "./websocket";
import { fetchActiveSymbols } from "./symbols";
import {
  fetchHistoricalCandles,
  fetchHistoricalTicks,
  NATIVE_CANDLE_GRANULARITIES,
} from "./history";
import { subscribeToTicks } from "./ticks";
import { CandleAggregator, aggregateCandles } from "@/lib/market/candles";
import type { Candle, Instrument, Tick } from "@/types/market";

export type Subscription = {
  unsubscribe: () => void;
};

export interface MarketDataProvider {
  getInstruments(): Promise<Instrument[]>;
  getHistoricalData(symbol: string, timeframeSeconds: number): Promise<Candle[]>;
  subscribeTicks(symbol: string, callback: (tick: Tick) => void): Subscription;
}

export class DerivProvider implements MarketDataProvider {
  private connection = getDerivConnection();

  async getInstruments(): Promise<Instrument[]> {
    return fetchActiveSymbols(this.connection);
  }

  async getHistoricalData(symbol: string, timeframeSeconds: number): Promise<Candle[]> {
    if (NATIVE_CANDLE_GRANULARITIES.has(timeframeSeconds)) {
      return fetchHistoricalCandles(this.connection, symbol, timeframeSeconds);
    }
    if (timeframeSeconds > 86400) {
      const daily = await fetchHistoricalCandles(this.connection, symbol, 86400);
      return aggregateCandles(daily, timeframeSeconds);
    }
    const ticks = await fetchHistoricalTicks(this.connection, symbol);
    const aggregator = new CandleAggregator(timeframeSeconds);
    aggregator.seedFromTicks(ticks);
    return aggregator.getCandles();
  }

  subscribeTicks(symbol: string, callback: (tick: Tick) => void): Subscription {
    let cancelled = false;
    let liveUnsubscribe: (() => void) | null = null;

    subscribeToTicks(this.connection, symbol, (tick) => {
      callback({
        symbol: tick.symbol,
        quote: tick.price,
        epoch: tick.epoch,
        pipSize: tick.pipSize,
      });
    })
      .then(({ initial, unsubscribe }) => {
        if (cancelled) {
          unsubscribe();
          return;
        }
        liveUnsubscribe = unsubscribe;
        if (initial) {
          callback({
            symbol: initial.symbol,
            quote: initial.price,
            epoch: initial.epoch,
            pipSize: initial.pipSize,
          });
        }
      })
      .catch(() => {});

    return {
      unsubscribe: () => {
        cancelled = true;
        liveUnsubscribe?.();
      },
    };
  }
}

let sharedProvider: DerivProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (!sharedProvider) {
    sharedProvider = new DerivProvider();
  }
  return sharedProvider;
}
