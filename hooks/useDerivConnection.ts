"use client";

import { useCallback, useEffect, useState } from "react";
import { getDerivConnection } from "@/lib/deriv/websocket";
import type { ConnectionState } from "@/types/market";

export function useDerivConnection() {
  const [state, setState] = useState<ConnectionState>("disconnected");

  useEffect(() => {
    const connection = getDerivConnection();
    const unsubscribe = connection.onStateChange(setState);
    connection.connect().catch(() => {});
    return unsubscribe;
  }, []);

  const reconnect = useCallback(() => {
    getDerivConnection()
      .reconnectNow()
      .catch(() => {});
  }, []);

  return { state, reconnect };
}
