export default function CountdownPage({ count }: { count: number | string }) {
  return (
    <div className="castle-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
      <div style={{ fontFamily: "var(--font-pixel)", fontSize: 20, color: "var(--dim)", letterSpacing: 2 }}>THE GATES OPEN IN</div>
      <div className="pixel-heading" style={{ fontSize: 180, color: "var(--gold)", textShadow: "0 0 30px rgba(240,201,95,0.5)" }}>{count}</div>
    </div>
  );
}
