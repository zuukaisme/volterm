export type ChartType = "candles" | "line" | "area";

export type IndicatorId =
  | "ema20"
  | "ema50"
  | "sma200"
  | "rsi"
  | "macd"
  | "bollinger";

export type IndicatorState = Record<IndicatorId, boolean>;

export type DrawingToolId =
  | "horizontal"
  | "vertical"
  | "trend"
  | "support-resistance"
  | "rectangle"
  | "freehand";

export type DrawingPoint = {
  time: number;
  price: number;
};

export type Drawing = {
  id: string;
  tool: DrawingToolId;
  points: DrawingPoint[];
  color: string;
};

export type CandleStreamEvent =
  | { type: "reset"; candles: import("./market").Candle[] }
  | { type: "update"; candle: import("./market").Candle }
  | { type: "new"; candle: import("./market").Candle };
