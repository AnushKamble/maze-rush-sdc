import type { GameResults } from "@tmr/shared";

export default function FinalPage({ results }: { results: GameResults | null }) {
  if (!results) {
    return (
      <div className="castle-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <p style={{ color: "var(--dim)", fontSize: 20 }}>Awaiting the Headmaster's final word...</p>
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="castle-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 26 }}>
      <h1 className="pixel-heading glow-gold" style={{ fontSize: "clamp(32px, 5vw, 48px)", color: "var(--gold)", margin: 0 }}>
        THE TRIAL ENDS
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 460 }}>
        {results.results.slice(0, 10).map((r, i) => (
          <div key={r.teamId} className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px" }}>
            <span style={{ fontSize: 26 }}>{medals[i] ?? `#${r.rank}`}</span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 21, color: "var(--parchment)" }}>{r.teamName}</span>
            <span style={{ fontFamily: "var(--font-pixel)", fontSize: 16, color: "var(--gold)" }}>{r.score.toLocaleString()} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}
