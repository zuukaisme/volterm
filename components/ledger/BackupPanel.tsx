"use client";

import { useState } from "react";
import { Download, Upload, Database, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SimpleModal } from "./SimpleModal";
import { exportBackup, downloadJSON, downloadCSV } from "@/lib/storage/export";
import { validateBackup, importBackup } from "@/lib/storage/import";
import type { LedgerBackup, LedgerSettings } from "@/types/ledger";
import { cn } from "@/lib/utils";

export function BackupPanel({
  settings,
  onRefresh,
}: {
  settings: LedgerSettings | null;
  onRefresh?: () => void;
}) {
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; preview: { trades: number; strategies: number; journals: number } | null } | null>(null);
  const [showConfirmReplace, setShowConfirmReplace] = useState(false);
  const [status, setStatus] = useState<"idle" | "exporting" | "importing" | "done">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleExport = async () => {
    setStatus("exporting");
    setStatusMessage("Exporting backup...");
    try {
      const backup = await exportBackup();
      downloadJSON(backup);
      const { markBackupTime } = await import("@/lib/storage/settings");
      await markBackupTime();
      setStatus("done");
      setStatusMessage("Backup downloaded.");
      onRefresh?.();
    } catch (e) {
      setStatus("idle");
      setStatusMessage("Export failed.");
    }
  };

  const handleExportCSV = async () => {
    const { getAllTrades } = await import("@/lib/storage/trades");
    const trades = await getAllTrades();
    downloadCSV(trades);
  };

  const handleImport = () => {
    if (!importFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const result = validateBackup(data);
        setValidation(result);
        if (result.valid) setShowConfirmReplace(true);
      } catch {
        setValidation({ valid: false, errors: ["Invalid JSON file."], preview: null });
        setShowConfirmReplace(true);
      }
    };
    reader.readAsText(importFile);
  };

  const doImport = async (mode: "merge" | "replace") => {
    if (!importFile || !validation?.valid) return;
    setStatus("importing");
    setStatusMessage("Importing...");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const data = JSON.parse(reader.result as string);
        await importBackup(data, mode);
        setStatus("done");
        setStatusMessage("Import complete.");
        setShowImport(false);
        setShowConfirmReplace(false);
        onRefresh?.();
      };
      reader.readAsText(importFile);
    } catch {
      setStatus("idle");
      setStatusMessage("Import failed.");
    }
  };

  const lastBackup = settings?.lastBackupAt
    ? new Date(settings.lastBackupAt).toLocaleString()
    : "Never";

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Last backup</div>
            <div className="text-sm font-medium">{lastBackup}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={status === "exporting"} className="flex-1">
            <Download className="h-4 w-4" />
            Export Backup
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="flex-1">
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)} className="flex-1">
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Browser storage is not a guaranteed backup. Export regularly to keep your data safe.
        </p>
      </Card>

      <Card>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          About Local Storage
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          All ledger data is stored locally on this device using IndexedDB. No account or backend is
          required. Your data stays private and works offline. Clearing your browser data will remove
          your records — use backups to protect them.
        </p>
      </Card>

      {status === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-up/30 bg-up/10 px-3 py-2 text-xs text-up">
          <AlertTriangle className="h-3.5 w-3.5" />
          {statusMessage}
        </div>
      )}

      <SimpleModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Backup"
        onConfirm={handleImport}
      >
        <p className="text-sm text-muted-foreground mb-3">Choose a backup JSON file to import.</p>
          <input
            type="file"
          accept=".json,application/json"
          onChange={(e) => {
            setImportFile(e.target.files?.[0] ?? null);
            setValidation(null);
          }}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-raised file:px-3 file:py-2 file:text-sm file:text-foreground"
        />
        {validation && !validation.valid && (
          <div className="mt-3 rounded-lg border border-down/30 bg-down/10 p-3 text-xs text-down">
            <div className="font-medium mb-1">Invalid backup file:</div>
            {validation.errors.slice(0, 5).map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        )}
      </SimpleModal>

      <SimpleModal
        open={showConfirmReplace}
        onClose={() => setShowConfirmReplace(false)}
        title="Import Preview"
      >
        {validation?.valid && validation.preview && (
          <>
            <div className="text-sm text-muted-foreground mb-3">
              This backup contains:
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-lg bg-surface-raised p-3 text-center">
                <div className="text-lg font-semibold">{validation.preview.trades}</div>
                <div className="text-[11px] text-muted-foreground">Trades</div>
              </div>
              <div className="rounded-lg bg-surface-raised p-3 text-center">
                <div className="text-lg font-semibold">{validation.preview.strategies}</div>
                <div className="text-[11px] text-muted-foreground">Strategies</div>
              </div>
              <div className="rounded-lg bg-surface-raised p-3 text-center">
                <div className="text-lg font-semibold">{validation.preview.journals}</div>
                <div className="text-[11px] text-muted-foreground">Journals</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Choose how to import. Merging keeps existing records. Replacing will delete all current
              data first.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => doImport("merge")} className="flex-1">
                <RefreshCw className="h-4 w-4" />
                Merge with existing
              </Button>
              <Button onClick={() => doImport("replace")} className="w-full bg-down text-white hover:bg-down/90">
                <RefreshCw className="h-4 w-4" />
                Replace all data
              </Button>
            </div>
          </>
        )}
      </SimpleModal>
    </div>
  );
}