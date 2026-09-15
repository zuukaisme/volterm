"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { RotateCw, FilePlus2 } from "lucide-react";
import { useDerivConnection } from "@/hooks/useDerivConnection";
import { useMarketData } from "@/hooks/useMarketData";
import { useCandles } from "@/hooks/useCandles";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useDrawings } from "@/hooks/useDrawings";
import { useTrades, useStrategies, useLedgerSettings } from "@/hooks/useLedger";
import { PriceHeader } from "@/components/chart/PriceHeader";
import { TimeframeSelector } from "@/components/chart/TimeframeSelector";
import { ChartToolbar } from "@/components/chart/ChartToolbar";
import { ChartTypeSelector } from "@/components/chart/ChartTypeSelector";
import { IndicatorPanel } from "@/components/chart/IndicatorPanel";
import { DrawingToolbar } from "@/components/chart/DrawingToolbar";
import { TradingChart } from "@/components/chart/TradingChart";
import { TradeForm } from "@/components/ledger/TradeForm";
import { TradeDetail } from "@/components/ledger/TradeDetail";
import { Modal } from "@/components/ui/Modal";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { Watchlist } from "@/components/market/Watchlist";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileToolbar } from "@/components/layout/MobileToolbar";
import { BottomSheet } from "@/components/layout/BottomSheet";
import type { MobileSheetKey } from "@/components/layout/types";
import { Button } from "@/components/ui/Button";
import { DEFAULT_TIMEFRAME } from "@/lib/market/timeframes";
import { buildTradeMarkers } from "@/lib/ledger/markers";
import type { ChartType, DrawingPoint, DrawingToolId, IndicatorId, IndicatorState } from "@/types/chart";
import type { TimeframeId } from "@/types/market";
import type { Trade } from "@/types/ledger";

const DEFAULT_INDICATORS: IndicatorState = {
  ema20: true,
  ema50: true,
  sma200: false,
  rsi: false,
  macd: false,
  bollinger: false,
};

const DRAWING_COLORS: Record<DrawingToolId, string> = {
  horizontal: "#4c8dff",
  vertical: "#b98cff",
  trend: "#2fd98a",
  "support-resistance": "#f5a623",
  rectangle: "#00c2d1",
  freehand: "#ff6b9d",
};

const PREFERRED_DEFAULT_SYMBOLS = ["R_75", "R_100", "1HZ75V"];

function OverlayCard({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
      <div className="pointer-events-auto max-w-xs rounded-xl border border-border bg-surface px-5 py-4 text-center text-sm text-muted-foreground shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export function ChartWorkspace({
  defaultSymbol = null,
  defaultTimeframe = null,
}: {
  defaultSymbol?: string | null;
  defaultTimeframe?: string | null;
}) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(defaultSymbol);
  const [timeframeId, setTimeframeId] = useState<TimeframeId>(
    (defaultTimeframe as TimeframeId | null) || DEFAULT_TIMEFRAME
  );
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [indicators, setIndicators] = useState<IndicatorState>(DEFAULT_INDICATORS);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolId | null>(null);
  const [mobileSheet, setMobileSheet] = useState<MobileSheetKey | null>(null);
  const [tradePrefill, setTradePrefill] = useState<Partial<Trade> | null>(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);

  const { state: connectionState, reconnect } = useDerivConnection();
  const { instruments, categories, loading: marketLoading, error: marketError } = useMarketData();
  const {
    streamHandle,
    priceSnapshot,
    loading: candlesLoading,
    error: candlesError,
    retry: retryCandles,
  } = useCandles(selectedSymbol, timeframeId);
  const watchlist = useWatchlist();
  const { drawings, addDrawing, removeDrawing, clearDrawings } = useDrawings(
    selectedSymbol,
    timeframeId
  );
  const { items: trades, add: addTrade, update: updateTrade, remove: removeTrade, duplicate: duplicateTrade } = useTrades();
  const { items: strategies } = useStrategies();
  const { settings } = useLedgerSettings();

  const instrumentsBySymbol = useMemo(
    () => new Map(instruments.map((instrument) => [instrument.symbol, instrument])),
    [instruments]
  );
  const selectedInstrument = selectedSymbol ? instrumentsBySymbol.get(selectedSymbol) ?? null : null;

  useEffect(() => {
    if (selectedSymbol || instruments.length === 0) return;
    const preferred = PREFERRED_DEFAULT_SYMBOLS.map((symbol) =>
      instruments.find((instrument) => instrument.symbol === symbol)
    ).find(Boolean);
    setSelectedSymbol((preferred ?? instruments[0]).symbol);
  }, [instruments, selectedSymbol]);

  const handleToggleIndicator = (id: IndicatorId, next: boolean) => {
    setIndicators((prev) => ({ ...prev, [id]: next }));
  };

  const handleToggleWatch = (symbol: string) => {
    if (watchlist.isWatched(symbol)) watchlist.remove(symbol);
    else watchlist.add(symbol);
  };

  const handlePlaceDrawing = (tool: DrawingToolId, points: DrawingPoint[]) => {
    addDrawing(tool, points, DRAWING_COLORS[tool]);
    setActiveDrawingTool(null);
  };

  const closeSheet = () => setMobileSheet(null);

  const chartTrades = useMemo(
    () => (selectedSymbol ? trades.filter((t) => t.symbol === selectedSymbol) : []),
    [trades, selectedSymbol]
  );

  const tradeMarkers = useMemo(
    () => (settings?.showTradeMarkers ?? true) ? buildTradeMarkers(chartTrades) : [],
    [chartTrades, settings?.showTradeMarkers]
  );

  const currentPrice = priceSnapshot?.price ?? null;

  const handleRecordTrade = () => {
    const instrument = selectedSymbol ? instrumentsBySymbol.get(selectedSymbol) : null;
    setEditingTrade(undefined);
    setTradePrefill({
      symbol: selectedSymbol ?? "",
      displayName: instrument?.displayName ?? selectedSymbol ?? "",
      timeframe: timeframeId,
      entryPrice: currentPrice ?? undefined,
      openedAt: Date.now(),
    });
    setShowTradeForm(true);
  };

  const handleEditCurrentTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setTradePrefill(null);
    setShowTradeForm(true);
  };

  const handleSaveTrade = async (data: Partial<Trade>) => {
    if (editingTrade) {
      await updateTrade(editingTrade.id, data);
    } else {
      await addTrade(data);
    }
    setShowTradeForm(false);
    setEditingTrade(undefined);
    setTradePrefill(null);
  };

  const handleMarkerClick = (tradeId: string) => {
    const trade = trades.find((t) => t.id === tradeId);
    if (trade) setViewingTrade(trade);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground md:pl-[200px] pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
      <div className="hidden md:flex">
        <DesktopSidebar
          instruments={instruments}
          categories={categories}
          loading={marketLoading}
          error={marketError}
          selectedSymbol={selectedSymbol}
          onSelect={setSelectedSymbol}
          isWatched={watchlist.isWatched}
          onToggleWatch={handleToggleWatch}
          watchlistSymbols={watchlist.symbols}
          watchlistPrices={watchlist.prices}
          instrumentsBySymbol={instrumentsBySymbol}
          onRemoveFromWatchlist={watchlist.remove}
          onMoveWatchlistUp={watchlist.moveUp}
          onMoveWatchlistDown={watchlist.moveDown}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <PriceHeader
          instrument={selectedInstrument}
          priceSnapshot={priceSnapshot}
          connectionState={connectionState}
          onOpenSearch={() => setMobileSheet("search")}
        />
        <TimeframeSelector value={timeframeId} onChange={setTimeframeId} />

        <div className="hidden md:block">
          <ChartToolbar
            indicators={indicators}
            onToggleIndicator={handleToggleIndicator}
            chartType={chartType}
            onChangeChartType={setChartType}
            activeDrawingTool={activeDrawingTool}
            onSelectDrawingTool={setActiveDrawingTool}
            drawings={drawings}
            onRemoveDrawing={removeDrawing}
            onClearDrawings={clearDrawings}
          />
        </div>

        <div className="relative min-h-0 flex-1">
          <TradingChart
            streamHandle={streamHandle}
            chartType={chartType}
            indicators={indicators}
            activeDrawingTool={activeDrawingTool}
            drawings={drawings}
            tradeMarkers={tradeMarkers}
            onTradeMarkerClick={handleMarkerClick}
            onPlaceDrawing={handlePlaceDrawing}
          />

          {selectedSymbol ? (
            <button
              onClick={handleRecordTrade}
              className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg hover:border-accent/60 hover:text-accent backdrop-blur transition-colors"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Record Trade
            </button>
          ) : null}

          {!selectedSymbol && !marketLoading ? (
            <OverlayCard>Select a synthetic index to start charting.</OverlayCard>
          ) : null}

          {selectedSymbol && candlesLoading ? (
            <OverlayCard>Loading historical candles…</OverlayCard>
          ) : null}

          {selectedSymbol && candlesError ? (
            <OverlayCard>
              <p className="mb-3">Unable to load market data.</p>
              <Button size="sm" onClick={retryCandles} className="mx-auto">
                <RotateCw className="h-3.5 w-3.5" />
                Try again
              </Button>
            </OverlayCard>
          ) : null}

          {connectionState === "reconnecting" || connectionState === "error" ? (
            <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
                Connection lost. Reconnecting…
                <button onClick={reconnect} className="font-medium text-accent">
                  Retry now
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="md:hidden">
          <MobileToolbar
            active={mobileSheet}
            onSelect={(key) => setMobileSheet((current) => (current === key ? null : key))}
          />
        </div>
      </div>

      <BottomSheet open={mobileSheet === "search"} onClose={closeSheet} title="Search markets" fullHeight>
        <SymbolSearch
          instruments={instruments}
          loading={marketLoading}
          error={marketError}
          isWatched={watchlist.isWatched}
          onToggleWatch={handleToggleWatch}
          onSelect={(instrument) => {
            setSelectedSymbol(instrument.symbol);
            closeSheet();
          }}
        />
      </BottomSheet>

      <BottomSheet open={mobileSheet === "watchlist"} onClose={closeSheet} title="Watchlist">
        <Watchlist
          symbols={watchlist.symbols}
          prices={watchlist.prices}
          instrumentsBySymbol={instrumentsBySymbol}
          selectedSymbol={selectedSymbol}
          onSelect={(symbol) => {
            setSelectedSymbol(symbol);
            closeSheet();
          }}
          onRemove={watchlist.remove}
          onMoveUp={watchlist.moveUp}
          onMoveDown={watchlist.moveDown}
        />
      </BottomSheet>

      <BottomSheet open={mobileSheet === "indicators"} onClose={closeSheet} title="Indicators">
        <IndicatorPanel value={indicators} onToggle={handleToggleIndicator} />
      </BottomSheet>

      <BottomSheet open={mobileSheet === "draw"} onClose={closeSheet} title="Draw">
        <DrawingToolbar
          activeTool={activeDrawingTool}
          onSelectTool={(tool) => {
            setActiveDrawingTool(tool);
            closeSheet();
          }}
          drawings={drawings}
          onRemoveDrawing={removeDrawing}
          onClearAll={clearDrawings}
        />
      </BottomSheet>

      <BottomSheet open={mobileSheet === "chartType"} onClose={closeSheet} title="Chart type">
        <ChartTypeSelector
          value={chartType}
          onChange={(type) => {
            setChartType(type);
            closeSheet();
          }}
        />
      </BottomSheet>

      <Modal
        open={showTradeForm}
        onClose={() => { setShowTradeForm(false); setEditingTrade(undefined); setTradePrefill(null); }}
        size="full"
        noPadding
        title={editingTrade ? "Edit Trade" : "Record Trade"}
      >
        <TradeForm
          trade={editingTrade}
          strategies={strategies}
          prefill={tradePrefill ?? undefined}
          onSave={handleSaveTrade}
          onCancel={() => { setShowTradeForm(false); setEditingTrade(undefined); setTradePrefill(null); }}
        />
      </Modal>

      <Modal
        open={viewingTrade !== null}
        onClose={() => setViewingTrade(null)}
        size="full"
        noPadding
        title="Trade Details"
      >
        {viewingTrade && (
          <TradeDetail
            trade={viewingTrade}
            onEdit={() => {
              const t = viewingTrade;
              setViewingTrade(null);
              handleEditCurrentTrade(t);
            }}
            onDuplicate={async () => { await duplicateTrade(viewingTrade.id); setViewingTrade(null); }}
            onDelete={async () => { await removeTrade(viewingTrade.id); setViewingTrade(null); }}
          />
        )}
      </Modal>
    </div>
  );
}
