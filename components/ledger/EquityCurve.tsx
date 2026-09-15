"use client";

import { useMemo } from "react";
import type { Trade } from "@/types/ledger";
import { calculateEquityCurve } from "@/lib/ledger/stats";
import { EmptyState } from "@/components/ui/EmptyState";

export function EquityCurve({ trades }: { trades: Trade[] }) {
  const curve = useMemo(() => calculateEquityCurve(trades), [trades]);

  if (curve.length < 2) {
    return <EmptyState title="Not enough data" description="Record at least two closed trades to see your equity curve." className="py-8" />;
  }

  const width = 300;
  const height = 90;
  const values = curve.map((p) => p.equity);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const stepX = width / (curve.length - 1);
  const points = curve
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p.equity - min) / range) * (height - 10) - 5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const baselineY = height - ((0 - min) / range) * (height - 10) - 5;
  const color = curve[curve.length - 1].equity >= curve[0].equity ? "var(--color-up)" : "var(--color-down)";

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        <line
          x1="0"
          y1={baselineY}
          x2={width}
          y2={baselineY}
          stroke="var(--color-border)"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={color}
          opacity="0.12"
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{curve[0].date}</span>
        <span className="tabular-nums">
          {curve[curve.length - 1].equity >= 0 ? "+" : ""}
          {curve[curve.length - 1].equity.toFixed(2)}
        </span>
        <span>{curve[curve.length - 1].date}</span>
      </div>
    </div>
  );
}