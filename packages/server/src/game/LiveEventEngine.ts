import type { MazeLayout, LiveEventType } from "@tmr/shared";

/**
 * Applies predefined, pre-tested live-difficulty events to a team's
 * *runtime* maze copy (never the shared static registry — each team gets
 * its own mutable clone so triggering an event for Team Kernel doesn't
 * affect Team Compile even if they're both on maze_01).
 *
 * Scope note: this only touches gates, obstacle cells, and collectible
 * activation — it deliberately does not implement monster pathing/AI.
 * Monsters currently sit at fixed spawn points and are "defeated" on
 * contact (see GameManager.handleMove). Live chase/patrol movement is a
 * follow-up piece, not yet built.
 */
export class LiveEventEngine {
  static apply(maze: MazeLayout, type: LiveEventType): string {
    switch (type) {
      case "gate_open":
        return this.setGate(maze, "gate_open");
      case "gate_close":
        return this.setGate(maze, "gate_closed");
      case "obstacle_shift":
        return this.shiftObstacle(maze);
      case "energy_surge":
        return this.energySurge(maze);
      case "monster_surge":
        return this.monsterSurge(maze);
      default:
        return "No-op event";
    }
  }

  private static setGate(maze: MazeLayout, state: "gate_open" | "gate_closed"): string {
    const gate = maze.toggleableGates?.[0];
    if (!gate) return "No gate configured on this maze";
    const cell = maze.cells.find((c) => c.x === gate.position.x && c.y === gate.position.y);
    if (!cell) return "Gate cell not found";
    cell.type = state;
    return state === "gate_open" ? "Gate opened" : "Gate closed";
  }

  private static shiftObstacle(maze: MazeLayout): string {
    // Flips one predefined interior wall cell to open (or back to wall if already flipped).
    // Interior = not on the border, so the arena's outer boundary is never touched.
    const interior = maze.cells.filter(
      (c) => c.x > 0 && c.y > 0 && c.x < maze.gridWidth - 1 && c.y < maze.gridHeight - 1 && c.type !== "gate_open" && c.type !== "gate_closed"
    );
    if (interior.length === 0) return "No interior cell available to shift";
    const target = interior[Math.floor(Math.random() * interior.length)];
    target.type = target.type === "wall" ? "open" : "wall";
    return `Obstacle shifted at (${target.x}, ${target.y})`;
  }

  private static energySurge(maze: MazeLayout): string {
    let reactivated = 0;
    for (const c of maze.collectibleSpawns) {
      if (!c.active) {
        c.active = true;
        reactivated++;
      }
    }
    return `Energy surge — ${reactivated} extra crystals reactivated`;
  }

  private static monsterSurge(maze: MazeLayout): string {
    // Adds one extra static monster near the center. Same "contact = defeated"
    // behavior as existing monsters — see scope note above.
    const id = `mon_surge_${Date.now()}`;
    maze.monsterSpawns.push({
      id,
      behavior: "guard",
      spawnPosition: { x: Math.floor(maze.gridWidth / 2), y: Math.floor(maze.gridHeight / 2) },
    });
    return "Monster surge — an extra guard spawned";
  }
}
