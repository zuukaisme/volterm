"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  CandlestickChart,
  BookOpen,
  LayoutGrid,
  NotebookPen,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/chart",
    label: "Charts",
    icon: CandlestickChart,
    match: (p: string) => p === "/chart",
  },
  {
    href: "/ledger",
    label: "Ledger",
    icon: BookOpen,
    match: (p: string) => p.startsWith("/ledger"),
  },
  {
    href: "/strategies",
    label: "Strategies",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/strategies"),
  },
  {
    href: "/journal",
    label: "Journal",
    icon: NotebookPen,
    match: (p: string) => p.startsWith("/journal"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: SettingsIcon,
    match: (p: string) => p.startsWith("/settings"),
  },
];

const MOBILE_ITEMS = NAV_ITEMS.filter((item) => item.href !== "/journal");

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-border bg-surface/95 backdrop-blur px-1 pt-1 pb-[env(safe-area-inset-bottom)]">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition-colors",
                active ? "text-accent" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-[200px] border-r border-border bg-surface">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <CandlestickChart className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">Volterm</span>
        </div>

        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}