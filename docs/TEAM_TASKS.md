# Team Maze Rush — Work Division (3 people)

## Status right now

✅ **DONE and verified working** — don't touch unless fixing a bug:
- `packages/shared` — all types + constants (typechecked, zero errors)
- `packages/server` — full game engine: team assignment, movement validation, scoring, level progression, live events, leaderboard, admin controls. 12 unit tests passing, smoke-tested with a real client connection.

🚧 **Not built yet — this is the 3-way split:**

---

## Person A — Big-Screen Dashboard (`packages/big-screen`)

The projector-facing app. This is what the whole room watches.

**Build these pages** (`src/pages/`):
- `LobbyPage.tsx` — QR code, "Players Joined: XX", "Teams Ready: XX", live team chips as people join
- `CountdownPage.tsx` — 3, 2, 1, GO!
- `DashboardPage.tsx` — the main event: level-grouped leaderboard (Level 3 always above Level 2 above Level 1) + a "Live Now" panel showing one team's maze + recent events feed
- `FinalPage.tsx` — podium, winner reveal

**Key components to build** (`src/components/`):
- `leaderboard/LeaderboardPanel.tsx`, `TeamRow.tsx`, `OvertakeToast.tsx`, `LevelUpBanner.tsx` — the animated leaderboard is the single most important visual in the whole event, prioritize this
- `live-now/LiveMazeCanvas.tsx` — renders a team's maze on canvas
- `shared/QRCode.tsx`, `Timer.tsx`

**What you're connecting to:** `socket:stateUpdate`, `event:live`, `game:countdownTick`, `game:started`, `game:ended` — all typed in `packages/shared/src/types/socket-events.ts`. Read that file first, it's your contract with the server.

**Reference:** an earlier HTML prototype exists showing the visual direction (pastel arcade style, level-grouped sections, overtake animations) — ask for it if useful as a style reference, but this needs to be real React + the real socket data, not the mocked version.

---

## Person B — Phone Controller (`packages/phone-client`)

What every student has open on their phone during the game.

**Build these pages** (`src/pages/`):
- `JoinPage.tsx` — name input, "Join Game" button
- `WaitingPage.tsx` — "You're in Team Kernel! Waiting for game to start..."
- `PlayPage.tsx` — the actual controller: score, level/objective progress, mini maze view, D-pad

**Key components** (`src/components/`):
- `DPad.tsx` — big touch-friendly UDLR buttons, sends `player:move`
- `ScoreHud.tsx`, `ObjectiveBar.tsx` — "Collect 15 crystals to advance"
- `MiniMazeCanvas.tsx` — small canvas rendering the player's own team maze

**What you're connecting to:** `player:join` (with ack), `player:move`, `player:selfUpdate`, `player:mazeAssigned`, `player:moveRejected` — same socket-events.ts file.

**Critical constraint:** must work well on real phones over mobile data (we're deploying to Render/Railway, not local WiFi) — test on an actual phone early, not just desktop browser resize.

---

## Person C — Admin Panel + Deployment/Ops

Two connected responsibilities: the organizer's control panel, and making sure the whole thing actually runs at the event.

**Admin Panel** (can live inside `packages/big-screen/src/pages/AdminPage.tsx`, or as its own small app if you prefer — coordinate with Person A):
- Start / Pause / Resume / End / Reset buttons → `admin:startGame` etc.
- Trigger live events (gate open, energy surge, monster surge, obstacle shift) → `admin:triggerEvent`
- Point value config form → `admin:updateScoring`
- Featured team selector → `admin:setFeaturedTeam`
- Live team status table (all teams, scores, levels, player counts)
- All admin events need `{ adminToken }` in the payload — there's a simple token input to unlock the panel

**Deployment / Ops:**
- Deploy `packages/server` to Render or Railway (README in `packages/server/README.md` has the exact steps)
- Once Person A and B have working builds, deploy `big-screen` and `phone-client` too (Vercel/Netlify work fine for static Vite builds) and update `CORS_ORIGINS` on the server to match
- Generate the real QR code pointing at the deployed phone-client URL
- Run a full dry-run with 5+ real phones before the actual event
- Own `docs/EVENT_RUNBOOK.md` — write the organizer's step-by-step checklist for the day of

---

## Shared ground rules

1. **Never edit `packages/shared` types without telling the other two** — everyone imports from there, a change breaks both frontends and the server at once.
2. Read `packages/shared/src/types/socket-events.ts` before writing any socket code — it's the exact contract, typed both directions.
3. Run `pnpm install` from the repo root, not inside a package folder.
4. Each package has its own `pnpm --filter @tmr/<name> dev` — check `package.json` scripts once they exist.
5. Test against the real running server (`pnpm --filter @tmr/server dev`) locally before assuming a deployed version works.
