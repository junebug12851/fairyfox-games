# Polarity

A one-mechanic charge-matching runner. Charged gates stream in from the right, each
**cyan (−)** or **magenta (+)**. You carry one charge and flip it with a single
control — click, tap, or **Space**. Match a gate's polarity to phase through and
score; clash and you're destroyed. The stream speeds up as your score climbs. Beat
your own score.

**Tip:** flip *early* — set your charge while the next gate is still far off, then
leave it, and read two gates ahead rather than chasing the line. A flip landed in the
last instant before a gate resolves counts as a **clutch save**, tallied on game over
— a measure of how much you played on the edge. Progress milestones flash at **10, 25,
50, 100, 150, and 200**.

## How it grows

Polarity follows the shared **Growth Architecture** (`notes/reference/growth-architecture.md`)
— depth layered *under* the same one-tap game, never in front of it:

- **Stages (the run's arc).** Each run flows through named regions of the difficulty
  curve — **Drift → Current → Riptide → Event horizon → Singularity** — shown as a
  quiet HUD chip with a progress bar, an ambient field tint that shifts as you climb,
  and a soft shockwave when a new stage begins. Stages *name* the ramp; they never add
  a hidden spike (`STAGES`, `stageIndexAt`, `stageProgress` — all pure + tested).
- **Meta-progression (across runs).** A persistent `polarity.meta` blob tracks lifetime
  runs, total gates phased, furthest stage, and **badges** you earn for feats (first
  run, reaching Riptide/Event horizon, a century, three clutch saves, an untouched 50,
  1,000 all-time gates, 25 runs). No run is wasted — the game-over card shows a run
  report + an account line. Skill-safe by design: badges and cosmetics, **never power**.
  Backward-compatible with the legacy `polarity.best` key, so no record is lost.
- **Feel/HUD.** Layered flash / shake / stage beats, honouring `prefers-reduced-motion`.

Progression *logic* (stages + the `applyRun` meta reducer + achievement predicates)
lives in the pure core and is unit-tested headlessly; the shell only does IO.

## How it's built

Like every Fairy Fox game, the simulation is a **pure logic core** with no DOM,
canvas, or timers:

- [`polarity.core.js`](polarity.core.js) — the whole game as plain data + pure
  functions (`tick`, `toggle`, `spawnGate`, `speedOf`, …), JSDoc'd, with an
  injectable seeded RNG so gate polarities are reproducible.
- [`polarity.shell.js`](polarity.shell.js) — the browser player: canvas, the
  flip-polarity input, fixed-timestep loop, flash/shake eye-candy, and the best
  score in `localStorage`. Loaded as an external module; `index.html` carries a
  boot-failure fallback so a load error is never a silently dead screen.
- [`polarity.core.test.js`](polarity.core.test.js) — the test suite.

## Play locally

ES modules need HTTP, not `file://`:

```sh
# from the repo root
python -m http.server 8000
# then open http://localhost:8000/games/polarity/
```

## Test

```sh
cd games/polarity && node --test     # zero dependencies, Node 18+
```

Covers the seeded gate buffer, even spacing, the toggle control, score-scaled speed
with a cap, gate motion, match/mismatch resolution (and the inclusive boundary),
determinism, a 2000-tick "buffer never empties" check, the milestone feedback
(`milestoneAt` fires once per threshold, exact-equality, tolerates a missing table),
the clutch-save tally (`isClutch` window, last-moment flips counted, ancient flips
ignored, cleared on reset), the frame-one safety regression, the **stage** table and
`stageIndexAt`/`stageProgress` boundaries, and the **meta-progression** reducer
(`normalizeMeta` legacy recovery, `applyRun` monotonic totals/bests, idempotent +
cumulative achievements, and `newlyEarned` diffs).
