import type { GameResults } from "@tmr/shared";
import type { SessionRecord } from "./models/Session.js";
import type { TeamResultRecord } from "./models/TeamResult.js";
import "./db.js";

const sessions: SessionRecord[] = [];
const teamResults: TeamResultRecord[] = [];

export function saveGameResults(results: GameResults): void {
  sessions.push({ sessionId: results.sessionId, startedAt: null, endedAt: results.endedAt });
  for (const r of results.results) {
    teamResults.push({
      sessionId: results.sessionId,
      teamId: r.teamId,
      teamName: r.teamName,
      rank: r.rank,
      score: r.score,
      levelReached: r.levelReached,
    });
  }
}

export function getPastSessions(): SessionRecord[] {
  return [...sessions];
}

export function getResultsForSession(sessionId: string): TeamResultRecord[] {
  return teamResults.filter((r) => r.sessionId === sessionId);
}
