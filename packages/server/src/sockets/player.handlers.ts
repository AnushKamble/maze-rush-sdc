import type { Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@tmr/shared";
import { GameManager } from "../game/GameManager.js";
import { playerRegistry } from "./playerRegistry.js";
import { deviceRegistry } from "./deviceRegistry.js";
import { parseCookies } from "../utils/cookies.js";
import { logger } from "../utils/logger.js";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerPlayerHandlers(socket: AppSocket, gameManager: GameManager): void {
  socket.on("player:join", (payload, ack) => {
    const deviceId = parseCookies(socket.handshake.headers.cookie).deviceId;
     const existingPlayerId = deviceId ? deviceRegistry.get(deviceId) : undefined;
    if (existingPlayerId) {
      const rehydrated = gameManager.rehydratePlayer(existingPlayerId, socket.id);
      if (rehydrated) {
        playerRegistry.set(existingPlayerId, socket.id);
        socket.data.playerId = existingPlayerId;
        const maze = gameManager.getPlayerMaze(existingPlayerId);
        if (maze) socket.emit("player:mazeAssigned", maze);
        const identity = gameManager.getTeamIdentity(rehydrated.teamId);
        logger.info("player:join -> reused existing device player", { playerId: existingPlayerId });
        ack({
          ok: true,
          player: rehydrated,
          teamId: rehydrated.teamId,
          teamName: identity?.name,
          teamColor: identity?.color,
          teamIcon: identity?.icon,
        });
        return;
      }
      if (deviceId) deviceRegistry.delete(deviceId);
    }
    const result = gameManager.joinPlayer(payload.name, socket.id);
    if (result.ok && result.player) {
      if (deviceId) deviceRegistry.set(deviceId, result.player.id);
      playerRegistry.set(result.player.id, socket.id);
      socket.data.playerId = result.player.id;
      const maze = gameManager.getPlayerMaze(result.player.id);
      if (maze) socket.emit("player:mazeAssigned", maze);

      logger.info("player:join ok", { playerId: result.player.id, teamId: result.teamId });
    }
    ack(result);
  });
  socket.on("player:rehydrate", (payload, ack) => {
    const self = gameManager.rehydratePlayer(payload.playerId, socket.id);
    if (!self) {
      ack({ ok: false, error: "That session no longer exists — join fresh." });
      return;
    }
    playerRegistry.set(self.id, socket.id);
    socket.data.playerId = self.id;
    const maze = gameManager.getPlayerMaze(self.id);
    if (maze) socket.emit("player:mazeAssigned", maze);
    const identity = gameManager.getTeamIdentity(self.teamId);
    logger.info("player:rehydrate ok", { playerId: self.id });
    ack({
      ok: true,
      player: self,
      teamId: self.teamId,
      teamName: identity?.name,
      teamColor: identity?.color,
      teamIcon: identity?.icon,
    });
   })

  socket.on("player:move", (payload) => {
    const playerId = socket.data.playerId as string | undefined;
    if (!playerId) return;
    gameManager.handleMove(playerId, payload.direction);
  });

  socket.on("player:progress", (payload) => {
    const playerId = socket.data.playerId as string | undefined;
    if (!playerId) return;
    gameManager.updatePlayerProgress(playerId, payload);
  });
}
