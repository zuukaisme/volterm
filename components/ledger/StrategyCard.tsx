"use client";

import { useState } from "react";
import { MoreVertical, Edit3, Copy, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type { Strategy } from "@/types/ledger";

export function StrategyCard({
  strategy,
  tradeCount,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  strategy: Strategy;
  tradeCount: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <Card className="relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{strategy.name}</h3>
            {strategy.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{strategy.description}</p>
            )}
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-surface shadow-xl py-1">
                  <button
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-raised"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { onDuplicate(); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-raised"
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <button
                    onClick={() => { onArchive(); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-raised"
                  >
                    {strategy.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    {strategy.archived ? "Unarchive" : "Archive"}
                  </button>
                  <button
                    onClick={() => { setConfirmDelete(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-down hover:bg-surface-raised"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{tradeCount} trades</span>
        </div>

        {strategy.entryRules && strategy.entryRules.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {strategy.entryRules.slice(0, 3).map((rule, i) => (
              <Badge key={i} className="text-[10px]">{rule}</Badge>
            ))}
            {strategy.entryRules.length > 3 && (
              <Badge className="text-[10px]">+{strategy.entryRules.length - 3}</Badge>
            )}
          </div>
        )}

        {strategy.preferredTimeframes && strategy.preferredTimeframes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {strategy.preferredTimeframes.map((tf) => (
              <span key={tf} className="text-[10px] text-accent font-medium">{tf}</span>
            ))}
          </div>
        )}
      </Card>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} size="sm" title="Delete Strategy">
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete &ldquo;{strategy.name}&rdquo;? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onDelete} className="flex-1 bg-down text-white hover:bg-down/90">
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
