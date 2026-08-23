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
      <div className="castle-bg" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--gold)" }}>
        <div style={{ fontSize: 36, animation: "sparklePulse 2s ease-in-out infinite" }}>🕯️</div>
        <div style={{ fontFamily: "var(--font-pixel)", fontSize: 13, letterSpacing: 2, color: "var(--gold)", textShadow: "0 0 12px rgba(224,182,74,0.5)" }}>Connecting to the castle...</div>
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
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          zIndex: 10,
          fontSize: 12,
          padding: "7px 14px",
          background: "transparent",
          border: "1.5px solid var(--gold)",
          borderRadius: 6,
          color: "var(--gold)",
          fontFamily: "var(--font-pixel)",
          letterSpacing: "0.5px",
          cursor: "pointer",
          boxShadow: "0 0 10px rgba(224,182,74,0.15)",
          transition: "box-shadow 0.2s ease, background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(224,182,74,0.12)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(224,182,74,0.35)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 10px rgba(224,182,74,0.15)";
        }}
      >
        {showAdmin ? "← Back" : "⚙ Admin"}

      </button>

      {showAdmin ? (
        <AdminPage gameState={gameState} getSocket={getSocket} />
      ) : gameState.phase === "lobby" ? (
        <LobbyPage gameState={gameState} />
      ) : gameState.phase === "countdown" ? (
        <CountdownPage count={countdown} />
      ) : gameState.phase === "ended" ? (
        <FinalPage results={results ?? gameState.finalResults} />
      ) : (
        <DashboardPage gameState={gameState} />
      )}
    </div>
  );
}