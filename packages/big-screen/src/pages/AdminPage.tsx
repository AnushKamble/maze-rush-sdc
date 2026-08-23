import { useState, useEffect } from "react";
import type { GameState } from "@tmr/shared";
import type { Socket } from "socket.io-client";
import { sfx, unlockAudio } from "../sfx";

interface Props {
  gameState: GameState;
  getSocket: () => Socket | null;
}

export default function AdminPage({ gameState, getSocket }: Props) {
  const [adminToken, setAdminToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState(false);
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onAuthError = () => setAuthError(true);
    socket.on("admin:authError", onAuthError);
    return () => {
      socket.off("admin:authError", onAuthError);
    };
  }, [getSocket]);
  function emit(event: string, payload: Record<string, unknown> = {}) {
    sfx.click();
    setAuthError(false);
    const socket = getSocket();
    if (!socket) return;
    socket.emit(event as never, { adminToken, ...payload } as never);
  }
  if (!unlocked) {
    return (
      <div className="castle-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14 }}>
        <h2 style={{ color: "var(--gold)", fontSize: "clamp(18px, 3vw, 24px)" }}>🔑 Headmaster Access</h2>
        <input
          type="password"
          placeholder="Admin token"
          value={adminToken}
          onChange={(e) => {
            setAdminToken(e.target.value);
            setAuthError(false);
          }}
          className="parchment-input-bs"
          style={{ padding: 12, borderRadius: 6, border: "2px solid var(--gold)", width: 260, textAlign: "center", background: "var(--parchment)", color: "#2a1f10", fontSize: 18 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => {
            unlockAudio();
            sfx.click();
            const socket = getSocket();
            if (!socket) return;
            socket.emit("admin:verifyToken", { adminToken }, (res: { ok: boolean }) => {
              if (res.ok) setUnlocked(true);
              else setAuthError(true);
            });
          }}
        >
          Unlock Admin Panel
        </button>
        {authError ? (
          <p style={{ fontSize: 15, color: "var(--crimson)" }}>Wrong token. Double check it and try again.</p>) : (
          <p style={{ fontSize: 15, color: "var(--dim)" }}>Token isn't verified until your first action.</p>
          )}
      </div>
    );
  }

  return (
    <div className="castle-bg" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ color: "var(--gold)", margin: 0, fontSize: "clamp(18px, 2.4vw, 24px)" }}>⚙️ Admin Panel — Maze Rush</h2>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--dim)" }}>
          Token:
          <input
            type="password"
            value={adminToken}
            onChange={(e) => {
              setAdminToken(e.target.value);
              setAuthError(false);
            }}
            className="parchment-input-bs"
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: `2px solid ${authError ? "var(--crimson)" : "var(--gold)"}`,
              width: 180,
              background: "var(--parchment)",
              color: "#2a1f10",
              fontSize: 14,
            }}
          />
        </label>
      </div>
      {authError && (
        <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--crimson)", background: "rgba(178,58,82,0.12)", color: "var(--crimson)", fontSize: 15 }}>
          ⚠ Wrong admin token — that last action was rejected by the server.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 15, color: "var(--dim)", letterSpacing: 1 }}>GAME CONTROL</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" id="startBtn" onClick={() => emit("admin:startGame")}>▶ Start</button>
            <button className="btn btn-neutral" id="pauseBtn" onClick={() => emit("admin:pauseGame")}>⏸ Pause</button>
            <button className="btn btn-primary" id="resumeBtn" onClick={() => emit("admin:resumeGame")}>⏵ Resume</button>
            <button className="btn btn-danger" id="endBtn" onClick={() => emit("admin:endGame")}>⏹ End</button>
            <button className="btn btn-neutral" id="resetBtn" onClick={() => emit("admin:resetGame")}>↺ Reset</button>
          </div>
          <p style={{ fontSize: 14.5, color: "var(--dim)", marginTop: 8 }}>Phase: <b>{gameState.phase}</b></p>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 15, color: "var(--dim)", letterSpacing: 1 }}>FEATURED TEAM (BIG SCREEN)</h3>
          <select
            style={{ width: "100%", padding: 8, borderRadius: 8, fontSize: 14 }}
            value={gameState.featuredTeamId ?? ""}
            onChange={(e) => emit("admin:setFeaturedTeam", { teamId: e.target.value })}
          >
            <option value="">— pick a team —</option>
            {gameState.teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <p style={{ fontSize: 14.5, color: "var(--dim)", marginTop: 8 }}>
            {gameState.totalPlayers} wizard{gameState.totalPlayers === 1 ? "" : "s"} joined across {gameState.teams.length} house{gameState.teams.length === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 16, flex: 1, overflowY: "auto" }}>
        <h3 style={{ fontSize: 15, color: "var(--dim)", letterSpacing: 1 }}>LIVE HOUSE STATUS</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--dim)", fontSize: 13.5 }}>
              <th style={{ padding: 7 }}>House</th>
              <th style={{ padding: 7 }}>Level</th>
              <th style={{ padding: 7 }}>Players</th>
              <th style={{ padding: 7 }}>Lives left (min)</th>
              <th style={{ padding: 7 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {gameState.teams.map((t) => {
              const minLives = t.players.length > 0 ? Math.min(...t.players.map((p) => p.lives)) : 3;
              return (
                <tr key={t.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: 7 }}>{t.icon} {t.name}</td>
                  <td style={{ padding: 7 }}>L{t.progress.level}</td>
                  <td style={{ padding: 7 }}>{t.players.filter((p) => p.status === "connected").length}/{t.players.length}</td>
                  <td style={{ padding: 7, color: minLives === 0 ? "var(--crimson)" : "inherit" }}>{"🔮".repeat(minLives)}</td>
                  <td style={{ padding: 7 }}>{t.score.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
