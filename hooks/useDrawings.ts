"use client";

import { useCallback, useEffect, useState } from "react";
import { loadDrawings, saveDrawings } from "@/lib/storage/drawings";
import { generateId } from "@/lib/utils";
import type { Drawing, DrawingPoint, DrawingToolId } from "@/types/chart";

export function useDrawings(symbol: string | null, timeframeId: string) {
  const [drawings, setDrawings] = useState<Drawing[]>([]);

  useEffect(() => {
    if (!symbol) {
      setDrawings([]);
      return;
    }
    setDrawings(loadDrawings(symbol, timeframeId));
  }, [symbol, timeframeId]);

  const persist = useCallback(
    (next: Drawing[]) => {
      setDrawings(next);
      if (symbol) saveDrawings(symbol, timeframeId, next);
    },
    [symbol, timeframeId]
  );

  const addDrawing = useCallback(
    (tool: DrawingToolId, points: DrawingPoint[], color: string) => {
      const drawing: Drawing = { id: generateId(), tool, points, color };
      persist([...drawings, drawing]);
      return drawing;
    },
    [drawings, persist]
  );

  const removeDrawing = useCallback(
    (id: string) => {
      persist(drawings.filter((drawing) => drawing.id !== id));
    },
    [drawings, persist]
  );

  const clearDrawings = useCallback(() => {
    persist([]);
  }, [persist]);

  return { drawings, addDrawing, removeDrawing, clearDrawings };
}
