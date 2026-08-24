import type { Socket } from "socket.io";
<<<<<<< HEAD
import { deviceRegistry } from "./deviceRegistry.js";
=======
>>>>>>> 7107bbe982bd855752052d9d20071b6a26577fe6
import type { ClientToServerEvents, ServerToClientEvents } from "@tmr/shared";
import { GameManager } from "../game/GameManager.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/** Every admin event carries adminToken; reject anything that doesn't match. */
function isAuthorized(token: string): boolean {
  return token === env.adminToken;
}

export function registerAdminHandlers(socket: AppSocket, gameManager: GameManager): void {
  function reject(socket: AppSocket, event: string): void {
    logger.warn(`Rejected unauthorized ${event}`);
    socket.emit("admin:authError", { event });
  }

  socket.on("admin:verifyToken", ({ adminToken }, ack) => {
  ack({ ok: isAuthorized(adminToken) });
  });

  socket.on("admin:startGame", ({ adminToken }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:startGame");
    gameManager.startCountdown();
  });

  socket.on("admin:pauseGame", ({ adminToken }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:pauseGame");
    gameManager.pauseGame();
  });

  socket.on("admin:resumeGame", ({ adminToken }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:resumeGame");
    gameManager.resumeGame();
  });

  socket.on("admin:endGame", ({ adminToken }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:endGame");
    gameManager.endGame();
  });

  socket.on("admin:resetGame", ({ adminToken }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:resetGame");
    deviceRegistry.clear();
    gameManager.resetGame();
  });

  socket.on("admin:triggerEvent", ({ adminToken, type, teamId }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:triggerEvent");
    gameManager.triggerEvent(type, teamId);
  });

  socket.on("admin:setFeaturedTeam", ({ adminToken, teamId }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:setFeaturedTeam");
    gameManager.setFeaturedTeam(teamId);
  });

  socket.on("admin:updateScoring", ({ adminToken, ...values }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:updateScoring");
    gameManager.updateScoring(values);
  });
}
