import type { GridPosition } from "./player.js";

export type CellType = "open" | "wall" | "gate_open" | "gate_closed";

export interface Cell {
  x: number;
  y: number;
  type: CellType;
}

export type CollectibleType = "crystal_normal" | "crystal_special" | "boost_shield";

export interface Collectible {
  id: string;
  type: CollectibleType;
  position: GridPosition;
  /** false once collected; server removes it from active state but keeps the id for event logs */
  active: boolean;
}

export type MonsterBehavior = "patrol" | "chase" | "guard";

export interface MonsterSpawn {
  id: string;
  behavior: MonsterBehavior;
  spawnPosition: GridPosition;
  /** Ordered waypoints for "patrol" behavior; ignored for "chase"/"guard". */
  patrolPath?: GridPosition[];
}

/**
 * A pre-generated, hand-tested maze layout loaded from JSON at server boot.
 * These are never generated at runtime — see docs/ADDING_A_MAZE.md.
 */
export interface MazeLayout {
  id: string; // e.g. "level1_maze_01"
  level: 1 | 2 | 3;
  gridWidth: number;
  gridHeight: number;
  cells: Cell[];
  collectibleSpawns: Collectible[];
  monsterSpawns: MonsterSpawn[];
  playerSpawnPoints: GridPosition[]; // exactly 5, one per team slot
  /** Optional gates that a predefined live event can toggle mid-game. */
  toggleableGates?: { id: string; position: GridPosition }[];
}
