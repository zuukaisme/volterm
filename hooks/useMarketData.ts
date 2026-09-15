"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getMarketDataProvider } from "@/lib/deriv/provider";
import { isSyntheticMarket } from "@/lib/deriv/symbols";
import type { Instrument, MarketCategory } from "@/types/market";

export function useMarketData() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = getMarketDataProvider();
      const list = await provider.getInstruments();
      setInstruments(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load market data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const syntheticInstruments = useMemo(
    () => instruments.filter((instrument) => isSyntheticMarket(instrument.market)),
    [instruments]
  );

  const categories = useMemo<MarketCategory[]>(() => {
    const byKey = new Map<string, MarketCategory>();
    for (const instrument of syntheticInstruments) {
      const key = instrument.submarket;
      const existing = byKey.get(key);
      if (existing) {
        existing.instruments.push(instrument);
      } else {
        byKey.set(key, {
          key,
          label: instrument.submarketDisplay,
          submarket: instrument.submarket,
          instruments: [instrument],
        });
      }
    }
    return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [syntheticInstruments]);

  return {
    instruments: syntheticInstruments,
    categories,
    loading,
    error,
    reload: load,
  };
}
