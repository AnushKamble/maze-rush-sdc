import { describe, it, expect } from "vitest";
import { MovementValidator } from "../src/game/MovementValidator.js";
import type { MazeLayout } from "@tmr/shared";

function makeTinyMaze(): MazeLayout {
  // 3x3 grid: border walls, one open center cell, one gate cell on the east edge (row 1).
  const cells = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      let type: "open" | "wall" | "gate_closed" = "wall";
      if (x === 1 && y === 1) type = "open";
      if (x === 2 && y === 1) type = "gate_closed";
      cells.push({ x, y, type });
    }
  }
  return {
    id: "test_maze",
    level: 1,
    gridWidth: 3,
    gridHeight: 3,
    cells,
    collectibleSpawns: [],
    monsterSpawns: [],
    playerSpawnPoints: [
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 1 },
    ],
  };
}

describe("MovementValidator", () => {
  it("blocks movement into a wall", () => {
    const maze = makeTinyMaze();
    const result = MovementValidator.tryMove(maze, { x: 1, y: 1 }, "U");
    expect(result).toBeNull();
  });

  it("blocks movement into a closed gate", () => {
    const maze = makeTinyMaze();
    const result = MovementValidator.tryMove(maze, { x: 1, y: 1 }, "R");
    expect(result).toBeNull();
  });

  it("allows movement into a gate once opened", () => {
    const maze = makeTinyMaze();
    maze.cells.find((c) => c.x === 2 && c.y === 1)!.type = "gate_open";
    const result = MovementValidator.tryMove(maze, { x: 1, y: 1 }, "R");
    expect(result).toEqual({ x: 2, y: 1 });
  });

  it("blocks movement out of grid bounds", () => {
    const maze = makeTinyMaze();
    const result = MovementValidator.tryMove(maze, { x: 0, y: 0 }, "L");
    expect(result).toBeNull();
  });

  it("isSameCell compares grid-exact positions", () => {
    expect(MovementValidator.isSameCell({ x: 2, y: 3 }, { x: 2, y: 3 })).toBe(true);
    expect(MovementValidator.isSameCell({ x: 2, y: 3 }, { x: 2, y: 4 })).toBe(false);
  });
});
