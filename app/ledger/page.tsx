"use client";

import { useState } from "react";
import { ArrowLeft, BarChart3, Calendar, Calculator, List } from "lucide-react";
import { useTrades, useStrategies } from "@/hooks/useLedger";
import { TradeList } from "@/components/ledger/TradeList";
import { TradeDetail } from "@/components/ledger/TradeDetail";
import { TradeForm } from "@/components/ledger/TradeForm";
import { LedgerDashboard } from "@/components/ledger/LedgerDashboard";
import { TradingCalendar } from "@/components/ledger/TradingCalendar";
import { RiskCalculator } from "@/components/ledger/RiskCalculator";
import { Modal } from "@/components/ui/Modal";
import type { Trade } from "@/types/ledger";
import { cn } from "@/lib/utils";

type View = "list" | "detail" | "form" | "dashboard" | "calendar" | "risk";

export default function LedgerPage() {
  const { items: trades, refresh, add, update, remove, duplicate } = useTrades();
  const { items: strategies } = useStrategies();

  const [view, setView] = useState<View>("list");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [showTradeForm, setShowTradeForm] = useState(false);

  const handleSelectTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setView("detail");
  };

  const handleNewTrade = () => {
    setEditingTrade(undefined);
    setShowTradeForm(true);
  };

  const handleEditTrade = () => {
    if (selectedTrade) {
      setEditingTrade(selectedTrade);
      setShowTradeForm(true);
    }
  };

  const handleDuplicate = async () => {
    if (selectedTrade) {
      await duplicate(selectedTrade.id);
      setView("list");
      setSelectedTrade(null);
    }
  };

  const handleDelete = async () => {
    if (selectedTrade) {
      await remove(selectedTrade.id);
      setView("list");
      setSelectedTrade(null);
    }
  };

  const handleSave = async (data: Partial<Trade>) => {
    if (editingTrade) {
      await update(editingTrade.id, data);
    } else {
      await add(data);
    }
    setShowTradeForm(false);
    setEditingTrade(undefined);
  };

  const topTabs = [
    { key: "list", label: "Trades", icon: List },
    { key: "dashboard", label: "Stats", icon: BarChart3 },
    { key: "calendar", label: "Calendar", icon: Calendar },
    { key: "risk", label: "Risk", icon: Calculator },
  ] as const;

  return (
    <div className="flex flex-col h-dvh md:pl-[200px] pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 shrink-0">
        {view !== "list" && (
          <button
            onClick={() => { setView("list"); setSelectedTrade(null); }}
            className="p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-sm font-semibold">Trading Ledger</h1>
      </div>

      {view === "list" && (
        <div className="flex items-center gap-1 border-b border-border px-4 py-1 overflow-x-auto no-scrollbar">
          {topTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                view === key
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {view === "list" && (
          <TradeList trades={trades} onSelect={handleSelectTrade} onNewTrade={() => handleNewTrade()} />
        )}
        {view === "detail" && selectedTrade && (
          <TradeDetail
            trade={selectedTrade}
            onEdit={handleEditTrade}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onViewChart={() => { window.location.href = `/chart?symbol=${selectedTrade.symbol}`; }}
          />
        )}
        {view === "dashboard" && <LedgerDashboard trades={trades} strategies={strategies} />}
        {view === "calendar" && <TradingCalendar trades={trades} onSelectDay={() => setView("list")} />}
        {view === "risk" && <RiskCalculator />}
      </div>

      <Modal
        open={showTradeForm}
        onClose={() => { setShowTradeForm(false); setEditingTrade(undefined); }}
        size="full"
        noPadding
        title={editingTrade ? "Edit Trade" : "New Trade"}
      >
        <TradeForm
          trade={editingTrade}
          strategies={strategies}
          onSave={handleSave}
          onCancel={() => { setShowTradeForm(false); setEditingTrade(undefined); }}
        />
      </Modal>
    </div>
  );
}