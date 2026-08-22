export interface LevelConfig {
  level: 1 | 2 | 3;
  name: string;
  tag: "EASY" | "HARD" | "EXTREME";
  color: string;
  /** Crystals (weighted by value) a team must collect to unlock the next level. */
  objectiveTarget: number;
  monsterCount: number;
  /** Which pre-generated maze ids are valid for this level; server picks one per team at assignment time. */
  mazeIds: string[];
}

export const LEVEL_CONFIG: LevelConfig[] = [
  {
    level: 1,
    name: "The Novice Corridor",
    tag: "EASY",
    color: "#2f8f5b",
    objectiveTarget: 15,
    monsterCount: 1,
    mazeIds: ["level1_maze_01", "level1_maze_02", "level1_maze_03"],
  },
  {
    level: 2,
    name: "The Forbidden Library",
    tag: "HARD",
    color: "#e0813a",
    objectiveTarget: 25,
    monsterCount: 2,
    mazeIds: ["level2_maze_01", "level2_maze_02", "level2_maze_03"],
  },
  {
    level: 3,
    name: "The Headmaster's Tower",
    tag: "EXTREME",
    color: "#b23a52",
    objectiveTarget: 35,
    monsterCount: 3,
    mazeIds: ["level3_maze_01", "level3_maze_02", "level3_maze_03"],
  },
];

export function getLevelConfig(level: 1 | 2 | 3): LevelConfig {
  const cfg = LEVEL_CONFIG.find((l) => l.level === level);
  if (!cfg) throw new Error(`No level config for level ${level}`);
  return cfg;
}
