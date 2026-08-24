# Maze Rush — "The Enchanted Maze" — Setup Guide

This is the UI/UX-revamped version of **Team Maze Rush**: an 8-bit pixel-art,
magical-wizarding-academy skin over the same core maze gameplay (server, sockets,
scoring, mazes — all untouched). Three apps make up the project:

| App | Folder | Role |
|---|---|---|
| **Server** | `packages/server` | Node/Socket.IO game engine (mazes, scoring, teams) |
| **Phone Client** | `packages/phone-client` | Mobile screen each player joins & plays on (the redesigned "castle" join/HUD/D-pad) |
| **Big Screen** | `packages/big-screen` | Projector/TV view — lobby QR, live leaderboard, countdown, admin panel |
| **Shared** | `packages/shared` | Types & constants shared by all three (level names, scoring, etc.) |

---

## 1. Prerequisites

- **Node.js** ≥ 18 (`node -v`)
- **pnpm** ≥ 9 — this is a pnpm workspace monorepo
  ```bash
  npm install -g pnpm
  ```

## 2. Install dependencies

From the project root (the folder containing `pnpm-lock.yaml`):

```bash
pnpm install
```

This installs and links all four packages (`server`, `phone-client`, `big-screen`, `shared`) in one go.

## 3. Environment variables

Copy the example env files (defaults already work for local dev on one machine):

```bash
cp packages/phone-client/.env.example packages/phone-client/.env
cp packages/big-screen/.env.example packages/big-screen/.env
```

- `VITE_SERVER_URL` — where the phone/big-screen clients reach the Socket.IO server (default `http://localhost:4000`)
- `VITE_PHONE_CLIENT_URL` — used by the big screen to render the "scan to join" QR code. If you're demoing on a projector and want phones on the same WiFi to join, set this to your machine's LAN IP, e.g. `http://192.168.1.42:5174`, instead of `localhost`.

The server itself reads its own config from `packages/server/src/config/env.ts` (defaults work out of the box — `PORT=4000`, `ADMIN_TOKEN=sdc-orientation-2026`). Create a `.env` in `packages/server` if you want to override these.

## 4. Run everything for local dev

**Option A — all three apps at once (recommended):**
```bash
pnpm dev
```
This runs the server, big-screen, and phone-client in parallel.

**Option B — run them individually (separate terminals), useful for debugging:**
```bash
pnpm dev:server      # Socket.IO server → http://localhost:4000
pnpm dev:big-screen  # Big screen UI    → http://localhost:5173
pnpm dev:phone       # Phone client UI  → http://localhost:5174
```

## 5. Try it out

1. Open the **big screen** at `http://localhost:5173` — you'll see the new dark-castle lobby with the QR code and pixel "MAZE RUSH" title.
2. Open the **phone client** at `http://localhost:5174` (or scan the QR on an actual phone on the same WiFi, using your LAN IP as described above) — you'll land on the new "Enter the Castle" join screen.
3. Enter a name and tap **Enter the Castle** — you'll be sorted into a house and see the "moving staircases are aligning" waiting screen, showing your assigned house.
4. On the big screen, click **⚙️ Admin** (top-right corner), enter the admin token (`sdc-orientation-2026` by default), and click **▶ Start** to begin the countdown. Once live, every joined phone automatically drops into its own local maze run.
5. Play on the phone with swipe/arrow keys. As you collect runes, level up, lose lives, or finish your run, the big screen's leaderboard and events feed update live — your score is added to your house's total.

## 6. Build for production / demo deployment

```bash
pnpm build
```

Builds all workspaces (`tsc -b && vite build` for the two client apps, `tsc` for the server). Output:
- `packages/phone-client/dist` — static site, deploy anywhere (Vercel/Netlify/Render static)
- `packages/big-screen/dist` — static site, same as above
- `packages/server/dist` — run with `node dist/index.js` (needs `PORT`, `CORS_ORIGINS`, `ADMIN_TOKEN` env vars set for your deployed client URLs)

Run the built server:
```bash
pnpm --filter @tmr/server start
```

## 7. How it fits together (teams restored, single-player engine per phone)

Team creation, the lobby, and the admin/leaderboard flow are back to being **server-authoritative**, same as the original:

- Joining (`player:join`) still auto-sorts each player into a house (5 per house, houses activate in order) via `TeamManager` — nothing manual, same as before.
- The **admin panel** (`packages/big-screen`, big-screen → ⚙️ Admin) still controls the whole event: **▶ Start, ⏸ Pause, ⏵ Resume, ⏹ End, ↺ Reset**. The old "trigger live event" buttons (Gate Open, Energy Surge, etc.) were removed from the UI since they belonged to the old grid-movement mechanic — the underlying server code is still there if you want to bring them back later, it's just not exposed anymore.
- Each phone runs its **own local Pac-Man-style maze** (`packages/phone-client/src/game/`) — continuous auto-movement, fixed-pattern guardians, runes, power-ups, lives. This part is intentionally client-side, since server-authoritative frame-by-frame arcade movement isn't practical over a phone's socket connection.
- The phone periodically emits `player:progress` (`score`, `level`, `lives`, `gameOver`) to the server. `GameManager.updatePlayerProgress` rolls that into the player's session, and since **team score is the sum of its players' scores**, every player's individual run directly grows their house's total on the big screen — exactly like the original per-crystal scoring did, just fed by the local engine instead of grid moves.
- The big-screen **dashboard** shows a live, animated leaderboard (rows reorder with a smooth transition, a row flashes gold when its score ticks up), a "House Spotlight" panel breaking down each player's individual contribution to the leading house, and a recent-events feed (level-ups, life-lost, overtakes) — all server-driven, same event pipeline as before.
- **3 lives are for the whole game**, not reset per level, and the phone's own end screen is a styled card (not a plain modal) showing final score and highest level reached — **no restart button**, by design.
- The maze grid varies by level — see section 9 below for the 5 shapes and difficulty ramp.

One honest limitation: since gameplay is client-side, an admin **Pause** stops the shared game clock/leaderboard on the big screen, but doesn't freeze anyone's phone mid-maze (there's no server frame to pause). This is worth knowing before a live demo — Pause is really "pause the shared countdown/board," not "freeze every player."

## 8. What changed in this revamp (for reference)

- `packages/phone-client/src/styles/tokens.css` and `packages/big-screen/src/styles/tokens.css` — new dark-castle color palette (midnight navy, antique gold, crimson, emerald, candle orange), pixel fonts (`Press Start 2P` for headings, `VT323` for body/gameplay text), reusable `.pixel-btn`, `.parchment-input`, `.stone-panel`, `.castle-bg` classes.
- `phone-client/src/pages/JoinPage.tsx` — dramatic "main menu"-style entry screen with pixel castle silhouette, moon, twinkling stars, floating magic particles, and a softly sparkling title.
- `phone-client/src/pages/WaitingPage.tsx`, `GamePage.tsx` — reskinned with the wizarding palette and copy (houses, runes, staircases, etc.). Gameplay logic, sockets, and scoring are untouched by this pass.
- `big-screen/src/pages/*` — lobby, countdown, dashboard, final results, and admin screens reskinned to match, same particle/sparkle treatment on the Lobby.
- `packages/shared/src/constants/levels.ts` — legacy 3-level config (kept for the unused server-authoritative grid-movement path — see section 9's note on scope).

No networking, sockets, or team logic was touched by the visual/audio pass in this section — only presentation layers and, separately, the gameplay engine described in section 9.

## 9. Levels, difficulty ramp, sound, and a couple of important fixes

**10 levels, 5 generated grid shapes.** `packages/phone-client/src/game/mazes.ts` generates every maze from one small, provably-connected "comb" pattern (fixed vertical corridors + alternating fully-open rows) rather than hand-drawing 10 separate layouts — that's deliberate: it's the only way to guarantee every rune is reachable and every guardian patrol is valid across 5 very different shapes without manually re-verifying each one. The 5 shapes (tall/dense, near-square, tall/sparse, narrow tower, and one **wide landscape shape**) are used for levels 1-5, then reused with higher difficulty for levels 6-10 (`(level-1) % 5`).

**The landscape level** (*The Open Courtyard* / *The Final Courtyard*) is wide instead of tall. On a phone held portrait, `GamePage` detects `window.innerWidth < window.innerHeight` while that level is active and shows a "🔄 Rotate Your Device" screen instead of gameplay — the engine simulation is paused (not just visually hidden) while that prompt is up, and resumes the instant the phone (or window) goes landscape.

**Difficulty ramps continuously across all 10 levels** (never resets at the halfway point): player speed, guardian speed, guardian count (1 → 5, reusing the same 5 non-chasing behaviors), invulnerability duration after respawn (2.6s → 1.2s), and power-up spawn frequency all scale with level number. Player speed is tuned to always stay a little ahead of guardian speed even at level 10, so it stays winnable, just tighter.

**Level completion is now "clear every rune," not a score threshold.** Earlier revisions used a cumulative score target per level, which is exactly the kind of thing that can misfire (overshoot two thresholds in one pickup, or advance before the player's really finished). Runes are counted directly (`engine.runes.size === 0`) so a level ends at exactly one deterministic moment — this was a real fix, not just a rewrite for its own sake.

**The game only ends on 0 lives (or clearing level 10)** — it no longer stops early for any score-related reason. 3 lives are shared across the whole run, same as before.

**Sound** (`phone-client/src/game/sfx.ts`, mirrored in `big-screen/src/sfx.ts` for admin buttons): short synthesized WebAudio tones, no external audio files. The rune "eat" sound specifically is throttled (min. 55ms between plays) and pitch-wobbled slightly each time so rapid-fire pickups don't turn into a grating stack of identical clicks — deliberately quieter/softer than the other cues since it repeats constantly.

**Glow**: `.glow-gold` is a slow, low-amplitude pulse now (not a bright fast one), and it's only applied to hero titles ("MAZE RUSH" on the two main screens) — HUD numbers and other labels that update frequently use a static `.text-glow-soft` instead, or no glow at all, so the screen doesn't feel like everything is animating at once.

## Troubleshooting

- **Phones can't reach the server on WiFi**: make sure `VITE_SERVER_URL` (phone-client `.env`) and `CORS_ORIGINS` (server env) both point at your machine's LAN IP, not `localhost`.
- **QR code points to `localhost`**: set `VITE_PHONE_CLIENT_URL` in `packages/big-screen/.env` to your LAN IP before starting `dev:big-screen`.
- **Fonts look like a fallback serif/sans**: the pixel fonts (`Press Start 2P`, `VT323`) load from Google Fonts via `@import` in `tokens.css` — you'll need internet access on the demo machine/browser for them to load; otherwise it gracefully falls back to `monospace`.
