import type { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@tmr/shared";
import { GameManager } from "../game/GameManager.js";
import { playerRegistry } from "./playerRegistry.js";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

/**
 * Wires GameManager's internal events to actual socket emissions. This is
 * the only file that knows both "game logic" and "socket.io" — keeps
 * GameManager itself testable without a real server.
 */
export function subscribeBroadcasts(io: AppServer, gameManager: GameManager): void {
  gameManager.on("stateChange", (state) => {
    io.emit("game:stateUpdate", state);
  });

  gameManager.on("liveEvent", (evt) => {
    io.emit("event:live", { type: evt.type, message: evt.message, timestamp: evt.timestamp });
  });

  gameManager.on("countdown", (n: number) => {
    io.emit("game:countdownTick", n);
  });

  gameManager.on("started", () => {
    io.emit("game:started");
  });

  gameManager.on("ended", (results) => {
    io.emit("game:ended", results);
  });

  gameManager.on("playerSelf", (playerId: string, self) => {
    const socketId = playerRegistry.get(playerId);
    if (socketId) io.to(socketId).emit("player:selfUpdate", self);
  });

  gameManager.on("mazeAssigned", (playerId: string, maze) => {
    const socketId = playerRegistry.get(playerId);
    if (socketId) io.to(socketId).emit("player:mazeAssigned", maze);
  });

  gameManager.on("moveRejected", (playerId: string, reason: string) => {
    const socketId = playerRegistry.get(playerId);
    if (socketId) io.to(socketId).emit("player:moveRejected", reason);
  });
}
