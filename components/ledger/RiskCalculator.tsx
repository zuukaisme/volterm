"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { TradeDirection } from "@/types/ledger";

export function RiskCalculator() {
  const [accountBalance, setAccountBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [direction, setDirection] = useState<TradeDirection>("long");

  const result = useMemo(() => {
    const balance = parseFloat(accountBalance);
    const riskPct = parseFloat(riskPercent);
    const entryPrice = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);

    if (
      Number.isNaN(balance) ||
      Number.isNaN(riskPct) ||
      Number.isNaN(entryPrice) ||
      Number.isNaN(sl) ||
      Number.isNaN(tp)
    ) {
      return null;
    }

    const riskAmount = balance * (riskPct / 100);
    const stopDistance = direction === "long" ? entryPrice - sl : sl - entryPrice;
    const tpDistance = direction === "long" ? tp - entryPrice : entryPrice - tp;

    if (stopDistance <= 0 || tpDistance <= 0) return null;

    const positionSize = riskAmount / stopDistance;
    const potentialReward = positionSize * tpDistance;
    const riskReward = tpDistance / stopDistance;

    return {
      riskAmount,
      positionSize,
      potentialReward,
      riskReward,
    };
  }, [accountBalance, riskPercent, entry, stopLoss, takeProfit, direction]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex gap-2">
          <button
            onClick={() => setDirection("long")}
            className={cn(
              "flex-1 h-11 rounded-lg border-2 text-sm font-medium transition-colors",
              direction === "long"
                ? "border-up bg-up/10 text-up"
                : "border-border text-muted-foreground"
            )}
          >
            Long
          </button>
          <button
            onClick={() => setDirection("short")}
            className={cn(
              "flex-1 h-11 rounded-lg border-2 text-sm font-medium transition-colors",
              direction === "short"
                ? "border-down bg-down/10 text-down"
                : "border-border text-muted-foreground"
            )}
          >
            Short
          </button>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Account Balance</label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Risk %</label>
            <Input
              type="number"
              step="0.1"
              placeholder="1.0"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Entry</label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
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
        </div>
      </Card>

      {result ? (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Risk Amount" value={result.riskAmount.toFixed(2)} valueClassName="text-base text-down" />
          <StatCard label="Position Size" value={result.positionSize.toFixed(2)} valueClassName="text-base" />
          <StatCard label="Potential Reward" value={result.potentialReward.toFixed(2)} valueClassName="text-base text-up" />
          <StatCard label="Risk/Reward" value={`1 : ${result.riskReward.toFixed(2)}`} valueClassName="text-base" />
        </div>
      ) : (
        <Card className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Enter values above to calculate position size and risk/reward.</p>
        </Card>
      )}
    </div>
  );
}