/**
 * Predefined live-difficulty events an admin can trigger. These only ever
 * apply changes that were configured ahead of time on a maze (see
 * MazeLayout.toggleableGates) — nothing is generated on the fly.
 */
export type LiveEventType =
  | "gate_open"
  | "gate_close"
  | "obstacle_shift"
  | "energy_surge"
  | "monster_surge"
  | "team_overtake"
  | "team_level_up"
  | "monster_defeated"
  | "player_life_lost"
  | "player_game_over";

export interface LiveEvent {
  id: string;
  type: LiveEventType;
  message: string; // human-readable, ready to render directly in the events feed
  teamId?: string;
  relatedTeamId?: string; // e.g. the team that got overtaken
  timestamp: number;
}
