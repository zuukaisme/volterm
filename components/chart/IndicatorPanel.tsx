"use client";

import { CheckboxRow } from "@/components/ui/CheckboxRow";
import type { IndicatorId, IndicatorState } from "@/types/chart";

const ROWS: { id: IndicatorId; label: string; description: string; color?: string }[] = [
  { id: "ema20", label: "EMA 20", description: "Fast trend", color: "#4c8dff" },
  { id: "ema50", label: "EMA 50", description: "Slow trend", color: "#b98cff" },
  { id: "sma200", label: "SMA 200", description: "Long baseline", color: "#f5a623" },
  { id: "rsi", label: "RSI (14)", description: "Momentum, own pane" },
  { id: "macd", label: "MACD (12, 26, 9)", description: "Momentum, own pane" },
  { id: "bollinger", label: "Bollinger Bands (20, 2σ)", description: "Volatility bands" },
];

export function IndicatorPanel({
  value,
  onToggle,
}: {
  value: IndicatorState;
  onToggle: (id: IndicatorId, next: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 p-2">
      {ROWS.map((row) => (
        <CheckboxRow
          key={row.id}
          label={row.label}
          description={row.description}
          swatchColor={row.color}
          checked={value[row.id]}
          onChange={(event) => onToggle(row.id, event.target.checked)}
        />
      ))}
    </div>
  );
}
