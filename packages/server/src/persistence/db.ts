import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Prototype persistence: in-memory only. Results survive an admin
 * "reset" within the same server process, but not a server restart.
 *
 * Upgrade path: if DATABASE_URL is set (e.g. a Render/Railway Postgres
 * add-on), swap the arrays in repository.ts for real queries — the
 * repository's function signatures are written to match 1:1 with what a
 * real DB-backed implementation would need, so this is a drop-in swap,
 * not a rewrite.
 */
export const usingRealDatabase = Boolean(env.databaseUrl);

if (usingRealDatabase) {
  logger.warn("DATABASE_URL is set but no real DB driver is wired up yet — still using in-memory storage.");
} else {
  logger.info("Running with in-memory persistence (no DATABASE_URL set).");
}
