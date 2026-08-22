import { useEffect, useMemo, useRef, useState } from "react";
import type { GameState, LeaderboardRow, Team } from "@tmr/shared";

function buildRows(teams: Team[]): LeaderboardRow[] {
  const sorted = [...teams].sort((a, b) => (b.progress.level !== a.progress.level ? b.progress.level - a.progress.level : b.score - a.score));
  return sorted.map((t, i) => ({
    rank: i + 1,
    team: { id: t.id, name: t.name, color: t.color, darkColor: t.darkColor, icon: t.icon },
    level: t.progress.level,
    score: t.score,
    playersActive: t.players.filter((p) => p.status === "connected").length,
    playersTotal: t.players.length,
  }));
}

function timeString(sec: number | null): string {
  if (sec === null) return "--:--";
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function DashboardPage({ gameState }: { gameState: GameState }) {
  const rows = useMemo(() => buildRows(gameState.teams), [gameState.teams]);
  const leader = gameState.teams.find((t) => t.id === gameState.featuredTeamId) ?? [...gameState.teams].sort((a, b) => b.score - a.score)[0];

  // Flash a row briefly when its score increases — cheap, no extra deps.
  const prevScores = useRef<Record<string, number>>({});
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const changed: string[] = [];
    for (const t of gameState.teams) {
      const prev = prevScores.current[t.id];
      if (prev !== undefined && t.score > prev) changed.push(t.id);
      prevScores.current[t.id] = t.score;
    }
    if (changed.length > 0) {
      setFlashIds(new Set(changed));
      const timer = setTimeout(() => setFlashIds(new Set()), 650);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gameState.teams]);

  return (
    <div className="castle-bg" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 16, gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="pixel-heading glow-gold" style={{ fontSize: 26, color: "var(--gold)", margin: 0 }}>MAZE RUSH</h1>
        <div className="card" style={{ padding: "8px 18px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-pixel)", fontSize: 22, color: "var(--crimson)" }}>{timeString(gameState.timeRemainingSec)}</div>
          <div style={{ fontSize: 15, color: "var(--dim)", fontWeight: 700 }}>TIME REMAINING</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 0 }}>
        {/* Leaderboard — rows reorder with an animated transition as scores/levels change */}
        <div className="card" style={{ flex: 1.3, overflowY: "auto", padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.5, color: "var(--gold)", padding: "2px 4px 10px", fontFamily: "var(--font-pixel)" }}>
            🏆 HOUSE STANDINGS
          </div>
          {rows.length === 0 && <div style={{ fontSize: 16, color: "var(--dim)", padding: "2px 6px 8px" }}>No houses yet — waiting for wizards to join</div>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((row) => (
              <div
                key={row.team.id}
                className={flashIds.has(row.team.id) ? "score-flash" : undefined}
                style={{
                  order: row.rank,
                  transition: "order 0.6s ease, transform 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: row.rank === 1 ? "rgba(224,182,74,0.14)" : "var(--panel)",
                  border: row.rank === 1 ? "1px solid var(--gold)" : "1px solid var(--stone-line)",
                  marginBottom: 6,
                }}
              >
                <div style={{ width: 24, textAlign: "center", fontFamily: "var(--font-pixel)", fontSize: 14, color: row.rank === 1 ? "var(--gold)" : "var(--dim)" }}>
                  {row.rank === 1 ? "👑" : row.rank}
                </div>
                <div style={{ width: 30, height: 30, borderRadius: 4, background: row.team.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, border: "1px solid rgba(0,0,0,0.3)" }}>
                  {row.team.icon}
                </div>
                <div style={{ flex: "0 0 160px", fontWeight: 700, fontSize: 19, color: "var(--parchment)" }}>{row.team.name}</div>
                <div style={{ fontSize: 14, color: "var(--dim)", fontFamily: "var(--font-pixel)", flex: "0 0 46px" }}>L{row.level}</div>
                <div style={{ flex: 1, display: "flex", gap: 2 }}>
                  {Array.from({ length: row.playersTotal }).map((_, i) => (
                    <span key={i} style={{ width: 8, height: 8, borderRadius: 2, background: i < row.playersActive ? row.team.color : "var(--stone-line)" }} />
                  ))}
                </div>
                <div style={{ fontFamily: "var(--font-pixel)", fontSize: 15, minWidth: 80, textAlign: "right", color: "var(--gold)" }}>{row.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Spotlight on the leading house + events */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
          <div className="card" style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ fontSize: 14, color: "var(--dim)", fontWeight: 700, letterSpacing: 1.5, fontFamily: "var(--font-pixel)" }}>🔮 HOUSE SPOTLIGHT</div>
            {leader ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 10 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 5, background: leader.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{leader.icon}</span>
                  <div style={{ fontSize: 21, fontWeight: 700, color: "var(--parchment)" }}>{leader.name}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", fontSize: 15, color: "var(--dim)", marginBottom: 12 }}>
                  <div><b style={{ display: "block", fontSize: 19, color: "var(--gold)", fontFamily: "var(--font-pixel)" }}>{leader.progress.level}</b>Level</div>
                  <div><b style={{ display: "block", fontSize: 19, color: "var(--gold)", fontFamily: "var(--font-pixel)" }}>{leader.score.toLocaleString()}</b>Score</div>
                  <div><b style={{ display: "block", fontSize: 19, color: "var(--gold)", fontFamily: "var(--font-pixel)" }}>{leader.players.length}/5</b>Wizards</div>
                </div>
                <div style={{ fontSize: 13, color: "var(--dim)", letterSpacing: 1, fontFamily: "var(--font-pixel)", marginBottom: 6 }}>INDIVIDUAL CONTRIBUTIONS</div>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {[...leader.players].sort((a, b) => b.score - a.score).map((p) => {
                    const pct = leader.score > 0 ? Math.max(4, (p.score / leader.score) * 100) : 4;
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5 }}>
                        <span style={{ flex: "0 0 84px", color: "var(--parchment)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        <span style={{ flex: "0 0 30px", color: "var(--dim)" }}>{"🔮".repeat(p.lives)}</span>
                        <div style={{ flex: 1, height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: leader.color, transition: "width 0.4s ease" }} />
                        </div>
                        <span style={{ flex: "0 0 44px", textAlign: "right", color: "var(--gold)", fontSize: 13.5 }}>{p.score}</span>
                      </div>
                    );
                  })}
                  {leader.players.length === 0 && <div style={{ fontSize: 15, color: "var(--dim)" }}>No wizards in this house yet</div>}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dim)", fontSize: 16 }}>No houses yet</div>
            )}
          </div>

          <div className="card" style={{ padding: 12, maxHeight: 170, overflowY: "auto" }}>
            <div style={{ fontSize: 14, color: "var(--dim)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, fontFamily: "var(--font-pixel)" }}>📜 RECENT EVENTS</div>
            {gameState.recentEvents.length === 0 && <div style={{ fontSize: 16, color: "var(--dim)" }}>No events yet</div>}
            {gameState.recentEvents.map((e) => (
              <div key={e.id} className="event-enter" style={{ fontSize: 15.5, padding: "6px 0", borderBottom: "1px solid var(--stone-line)", color: "var(--parchment)" }}>
                {e.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
