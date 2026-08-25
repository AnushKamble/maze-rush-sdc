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
  const playerIdRef = useRef<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("tmr_playerId") : null
  );
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
        socket
        .timeout(6000)
        .emit("player:rehydrate", { playerId: existingId }, (err, ack: PlayerJoinAck | undefined) => {
        if (!err && ack?.ok && ack.player) {
          setSelf(ack.player);
          if (ack.teamId && ack.teamName) {
            const teamInfo: TeamInfo = {
              id: ack.teamId,
              name: ack.teamName,
              color: ack.teamColor ?? "#e0b64a",
              icon: ack.teamIcon ?? "✦",
            };
            setTeam(teamInfo);
            localStorage.setItem("tmr_teamInfo", JSON.stringify(teamInfo));
          }
        } 
        else {
          playerIdRef.current = null;
          localStorage.removeItem("tmr_playerId");
          localStorage.removeItem("tmr_teamInfo");
          setSelf(null);
          setTeam(null);
          }
          setRehydrating(false);
          });
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
          localStorage.setItem("tmr_playerId", ack.player.id);
          if (ack.teamId && ack.teamName) {
            const teamInfo: TeamInfo = {
              id: ack.teamId,
              name: ack.teamName,
              color: ack.teamColor ?? "#e0b64a",
              icon: ack.teamIcon ?? "✦",
            };
            setTeam(teamInfo);
            localStorage.setItem("tmr_teamInfo", JSON.stringify(teamInfo));
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
