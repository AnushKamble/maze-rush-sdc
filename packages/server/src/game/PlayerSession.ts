import type { Direction, GridPosition, Player, PlayerConnectionStatus, PlayerPublicView, PlayerSelfView } from "@tmr/shared";

/**
 * Server-side runtime wrapper around a Player. Holds the live socket id
 * alongside the plain data record so GameManager can look up "who do I
 * send this to" without leaking socket internals into broadcast payloads.
 */
export class PlayerSession {
  data: Player;
  socketId: string;

  constructor(params: { id: string; socketId: string; name: string; teamId: string; spawn: GridPosition }) {
    this.socketId = params.socketId;
    this.data = {
      id: params.id,
      name: params.name,
      teamId: params.teamId,
      position: { ...params.spawn },
      facing: "D",
      score: 0,
      level: 1,
      lives: 3,
      status: "connected",
      lastCaughtAt: null,
      joinedAt: Date.now(),
    };
  }
  
  updateSocketId(newSocketId: string): void {
    this.socketId = newSocketId;
  }

  move(to: GridPosition, facing: Direction): void {
    this.data.position = to;
    this.data.facing = facing;
  }

  addScore(points: number): void {
    this.data.score += points;
  }

  setStatus(status: PlayerConnectionStatus): void {
    this.data.status = status;
  }

  /** Called from the phone client's local single-player engine reports (player:progress). */
  setProgress(score: number, level: number, lives: number): void {
    this.data.score = score;
    this.data.level = level;
    this.data.lives = lives;
  }

  publicView(): PlayerPublicView {
    return {
      id: this.data.id,
      name: this.data.name,
      position: this.data.position,
      facing: this.data.facing,
      score: this.data.score,
      level: this.data.level,
      lives: this.data.lives,
      status: this.data.status,
    };
  }

  selfView(): PlayerSelfView {
    return { ...this.publicView(), teamId: this.data.teamId };
  }
}
