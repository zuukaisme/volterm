"use client";

import { useState } from "react";
import {
  Moon,
  Sun,
  Bell,
  Shield,
  Download,
  Image,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BackupPanel } from "@/components/ledger/BackupPanel";
import { useLedgerSettings } from "@/hooks/useLedger";
import { saveWatchlist } from "@/lib/storage/watchlist";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { settings, update, refresh } = useLedgerSettings();
  const [balance, setBalance] = useState(settings?.defaultAccountBalance?.toString() ?? "");
  const [riskPct, setRiskPct] = useState(settings?.defaultRiskPercent?.toString() ?? "");
  const [currency, setCurrency] = useState(settings?.currency ?? "");
  const [savedNote, setSavedNote] = useState(false);

  return (
    <div className="flex flex-col h-dvh md:pl-[200px] pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0 max-w-none mx-0 md:mx-6 w-auto overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 shrink-0">
        <h1 className="text-sm font-semibold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
        <Card>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Moon className="h-3.5 w-3.5" />
            Appearance
          </h3>
          <div className="flex gap-2">
            <Button
              variant={theme === "dark" ? "primary" : "secondary"}
              onClick={() => setTheme("dark")}
              className="flex-1"
            >
              <Moon className="h-4 w-4" />
              Dark
            </Button>
            <Button
              variant={theme === "light" ? "primary" : "secondary"}
              onClick={() => setTheme("light")}
              className="flex-1"
            >
              <Sun className="h-4 w-4" />
              Light
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            Trading Defaults
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Default Account Balance</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={balance || (settings?.defaultAccountBalance?.toString() ?? "")}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Default Risk %</label>
              <Input
                type="number"
                step="0.1"
                placeholder="1.0"
                value={riskPct || (settings?.defaultRiskPercent?.toString() ?? "")}
                onChange={(e) => setRiskPct(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
              <Input
                placeholder="e.g. USD"
                value={currency || (settings?.currency ?? "")}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </div>
            <Button
              onClick={async () => {
                await update({
                  defaultAccountBalance: balance ? parseFloat(balance) : undefined,
                  defaultRiskPercent: riskPct ? parseFloat(riskPct) : undefined,
                  currency: currency || undefined,
                });
                setSavedNote(true);
                setTimeout(() => setSavedNote(false), 2000);
              }}
            >
              Save Defaults
            </Button>
            {savedNote && <span className="text-xs text-up ml-2">Saved</span>}
          </div>
        </Card>

        <Card>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Download className="h-3.5 w-3.5" />
            Backup & Restore
          </h3>
          <BackupPanel settings={settings} onRefresh={refresh} />
        </Card>

        <Card>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Bell className="h-3.5 w-3.5" />
            Chart Preferences
          </h3>
          <label className="flex items-center justify-between text-sm cursor-pointer">
            <span>Show trade markers on chart</span>
            <button
              role="switch"
              aria-checked={settings?.showTradeMarkers ?? true}
              onClick={() => update({ showTradeMarkers: !(settings?.showTradeMarkers ?? true) })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                (settings?.showTradeMarkers ?? true) ? "bg-accent" : "bg-surface-raised border border-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                  (settings?.showTradeMarkers ?? true) ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </label>
        </Card>

        <Card>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Image className="h-3.5 w-3.5" />
            Data
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All data is stored locally in your browser via IndexedDB. Nothing is sent to any server.
            To clear all ledger data, use your browser&apos;s site data clearing options.
          </p>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined" && window.confirm("Clear your local watchlist? This cannot be undone.")) {
                  saveWatchlist([]);
                  window.location.reload();
                }
              }}
            >
              Clear watchlist
            </Button>
          </div>
        </Card>

        <div className="h-8" />
      </div>

      <div className="h-16 md:hidden" />
    </div>
  );
}