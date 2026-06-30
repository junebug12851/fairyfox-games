# Orbit Slingshot

A one-mechanic gravity game. Your probe orbits a planet under Newtonian gravity.
**Hold** the mouse / tap / **Space** to fire a *prograde* thrust — adding energy
widens your orbit; release and gravity reels you back in. Sweep through the glowing
targets to score. Crash into the planet or fly off the edge of space and the run
ends. One control, beat your own score.

## How it's built

Like every Fairy Fox game, the simulation is a **pure logic core** with no DOM,
canvas, or timers:

- [`orbit-slingshot.core.js`](orbit-slingshot.core.js) — the whole game as plain
  data + pure functions (`tick`, `gravityAt`, `pickTarget`, …), JSDoc'd, with an
  injectable seeded RNG. Integration is **semi-implicit (symplectic) Euler**, which
  keeps a circular orbit bounded over long runs instead of spiraling out.
- [`orbit-slingshot.shell.js`](orbit-slingshot.shell.js) — the browser player:
  canvas, hold-to-thrust input, fixed-timestep loop, orbit trail + thrust-flame
  eye-candy, and the best score in `localStorage`. Loaded as an external module;
  `index.html` carries a boot-failure fallback so a load error is never a silently
  dead screen.
- [`orbit-slingshot.core.test.js`](orbit-slingshot.core.test.js) — the test suite.

## Play locally

ES modules need HTTP, not `file://`:

```sh
# from the repo root
python -m http.server 8000
# then open http://localhost:8000/games/orbit-slingshot/
```

## Test

```sh
cd games/orbit-slingshot && node --test     # zero dependencies, Node 18+
```

Covers the circular-orbit seed, deterministic target placement, gravity direction
and centre-softening, that prograde thrust adds speed, **long-run orbit stability**
(600 coasting ticks stay bounded), crash/escape deaths, scoring, and the frame-one
survival regression.
