"use client";

import Link from "next/link";
import {
  CandlestickChart,
  BookOpen,
  LayoutGrid,
  NotebookPen,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { useTrades, useStrategies, useJournals } from "@/hooks/useLedger";
import { calculateStats } from "@/lib/ledger/stats";
import { cn, formatPrice } from "@/lib/utils";

const FEATURES = [
  {
    href: "/chart",
    label: "Charts",
    description: "Live synthetic index charting",
    icon: CandlestickChart,
    color: "text-accent",
  },
  {
    href: "/ledger",
    label: "Ledger",
    description: "Record and review your trades",
    icon: BookOpen,
    color: "text-up",
  },
  {
    href: "/strategies",
    label: "Strategies",
    description: "Manage your trading strategies",
    icon: LayoutGrid,
    color: "text-accent-2",
  },
  {
    href: "/journal",
    label: "Journal",
    description: "Daily trading journal",
    icon: NotebookPen,
    color: "text-accent",
  },
];

export default function DashboardPage() {
  const { items: trades } = useTrades();
  const { items: strategies } = useStrategies();
  const { items: journals } = useJournals();
  const stats = calculateStats(trades);

  const recentTrades = trades.slice(0, 5);

  return (
    <div className="min-h-dvh md:pl-[200px] pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
      <div className="mx-auto max-w-3xl p-4 space-y-6">
        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-xl font-bold">Trading Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {trades.length} trades · {strategies.length} strategies · {journals.length} journal entries
            </p>
          </div>
          <Link href="/ledger">
            <Button>
              <Plus className="h-4 w-4" />
              New Trade
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard
            label="Net P&L"
            value={trades.length > 0 ? formatPrice(stats.netPnL) : "—"}
            valueClassName={cn(trades.length > 0 && (stats.netPnL >= 0 ? "text-up" : "text-down"), "text-base")}
          />
          <StatCard label="Win Rate" value={trades.length > 0 ? `${stats.winRate.toFixed(1)}%` : "—"} valueClassName="text-base" />
          <StatCard label="Trades" value={String(trades.length)} valueClassName="text-base" />
          <StatCard label="Strategies" value={String(strategies.length)} valueClassName="text-base" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className="h-full hover:border-accent/50 transition-colors">
                  <div className={cn("mb-2", feature.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">{feature.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{feature.description}</div>
                  <div className="flex items-center gap-1 mt-2 text-accent text-[11px] font-medium">
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Recent Trades</h2>
            <Link href="/ledger" className="text-xs text-accent font-medium">
              View all
            </Link>
          </div>
          {recentTrades.length === 0 ? (
            <Card className="py-10 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No trades yet. Your first win starts with a single record.
              </p>
              <Link href="/ledger">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Record a Trade
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((t) => (
                <Link key={t.id} href="/ledger">
                  <Card className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{t.displayName}</div>
                      <div className="text-xs text-muted-foreground">{t.timeframe} · {t.direction} · {t.status}</div>
                    </div>
                    {t.profitLoss !== undefined && (
                      <div className={cn("text-sm font-semibold tabular-nums", t.profitLoss > 0 ? "text-up" : t.profitLoss < 0 ? "text-down" : "text-muted-foreground")}>
                        {t.profitLoss > 0 ? "+" : ""}{formatPrice(t.profitLoss)}
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}