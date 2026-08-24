import type { Direction, GridPosition, MazeLayout } from "@tmr/shared";

/**
 * Server-authoritative movement checking. The phone only ever sends a
 * direction ("player:move") — this is the single place that decides
 * whether the resulting position is legal. Never trust a position sent
 * by a client.
 */
export class MovementValidator {
  /**
   * Returns the resulting position if the move is legal, or null if it's
   * blocked by a wall/closed gate/out-of-bounds edge.
   */
  static tryMove(maze: MazeLayout, from: GridPosition, direction: Direction): GridPosition | null {
    const delta: Record<Direction, GridPosition> = {
      U: { x: 0, y: -1 },
      D: { x: 0, y: 1 },
      L: { x: -1, y: 0 },
      R: { x: 1, y: 0 },
    };
    const d = delta[direction];
    const target: GridPosition = { x: from.x + d.x, y: from.y + d.y };

    if (target.x < 0 || target.y < 0 || target.x >= maze.gridWidth || target.y >= maze.gridHeight) {
      return null;
    }

    const cell = maze.cells.find((c) => c.x === target.x && c.y === target.y);
    if (!cell) return null;
    if (cell.type === "wall") return null;
    if (cell.type === "gate_closed") return null;
    // "open" and "gate_open" are both walkable.
    return target;
  }

  /** Distance check used for monster-catches-player and collectible-pickup radius (grid-exact, no diagonal). */
  static isSameCell(a: GridPosition, b: GridPosition): boolean {
    return a.x === b.x && a.y === b.y;
  }
}
