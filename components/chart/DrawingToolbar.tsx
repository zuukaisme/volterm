"use client";

import { Minus, MoveDiagonal, Pencil, Square, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Drawing, DrawingToolId } from "@/types/chart";

const TOOLS: { id: DrawingToolId; label: string; icon: typeof Minus }[] = [
  { id: "horizontal", label: "Horizontal line", icon: Minus },
  { id: "vertical", label: "Vertical line", icon: Minus },
  { id: "trend", label: "Trend line", icon: MoveDiagonal },
  { id: "support-resistance", label: "Support / resistance", icon: Minus },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "freehand", label: "Freehand", icon: Pencil },
];

const TOOL_LABEL: Record<DrawingToolId, string> = {
  horizontal: "Horizontal line",
  vertical: "Vertical line",
  trend: "Trend line",
  "support-resistance": "Support / resistance",
  rectangle: "Rectangle",
  freehand: "Freehand",
};

export function DrawingToolbar({
  activeTool,
  onSelectTool,
  drawings,
  onRemoveDrawing,
  onClearAll,
}: {
  activeTool: DrawingToolId | null;
  onSelectTool: (tool: DrawingToolId | null) => void;
  drawings: Drawing[];
  onRemoveDrawing: (id: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(isActive ? null : tool.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-accent/60 bg-accent/15 text-accent"
                  : "border-border text-foreground hover:bg-surface-raised"
              )}
            >
              <Icon className={cn("h-4 w-4", tool.id === "vertical" && "rotate-90")} />
              {tool.label}
            </button>
          );
        })}
      </div>

      {activeTool ? (
        <p className="rounded-lg bg-surface-raised px-3 py-2 text-xs text-muted-foreground">
          {activeTool === "trend"
            ? "Tap two points on the chart to place the trend line."
            : activeTool === "rectangle" || activeTool === "freehand"
              ? "Drag on the chart to draw."
              : "Tap the chart to place the line."}
        </p>
      ) : null}

      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Drawings
        </span>
        {drawings.length > 0 ? (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-down"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        ) : null}
      </div>

      {drawings.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">No drawings on this chart yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {drawings.map((drawing) => (
            <li
              key={drawing.id}
              className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2"
            >
              <span className="flex items-center gap-2 text-xs text-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: drawing.color }}
                />
                {TOOL_LABEL[drawing.tool]}
              </span>
              <button
                onClick={() => onRemoveDrawing(drawing.id)}
                aria-label="Remove drawing"
                className="text-muted-foreground hover:text-down"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
