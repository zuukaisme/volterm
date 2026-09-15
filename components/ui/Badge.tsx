import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
