import { useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import type { GameState } from "@tmr/shared";
import type { Socket } from "socket.io-client";
import { sfx, unlockAudio } from "../sfx";

interface Props {
  gameState: GameState;
  getSocket: () => Socket | null;
}

// Headmaster's Office palette — scoped to this page only, does not touch global tokens.css.
// Values match the design spec exactly: black + dark navy + antique gold + parchment + restrained burgundy.
const hqStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@500;600&display=swap');

  .hq-admin {
    --hq-bg: #090d14;
    --hq-panel: #0d121b;
    --hq-panel-light: #111722;
    --hq-gold: #c58a2a;
    --hq-gold-bright: #e0a83b;
    --hq-gold-dark: #704b18;
    --hq-parchment-muted: #c6b38d;
    --hq-text: #d8c7a2;
    --hq-text-dim: #82765f;
    --hq-burgundy: #4b1d24;
    --hq-burgundy-dark: #32151a;
    background: var(--hq-bg);
    color: var(--hq-text);
    position: relative;
    border: 1px solid #8c641f;
    font-family: 'Cormorant Garamond', Georgia, serif;
  }

  .hq-panel {
    position: relative;
    background: var(--hq-panel);
    border: 1px solid var(--hq-gold-dark);
    border-radius: 2px;
    padding: 16px 18px;
  }

  .hq-section-heading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 55px;
    margin: -4px 0 0 0;
    font-size: 20px;
    letter-spacing: 1.8px;
    color: #d19a32;
    font-variant: small-caps;
    font-family: 'Cinzel', Georgia, serif;
    font-weight: 600;
  }
  .hq-section-heading .hq-sparkle {
    color: var(--hq-gold);
    font-size: 15px;
  }

  .hq-corner {
    position: absolute;
    width: 18px;
    height: 18px;
    opacity: 0.9;
    pointer-events: none;
  }
  .hq-corner.tl { top: 3px; left: 3px; border-top: 1.5px solid var(--hq-gold); border-left: 1.5px solid var(--hq-gold); }
  .hq-corner.tr { top: 3px; right: 3px; border-top: 1.5px solid var(--hq-gold); border-right: 1.5px solid var(--hq-gold); }
  .hq-corner.bl { bottom: 3px; left: 3px; border-bottom: 1.5px solid var(--hq-gold); border-left: 1.5px solid var(--hq-gold); }
  .hq-corner.br { bottom: 3px; right: 3px; border-bottom: 1.5px solid var(--hq-gold); border-right: 1.5px solid var(--hq-gold); }

  .hq-corner.outer { width: 22px; height: 22px; opacity: 0.85; }
  .hq-corner.outer.tl { top: 6px; left: 6px; }
  .hq-corner.outer.tr { top: 6px; right: 6px; }
  .hq-corner.outer.bl { bottom: 6px; left: 6px; }
  .hq-corner.outer.br { bottom: 6px; right: 6px; }

  .hq-divider {
    height: 1px;
    margin: 0 0 12px;
    background: var(--hq-gold-dark);
  }

  .hq-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 105px;
    padding: 0 4px;
  }

  .hq-title-wrap {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .hq-crest {
    flex: 0 0 auto;
  }

  .hq-title {
    margin: 0;
    font-size: clamp(22px, 2.6vw, 34px);
    letter-spacing: 2px;
    color: #dca53b;
    font-variant: small-caps;
    font-family: 'Cinzel', Georgia, serif;
    font-weight: 600;
  }

  .hq-btn {
    font-size: 15px;
    letter-spacing: 0.6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-variant: small-caps;
    font-family: 'Cinzel', Georgia, serif;
    font-weight: 500;
    height: 54px;
    border-radius: 2px;
    box-shadow: inset 0 0 0 1px rgba(197,138,42,0.15);
    cursor: pointer;
    transition: filter 0.15s ease, border-color 0.15s ease;
  }
  .hq-btn:hover { filter: brightness(1.18); }

  .hq-phase {
    font-size: 15.5px;
    color: var(--hq-text-dim);
    margin-top: 12px;
  }
  .hq-phase b {
    color: var(--hq-text);
    font-weight: 600;
  }

  .hq-select-wrap {
    position: relative;
  }
  .hq-select {
    width: 100%;
    height: 52px;
    padding: 0 34px 0 12px;
    border-radius: 2px;
    font-size: 16px;
    background: #0a0f16;
    color: var(--hq-text);
    border: 1px solid var(--hq-gold-dark);
    appearance: none;
    -webkit-appearance: none;
    font-family: 'Cormorant Garamond', Georgia, serif;
  }
  .hq-select:focus {
    outline: none;
    border-color: var(--hq-gold);
  }
  .hq-select-chevron {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--hq-gold);
  }

  .hq-hint {
    font-size: 15.5px;
    color: var(--hq-text-dim);
    margin-top: 10px;
  }

  .hq-empty-inline {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 6px;
    height: 125px;
    border: 1px dashed var(--hq-gold-dark);
    background: #0a0f16;
    border-radius: 2px;
    margin-top: 10px;
  }
  .hq-empty-inline .hq-empty-title {
    font-size: 16.5px;
    letter-spacing: 1.2px;
    color: var(--hq-gold);
    font-variant: small-caps;
    font-family: 'Cinzel', Georgia, serif;
    font-weight: 600;
  }
  .hq-empty-inline .hq-empty-sub {
    font-size: 15.5px;
    color: var(--hq-parchment-muted);
    font-style: italic;
  }

  .hq-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 16px;
  }
  .hq-table thead th {
    text-align: left;
    padding: 9px 8px;
    font-size: 13.5px;
    letter-spacing: 0.8px;
    color: var(--hq-text-dim);
    border-bottom: 1px solid var(--hq-gold-dark);
    font-family: 'Cinzel', Georgia, serif;
    font-weight: 500;
  }
  .hq-table tbody tr {
    border-top: 1px solid rgba(112,75,24,0.35);
    transition: background 0.15s ease;
  }
  .hq-table tbody tr:hover {
    background: rgba(197,138,42,0.05);
  }
  .hq-table td {
    padding: 9px 8px;
    color: var(--hq-text);
  }

  .hq-house-cell {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .hq-house-accent {
    width: 4px;
    height: 18px;
    border-radius: 1px;
    flex: 0 0 auto;
  }

  .hq-empty-hall {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 8px;
    min-height: 430px;
    position: relative;
    overflow: hidden;
    border-radius: 2px;
  }
  .hq-empty-hall svg.hq-rune-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.16;
    width: 240px;
    height: 240px;
    pointer-events: none;
  }
  .hq-empty-hall .hq-empty-hall-title {
    position: relative;
    font-size: 26px;
    letter-spacing: 1.8px;
    color: var(--hq-gold);
    font-variant: small-caps;
    font-family: 'Cinzel', Georgia, serif;
    font-weight: 600;
  }
  .hq-empty-hall .hq-empty-hall-sub {
    position: relative;
    font-size: 17.5px;
    color: #9f9277;
    font-style: italic;
  }

  @media (max-width: 640px) {
    .hq-header { flex-wrap: wrap; gap: 10px; min-height: auto; padding: 10px 4px; }
  }
`;

// Button color variants exactly matching the spec.
const BTN_VARIANTS = {
  gate: { background: "#151a20", border: "#c58a2a", color: "#dca53b" },
  freeze: { background: "#11151d", border: "#8c641f", color: "#bba886" },
  continue: { background: "#302512", border: "#c58a2a", color: "#e0b14b" },
  close: { background: "#3a171d", border: "#8e3e42", color: "#d5a69a" },
  reset: { background: "#11151d", border: "#8c641f", color: "#c6b38d" },
} as const;

function btnStyle(variant: keyof typeof BTN_VARIANTS, extra?: CSSProperties): CSSProperties {
  const v = BTN_VARIANTS[variant];
  return {
    background: v.background,
    border: `1px solid ${v.border}`,
    color: v.color,
    ...extra,
  };
}

function HqCrest() {
  return (
    <svg width="52" height="52" viewBox="0 0 30 30" className="hq-crest" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15 2 L26 6 V15 C26 21.5 21 25.5 15 28 C9 25.5 4 21.5 4 15 V6 Z"
        fill="#0d121b"
        stroke="#c58a2a"
        strokeWidth="1.3"
      />
      <path d="M15 6 L21 8.5 V15 C21 19 18.3 21.8 15 23.5 C11.7 21.8 9 19 9 15 V8.5 Z" fill="none" stroke="#c58a2a" strokeWidth="0.8" opacity="0.6" />
      <text x="15" y="18.5" textAnchor="middle" fontSize="10" fontFamily="'Cinzel', Georgia, serif" fill="#e0a83b" fontWeight="700">H</text>
    </svg>
  );
}

// Monochrome inline SVG icons — currentColor so each icon matches its button's own text color exactly.
function IconGate() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 14V6L8 2L13 6V14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 14V9H10V14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3 14H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconSnowflake() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1V15M2.5 4L13.5 12M2.5 12L13.5 4M8 1L6.3 3M8 1L9.7 3M8 15L6.3 13M8 15L9.7 13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 1.5V14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 2.5H12L10 5L12 7.5H4" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 8A5 5 0 1 1 11.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13 2V5.5H9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HqCorners({ outer = false }: { outer?: boolean }) {
  const cls = outer ? "hq-corner outer" : "hq-corner";
  return (
    <>
      <span className={`${cls} tl`} />
      <span className={`${cls} tr`} />
      <span className={`${cls} bl`} />
      <span className={`${cls} br`} />
    </>
  );
}

function HqHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="hq-section-heading">
      <span className="hq-sparkle">✦</span>
      {children}
      <span className="hq-sparkle">✦</span>
    </h3>
  );
}

// Faint alchemical seal behind the empty "Great Hall" state — SVG only, kept barely visible.
function HqRuneBg() {
  return (
    <svg className="hq-rune-bg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" fill="none" stroke="#704b18" strokeWidth="1" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#704b18" strokeWidth="1" />
      <polygon points="100,20 172,140 28,140" fill="none" stroke="#704b18" strokeWidth="1" />
      <polygon points="100,180 28,60 172,60" fill="none" stroke="#704b18" strokeWidth="1" />
    </svg>
  );
}

export default function AdminPage({ gameState, getSocket }: Props) {
  const [adminToken, setAdminToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  function emit(event: string, payload: Record<string, unknown> = {}) {
    sfx.click();
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
          onChange={(e) => setAdminToken(e.target.value)}
          className="parchment-input-bs"
          style={{ padding: 12, borderRadius: 6, border: "2px solid var(--gold)", width: 260, textAlign: "center", background: "var(--parchment)", color: "#2a1f10", fontSize: 18 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => {
            unlockAudio();
            sfx.click();
            setUnlocked(true);
          }}
        >
          Unlock Admin Panel
        </button>
        <p style={{ fontSize: 15, color: "var(--dim)" }}>Token isn't verified until your first action — the server rejects it silently if wrong.</p>
      </div>
    );
  }

  const hasTeams = gameState.teams.length > 0;

  return (
    <div className="hq-admin" style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
      <style>{hqStyles}</style>
      <HqCorners outer />

      {/* Header — Back/Return button lives in App.tsx around this page; not present in this file to restyle. */}
      <div className="hq-header">
        <div className="hq-title-wrap">
          <HqCrest />
          <h2 className="hq-title">Headmaster's Office — Maze Rush</h2>
        </div>
        {/* If a Back button is rendered here by a parent, relabel it "‹ RETURN TO LOBBY" using the 270×52px angular-corner style. */}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14 }} className="hq-top-grid">
        <div className="hq-panel">
          <HqCorners />
          <HqHeading>Ceremony Control</HqHeading>
          <div className="hq-divider" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="hq-btn" id="startBtn" style={btnStyle("gate", { flex: "1 1 240px" })} onClick={() => emit("admin:startGame")}>
                <IconGate /> Open the Gates
              </button>
              <button className="hq-btn" id="pauseBtn" style={btnStyle("freeze", { flex: "1 1 240px" })} onClick={() => emit("admin:pauseGame")}>
                <IconSnowflake /> Freeze Ceremony
              </button>
              <button className="hq-btn" id="resumeBtn" style={btnStyle("continue", { flex: "1 1 180px" })} onClick={() => emit("admin:resumeGame")}>
                Continue <IconArrowRight />
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="hq-btn" id="endBtn" style={btnStyle("close", { flex: "1 1 240px" })} onClick={() => emit("admin:endGame")}>
                <IconFlag /> Close Ceremony
              </button>
              <button className="hq-btn" id="resetBtn" style={btnStyle("reset", { flex: "1 1 240px" })} onClick={() => emit("admin:resetGame")}>
                <IconRefresh /> Reset Ceremony
              </button>
            </div>
          </div>
          <p className="hq-phase">Phase: <b>{gameState.phase}</b></p>
        </div>

        <div className="hq-panel">
          <HqCorners />
          <HqHeading>Great Hall Display</HqHeading>
          <div className="hq-divider" />
          <div className="hq-select-wrap">
            <select
              className="hq-select"
              value={gameState.featuredTeamId ?? ""}
              onChange={(e) => emit("admin:setFeaturedTeam", { teamId: e.target.value })}
            >
              <option value="">— Select a House —</option>
              {gameState.teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <span className="hq-select-chevron"><IconChevronDown /></span>
          </div>

          {hasTeams ? (
            <p className="hq-hint">
              {gameState.totalPlayers} wizard{gameState.totalPlayers === 1 ? "" : "s"} joined across {gameState.teams.length} house{gameState.teams.length === 1 ? "" : "s"}.
            </p>
          ) : (
            <div className="hq-empty-inline">
              <span className="hq-empty-title">The Great Hall Awaits</span>
              <span className="hq-empty-sub">Select a house to feature on the big screen.</span>
            </div>
          )}
        </div>
      </div>

      <div className="hq-panel" style={{ flex: 1, overflowY: "auto" }}>
        <HqCorners />
        <HqHeading>Live House Status</HqHeading>
        <div className="hq-divider" />

        {hasTeams ? (
          <table className="hq-table">
            <thead>
              <tr>
                <th>House</th>
                <th>Level</th>
                <th>Players</th>
                <th>Lives left (min)</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {gameState.teams.map((t) => {
                const minLives = t.players.length > 0 ? Math.min(...t.players.map((p) => p.lives)) : 3;
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="hq-house-cell">
                        <span className="hq-house-accent" style={{ background: t.color }} />
                        <span>{t.icon} {t.name}</span>
                      </div>
                    </td>
                    <td>L{t.progress.level}</td>
                    <td>{t.players.filter((p) => p.status === "connected").length}/{t.players.length}</td>
                    <td style={{ color: minLives === 0 ? "#8e3e42" : "inherit" }}>{"🔮".repeat(minLives)}</td>
                    <td>{t.score.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="hq-empty-hall">
            <HqRuneBg />
            <span className="hq-empty-hall-title">✦ The Great Hall is Quiet ✦</span>
            <span className="hq-empty-hall-sub">No wizards have entered the ceremony yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}