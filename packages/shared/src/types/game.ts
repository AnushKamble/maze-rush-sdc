import type { Team } from "./team.js";
import type { LiveEvent } from "./events.js";

export type GamePhase = "lobby" | "countdown" | "live" | "paused" | "ended";

/**
 * The single source of truth for the whole event, held in memory on the
 * server (GameManager). Both frontends receive read-only projections of
 * this, never the whole thing verbatim — see socket-events.ts.
 */
export interface GameState {
  phase: GamePhase;
  teams: Team[];
  totalPlayers: number;
  /** Seconds remaining in the overall 7–8 minute event; null before start. */
  timeRemainingSec: number | null;
  gameDurationSec: number;
  recentEvents: LiveEvent[];
  featuredTeamId: string | null;
  startedAt: number | null;
  endedAt: number | null;
  finalResults: GameResults | null;
}

export interface FinalResultRow {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  levelReached: number;
  finalizedAt: number;
}

export interface GameResults {
  sessionId: string;
  results: FinalResultRow[];
  endedAt: number;
}
