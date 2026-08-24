/**
 * Minimal structured logger. Swap this for pino/winston later if needed —
 * kept dependency-free since the event itself only needs console output
 * visible in the Render/Railway logs.
 */
type Level = "info" | "warn" | "error" | "debug";

function line(level: Level, msg: string, meta?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const metaStr = meta ? " " + JSON.stringify(meta) : "";
  const out = `[${ts}] [${level.toUpperCase()}] ${msg}${metaStr}`;
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => line("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => line("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => line("error", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") line("debug", msg, meta);
  },
};
