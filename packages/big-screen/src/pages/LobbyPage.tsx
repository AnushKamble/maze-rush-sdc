import { useMemo } from "react";
import type { GameState } from "@tmr/shared";

const PHONE_URL = import.meta.env.VITE_PHONE_CLIENT_URL || "http://localhost:5174";

export default function LobbyPage({ gameState }: { gameState: GameState }) {
  const qrTarget = encodeURIComponent(PHONE_URL);
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrTarget}&color=242-231-201&bgcolor=11-9-23`;

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
    <div className="castle-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 24, textAlign: "center", position: "relative", overflow: "hidden" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="magic-particle"
          style={
            {
              left: p.left,
              bottom: 0,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--drift": p.drift,
            } as React.CSSProperties
          }
        />
      ))}

      <h1 className="pixel-heading glow-gold" style={{ fontSize: "clamp(40px, 6vw, 60px)", color: "var(--gold)", margin: 0 }}>
        MAZE RUSH
      </h1>
      <p style={{ color: "var(--parchment)", margin: 0, fontSize: "clamp(19px, 2.4vw, 26px)", opacity: 0.92 }}>
        Scan the enchanted seal → speak your name → be sorted into a house
      </p>

      <div style={{ padding: 14, border: "3px solid var(--gold)", borderRadius: 8, background: "var(--panel)", boxShadow: "0 0 24px rgba(224,182,74,0.2)" }}>
        <img src={qrImgSrc} alt="Scan to join" width={220} height={220} style={{ borderRadius: 4, display: "block" }} />
      </div>

      <div style={{ display: "flex", gap: 60 }}>
        <div>
          <div className="glow-gold" style={{ fontSize: "clamp(34px, 4vw, 46px)", fontFamily: "var(--font-pixel)", color: "var(--gold)" }}>{gameState.totalPlayers}</div>
          <div style={{ fontSize: 16, color: "var(--dim)", fontWeight: 700, letterSpacing: 1 }}>WIZARDS JOINED</div>
        </div>
        <div>
          <div className="glow-gold" style={{ fontSize: "clamp(34px, 4vw, 46px)", fontFamily: "var(--font-pixel)", color: "var(--gold)" }}>{gameState.teams.length}</div>
          <div style={{ fontSize: 16, color: "var(--dim)", fontWeight: 700, letterSpacing: 1 }}>HOUSES FORMING</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 820 }}>
        {gameState.teams.map((t) => (
          <div key={t.id} className="card" style={{ padding: "12px 20px", display: "flex", gap: 10, alignItems: "center", borderColor: t.color, borderWidth: 2 }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 21, color: "var(--parchment)" }}>{t.name}</span>
            <span style={{ color: "var(--dim)", fontSize: 17 }}>{t.players.length}/5</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 18, color: "var(--dim)" }}>Waiting for the Headmaster to open the gates...</p>
    </div>
  );
}
