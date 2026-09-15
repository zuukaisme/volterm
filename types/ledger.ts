export type TradeStatus =
  | "planned"
  | "open"
  | "win"
  | "loss"
  | "breakeven"
  | "cancelled";

export type TradeDirection = "long" | "short";

export type TradeEmotion =
  | "calm"
  | "confident"
  | "nervous"
  | "fearful"
  | "fomo"
  | "greedy"
  | "angry"
  | "frustrated"
  | "revenge"
  | "uncertain";

export type Trade = {
  id: string;
  symbol: string;
  displayName: string;
  direction: TradeDirection;
  status: TradeStatus;
  timeframe: string;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  riskAmount?: number;
  profitLoss?: number;
  riskReward?: number;
  strategyId?: string;
  strategyName?: string;
  setup?: string;
  entryReason?: string;
  exitReason?: string;
  notes?: string;
  screenshot?: string;
  openedAt?: number;
  closedAt?: number;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  emotion?: TradeEmotion;
  confidence?: number;
  discipline?: number;
  isPlanned?: boolean;
  followedStrategy?: boolean;
};

export type Strategy = {
  id: string;
  name: string;
  description?: string;
  entryRules?: string[];
  confirmationRules?: string[];
  exitRules?: string[];
  preferredTimeframes?: string[];
  preferredSymbols?: string[];
  notes?: string;
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type DailyJournal = {
  id: string;
  date: string;
  marketOverview?: string;
  plan?: string;
  goals?: string;
  lessons?: string;
  mistakes?: string;
  mood?: string;
  createdAt: number;
  updatedAt: number;
};

export type LedgerSettings = {
  id: string;
  lastBackupAt?: number;
  defaultAccountBalance?: number;
  defaultRiskPercent?: number;
  currency?: string;
  showTradeMarkers?: boolean;
  updatedAt: number;
};

export type TradeFilter = {
  dateFrom?: number;
  dateTo?: number;
  symbol?: string;
  direction?: TradeDirection;
  status?: TradeStatus;
  strategyId?: string;
  timeframe?: string;
  tags?: string[];
  isPlanned?: boolean;
  followedStrategy?: boolean;
  emotion?: TradeEmotion;
};

export type LedgerBackup = {
  version: number;
  exportedAt: number;
  trades: Trade[];
  strategies: Strategy[];
  journals: DailyJournal[];
  settings: LedgerSettings | null;
};
