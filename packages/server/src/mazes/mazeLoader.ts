import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { MazeLayout } from "@tmr/shared";
import { logger } from "../utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Loads every pre-generated maze JSON at boot, validates the shape, and
 * keeps them in memory keyed by id. Mazes are never generated at runtime —
 * see docs/ADDING_A_MAZE.md for how to add a new layout to disk.
 */
class MazeRegistry {
  private mazes = new Map<string, MazeLayout>();

  loadAll(): void {
    for (const level of ["level1", "level2", "level3"] as const) {
      const dir = join(__dirname, level);
      let files: string[] = [];
      try {
        files = readdirSync(dir).filter((f) => f.endsWith(".json"));
      } catch {
        logger.warn(`No maze directory found for ${level}`, { dir });
        continue;
      }
      for (const file of files) {
        const path = join(dir, file);
        try {
          const raw = readFileSync(path, "utf-8");
          const parsed = JSON.parse(raw) as MazeLayout;
          this.validate(parsed, path);
          this.mazes.set(parsed.id, parsed);
        } catch (err) {
          logger.error(`Failed to load maze file`, { path, error: String(err) });
        }
      }
    }
    logger.info(`Loaded ${this.mazes.size} maze layouts`, {
      ids: Array.from(this.mazes.keys()),
    });
  }

  private validate(m: MazeLayout, path: string): void {
    if (!m.id) throw new Error(`Maze at ${path} missing id`);
    if (m.playerSpawnPoints?.length !== 5) {
      throw new Error(`Maze ${m.id} must have exactly 5 playerSpawnPoints, got ${m.playerSpawnPoints?.length}`);
    }
    if (!m.cells || m.cells.length !== m.gridWidth * m.gridHeight) {
      throw new Error(`Maze ${m.id} cells length doesn't match gridWidth*gridHeight`);
    }
    // Every spawn point must land on an open (or gate) cell, not a wall.
    for (const p of m.playerSpawnPoints) {
      const cell = m.cells.find((c) => c.x === p.x && c.y === p.y);
      if (!cell || cell.type === "wall") {
        throw new Error(`Maze ${m.id} has a player spawn point on a wall or missing cell: ${JSON.stringify(p)}`);
      }
    }
  }

  get(id: string): MazeLayout | undefined {
    return this.mazes.get(id);
  }

  /** Picks a random maze id from a given list — used when assigning a team to a level. */
  pickRandom(ids: string[]): MazeLayout {
    const valid = ids.filter((id) => this.mazes.has(id));
    if (valid.length === 0) {
      throw new Error(`No loaded mazes match any of: ${ids.join(", ")}`);
    }
    const chosen = valid[Math.floor(Math.random() * valid.length)];
    return this.mazes.get(chosen)!;
  }

  all(): MazeLayout[] {
    return Array.from(this.mazes.values());
  }
}

export const mazeRegistry = new MazeRegistry();
