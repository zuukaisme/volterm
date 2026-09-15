"use client";

import { CandlestickChart, LineChart, AreaChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartType } from "@/types/chart";

const OPTIONS: { id: ChartType; label: string; icon: typeof CandlestickChart }[] = [
  { id: "candles", label: "Candles", icon: CandlestickChart },
  { id: "line", label: "Line", icon: LineChart },
  { id: "area", label: "Area", icon: AreaChart },
];

export function ChartTypeSelector({
  value,
  onChange,
}: {
  value: ChartType;
  onChange: (type: ChartType) => void;
}) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              value === option.id
                ? "bg-accent/15 text-accent"
                : "text-foreground hover:bg-surface-raised"
            )}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
