# Growth Architecture — the shared pattern every game grows into

_How we turn each score-attack toy into something that **visibly grows over months**
while staying instantly playable. This is the concrete engineering pattern behind
`game-design.md`; the staged rollout is `../plans/growth-roadmap.md`._

## Why this exists

The daily cadence has been adding micro-polish (a toast here, a milestone there) but
nothing **structural**, so the collection doesn't *feel* like it's growing. This
pattern fixes that by giving every game the same three durable layers to deepen along,
each with a defined home in the existing **pure-core / shell / html** split:

| Layer | What the player feels | Where it lives | Tested? |
|-------|----------------------|----------------|---------|
| **Stages** (in-run arc) | "the run has chapters — I reached _Event horizon_" | pure **core** (data + pure fns) | ✅ headless |
| **Meta-progression** (account arc) | "no run is wasted; I'm unlocking things over weeks" | logic in **core**, storage in **shell** | ✅ logic in core |
| **Feel / HUD** (moment-to-moment) | "every action is juicy and the state is glanceable" | **shell** + **html** | eyes (Chrome preview) |

Hard rule preserved: **no cross-game imports.** This is a *convention with identical
shapes*, implemented inside each game's own `core`/`shell`. A game folder stays
self-contained and liftable. Consistency comes from following the shapes below, not
from a shared runtime module.

The discipline that makes it testable: **the core stays pure and owns all logic; the
shell only does IO** (DOM, canvas, `localStorage`, timers). Persistence *storage* is
the shell's; persistence *math* (what a run earns, the new totals) is the core's, so
it's covered by `node --test`.

---

## Layer 1 — Stages (in-run progression), in the core

A **stage** is a named region of the difficulty curve the player can feel arriving.
It gives a run an arc and answers "how far did I get?" in words, not just a number.
Stages are the structural big-brother of the `MILESTONES` table games already have —
in most games we **promote milestones to stages** rather than adding a parallel系统.

### Core additions (pure)

```js
// In CONFIG — ordered ascending by `at` (score/threshold to ENTER the stage).
STAGES: Object.freeze([
  Object.freeze({ at: 0,   name: 'Drift',        tint: '#6ad' }),
  Object.freeze({ at: 25,  name: 'Current',      tint: '#8cf' }),
  Object.freeze({ at: 60,  name: 'Riptide',      tint: '#a9f' }),
  Object.freeze({ at: 120, name: 'Event horizon',tint: '#f6c' }),
  // …game-specific, 4–6 stages, evocative names that fit the game's world
]),
```

```js
/** Index of the current stage for a score (highest `at` not exceeding score). Pure. */
export function stageIndexAt(cfg, score) { /* linear scan, returns 0..n-1 */ }

/** The current stage object. Pure. */
export function stageAt(cfg, score) { return cfg.STAGES[stageIndexAt(cfg, score)]; }

/** Progress within the current stage toward the next: { index, name, next, into,
 *  span, frac (0..1), isLast }. Drives a quiet HUD progress chip. Pure. */
export function stageProgress(cfg, score) { /* … */ }
```

**Honesty rule:** stages **name** the existing curve; they may add at most a *small,
legible* texture (a slightly steeper ramp, one new element joining) but never a hidden
difficulty spike or rubber-band. The player earns the ramp by scoring. Difficulty that
already scales with score (our norm) stays the source of truth; `STAGES` is the
readable overlay on top of it. Where a game already escalates in steps (Loft adds orbs,
Echo tightens the window), formalise those steps *as* the stages.

### Test requirements (core)

- `stageIndexAt` returns 0 at score 0, increments exactly at each `at` boundary, and
  clamps to the last stage.
- `stageProgress.frac` is 0 at a boundary and approaches 1 before the next; `isLast`
  true only in the final stage.
- A regression test pinning the boundary scores (off-by-one at `at` is the classic bug).

---

## Layer 2 — Meta-progression (the account arc)

Persistent progress across runs. **The engine of long-term return** and the thing that
makes a player "feel cool they followed the game from the beginning." Kept to the
**skill-safe** forms only: cumulative stats, achievements, and cosmetic/expressive or
new-*mode* unlocks — **never persistent power** that makes winning easier.

### The standard save schema (per game)

One namespaced key holds a single JSON blob. **Keep the existing `"<slug>.best"` key
working** (read it as a legacy fallback) so no player loses their record.

```
localStorage["<slug>.meta"] = JSON.stringify({
  v: 1,                 // schema version, for safe migration
  plays: 0,             // lifetime runs finished
  best: 0,              // best score (mirrors legacy <slug>.best)
  bestStage: 0,         // furthest stage index ever reached
  totals: { /* game-specific lifetime counters, e.g. gatesPhased, motesEaten */ },
  unlocked: { /* id: true */ },      // cosmetic/mode unlock ids
  achieved: { /* id: true */ },      // achievement ids earned
})
```

### Core additions (pure — so the logic is tested)

```js
/** A finished run distilled to plain data the meta layer consumes. Built by the shell
 *  from the final GameState, but SHAPED and CONSUMED by pure core fns. */
// RunSummary example: { score, stageIndex, <game counters: clutch, skims, perfects…> }

/** Pure reducer: given prior meta + this run's summary, return the NEW meta.
 *  Increments totals, updates best/bestStage, flips any newly-earned achievement/
 *  unlock ids. No IO. This is the tested heart of meta-progression. */
export function applyRun(meta, summary, cfg) { /* returns new meta object */ }

/** Achievement + unlock definitions — plain data in the core. `test` is a pure
 *  predicate over (summary, metaAfter). Ordered; ids are stable forever. */
export const ACHIEVEMENTS = Object.freeze([
  Object.freeze({ id: 'first-run',  label: 'First bloom',   desc: 'Finish a run.',
                  test: (s, m) => m.plays >= 1 }),
  Object.freeze({ id: 'reach-3',    label: 'Deep water',    desc: 'Reach stage 4.',
                  test: (s) => s.stageIndex >= 3 }),
  Object.freeze({ id: 'century',    label: 'Centurion',     desc: 'Score 100 in a run.',
                  test: (s) => s.score >= 100 }),
  Object.freeze({ id: 'lifetime-1k',label: 'Thousand-strong',desc: '1,000 all-time.',
                  test: (s, m) => m.totals.<counter> >= 1000 }),
  // 6–10 per game: a mix of single-run feats and slow cumulative ones.
]),

/** Newly-earned ids this run (in ACHIEVEMENTS order) — pure, for the shell to toast. */
export function newlyEarned(prevMeta, nextMeta) { /* diff achieved/unlocked */ }
```

**Unlock taxonomy (skill-safe only):**

- **Cosmetic** — a palette/trail/orb-style/field-tint variant. Pure flavour.
- **Titles / ranks** — a name the player earns and sees ("Riptide veteran").
- **Modes** — a *different way to play the same verb* (e.g. a calm "Zen" no-fail
  practice mode, or a "Sprint" to a target). New way, not new power.
- ❌ **Never** — persistent stat boosts, extra lives, slower speed, easier gates. Those
  trivialise the skill that is the game.

### Test requirements (core)

- `applyRun` increments `plays`, accumulates `totals`, and sets `best`/`bestStage`
  monotonically (never decreases).
- Each achievement `test` fires exactly when its condition is first met and `applyRun`
  records it idempotently (running twice doesn't double-count).
- `newlyEarned` returns only ids not previously present.
- A migration test: `applyRun` on an empty/legacy meta (only `<slug>.best` present)
  produces a valid v1 blob without losing the old best.

### Shell responsibilities (IO only)

- Load `"<slug>.meta"` (falling back to legacy `"<slug>.best"`), guard with try/catch.
- On game over: build the `RunSummary`, call `applyRun`, save, and **toast newly-earned
  achievements/unlocks** on the game-over card.
- Surface a compact **collection view** the player can see progress in (see Layer 3).

---

## Layer 3 — Feel & HUD depth (shell + html)

Make the same events feel great and the new state glanceable, without clutter.

### HUD (html + shell)

- **Stage chip** — a small, quiet label + thin progress bar toward the next stage,
  near the score. Animates on stage change (pop + tint shift). Peripheral, never loud.
- **Multiplier/streak readout** where the game has one — big only while active, fades
  when idle.
- Keep the score dominant and tabular; everything else is secondary and calmer.

### Juice (shell/canvas)

- **Stage-change moment:** a distinct, earned beat — brief field tint shift to the
  stage's `tint`, a soft shockwave/particles, a one-line stage banner (reuse the
  milestone banner machinery). This is the single most important new "feel" event: it
  makes growth *visible mid-run*.
- **Layer feedback on payoff:** flash + particle + number-pop + (later) sound on
  scores, richer on risky/bonus scores.
- **Near-miss surfacing** on the game-over card where meaningful ("1 from a new best",
  "closest skim: 4px") — honest, from real run data.
- **Respect `prefers-reduced-motion`:** stage tints stay, shake/particles scale to
  near-zero.

### The game-over card (html)

Grows from "score + best" into a compact **run report + account snapshot**:

- This run: score, furthest stage, key feat counters (already partly present).
- Any newly-earned achievements/unlocks (toasted).
- A one-line account line: "Run 47 · 12,400 all-time · 8/10 unlocked" — the "you've
  been following this" line.
- Optional: a tiny achievements/collection grid (opt-in expand), so it stays clean.

---

## The layering guarantee (how depth stays simple)

- A **brand-new player** sees: the same start panel, the same one input, the same
  clean field. Stages just make the ramp readable; meta just adds a quiet line on the
  game-over card. Nothing new is *required*.
- A **returning player** sees: progress toward the next unlock, achievements to chase,
  furthest-stage to beat, and modes to switch to — depth they opted into.
- Every addition runs through the **simple-but-deep checklist** in `game-design.md`.
  If it fails a line, it shrinks or doesn't ship.

## Naming & consistency conventions (so all 7 feel like one family)

- Core fns: `stageIndexAt` · `stageAt` · `stageProgress` · `applyRun` · `newlyEarned`;
  data: `STAGES` · `ACHIEVEMENTS`.
- Save keys: `"<slug>.meta"` (blob) + legacy `"<slug>.best"` (kept readable).
- Stage counts: **4–6** per game. Achievements: **6–10** per game, mixing single-run
  and cumulative.
- Stage/achievement **names fit the individual game's world** (Ink Bloom's are botanical,
  Orbit's are astronomical…) — the *shapes* are shared, the *flavour* is per-game.
- README of each game gains a short "How it grows" section listing its stages + unlock
  ideas, so contributors extend it the same way.
