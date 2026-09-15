"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadWatchlist, saveWatchlist } from "@/lib/storage/watchlist";
import { getMarketDataProvider } from "@/lib/deriv/provider";
import { getDerivConnection } from "@/lib/deriv/websocket";
import { throttle } from "@/lib/utils";
import type { ConnectionState, PriceSnapshot } from "@/types/market";

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceSnapshot>>({});
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const subscriptionsRef = useRef(new Map<string, { unsubscribe: () => void }>());
  const hydratedRef = useRef(false);

  useEffect(() => {
    setSymbols(loadWatchlist());
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    const connection = getDerivConnection();
    return connection.onStateChange(setConnectionState);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    saveWatchlist(symbols);

    const provider = getMarketDataProvider();
    const activeSymbols = new Set(symbols);

    for (const [symbol, subscription] of subscriptionsRef.current.entries()) {
      if (!activeSymbols.has(symbol)) {
        subscription.unsubscribe();
        subscriptionsRef.current.delete(symbol);
      }
    }

    for (const symbol of symbols) {
      if (subscriptionsRef.current.has(symbol)) continue;
      const throttledUpdate = throttle((snapshot: PriceSnapshot) => {
        setPrices((prev) => ({ ...prev, [symbol]: snapshot }));
      }, 400);

      const subscription = provider.subscribeTicks(symbol, (tick) => {
        throttledUpdate({
          symbol,
          price: tick.quote,
          previousClose: null,
          change: null,
          changePercent: null,
          lastUpdate: tick.epoch,
          connected: true,
        });
      });
      subscriptionsRef.current.set(symbol, subscription);
    }
  }, [symbols]);

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
      subscriptionsRef.current.clear();
    };
  }, []);

  const add = useCallback((symbol: string) => {
    setSymbols((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
  }, []);

  const remove = useCallback((symbol: string) => {
    setSymbols((prev) => prev.filter((entry) => entry !== symbol));
    setPrices((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  }, []);

  const moveUp = useCallback((symbol: string) => {
    setSymbols((prev) => {
      const index = prev.indexOf(symbol);
      if (index <= 0) return prev;
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  }, []);

  const moveDown = useCallback((symbol: string) => {
    setSymbols((prev) => {
      const index = prev.indexOf(symbol);
      if (index === -1 || index >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  }, []);

  const isWatched = useCallback((symbol: string) => symbols.includes(symbol), [symbols]);

  const resolvedPrices = mergeConnectionState(prices, connectionState);

  return { symbols, prices: resolvedPrices, add, remove, moveUp, moveDown, isWatched };
}

function mergeConnectionState(
  prices: Record<string, PriceSnapshot>,
  connectionState: ConnectionState
): Record<string, PriceSnapshot> {
  const globallyConnected = connectionState === "connected";
  const result: Record<string, PriceSnapshot> = {};
  for (const [symbol, snapshot] of Object.entries(prices)) {
    result[symbol] = { ...snapshot, connected: snapshot.connected && globallyConnected };
  }
  return result;
}
