# @tmr/server

The authoritative game server for Team Maze Rush. Node.js + Express + Socket.IO.

## What's implemented and verified working

- ✅ Team auto-assignment (fills teams of 5 in order from the 15-team pool)
- ✅ Server-authoritative movement validation (walls, closed gates, bounds)
- ✅ Scoring (crystals, monster contact, level-completion bonus) — admin-tunable at runtime
- ✅ Level progression (1→2→3) with per-team maze reassignment on level-up
- ✅ Predefined live events: gate open/close, obstacle shift, energy surge, monster surge
- ✅ Level-grouped leaderboard (Level 3 always ranked above Level 2, above Level 1) with overtake detection
- ✅ 9 pre-generated, validated maze layouts (3 per level)
- ✅ Full game lifecycle: lobby → countdown → live → paused/ended, with a 7-minute timer
- ✅ Admin panel socket events, gated by a shared `ADMIN_TOKEN`
- ✅ In-memory results persistence (survives a reset, not a server restart — see `src/persistence/db.ts` for the DB upgrade path)
- ✅ 12 unit tests passing (`MovementValidator`, `ScoreEngine`, `TeamManager`)
- ✅ End-to-end smoke-tested: a real Socket.IO client connecting, joining, getting assigned to a team, and receiving its maze

## Known scope limits (honest, not hidden)

- **Monsters are static contact-triggers, not chase/patrol AI.** Touching a monster's cell "defeats" it (+100 pts) and it respawns after 3s. Full monster movement is a follow-up piece.
- **Big-screen and phone-client are not built yet** — this server is fully playable via raw Socket.IO events (see smoke test pattern below) but has no UI yet.
- **Persistence is in-memory only.** Fine for a single event; add `DATABASE_URL` and wire a real driver in `src/persistence/db.ts` if you need results to survive a server restart.

## Run it locally

```bash
# from the repo root, after `pnpm install`
cd packages/server
cp ../../.env.example .env   # then trim it down to just PORT, NODE_ENV, CORS_ORIGINS, DATABASE_URL, ADMIN_TOKEN
pnpm dev
```

Server starts on `http://localhost:4000`. Verify with:
```bash
curl http://localhost:4000/health
# {"ok":true,"service":"team-maze-rush-server","env":"development"}
```

## Run the tests

```bash
pnpm test        # runs all 12 unit tests
pnpm typecheck    # zero-error TypeScript check
```

## Deploying (Render / Railway)

1. Set env vars in your host's dashboard: `PORT` (usually auto-set by the host), `NODE_ENV=production`, `CORS_ORIGINS=<your deployed big-screen and phone-client URLs>`, `ADMIN_TOKEN=<a real secret, not the example one>`.
2. Build command: `pnpm --filter @tmr/shared build && pnpm --filter @tmr/server build`
3. Start command: `pnpm --filter @tmr/server start`

## Socket event contract

See `packages/shared/src/types/socket-events.ts` — this is the single source of truth both frontends will import from. Key events:
- `player:join` → `{ name }`, ack returns `{ ok, player, teamId, teamName }`
- `player:move` → `{ direction: "U"|"D"|"L"|"R" }`
- `game:stateUpdate` (broadcast) → full `GameState`, includes the level-grouped leaderboard data
- `admin:startGame` / `admin:triggerEvent` / etc. → all require `{ adminToken }`
