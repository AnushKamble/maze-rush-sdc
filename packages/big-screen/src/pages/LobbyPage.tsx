import { useMemo } from "react";
import type { GameState } from "@tmr/shared";

const PHONE_URL = import.meta.env.VITE_PHONE_CLIENT_URL || "http://localhost:5174";

export default function LobbyPage({ gameState }: { gameState: GameState }) {
  const qrTarget = encodeURIComponent(PHONE_URL);
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrTarget}&color=242-231-201&bgcolor=14-11-30&margin=10`;

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: `${(i * 13 + 7) % 100}%`,
        size: 1.5 + ((i * 3) % 3),
        duration: 8 + ((i * 4) % 12),
        delay: (i * 0.7) % 10,
        drift: `${((i % 9) - 4) * 18}px`,
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
        gap: "clamp(10px, 1.6vh, 22px)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        padding: "0 clamp(16px, 3vw, 48px)",
      }}
    >
      {/* Background floating particles */}
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

      {/* Title */}
      <h1
        className="pixel-heading glow-gold"
        style={{
          fontSize: "clamp(32px, 5vw, 64px)",
          color: "var(--gold)",
          margin: 0,
          letterSpacing: "clamp(2px, 0.3vw, 4px)",
          wordSpacing: "-3px",
          textShadow:
            "0 0 30px rgba(224,182,74,0.6), 0 0 8px rgba(224,182,74,0.4), 2px 2px 0 rgba(0,0,0,0.8)",
        }}
      >
        MAZE RUSH
      </h1>

      {/* Gold divider */}
      <div className="gold-divider" style={{ maxWidth: "min(460px, 40vw)" }}>
        <span style={{ fontSize: 11 }}>✦</span>
      </div>

      {/* Subtitle */}
      <p
        style={{
          color: "var(--parchment)",
          margin: 0,
          fontSize: "clamp(14px, 1.6vw, 20px)",
          opacity: 0.88,
          fontFamily: "var(--font-retro)",
          letterSpacing: "0.3px",
        }}
      >
        Scan the enchanted seal → speak your name → be sorted into a house
      </p>

      {/* QR Frame */}
      <div className="qr-frame" style={{ marginTop: "clamp(2px, 0.6vh, 8px)", marginBottom: "clamp(4px, 0.8vh, 12px)" }}>
        <img
          src={qrImgSrc}
          alt="Scan to join"
          width={220}
          height={220}
          style={{ borderRadius: 4, display: "block" }}
        />
        <span style={{ position: "absolute", top: -12, left: -12, color: "var(--gold)", fontSize: 18, opacity: 0.85 }}>✦</span>
        <span style={{ position: "absolute", top: -12, right: -12, color: "var(--gold)", fontSize: 18, opacity: 0.85 }}>✦</span>
        <span style={{ position: "absolute", bottom: -12, left: -12, color: "var(--gold)", fontSize: 18, opacity: 0.85 }}>✦</span>
        <span style={{ position: "absolute", bottom: -12, right: -12, color: "var(--gold)", fontSize: 18, opacity: 0.85 }}>✦</span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "clamp(32px, 5vw, 72px)", alignItems: "center" }}>
        <div className="stat-badge">
          <div
            className="glow-gold"
            style={{
              fontSize: "clamp(24px, 3.2vw, 42px)",
              fontFamily: "var(--font-pixel)",
              color: "var(--gold)",
              lineHeight: 1,
            }}
          >
            {gameState.totalPlayers}
          </div>
          <div
            style={{
              fontSize: "clamp(9px, 0.9vw, 13px)",
              color: "var(--dim)",
              fontFamily: "var(--font-pixel)",
              letterSpacing: "1.5px",
              marginTop: 4,
            }}
          >
            WIZARDS JOINED
          </div>
        </div>

        <div className="stat-badge">
          <div
            className="glow-gold"
            style={{
              fontSize: "clamp(24px, 3.2vw, 42px)",
              fontFamily: "var(--font-pixel)",
              color: "var(--gold)",
              lineHeight: 1,
            }}
          >
            {gameState.teams.length}
          </div>
          <div
            style={{
              fontSize: "clamp(9px, 0.9vw, 13px)",
              color: "var(--dim)",
              fontFamily: "var(--font-pixel)",
              letterSpacing: "1.5px",
              marginTop: 4,
            }}
          >
            HOUSES FORMING
          </div>
        </div>
      </div>

      {/* Waiting status */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(4px, 0.6vh, 10px)" }}>
        <p className="waiting-text" style={{ margin: 0 }}>
          Waiting for the Headmaster to open the gates...
        </p>
        <div className="gold-divider" style={{ maxWidth: "min(380px, 35vw)", opacity: 0.45 }}>
          <span style={{ fontSize: 9 }}>✦</span>
        </div>
      </div>

      {/* House tags (if any teams exist) */}
      {gameState.teams.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "clamp(6px, 1vw, 12px)",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "min(820px, 80vw)",
          }}
        >
          {gameState.teams.map((t) => (
            <div
              key={t.id}
              className="card house-card"
              style={{
                padding: "clamp(8px, 0.8vh, 12px) clamp(12px, 1.2vw, 20px)",
                display: "flex",
                gap: 10,
                alignItems: "center",
                borderColor: t.color,
                borderWidth: 2,
                background: `linear-gradient(135deg, ${t.color}18, rgba(30,26,51,0.9))`,
              }}
            >
              <span style={{ fontSize: "clamp(16px, 1.4vw, 22px)" }}>{t.icon}</span>
              <span style={{ fontWeight: 700, fontSize: "clamp(14px, 1.4vw, 20px)", color: "var(--parchment)" }}>
                {t.name}
              </span>
              <span style={{ color: "var(--dim)", fontSize: "clamp(12px, 1.1vw, 17px)" }}>{t.players.length}/5</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}