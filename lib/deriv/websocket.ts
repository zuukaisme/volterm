import type { ConnectionState } from "@/types/market";

export const DEFAULT_DERIV_WS_URL =
  "wss://api.derivws.com/trading/v1/options/ws/public";

export class DerivApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "DerivApiError";
    this.code = code;
  }
}

type StreamHandler = (data: Record<string, unknown>) => void;

type PendingEntry = {
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

function extractSubscriptionId(data: Record<string, unknown>): string | null {
  const subscription = data.subscription as { id?: unknown } | undefined;
  if (subscription && typeof subscription.id === "string") {
    return subscription.id;
  }
  return null;
}

const MAX_RECONNECT_DELAY_MS = 30000;
const BASE_RECONNECT_DELAY_MS = 1000;
const PING_INTERVAL_MS = 30000;
const DEFAULT_TIMEOUT_MS = 15000;

export class DerivSocketManager {
  private url: string;
  private ws: WebSocket | null = null;
  private reqCounter = 1;
  private pending = new Map<number, PendingEntry>();
  private subscriptionHandlers = new Map<string, StreamHandler>();
  private state: ConnectionState = "disconnected";
  private stateListeners = new Set<(state: ConnectionState) => void>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private manuallyClosed = true;
  private connectPromise: Promise<void> | null = null;

  constructor(url: string) {
    this.url = url;
  }

  getState(): ConnectionState {
    return this.state;
  }

  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    callback(this.state);
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  private setState(next: ConnectionState) {
    if (this.state === next) return;
    this.state = next;
    this.stateListeners.forEach((listener) => listener(next));
  }

  connect(): Promise<void> {
    if (typeof WebSocket === "undefined") {
      return Promise.reject(new Error("WebSocket is not available in this environment"));
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    if (this.connectPromise && this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return this.connectPromise;
    }

    this.manuallyClosed = false;
    this.setState(this.reconnectAttempt > 0 ? "reconnecting" : "connecting");

    this.connectPromise = new Promise((resolve, reject) => {
      let settled = false;
      try {
        const socket = new WebSocket(this.url);
        this.ws = socket;

        socket.onopen = () => {
          this.reconnectAttempt = 0;
          this.setState("connected");
          this.startPing();
          settled = true;
          resolve();
        };

        socket.onmessage = (event) => this.handleMessage(event);

        socket.onerror = () => {
          this.setState("error");
          if (!settled) {
            settled = true;
            reject(new Error("Failed to connect to Deriv"));
          }
        };

        socket.onclose = () => {
          this.stopPing();
          this.rejectAllPending(new Error("Connection closed"));
          this.subscriptionHandlers.clear();
          if (this.manuallyClosed) {
            this.setState("disconnected");
          } else {
            this.setState("reconnecting");
            this.scheduleReconnect();
          }
        };
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to open WebSocket"));
      }
    });

    return this.connectPromise;
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.clearReconnectTimer();
    this.stopPing();
    this.rejectAllPending(new Error("Connection closed"));
    this.subscriptionHandlers.clear();
    this.ws?.close();
    this.ws = null;
    this.setState("disconnected");
  }

  reconnectNow(): Promise<void> {
    this.clearReconnectTimer();
    this.reconnectAttempt = 0;
    this.ws?.close();
    return this.connect();
  }

  private scheduleReconnect() {
    this.clearReconnectTimer();
    const attempt = this.reconnectAttempt;
    const delay =
      Math.min(BASE_RECONNECT_DELAY_MS * 2 ** attempt, MAX_RECONNECT_DELAY_MS) +
      Math.random() * 500;
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ ping: 1 }).catch(() => {});
    }, PING_INTERVAL_MS);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private rejectAllPending(error: Error) {
    this.pending.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(error);
    });
    this.pending.clear();
  }

  private nextReqId(): number {
    const id = this.reqCounter;
    this.reqCounter += 1;
    return id;
  }

  private async ensureOpen(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    await this.connect();
  }

  async send(
    request: Record<string, unknown>,
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<Record<string, unknown>> {
    await this.ensureOpen();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Deriv connection is not open");
    }
    const reqId = this.nextReqId();
    const payload = { ...request, req_id: reqId };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(reqId);
        reject(new Error("Request timed out"));
      }, timeoutMs);
      this.pending.set(reqId, { resolve, reject, timeout });
      this.ws!.send(JSON.stringify(payload));
    });
  }

  async subscribe(
    request: Record<string, unknown>,
    onData: StreamHandler,
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<{ initial: Record<string, unknown>; unsubscribe: () => void }> {
    await this.ensureOpen();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Deriv connection is not open");
    }
    const reqId = this.nextReqId();
    const payload = { ...request, subscribe: 1, req_id: reqId };

    const initial = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(reqId);
        reject(new Error("Subscription request timed out"));
      }, timeoutMs);
      this.pending.set(reqId, { resolve, reject, timeout });
      this.ws!.send(JSON.stringify(payload));
    });

    const subscriptionId = extractSubscriptionId(initial);
    let unsubscribed = false;
    if (subscriptionId) {
      this.subscriptionHandlers.set(subscriptionId, onData);
    }

    return {
      initial,
      unsubscribe: () => {
        if (unsubscribed) return;
        unsubscribed = true;
        if (subscriptionId) {
          this.subscriptionHandlers.delete(subscriptionId);
          this.forget(subscriptionId);
        }
      },
    };
  }

  private forget(subscriptionId: string): void {
    this.send({ forget: subscriptionId }).catch(() => {});
  }

  private handleMessage(event: MessageEvent) {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(event.data as string);
    } catch {
      return;
    }

    const reqId = typeof data.req_id === "number" ? data.req_id : null;
    if (reqId !== null) {
      const entry = this.pending.get(reqId);
      if (entry) {
        clearTimeout(entry.timeout);
        this.pending.delete(reqId);
        const errorField = data.error as
          | { code?: string; message?: string }
          | undefined;
        if (errorField) {
          entry.reject(new DerivApiError(errorField.message ?? "Deriv API error", errorField.code));
        } else {
          entry.resolve(data);
        }
        return;
      }
    }

    const subscriptionId = extractSubscriptionId(data);
    if (subscriptionId) {
      const handler = this.subscriptionHandlers.get(subscriptionId);
      if (handler && !data.error) {
        handler(data);
      }
    }
  }
}

type GlobalWithDerivConnection = typeof globalThis & {
  __volterm_deriv_connection__?: DerivSocketManager;
};

export function getDerivConnection(): DerivSocketManager {
  const globalScope = globalThis as GlobalWithDerivConnection;
  if (!globalScope.__volterm_deriv_connection__) {
    const url = process.env.NEXT_PUBLIC_DERIV_WS_URL || DEFAULT_DERIV_WS_URL;
    globalScope.__volterm_deriv_connection__ = new DerivSocketManager(url);
  }
  return globalScope.__volterm_deriv_connection__;
}
