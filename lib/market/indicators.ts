import type { Candle } from "@/types/market";

export type IndicatorPoint = { time: number; value: number };

function emaOverValues(values: number[], period: number): (number | null)[] {
  const output: (number | null)[] = new Array(values.length).fill(null);
  const smoothing = 2 / (period + 1);
  let previous: number | null = null;
  let seedSum = 0;

  for (let i = 0; i < values.length; i += 1) {
    if (previous === null) {
      seedSum += values[i];
      if (i === period - 1) {
        previous = seedSum / period;
        output[i] = previous;
      }
      continue;
    }
    previous = values[i] * smoothing + previous * (1 - smoothing);
    output[i] = previous;
  }

  return output;
}

export function sma(candles: Candle[], period: number): IndicatorPoint[] {
  const output: IndicatorPoint[] = [];
  let windowSum = 0;

  for (let i = 0; i < candles.length; i += 1) {
    windowSum += candles[i].close;
    if (i >= period) windowSum -= candles[i - period].close;
    if (i >= period - 1) {
      output.push({ time: candles[i].time, value: windowSum / period });
    }
  }

  return output;
}

export function ema(candles: Candle[], period: number): IndicatorPoint[] {
  const closes = candles.map((candle) => candle.close);
  const series = emaOverValues(closes, period);
  const output: IndicatorPoint[] = [];
  for (let i = 0; i < candles.length; i += 1) {
    const value = series[i];
    if (value !== null) output.push({ time: candles[i].time, value });
  }
  return output;
}

function rsiFromAverages(averageGain: number, averageLoss: number): number {
  if (averageLoss === 0) return 100;
  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

export function rsi(candles: Candle[], period = 14): IndicatorPoint[] {
  const output: IndicatorPoint[] = [];
  if (candles.length < period + 1) return output;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) gainSum += change;
    else lossSum -= change;
  }

  let averageGain = gainSum / period;
  let averageLoss = lossSum / period;
  output.push({ time: candles[period].time, value: rsiFromAverages(averageGain, averageLoss) });

  for (let i = period + 1; i < candles.length; i += 1) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
    output.push({ time: candles[i].time, value: rsiFromAverages(averageGain, averageLoss) });
  }

  return output;
}

export type MacdResult = {
  macd: IndicatorPoint[];
  signal: IndicatorPoint[];
  histogram: IndicatorPoint[];
};

export function macd(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MacdResult {
  const closes = candles.map((candle) => candle.close);
  const fastSeries = emaOverValues(closes, fastPeriod);
  const slowSeries = emaOverValues(closes, slowPeriod);

  const macdSeries: (number | null)[] = closes.map((_, i) => {
    const fastValue = fastSeries[i];
    const slowValue = slowSeries[i];
    return fastValue !== null && slowValue !== null ? fastValue - slowValue : null;
  });

  const macdOnlyValues = macdSeries.filter((value): value is number => value !== null);
  const signalOnValid = emaOverValues(macdOnlyValues, signalPeriod);

  const macdPoints: IndicatorPoint[] = [];
  const signalPoints: IndicatorPoint[] = [];
  const histogramPoints: IndicatorPoint[] = [];

  let validIndex = 0;
  for (let i = 0; i < candles.length; i += 1) {
    const value = macdSeries[i];
    if (value === null) continue;
    macdPoints.push({ time: candles[i].time, value });
    const signalValue = signalOnValid[validIndex];
    if (signalValue !== null && signalValue !== undefined) {
      signalPoints.push({ time: candles[i].time, value: signalValue });
      histogramPoints.push({ time: candles[i].time, value: value - signalValue });
    }
    validIndex += 1;
  }

  return { macd: macdPoints, signal: signalPoints, histogram: histogramPoints };
}

export type BollingerResult = {
  upper: IndicatorPoint[];
  middle: IndicatorPoint[];
  lower: IndicatorPoint[];
};

export function bollingerBands(
  candles: Candle[],
  period = 20,
  stdDevMultiplier = 2
): BollingerResult {
  const upper: IndicatorPoint[] = [];
  const middle: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];

  for (let i = period - 1; i < candles.length; i += 1) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) sum += candles[j].close;
    const mean = sum / period;

    let variance = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      variance += (candles[j].close - mean) ** 2;
    }
    const stdDev = Math.sqrt(variance / period);
    const time = candles[i].time;

    middle.push({ time, value: mean });
    upper.push({ time, value: mean + stdDevMultiplier * stdDev });
    lower.push({ time, value: mean - stdDevMultiplier * stdDev });
  }

  return { upper, middle, lower };
}
