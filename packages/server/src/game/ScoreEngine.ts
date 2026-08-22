import { DEFAULT_SCORING, type ScoringConfig } from "@tmr/shared";

/**
 * Holds the live, admin-tunable point values for the current session.
 * Seeded from DEFAULT_SCORING; admin:updateScoring mutates this in place
 * so any in-flight scoring calls immediately use the new values.
 */
export class ScoreEngine {
  private config: ScoringConfig = { ...DEFAULT_SCORING };

  getConfig(): ScoringConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<ScoringConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  pointsForCrystal(type: "crystal_normal" | "crystal_special"): number {
    return type === "crystal_special" ? this.config.specialCrystal : this.config.normalCrystal;
  }

  pointsForMonsterDefeated(): number {
    return this.config.monsterDefeated;
  }

  pointsForLevelCompletion(): number {
    return this.config.levelCompletionBonus;
  }
}
