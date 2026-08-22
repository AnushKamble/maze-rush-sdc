/**
 * Maps playerId -> current socketId, so GameManager's playerId-based events
 * (player-scoped, not socket-scoped) can be routed to the right connection.
 * A player's socketId can change across reconnects; this map always
 * reflects the latest one.
 */
export const playerRegistry = new Map<string, string>();
