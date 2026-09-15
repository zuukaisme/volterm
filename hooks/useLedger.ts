"use client";

import { useState, useEffect, useCallback } from "react";
import type { Trade, Strategy, DailyJournal, LedgerSettings } from "@/types/ledger";
import * as trades from "@/lib/storage/trades";
import * as strategies from "@/lib/storage/strategies";
import * as journalStorage from "@/lib/storage/journals";
import * as settingsStorage from "@/lib/storage/settings";

export function useTrades() {
  const [items, setItems] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await trades.getAllTrades();
    setItems(all.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (data: Partial<Trade>) => {
    const t = await trades.createTrade(data);
    await refresh();
    return t;
  }, [refresh]);

  const update = useCallback(async (id: string, data: Partial<Trade>) => {
    await trades.updateTrade(id, data);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await trades.deleteTrade(id);
    await refresh();
  }, [refresh]);

  const duplicate = useCallback(async (id: string) => {
    const t = await trades.duplicateTrade(id);
    await refresh();
    return t;
  }, [refresh]);

  return { items, loading, refresh, add, update, remove, duplicate };
}

export function useStrategies() {
  const [items, setItems] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await strategies.getAllStrategies();
    setItems(all.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (data: Partial<Strategy>) => {
    const s = await strategies.createStrategy(data);
    await refresh();
    return s;
  }, [refresh]);

  const update = useCallback(async (id: string, data: Partial<Strategy>) => {
    await strategies.updateStrategy(id, data);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await strategies.deleteStrategy(id);
    await refresh();
  }, [refresh]);

  const duplicate = useCallback(async (id: string) => {
    const s = await strategies.duplicateStrategy(id);
    await refresh();
    return s;
  }, [refresh]);

  const archive = useCallback(async (id: string) => {
    await strategies.archiveStrategy(id);
    await refresh();
  }, [refresh]);

  const unarchive = useCallback(async (id: string) => {
    await strategies.unarchiveStrategy(id);
    await refresh();
  }, [refresh]);

  return { items, loading, refresh, add, update, remove, duplicate, archive, unarchive };
}

export function useJournals() {
  const [items, setItems] = useState<DailyJournal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await journalStorage.getAllJournals();
    setItems(all);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (data: Partial<DailyJournal>) => {
    const j = await journalStorage.createJournal(data);
    await refresh();
    return j;
  }, [refresh]);

  const update = useCallback(async (id: string, data: Partial<DailyJournal>) => {
    await journalStorage.updateJournal(id, data);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await journalStorage.deleteJournal(id);
    await refresh();
  }, [refresh]);

  return { items, loading, refresh, add, update, remove };
}

export function useLedgerSettings() {
  const [settings, setSettings] = useState<LedgerSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const s = await settingsStorage.getSettings();
    setSettings(s);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = useCallback(async (data: Partial<LedgerSettings>) => {
    await settingsStorage.updateSettings(data);
    await refresh();
  }, [refresh]);

  return { settings, loading, refresh, update };
}