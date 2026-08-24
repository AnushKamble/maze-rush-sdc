import { getLevelConfig, type TeamProgress } from "@tmr/shared";

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: 1 | 2 | 3;
  bonusAwarded: boolean;
}

/**
 * Tracks a team's progress toward unlocking the next level. One crystal
 * pickup (of any value) counts as +1 toward the level's objectiveTarget —
 * scoring points and objective progress are deliberately separate so the
 * "collect N crystals" goal stays easy to explain on the phone UI.
 */
export class LevelProgression {
  static recordCollection(progress: TeamProgress): LevelUpResult {
    progress.objectiveProgress += 1;

    if (progress.objectiveProgress >= progress.objectiveTarget && progress.level < 3) {
      const newLevel = (progress.level + 1) as 1 | 2 | 3;
      progress.level = newLevel;
      progress.objectiveProgress = 0;
      progress.objectiveTarget = getLevelConfig(newLevel).objectiveTarget;
      progress.levelReachedAt[newLevel] = Date.now();
      return { leveledUp: true, newLevel, bonusAwarded: true };
    }

    // Already at level 3 and hit the target — mark completion timestamp once, no further level to unlock.
    if (progress.objectiveProgress >= progress.objectiveTarget && progress.level === 3 && !progress.levelReachedAt[3]) {
      progress.levelReachedAt[3] = Date.now();
    }

    return { leveledUp: false, newLevel: progress.level as 1 | 2 | 3, bonusAwarded: false };
  }

  static initial(): TeamProgress {
    return {
      level: 1,
      objectiveProgress: 0,
      objectiveTarget: getLevelConfig(1).objectiveTarget,
      levelReachedAt: { 1: Date.now(), 2: null, 3: null },
    };
  }
}
