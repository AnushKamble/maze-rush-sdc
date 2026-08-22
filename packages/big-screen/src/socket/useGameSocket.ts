import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
} from "@tmr/shared";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

/**
 * Connects to the game server and keeps `gameState` in sync with every
 * `game:stateUpdate` broadcast. Also exposes the raw socket for
 * page-specific listeners (countdown ticks, live events, admin acks).
 */
export function useGameSocket() {
  const socketRef = useRef<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const socket: AppSocket = io(SERVER_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("host:requestState", (state) => setGameState(state));
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("game:stateUpdate", (state) => setGameState(state));

    return () => {
      socket.disconnect();
    };
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  return { connected, gameState, getSocket };
}
