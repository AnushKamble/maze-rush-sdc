import { useEffect, useRef, useState } from "react";
import { GameEngine, type EngineSnapshot } from "../game/GameEngine";
import { cellAt, LEVELS, type Dir } from "../game/mazes";
import { sfx } from "../game/sfx";
import type { TeamInfo } from "../socket/useGameSocket";

const CELL_PX = 28;
const SWIPE_MIN_DISTANCE = 20;

// Torch sconces on the border walls — spaced down both sides, adapts to each level's height.
function torchRows(height: number): number[] {
  const rows: number[] = [];
  for (let y = 1; y < height - 1; y += 4) rows.push(y);
  return rows;
}

interface Props {
  playerName: string;
  team: TeamInfo | null;
  onProgress: (score: number, level: number, lives: number, gameOver?: boolean) => void;
}

export default function GamePage({ playerName, team, onProgress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [snap, setSnap] = useState<EngineSnapshot | null>(null);
  const [flash, setFlash] = useState(false);
  const [needsRotate, setNeedsRotate] = useState(false);
  const lastReported = useRef<{ score: number; level: number; lives: number; gameOver: boolean } | null>(null);
  const soundState = useRef({ score: 0, phase: "playing" as EngineSnapshot["phase"] });
  const canvasDims = useRef({ w: 0, h: 0 });

  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  // ---- orientation gate for the landscape level ----
  useEffect(() => {
    function checkOrientation() {
      const level = engineRef.current?.snapshot();
      const requiresLandscape = level?.requiresLandscape ?? false;
      setNeedsRotate(requiresLandscape && window.innerWidth < window.innerHeight);
    }
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    const interval = setInterval(checkOrientation, 500); // catches level transitions between resize events
    return () => {
      window.removeEventListener("resize", checkOrientation);
      clearInterval(interval);
    };
  }, []);

  // ---- render loop ----
  useEffect(() => {
    const engine = engineRef.current!;
    let raf = 0;
    let last = performance.now();

    function frame(t: number) {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;

      if (!needsRotate) {
        const prevPhase = engine.phase;
        engine.update(dt);
        const s = engine.snapshot();

        const prev = soundState.current;
        if (s.score > prev.score) {
          const delta = s.score - prev.score;
          if (delta >= 50) sfx.powerUp();
          else sfx.eat();
        }
        if (prevPhase === "playing" && s.phase === "hit") {
          sfx.hit();
          setFlash(true);
          setTimeout(() => setFlash(false), 350);
        }
        if (prev.phase !== "levelTransition" && s.phase === "levelTransition") sfx.levelUp();
        if (prev.phase !== "gameOver" && s.phase === "gameOver") sfx.gameOver();
        if (prev.phase !== "victory" && s.phase === "victory") sfx.victory();
        soundState.current = { score: s.score, phase: s.phase };

        draw(engine);
        setSnap(s);

        const gameOver = s.phase === "gameOver" || s.phase === "victory";
        const prevReported = lastReported.current;
        if (!prevReported || prevReported.score !== s.score || prevReported.level !== s.levelDef.level || prevReported.lives !== s.lives || prevReported.gameOver !== gameOver) {
          lastReported.current = { score: s.score, level: s.levelDef.level, lives: s.lives, gameOver };
          onProgress(s.score, s.levelDef.level, s.lives, gameOver || undefined);
        }
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsRotate]);

  function draw(engine: GameEngine) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { playerX, playerY, playerOffset, playerDir, runes, guardians, powerUp, grid } = engine.getRenderState();
    const t = performance.now() / 1000;

    const w = grid.width * CELL_PX;
    const h = grid.height * CELL_PX;
    if (canvasDims.current.w !== w || canvasDims.current.h !== h) {
      canvas.width = w;
      canvas.height = h;
      canvasDims.current = { w, h };
    }

    ctx.clearRect(0, 0, w, h);

    const floorGrad = ctx.createLinearGradient(0, 0, 0, h);
    floorGrad.addColorStop(0, "#17132c");
    floorGrad.addColorStop(1, "#0d0b1a");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(90, 80, 130, 0.12)";
    ctx.lineWidth = 1;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (cellAt(grid, x, y) !== "#") {
          ctx.strokeRect(x * CELL_PX + 0.5, y * CELL_PX + 0.5, CELL_PX - 1, CELL_PX - 1);
        }
      }
    }

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (cellAt(grid, x, y) !== "#") continue;
        const px = x * CELL_PX;
        const py = y * CELL_PX;
        const stoneGrad = ctx.createLinearGradient(px, py, px, py + CELL_PX);
        stoneGrad.addColorStop(0, "#463d6b");
        stoneGrad.addColorStop(1, "#2e2748");
        ctx.fillStyle = stoneGrad;
        ctx.fillRect(px + 1, py + 1, CELL_PX - 2, CELL_PX - 2);
        ctx.strokeStyle = "rgba(15, 12, 30, 0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + CELL_PX * 0.33);
        ctx.lineTo(px + CELL_PX - 1, py + CELL_PX * 0.33);
        ctx.moveTo(px + 1, py + CELL_PX * 0.66);
        ctx.lineTo(px + CELL_PX - 1, py + CELL_PX * 0.66);
        ctx.stroke();
        ctx.strokeStyle = "#544a7d";
        ctx.strokeRect(px + 1.5, py + 1.5, CELL_PX - 3, CELL_PX - 3);
      }
    }

    for (const row of torchRows(grid.height)) {
      drawTorch(ctx, 0, row, t, 1);
      drawTorch(ctx, grid.width - 1, row, t, -1);
    }

    for (const key of runes) {
      const [rx, ry] = key.split(",").map(Number);
      const cx = rx * CELL_PX + CELL_PX / 2;
      const cy = ry * CELL_PX + CELL_PX / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 1.2 + rx + ry);
      ctx.fillStyle = "#f5d888";
      ctx.shadowColor = "#f5d888";
      ctx.shadowBlur = 4;
      const s = 4;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    }

    if (powerUp) {
      const cx = powerUp.x * CELL_PX + CELL_PX / 2;
      const cy = powerUp.y * CELL_PX + CELL_PX / 2;
      const pulse = 1 + Math.sin(t * 6) * 0.15;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#2f8f5b";
      ctx.shadowColor = "#5be08a";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#eafff0";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨", 0, 0);
      ctx.restore();
    }

    for (const g of guardians) {
      const gx = (g.x + (g.dir ? dirDx(g.dir) * g.offset : 0)) * CELL_PX + CELL_PX / 2;
      const gy = (g.y + (g.dir ? dirDy(g.dir) * g.offset : 0)) * CELL_PX + CELL_PX / 2;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.shadowColor = g.cfg.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = g.cfg.color;
      ctx.beginPath();
      ctx.arc(0, -1, CELL_PX * 0.34, Math.PI, 0);
      ctx.lineTo(CELL_PX * 0.34, CELL_PX * 0.3);
      for (let i = 0; i < 3; i++) {
        ctx.lineTo(CELL_PX * 0.34 - ((i + 0.5) * CELL_PX * 0.68) / 3, CELL_PX * (i % 2 === 0 ? 0.42 : 0.3));
      }
      ctx.lineTo(-CELL_PX * 0.34, CELL_PX * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-5, -4, 3, 0, Math.PI * 2);
      ctx.arc(5, -4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1330";
      ctx.beginPath();
      ctx.arc(-5, -4, 1.4, 0, Math.PI * 2);
      ctx.arc(5, -4, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    {
      const px = (playerX + (playerDir ? dirDx(playerDir) * playerOffset : 0)) * CELL_PX + CELL_PX / 2;
      const py = (playerY + (playerDir ? dirDy(playerDir) * playerOffset : 0)) * CELL_PX + CELL_PX / 2;
      const invuln = engine.now < engine.invulnerableUntil;
      const powered = engine.now < engine.poweredUntil;
      const blink = invuln && Math.floor(t * 10) % 2 === 0;
      const angle = dirAngle(playerDir);
      const bob = playerDir ? Math.sin(t * 14) * 1.4 : 0;
      const robeColor = team?.color ?? "#3d5ba0";

      if (playerDir) {
        const back = { x: -dirDx(playerDir), y: -dirDy(playerDir) };
        for (let i = 1; i <= 2; i++) {
          ctx.globalAlpha = 0.15 / i;
          ctx.fillStyle = "#c9a9f5";
          ctx.beginPath();
          ctx.arc(px + back.x * i * 7, py + back.y * i * 7, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (!blink) {
        ctx.save();
        ctx.translate(px, py + bob);
        ctx.rotate(angle);
        if (powered) {
          ctx.shadowColor = "#f5d888";
          ctx.shadowBlur = 12;
        }
        ctx.fillStyle = powered ? "#f5d888" : robeColor;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(7, 8);
        ctx.lineTo(-7, 8);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#f0c9a0";
        ctx.beginPath();
        ctx.arc(0, -8, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a1330";
        ctx.beginPath();
        ctx.moveTo(0, -19);
        ctx.lineTo(4.5, -9);
        ctx.lineTo(-4.5, -9);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#8a6a3a";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(6, -2);
        ctx.lineTo(12, -2);
        ctx.stroke();
        ctx.fillStyle = "#f5d888";
        ctx.beginPath();
        ctx.arc(12, -2, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawTorch(ctx: CanvasRenderingContext2D, cellX: number, cellY: number, t: number, facing: 1 | -1) {
    const cx = cellX * CELL_PX + CELL_PX / 2 + facing * (CELL_PX * 0.12);
    const cy = cellY * CELL_PX + CELL_PX * 0.42;
    const flicker = 0.75 + Math.sin(t * 9 + cellY * 3) * 0.15 + Math.sin(t * 23 + cellY) * 0.08;

    const glowR = CELL_PX * 1.5 * flicker;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    glow.addColorStop(0, `rgba(230, 150, 60, ${0.28 * flicker})`);
    glow.addColorStop(1, "rgba(230, 150, 60, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2a2440";
    ctx.fillRect(cx - 2, cy - 1, 4, 8);

    ctx.save();
    ctx.translate(cx, cy - 4);
    ctx.scale(flicker, flicker);
    ctx.fillStyle = "#e0813a";
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(4, 0, 0, -7);
    ctx.quadraticCurveTo(-4, 0, 0, 6);
    ctx.fill();
    ctx.fillStyle = "#f5d888";
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.quadraticCurveTo(2, -1, 0, -4);
    ctx.quadraticCurveTo(-2, -1, 0, 3);
    ctx.fill();
    ctx.restore();
  }

  // ---- keyboard input ----
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, Exclude<Dir, null>> = {
        ArrowUp: "U",
        ArrowDown: "D",
        ArrowLeft: "L",
        ArrowRight: "R",
        w: "U",
        s: "D",
        a: "L",
        d: "R",
        W: "U",
        S: "D",
        A: "L",
        D: "R",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        engineRef.current?.setDesiredDirection(dir);
      }
    }
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- swipe input (non-passive so we can block page scroll during a swipe) ----
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return undefined;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
    function onMove(e: TouchEvent) {
      if (!tracking) return;
      e.preventDefault();
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const dx = currentX - startX;
      const dy = currentY - startY;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      
      if (Math.max(adx, ady) >= SWIPE_MIN_DISTANCE) {
        const dir: Exclude<Dir, null> = adx > ady ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U");
        engineRef.current?.setDesiredDirection(dir);
        // Reset start coordinates to current position to support continuous dragging/swiping
        startX = currentX;
        startY = currentY;
      }
    }
    function onEnd(e: TouchEvent) {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (Math.max(adx, ady) < SWIPE_MIN_DISTANCE) return;
      const dir: Exclude<Dir, null> = adx > ady ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U";
      engineRef.current?.setDesiredDirection(dir);
    }
    function onCancel() {
      tracking = false;
    }

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: false });
    el.addEventListener("touchcancel", onCancel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, []);

  function skipTransition() {
    sfx.click();
    const engine = engineRef.current;
    if (engine && engine.phase === "levelTransition") {
      engine.transitionUntil = engine.now;
    }
  }

  if (!snap) return null;

  if (needsRotate) {
    return (
      <div className="castle-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 46 }}>🔄</div>
        <div className="pixel-heading" style={{ fontSize: "clamp(17px, 5vw, 21px)", color: "var(--gold)", lineHeight: 1.7 }}>
          Rotate Your Device
        </div>
        <div style={{ fontSize: "clamp(16px, 4vw, 18px)", color: "var(--parchment)", maxWidth: 300, lineHeight: 1.5 }}>
          {snap.levelDef.name} is a wide open ground — turn your phone sideways to landscape to play it.
        </div>
      </div>
    );
  }

  const livesDisplay = Array.from({ length: 3 }).map((_, i) => (i < snap.lives ? "🔮" : "◌"));
  const cleared = snap.totalRunes > 0 ? snap.totalRunes - snap.runesRemaining : 0;

  return (
    <div
      ref={wrapperRef}
      className="castle-bg"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: 12,
        gap: 8,
        position: "relative",
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none"
      }}
    >
      {/* HUD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <div className="stone-panel" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", fontSize: "clamp(17px, 4.2vw, 20px)", fontWeight: 700 }}>
          <span style={{ width: 11, height: 11, borderRadius: 2, flexShrink: 0, background: team?.color ?? "var(--gold)", boxShadow: `0 0 6px ${team?.color ?? "var(--gold)"}` }} />
          <span>{playerName}</span>
          <span style={{ color: "var(--dim)", fontWeight: 600 }}>· {team?.icon ?? "✦"} {team?.name ?? "House"}</span>
        </div>
        <div style={{ display: "flex", gap: 3, fontSize: "clamp(20px, 5vw, 24px)" }}>
          {livesDisplay.map((h, i) => (
            <span key={i}>{h}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: "clamp(14px, 3.4vw, 16px)", color: "var(--dim)", fontFamily: "var(--font-pixel)", letterSpacing: 1 }}>
          LVL {snap.levelDef.level}/10 · {snap.levelDef.name}
        </div>
        <div className="text-glow-soft" style={{ fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 700, color: "var(--gold)" }}>
          {snap.score.toLocaleString()}
        </div>
      </div>

      <div style={{ width: "100%", height: 8, background: "var(--panel)", border: "1px solid var(--stone-line)", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${snap.totalRunes > 0 ? Math.min(100, (cleared / snap.totalRunes) * 100) : 0}%`,
            background: "linear-gradient(90deg, var(--emerald), var(--gold-bright))",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* canvas */}
      <div style={{ display: "flex", justifyContent: "center", flex: 1, alignItems: "center", minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "auto",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            aspectRatio: `${snap.gridWidth} / ${snap.gridHeight}`,
            borderRadius: 6,
            border: "3px solid var(--gold)",
            boxShadow: flash ? "0 0 0 4px var(--crimson)" : "0 0 0 2px #12101f, 0 4px 12px rgba(0,0,0,0.5)",
            transition: "box-shadow 0.15s ease",
            touchAction: "none",
          }}
        />
      </div>

      <div style={{ fontSize: "clamp(13px, 3vw, 15px)", color: "var(--dim)", textAlign: "center" }}>
        Swipe or use arrow keys — clear every rune to advance.
      </div>

      {/* hit message */}
      {snap.phase === "hit" && snap.message && (
        <Overlay>
          <div style={{ fontSize: 30 }}>💥</div>
          <div className="pixel-heading" style={{ fontSize: "clamp(18px, 5vw, 22px)", color: "var(--crimson)" }}>{snap.message}</div>
          <div style={{ fontSize: "clamp(15px, 3.6vw, 17px)", color: "var(--dim)" }}>Life lost — {snap.lives} remaining</div>
        </Overlay>
      )}

      {/* level transition */}
      {snap.phase === "levelTransition" && (
        <Overlay onClick={skipTransition}>
          <div style={{ fontSize: 32 }}>🏰</div>
          <div style={{ fontSize: "clamp(14px, 3.4vw, 16px)", color: "var(--dim)", letterSpacing: 1, fontFamily: "var(--font-pixel)" }}>LEVEL CLEARED</div>
          <div style={{ fontSize: "clamp(15px, 3.6vw, 17px)", color: "var(--parchment)", margin: "8px 0 4px" }}>Entering</div>
          <div className="text-glow-soft" style={{ fontFamily: "var(--font-pixel)", fontSize: "clamp(21px, 6vw, 28px)", color: "var(--gold)" }}>
            {LEVELS[snap.levelIndex + 1]?.name ?? "the final trial"}
          </div>
          <div style={{ fontSize: "clamp(13px, 3vw, 15px)", color: "var(--dim)", marginTop: 12 }}>tap to continue</div>
        </Overlay>
      )}

      {/* game over / victory — a proper end-game card */}
      {(snap.phase === "gameOver" || snap.phase === "victory") && (
        <Overlay solid>
          <EndGameCard
            victory={snap.phase === "victory"}
            score={snap.score}
            highestLevel={engineRef.current?.highestLevelReached ?? snap.levelDef.level}
            lives={snap.lives}
            team={team}
            playerName={playerName}
          />
        </Overlay>
      )}
    </div>
  );
}

function EndGameCard({
  victory,
  score,
  highestLevel,
  lives,
  team,
  playerName,
}: {
  victory: boolean;
  score: number;
  highestLevel: number;
  lives: number;
  team: TeamInfo | null;
  playerName: string;
}) {
  const levelName = LEVELS[Math.min(highestLevel, LEVELS.length) - 1]?.name ?? LEVELS[0].name;
  const rows: Array<[string, string]> = [
    ["Final Score", score.toLocaleString()],
    ["Highest Level", `${highestLevel}/10 · ${levelName}`],
    ...(victory ? ([["Lives Remaining", String(lives)]] as Array<[string, string]>) : []),
    ["House", team ? `${team.icon} ${team.name}` : "—"],
  ];

  return (
    <div
      className="stone-panel end-card-pop"
      style={{
        width: "100%",
        maxWidth: 340,
        padding: "26px 22px",
        borderColor: victory ? "var(--gold)" : "var(--crimson)",
        boxShadow: `0 0 0 1px rgba(224,182,74,0.15), 0 0 26px ${victory ? "rgba(224,182,74,0.35)" : "rgba(178,58,82,0.35)"}, 0 8px 22px rgba(0,0,0,0.5)`,
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 8 }}>{victory ? "🏆" : "⚰️"}</div>
      <h1
        className="pixel-heading"
        style={{ fontSize: victory ? "clamp(17px, 4.6vw, 20px)" : "clamp(18px, 4.8vw, 21px)", color: victory ? "var(--gold)" : "var(--crimson)", margin: "6px 0 4px", lineHeight: 1.6 }}
      >
        {victory ? "You Conquered the Maze" : "The Spell Failed"}
      </h1>
      <div style={{ fontSize: "clamp(15px, 3.6vw, 17px)", color: "var(--dim)", marginBottom: 18 }}>{playerName}'s trial has ended</div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} style={{ borderTop: "1px solid var(--stone-line)" }}>
              <td style={{ padding: "10px 4px", textAlign: "left", fontSize: "clamp(13px, 3.2vw, 14.5px)", color: "var(--dim)", letterSpacing: 0.5, fontFamily: "var(--font-pixel)", verticalAlign: "middle" }}>
                {label}
              </td>
              <td style={{ padding: "10px 4px", textAlign: "right", fontSize: "clamp(16px, 4vw, 18px)", color: "var(--gold)", fontWeight: 700, verticalAlign: "middle" }}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: "clamp(13px, 3vw, 14.5px)", color: "var(--dim)", marginTop: 18, lineHeight: 1.5 }}>
        Your score has joined {team?.name ?? "your house"}'s total on the great hall board.
      </div>
    </div>
  );
}

function Overlay({ children, solid, onClick }: { children: React.ReactNode; solid?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 6,
        background: solid ? "rgba(11,9,23,0.96)" : "rgba(11,9,23,0.88)",
        zIndex: 5,
        padding: 20,
      }}
    >
      {children}
    </div>
  );
}

function dirDx(d: Exclude<Dir, null>) {
  return d === "L" ? -1 : d === "R" ? 1 : 0;
}
function dirDy(d: Exclude<Dir, null>) {
  return d === "U" ? -1 : d === "D" ? 1 : 0;
}
function dirAngle(d: Dir) {
  switch (d) {
    case "U":
      return 0;
    case "R":
      return Math.PI / 2;
    case "D":
      return Math.PI;
    case "L":
      return -Math.PI / 2;
    default:
      return 0;
  }
}
