import type { TeamInfo } from "../socket/useGameSocket";

export default function WaitingPage({ team }: { team: TeamInfo | null }) {
  return (
    <div
      className="castle-bg"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 20, textAlign: "center", padding: 24 }}
    >
      <div style={{ fontSize: 44 }} className="torch">🕯️</div>
      <div className="stone-panel" style={{ padding: "20px 28px", maxWidth: 320 }}>
        <div style={{ fontSize: "clamp(14px, 3.4vw, 16px)", color: "var(--dim)", letterSpacing: 1, marginBottom: 10, fontFamily: "var(--font-pixel)" }}>
          SORTED INTO
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: "clamp(24px, 7vw, 32px)" }}>{team?.icon ?? "✦"}</span>
          <span style={{ fontSize: "clamp(26px, 7.5vw, 34px)", fontWeight: 700, color: team?.color ?? "var(--gold)" }}>
            {team?.name ?? "your house"}
          </span>
        </div>
      </div>
      <div style={{ fontSize: "clamp(18px, 5vw, 21px)", color: "var(--parchment)", opacity: 0.9 }}>
        The moving staircases are aligning...
      </div>
      <div style={{ fontSize: "clamp(15px, 3.8vw, 17px)", color: "var(--dim)", maxWidth: 320, lineHeight: 1.5 }}>
        Waiting for the Headmaster to open the gates. Your points will join {team?.name ?? "your house"}'s total once you run your trial.
      </div>
    </div>
  );
}
