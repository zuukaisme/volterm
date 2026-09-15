import type { Drawing } from "@/types/chart";

function storageKey(symbol: string, timeframeId: string): string {
  return `volterm:drawings:${symbol}:${timeframeId}`;
}

export function loadDrawings(symbol: string, timeframeId: string): Drawing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(symbol, timeframeId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Drawing[]) : [];
  } catch {
    return [];
  }
}

export function saveDrawings(symbol: string, timeframeId: string, drawings: Drawing[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(symbol, timeframeId), JSON.stringify(drawings));
  } catch {
    return;
  }
}
