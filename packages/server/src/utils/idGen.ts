/**
 * Short random ids for players, teams-in-session, events, etc. Not
 * cryptographically secure — doesn't need to be, this is a party game.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars

export function shortId(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function eventId(): string {
  return `evt_${shortId(6)}`;
}

export function playerId(): string {
  return `ply_${shortId(8)}`;
}

export function sessionId(): string {
  return `sess_${Date.now()}_${shortId(4)}`;
}
