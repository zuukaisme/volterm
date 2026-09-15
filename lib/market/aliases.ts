import type { InstrumentAlias } from "@/types/market";

type AliasTableEntry = {
  derivSymbol: string;
  broker: "weltrade";
  aliasName: string;
};

export const UNVERIFIED_ALIAS_TABLE: AliasTableEntry[] = [
  { derivSymbol: "R_10", broker: "weltrade", aliasName: "Volatility 10" },
  { derivSymbol: "R_25", broker: "weltrade", aliasName: "Volatility 25" },
  { derivSymbol: "R_50", broker: "weltrade", aliasName: "Volatility 50" },
  { derivSymbol: "R_75", broker: "weltrade", aliasName: "Volatility 75" },
  { derivSymbol: "R_100", broker: "weltrade", aliasName: "Volatility 100" },
  { derivSymbol: "1HZ10V", broker: "weltrade", aliasName: "Volatility 10 (1s)" },
  { derivSymbol: "1HZ25V", broker: "weltrade", aliasName: "Volatility 25 (1s)" },
  { derivSymbol: "1HZ50V", broker: "weltrade", aliasName: "Volatility 50 (1s)" },
  { derivSymbol: "1HZ75V", broker: "weltrade", aliasName: "Volatility 75 (1s)" },
  { derivSymbol: "1HZ100V", broker: "weltrade", aliasName: "Volatility 100 (1s)" },
  { derivSymbol: "BOOM500", broker: "weltrade", aliasName: "Boom 500" },
  { derivSymbol: "BOOM1000", broker: "weltrade", aliasName: "Boom 1000" },
  { derivSymbol: "CRASH500", broker: "weltrade", aliasName: "Crash 500" },
  { derivSymbol: "CRASH1000", broker: "weltrade", aliasName: "Crash 1000" },
  { derivSymbol: "stpRNG", broker: "weltrade", aliasName: "Step Index" },
  { derivSymbol: "JD10", broker: "weltrade", aliasName: "Jump 10" },
  { derivSymbol: "JD25", broker: "weltrade", aliasName: "Jump 25" },
  { derivSymbol: "JD50", broker: "weltrade", aliasName: "Jump 50" },
  { derivSymbol: "JD75", broker: "weltrade", aliasName: "Jump 75" },
  { derivSymbol: "JD100", broker: "weltrade", aliasName: "Jump 100" },
];

const aliasesBySymbol = new Map<string, InstrumentAlias[]>();
for (const entry of UNVERIFIED_ALIAS_TABLE) {
  const list = aliasesBySymbol.get(entry.derivSymbol) ?? [];
  list.push({ broker: entry.broker, aliasName: entry.aliasName });
  aliasesBySymbol.set(entry.derivSymbol, list);
}

export function getAliasesForSymbol(derivSymbol: string): InstrumentAlias[] {
  return aliasesBySymbol.get(derivSymbol) ?? [];
}
