"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getMarketDataProvider } from "@/lib/deriv/provider";
import { CandleAggregator } from "@/lib/market/candles";
import { getTimeframe } from "@/lib/market/timeframes";
import { throttle } from "@/lib/utils";
import type { PriceSnapshot, TimeframeId } from "@/types/market";
import type { CandleStreamEvent } from "@/types/chart";

export type CandleStreamHandle = {
  getSnapshot: () => import("@/types/market").Candle[];
  subscribe: (listener: (event: CandleStreamEvent) => void) => () => void;
};

const emptySnapshot = (symbol: string): PriceSnapshot => ({
  symbol,
  price: null,
  previousClose: null,
  change: null,
  changePercent: null,
  lastUpdate: null,
  connected: false,
});

export function useCandles(symbol: string | null, timeframeId: TimeframeId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceSnapshot, setPriceSnapshot] = useState<PriceSnapshot>(emptySnapshot(symbol ?? ""));
  const [reloadToken, setReloadToken] = useState(0);
  const retry = () => setReloadToken((token) => token + 1);

  const listenersRef = useRef(new Set<(event: CandleStreamEvent) => void>());
  const aggregatorRef = useRef<CandleAggregator | null>(null);

  const streamHandle = useMemo<CandleStreamHandle>(
    () => ({
      getSnapshot: () => aggregatorRef.current?.getCandles() ?? [],
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    []
  );

  useEffect(() => {
    if (!symbol) {
      setPriceSnapshot(emptySnapshot(""));
      return;
    }

    let cancelled = false;
    let tickSubscription: { unsubscribe: () => void } | null = null;

    setLoading(true);
    setError(null);
    setPriceSnapshot(emptySnapshot(symbol));

    const timeframe = getTimeframe(timeframeId);
    const aggregator = new CandleAggregator(timeframe.seconds);
    aggregatorRef.current = aggregator;

    const emit = (event: CandleStreamEvent) => {
      listenersRef.current.forEach((listener) => listener(event));
    };

    const throttledPriceUpdate = throttle((snapshot: PriceSnapshot) => {
      if (!cancelled) setPriceSnapshot(snapshot);
    }, 250);

    async function setup() {
      try {
        const provider = getMarketDataProvider();
        const historical = await provider.getHistoricalData(symbol as string, timeframe.seconds);
        if (cancelled) return;

        aggregator.seed(historical);
        emit({ type: "reset", candles: aggregator.getCandles() });
        setLoading(false);

        tickSubscription = provider.subscribeTicks(symbol as string, (tick) => {
          if (cancelled) return;
          const { candle, isNew } = aggregator.addTick(tick.epoch, tick.quote);
          emit(isNew ? { type: "new", candle } : { type: "update", candle });

          const allCandles = aggregator.getCandles();
          const referenceCandle =
            allCandles.length > 1 ? allCandles[allCandles.length - 2] : allCandles[0];
          const previousClose = referenceCandle ? referenceCandle.close : candle.open;
          const change = tick.quote - previousClose;
          const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

          throttledPriceUpdate({
            symbol: symbol as string,
            price: tick.quote,
            previousClose,
            change,
            changePercent,
            lastUpdate: tick.epoch,
            connected: true,
          });
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load chart data");
          setLoading(false);
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
      tickSubscription?.unsubscribe();
    };
  }, [symbol, timeframeId, reloadToken]);

  return { streamHandle, priceSnapshot, loading, error, retry };
}
