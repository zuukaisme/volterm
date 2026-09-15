"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useJournals, useTrades } from "@/hooks/useLedger";
import { JournalForm, JournalList } from "@/components/ledger/Journal";
import { SimpleModal } from "@/components/ledger/SimpleModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { DailyJournal } from "@/types/ledger";
import { cn } from "@/lib/utils";

export default function JournalPage() {
  const { items: journals, add, update, remove } = useJournals();
  const { items: trades } = useTrades();

  const [view, setView] = useState<"list" | "day">("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DailyJournal | undefined>(undefined);

  const pnlByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trades) {
      const date = new Date(t.closedAt ?? t.createdAt).toISOString().slice(0, 10);
      map.set(date, (map.get(date) ?? 0) + (t.profitLoss ?? 0));
    }
    return map;
  }, [trades]);

  const tradesByDate = useMemo(() => {
    const map = new Map<string, typeof trades>();
    for (const t of trades) {
      const date = new Date(t.closedAt ?? t.createdAt).toISOString().slice(0, 10);
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(t);
    }
    return map;
  }, [trades]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return { days, label: new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" }) };
  }, []);

  const handleSave = async (data: Partial<DailyJournal>) => {
    if (editing) await update(editing.id, data);
    else {
      const date = selectedDate ?? new Date().toISOString().slice(0, 10);
      await add({ ...data, date });
    }
    setShowForm(false);
    setEditing(undefined);
  };

  const existingForDate = (date: string) => journals.find((j) => j.date === date);

  return (
    <div className="flex flex-col h-dvh md:pl-[200px] pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 shrink-0">
        {view === "day" && (
          <button
            onClick={() => setView("list")}
            className="p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-sm font-semibold">Journal</h1>
      </div>

      {view === "list" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">{calendarDays.label}</div>
                <div className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground py-1">{d}</div>
                ))}
                {calendarDays.days.map((date, i) => {
                  if (!date) return <div key={`e-${i}`} />;
                  const pnl = pnlByDate.get(date) ?? 0;
                  const hasJournal = existingForDate(date) !== undefined;
                  const hasTrades = tradesByDate.has(date);
                  return (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
                        setView("day");
                      }}
                      className={cn(
                        "aspect-square rounded-lg border text-xs flex flex-col items-center justify-center transition-colors hover:border-accent",
                        hasTrades || hasJournal ? "cursor-pointer" : "cursor-default border-transparent",
                        date === new Date().toISOString().slice(0, 10) && "border-accent"
                      )}
                    >
                      <span className="text-xs">{date.slice(8)}</span>
                      <span className="flex items-center gap-0.5 mt-0.5">
                        {hasTrades && (
                          <span className={cn("h-1.5 w-1.5 rounded-full", pnl > 0 ? "bg-up" : pnl < 0 ? "bg-down" : "bg-muted-foreground/40")} />
                        )}
                        {hasJournal && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <JournalList
            journals={journals}
            trades={trades}
            onNew={() => {
              setSelectedDate(new Date().toISOString().slice(0, 10));
              setEditing(undefined);
              setShowForm(true);
            }}
            onEdit={(journal) => {
              setEditing(journal);
              setShowForm(true);
            }}
            onDelete={remove}
          />
        </div>
      )}

      {view === "day" && selectedDate && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
            <Button
              size="sm"
              onClick={() => {
                setEditing(existingForDate(selectedDate));
                setShowForm(true);
              }}
            >
              {existingForDate(selectedDate) ? "Edit" : "New Entry"}
            </Button>
          </div>

          <div className="space-y-3">
            {tradesByDate.get(selectedDate)?.map((t) => (
              <Card key={t.id}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{t.displayName}</div>
                  <div className={cn("text-sm font-semibold", t.profitLoss === undefined ? "text-muted-foreground" : t.profitLoss > 0 ? "text-up" : t.profitLoss < 0 ? "text-down" : "")}>
                    {t.profitLoss !== undefined ? `${t.profitLoss > 0 ? "+" : ""}${t.profitLoss.toFixed(2)}` : t.status}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t.timeframe} · {t.direction} · {t.status}</div>
              </Card>
            ))}

            {(!tradesByDate.get(selectedDate) || tradesByDate.get(selectedDate)!.length === 0) && (
              <Card className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No trades on this day.</p>
              </Card>
            )}
          </div>

          {existingForDate(selectedDate) && (
            <Card>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Journal Entry</h3>
              {(() => {
                const j = existingForDate(selectedDate)!;
                return (
                  <div className="space-y-3 text-sm">
                    {j.marketOverview && <p className="whitespace-pre-wrap"><span className="font-medium">Overview:</span> {j.marketOverview}</p>}
                    {j.plan && <p className="whitespace-pre-wrap"><span className="font-medium">Plan:</span> {j.plan}</p>}
                    {j.goals && <p className="whitespace-pre-wrap"><span className="font-medium">Goals:</span> {j.goals}</p>}
                    {j.lessons && <p className="whitespace-pre-wrap"><span className="font-medium">Lessons:</span> {j.lessons}</p>}
                    {j.mistakes && <p className="whitespace-pre-wrap"><span className="font-medium">Mistakes:</span> {j.mistakes}</p>}
                    {j.mood && <p className="whitespace-pre-wrap"><span className="font-medium">Mood:</span> {j.mood}</p>}
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} size="lg" title={editing ? "Edit Journal Entry" : "New Journal Entry"}>
        <JournalForm
          journal={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(undefined); }}
        />
      </Modal>
    </div>
  );
}