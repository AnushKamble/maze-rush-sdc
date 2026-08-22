import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@tmr/shared";
import { GameManager } from "../game/GameManager.js";
import { registerPlayerHandlers } from "./player.handlers.js";
import { registerAdminHandlers } from "./admin.handlers.js";
import { playerRegistry } from "./playerRegistry.js";
import { logger } from "../utils/logger.js";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupConnectionHandler(io: AppServer, gameManager: GameManager): void {
  io.on("connection", (socket: AppSocket) => {
    logger.debug("Socket connected", { id: socket.id });

    registerPlayerHandlers(socket, gameManager);
    registerAdminHandlers(socket, gameManager);

    // Big-screen / admin dashboards call this once on mount to paint immediately,
    // instead of waiting for the next tick broadcast.
    socket.on("host:requestState", (ack) => {
      ack(gameManager.buildGameState());
    });

    socket.on("disconnect", () => {
      const playerId = socket.data.playerId as string | undefined;
      if (playerId) {
        playerRegistry.delete(playerId);
        logger.debug("Player socket disconnected", { playerId });
      }
    });
  });
}
