import { useMemo, useState } from "react";
import type { PlayerJoinAck } from "@tmr/shared";
import { sfx, unlockAudio } from "../game/sfx";

export default function JoinPage({ onJoin }: { onJoin: (name: string) => Promise<PlayerJoinAck> }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        size: 2 + ((i * 7) % 3),
        duration: 6 + ((i * 3) % 6),
        delay: (i * 0.6) % 6,
        drift: `${((i % 5) - 2) * 12}px`,
      })),
    []
  );
  const stars = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        top: `${8 + ((i * 13) % 30)}%`,
        left: `${5 + ((i * 23) % 90)}%`,
        size: 2 + (i % 2),
        duration: 1.6 + (i % 3) * 0.5,
      })),
    []
  );

  async function handleJoin() {
    unlockAudio();
    sfx.click();
    if (!name.trim()) {
      setError("Speak your name, traveler");
      return;
    }
    setSubmitting(true);
    setError(null);
    const ack = await onJoin(name.trim());
    setSubmitting(false);
    if (!ack.ok) setError(ack.error ?? "The gates would not open");
  }

  return (
    <div
      className="castle-bg"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 18,
        padding: "24px 20px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* twinkling foreground stars */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="twinkle-star"
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "#fff",
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* rising magic particles */}
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

      {/* moon */}
      <div
        style={{
          position: "absolute",
          top: 26,
          right: 34,
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "var(--gold-bright)",
          boxShadow: "0 0 22px 6px rgba(245,216,136,0.35)",
        }}
      />

      {/* castle silhouette */}
      <svg
        width="100%"
        height="120"
        viewBox="0 0 300 120"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.9 }}
      >
        <g fill="#12101f">
          <rect x="0" y="70" width="300" height="50" />
          <rect x="20" y="40" width="26" height="80" />
          <rect x="14" y="30" width="8" height="14" />
          <rect x="44" y="30" width="8" height="14" />
          <rect x="120" y="20" width="34" height="100" />
          <rect x="112" y="8" width="10" height="16" />
          <rect x="134" y="8" width="10" height="16" />
          <rect x="150" y="8" width="10" height="16" />
          <rect x="230" y="46" width="28" height="74" />
          <rect x="224" y="36" width="8" height="14" />
          <rect x="254" y="36" width="8" height="14" />
          <rect x="70" y="55" width="18" height="65" />
          <rect x="180" y="58" width="20" height="62" />
        </g>
        <g fill="var(--gold-bright)" opacity="0.85" className="twinkle-star" style={{ animationDuration: "2.4s" }}>
          <rect x="30" y="55" width="5" height="7" />
          <rect x="130" y="40" width="5" height="7" />
          <rect x="140" y="60" width="5" height="7" />
          <rect x="238" y="65" width="5" height="7" />
          <rect x="76" y="70" width="4" height="6" />
          <rect x="187" y="75" width="4" height="6" />
        </g>
      </svg>

      <div style={{ zIndex: 1, marginTop: -30 }}>
        <h1
          className="pixel-heading glow-gold"
          style={{ fontSize: "clamp(34px, 11vw, 48px)", color: "var(--gold)", margin: 0, lineHeight: 1.4 }}
        >
          MAZE
          <br />
          RUSH
        </h1>
        <div style={{ fontFamily: "var(--font-pixel)", fontSize: "clamp(13px, 3.6vw, 15px)", color: "var(--dim)", marginTop: 12, letterSpacing: 2 }}>
          ✦ THE ENCHANTED MAZE ✦
        </div>
      </div>

      <div style={{ fontSize: "clamp(18px, 5vw, 21px)", color: "var(--parchment)", zIndex: 1, lineHeight: 1.4, opacity: 0.92 }}>
        Enter the castle. Find the exit. Beat the clock.
      </div>

      <div style={{ zIndex: 1, width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
        <input
          type="text"
          placeholder="Your wizard name"
          maxLength={14}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          className="parchment-input"
          style={{ fontSize: "clamp(20px, 5vw, 23px)" }}
        />
        <button onClick={handleJoin} disabled={submitting} className="pixel-btn primary" style={{ fontSize: "clamp(15px, 3.8vw, 17px)" }}>
          {submitting ? "Sorting..." : "Enter the Castle"}
        </button>
      </div>

      {error && (
        <div style={{ color: "var(--crimson)", fontSize: "clamp(16px, 4vw, 18px)", zIndex: 1 }}>{error}</div>
      )}
      <div style={{ fontSize: "clamp(15px, 3.6vw, 17px)", color: "var(--dim)", zIndex: 1, maxWidth: 300, lineHeight: 1.5 }}>
        Houses are assigned by the Sorting magic. 3 lives, runes for points — your score joins your house's total.
      </div>
    </div>
  );
}
