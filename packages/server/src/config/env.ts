import "dotenv/config";

/**
 * Central place for all server env vars. Import this instead of reading
 * process.env directly anywhere else, so there's exactly one place that
 * knows the defaults and one place to update when deploying to Render/Railway.
 */
function required(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

export const env = {
  port: parseInt(required("PORT", "4000"), 10),
  nodeEnv: required("NODE_ENV", "development"),
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  /** Comma-separated origins allowed to open a socket connection. */
  corsOrigins: required("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /**
   * Simple shared-secret admin token. The organizer types this into the
   * admin panel once at the event. Not meant to be enterprise-grade auth —
   * just enough to stop a random joined player from hitting admin sockets.
   */
  adminToken: required("ADMIN_TOKEN", "sdc-orientation-2026"),
  databaseUrl: process.env.DATABASE_URL ?? "",
};
