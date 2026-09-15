import type { TimeframeDefinition, TimeframeId } from "@/types/market";

export const TIMEFRAMES: TimeframeDefinition[] = [
  { id: "1m", label: "1m", seconds: 60, derivGranularity: 60 },
  { id: "5m", label: "5m", seconds: 300, derivGranularity: 300 },
  { id: "15m", label: "15m", seconds: 900, derivGranularity: 900 },
  { id: "30m", label: "30m", seconds: 1800, derivGranularity: 1800 },
  { id: "1H", label: "1H", seconds: 3600, derivGranularity: 3600 },
  { id: "4H", label: "4H", seconds: 14400, derivGranularity: 14400 },
  { id: "1D", label: "1D", seconds: 86400, derivGranularity: 86400 },
  { id: "4D", label: "4D", seconds: 345600, derivGranularity: 86400 },
  { id: "1W", label: "1W", seconds: 604800, derivGranularity: 86400 },
  { id: "1M", label: "1M", seconds: 2592000, derivGranularity: 86400 },
];

const timeframeById = new Map(TIMEFRAMES.map((definition) => [definition.id, definition]));

export function getTimeframe(id: TimeframeId): TimeframeDefinition {
  const definition = timeframeById.get(id);
  if (!definition) {
    throw new Error(`Unknown timeframe: ${id}`);
  }
  return definition;
}

export const DEFAULT_TIMEFRAME: TimeframeId = "1m";
