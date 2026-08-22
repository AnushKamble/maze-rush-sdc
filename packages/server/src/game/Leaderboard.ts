import type { LeaderboardRow, TeamIdentity } from "@tmr/shared";

export interface TeamForRanking {
  id: string;
  identity: TeamIdentity;
  level: number;
  score: number;
  playersActive: number;
  playersTotal: number;
}

/**
 * Builds the level-grouped leaderboard: higher-level teams always appear
 * above lower-level teams, regardless of score. Within a level, teams are
 * ranked by score. Rank numbers continue across groups (so a lone
 * highest-level team is always #1 overall). Levels are discovered from the
 * teams themselves so this works whether the game has 3 levels or 10.
 */
export class Leaderboard {
  static buildRows(teams: TeamForRanking[]): LeaderboardRow[] {
    const rows: LeaderboardRow[] = [];
    let rank = 0;
    const levels = Array.from(new Set(teams.map((t) => t.level))).sort((a, b) => b - a);
    for (const level of levels) {
      const group = teams
        .filter((t) => t.level === level)
        .sort((a, b) => b.score - a.score);
      for (const t of group) {
        rank++;
        rows.push({
          rank,
          team: t.identity,
          level: t.level,
          score: t.score,
          playersActive: t.playersActive,
          playersTotal: t.playersTotal,
        });
      }
    }
    return rows;
  }

  /** The team currently in the #1 overall slot (level takes priority over score). */
  static topTeamId(rows: LeaderboardRow[]): string | null {
    return rows[0]?.team.id ?? null;
  }
}
