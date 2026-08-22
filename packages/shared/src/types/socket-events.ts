import type { Direction, PlayerSelfView } from "./player.js";
import type { GameState, GameResults } from "./game.js";
import type { LiveEventType } from "./events.js";
import type { MazeLayout } from "./maze.js";

/**
 * Every socket event in the system, typed both directions. Import this in
 * server, big-screen, and phone-client so `socket.emit(...)` and
 * `socket.on(...)` calls are checked against the same contract — if the
 * payload shape drifts, TypeScript catches it at compile time instead of
 * at the event on a phone in someone's hand.
 */

// ---------- Client → Server ----------
export interface ClientToServerEvents {
  /** Phone client: player submits their name to join. Server assigns a team. */
  "player:join": (payload: { name: string }, ack: (res: PlayerJoinAck) => void) => void;

  /** Phone client: directional input. Server validates against maze walls before applying. */
  "player:move": (payload: { direction: Direction }) => void;

  /**
   * Phone client: local single-player engine reports its current score,
   * level, and lives so the server can roll individual performance up
   * into the team total and broadcast it to the big screen.
   */
  "player:progress": (payload: { score: number; level: number; lives: number; gameOver?: boolean }) => void;
  "player:rehydrate": (payload: { playerId: string }, ack: (res: PlayerJoinAck) => void) => void;
  /** Big-screen/admin: request the current full game state on connect. */
  "host:requestState": (ack: (state: GameState) => void) => void;

  /** Admin panel actions — require an admin token issued out-of-band (see server/config/env.ts). */
  "admin:startGame": (payload: { adminToken: string }) => void;
  "admin:pauseGame": (payload: { adminToken: string }) => void;
  "admin:resumeGame": (payload: { adminToken: string }) => void;
  "admin:endGame": (payload: { adminToken: string }) => void;
  "admin:resetGame": (payload: { adminToken: string }) => void;
  "admin:triggerEvent": (payload: { adminToken: string; type: LiveEventType; teamId?: string }) => void;
  "admin:setFeaturedTeam": (payload: { adminToken: string; teamId: string }) => void;
  "admin:updateScoring": (payload: {
    adminToken: string;
    normalCrystal?: number;
    specialCrystal?: number;
    monsterDefeated?: number;
    levelCompletionBonus?: number;
  }) => void;
}

export interface PlayerJoinAck {
  ok: boolean;
  error?: string;
  player?: PlayerSelfView;
  teamId?: string;
  teamName?: string;
  teamColor?: string;
  teamIcon?: string;
}

// ---------- Server → Client ----------
export interface ServerToClientEvents {
  /** Broadcast to all: full or partial game state update. Big-screen consumes this directly. */
  "game:stateUpdate": (state: GameState) => void;

  /** Sent once to a specific phone after a successful join, then again on any of that player's own changes. */
  "player:selfUpdate": (self: PlayerSelfView) => void;

  /** Sent to a phone when its maze layout is (re)assigned, e.g. team formed or level changed. */
  "player:mazeAssigned": (maze: MazeLayout) => void;

  /** Broadcast: lightweight event for toasts/feed — big-screen renders these directly. */
  "event:live": (event: { type: LiveEventType; message: string; timestamp: number }) => void;

  "game:countdownTick": (secondsLeft: number) => void;
  "game:started": () => void;
  "game:ended": (results: GameResults) => void;

  /** Server rejects a move (hit a wall) — used only for phone haptic/visual feedback, not authoritative state. */
  "player:moveRejected": (reason: string) => void;
  "admin:authError": (payload: { event: string }) => void;
}