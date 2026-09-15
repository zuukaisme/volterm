"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export function SimpleModal({
  open,
  onClose,
  title,
  children,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-4 shadow-2xl">
        <h3 className="text-sm font-semibold mb-3">{title}</h3>
        {children}
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          {onConfirm && (
            <Button onClick={onConfirm} className="flex-1">
              Confirm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}