"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[calc(100vw-1rem)]",
};

export function Modal({
  open,
  onClose,
  children,
  size = "md",
  title,
  noPadding,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  title?: string;
  noPadding?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl",
          sizeClasses[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={cn("min-h-0 flex-1", noPadding ? "overflow-hidden flex flex-col" : "overflow-y-auto p-4")}>
          {children}
        </div>
      </div>
    </div>
  );
}