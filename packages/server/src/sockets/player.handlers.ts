import type { Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@tmr/shared";
import { GameManager } from "../game/GameManager.js";
import { playerRegistry } from "./playerRegistry.js";
import { logger } from "../utils/logger.js";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerPlayerHandlers(socket: AppSocket, gameManager: GameManager): void {
  socket.on("player:join", (payload, ack) => {
    const result = gameManager.joinPlayer(payload.name, socket.id);
    if (result.ok && result.player) {
      playerRegistry.set(result.player.id, socket.id);
      socket.data.playerId = result.player.id;

      const maze = gameManager.getPlayerMaze(result.player.id);
      if (maze) socket.emit("player:mazeAssigned", maze);

      logger.info("player:join ok", { playerId: result.player.id, teamId: result.teamId });
    }
    ack(result);
  });

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
