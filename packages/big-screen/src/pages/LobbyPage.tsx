import { useMemo } from "react";
import type { GameState } from "@tmr/shared";

const PHONE_URL = import.meta.env.VITE_PHONE_CLIENT_URL || "http://localhost:5174";

export default function LobbyPage({ gameState }: { gameState: GameState }) {
  const qrTarget = encodeURIComponent(PHONE_URL);
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrTarget}&color=242-231-201&bgcolor=11-9-23`;

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        left: `${(i * 17) % 100}%`,
        size: 2 + ((i * 5) % 4),
        duration: 7 + ((i * 3) % 8),
        delay: (i * 0.5) % 8,
        drift: `${((i % 7) - 3) * 16}px`,
      })),
    []
  );

  return (
    <div
      className="castle-bg"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 28,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="magic-particle"
          style={{
            left: p.left,
            bottom: 0,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--drift": p.drift,
          } as React.CSSProperties}
        />
      ))}

      <h1
        className="pixel-heading glow-gold"
        style={{ fontSize: "clamp(48px, 7vw, 76px)", color: "var(--gold)", margin: 0, position: "relative", zIndex: 1 }}
      >
        MAZE RUSH
      </h1>

      <div style={{ display: "flex", gap: 32, fontSize: "clamp(15px, 1.6vw, 19px)", color: "var(--parchment)", opacity: 0.9, position: "relative", zIndex: 1 }}>
        <span>📷 Scan the seal</span>
        <span style={{ opacity: 0.4 }}>→</span>
        <span>🗣️ Speak your name</span>
        <span style={{ opacity: 0.4 }}>→</span>
        <span>🏰 Get sorted</span>
      </div>

      <div className="qr-frame-glow" style={{ padding: 16, border: "3px solid var(--gold)", borderRadius: 10, background: "var(--panel)", position: "relative", zIndex: 1 }}>
        <img src={qrImgSrc} alt="Scan to join" width={240} height={240} style={{ borderRadius: 6, display: "block" }} />
      </div>

      <div style={{ display: "flex", gap: 70, position: "relative", zIndex: 1 }}>
        <div>
          <div key={gameState.totalPlayers} className="glow-gold count-pop" style={{ fontSize: "clamp(38px, 4.5vw, 52px)", fontFamily: "var(--font-pixel)", color: "var(--gold)" }}>
            {gameState.totalPlayers}
          </div>
          <div style={{ fontSize: 16, color: "var(--dim)", fontWeight: 700, letterSpacing: 1 }}>WIZARDS JOINED</div>
        </div>
        <div>
          <div key={gameState.teams.length} className="glow-gold count-pop" style={{ fontSize: "clamp(38px, 4.5vw, 52px)", fontFamily: "var(--font-pixel)", color: "var(--gold)" }}>
            {gameState.teams.length}
          </div>
          <div style={{ fontSize: 16, color: "var(--dim)", fontWeight: 700, letterSpacing: 1 }}>HOUSES FORMING</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 860, position: "relative", zIndex: 1 }}>
        {gameState.teams.map((t) => (
          <div
            key={t.id}
            className="card house-card"
            style={{
              padding: "14px 22px",
              display: "flex",
              gap: 10,
              alignItems: "center",
              borderColor: t.color,
              borderWidth: 2,
              boxShadow: `0 0 14px ${t.color}33`,
            }}
          >
            <span style={{ fontSize: 24 }}>{t.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 22, color: "var(--parchment)" }}>{t.name}</span>
            <span style={{ color: "var(--dim)", fontSize: 17 }}>{t.players.length}/5</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 18, color: "var(--dim)", position: "relative", zIndex: 1 }}>
        Waiting for the Headmaster to open the gates<span className="ellipsis-loop" />
      </p>
    </div>
  );
}