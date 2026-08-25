import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@tmr/shared";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { parseCookies } from "./utils/cookies.js";
import { mazeRegistry } from "./mazes/mazeLoader.js";
import { GameManager } from "./game/GameManager.js";
import { subscribeBroadcasts } from "./sockets/broadcast.js";
import { setupConnectionHandler } from "./sockets/connection.js";

mazeRegistry.loadAll();

const app = express();
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "team-maze-rush-server", env: env.nodeEnv });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: env.corsOrigins, credentials: true },
});

io.engine.on("initial_headers", (headers: Record<string, string>, req) => {
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.deviceId) {
    const deviceId = randomUUID();
    headers["Set-Cookie"] = [
      `deviceId=${deviceId}`,
      "Path=/",
      "HttpOnly",
      `Max-Age=${60 * 60 * 24}`,
      env.isProduction ? "SameSite=None; Secure" : "SameSite=Lax",
    ].join("; ");
  }
});

const gameManager = new GameManager();
subscribeBroadcasts(io, gameManager);
setupConnectionHandler(io, gameManager);

httpServer.listen(env.port, () => {
  logger.info(`Team Maze Rush server listening on port ${env.port}`, {
    env: env.nodeEnv,
    corsOrigins: env.corsOrigins,
  });
});
