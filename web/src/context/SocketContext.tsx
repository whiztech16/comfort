import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { apiRequest, getAccessToken } from "../lib/api";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const MAX_RETRIES = 3;

type SocketContextValue = {
  socket: Socket | null;
  connected: boolean;
};

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) return;

    let closed = false;
    let retries = 0;

    const s = io(SOCKET_URL, {
      auth: (cb) => cb({ token: getAccessToken() }),
      transports: ["websocket"],
      withCredentials: true,
    });

    async function reconnect() {
      if (closed || retries >= MAX_RETRIES) return;
      retries += 1;
      try {
        await apiRequest("/api/v1/notifications/unread-count");
      } catch {
        return;
      }
      if (!closed) s.connect();
    }

    s.on("connect", () => {
      retries = 0;
      setConnected(true);
    });
    s.on("disconnect", (reason) => {
      setConnected(false);
      if (reason === "io server disconnect") reconnect().catch(() => undefined);
    });
    s.on("connect_error", (err) => {
      if (err.message === "UNAUTHENTICATED") reconnect().catch(() => undefined);
    });

    setSocket(s);

    return () => {
      closed = true;
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}