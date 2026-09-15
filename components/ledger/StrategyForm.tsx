"use client";

import { useState } from "react";
import { Plus, Save, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import type { Strategy } from "@/types/ledger";

const TIMEFRAME_OPTIONS = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"];

export function StrategyForm({
  strategy,
  onSave,
  onCancel,
}: {
  strategy?: Strategy;
  onSave: (data: Partial<Strategy>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(strategy?.name ?? "");
  const [description, setDescription] = useState(strategy?.description ?? "");
  const [entryRules, setEntryRules] = useState<string[]>(strategy?.entryRules ?? []);
  const [confirmationRules, setConfirmationRules] = useState<string[]>(strategy?.confirmationRules ?? []);
  const [exitRules, setExitRules] = useState<string[]>(strategy?.exitRules ?? []);
  const [preferredTimeframes, setPreferredTimeframes] = useState<string[]>(strategy?.preferredTimeframes ?? []);
  const [preferredSymbols, setPreferredSymbols] = useState<string[]>(strategy?.preferredSymbols ?? []);
  const [notes, setNotes] = useState(strategy?.notes ?? "");
  const [newRule, setNewRule] = useState("");
  const [activeRuleList, setActiveRuleList] = useState<"entry" | "confirmation" | "exit">("entry");

  const rules = activeRuleList === "entry" ? entryRules : activeRuleList === "confirmation" ? confirmationRules : exitRules;
  const setRules = activeRuleList === "entry" ? setEntryRules : activeRuleList === "confirmation" ? setConfirmationRules : setExitRules;

  const handleAddRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule("");
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const toggleTimeframe = (tf: string) => {
    setPreferredTimeframes((prev) =>
      prev.includes(tf) ? prev.filter((t) => t !== tf) : [...prev, tf]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      entryRules: entryRules.length > 0 ? entryRules : undefined,
      confirmationRules: confirmationRules.length > 0 ? confirmationRules : undefined,
      exitRules: exitRules.length > 0 ? exitRules : undefined,
      preferredTimeframes: preferredTimeframes.length > 0 ? preferredTimeframes : undefined,
      preferredSymbols: preferredSymbols.length > 0 ? preferredSymbols : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Strategy Name *</label>
          <Input
            placeholder="e.g. Breakout Pullback"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <Textarea
            placeholder="What is this strategy about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <div className="flex gap-1 mb-2">
            {(["entry", "confirmation", "exit"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveRuleList(type)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeRuleList === type
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} ({type === "entry" ? entryRules.length : type === "confirmation" ? confirmationRules.length : exitRules.length})
              </button>
            ))}
          </div>

          <div className="space-y-1.5 mb-2">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-surface-raised rounded-lg px-3 py-2">
                <span className="text-muted-foreground text-xs shrink-0">{i + 1}.</span>
                <span className="flex-1">{rule}</span>
                <button onClick={() => handleRemoveRule(i)} className="text-muted-foreground hover:text-down shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add a rule..."
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRule(); } }}
            />
            <Button size="sm" onClick={handleAddRule} disabled={!newRule.trim()}>
              Add
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Preferred Timeframes</label>
          <div className="flex flex-wrap gap-1.5">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf}
                onClick={() => toggleTimeframe(tf)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  preferredTimeframes.includes(tf)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Preferred Symbols</label>
          <Input
            placeholder="Comma separated: R_75, BOOM1000..."
            value={preferredSymbols.join(", ")}
            onChange={(e) =>
              setPreferredSymbols(
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <Textarea
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-3 p-4 border-t border-border bg-surface">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim()} className="flex-1">
          <Save className="h-4 w-4" />
          {strategy ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}
