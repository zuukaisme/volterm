import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | null | undefined, pipSize = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const decimals = pipDecimals(pipSize);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function pipDecimals(pipSize: number): number {
  if (!pipSize || pipSize <= 0) return 2;
  const decimals = Math.round(Math.log10(1 / pipSize));
  return Math.min(Math.max(decimals, 0), 8);
}

export function formatChange(change: number | null | undefined, pipSize = 2): string {
  if (change === null || change === undefined || Number.isNaN(change)) return "—";
  const sign = change > 0 ? "+" : "";
  return `${sign}${formatPrice(change, pipSize)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatClockTime(epochSeconds: number | null | undefined): string {
  if (!epochSeconds) return "—";
  const date = new Date(epochSeconds * 1000);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number
): (...args: Args) => void {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  const invoke = (args: Args) => {
    lastCall = Date.now();
    fn(...args);
  };

  return (...args: Args) => {
    const now = Date.now();
    const remaining = waitMs - (now - lastCall);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      invoke(args);
    } else {
      pendingArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          if (pendingArgs) invoke(pendingArgs);
          pendingArgs = null;
        }, remaining);
      }
    }
  };
}

export function titleCaseFromSlug(slug: string): string {
  return slug
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
