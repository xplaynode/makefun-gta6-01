[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/xplaynode/makefun-gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/xplaynode/makefun-gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# Costa Serena

An original, browser-playable open-world crime mini-game built for the make.fun
[gta6-01 bounty](https://make.fun/bounty/gta6-01): https://make.fun/bounty/gta6-01

You are **Lucia Ferrer**, back in the sun-soaked coastal city of **Costa Serena** with empty
pockets and one friend who still answers the phone — fixer **Marco Delgado**. Explore six named
districts (Centro Serena, Costa Heights, Puerto Viejo, Sol Marina, Palmera Strip and Harbour
Point) plus Playa Serena beach and the Mar Serena, on foot or in any car you can take. Traffic
drives the road grid, pedestrians stroll the sidewalks and flee danger, and the **Policia de
Serena** answers a five-star wanted level with pursuing interceptors: get boxed in and you are
busted, get shot down and you are wasted — either way you wake up poorer and back on the streets.

## How to run it

```
node serve.ts
```

then open http://localhost:8080 in desktop Chrome. There is no build step and no network use:
`game/index.html` and its ES modules under `game/src/` are the whole game. Progress (cash and
mission progress) is saved in localStorage and loaded again on your next visit.

To hand the entry in the way the bounty runs it:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Controls

- **WASD / arrow keys** — walk, or accelerate / brake / steer while driving
- **E** — enter or exit a parked or traffic car (stealing one in view raises your wanted level)
- **Mouse** — aim on foot; **mouse click or F** — fire
- **Shift** — run on foot
- **P / Esc** — pause

## The missions

Four sequential story jobs for Marco Delgado, each with a gold world marker, a minimap marker,
on-screen objective text and a cash reward:

1. **First Wheels** — meet Marco at the Sol Marina boardwalk. ($250)
2. **Harbour Run** — drive to the Harbour Point dock marker. ($400)
3. **Trouble at the Marina** — defeat 3 Los Cayos crew members shaking down Sol Marina. ($650)
4. **The Heights Getaway** — reach the Costa Heights lookout while the police watch. ($1,000)

After the story, Costa Serena stays open: free-roam, steal cars, outrun five stars.

## Files

- `main.ts` — the handover program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.
- `serve.ts` — a tiny static server for local play.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `game/src/` — the game itself, split by job: `city.js` (city plan), `render.js` (canvas renderer),
  `vehicles.js` (cars, traffic, police), `people.js` (pedestrians), `combat.js` (shooting),
  `missions.js` (the story chain), `hud.js` (HUD and minimap), `shots.js` (deterministic screenshot
  scenes), plus `input.js`, `audio.js`, `effects.js`, `save.js`, `rng.js` and `main.js` (the loop).

## License

MIT — see `LICENSE`.
