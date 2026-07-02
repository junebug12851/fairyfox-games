# Principles

Standing guardrails — what this project values and what to avoid. Design depth detail
lives in `../reference/game-design.md` + `../reference/growth-architecture.md`.

## Values
- **Simple-but-deep.** One mechanic anyone learns in ~3 seconds, with depth layered
  *underneath* for those who return. Depth is opt-in; the default path stays instant.
  "Simple-but-deep beats busy" is the whole project.
- **Every run banks something.** Games grow along three layers — in-run **stages**,
  cross-run **meta-progression**, and moment-to-moment **feel/HUD** — so following a
  game over months feels rewarding. No run is wasted.
- **Skill-safe progression.** Persistent unlocks are cosmetics, titles, and new *modes*
  — never persistent power that trivialises the skill.
- **Feel echoes the mechanic.** Juice (flash, shake, particles, stage beats) attaches
  to meaningful events only, and honours `prefers-reduced-motion`.
- **Provable, not just plausible.** Pure logic core + real `node --test` coverage; the
  shell only does IO. Green + Chrome-previewed before release.
- **Player-respecting.** No accounts, no tracking, local-only saves, self-hosted fonts,
  honest feedback (real near-misses, shame-free streaks) — retention earned by being
  good, never by dark patterns.

## What to avoid
- Convoluted, cluttered, or unstable additions — if it risks the polish bar, it doesn't
  ship (the hard constraint).
- Persistent power unlocks; hidden rubber-band difficulty; faked near-misses.
- Cross-game imports (each game stays self-contained + liftable); the growth pattern is
  a shared *convention*, copied in shape, not a shared runtime module.
- Third-party requests (no Google Fonts hot-link); anything that leaks visitor data.
- Bumping MAJOR, or releasing to `main` without Fairy Fox's approval.
