"use client";

import { TIMEFRAMES } from "@/lib/market/timeframes";
import { cn } from "@/lib/utils";
import type { TimeframeId } from "@/types/market";

export function TimeframeSelector({
  value,
  onChange,
}: {
  value: TimeframeId;
  onChange: (id: TimeframeId) => void;
}) {
  return (
    <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1.5">
      {TIMEFRAMES.map((timeframe) => (
        <button
          key={timeframe.id}
          onClick={() => onChange(timeframe.id)}
          className={cn(
            "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold tabular-nums text-muted-foreground transition-colors",
            value === timeframe.id
              ? "bg-accent/15 text-accent"
              : "hover:bg-surface-raised hover:text-foreground"
          )}
        >
          {timeframe.label}
        </button>
      ))}
    </div>
  );
}
