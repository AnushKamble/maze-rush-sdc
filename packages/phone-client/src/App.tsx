import { useGameSocket } from "./socket/useGameSocket.js";
import JoinPage from "./pages/JoinPage.js";
import WaitingPage from "./pages/WaitingPage.js";
import GamePage from "./pages/GamePage.js";

export default function App() {
  const { connected, self, team, gameState, join, reportProgress } = useGameSocket();

  if (!connected) {
    return (
      <div className="castle-bg" style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--gold)" }}>
        <div style={{ fontSize: 30 }} className="torch">🕯️</div>
        <div style={{ fontFamily: "var(--font-pixel)", fontSize: "clamp(11px, 3.4vw, 13px)", letterSpacing: 1 }}>Summoning the castle...</div>
      </div>
    );
  }

  if (!self) {
    return <JoinPage onJoin={join} />;
  }

  const phase = gameState?.phase ?? "lobby";
  const gameHasStarted = phase === "live" || phase === "paused" || phase === "ended";

  if (!gameHasStarted) {
    return <WaitingPage team={team} />;
  }

  return <GamePage playerName={self.name} team={team} onProgress={reportProgress} />;
}
