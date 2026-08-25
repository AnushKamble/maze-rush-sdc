// ============================================================
// Maze Rush — core arcade simulation.
// Continuous auto-movement + buffered turning, fixed-pattern
// guardians (never chase the player), collectible runes, one
// random power-up spawn at a time. A level is only ever complete
// when every rune on its board has been collected — a single,
// deterministic event — which is what guarantees the game can
// never silently skip or double-advance a level.
// ============================================================
import {
  DIR_VECTORS,
  LEVELS,
  MAX_LEVELS,
  OPPOSITE,
  POWERUP_DURATION_SEC,
  POWERUP_POINTS,
  RUNE_POINTS,
  TOTAL_LIVES,
  cellAt,
  isWalkable,
  type Dir,
  type GuardianConfig,
  type LevelDef,
  type MazeGrid,
} from "./mazes";

interface GuardianState {
  cfg: GuardianConfig;
  x: number;
  y: number;
  offset: number; // 0..1 progress into the current cell's movement
  dir: Dir;
  patternIndex: number;
  patternStepsDone: number;
}

export type GamePhase = "playing" | "hit" | "levelTransition" | "gameOver" | "victory";
export interface EngineInitialState {
  levelIndex: number;
  score: number;
  lives: number;
}

export interface EngineSnapshot {
  phase: GamePhase;
  score: number;
  lives: number;
  levelIndex: number;
  levelDef: LevelDef;
  runesRemaining: number;
  totalRunes: number;
  message: string | null;
  invulnerable: boolean;
  powered: boolean;
  gridWidth: number;
  gridHeight: number;
  requiresLandscape: boolean;
}

export class GameEngine {
  levelIndex = 0;
  score = 0;
  lives = TOTAL_LIVES;
  highestLevelReached = 1;

  grid: MazeGrid = LEVELS[0].grid;
  runes: Set<string>;
  totalRunesThisLevel = 0;

  playerX = 0;
  playerY = 0;
  playerOffset = 0;
  playerDir: Dir = null;
  bufferedDir: Dir = null;

  guardians: GuardianState[] = [];

  phase: GamePhase = "playing";
  invulnerableUntil = 0;
  poweredUntil = 0;
  transitionUntil = 0;
  hitCooldownUntil = 0;

  activePowerUp: { x: number; y: number } | null = null;
  nextPowerUpCheckAt = 0;

  now = 0;
  message: string | null = null;

  constructor(private onLevelStart?: (def: LevelDef) => void, initial?: EngineInitialState) {
    this.runes = new Set();
    const startIndex = initial ? Math.min(Math.max(Math.floor(initial.levelIndex), 0), MAX_LEVELS - 1) : 0;
    this.loadLevel(startIndex, false);
    if (initial) {
      this.score = Math.max(initial.score, 0);
      this.highestLevelReached = Math.max(this.highestLevelReached, startIndex + 1);
      if (initial.lives <= 0) {
        this.lives = 0;
        this.phase = "gameOver";
        this.message = "The spell failed!";
      } 
      else {
        this.lives = Math.min(initial.lives, TOTAL_LIVES);
      }
    }
  } 

  private levelDef(): LevelDef {
    return LEVELS[this.levelIndex];
  }

  private cellWalkable(x: number, y: number): boolean {
    return isWalkable(this.grid, x, y);
  }

  loadLevel(index: number, keepScoreAndLives: boolean) {
    this.levelIndex = index;
    const def = LEVELS[index];
    this.grid = def.grid;
    this.highestLevelReached = Math.max(this.highestLevelReached, def.level);

    this.runes = new Set();
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        if (cellAt(this.grid, x, y) === ".") this.runes.add(`${x},${y}`);
      }
    }
    this.totalRunesThisLevel = this.runes.size;

    this.playerX = def.playerStart.x;
    this.playerY = def.playerStart.y;
    this.playerOffset = 0;
    this.playerDir = null;
    this.bufferedDir = null;

    this.guardians = def.guardians.map((cfg) => ({
      cfg,
      x: cfg.start.x,
      y: cfg.start.y,
      offset: 0,
      dir: cfg.behavior === "corridor_walker" ? cfg.initialDir ?? "L" : cfg.pattern?.[0]?.dir ?? "L",
      patternIndex: 0,
      patternStepsDone: 0,
    }));

    this.activePowerUp = null;
    this.nextPowerUpCheckAt = this.now + 3;

    if (!keepScoreAndLives) {
      this.score = 0;
      this.lives = TOTAL_LIVES;
    }
    this.phase = "playing";
    this.message = null;
    this.onLevelStart?.(def);
  }

  setDesiredDirection(dir: Exclude<Dir, null>) {
    if (this.phase !== "playing") return;
    this.bufferedDir = dir;
  }

  private tryStartMoving() {
    if (this.playerDir === null && this.bufferedDir) {
      const v = DIR_VECTORS[this.bufferedDir];
      if (this.cellWalkable(this.playerX + v.x, this.playerY + v.y)) {
        this.playerDir = this.bufferedDir;
      }
    }
  }

  update(dtSeconds: number) {
    this.now += dtSeconds;
    const def = this.levelDef();

    if (this.phase === "hit") {
      if (this.now >= this.hitCooldownUntil) {
        this.respawnAfterHit();
      }
      return;
    }
    if (this.phase === "levelTransition") {
      if (this.now >= this.transitionUntil) {
        this.advanceLevel();
      }
      return;
    }
    if (this.phase === "gameOver" || this.phase === "victory") return;

    this.tryStartMoving();
    this.updatePlayer(dtSeconds, def.playerSpeed);
    this.updateGuardians(dtSeconds, def.guardianSpeed);
    this.updatePowerUps(def);
    this.checkCollisions();

    // A level is complete exactly once, exactly when its last rune is gone —
    // deterministic and can't double-fire (this branch is skipped entirely
    // once phase leaves "playing" above).
    if (this.phase === "playing" && this.runes.size === 0) {
      this.completeLevel();
    }
  }

  private updatePlayer(dt: number, speed: number) {
    if (this.playerDir === null) return;
    this.playerOffset += dt * speed;

    while (this.playerOffset >= 1) {
      this.playerOffset -= 1;
      const v = DIR_VECTORS[this.playerDir];
      this.playerX += v.x;
      this.playerY += v.y;

      this.collectAt(this.playerX, this.playerY);

      if (this.bufferedDir) {
        const bv = DIR_VECTORS[this.bufferedDir];
        if (this.cellWalkable(this.playerX + bv.x, this.playerY + bv.y)) {
          this.playerDir = this.bufferedDir;
        }
      }
      const fv = DIR_VECTORS[this.playerDir];
      if (!this.cellWalkable(this.playerX + fv.x, this.playerY + fv.y)) {
        this.playerDir = null;
        this.playerOffset = 0;
        break;
      }
    }
  }

  private collectAt(x: number, y: number) {
    const key = `${x},${y}`;
    if (this.runes.has(key)) {
      this.runes.delete(key);
      this.score += RUNE_POINTS;
    }
    if (this.activePowerUp && this.activePowerUp.x === x && this.activePowerUp.y === y) {
      this.activePowerUp = null;
      this.score += POWERUP_POINTS;
      this.poweredUntil = this.now + POWERUP_DURATION_SEC;
      this.nextPowerUpCheckAt = this.now + 6;
    }
  }

  private updatePowerUps(def: LevelDef) {
    if (this.activePowerUp || def.powerUpCells.length === 0) return;
    if (this.now < this.nextPowerUpCheckAt) return;
    if (Math.random() < def.powerUpChance) {
      const candidates = def.powerUpCells.filter((c) => !(c.x === this.playerX && c.y === this.playerY));
      if (candidates.length > 0) {
        this.activePowerUp = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
    this.nextPowerUpCheckAt = this.now + 2.5;
  }

  private updateGuardians(dt: number, speed: number) {
    for (const g of this.guardians) {
      this.stepGuardian(g, dt, speed);
    }
  }

  private stepGuardian(g: GuardianState, dt: number, speed: number) {
    if (!g.dir) return;
    g.offset += dt * speed;

    while (g.offset >= 1) {
      g.offset -= 1;
      const v = DIR_VECTORS[g.dir];
      g.x += v.x;
      g.y += v.y;
      this.pickNextGuardianDirection(g);
    }
  }

  private pickNextGuardianDirection(g: GuardianState) {
    const { cfg } = g;

    if (cfg.behavior === "fixed_pattern" || cfg.behavior === "circular") {
      const pattern = cfg.pattern ?? [];
      if (pattern.length === 0) return;
      g.patternStepsDone += 1;
      let step = pattern[g.patternIndex];
      while (g.patternStepsDone >= Math.max(step.steps, 1)) {
        g.patternIndex = (g.patternIndex + 1) % pattern.length;
        g.patternStepsDone = 0;
        step = pattern[g.patternIndex];
        if (step.steps > 0) break;
      }
      const candidate = DIR_VECTORS[step.dir];
      if (this.cellWalkable(g.x + candidate.x, g.y + candidate.y)) {
        g.dir = step.dir;
      } else {
        g.dir = this.firstWalkable(g.x, g.y, g.dir);
      }
      return;
    }

    if (cfg.behavior === "corridor_walker") {
      const v = g.dir ? DIR_VECTORS[g.dir] : { x: 0, y: 0 };
      if (!g.dir || !this.cellWalkable(g.x + v.x, g.y + v.y)) {
        g.dir = g.dir ? OPPOSITE[g.dir] : "L";
      }
      return;
    }

    if (cfg.behavior === "randomized") {
      const dirs: Exclude<Dir, null>[] = ["U", "D", "L", "R"];
      const valid = dirs.filter((d) => {
        const v = DIR_VECTORS[d];
        return this.cellWalkable(g.x + v.x, g.y + v.y);
      });
      const nonReverse = g.dir ? valid.filter((d) => d !== OPPOSITE[g.dir as Exclude<Dir, null>]) : valid;
      const pool = nonReverse.length > 0 ? nonReverse : valid;
      if (pool.length > 0) {
        g.dir = pool[Math.floor(Math.random() * pool.length)];
      }
    }
  }

  private firstWalkable(x: number, y: number, preferred: Dir): Exclude<Dir, null> {
    const order: Exclude<Dir, null>[] = ["U", "D", "L", "R"];
    for (const d of order) {
      const v = DIR_VECTORS[d];
      if (this.cellWalkable(x + v.x, y + v.y)) return d;
    }
    return preferred ?? "U";
  }

  private checkCollisions() {
    if (this.now < this.invulnerableUntil) return;
    for (const g of this.guardians) {
      if (g.x === this.playerX && g.y === this.playerY) {
        if (this.now < this.poweredUntil) continue;
        this.triggerHit();
        return;
      }
    }
  }

  private triggerHit() {
    this.lives -= 1;
    this.message = "The spell failed!";
    if (this.lives <= 0) {
      this.phase = "gameOver";
      return;
    }
    this.phase = "hit";
    this.hitCooldownUntil = this.now + 1.1;
  }

  private respawnAfterHit() {
    const def = this.levelDef();
    this.playerX = def.playerStart.x;
    this.playerY = def.playerStart.y;
    this.playerOffset = 0;
    this.playerDir = null;
    this.bufferedDir = null;
    this.guardians = def.guardians.map((cfg) => ({
      cfg,
      x: cfg.start.x,
      y: cfg.start.y,
      offset: 0,
      dir: cfg.behavior === "corridor_walker" ? cfg.initialDir ?? "L" : cfg.pattern?.[0]?.dir ?? "L",
      patternIndex: 0,
      patternStepsDone: 0,
    }));
    this.invulnerableUntil = this.now + def.invulnerabilitySec;
    this.phase = "playing";
    this.message = null;
  }

  private completeLevel() {
    const isLast = this.levelIndex >= MAX_LEVELS - 1;
    if (isLast) {
      this.phase = "victory";
    } else {
      this.phase = "levelTransition";
      this.transitionUntil = this.now + 2.6;
      this.message = `${this.levelDef().name} — Cleared!`;
    }
  }

  private advanceLevel() {
    this.loadLevel(this.levelIndex + 1, true);
  }

  snapshot(): EngineSnapshot {
    const def = this.levelDef();
    return {
      phase: this.phase,
      score: this.score,
      lives: this.lives,
      levelIndex: this.levelIndex,
      levelDef: def,
      runesRemaining: this.runes.size,
      totalRunes: this.totalRunesThisLevel,
      message: this.message,
      invulnerable: this.now < this.invulnerableUntil,
      powered: this.now < this.poweredUntil,
      gridWidth: this.grid.width,
      gridHeight: this.grid.height,
      requiresLandscape: def.requiresLandscape,
    };
  }

  getRenderState() {
    return {
      playerX: this.playerX,
      playerY: this.playerY,
      playerOffset: this.playerOffset,
      playerDir: this.playerDir,
      runes: this.runes,
      guardians: this.guardians,
      powerUp: this.activePowerUp,
      grid: this.grid,
    };
  }
}
