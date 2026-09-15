export function calculateRiskReward(
  entry: number,
  stopLoss: number,
  takeProfit: number,
  direction: "long" | "short"
): { risk: number; reward: number; ratio: number } | null {
  if (direction === "long") {
    const risk = entry - stopLoss;
    const reward = takeProfit - entry;
    if (risk <= 0 || reward <= 0) return null;
    return { risk, reward, ratio: reward / risk };
  } else {
    const risk = stopLoss - entry;
    const reward = entry - takeProfit;
    if (risk <= 0 || reward <= 0) return null;
    return { risk, reward, ratio: reward / risk };
  }
}

export function calculatePositionSize(
  accountBalance: number,
  riskPercent: number,
  entry: number,
  stopLoss: number,
  direction: "long" | "short"
): number | null {
  const riskAmount = accountBalance * (riskPercent / 100);
  const stopDistance = direction === "long" ? entry - stopLoss : stopLoss - entry;
  if (stopDistance <= 0) return 0;
  return riskAmount / stopDistance;
}

export function calculateRiskAmount(
  positionSize: number,
  entry: number,
  stopLoss: number,
  direction: "long" | "short"
): number {
  const stopDistance = direction === "long" ? entry - stopLoss : stopLoss - entry;
  return positionSize * Math.abs(stopDistance);
}

export function calculateRewardAmount(
  positionSize: number,
  entry: number,
  takeProfit: number,
  direction: "long" | "short"
): number {
  const tpDistance = direction === "long" ? takeProfit - entry : entry - takeProfit;
  return positionSize * Math.abs(tpDistance);
}
