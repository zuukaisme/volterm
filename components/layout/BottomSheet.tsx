"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  fullHeight?: boolean;
};

export function BottomSheet({ open, onClose, title, children, fullHeight }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex flex-col rounded-t-2xl border-t border-border bg-surface shadow-2xl",
          fullHeight ? "h-[92vh]" : "max-h-[80vh]"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="mx-auto h-1 w-10 rounded-full bg-border absolute left-1/2 top-2 -translate-x-1/2" />
          <h2 className="pt-1 text-sm font-semibold text-foreground">{title}</h2>
          <IconButton label="Close" onClick={onClose} className="pt-1">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-2 pb-[env(safe-area-inset-bottom)]">{children}</div>
      </div>
    </div>
  );
}
