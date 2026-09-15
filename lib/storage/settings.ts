import { getLedgerDB } from "./db";
import type { LedgerSettings } from "@/types/ledger";

const db = () => getLedgerDB();
const SETTINGS_ID = "default";

const DEFAULT_SETTINGS: LedgerSettings = {
  id: SETTINGS_ID,
  showTradeMarkers: true,
  updatedAt: Date.now(),
};

export async function getSettings(): Promise<LedgerSettings> {
  const existing = await db().settings.get(SETTINGS_ID);
  return existing ?? DEFAULT_SETTINGS;
}

export async function updateSettings(data: Partial<LedgerSettings>): Promise<void> {
  const current = await getSettings();
  await db().settings.put({ ...current, ...data, id: SETTINGS_ID, updatedAt: Date.now() });
}

export async function markBackupTime(): Promise<void> {
  await updateSettings({ lastBackupAt: Date.now() });
}
