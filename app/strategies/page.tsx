"use client";

import { useState } from "react";
import { Plus, ArrowLeft, BarChart2 } from "lucide-react";
import { useStrategies, useTrades } from "@/hooks/useLedger";
import { StrategyCard } from "@/components/ledger/StrategyCard";
import { StrategyForm } from "@/components/ledger/StrategyForm";
import { StrategyPerformance } from "@/components/ledger/StrategyPerformance";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Strategy } from "@/types/ledger";

export default function StrategiesPage() {
  const { items: strategies, add, update, remove, duplicate, archive, unarchive, refresh } = useStrategies();
  const { items: trades } = useTrades();

  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Strategy | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [viewingStats, setViewingStats] = useState<Strategy | null>(null);

  const visible = strategies.filter((s) => (showArchived ? s.archived : !s.archived));

  const tradeCountFor = (id: string) => trades.filter((t) => t.strategyId === id).length;
  const tradesFor = (id: string) => trades.filter((t) => t.strategyId === id);

  const handleSave = async (data: Partial<Strategy>) => {
    if (editing) await update(editing.id, data);
    else await add(data);
    setShowForm(false);
    setEditing(undefined);
    await refresh();
  };

  if (viewingStats) {
    return (
      <div className="flex flex-col h-dvh md:pl-[200px] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 shrink-0">
          <button
            onClick={() => setViewingStats(null)}
            className="p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold">{viewingStats.name}</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <StrategyPerformance strategy={viewingStats} trades={tradesFor(viewingStats.id)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh md:pl-[200px] pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 shrink-0">
        <h1 className="text-sm font-semibold">Strategies</h1>
        <Button size="sm" onClick={() => { setEditing(undefined); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-4 py-1">
        {["active", "archived"].map((key) => (
          <button
            key={key}
            onClick={() => setShowArchived(key === "archived")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              showArchived === (key === "archived")
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {key === "active" ? "Active" : "Archived"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <EmptyState
            icon={<BarChart2 className="h-8 w-8" />}
            title={showArchived ? "No archived strategies" : "No strategies yet"}
            description="Create strategies to organize and track performance of your trading approaches."
            action={
              !showArchived && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Create Strategy
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((strategy) => (
              <div key={strategy.id} className="relative group cursor-pointer" onClick={() => setViewingStats(strategy)}>
                <StrategyCard
                  strategy={strategy}
                  tradeCount={tradeCountFor(strategy.id)}
                  onEdit={() => { setEditing(strategy); setShowForm(true); }}
                  onDuplicate={async () => { await duplicate(strategy.id); await refresh(); }}
                  onArchive={async () => { strategy.archived ? await unarchive(strategy.id) : await archive(strategy.id); }}
                  onDelete={async () => { await remove(strategy.id); }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(undefined); }}
        size="full"
        noPadding
        title={editing ? "Edit Strategy" : "New Strategy"}
      >
        <StrategyForm
          strategy={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(undefined); }}
        />
      </Modal>
    </div>
  );
}