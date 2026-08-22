import { describe, it, expect, beforeEach } from "vitest";
import { TeamManager, type TeamRuntime } from "../src/game/TeamManager.js";
import { PlayerSession } from "../src/game/PlayerSession.js";
import { LevelProgression } from "../src/game/LevelProgression.js";
import type { MazeLayout } from "@tmr/shared";

function fakeMaze(): MazeLayout {
  return {
    id: "fake",
    level: 1,
    gridWidth: 3,
    gridHeight: 3,
    cells: [],
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

describe("TeamManager", () => {
  let teams: Map<string, TeamRuntime>;

  beforeEach(() => {
    teams = new Map();
  });

  it("creates a new team for the first player", () => {
    const result = TeamManager.pickTeamForNewPlayer(teams, fakeMaze);
    expect(result.isNewTeam).toBe(true);
    expect(teams.size).toBe(1);
  });

  it("fills an existing team before creating a new one", () => {
    const first = TeamManager.pickTeamForNewPlayer(teams, fakeMaze);
    const team = teams.get(first.teamId)!;
    // Simulate 4 players already joined (team holds 5 max).
    for (let i = 0; i < 4; i++) {
      const p = new PlayerSession({ id: `p${i}`, socketId: `s${i}`, name: `P${i}`, teamId: first.teamId, spawn: { x: 1, y: 1 } });
      team.players.set(p.data.id, p);
    }
    const second = TeamManager.pickTeamForNewPlayer(teams, fakeMaze);
    expect(second.isNewTeam).toBe(false);
    expect(second.teamId).toBe(first.teamId);
    expect(teams.size).toBe(1);
  });

  it("creates a second team once the first is full (5 players)", () => {
    const first = TeamManager.pickTeamForNewPlayer(teams, fakeMaze);
    const team = teams.get(first.teamId)!;
    for (let i = 0; i < 5; i++) {
      const p = new PlayerSession({ id: `p${i}`, socketId: `s${i}`, name: `P${i}`, teamId: first.teamId, spawn: { x: 1, y: 1 } });
      team.players.set(p.data.id, p);
    }
    const second = TeamManager.pickTeamForNewPlayer(teams, fakeMaze);
    expect(second.isNewTeam).toBe(true);
    expect(second.teamId).not.toBe(first.teamId);
    expect(teams.size).toBe(2);
  });

  it("teamScore sums all player scores", () => {
    const first = TeamManager.pickTeamForNewPlayer(teams, fakeMaze);
    const team = teams.get(first.teamId)!;
    const p1 = new PlayerSession({ id: "p1", socketId: "s1", name: "A", teamId: first.teamId, spawn: { x: 1, y: 1 } });
    const p2 = new PlayerSession({ id: "p2", socketId: "s2", name: "B", teamId: first.teamId, spawn: { x: 1, y: 1 } });
    p1.addScore(100);
    p2.addScore(250);
    team.players.set(p1.data.id, p1);
    team.players.set(p2.data.id, p2);
    expect(TeamManager.teamScore(team)).toBe(350);
  });
});
