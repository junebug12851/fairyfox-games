/**
 * Polarity — pure game core (no DOM, no canvas, no timers).
 *
 * The whole simulation as plain data + pure functions, so it can be unit-tested
 * headlessly in Node and reused by the browser render shell (polarity.shell.js)
 * without modification. Nothing in here touches the document.
 *
 * The game: charged gates stream toward you from the right, each one either
 * positive or negative. You hold a single charge and flip it (one control). When a
 * gate reaches your line, matching polarity lets you phase through and score;
 * mismatch and you're destroyed. The stream speeds up as your score climbs — one
 * mechanic, beat your own score.
 *
 * Design note / the bug this structure guards against:
 * the gates are seeded a comfortable distance ahead of the player line, so the very
 * first tick can never instantly resolve a gate onto the player (the "frame-one
 * death" failure the pure-core split exists to make testable). `reset()` seeds the
 * buffer ahead of `PLAYER_X`; the suite pins that tick one neither scores nor dies.
 *
 * @module polarity.core
 */

/**
 * Tuning constants. Pixel units; rates are per fixed 60fps tick. Polarity is `0`
 * (negative) or `1` (positive).
 * @typedef {Object} PolarityConfig
 */
export const CONFIG = Object.freeze({
  PLAYER_X: 150,     // the player's fixed x — gates resolve when they reach it (px)
  GATE_GAP: 240,     // spacing between consecutive gates (px)
  GATE_W: 26,        // gate thickness, for rendering/feel (px)
  BUFFER: 5,         // how many gates are kept queued ahead at once
  SPEED_BASE: 3.2,   // gate approach speed at score 0 (px/tick)
  SPEED_INC: 0.06,   // speed added per point of score (px/tick)
  SPEED_MAX: 9.0,    // speed cap (px/tick)
  CLOSE_TICKS: 10,   // a match counts as a "clutch save" if you flipped within
                     // this many ticks before the gate resolved (last-moment flip)
  // Progress milestones: a label flashes the instant the score reaches each
  // threshold. Ordered ascending. Pure feedback — the shell reads these, the
  // simulation never branches on them.
  MILESTONES: Object.freeze([
    Object.freeze({ score: 10, label: 'Warming up' }),
    Object.freeze({ score: 25, label: 'Locked in' }),
    Object.freeze({ score: 50, label: 'Untouchable' }),
    Object.freeze({ score: 100, label: 'Singularity' }),
    Object.freeze({ score: 150, label: 'Event horizon' }),
    Object.freeze({ score: 200, label: 'Absolute zero' }),
  ]),
  // Stages — the coarse, *readable* arc of a run (Growth Architecture Layer 1). Unlike
  // the fine milestone flashes above, a stage is a named region of the difficulty curve
  // the player sits inside: it drives a quiet HUD chip and an ambient field tint that
  // shifts as you progress. `at` is the score to ENTER the stage; ordered ascending.
  // Pure data — the simulation never branches on it; the shell reads it for feel.
  STAGES: Object.freeze([
    Object.freeze({ at: 0,   name: 'Drift',         tint: '#35e0ff' }),
    Object.freeze({ at: 25,  name: 'Current',       tint: '#5ea8ff' }),
    Object.freeze({ at: 60,  name: 'Riptide',       tint: '#a98cff' }),
    Object.freeze({ at: 120, name: 'Event horizon', tint: '#ff5cc8' }),
    Object.freeze({ at: 180, name: 'Singularity',   tint: '#ff8f6a' }),
  ]),
});

/**
 * Achievement definitions — plain data (Growth Architecture Layer 2). `test` is a pure
 * predicate over (runSummary, metaAfterThisRun). Ordered; ids are stable forever, so
 * the persisted `achieved` map keeps meaning across releases. Skill-safe: every one is
 * a badge for a feat, never a persistent power. The shell toasts freshly-earned ones.
 * @typedef {{id:string,label:string,desc:string,test:(s:RunSummary,m:Meta)=>boolean}} Achievement
 * @type {ReadonlyArray<Achievement>}
 */
export const ACHIEVEMENTS = Object.freeze([
  Object.freeze({ id: 'first-run',    label: 'First charge',   desc: 'Finish a run.',
    test: (s, m) => m.plays >= 1 }),
  Object.freeze({ id: 'reach-riptide',label: 'Riptide',        desc: 'Reach the Riptide stage.',
    test: (s) => s.stageIndex >= 2 }),
  Object.freeze({ id: 'event-horizon',label: 'Event horizon',  desc: 'Reach the Event horizon stage.',
    test: (s) => s.stageIndex >= 3 }),
  Object.freeze({ id: 'century',      label: 'Centurion',      desc: 'Phase 100 gates in one run.',
    test: (s) => s.score >= 100 }),
  Object.freeze({ id: 'clutch-3',     label: 'Ice in the veins',desc: '3 clutch saves in a single run.',
    test: (s) => s.clutch >= 3 }),
  Object.freeze({ id: 'clean-50',     label: 'Untouched',      desc: 'Reach 50 with no clutch saves.',
    test: (s) => s.score >= 50 && s.clutch === 0 }),
  Object.freeze({ id: 'lifetime-1k',  label: 'Thousand gates', desc: 'Phase 1,000 gates all-time.',
    test: (s, m) => m.totals.gates >= 1000 }),
  Object.freeze({ id: 'regular',      label: 'Regular',        desc: 'Finish 25 runs.',
    test: (s, m) => m.plays >= 25 }),
]);

/**
 * A charged gate.
 * @typedef {{x:number, pol:0|1}} Gate
 */

/**
 * Full game state. Plain data — safe to clone, serialize, or snapshot.
 * @typedef {Object} GameState
 * @property {number} w                  playfield width (px)
 * @property {number} h                  playfield height (px)
 * @property {PolarityConfig} cfg        tuning constants in effect
 * @property {() => number} rng          RNG returning [0,1); injectable for tests
 * @property {'menu'|'play'|'dead'} phase current lifecycle phase
 * @property {0|1} pol                   the player's current polarity
 * @property {Gate[]} gates              upcoming gates, nearest (smallest x) first
 * @property {number} score              gates phased through this run
 * @property {number} clutch             clutch saves this run (matches landed by a
 *                                       last-moment flip; see CLOSE_TICKS)
 * @property {number} flipT              tick of the most recent polarity flip
 * @property {number} t                  ticks elapsed this run
 */

/**
 * Create a new game. Does not start it (phase is 'menu'); call {@link start}.
 * @param {number} width playfield width (px)
 * @param {number} height playfield height (px)
 * @param {Object} [opts]
 * @param {() => number} [opts.rng=Math.random] RNG returning [0,1)
 * @param {Partial<PolarityConfig>} [opts.config] config overrides (mainly tests)
 * @returns {GameState}
 */
export function createGame(width, height, opts = {}) {
  const cfg = opts.config ? Object.freeze({ ...CONFIG, ...opts.config }) : CONFIG;
  /** @type {GameState} */
  const g = {
    w: width, h: height, cfg,
    rng: opts.rng || Math.random,
    phase: 'menu',
    pol: 0, gates: [], score: 0, clutch: 0, flipT: -9999, t: 0,
  };
  reset(g);
  return g;
}

/**
 * A fresh random polarity (0 or 1) from the game's rng.
 * @param {GameState} g
 * @returns {0|1}
 */
export function randPol(g) {
  return g.rng() < 0.5 ? 0 : 1;
}

/**
 * Reset a game to a fresh run in-place: neutral-ahead gate buffer, score 0.
 * Gates are seeded a full GATE_GAP ahead of the player line so the first tick is
 * always safe. Leaves `phase` untouched; {@link start} flips it to 'play'.
 * @param {GameState} g
 * @returns {GameState} the same state, mutated
 */
export function reset(g) {
  g.pol = 0;
  g.score = 0;
  g.clutch = 0;
  g.flipT = -9999;  // "no recent flip" — far enough back that frame-one is never clutch
  g.t = 0;
  g.gates = [];
  for (let i = 0; i < g.cfg.BUFFER; i++) {
    g.gates.push({ x: g.cfg.PLAYER_X + g.cfg.GATE_GAP * (i + 1), pol: randPol(g) });
  }
  return g;
}

/**
 * Begin a run: reset and flip to 'play'.
 * @param {GameState} g
 * @returns {GameState}
 */
export function start(g) {
  reset(g);
  g.phase = 'play';
  return g;
}

/**
 * Flip the player's polarity. The whole control surface of the game.
 * @param {GameState} g
 * @returns {0|1} the new polarity
 */
export function toggle(g) {
  g.pol = g.pol ? 0 : 1;
  g.flipT = g.t;   // remember when — a match soon after this is a "clutch save"
  return g.pol;
}

/**
 * Was the player's most recent flip a last-moment one (within CLOSE_TICKS)? Pure;
 * the tick logic uses it to tally clutch saves when a gate resolves as a match.
 * @param {GameState} g
 * @returns {boolean}
 */
export function isClutch(g) {
  return g.t - g.flipT <= g.cfg.CLOSE_TICKS;
}

/**
 * Current gate approach speed — scales with score, capped at SPEED_MAX.
 * @param {GameState} g
 * @returns {number} px per tick
 */
export function speedOf(g) {
  return Math.min(g.cfg.SPEED_MAX, g.cfg.SPEED_BASE + g.score * g.cfg.SPEED_INC);
}

/**
 * The milestone label newly reached at exactly this score, or `null`.
 *
 * Score climbs one point per gate phased, so an exact-equality check fires each
 * milestone once, the instant it's crossed — the shell flashes the returned label.
 * Pure and side-effect free; the simulation never depends on it.
 * @param {PolarityConfig} cfg tuning constants (carries the milestone table)
 * @param {number} score current score
 * @returns {string|null} the milestone label hit at this exact score, else null
 */
export function milestoneAt(cfg, score) {
  const list = cfg.MILESTONES || [];
  for (const m of list) if (m.score === score) return m.label;
  return null;
}

/**
 * Append a fresh gate one GATE_GAP beyond the current last gate (keeps the stream
 * flowing and evenly spaced).
 * @param {GameState} g
 * @returns {Gate} the spawned gate
 */
export function spawnGate(g) {
  const lastX = g.gates.length ? g.gates[g.gates.length - 1].x : g.cfg.PLAYER_X;
  const gate = { x: lastX + g.cfg.GATE_GAP, pol: randPol(g) };
  g.gates.push(gate);
  return gate;
}

/**
 * Result of a single {@link tick}.
 * @typedef {{passed:boolean, died:boolean, clutch:boolean}} TickResult
 * @property {boolean} clutch true when a gate passed this tick via a last-moment flip
 */

/**
 * Advance the simulation one fixed tick: move every gate left by the current speed,
 * then resolve any gate that has reached the player line — a polarity match phases
 * through (score, refill the buffer); a mismatch ends the run. No-op unless phase
 * is 'play'.
 * @param {GameState} g
 * @returns {TickResult}
 */
export function tick(g) {
  if (g.phase !== 'play') return { passed: false, died: false, clutch: false };
  g.t++;
  const speed = speedOf(g);
  for (const gate of g.gates) gate.x -= speed;

  let passed = false, clutch = false;
  // Gates are ordered nearest-first; resolve any that have reached the line.
  while (g.gates.length && g.gates[0].x <= g.cfg.PLAYER_X) {
    const gate = g.gates[0];
    if (gate.pol === g.pol) {
      g.score++;
      passed = true;
      if (isClutch(g)) { g.clutch++; clutch = true; }
      g.gates.shift();
      spawnGate(g);          // keep the buffer full
    } else {
      g.phase = 'dead';
      return { passed, died: true, clutch };
    }
  }
  return { passed, died: false, clutch };
}

// ── Growth Architecture ─────────────────────────────────────────────────────────
// Layer 1 (stages) + Layer 2 (meta-progression) as pure data + pure functions, so all
// the progression *logic* is unit-tested headlessly. The shell owns only the IO:
// localStorage load/save, DOM, and canvas. See notes/reference/growth-architecture.md.

/**
 * Index of the current stage for a score — the highest STAGES entry whose `at` the
 * score has reached. Clamps to the last stage. Pure.
 * @param {PolarityConfig} cfg
 * @param {number} score
 * @returns {number} 0..STAGES.length-1
 */
export function stageIndexAt(cfg, score) {
  const s = (cfg && cfg.STAGES) || [];
  let i = 0;
  for (let k = 0; k < s.length; k++) if (score >= s[k].at) i = k;
  return i;
}

/**
 * The current stage object for a score. Pure.
 * @param {PolarityConfig} cfg
 * @param {number} score
 * @returns {{at:number,name:string,tint:string}}
 */
export function stageAt(cfg, score) {
  return cfg.STAGES[stageIndexAt(cfg, score)];
}

/**
 * Progress through the current stage toward the next — drives the quiet HUD chip and
 * its progress bar. `frac` is 0 at a stage boundary and approaches 1 just before the
 * next; `isLast` is true only in the final stage (then `frac` is 1). Pure.
 * @param {PolarityConfig} cfg
 * @param {number} score
 * @returns {{index:number,name:string,tint:string,next:?string,nextAt:?number,into:number,span:number,frac:number,isLast:boolean}}
 */
export function stageProgress(cfg, score) {
  const list = cfg.STAGES;
  const index = stageIndexAt(cfg, score);
  const cur = list[index];
  const next = list[index + 1] || null;
  const into = score - cur.at;
  const span = next ? next.at - cur.at : 0;
  const frac = next ? Math.max(0, Math.min(1, into / span)) : 1;
  return {
    index, name: cur.name, tint: cur.tint,
    next: next ? next.name : null, nextAt: next ? next.at : null,
    into, span, frac, isLast: !next,
  };
}

/**
 * A finished run distilled to plain data for the meta layer. The shell builds this from
 * the final GameState; the pure fns below consume it.
 * @typedef {{score:number, stageIndex:number, clutch:number}} RunSummary
 */

/**
 * Persistent cross-run save (Growth Architecture Layer 2). Plain JSON — safe to store.
 * @typedef {Object} Meta
 * @property {number} v          schema version
 * @property {number} plays      lifetime runs finished
 * @property {number} best       best single-run score (mirrors legacy `polarity.best`)
 * @property {number} bestStage  furthest stage index ever reached
 * @property {{gates:number, clutch:number}} totals lifetime cumulative counters
 * @property {Object<string,boolean>} achieved achievement ids earned
 */

/**
 * Normalise any prior meta (including a legacy blob that had only a best score, or
 * nothing at all) into a complete, current-schema Meta. Pure; never mutates the input.
 * @param {Partial<Meta>} [m]
 * @param {number} [legacyBest=0] a best score recovered from the old `polarity.best` key
 * @returns {Meta}
 */
export function normalizeMeta(m, legacyBest = 0) {
  const src = m && typeof m === 'object' ? m : {};
  const totals = src.totals && typeof src.totals === 'object' ? src.totals : {};
  return {
    v: 1,
    plays: src.plays | 0,
    best: Math.max(src.best | 0, legacyBest | 0),
    bestStage: src.bestStage | 0,
    totals: { gates: totals.gates | 0, clutch: totals.clutch | 0 },
    achieved: src.achieved && typeof src.achieved === 'object' ? { ...src.achieved } : {},
  };
}

/**
 * Pure reducer: fold a finished run into the meta. Returns a NEW Meta — increments
 * lifetime counters, raises best/bestStage monotonically, and flips any newly-earned
 * achievement ids on. Idempotent for achievements (re-earning is a no-op). No IO.
 * @param {Partial<Meta>} meta prior meta (any shape; normalised internally)
 * @param {RunSummary} summary the run that just ended
 * @param {PolarityConfig} [cfg=CONFIG]
 * @returns {Meta} the new meta
 */
export function applyRun(meta, summary, cfg = CONFIG) {
  const next = normalizeMeta(meta);
  next.plays += 1;
  next.totals.gates += summary.score | 0;
  next.totals.clutch += summary.clutch | 0;
  next.best = Math.max(next.best, summary.score | 0);
  next.bestStage = Math.max(next.bestStage, summary.stageIndex | 0);
  for (const a of ACHIEVEMENTS) {
    if (!next.achieved[a.id] && a.test(summary, next)) next.achieved[a.id] = true;
  }
  return next;
}

/**
 * Achievement ids present in `nextMeta` but not `prevMeta` — the ones just earned, in
 * ACHIEVEMENTS order, as {id,label,desc}. Pure; for the shell to toast on game over.
 * @param {Partial<Meta>} prevMeta
 * @param {Partial<Meta>} nextMeta
 * @returns {Array<{id:string,label:string,desc:string}>}
 */
export function newlyEarned(prevMeta, nextMeta) {
  const before = (prevMeta && prevMeta.achieved) || {};
  const after = (nextMeta && nextMeta.achieved) || {};
  const out = [];
  for (const a of ACHIEVEMENTS) {
    if (after[a.id] && !before[a.id]) out.push({ id: a.id, label: a.label, desc: a.desc });
  }
  return out;
}
