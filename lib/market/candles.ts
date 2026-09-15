import type { Candle } from "@/types/market";

export type RawTickInput = { epoch: number; price: number };

export function aggregateCandles(candles: Candle[], intervalSeconds: number): Candle[] {
  const byBucket = new Map<number, Candle>();
  const sorted = [...candles].sort((a, b) => a.time - b.time);
  for (const candle of sorted) {
    const bucket = Math.floor(candle.time / intervalSeconds) * intervalSeconds;
    const existing = byBucket.get(bucket);
    if (existing) {
      existing.high = Math.max(existing.high, candle.high);
      existing.low = Math.min(existing.low, candle.low);
      existing.close = candle.close;
      existing.ticks += candle.ticks;
    } else {
      byBucket.set(bucket, {
        time: bucket,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        ticks: candle.ticks,
      });
    }
  }
  return [...byBucket.values()].sort((a, b) => a.time - b.time);
}

export class CandleAggregator {
  private intervalSeconds: number;
  private candles: Candle[] = [];
  private candleByBucket = new Map<number, Candle>();

  constructor(intervalSeconds: number) {
    this.intervalSeconds = intervalSeconds;
  }

  private bucketFor(epoch: number): number {
    return Math.floor(epoch / this.intervalSeconds) * this.intervalSeconds;
  }

  seed(candles: Candle[]): void {
    this.candles = [...candles].sort((a, b) => a.time - b.time);
    this.candleByBucket.clear();
    for (const candle of this.candles) {
      this.candleByBucket.set(candle.time, candle);
    }
  }

  seedFromTicks(ticks: RawTickInput[]): void {
    this.candles = [];
    this.candleByBucket.clear();
    const sorted = [...ticks].sort((a, b) => a.epoch - b.epoch);
    for (const tick of sorted) {
      this.addTick(tick.epoch, tick.price);
    }
  }

  addTick(epoch: number, price: number): { candle: Candle; isNew: boolean } {
    const bucket = this.bucketFor(epoch);
    const existing = this.candleByBucket.get(bucket);

    if (existing) {
      existing.high = Math.max(existing.high, price);
      existing.low = Math.min(existing.low, price);
      existing.close = price;
      existing.ticks += 1;
      return { candle: existing, isNew: false };
    }

    const candle: Candle = {
      time: bucket,
      open: price,
      high: price,
      low: price,
      close: price,
      ticks: 1,
    };
    this.candleByBucket.set(bucket, candle);

    const insertionIndex = findInsertionIndex(this.candles, bucket);
    this.candles.splice(insertionIndex, 0, candle);

    return { candle, isNew: true };
  }

  getCandles(): Candle[] {
    return this.candles;
  }

  getLast(): Candle | undefined {
    return this.candles[this.candles.length - 1];
  }
}

function findInsertionIndex(candles: Candle[], time: number): number {
  let low = 0;
  let high = candles.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (candles[mid].time < time) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
