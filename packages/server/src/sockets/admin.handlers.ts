import type { Socket } from "socket.io";
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
    gameManager.resetGame();
  });

  socket.on("admin:triggerEvent", ({ adminToken, type, teamId }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:triggerEvent");
    gameManager.triggerEvent(type, teamId);
  });

  socket.on("admin:setFeaturedTeam", ({ adminToken, teamId }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:setFeaturedEvent");
    gameManager.setFeaturedTeam(teamId);
  });

  socket.on("admin:updateScoring", ({ adminToken, ...values }) => {
    if (!isAuthorized(adminToken)) return reject(socket,"admin:updateScoring");
    gameManager.updateScoring(values);
  });
}
