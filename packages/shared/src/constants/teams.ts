import type { TeamIdentity } from "../types/team.js";

/**
 * Prebuilt wizarding-house identities. TeamManager assigns players into
 * these round-robin as they join, 5 per team, activating pool entries in
 * order — so with 43 players you get 8 full houses and 1 house of 3
 * (still playable, never blocked from starting).
 */
export const TEAM_POOL: TeamIdentity[] = [
  { id: "ember", name: "House Ember", color: "#7dd3fc", darkColor: "#0891b2", icon: "⬢" },
  { id: "frost", name: "House Frost", color: "#f9a8d4", darkColor: "#db2777", icon: "◆" },
  { id: "thorn", name: "House Thorn", color: "#c4b5fd", darkColor: "#7c3aed", icon: "●" },
  { id: "gale", name: "House Gale", color: "#fde68a", darkColor: "#ca8a04", icon: "▲" },
  { id: "stone", name: "House Stone", color: "#86efac", darkColor: "#16a34a", icon: "■" },
  { id: "moonveil", name: "House Moonveil", color: "#fdba74", darkColor: "#ea580c", icon: "◈" },
  { id: "raven", name: "House Raven", color: "#a5b4fc", darkColor: "#4f46e5", icon: "⬡" },
  { id: "sable", name: "House Sable", color: "#fca5a5", darkColor: "#dc2626", icon: "★" },
  { id: "storm", name: "House Storm", color: "#5eead4", darkColor: "#0d9488", icon: "◉" },
  { id: "vale", name: "House Vale", color: "#fbcfe8", darkColor: "#be185d", icon: "✦" },
  { id: "cinder", name: "House Cinder", color: "#fdd8ab", darkColor: "#c2410c", icon: "▶" },
  { id: "nova", name: "House Nova", color: "#bfdbfe", darkColor: "#1d4ed8", icon: "◐" },
  { id: "lumen", name: "House Lumen", color: "#ddd6fe", darkColor: "#6d28d9", icon: "⬣" },
  { id: "thistle", name: "House Thistle", color: "#bbf7d0", darkColor: "#15803d", icon: "✚" },
  { id: "wisp", name: "House Wisp", color: "#fecaca", darkColor: "#b91c1c", icon: "◇" },
];

export const PLAYERS_PER_TEAM = 1;
