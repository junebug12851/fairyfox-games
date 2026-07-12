# Skyline

A slab slides back and forth above your tower. Drop it onto the slab below — but
only the **overlap** stays; the overhang is sliced away, so every sloppy drop leaves
you a narrower target next time. A **flush** (dead-on) drop keeps the full width and
pays double, so precision is the only thing that lets a tower keep climbing. Miss the
slab entirely and it topples. The slab slides faster the higher you build — and the
**wind** shifts as you climb, so no two towers rise the same.

**Controls:** click, tap, or press **Space** (or ↓) to drop. Same control starts and
restarts. Your best height is saved locally in `localStorage`.

## How it grows

Skyline follows the shared **Growth Architecture**
(`notes/reference/growth-architecture.md`) and **Varied Structure**
(`notes/reference/varied-structure.md`):

- **Varied structure (the wind).** A run is a seeded **sequence of named wind patterns**,
  not one flat generator — the slab used to arrive from a single rule (random start,
  random heading, the score's speed). Now each slab is pulled from the live **formation**
  (`FORMATIONS` / `pickFormation` / `loadFormation`; `spawnCurrent` pulls one
  `{fx, dir, speedMul}` spec at a time):
  **Steady** (the calm on-ramp), **Crosswind** (slabs enter hard against alternating
  edges — long, readable sweeps), **Plumb Line** (the wind drops: slow, near-centre slabs
  — the flush-streak window, and the greed beat worth committing to), **Gust** (a short
  run of fast slabs thrown in from an edge), **Shear** (crawling and racing slabs
  alternating, so rhythm is useless — read each one), and **The Squall** (the Spire-only
  crescendo: a long run of near-max-speed slabs from alternating edges).
  `minStage` gates each, so **climbing the stages opens the pool** (progression drives the
  variation) and weights toward the wild wind late; notable patterns flash a quiet
  `#formCue`, the calm ones pass silently. A formation's `speedMul` modulates the score
  ramp (`slabSpeed`), hard-capped at `SPEED_HARD_MAX` so no pattern can spike past the
  honest ramp — and a fast slab *looks* fast (a motion streak + a hotter glow), so the
  wind is legible before it's named.
- **Core-fun (streak bonus).** On top of the flush-drop bonus and the score-scaled
  slide speed, a **run of flush drops now pays an escalating bonus** (`STREAK_BONUS_MAX`):
  the 2nd flush in a row adds +1, the 3rd +2 … so chaining perfects is where the big
  towers come from — the precision skill is directly, super-linearly rewarded.
- **Stages (the run's arc).** Foundation → Mid-rise → High-rise → Spire — a quiet HUD
  chip + progress bar, a stage-tinted sky wash, and a shockwave on stage change
  (`STAGES`, `stageIndexAt`, `stageProgress`, pure + tested).
- **Meta-progression (across runs).** A persistent `skyline.meta` blob tracks lifetime
  floors, perfects, furthest stage, best streak, and **badges** (first run,
  High-rise/Spire, a 5-flush streak, 25 perfects in a run, a century, 1,000 all-time
  floors, 25 runs). Game-over run report + account line. Skill-safe: badges, never
  power. Legacy `skyline.best` preserved.

## How it's built

```
skyline/
├── index.html            # markup + a boot-failure fallback (visible error, not a dead screen)
├── skyline.shell.js      # render shell: canvas, input, fixed-timestep loop, eased camera, eye-candy
├── skyline.core.js       # pure simulation — no DOM/canvas/timers, fully JSDoc'd
├── skyline.core.test.js
└── package.json          # { "type": "module" }
```

All the rules live in `skyline.core.js` as plain data and pure functions
(`createGame`, `tick`, `drop`, `moveCurrent`, `spawnCurrent`, `speedOf`, `slabSpeed`,
`pickFormation`, `loadFormation`, `milestoneBetween`, …). The shell never decides game
logic — it reads state and draws it, feeds the single drop input in, and calls `tick()`
on a fixed 60 Hz timestep.

The shell is loaded as an **external module** (`<script type="module"
src="./skyline.shell.js">`) — the conventional, robust way to ship it — and
`index.html` carries a small classic-script fallback that surfaces a visible message
if the module ever fails to load, so a load failure is never a silently dead screen.

### Design note: no timer-driven death

The tower never falls on its own and a slab never auto-drops — a slab only resolves on
an explicit `drop()`. So there is **no** "frame-one death": `tick()` merely slides the
live slab and can never end the run. Death happens exclusively inside `drop()` when the
intersection with the slab below is empty. Both facts are pinned by the suite
(`REGRESSION: tick() only slides and never ends the run`, and the zero-overlap death
test). A related invariant: a spawned slab is exactly as wide as the slab it lands on,
so width is monotonically non-increasing — the tower can only get harder, which is the
whole tension.

## Test

```sh
node --test          # from this folder (Node 18+, zero dependencies)
```

The suite (38 tests) covers reset/centering, the spawn width invariant, speed scaling
and cap, sliding and edge bounce, perfect drops (flush snap, width kept, bonus, streak
+ best-streak), imperfect drops (slice, narrowing, streak reset, inheritance), death on
no overlap and the barely-overlapping boundary, determinism under a seeded rng,
milestone range-crossing, stages + meta-progression, and the tick-only / off-play
inertness regressions. The **varied-structure** layer is pinned too: the formation pool
is well-formed (unique ids/names, non-decreasing `minStage`, a calm stage-0 on-ramp),
every `build` yields in-bounds specs, `pickFormation` is stage-gated and deterministic,
the calm share collapses from >75% at Foundation to <40% at the Spire (progression opens
the pool), distinct seeds build distinct structures while a seed replays exactly, the
queue never starves over a 500-drop run, only *notable* patterns cue, and `slabSpeed`
respects both the multiplier band and the hard cap.

## Tuning

All feel constants live in `CONFIG` at the top of `skyline.core.js` — base width, slab
height, slide speed (base/increment/cap), the wind multiplier band + hard cap, the
perfect-drop tolerance and bonus, the milestone table, the stage arc, and the
`FORMATIONS` pool. They're injectable per game instance, which is also how the tests stay
deterministic. **Adding a new wind pattern is a one-entry change to `FORMATIONS`** — the
lowest-risk, most player-visible way to grow this game.
