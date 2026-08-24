import { EventEmitter } from "node:events";
import {
  TIMING,
  getLevelConfig,
  type GamePhase,
  type GameState,
  type GameResults,
  type FinalResultRow,
  type LiveEvent,
  type LiveEventType,
  type Direction,
  type PlayerJoinAck,
  type MazeLayout,
  type PlayerSelfView,
} from "@tmr/shared";
import { PlayerSession } from "./PlayerSession.js";
import { TeamManager, type TeamRuntime } from "./TeamManager.js";
import { MovementValidator } from "./MovementValidator.js";
import { ScoreEngine } from "./ScoreEngine.js";
import { LevelProgression } from "./LevelProgression.js";
import { LiveEventEngine } from "./LiveEventEngine.js";
import { Leaderboard, type TeamForRanking } from "./Leaderboard.js";
import { mazeRegistry } from "../mazes/mazeLoader.js";
import { eventId, playerId as genPlayerId, sessionId as genSessionId } from "../utils/idGen.js";
import { logger } from "../utils/logger.js";
import { saveGameResults } from "../persistence/repository.js";

/**
 * Emits (all consumed by sockets/broadcast.ts):
 *  - "stateChange"    (state: GameState)
 *  - "liveEvent"      (evt: LiveEvent)
 *  - "playerSelf"     (playerId: string, self: PlayerSelfView)
 *  - "mazeAssigned"   (playerId: string, maze: MazeLayout)
 *  - "countdown"      (secondsLeft: number)
 *  - "started"        ()
 *  - "ended"          (results: GameResults)
 *  - "moveRejected"   (playerId: string, reason: string)
 *
 * Scope note: monsters are static contact-triggers (touch = defeated),
 * not chase/patrol AI. See LiveEventEngine for details.
 */
export class GameManager extends EventEmitter {
  private phase: GamePhase = "lobby";
  private teams = new Map<string, TeamRuntime>();
  private players = new Map<string, PlayerSession>();
  private scoreEngine = new ScoreEngine();
  private recentEvents: LiveEvent[] = [];
  private featuredTeamId: string | null = null;
  private timeRemainingSec: number | null = null;
  private startedAt: number | null = null;
  private endedAt: number | null = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private previousTopTeamId: string | null = null;
  private currentSessionId = genSessionId();
  private finalResults: GameResults | null = null;

  // ---------- Lobby / Join ----------

  joinPlayer(name: string, socketId: string): PlayerJoinAck {
    if (this.phase !== "lobby") {
      return { ok: false, error: "Game already in progress — you can join the next round." };
    }
    const cleanName = name.trim().slice(0, 20) || "Player";

    const { teamId, identity } = TeamManager.pickTeamForNewPlayer(this.teams, () =>
      mazeRegistry.pickRandom(getLevelConfig(1).mazeIds)
    );
    const team = this.teams.get(teamId)!;
    const spawnIndex = team.players.size;
    const spawn = team.maze.playerSpawnPoints[spawnIndex] ?? team.maze.playerSpawnPoints[0];

    const id = genPlayerId();
    const session = new PlayerSession({ id, socketId, name: cleanName, teamId, spawn });
    team.players.set(id, session);
    this.players.set(id, session);

    logger.info("Player joined", { id, name: cleanName, teamId });
    this.emitState();

    return {
      ok: true,
      player: session.selfView(),
      teamId,
      teamName: identity.name,
      teamColor: identity.color,
      teamIcon: identity.icon,
    };
  }

  getPlayerMaze(playerId: string): MazeLayout | null {
    const session = this.players.get(playerId);
    if (!session) return null;
    const team = this.teams.get(session.data.teamId);
    return team?.maze ?? null;
  }
  getPlayer(playerId: string): PlayerSession | null {
    return this.players.get(playerId) ?? null;
  }
  markPlayerDisconnected(playerId: string): void {
    const session = this.players.get(playerId);
    if (!session) return;
    session.setStatus("disconnected");
    this.emitState();
  }
  rehydratePlayer(playerId: string): PlayerSelfView | null {
    const session = this.players.get(playerId);
    if (!session) return null;
    session.setStatus("connected");
    this.emitState();
    return session.selfView();
  }
  // ---------- Movement ----------

  handleMove(playerId: string, direction: Direction): void {
    if (this.phase !== "live") return;
    const session = this.players.get(playerId);
    if (!session) return;
    const team = this.teams.get(session.data.teamId);
    if (!team) return;

    const next = MovementValidator.tryMove(team.maze, session.data.position, direction);
    if (!next) {
      this.emit("moveRejected", playerId, "blocked");
      return;
    }
    session.move(next, direction);

    // Collectible pickup
    const crystal = team.maze.collectibleSpawns.find(
      (c) => c.active && c.type !== "boost_shield" && MovementValidator.isSameCell(c.position, next)
    );
    if (crystal) {
      crystal.active = false;
      const pts = this.scoreEngine.pointsForCrystal(crystal.type as "crystal_normal" | "crystal_special");
      session.addScore(pts);

      const result = LevelProgression.recordCollection(team.progress);
      if (result.leveledUp) {
        session.addScore(this.scoreEngine.pointsForLevelCompletion());
        this.advanceTeamMaze(team, result.newLevel);
        this.pushEvent("team_level_up", `${team.identity.name} reached Level ${result.newLevel}!`, team.identity.id);
      }
    }

    // Boost shield pickup (cosmetic pickup for now — no gameplay effect wired yet)
    const boost = team.maze.collectibleSpawns.find(
      (c) => c.active && c.type === "boost_shield" && MovementValidator.isSameCell(c.position, next)
    );
    if (boost) {
      boost.active = false;
    }

    // Monster contact — static trigger, see class-level scope note.
    const monster = team.maze.monsterSpawns.find((m) => MovementValidator.isSameCell(m.spawnPosition, next));
    if (monster) {
      session.addScore(this.scoreEngine.pointsForMonsterDefeated());
      this.pushEvent("monster_defeated", `+${this.scoreEngine.pointsForMonsterDefeated()} ${team.identity.name} defeats a monster`, team.identity.id);
      const originalPos = { ...monster.spawnPosition };
      monster.spawnPosition = { x: -1, y: -1 }; // temporarily off-grid
      setTimeout(() => {
        monster.spawnPosition = originalPos;
        this.emitMazeToTeam(team);
      }, 3000);
    }

    this.emit("playerSelf", playerId, session.selfView());
    this.checkOvertake();
    this.emitState();
  }

  private advanceTeamMaze(team: TeamRuntime, newLevel: 1 | 2 | 3): void {
    const cfg = getLevelConfig(newLevel);
    const newMaze = structuredClone(mazeRegistry.pickRandom(cfg.mazeIds));
    team.maze = newMaze;
    let i = 0;
    for (const p of team.players.values()) {
      const spawn = newMaze.playerSpawnPoints[i % newMaze.playerSpawnPoints.length];
      p.move(spawn, "D");
      i++;
    }
    this.emitMazeToTeam(team);
  }

  private emitMazeToTeam(team: TeamRuntime): void {
    for (const p of team.players.values()) {
      this.emit("mazeAssigned", p.data.id, team.maze);
    }
  }

  // ---------- Progress sync (single-player engine → team aggregate) ----------

  /**
   * The phone client runs its own local Pac-Man-style engine (movement,
   * guardians, collisions, lives). This is how that individual performance
   * rolls up into the team the player belongs to: the server doesn't
   * recompute the run, it trusts periodic score/level/lives snapshots and
   * uses them purely for team totals, the leaderboard, and live events.
   */
  updatePlayerProgress(
    playerId: string,
    payload: { score: number; level: number; lives: number; gameOver?: boolean }
  ): void {
    const session = this.players.get(playerId);
    if (!session) return;
    const team = this.teams.get(session.data.teamId);
    if (!team) return;

    const previousLevel = session.data.level;
    const previousLives = session.data.lives;
    const score = Math.max(payload.score, session.data.score);
    const level = Math.max(payload.level, session.data.level);
    session.setProgress(score, level, payload.lives);

    if (level > previousLevel) {
      if (level > team.progress.level) {
        team.progress.level = level;
        team.progress.levelReachedAt[level] = Date.now();
      }
      this.pushEvent(
        "team_level_up",
        `${session.data.name} carries ${team.identity.name} into Level ${level}!`,
        team.identity.id
      );
    }

    if (payload.lives < previousLives && payload.lives > 0) {
      this.pushEvent("player_life_lost", `${session.data.name} (${team.identity.name}) lost a life — ${payload.lives} remaining`, team.identity.id);
    }

    if (payload.gameOver) {
      this.pushEvent("player_game_over", `${session.data.name}'s spell failed for the last time — final score ${payload.score}`, team.identity.id);
    }

    this.emit("playerSelf", playerId, session.selfView());
    this.checkOvertake();
    this.emitState();
  }



  startCountdown(): void {
    if (this.phase !== "lobby") return;
    if (this.teams.size === 0) {
      logger.warn("Start requested with zero teams — ignoring");
      return;
    }
    this.phase = "countdown";
    let n = TIMING.countdownSec;
    this.emit("countdown", n);
    const iv = setInterval(() => {
      n--;
      if (n > 0) {
        this.emit("countdown", n);
      } else {
        clearInterval(iv);
        this.startGame();
      }
    }, 800);
  }

  private startGame(): void {
    this.phase = "live";
    this.startedAt = Date.now();
    this.timeRemainingSec = TIMING.gameDurationSec;
    this.emit("started");
    this.emitState();

    // Send every player their starting maze explicitly (covers reconnect-safe initial paint).
    for (const team of this.teams.values()) this.emitMazeToTeam(team);

    this.tickInterval = setInterval(() => this.tick(), TIMING.stateBroadcastIntervalMs);
  }

  private tick(): void {
    if (this.phase !== "live" || this.timeRemainingSec === null) return;
    this.timeRemainingSec -= 1;
    if (this.timeRemainingSec <= 0) {
      this.timeRemainingSec = 0;
      this.endGame();
      return;
    }
    this.emitState();
  }

  pauseGame(): void {
    if (this.phase !== "live") return;
    this.phase = "paused";
    this.emitState();
  }

  resumeGame(): void {
    if (this.phase !== "paused") return;
    this.phase = "live";
    this.emitState();
  }

  endGame(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.phase = "ended";
    this.endedAt = Date.now();
    const results = this.buildResults();
    this.finalResults = results;
    saveGameResults(results);
    this.emit("ended", results);
    this.emitState();
  }

  resetGame(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.phase = "lobby";
    this.teams.clear();
    this.players.clear();
    this.recentEvents = [];
    this.featuredTeamId = null;
    this.timeRemainingSec = null;
    this.startedAt = null;
    this.endedAt = null;
    this.previousTopTeamId = null;
    this.currentSessionId = genSessionId();
    this.finalResults = null;
    this.emitState();
  }

  // ---------- Admin / live events ----------

  triggerEvent(type: LiveEventType, teamId?: string): void {
    const team = teamId ? this.teams.get(teamId) : this.randomTeam();
    if (!team) return;
    const message = LiveEventEngine.apply(team.maze, type);
    this.pushEvent(type, `${team.identity.name}: ${message}`, team.identity.id);
    this.emitMazeToTeam(team);
    this.emitState();
  }

  setFeaturedTeam(teamId: string): void {
    if (!this.teams.has(teamId)) return;
    this.featuredTeamId = teamId;
    this.emitState();
  }

  updateScoring(partial: Parameters<ScoreEngine["updateConfig"]>[0]): void {
    this.scoreEngine.updateConfig(partial);
  }

  private randomTeam(): TeamRuntime | undefined {
    const arr = Array.from(this.teams.values());
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private pushEvent(type: LiveEventType, message: string, teamId?: string, relatedTeamId?: string): void {
    const evt: LiveEvent = { id: eventId(), type, message, teamId, relatedTeamId, timestamp: Date.now() };
    this.recentEvents.unshift(evt);
    this.recentEvents = this.recentEvents.slice(0, 5);
    this.emit("liveEvent", evt);
  }

  private checkOvertake(): void {
    const rows = Leaderboard.buildRows(this.rankingInput());
    const top = Leaderboard.topTeamId(rows);
    if (top && this.previousTopTeamId && top !== this.previousTopTeamId) {
      const newLeader = this.teams.get(top);
      const oldLeader = this.teams.get(this.previousTopTeamId);
      if (newLeader && oldLeader) {
        this.pushEvent(
          "team_overtake",
          `${newLeader.identity.name} overtakes ${oldLeader.identity.name}`,
          newLeader.identity.id,
          oldLeader.identity.id
        );
      }
    }
    this.previousTopTeamId = top;
  }

  // ---------- State building ----------

  private rankingInput(): TeamForRanking[] {
    return Array.from(this.teams.values()).map((t) => ({
      id: t.identity.id,
      identity: t.identity,
      level: t.progress.level,
      score: TeamManager.teamScore(t),
      playersActive: TeamManager.activePlayerCount(t),
      playersTotal: t.players.size,
    }));
  }

  buildGameState(): GameState {
    const teams = Array.from(this.teams.values()).map((t) => ({
      ...t.identity,
      mazeId: t.maze.id,
      players: Array.from(t.players.values()).map((p) => p.publicView()),
      score: TeamManager.teamScore(t),
      progress: t.progress,
    }));

    return {
      phase: this.phase,
      teams,
      totalPlayers: this.players.size,
      timeRemainingSec: this.timeRemainingSec,
      gameDurationSec: TIMING.gameDurationSec,
      recentEvents: this.recentEvents,
      featuredTeamId: this.featuredTeamId ?? teams[0]?.id ?? null,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      finalResults: this.finalResults
    };
  }

  private buildResults(): GameResults {
    const ranked = this.rankingInput().sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTeam = this.teams.get(a.id)!;
      const bTeam = this.teams.get(b.id)!;
      const aL = aTeam.progress.levelReachedAt[aTeam.progress.level] ?? Infinity;
      const bL = bTeam.progress.levelReachedAt[bTeam.progress.level] ?? Infinity;
      return aL - bL;
    });

    const results: FinalResultRow[] = ranked.map((t, i) => ({
      rank: i + 1,
      teamId: t.id,
      teamName: t.identity.name,
      score: t.score,
      levelReached: t.level,
      finalizedAt: Date.now(),
    }));

    return { sessionId: this.currentSessionId, results, endedAt: Date.now() };
  }

  private emitState(): void {
    this.emit("stateChange", this.buildGameState());
  }
}
