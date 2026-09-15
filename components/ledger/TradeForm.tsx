"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Save,
  X,
  Camera,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import type {
  Trade,
  TradeStatus,
  TradeDirection,
  TradeEmotion,
} from "@/types/ledger";
import type { Strategy } from "@/types/ledger";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: TradeStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "open", label: "Open" },
  { value: "win", label: "Win" },
  { value: "loss", label: "Loss" },
  { value: "breakeven", label: "Breakeven" },
  { value: "cancelled", label: "Cancelled" },
];

const TIMEFRAME_OPTIONS = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1H",
  "4H",
  "1D",
  "4D",
  "1W",
  "1M",
];

const EMOTION_OPTIONS: { value: TradeEmotion; label: string }[] = [
  { value: "calm", label: "Calm" },
  { value: "confident", label: "Confident" },
  { value: "nervous", label: "Nervous" },
  { value: "fearful", label: "Fearful" },
  { value: "fomo", label: "FOMO" },
  { value: "greedy", label: "Greedy" },
  { value: "angry", label: "Angry" },
  { value: "frustrated", label: "Frustrated" },
  { value: "revenge", label: "Revenge" },
  { value: "uncertain", label: "Uncertain" },
];

const SUGGESTED_TAGS = [
  "breakout",
  "pullback",
  "trend",
  "reversal",
  "fomo",
  "revenge",
  "goodsetup",
  "mistake",
];

const STATUS_COLORS: Record<TradeStatus, string> = {
  planned: "bg-muted-foreground/20 text-muted-foreground",
  open: "bg-accent/20 text-accent",
  win: "bg-up/20 text-up",
  loss: "bg-down/20 text-down",
  breakeven: "bg-accent-2/20 text-accent-2",
  cancelled: "bg-muted-foreground/10 text-muted-foreground",
};

export function TradeForm({
  trade,
  strategies,
  prefill,
  onSave,
  onCancel,
}: {
  trade?: Trade;
  strategies: Strategy[];
  prefill?: Partial<Trade>;
  onSave: (data: Partial<Trade>) => void;
  onCancel: () => void;
}) {
  const [symbol, setSymbol] = useState(trade?.symbol ?? prefill?.symbol ?? "");
  const [displayName, setDisplayName] = useState(trade?.displayName ?? prefill?.displayName ?? "");
  const [direction, setDirection] = useState<TradeDirection>(trade?.direction ?? prefill?.direction ?? "long");
  const [status, setStatus] = useState<TradeStatus>(trade?.status ?? prefill?.status ?? "planned");
  const [timeframe, setTimeframe] = useState(trade?.timeframe ?? prefill?.timeframe ?? "1H");
  const [entryPrice, setEntryPrice] = useState(trade?.entryPrice?.toString() ?? prefill?.entryPrice?.toString() ?? "");
  const [exitPrice, setExitPrice] = useState(trade?.exitPrice?.toString() ?? prefill?.exitPrice?.toString() ?? "");
  const [stopLoss, setStopLoss] = useState(trade?.stopLoss?.toString() ?? prefill?.stopLoss?.toString() ?? "");
  const [takeProfit, setTakeProfit] = useState(trade?.takeProfit?.toString() ?? prefill?.takeProfit?.toString() ?? "");
  const [positionSize, setPositionSize] = useState(trade?.positionSize?.toString() ?? prefill?.positionSize?.toString() ?? "");
  const [riskAmount, setRiskAmount] = useState(trade?.riskAmount?.toString() ?? prefill?.riskAmount?.toString() ?? "");
  const [strategyId, setStrategyId] = useState(trade?.strategyId ?? prefill?.strategyId ?? "");
  const [setup, setSetup] = useState(trade?.setup ?? prefill?.setup ?? "");
  const [entryReason, setEntryReason] = useState(trade?.entryReason ?? prefill?.entryReason ?? "");
  const [exitReason, setExitReason] = useState(trade?.exitReason ?? prefill?.exitReason ?? "");
  const [notes, setNotes] = useState(trade?.notes ?? prefill?.notes ?? "");
  const [tags, setTags] = useState<string[]>(trade?.tags ?? prefill?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [screenshot, setScreenshot] = useState(trade?.screenshot ?? prefill?.screenshot ?? "");
  const [emotion, setEmotion] = useState<TradeEmotion | "">(trade?.emotion ?? prefill?.emotion ?? "");
  const [confidence, setConfidence] = useState(trade?.confidence?.toString() ?? prefill?.confidence?.toString() ?? "");
  const [discipline, setDiscipline] = useState(trade?.discipline?.toString() ?? prefill?.discipline?.toString() ?? "");
  const [isPlanned, setIsPlanned] = useState(trade?.isPlanned ?? prefill?.isPlanned ?? status === "planned");
  const [followedStrategy, setFollowedStrategy] = useState(trade?.followedStrategy ?? prefill?.followedStrategy);

  const selectedStrategy = strategies.find((s) => s.id === strategyId);

  const handleAddTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleScreenshot = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setScreenshot(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  }, []);

  const handleSubmit = () => {
    const parsed: Partial<Trade> = {
      symbol,
      displayName: displayName || symbol,
      direction,
      status,
      timeframe,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      positionSize: positionSize ? parseFloat(positionSize) : undefined,
      riskAmount: riskAmount ? parseFloat(riskAmount) : undefined,
      strategyId: strategyId || undefined,
      strategyName: selectedStrategy?.name,
      setup: setup || undefined,
      entryReason: entryReason || undefined,
      exitReason: exitReason || undefined,
      notes: notes || undefined,
      tags: tags.length > 0 ? tags : undefined,
      screenshot: screenshot || undefined,
      emotion: emotion || undefined,
      confidence: confidence ? parseInt(confidence) : undefined,
      discipline: discipline ? parseInt(discipline) : undefined,
      isPlanned,
      followedStrategy,
      openedAt: trade?.openedAt ?? (status === "open" ? Date.now() : undefined),
      closedAt: (status === "win" || status === "loss" || status === "breakeven") && !trade?.closedAt
        ? Date.now()
        : trade?.closedAt,
    };
    onSave(parsed);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDirection("long")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border-2 font-medium text-sm transition-colors",
              direction === "long"
                ? "border-up bg-up/10 text-up"
                : "border-border text-muted-foreground"
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
            Long
          </button>
          <button
            onClick={() => setDirection("short")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border-2 font-medium text-sm transition-colors",
              direction === "short"
                ? "border-down bg-down/10 text-down"
                : "border-border text-muted-foreground"
            )}
          >
            <ArrowDownRight className="h-4 w-4" />
            Short
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setStatus(opt.value);
                if (opt.value === "planned") setIsPlanned(true);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                status === opt.value
                  ? STATUS_COLORS[opt.value]
                  : "border-border text-muted-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Instrument</label>
            <Input
              placeholder="e.g. Volatility 75 Index"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (!symbol) setSymbol(e.target.value);
              }}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Symbol (internal)</label>
            <Input
              placeholder="e.g. R_75"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Timeframe</label>
            <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              {TIMEFRAME_OPTIONS.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Entry Price</label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Exit Price</label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Stop Loss</label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Take Profit</label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Position Size</label>
            <Input
              type="number"
              step="any"
              placeholder="0"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Risk Amount</label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={riskAmount}
              onChange={(e) => setRiskAmount(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Strategy</label>
          <Select value={strategyId} onChange={(e) => setStrategyId(e.target.value)}>
            <option value="">None</option>
            {strategies.filter((s) => !s.archived).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Setup</label>
          <Textarea
            placeholder="What did you see before entering?"
            value={setup}
            onChange={(e) => setSetup(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Entry Reason</label>
          <Textarea
            placeholder="Why did you take this trade?"
            value={entryReason}
            onChange={(e) => setEntryReason(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Exit Reason</label>
          <Textarea
            placeholder="Why did you close this trade?"
            value={exitReason}
            onChange={(e) => setExitReason(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <Textarea
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} className="bg-accent/20 text-accent">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="ml-1 text-accent/60 hover:text-accent">✕</button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAddTag(tagInput); }
              }}
            />
            <Button size="sm" onClick={() => handleAddTag(tagInput)} disabled={!tagInput.trim()}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                className="px-2 py-0.5 rounded text-[11px] border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Screenshot</label>
          {screenshot ? (
            <div className="relative">
              <img src={screenshot} alt="Screenshot" className="w-full rounded-lg border border-border" />
              <button
                onClick={() => setScreenshot("")}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-surface/80 text-down hover:bg-surface"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleScreenshot}
              className="w-full flex items-center justify-center gap-2 h-20 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-accent/50 hover:text-foreground transition-colors"
            >
              <Camera className="h-4 w-4" />
              Attach Screenshot
            </button>
          )}
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Psychology</h4>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Emotion</label>
            <Select value={emotion} onChange={(e) => setEmotion(e.target.value as TradeEmotion)}>
              <option value="">Select...</option>
              {EMOTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Confidence (1-5)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setConfidence(confidence === String(n) ? "" : String(n))}
                    className={cn(
                      "flex-1 h-10 rounded-lg border text-sm font-medium transition-colors",
                      confidence === String(n)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Discipline (1-5)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDiscipline(discipline === String(n) ? "" : String(n))}
                    className={cn(
                      "flex-1 h-10 rounded-lg border text-sm font-medium transition-colors",
                      discipline === String(n)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPlanned}
                onChange={(e) => setIsPlanned(e.target.checked)}
                className="rounded border-border"
              />
              Planned trade
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={followedStrategy === true}
                onChange={(e) => setFollowedStrategy(e.target.checked ? true : undefined)}
                className="rounded border-border"
              />
              Followed strategy
            </label>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-3 p-4 border-t border-border bg-surface">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          <Save className="h-4 w-4" />
          {trade ? "Update" : "Save"}
        </Button>
      </div>
    </div>
  );
}
