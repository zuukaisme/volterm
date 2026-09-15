import { z } from "zod";
import type { DerivSocketManager } from "./websocket";

const tickFieldSchema = z.object({
  epoch: z.number().optional(),
  quote: z.number().optional(),
  symbol: z.string().optional(),
  pip_size: z.number().optional(),
});

const tickMessageSchema = z.object({
  msg_type: z.string(),
  tick: tickFieldSchema.optional(),
  error: z
    .object({ code: z.string().optional(), message: z.string().optional() })
    .optional(),
});

export type LiveTick = {
  epoch: number;
  price: number;
  symbol: string;
  pipSize?: number;
};

export async function subscribeToTicks(
  connection: DerivSocketManager,
  symbol: string,
  onTick: (tick: LiveTick) => void
): Promise<{ initial: LiveTick | null; unsubscribe: () => void }> {
  const { initial, unsubscribe } = await connection.subscribe(
    { ticks: symbol },
    (data) => {
      const parsed = tickMessageSchema.safeParse(data);
      if (!parsed.success || parsed.data.error) return;
      const tick = parsed.data.tick;
      if (!tick || tick.epoch === undefined || tick.quote === undefined) return;
      onTick({
        epoch: tick.epoch,
        price: tick.quote,
        symbol: tick.symbol ?? symbol,
        pipSize: tick.pip_size,
      });
    }
  );

  const parsedInitial = tickMessageSchema.safeParse(initial);
  let initialTick: LiveTick | null = null;
  if (parsedInitial.success && !parsedInitial.data.error && parsedInitial.data.tick) {
    const tick = parsedInitial.data.tick;
    if (tick.epoch !== undefined && tick.quote !== undefined) {
      initialTick = {
        epoch: tick.epoch,
        price: tick.quote,
        symbol: tick.symbol ?? symbol,
        pipSize: tick.pip_size,
      };
    }
  }

  return { initial: initialTick, unsubscribe };
}
