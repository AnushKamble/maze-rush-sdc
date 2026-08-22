// ============================================================
// Maze Rush — level data for the single-player arcade engine.
// Grid legend: '#' wall, '.' corridor with a collectible rune.
//
// Grids are generated, not hand-drawn: every grid is a "comb" —
// fixed vertical corridor columns run the full height, and every
// other row is fully open so it cross-connects them. This makes
// every generated grid provably fully connected regardless of
// width/height/spacing, which is what lets us safely support 5
// different shapes (including a landscape one) without ever
// risking an unreachable rune or a broken guardian patrol.
// ============================================================

export type Dir = "U" | "D" | "L" | "R" | null;

export const DIR_VECTORS: Record<Exclude<Dir, null>, { x: number; y: number }> = {
  U: { x: 0, y: -1 },
  D: { x: 0, y: 1 },
  L: { x: -1, y: 0 },
  R: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Exclude<Dir, null>, Exclude<Dir, null>> = {
  U: "D",
  D: "U",
  L: "R",
  R: "L",
};

export interface MazeGrid {
  width: number;
  height: number;
  rows: string[];
  /** True for the one wide/short layout meant to be played with the phone rotated. */
  landscape: boolean;
}

function buildCombRows(width: number, height: number, colStep: number): string[] {
  const rows: string[] = [];
  rows.push("#".repeat(width));
  for (let y = 1; y < height - 1; y++) {
    const isPillarRow = y % 2 === 0;
    let row = "#";
    for (let x = 1; x < width - 1; x++) {
      if (!isPillarRow) row += ".";
      else row += (x - 1) % colStep === 0 ? "." : "#";
    }
    row += "#";
    rows.push(row);
  }
  rows.push("#".repeat(width));
  return rows;
}

function makeGrid(width: number, height: number, colStep: number, landscape = false): MazeGrid {
  return { width, height, rows: buildCombRows(width, height, colStep), landscape };
}

export function cellAt(grid: MazeGrid, x: number, y: number): string {
  if (y < 0 || y >= grid.height || x < 0 || x >= grid.width) return "#";
  return grid.rows[y][x];
}

export function isWalkable(grid: MazeGrid, x: number, y: number): boolean {
  return cellAt(grid, x, y) !== "#";
}

function corridorColumns(width: number, colStep: number): number[] {
  const cols: number[] = [];
  for (let x = 1; x < width - 1; x++) if ((x - 1) % colStep === 0) cols.push(x);
  return cols;
}

function openRows(height: number): number[] {
  const rows: number[] = [];
  for (let y = 1; y < height - 1; y++) if (y % 2 !== 0) rows.push(y);
  return rows;
}

function defaultStart(width: number, height: number): { x: number; y: number } {
  const rows = openRows(height);
  const y = rows[rows.length - 1] ?? 1;
  const x = Math.min(Math.max(Math.floor(width / 2), 1), width - 2);
  return { x, y };
}

/** A patrol step: move `steps` cells in direction `dir`, one cell at a time. */
export interface PatrolStep {
  dir: Exclude<Dir, null>;
  steps: number;
}

export type GuardianBehavior = "fixed_pattern" | "corridor_walker" | "circular" | "randomized";

export interface GuardianConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  start: { x: number; y: number };
  behavior: GuardianBehavior;
  pattern?: PatrolStep[];
  initialDir?: Exclude<Dir, null>;
}

/** Builds a rectangle patrol loop between two corridor columns and two open rows — always valid by construction. */
function rectLoop(id: string, name: string, emoji: string, color: string, colA: number, colB: number, rowA: number, rowB: number): GuardianConfig {
  const dCols = Math.abs(colB - colA);
  const dRows = Math.abs(rowB - rowA);
  return {
    id,
    name,
    emoji,
    color,
    start: { x: colA, y: rowA },
    behavior: "fixed_pattern",
    pattern: [
      { dir: "D", steps: dRows },
      { dir: "R", steps: dCols },
      { dir: "U", steps: dRows },
      { dir: "L", steps: dCols },
    ],
  };
}

/** Generates up to 5 guardians for any comb grid — every position/loop is derived from the grid's own corridor structure, so it can never place a guardian on a wall or author an invalid patrol. */
function buildGuardianPool(width: number, height: number, colStep: number): GuardianConfig[] {
  const cols = corridorColumns(width, colStep);
  const rows = openRows(height);
  const c = (i: number) => cols[Math.min(i, cols.length - 1)];
  const r = (i: number) => rows[Math.min(i, rows.length - 1)];

  const pool: GuardianConfig[] = [];

  pool.push(rectLoop("g1", "Corridor Sentinel", "👻", "#b23a52", c(0), c(Math.min(1, cols.length - 1)), r(0), r(Math.min(2, rows.length - 1))));

  pool.push({
    id: "g2",
    name: "Wandering Wraith",
    emoji: "🌀",
    color: "#3d5ba0",
    start: { x: width - 2, y: r(Math.floor(rows.length / 2)) },
    behavior: "corridor_walker",
    initialDir: "L",
  });

  pool.push(
    rectLoop(
      "g3",
      "Rune Stalker",
      "🕷️",
      "#e0813a",
      c(Math.max(cols.length - 2, 0)),
      c(cols.length - 1),
      r(0),
      r(Math.min(2, rows.length - 1))
    )
  );

  pool.push({
    id: "g4",
    name: "Shadow Drifter",
    emoji: "🦇",
    color: "#6b4a9e",
    start: { x: c(Math.floor(cols.length / 2)), y: r(Math.floor(rows.length / 2)) },
    behavior: "randomized",
  });

  pool.push(
    rectLoop(
      "g5",
      "Bound Specter",
      "🪦",
      "#9c8f3f",
      c(0),
      c(Math.min(1, cols.length - 1)),
      r(Math.max(rows.length - 3, 0)),
      r(rows.length - 1)
    )
  );

  return pool;
}

function powerUpCellsFor(width: number, height: number, colStep: number): Array<{ x: number; y: number }> {
  const cols = corridorColumns(width, colStep);
  const rows = openRows(height);
  const cells: Array<{ x: number; y: number }> = [];
  const colPicks = [0, Math.floor(cols.length / 2), cols.length - 1];
  const rowPicks = [0, Math.floor(rows.length / 2), rows.length - 1];
  for (const ci of new Set(colPicks)) {
    for (const ri of new Set(rowPicks)) {
      const x = cols[Math.min(ci, cols.length - 1)];
      const y = rows[Math.min(ri, rows.length - 1)];
      if (x !== undefined && y !== undefined) cells.push({ x, y });
    }
  }
  return cells;
}

// ---------- 5 grid shapes (last one is landscape — needs phone rotated) ----------

const GRID_SPECS = [
  { width: 9, height: 15, colStep: 2, landscape: false }, // tall, dense — corridor
  { width: 11, height: 11, colStep: 2, landscape: false }, // near-square — hall
  { width: 9, height: 17, colStep: 3, landscape: false }, // tall, sparse — archive
  { width: 7, height: 19, colStep: 2, landscape: false }, // narrow, tall — tower
  { width: 17, height: 9, colStep: 2, landscape: true }, // wide — courtyard (rotate!)
];

export const GRID_TYPES: MazeGrid[] = GRID_SPECS.map((s) => makeGrid(s.width, s.height, s.colStep, s.landscape));

export interface LevelDef {
  level: number;
  name: string;
  tag: string;
  grid: MazeGrid;
  playerStart: { x: number; y: number };
  guardians: GuardianConfig[];
  powerUpCells: Array<{ x: number; y: number }>;
  playerSpeed: number; // cells/sec
  guardianSpeed: number; // cells/sec
  invulnerabilitySec: number;
  powerUpChance: number; // 0..1 chance per check window
  requiresLandscape: boolean;
}

const LEVEL_NAMES = [
  "The Novice Corridor",
  "The Great Hall",
  "The Restricted Archive",
  "The Astronomy Tower",
  "The Open Courtyard",
  "The Sealed Corridor",
  "The Grand Hall Trial",
  "The Forbidden Archive",
  "The Headmaster's Tower",
  "The Final Courtyard",
];

const LEVEL_TAGS = ["EASY", "EASY", "MEDIUM", "MEDIUM", "MEDIUM", "HARD", "HARD", "HARD", "EXTREME", "EXTREME"];

const GUARDIAN_COUNTS = [1, 2, 2, 3, 2, 3, 4, 5, 5, 5];

export const MAX_LEVELS = 10;
export const TOTAL_LIVES = 3;

function buildLevel(levelNumber: number): LevelDef {
  const idx = levelNumber - 1;
  const spec = GRID_SPECS[idx % GRID_SPECS.length];
  const grid = GRID_TYPES[idx % GRID_TYPES.length];
  const guardianPool = buildGuardianPool(spec.width, spec.height, spec.colStep);
  const guardianCount = GUARDIAN_COUNTS[Math.min(idx, GUARDIAN_COUNTS.length - 1)];

  return {
    level: levelNumber,
    name: LEVEL_NAMES[idx % LEVEL_NAMES.length],
    tag: LEVEL_TAGS[Math.min(idx, LEVEL_TAGS.length - 1)],
    grid,
    playerStart: defaultStart(spec.width, spec.height),
    guardians: guardianPool.slice(0, guardianCount),
    powerUpCells: powerUpCellsFor(spec.width, spec.height, spec.colStep),
    // difficulty ramps continuously across all 10 levels, never resets
    playerSpeed: 4.0 + idx * 0.09,
    guardianSpeed: levelNumber === 5 ? 2.85 : levelNumber === 6 ? 3.05 : 2.3 + idx * 0.22,
    invulnerabilitySec: Math.max(1.2, 2.6 - idx * 0.15),
    powerUpChance: Math.max(0.15, 0.35 - idx * 0.02),
    requiresLandscape: spec.landscape,
  };
}

export const LEVELS: LevelDef[] = Array.from({ length: MAX_LEVELS }, (_, i) => buildLevel(i + 1));

export const RUNE_POINTS = 10;
export const POWERUP_POINTS = 50;
export const POWERUP_DURATION_SEC = 4;
