import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, PlayerSelfView, PlayerJoinAck, GameState } from "@tmr/shared";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export interface TeamInfo {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export function useGameSocket() {
  const socketRef = useRef<AppSocket | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [self, setSelf] = useState<PlayerSelfView | null>(null);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [rehydrating, setRehydrating] = useState(false);

  useEffect(() => {
    const socket: AppSocket = io(SERVER_URL, { transports: ["websocket", "polling"], withCredentials : true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const existingId = playerIdRef.current;
      if(existingId){
        setRehydrating(true);
        socket.emit("player:rehydrate", { playerId: existingId }, (ack) => {
        if(ack.ok && ack.player){
          setSelf(ack.player);
          const savedTeam = sessionStorage.getItem("tmr_teamInfo");
          if (savedTeam) {
            setTeam(JSON.parse(savedTeam));
          }
        }
        else{
          playerIdRef.current = null;
          sessionStorage.removeItem("tmr_playerId");
          sessionStorage.removeItem("tmr_teamInfo");
          setSelf(null);
          setTeam(null);
        }
        })
      }
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("player:selfUpdate", (view) => setSelf(view));
    socket.on("game:stateUpdate", (state) => setGameState(state));

    return () => {
      socket.disconnect();
    };
  }, []);

  const join = useCallback((name: string): Promise<PlayerJoinAck> => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket) return resolve({ ok: false, error: "Not connected" });
      socket.emit("player:join", { name }, (ack) => {
        if (ack.ok && ack.player) {
          setSelf(ack.player);
          playerIdRef.current = ack.player.id;
          sessionStorage.setItem("tmr_playerId", ack.player.id);
          if (ack.teamId && ack.teamName) {
            setTeam({ id: ack.teamId, name: ack.teamName, color: ack.teamColor ?? "#e0b64a", icon: ack.teamIcon ?? "✦" });
          }
        }
        resolve(ack);
      });
    });
  }, []);

  /** Reports the local single-player engine's score/level/lives so the server can roll it into the team total. */
  const reportProgress = useCallback((score: number, level: number, lives: number, gameOver?: boolean) => {
    socketRef.current?.emit("player:progress", { score, level, lives, gameOver });
  }, []);

  return { connected, self, team, gameState, join, reportProgress, rehydrating };
}
