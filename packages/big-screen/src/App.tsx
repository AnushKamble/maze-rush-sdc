import { useEffect, useState } from "react";
import { useGameSocket } from "./socket/useGameSocket.js";
import LobbyPage from "./pages/LobbyPage.js";
import CountdownPage from "./pages/CountdownPage.js";
import DashboardPage from "./pages/DashboardPage.js";
import FinalPage from "./pages/FinalPage.js";
import AdminPage from "./pages/AdminPage.js";
import { sfx } from "./sfx.js";
import type { GameResults } from "@tmr/shared";

export default function App() {
  const { connected, gameState, getSocket } = useGameSocket();
  const [countdown, setCountdown] = useState<number | string>(3);
  const [results, setResults] = useState<GameResults | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onTick = (n: number) => setCountdown(n > 0 ? n : "GO!");
    const onEnded = (r: GameResults) => setResults(r);
    socket.on("game:countdownTick", onTick);
    socket.on("game:ended", onEnded);
    return () => {
      socket.off("game:countdownTick", onTick);
      socket.off("game:ended", onEnded);
    };
  }, [getSocket, gameState]);

  if (!connected || !gameState) {
    return (
      <div className="castle-bg" style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--gold)" }}>
        <div style={{ fontSize: 30 }}>🕯️</div>
        <div style={{ fontFamily: "var(--font-pixel)", fontSize: 14, letterSpacing: 1 }}>Connecting to the castle...</div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      <button
        onClick={() => {
          sfx.click();
          setShowAdmin((v) => !v);
        }}
        className="btn btn-neutral"
        style={{ position: "absolute", top: 10, right: 10, zIndex: 10, fontSize: 12, padding: "8px 12px" }}
      >
        {showAdmin ? "← Back" : "⚙️ Admin"}
      </button>

      {showAdmin ? (
        <AdminPage gameState={gameState} getSocket={getSocket} />
      ) : gameState.phase === "lobby" ? (
        <LobbyPage gameState={gameState} />
      ) : gameState.phase === "countdown" ? (
        <CountdownPage count={countdown} />
      ) : gameState.phase === "ended" ? (
        <FinalPage results={results} />
      ) : (
        <DashboardPage gameState={gameState} />
      )}
    </div>
  );
}
