"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Copy,
  Trash2,
  ExternalLink,
  Clock,
  Target,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type { Trade } from "@/types/ledger";
import { cn, formatPrice } from "@/lib/utils";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  win: "bg-up/15 text-up",
  loss: "bg-down/15 text-down",
  breakeven: "bg-accent-2/15 text-accent-2",
  planned: "bg-muted-foreground/15 text-muted-foreground",
  open: "bg-accent/15 text-accent",
  cancelled: "bg-muted-foreground/10 text-muted-foreground",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

export function TradeDetail({
  trade,
  onEdit,
  onDuplicate,
  onDelete,
  onViewChart,
}: {
  trade: Trade;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onViewChart?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isLong = trade.direction === "long";

  const handleDelete = () => {
    onDelete();
    setConfirmDelete(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  isLong ? "bg-up/10 text-up" : "bg-down/10 text-down"
                )}
              >
                {isLong ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              </div>
              <div>
                <h2 className="text-base font-semibold">{trade.displayName}</h2>
                <span className="text-xs text-muted-foreground">{trade.symbol} · {trade.timeframe}</span>
              </div>
            </div>
          </div>
          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLORS[trade.status])}>
            {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
          </span>
        </div>

        {trade.profitLoss !== undefined && (
          <Card className="text-center py-4">
            <div className="text-xs text-muted-foreground mb-1">Profit / Loss</div>
            <div
              className={cn(
                "text-2xl font-bold tabular-nums",
                trade.profitLoss > 0 ? "text-up" : trade.profitLoss < 0 ? "text-down" : ""
              )}
            >
              {trade.profitLoss > 0 ? "+" : ""}
              {formatPrice(trade.profitLoss)}
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Trade Details</h3>
          <DetailRow label="Direction" value={<span className={cn("font-medium", isLong ? "text-up" : "text-down")}>{isLong ? "Long" : "Short"}</span>} />
          <DetailRow label="Entry Price" value={trade.entryPrice !== undefined ? formatPrice(trade.entryPrice) : null} />
          <DetailRow label="Exit Price" value={trade.exitPrice !== undefined ? formatPrice(trade.exitPrice) : null} />
          <DetailRow
            label="Stop Loss"
            value={
              trade.stopLoss !== undefined ? (
                <span className="flex items-center gap-1 text-down">
                  <Shield className="h-3 w-3" />
                  {formatPrice(trade.stopLoss)}
                </span>
              ) : null
            }
          />
          <DetailRow
            label="Take Profit"
            value={
              trade.takeProfit !== undefined ? (
                <span className="flex items-center gap-1 text-up">
                  <Target className="h-3 w-3" />
                  {formatPrice(trade.takeProfit)}
                </span>
              ) : null
            }
          />
          <DetailRow label="Position Size" value={trade.positionSize !== undefined ? String(trade.positionSize) : null} />
          <DetailRow label="Risk Amount" value={trade.riskAmount !== undefined ? formatPrice(trade.riskAmount) : null} />
          <DetailRow label="Risk/Reward" value={trade.riskReward !== undefined ? `${trade.riskReward.toFixed(2)}R` : null} />
          <DetailRow label="Strategy" value={trade.strategyName ?? null} />
        </Card>

        {(trade.setup || trade.entryReason || trade.exitReason || trade.notes) && (
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Journal</h3>
            {trade.setup && (
              <div className="mb-3">
                <div className="text-[11px] text-muted-foreground mb-1">Setup</div>
                <p className="text-sm whitespace-pre-wrap">{trade.setup}</p>
              </div>
            )}
            {trade.entryReason && (
              <div className="mb-3">
                <div className="text-[11px] text-muted-foreground mb-1">Entry Reason</div>
                <p className="text-sm whitespace-pre-wrap">{trade.entryReason}</p>
              </div>
            )}
            {trade.exitReason && (
              <div className="mb-3">
                <div className="text-[11px] text-muted-foreground mb-1">Exit Reason</div>
                <p className="text-sm whitespace-pre-wrap">{trade.exitReason}</p>
              </div>
            )}
            {trade.notes && (
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">Notes</div>
                <p className="text-sm whitespace-pre-wrap">{trade.notes}</p>
              </div>
            )}
          </Card>
        )}

        {(trade.emotion || trade.confidence || trade.discipline || trade.isPlanned !== undefined || trade.followedStrategy !== undefined) && (
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Psychology</h3>
            <DetailRow label="Emotion" value={trade.emotion ? trade.emotion.charAt(0).toUpperCase() + trade.emotion.slice(1) : null} />
            <DetailRow label="Confidence" value={trade.confidence !== undefined ? `${trade.confidence}/5` : null} />
            <DetailRow label="Discipline" value={trade.discipline !== undefined ? `${trade.discipline}/5` : null} />
            <DetailRow label="Planned" value={trade.isPlanned ? "Yes" : trade.isPlanned === false ? "No" : null} />
            <DetailRow label="Followed Strategy" value={trade.followedStrategy === true ? "Yes" : trade.followedStrategy === false ? "No" : null} />
          </Card>
        )}

        {trade.tags && trade.tags.length > 0 && (
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {trade.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </Card>
        )}

        {trade.screenshot && (
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Screenshot</h3>
            <img
              src={trade.screenshot}
              alt="Trade screenshot"
              className="w-full rounded-lg border border-border"
            />
          </Card>
        )}

        <Card>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Timestamps</h3>
          <DetailRow
            label="Created"
            value={new Date(trade.createdAt).toLocaleString()}
          />
          {trade.openedAt && (
            <DetailRow
              label="Opened"
              value={
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(trade.openedAt).toLocaleString()}
                </span>
              }
            />
          )}
          {trade.closedAt && (
            <DetailRow
              label="Closed"
              value={
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(trade.closedAt).toLocaleString()}
                </span>
              }
            />
          )}
          <DetailRow label="Updated" value={new Date(trade.updatedAt).toLocaleString()} />
        </Card>
      </div>

      <div className="sticky bottom-0 flex gap-2 p-4 border-t border-border bg-surface">
        <Button variant="outline" onClick={onEdit} className="flex-1">
          <Edit3 className="h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" onClick={onDuplicate} className="flex-1">
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
        {onViewChart && (
          <Button variant="outline" onClick={onViewChart} className="flex-1">
            <ExternalLink className="h-4 w-4" />
            Chart
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => setConfirmDelete(true)}
          className="text-down hover:text-down"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} size="sm" title="Delete Trade">
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete this trade? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleDelete} className="flex-1 bg-down text-white hover:bg-down/90">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
