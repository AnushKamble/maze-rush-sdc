export const TIMING = {
  /** Total live-game duration once countdown finishes. 7 minutes, matches the event brief. */
  gameDurationSec: 7 * 60,
  /** 3-2-1-GO countdown length in seconds. */
  countdownSec: 3,
  /** How often the server broadcasts a full state snapshot to the big-screen, in ms. */
  stateBroadcastIntervalMs: 1000,
  /** Grace period after a player is caught by a monster before they can be caught again, in ms. */
  respawnInvulnerabilityMs: 2000,
} as const;
