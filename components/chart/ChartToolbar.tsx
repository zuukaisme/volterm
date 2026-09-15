"use client";

import { useState } from "react";
import { Layers, ListChecks, PenLine } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { IndicatorPanel } from "./IndicatorPanel";
import { DrawingToolbar } from "./DrawingToolbar";
import { ChartTypeSelector } from "./ChartTypeSelector";
import type { ChartType, Drawing, DrawingToolId, IndicatorId, IndicatorState } from "@/types/chart";

type PanelKey = "indicators" | "draw" | "chartType";

export function ChartToolbar({
  indicators,
  onToggleIndicator,
  chartType,
  onChangeChartType,
  activeDrawingTool,
  onSelectDrawingTool,
  drawings,
  onRemoveDrawing,
  onClearDrawings,
}: {
  indicators: IndicatorState;
  onToggleIndicator: (id: IndicatorId, next: boolean) => void;
  chartType: ChartType;
  onChangeChartType: (type: ChartType) => void;
  activeDrawingTool: DrawingToolId | null;
  onSelectDrawingTool: (tool: DrawingToolId | null) => void;
  drawings: Drawing[];
  onRemoveDrawing: (id: string) => void;
  onClearDrawings: () => void;
}) {
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  const togglePanel = (key: PanelKey) => {
    setOpenPanel((current) => (current === key ? null : key));
  };

  return (
    <div className="relative flex items-center gap-1 border-b border-border bg-surface px-2 py-1.5">
      <IconButton
        label="Indicators"
        active={openPanel === "indicators"}
        onClick={() => togglePanel("indicators")}
      >
        <ListChecks className="h-4 w-4" />
      </IconButton>
      <IconButton
        label="Draw"
        active={openPanel === "draw" || Boolean(activeDrawingTool)}
        onClick={() => togglePanel("draw")}
      >
        <PenLine className="h-4 w-4" />
      </IconButton>
      <IconButton
        label="Chart type"
        active={openPanel === "chartType"}
        onClick={() => togglePanel("chartType")}
      >
        <Layers className="h-4 w-4" />
      </IconButton>

      {openPanel ? (
        <div className="absolute left-2 top-full z-20 mt-1 w-72 rounded-xl border border-border bg-surface shadow-2xl">
          {openPanel === "indicators" ? (
            <IndicatorPanel value={indicators} onToggle={onToggleIndicator} />
          ) : null}
          {openPanel === "draw" ? (
            <DrawingToolbar
              activeTool={activeDrawingTool}
              onSelectTool={onSelectDrawingTool}
              drawings={drawings}
              onRemoveDrawing={onRemoveDrawing}
              onClearAll={onClearDrawings}
            />
          ) : null}
          {openPanel === "chartType" ? (
            <ChartTypeSelector value={chartType} onChange={onChangeChartType} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
