export type InstrumentAlias = {
  broker: "weltrade";
  aliasName: string;
};

export type Instrument = {
  symbol: string;
  displayName: string;
  market: string;
  marketDisplay: string;
  submarket: string;
  submarketDisplay: string;
  pipSize: number;
  isActive: boolean;
  isTradingSuspended: boolean;
  aliases: InstrumentAlias[];
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  ticks: number;
};

export type Tick = {
  symbol: string;
  quote: number;
  epoch: number;
  pipSize?: number;
};

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export type TimeframeId =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1H"
  | "4H"
  | "1D"
  | "4D"
  | "1W"
  | "1M";

export type TimeframeDefinition = {
  id: TimeframeId;
  label: string;
  seconds: number;
  derivGranularity: number | null;
};

export type WatchlistEntry = {
  symbol: string;
  addedAt: number;
};

export type MarketCategory = {
  key: string;
  label: string;
  submarket: string;
  instruments: Instrument[];
};

export type PriceSnapshot = {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  lastUpdate: number | null;
  connected: boolean;
};
