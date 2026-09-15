"use client";

import { useState } from "react";
import { Save, Trash2, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { SimpleModal } from "./SimpleModal";
import type { DailyJournal, Trade } from "@/types/ledger";

export function JournalForm({
  journal,
  onSave,
  onCancel,
}: {
  journal?: DailyJournal;
  onSave: (data: Partial<DailyJournal>) => void;
  onCancel: () => void;
}) {
  const [marketOverview, setMarketOverview] = useState(journal?.marketOverview ?? "");
  const [plan, setPlan] = useState(journal?.plan ?? "");
  const [goals, setGoals] = useState(journal?.goals ?? "");
  const [lessons, setLessons] = useState(journal?.lessons ?? "");
  const [mistakes, setMistakes] = useState(journal?.mistakes ?? "");
  const [mood, setMood] = useState(journal?.mood ?? "");

  const handleSubmit = () => {
    onSave({
      marketOverview: marketOverview.trim() || undefined,
      plan: plan.trim() || undefined,
      goals: goals.trim() || undefined,
      lessons: lessons.trim() || undefined,
      mistakes: mistakes.trim() || undefined,
      mood: mood.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Market Overview</label>
        <Textarea
          placeholder="How did the market move today?"
          value={marketOverview}
          onChange={(e) => setMarketOverview(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Plan</label>
        <Textarea
          placeholder="What was your plan for today?"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Goals</label>
        <Textarea
          placeholder="What did you want to achieve?"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Lessons</label>
        <Textarea
          placeholder="What did you learn today?"
          value={lessons}
          onChange={(e) => setLessons(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Mistakes</label>
        <Textarea
          placeholder="Any mistakes to note?"
          value={mistakes}
          onChange={(e) => setMistakes(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Mood</label>
        <Input
          placeholder="How are you feeling?"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} className="flex-1">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

export function JournalList({
  journals,
  trades,
  onNew,
  onEdit,
  onDelete,
}: {
  journals: DailyJournal[];
  trades: Trade[];
  onNew: () => void;
  onEdit: (journal: DailyJournal) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const pnlByDate = new Map<string, number>();
  for (const t of trades) {
    const date = new Date(t.closedAt ?? t.createdAt).toISOString().slice(0, 10);
    pnlByDate.set(date, (pnlByDate.get(date) ?? 0) + (t.profitLoss ?? 0));
  }

  return (
    <div className="p-4 space-y-3">
      <Button onClick={onNew} className="w-full">
        <Plus className="h-4 w-4" />
        New Journal Entry
      </Button>

      {journals.length === 0 && (
        <Card className="py-10 text-center">
          <p className="text-sm text-muted-foreground">No journal entries yet. Start tracking your daily trading process.</p>
        </Card>
      )}

      {journals.map((journal) => {
        const pnl = pnlByDate.get(journal.date) ?? 0;
        return (
          <Card key={journal.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">
                {journal.date}
                {pnl !== 0 && (
                  <span className={`ml-2 text-xs font-medium ${pnl > 0 ? "text-up" : "text-down"}`}>
                    P&L: {pnl > 0 ? "+" : ""}{pnl.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(journal)} className="p-1.5 text-muted-foreground hover:text-foreground">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setConfirmDelete(journal.id)} className="p-1.5 text-muted-foreground hover:text-down">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {journal.marketOverview && <p className="text-sm text-muted-foreground line-clamp-2">{journal.marketOverview}</p>}
            {journal.plan && <p className="text-sm text-muted-foreground line-clamp-2 mt-1"><span className="text-foreground font-medium">Plan:</span> {journal.plan}</p>}
            {journal.lessons && <p className="text-sm text-muted-foreground line-clamp-2 mt-1"><span className="text-foreground font-medium">Lessons:</span> {journal.lessons}</p>}
          </Card>
        );
      })}

      <SimpleModal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete Journal Entry"
        onConfirm={() => {
          if (confirmDelete) onDelete(confirmDelete);
          setConfirmDelete(null);
        }}
      >
        <p className="text-sm text-muted-foreground">This will permanently delete this journal entry.</p>
      </SimpleModal>
    </div>
  );
}