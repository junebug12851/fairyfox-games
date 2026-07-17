# Plan — Orbit Slingshot gets "depth inside the mechanic" (2026-07-17, GROW run)

**Why this game:** the depth rollout is 4/13 (Polarity, Brim, Echo Chamber, Ink Bloom; Tether +
Reprise born with it). Orbit Slingshot is the **oldest game without the layer** (3rd game built),
and it has the exact stage-index plateau the sweep item flags: escalation (annulus pull + pickup
shrink) is keyed **only on the stage index**, and stages stop at Deep space (score 120) — past
that nothing ever gets harder, so the whole ceiling shows in minutes.

**The one verb:** hold to thrust prograde. All four depth items land on it; no new controls;
all safe to not know (standard: `../reference/depth-inside-the-mechanic.md`).

1. **No plateau.** `targetRadius` gains a smooth **score asymptote** on top of the stage shrink
   (`R_SHRINK_SPAN` 0.30, knee `R_SHRINK_K` 150), hard-floored at `R_HARD_MINFRAC` 0.5 — the
   pickup window keeps tightening forever, approaching but never reaching the floor, and no
   config override can spike past it. Regression pins: still shrinking past score 120; floor
   honoured under a rogue override.
2. **The tech — the Kiss.** The close-pass band (60px, drawn as the felt skim mechanic) hides a
   razor sub-window: collect a target after passing within `KISS_BAND` (7px) of the surface and
   it's a **Kiss** — `KISS_BONUS` (+2) on top of the skim bonus, a gold flare, and a streak.
   Taught nowhere (kiss ⊂ max-skim, the EC node ⊂ perfect shape). A non-kiss pickup breaks the
   streak.
3. **The reversal — the Aurora.** `KISS_TRIGGER` (3) kissed pickups in a row light an **Aurora**
   over the planet: `AURORA_TICKS` (300, ~5s) in which **every point doubles** (`AURORA_MULT` 2)
   — the daring line becomes the greedy line. Announced only when earned; shell bloom is
   colour-only (reduced-motion friendly).
4. **A secret stage — Interstellar.** Past Deep space at score 240 (`secret: true`, EC's reveal
   pattern — toast on arrival, never listed up front). Start tips trimmed to a curiosity hook
   (drop the stage list + pattern list).

**Meta/badges:** `totals.kisses` (lossless legacy upgrade), RunSummary gains `kisses`/`auroras`,
run report appends them; 3 new skill-safe badges (8 → 11): Kiss ≥1, Aurora ≥1, reach
Interstellar.

**Tests (~10 new, pure core):** asymptote monotone + floored + override-proof; kiss detect /
streak-break; aurora trigger/doubling/expiry; secret stage indexed + flagged; meta fold +
lossless upgrade; badge predicates. Green before shell work.

**Shell:** gold flare + 'Kiss! +N' toast on a kiss; aurora bloom ring + 'Aurora' toast +
countdown-tinted planet halo; secret-stage reveal toast; run-report line; trimmed tips.

**Log:** player changelog (`assets/changelog.js` + `_data/changelog.json` — check which is
canonical post-Jekyll), `_games/orbit-slingshot.md` updated-date bump, VERSION patch → 0.23.2,
session note + dev changelog + status.
