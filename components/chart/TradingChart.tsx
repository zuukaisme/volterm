"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
  isBusinessDay,
} from "lightweight-charts";
import type {
  BusinessDay,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  MouseEventParams,
  SeriesMarker,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import {
  bollingerBands,
  ema,
  macd,
  rsi,
  sma,
  type IndicatorPoint,
} from "@/lib/market/indicators";
import type { Candle } from "@/types/market";
import type {
  ChartType,
  Drawing,
  DrawingPoint,
  DrawingToolId,
  IndicatorState,
} from "@/types/chart";
import type { CandleStreamHandle } from "@/hooks/useCandles";

const UP_COLOR = "#2fd98a";
const DOWN_COLOR = "#f0555a";
const EMA20_COLOR = "#4c8dff";
const EMA50_COLOR = "#b98cff";
const SMA200_COLOR = "#f5a623";
const BB_LINE_COLOR = "#5b6b82";
const BB_BAND_COLOR = "#3a4556";
const RSI_COLOR = "#b98cff";
const MACD_LINE_COLOR = "#4c8dff";
const MACD_SIGNAL_COLOR = "#f5a623";

const CHART_THEME_COLORS = {
  dark: {
    textColor: "#7c8797",
    gridLine: "rgba(35,43,56,0.6)",
    borderColor: "#232b38",
    scaleLine: "#3a4556",
  },
  light: {
    textColor: "#5b6472",
    gridLine: "rgba(214,221,231,0.7)",
    borderColor: "#d9dfe8",
    scaleLine: "#c3ccd8",
  },
} as const;

type ChartThemeKey = keyof typeof CHART_THEME_COLORS;

const DEFAULT_SCROLL_SCALE_OPTIONS = {
  handleScroll: {
    mouseWheel: true,
    pressedMouseMove: true,
    horizTouchDrag: true,
    vertTouchDrag: true,
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: true,
    pinch: true,
  },
};

const DRAG_TOOLS: DrawingToolId[] = ["rectangle", "freehand"];

const DRAFT_TOOL_COLORS: Record<string, string> = {
  rectangle: "#00c2d1",
  freehand: "#ff6b9d",
};

type LineSeriesRef = ISeriesApi<"Line">;
type HistogramSeriesRef = ISeriesApi<"Histogram">;
type MainSeriesRef =
  | ISeriesApi<"Candlestick">
  | ISeriesApi<"Line">
  | ISeriesApi<"Area">;

type IndicatorSeriesRefs = {
  ema20?: LineSeriesRef;
  ema50?: LineSeriesRef;
  sma200?: LineSeriesRef;
  bbUpper?: LineSeriesRef;
  bbMiddle?: LineSeriesRef;
  bbLower?: LineSeriesRef;
  rsi?: LineSeriesRef;
  macdLine?: LineSeriesRef;
  macdSignal?: LineSeriesRef;
  macdHist?: HistogramSeriesRef;
};

export type ChartTradeMarker = {
  time: number;
  tradeId: string;
  price?: number;
  position:
    | "aboveBar"
    | "belowBar"
    | "atPriceTop"
    | "atPriceBottom"
    | "atPriceMiddle";
  shape: "circle" | "square" | "arrowUp" | "arrowDown";
  color: string;
  text?: string;
};

export type TradingChartProps = {
  streamHandle: CandleStreamHandle;
  chartType: ChartType;
  indicators: IndicatorState;
  activeDrawingTool: DrawingToolId | null;
  drawings: Drawing[];
  tradeMarkers?: ChartTradeMarker[];
  onTradeMarkerClick?: (tradeId: string) => void;
  onPlaceDrawing: (tool: DrawingToolId, points: DrawingPoint[]) => void;
};

function toUTC(time: number): UTCTimestamp {
  return time as UTCTimestamp;
}

function timeToEpoch(time: Time): number {
  if (typeof time === "number") return time;
  if (typeof time === "string") {
    const parsed = Date.parse(time);
    return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
  }
  if (isBusinessDay(time)) return businessDayToEpoch(time);
  return 0;
}

function businessDayToEpoch(day: BusinessDay): number {
  return Math.floor(Date.UTC(day.year, day.month - 1, day.day) / 1000);
}

function toSeriesMarkers(markers: ChartTradeMarker[]): SeriesMarker<Time>[] {
  return markers.map((m) => {
    const base = {
      time: toUTC(m.time),
      color: m.color,
      shape: m.shape as SeriesMarker<Time>["shape"],
      text: m.text,
    };
    const pos = m.position;
    if (pos === "aboveBar" || pos === "belowBar") {
      return { ...base, position: pos, price: m.price } as SeriesMarker<Time>;
    }
    return { ...base, position: pos, price: m.price } as SeriesMarker<Time>;
  });
}

function candleColor(candle: Candle): string {
  return candle.close >= candle.open ? UP_COLOR : DOWN_COLOR;
}

function mapCandlestickPoint(candle: Candle) {
  const color = candleColor(candle);
  return {
    time: toUTC(candle.time),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    color,
    borderColor: color,
    wickColor: color,
  };
}

function mapCandlestickData(candles: Candle[]) {
  return candles.map(mapCandlestickPoint);
}

function mapLineData(candles: Candle[]) {
  return candles.map((candle) => ({ time: toUTC(candle.time), value: candle.close }));
}

function mapActivityPoint(candle: Candle) {
  return {
    time: toUTC(candle.time),
    value: candle.ticks,
    color: candle.close >= candle.open ? "rgba(47,217,138,0.35)" : "rgba(240,85,90,0.35)",
  };
}

function mapActivityData(candles: Candle[]) {
  return candles.map(mapActivityPoint);
}

function toLinePoint(point: IndicatorPoint) {
  return { time: toUTC(point.time), value: point.value };
}

function computeSubPaneAssignments(indicators: IndicatorState) {
  let nextPane = 1;
  const assignment: { rsi: number | null; macd: number | null } = {
    rsi: null,
    macd: null,
  };
  if (indicators.rsi) {
    assignment.rsi = nextPane;
    nextPane += 1;
  }
  if (indicators.macd) {
    assignment.macd = nextPane;
  }
  return assignment;
}

export function TradingChart({
  streamHandle,
  chartType,
  indicators,
  activeDrawingTool,
  drawings,
  tradeMarkers = [],
  onTradeMarkerClick,
  onPlaceDrawing,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<MainSeriesRef | null>(null);
  const activitySeriesRef = useRef<HistogramSeriesRef | null>(null);
  const indicatorRefs = useRef<IndicatorSeriesRefs>({});
  const markersApiRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const tradeMarkersRef = useRef<ChartTradeMarker[]>(tradeMarkers);
  const onTradeMarkerClickRef = useRef(onTradeMarkerClick);
  const chartTypeRef = useRef<ChartType>(chartType);
  const pendingPointRef = useRef<DrawingPoint | null>(null);
  const activeDrawingToolRef = useRef<DrawingToolId | null>(activeDrawingTool);
  const onPlaceDrawingRef = useRef(onPlaceDrawing);
  const themeRef = useRef<ChartThemeKey>("dark");
  const dragRef = useRef<{ tool: DrawingToolId; points: DrawingPoint[]; active: boolean } | null>(
    null
  );
  const lastDragPointRef = useRef<{ x: number; y: number } | null>(null);
  const [, bumpOverlayVersion] = useState(0);
  const { theme } = useTheme();

  tradeMarkersRef.current = tradeMarkers;
  onTradeMarkerClickRef.current = onTradeMarkerClick;

  const resolvedTheme: ChartThemeKey = theme === "light" ? "light" : "dark";
  themeRef.current = resolvedTheme;

  const scheduleOverlayRedraw = useCallback(() => {
    requestAnimationFrame(() => bumpOverlayVersion((n) => n + 1));
  }, []);

  useEffect(() => {
    activeDrawingToolRef.current = activeDrawingTool;
    pendingPointRef.current = null;
    dragRef.current = null;
    lastDragPointRef.current = null;
    scheduleOverlayRedraw();
  }, [activeDrawingTool, scheduleOverlayRedraw]);

  useEffect(() => {
    onPlaceDrawingRef.current = onPlaceDrawing;
  }, [onPlaceDrawing]);

  useEffect(() => {
    scheduleOverlayRedraw();
  }, [drawings, scheduleOverlayRedraw]);

  const applyChartTheme = useCallback((chart: IChartApi, key: ChartThemeKey) => {
    const colors = CHART_THEME_COLORS[key];
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.gridLine },
        horzLines: { color: colors.gridLine },
      },
      rightPriceScale: { borderColor: colors.borderColor },
      timeScale: { borderColor: colors.borderColor },
    });
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) applyChartTheme(chart, resolvedTheme);
  }, [resolvedTheme, applyChartTheme]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const isDragTool = activeDrawingTool !== null && DRAG_TOOLS.includes(activeDrawingTool);
    if (isDragTool) {
      chart.applyOptions({
        handleScroll: {
          mouseWheel: false,
          pressedMouseMove: false,
          horzTouchDrag: false,
          vertTouchDrag: false,
        },
        handleScale: {
          axisPressedMouseMove: false,
          mouseWheel: false,
          pinch: false,
        },
        crosshair: { mode: CrosshairMode.Hidden },
      });
    } else {
      chart.applyOptions({
        handleScroll: DEFAULT_SCROLL_SCALE_OPTIONS.handleScroll,
        handleScale: DEFAULT_SCROLL_SCALE_OPTIONS.handleScale,
        crosshair: { mode: CrosshairMode.Normal },
      });
    }
  }, [activeDrawingTool, resolvedTheme]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: CHART_THEME_COLORS[themeRef.current].textColor,
      },
      grid: {
        vertLines: { color: CHART_THEME_COLORS[themeRef.current].gridLine },
        horzLines: { color: CHART_THEME_COLORS[themeRef.current].gridLine },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: CHART_THEME_COLORS[themeRef.current].borderColor },
      timeScale: {
        borderColor: CHART_THEME_COLORS[themeRef.current].borderColor,
        timeVisible: true,
        secondsVisible: true,
      },
    });
    chartRef.current = chart;

    const activitySeries = chart.addSeries(
      HistogramSeries,
      {
        priceScaleId: "activity",
        lastValueVisible: false,
        priceLineVisible: false,
      },
      0
    );
    activitySeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    activitySeriesRef.current = activitySeries;

    const handleClick = (param: MouseEventParams) => {
      const tool = activeDrawingToolRef.current;
      if (!param.point || param.time === undefined) return;

      const markers = tradeMarkersRef.current;
      if (!tool && markers.length > 0 && onTradeMarkerClickRef.current) {
        const time = timeToEpoch(param.time);
        const matched = markers
          .filter((m) => Math.abs(m.time - time) <= 30)
          .sort((a, b) => Math.abs(a.time - time) - Math.abs(b.time - time))[0];
        if (matched) {
          onTradeMarkerClickRef.current(matched.tradeId);
          return;
        }
      }

      if (!tool || DRAG_TOOLS.includes(tool)) return;
      if (!mainSeriesRef.current) return;
      const price = mainSeriesRef.current.coordinateToPrice(param.point.y);
      if (price === null) return;

      if (tool === "trend") {
        if (!pendingPointRef.current) {
          pendingPointRef.current = { time: timeToEpoch(param.time), price };
          scheduleOverlayRedraw();
          return;
        }
        onPlaceDrawingRef.current("trend", [pendingPointRef.current, { time: timeToEpoch(param.time), price }]);
        pendingPointRef.current = null;
        return;
      }

      onPlaceDrawingRef.current(tool, [{ time: timeToEpoch(param.time), price }]);
    };
    chart.subscribeClick(handleClick);

    const handleRangeChange = () => scheduleOverlayRedraw();
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);

    const resizeObserver = new ResizeObserver(() => scheduleOverlayRedraw());
    resizeObserver.observe(container);

    const clientToPoint = (clientX: number, clientY: number): DrawingPoint | null => {
      const chartInstance = chartRef.current;
      const series = mainSeriesRef.current;
      if (!chartInstance || !series) return null;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const time = chartInstance.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);
      if (time === null || price === null) return null;
      return { time: timeToEpoch(time), price };
    };

    const handlePointerDown = (event: PointerEvent) => {
      const tool = activeDrawingToolRef.current;
      if (!tool || !DRAG_TOOLS.includes(tool) || !mainSeriesRef.current) return;
      event.preventDefault();
      const point = clientToPoint(event.clientX, event.clientY);
      if (!point) return;
      dragRef.current = {
        tool,
        points: tool === "rectangle" ? [point, point] : [point],
        active: true,
      };
      lastDragPointRef.current = { x: event.clientX, y: event.clientY };
      try {
        container.setPointerCapture(event.pointerId);
      } catch {
        return;
      }
      scheduleOverlayRedraw();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !drag.active) return;
      const point = clientToPoint(event.clientX, event.clientY);
      if (!point) return;
      if (drag.tool === "freehand") {
        const last = lastDragPointRef.current;
        const rect = container.getBoundingClientRect();
        if (!last) {
          lastDragPointRef.current = { x: event.clientX, y: event.clientY };
          return;
        }
        const dx = event.clientX - last.x;
        const dy = event.clientY - last.y;
        lastDragPointRef.current = { x: event.clientX, y: event.clientY };
        if (Math.hypot(dx, dy) < rect.width * 0.002) return;
        const previous = drag.points[drag.points.length - 1];
        if (previous && Math.abs(previous.time - point.time) === 0 && previous.price === point.price) {
          return;
        }
        drag.points = [...drag.points, point];
        dragRef.current = drag;
      } else {
        drag.points = [drag.points[0], point];
        dragRef.current = drag;
      }
      scheduleOverlayRedraw();
    };

    const commitDrag = () => {
      const drag = dragRef.current;
      if (!drag || !drag.active) return;
      drag.active = false;
      dragRef.current = null;
      lastDragPointRef.current = null;
      let shouldCommit = drag.tool === "freehand" && drag.points.length >= 2;
      if (drag.tool === "rectangle") {
        const [a, b] = drag.points;
        shouldCommit =
          Boolean(a && b) &&
          (Math.abs(a.time - b.time) > 0 || Math.abs(a.price - b.price) > 0);
      }
      if (shouldCommit) {
        onPlaceDrawingRef.current(drag.tool, drag.points);
      }
      scheduleOverlayRedraw();
    };

    const handlePointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !drag.active) return;
      try {
        container.releasePointerCapture(event.pointerId);
      } catch {
        return;
      }
      commitDrag();
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointercancel", handlePointerUp);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointercancel", handlePointerUp);
      resizeObserver.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      chart.unsubscribeClick(handleClick);
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      activitySeriesRef.current = null;
      indicatorRefs.current = {};
      dragRef.current = null;
    };
  }, [scheduleOverlayRedraw]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (mainSeriesRef.current) {
      chart.removeSeries(mainSeriesRef.current);
      mainSeriesRef.current = null;
      markersApiRef.current = null;
    }

    const snapshot = streamHandle.getSnapshot();

    let series: MainSeriesRef;

    if (chartType === "candles") {
      series = chart.addSeries(
        CandlestickSeries,
        {
          upColor: UP_COLOR,
          downColor: DOWN_COLOR,
          borderVisible: false,
          wickUpColor: UP_COLOR,
          wickDownColor: DOWN_COLOR,
        },
        0
      );
      if (snapshot.length) series.setData(mapCandlestickData(snapshot));
    } else if (chartType === "area") {
      series = chart.addSeries(
        AreaSeries,
        {
          lineColor: "#4c8dff",
          topColor: "rgba(76,141,255,0.35)",
          bottomColor: "rgba(76,141,255,0.02)",
          lineWidth: 2,
        },
        0
      );
      if (snapshot.length) series.setData(mapLineData(snapshot));
    } else {
      series = chart.addSeries(LineSeries, { color: "#4c8dff", lineWidth: 2 }, 0);
      if (snapshot.length) series.setData(mapLineData(snapshot));
    }
    mainSeriesRef.current = series;

    markersApiRef.current = createSeriesMarkers(series, toSeriesMarkers(tradeMarkersRef.current));

    chartTypeRef.current = chartType;
    scheduleOverlayRedraw();
  }, [chartType, streamHandle, scheduleOverlayRedraw]);

  useEffect(() => {
    markersApiRef.current?.setMarkers(toSeriesMarkers(tradeMarkers));
  }, [tradeMarkers]);

  const applyFullIndicatorData = useCallback((candles: Candle[]) => {
    const refs = indicatorRefs.current;
    if (refs.ema20) refs.ema20.setData(ema(candles, 20).map(toLinePoint));
    if (refs.ema50) refs.ema50.setData(ema(candles, 50).map(toLinePoint));
    if (refs.sma200) refs.sma200.setData(sma(candles, 200).map(toLinePoint));
    if (refs.bbUpper || refs.bbMiddle || refs.bbLower) {
      const bands = bollingerBands(candles, 20, 2);
      refs.bbUpper?.setData(bands.upper.map(toLinePoint));
      refs.bbMiddle?.setData(bands.middle.map(toLinePoint));
      refs.bbLower?.setData(bands.lower.map(toLinePoint));
    }
    if (refs.rsi) refs.rsi.setData(rsi(candles, 14).map(toLinePoint));
    if (refs.macdLine || refs.macdSignal || refs.macdHist) {
      const result = macd(candles, 12, 26, 9);
      refs.macdLine?.setData(result.macd.map(toLinePoint));
      refs.macdSignal?.setData(result.signal.map(toLinePoint));
      refs.macdHist?.setData(
        result.histogram.map((point) => ({
          time: toUTC(point.time),
          value: point.value,
          color: point.value >= 0 ? UP_COLOR : DOWN_COLOR,
        }))
      );
    }
  }, []);

  const applyIncrementalIndicatorData = useCallback((candles: Candle[]) => {
    const refs = indicatorRefs.current;
    const pushLast = (series: LineSeriesRef | undefined, points: IndicatorPoint[]) => {
      const last = points[points.length - 1];
      if (series && last) series.update(toLinePoint(last));
    };
    if (refs.ema20) pushLast(refs.ema20, ema(candles, 20));
    if (refs.ema50) pushLast(refs.ema50, ema(candles, 50));
    if (refs.sma200) pushLast(refs.sma200, sma(candles, 200));
    if (refs.bbUpper || refs.bbMiddle || refs.bbLower) {
      const bands = bollingerBands(candles, 20, 2);
      pushLast(refs.bbUpper, bands.upper);
      pushLast(refs.bbMiddle, bands.middle);
      pushLast(refs.bbLower, bands.lower);
    }
    if (refs.rsi) pushLast(refs.rsi, rsi(candles, 14));
    if (refs.macdLine || refs.macdSignal || refs.macdHist) {
      const result = macd(candles, 12, 26, 9);
      pushLast(refs.macdLine, result.macd);
      pushLast(refs.macdSignal, result.signal);
      const lastHist = result.histogram[result.histogram.length - 1];
      if (refs.macdHist && lastHist) {
        refs.macdHist.update({
          time: toUTC(lastHist.time),
          value: lastHist.value,
          color: lastHist.value >= 0 ? UP_COLOR : DOWN_COLOR,
        });
      }
    }
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const refs = indicatorRefs.current;

    if (indicators.ema20 && !refs.ema20) {
      refs.ema20 = chart.addSeries(
        LineSeries,
        { color: EMA20_COLOR, lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
        0
      );
    } else if (!indicators.ema20 && refs.ema20) {
      chart.removeSeries(refs.ema20);
      refs.ema20 = undefined;
    }

    if (indicators.ema50 && !refs.ema50) {
      refs.ema50 = chart.addSeries(
        LineSeries,
        { color: EMA50_COLOR, lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
        0
      );
    } else if (!indicators.ema50 && refs.ema50) {
      chart.removeSeries(refs.ema50);
      refs.ema50 = undefined;
    }

    if (indicators.sma200 && !refs.sma200) {
      refs.sma200 = chart.addSeries(
        LineSeries,
        { color: SMA200_COLOR, lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
        0
      );
    } else if (!indicators.sma200 && refs.sma200) {
      chart.removeSeries(refs.sma200);
      refs.sma200 = undefined;
    }

    if (indicators.bollinger && !refs.bbUpper) {
      refs.bbUpper = chart.addSeries(
        LineSeries,
        {
          color: BB_BAND_COLOR,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
        },
        0
      );
      refs.bbMiddle = chart.addSeries(
        LineSeries,
        { color: BB_LINE_COLOR, lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
        0
      );
      refs.bbLower = chart.addSeries(
        LineSeries,
        {
          color: BB_BAND_COLOR,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
        },
        0
      );
    } else if (!indicators.bollinger && refs.bbUpper) {
      chart.removeSeries(refs.bbUpper);
      if (refs.bbMiddle) chart.removeSeries(refs.bbMiddle);
      if (refs.bbLower) chart.removeSeries(refs.bbLower);
      refs.bbUpper = undefined;
      refs.bbMiddle = undefined;
      refs.bbLower = undefined;
    }

    const assignment = computeSubPaneAssignments(indicators);

    if (assignment.rsi !== null) {
      if (!refs.rsi) {
        refs.rsi = chart.addSeries(
          LineSeries,
          { color: RSI_COLOR, lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
          assignment.rsi
        );
        refs.rsi.createPriceLine({
          price: 70,
          color: "#3a4556",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "70",
        });
        refs.rsi.createPriceLine({
          price: 30,
          color: "#3a4556",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "30",
        });
        chart.panes()[assignment.rsi]?.setHeight(120);
      } else {
        refs.rsi.moveToPane(assignment.rsi);
      }
    } else if (refs.rsi) {
      chart.removeSeries(refs.rsi);
      refs.rsi = undefined;
    }

    if (assignment.macd !== null) {
      if (!refs.macdLine) {
        refs.macdHist = chart.addSeries(
          HistogramSeries,
          { priceLineVisible: false, lastValueVisible: false },
          assignment.macd
        );
        refs.macdLine = chart.addSeries(
          LineSeries,
          { color: MACD_LINE_COLOR, lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
          assignment.macd
        );
        refs.macdSignal = chart.addSeries(
          LineSeries,
          { color: MACD_SIGNAL_COLOR, lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
          assignment.macd
        );
        chart.panes()[assignment.macd]?.setHeight(120);
      } else {
        refs.macdHist?.moveToPane(assignment.macd);
        refs.macdLine.moveToPane(assignment.macd);
        refs.macdSignal?.moveToPane(assignment.macd);
      }
    } else if (refs.macdLine) {
      chart.removeSeries(refs.macdLine);
      if (refs.macdSignal) chart.removeSeries(refs.macdSignal);
      if (refs.macdHist) chart.removeSeries(refs.macdHist);
      refs.macdLine = undefined;
      refs.macdSignal = undefined;
      refs.macdHist = undefined;
    }

    applyFullIndicatorData(streamHandle.getSnapshot());
    scheduleOverlayRedraw();
  }, [indicators, streamHandle, applyFullIndicatorData, scheduleOverlayRedraw]);

  useEffect(() => {
    const applyReset = (candles: Candle[]) => {
      const series = mainSeriesRef.current;
      if (series) {
        if (chartTypeRef.current === "candles") {
          (series as ISeriesApi<"Candlestick">).setData(mapCandlestickData(candles));
        } else {
          (series as ISeriesApi<"Line">).setData(mapLineData(candles));
        }
      }
      activitySeriesRef.current?.setData(mapActivityData(candles));
      applyFullIndicatorData(candles);
      scheduleOverlayRedraw();
    };

    const unsubscribe = streamHandle.subscribe((event) => {
      if (event.type === "reset") {
        applyReset(event.candles);
        return;
      }

      const series = mainSeriesRef.current;
      if (series) {
        if (chartTypeRef.current === "candles") {
          (series as ISeriesApi<"Candlestick">).update(mapCandlestickPoint(event.candle));
        } else {
          (series as ISeriesApi<"Line">).update({
            time: toUTC(event.candle.time),
            value: event.candle.close,
          });
        }
      }
      activitySeriesRef.current?.update(mapActivityPoint(event.candle));
      applyIncrementalIndicatorData(streamHandle.getSnapshot());
    });

    const initialSnapshot = streamHandle.getSnapshot();
    if (initialSnapshot.length > 0) {
      applyReset(initialSnapshot);
    }

    return unsubscribe;
  }, [streamHandle, applyFullIndicatorData, applyIncrementalIndicatorData, scheduleOverlayRedraw]);

  const renderDrawings = (): ReactNode[] => {
    const chart = chartRef.current;
    const series = mainSeriesRef.current;
    if (!chart || !series || !containerRef.current) return [];
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const elements: ReactNode[] = [];

    const pushShape = (
      key: string,
      tool: DrawingToolId,
      points: DrawingPoint[],
      color: string,
      drafts: boolean
    ) => {
      if (tool === "horizontal" || tool === "support-resistance") {
        const point = points[0];
        if (!point) return;
        const y = series.priceToCoordinate(point.price);
        if (y === null) return;
        elements.push(
          <line
            key={key}
            x1={0}
            x2={width}
            y1={y}
            y2={y}
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray={tool === "support-resistance" ? "6 4" : undefined}
            opacity={drafts ? 0.6 : 1}
          />
        );
      } else if (tool === "vertical") {
        const point = points[0];
        if (!point) return;
        const x = chart.timeScale().timeToCoordinate(toUTC(point.time));
        if (x === null) return;
        elements.push(
          <line
            key={key}
            x1={x}
            x2={x}
            y1={0}
            y2={height}
            stroke={color}
            strokeWidth={1.5}
            opacity={drafts ? 0.6 : 1}
          />
        );
      } else if (tool === "trend") {
        const [pointA, pointB] = points;
        if (!pointA || !pointB) return;
        const xA = chart.timeScale().timeToCoordinate(toUTC(pointA.time));
        const yA = series.priceToCoordinate(pointA.price);
        const xB = chart.timeScale().timeToCoordinate(toUTC(pointB.time));
        const yB = series.priceToCoordinate(pointB.price);
        if (xA === null || yA === null || xB === null || yB === null) return;
        elements.push(
          <line
            key={key}
            x1={xA}
            y1={yA}
            x2={xB}
            y2={yB}
            stroke={color}
            strokeWidth={1.5}
            opacity={drafts ? 0.6 : 1}
          />
        );
      } else if (tool === "rectangle") {
        const [pointA, pointB] = points;
        if (!pointA || !pointB) return;
        const xA = chart.timeScale().timeToCoordinate(toUTC(pointA.time));
        const yA = series.priceToCoordinate(pointA.price);
        const xB = chart.timeScale().timeToCoordinate(toUTC(pointB.time));
        const yB = series.priceToCoordinate(pointB.price);
        if (xA === null || yA === null || xB === null || yB === null) return;
        const x = Math.min(xA, xB);
        const y = Math.min(yA, yB);
        elements.push(
          <rect
            key={key}
            x={x}
            y={y}
            width={Math.abs(xB - xA)}
            height={Math.abs(yB - yA)}
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={drafts ? 0.1 : 0.09}
            opacity={drafts ? 0.6 : 1}
          />
        );
      } else if (tool === "freehand") {
        if (points.length < 2) return;
        const coords: string[] = [];
        for (const point of points) {
          const x = chart.timeScale().timeToCoordinate(toUTC(point.time));
          const y = series.priceToCoordinate(point.price);
          if (x === null || y === null) continue;
          coords.push(`${x},${y}`);
        }
        if (coords.length < 2) return;
        elements.push(
          <polyline
            key={key}
            points={coords.join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={drafts ? 0.6 : 1}
          />
        );
      }
    };

    for (const drawing of drawings) {
      pushShape(drawing.id, drawing.tool, drawing.points, drawing.color, false);
    }

    const drag = dragRef.current;
    if (drag && drag.active) {
      const color = DRAFT_TOOL_COLORS[drag.tool] ?? "#4c8dff";
      pushShape("__draft", drag.tool, drag.points, color, true);
    }

    return elements;
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {renderDrawings()}
      </svg>
    </div>
  );
}
