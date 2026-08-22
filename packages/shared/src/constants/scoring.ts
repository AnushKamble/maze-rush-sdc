/**
 * Default point values. Admin panel can override these at runtime via
 * admin:updateScoring — ScoreEngine reads from mutable server-side config
 * seeded with these defaults, never from this file directly during a live game.
 */
export interface ScoringConfig {
  normalCrystal: number;
  specialCrystal: number;
  monsterDefeated: number;
  levelCompletionBonus: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  normalCrystal: 10,
  specialCrystal: 50,
  monsterDefeated: 100,
  levelCompletionBonus: 500,
};
