"use client";

import { Layers, ListChecks, PenLine, Star } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import type { MobileSheetKey } from "./types";

const ITEMS: { key: MobileSheetKey; label: string; icon: typeof Star }[] = [
  { key: "watchlist", label: "Watchlist", icon: Star },
  { key: "indicators", label: "Indicators", icon: ListChecks },
  { key: "draw", label: "Draw", icon: PenLine },
  { key: "chartType", label: "Chart type", icon: Layers },
];

export function MobileToolbar({
  active,
  onSelect,
}: {
  active: MobileSheetKey | null;
  onSelect: (key: MobileSheetKey) => void;
}) {
  return (
    <div className="flex items-center justify-around border-t border-border bg-surface px-1 py-1 pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <IconButton
            key={item.key}
            label={item.label}
            active={active === item.key}
            onClick={() => onSelect(item.key)}
            className="h-12 w-14 flex-col gap-0.5 rounded-xl text-[10px]"
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px]">{item.label}</span>
          </IconButton>
        );
      })}
    </div>
  );
}
