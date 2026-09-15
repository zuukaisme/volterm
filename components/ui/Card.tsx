"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-surface p-4",
        onClick && "cursor-pointer hover:bg-surface-raised transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <Card className={className}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-lg font-semibold tabular-nums", valueClassName)}>{value}</div>
    </Card>
  );
}
