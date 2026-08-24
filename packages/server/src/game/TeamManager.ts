import { TEAM_POOL, PLAYERS_PER_TEAM, type TeamIdentity, type TeamProgress, type MazeLayout } from "@tmr/shared";
import type { PlayerSession } from "./PlayerSession.js";
import { LevelProgression } from "./LevelProgression.js";

/**
 * Full server-side runtime state for one team — the public Team shape
 * (from @tmr/shared) plus the mutable per-team maze clone and live player
 * session map that never gets sent over the wire directly.
 */
export interface TeamRuntime {
  identity: TeamIdentity;
  players: Map<string, PlayerSession>;
  progress: TeamProgress;
  maze: MazeLayout;
}

export class TeamManager {
  /**
   * Finds the first not-yet-full team (activating pool entries in order as
   * needed) so players fill Team Kernel to 5 before Team Compile starts,
   * matching "automatic team creation" from the brief — no manual picking.
   */
  static pickTeamForNewPlayer(
    teams: Map<string, TeamRuntime>,
    getMazeForLevel1: () => MazeLayout
  ): { teamId: string; isNewTeam: boolean; identity: TeamIdentity } {
    for (const [id, team] of teams) {
      if (team.players.size < PLAYERS_PER_TEAM) {
        return { teamId: id, isNewTeam: false, identity: team.identity };
      }
    }

    const nextIdentity = TEAM_POOL[teams.size];
    if (!nextIdentity) {
      throw new Error("Team pool exhausted — increase TEAM_POOL size in @tmr/shared/constants/teams.ts");
    }

    teams.set(nextIdentity.id, {
      identity: nextIdentity,
      players: new Map(),
      progress: LevelProgression.initial(),
      maze: structuredClone(getMazeForLevel1()),
    });

    return { teamId: nextIdentity.id, isNewTeam: true, identity: nextIdentity };
  }

  static teamScore(team: TeamRuntime): number {
    let total = 0;
    for (const p of team.players.values()) total += p.data.score;
    return total;
  }

  static activePlayerCount(team: TeamRuntime): number {
    let n = 0;
    for (const p of team.players.values()) if (p.data.status === "connected") n++;
    return n;
  }
}
