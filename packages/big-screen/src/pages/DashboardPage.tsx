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

function IconShieldMark() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 1L28 5V16C28 24 22 30 15 33C8 30 2 24 2 16V5L15 1Z" stroke="var(--gold)" strokeWidth="1.4" />
      <path d="M15 8V26M9 17H21" stroke="var(--gold)" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4H17V10C17 13.3 14.8 16 12 16C9.2 16 7 13.3 7 10V4Z" stroke="var(--gold)" strokeWidth="1.5" />
      <path d="M7 5H4V7C4 9 5.5 10.5 7.5 11" stroke="var(--gold)" strokeWidth="1.5" />
      <path d="M17 5H20V7C20 9 18.5 10.5 16.5 11" stroke="var(--gold)" strokeWidth="1.5" />
      <path d="M12 16V19M9 21H15L14 19H10L9 21Z" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5L12 1Z" />
    </svg>
  );
}

function IconScroll() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="16" height="12" rx="1" stroke="var(--gold)" strokeWidth="1.5" />
      <path d="M4 9H20M4 12H20M4 15H14" stroke="var(--gold)" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

function IconHourglass() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 1H14M2 19H14M2 1C2 6 6 7 8 10C6 13 2 14 2 19M14 1C14 6 10 7 8 10C10 13 14 14 14 19" stroke="var(--gold)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function IconPerson() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--parchment-muted)" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 22C4 17 7.5 14 12 14C16.5 14 20 17 20 22" />
    </svg>
  );
}

function HouseShield({ color, icon }: { color: string; icon: string }) {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M15 1L28 5V16C28 24 22 30 15 33C8 30 2 24 2 16V5L15 1Z" fill="var(--panel-2)" stroke={color} strokeWidth="1.6" />
      <text x="15" y="20" textAnchor="middle" fontSize="13" fill={color}>{icon}</text>
    </svg>
  );
}

export default function DashboardPage({ gameState }: { gameState: GameState }) {
  const rows = useMemo(() => buildRows(gameState.teams), [gameState.teams]);
  const leader = gameState.teams.find((t) => t.id === gameState.featuredTeamId) ?? [...gameState.teams].sort((a, b) => b.score - a.score)[0];

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

  const timeLow = gameState.timeRemainingSec !== null && gameState.timeRemainingSec <= 30;

  return (
    <div className="castle-bg" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 20, gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 88 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <IconShieldMark />
          <div>
            <h1 style={{ fontSize: 36, color: "var(--gold-bright)", margin: 0, letterSpacing: 3 }}>Maze Rush</h1>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontStyle: "italic", color: "var(--parchment-muted)", letterSpacing: 1 }}>The maze awaits.</div>
          </div>
        </div>
        <div className="card" style={{ padding: "10px 22px", textAlign: "center", minWidth: 150 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <IconHourglass />
            <div style={{ fontFamily: "var(--font-heading-sm)", fontSize: 26, color: timeLow ? "#c98a92" : "var(--gold-bright)" }}>{timeString(gameState.timeRemainingSec)}</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--dim)", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>Time Remaining</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
        <div className="card" style={{ flex: 1.45, overflowY: "auto", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <IconTrophy />
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2, color: "var(--gold-bright)", fontFamily: "var(--font-heading-sm)", textTransform: "uppercase" }}>
              House Standings
            </div>
          </div>
          {rows.length === 0 && (
            <div style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 18, color: "var(--parchment-muted)", padding: "14px 6px" }}>
              No houses have entered the fray.
            </div>
          )}
          {rows.length > 0 && (
            <div style={{ display: "flex", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--dim)", padding: "6px 12px", fontFamily: "var(--font-heading-sm)" }}>
              <div style={{ width: 30 }}>Rank</div>
              <div style={{ width: 40 }} />
              <div style={{ flex: "0 0 160px" }}>House</div>
              <div style={{ flex: "0 0 46px" }}>Level</div>
              <div style={{ flex: 1 }}>Wizards</div>
              <div style={{ minWidth: 90, textAlign: "right" }}>Score</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((row) => (
              <div
                key={row.team.id}
                className={flashIds.has(row.team.id) ? "score-flash" : undefined}
                style={{
                  order: row.rank,
                  transition: "order 0.6s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px",
                  borderTop: "1px solid var(--stone-line)",
                  background: row.rank === 1 ? "rgba(199,154,59,0.06)" : "transparent",
                  borderLeft: row.rank === 1 ? "2px solid var(--gold)" : "2px solid transparent",
                }}
              >
                <div style={{ width: 30, textAlign: "center", fontFamily: "var(--font-heading-sm)", fontSize: 16, color: row.rank === 1 ? "var(--gold-bright)" : "var(--dim)" }}>
                  {row.rank}
                </div>
                <div style={{ width: 40 }}><HouseShield color={row.team.color} icon={row.team.icon} /></div>
                <div style={{ flex: "0 0 160px", fontWeight: 600, fontSize: 20, color: "var(--parchment)", fontFamily: "var(--font-body)" }}>{row.team.name}</div>
                <div style={{ fontSize: 15, color: "var(--dim)", fontFamily: "var(--font-heading-sm)", flex: "0 0 46px" }}>L{row.level}</div>
                <div style={{ flex: 1, display: "flex", gap: 3, alignItems: "center" }}>
                  {Array.from({ length: row.playersTotal }).map((_, i) => (
                    <span key={i} style={{ width: 7, height: 7, background: i < row.playersActive ? row.team.color : "var(--stone-line)", border: "1px solid var(--bronze)" }} />
                  ))}
                </div>
                <div style={{ fontFamily: "var(--font-heading-sm)", fontSize: 17, minWidth: 90, textAlign: "right", color: "var(--gold-bright)" }}>{row.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <div className="card" style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconStar />
              <div style={{ fontSize: 16, color: "var(--gold-bright)", fontWeight: 700, letterSpacing: 2, fontFamily: "var(--font-heading-sm)", textTransform: "uppercase" }}>House Spotlight</div>
            </div>
            {leader ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, marginBottom: 4 }}>
                  <HouseShield color={leader.color} icon={leader.icon} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: "var(--parchment)", fontFamily: "var(--font-body)" }}>{leader.name}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontStyle: "italic", color: "var(--parchment-muted)", marginBottom: 14, fontFamily: "var(--font-body)" }}>The banner that leads.</div>
                <div style={{ display: "flex", justifyContent: "space-around", fontSize: 13, color: "var(--dim)", marginBottom: 14, letterSpacing: 1, textTransform: "uppercase", fontFamily: "var(--font-heading-sm)" }}>
                  <div style={{ textAlign: "center" }}><b style={{ display: "block", fontSize: 22, color: "var(--gold-bright)" }}>{leader.progress.level}</b>Level</div>
                  <div style={{ textAlign: "center" }}><b style={{ display: "block", fontSize: 22, color: "var(--gold-bright)" }}>{leader.score.toLocaleString()}</b>Score</div>
                  <div style={{ textAlign: "center" }}><b style={{ display: "block", fontSize: 22, color: "var(--gold-bright)" }}>{leader.players.length}/5</b>Wizards</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--dim)", letterSpacing: 1.5, fontFamily: "var(--font-heading-sm)", textTransform: "uppercase", marginBottom: 8, borderTop: "1px solid var(--stone-line)", paddingTop: 10 }}>
                  Individual Contributions
                </div>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...leader.players].sort((a, b) => b.score - a.score).map((p) => {
                    const pct = leader.score > 0 ? Math.max(4, (p.score / leader.score) * 100) : 4;
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
                        <IconPerson />
                        <span style={{ flex: "0 0 78px", color: "var(--parchment)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-body)" }}>{p.name}</span>
                        <div style={{ flex: 1, height: 8, background: "var(--bg-2)", border: "1px solid var(--bronze)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "var(--gold)", transition: "width 0.4s ease" }} />
                        </div>
                        <span style={{ flex: "0 0 44px", textAlign: "right", color: "var(--gold-bright)", fontSize: 14, fontFamily: "var(--font-heading-sm)" }}>{p.score}</span>
                      </div>
                    );
                  })}
                  {leader.players.length === 0 && (
                    <div style={{ fontSize: 16, fontStyle: "italic", color: "var(--parchment-muted)", fontFamily: "var(--font-body)" }}>No wizards have joined this house.</div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--parchment-muted)", fontSize: 17, fontStyle: "italic", fontFamily: "var(--font-body)", textAlign: "center" }}>
                Choose a house, and let its story be told.
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 16, maxHeight: 170, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconScroll />
              <div style={{ fontSize: 15, color: "var(--gold-bright)", fontWeight: 700, letterSpacing: 2, fontFamily: "var(--font-heading-sm)", textTransform: "uppercase" }}>Recent Events</div>
            </div>
            {gameState.recentEvents.length === 0 && (
              <div style={{ fontSize: 16, fontStyle: "italic", color: "var(--parchment-muted)", textAlign: "center", padding: "8px 0", fontFamily: "var(--font-body)" }}>
                The Hall keeps its silence.
              </div>
            )}
            {gameState.recentEvents.map((e) => (
              <div key={e.id} className="event-enter" style={{ fontSize: 16, padding: "7px 0", borderBottom: "1px solid var(--stone-line)", color: "var(--parchment)", fontFamily: "var(--font-body)" }}>
                {e.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}