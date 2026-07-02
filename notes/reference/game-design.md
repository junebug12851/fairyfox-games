# Game Design — the body of knowledge behind our games

_A durable reference for **why** small games become captivating, narrowed to our
niche: one-mechanic, beat-your-own-score canvas games. Researched and written to be
reused every time we grow a game. Read this before designing depth; the concrete
pattern that puts it into practice is `growth-architecture.md`, the staged plan is
`../plans/growth-roadmap.md`._

The one-line thesis: **a game is captivating when a tight, satisfying loop is wrapped
in a difficulty curve matched to the player's growing skill, and every run — win or
lose — visibly moves a longer arc forward.** Everything below is a facet of that
sentence.

---

## 1. The core loop (the atom of engagement)

Every compelling game is, at heart, a **compulsion loop**: a short chain the player
feels pulled to repeat — *Action → Feedback → Reward → Motivation → Repeat*. The
anticipation of the reward is where the brain releases dopamine; the reward confirms
it; the confirmation motivates the next action. Roguelikes weaponise this with short
runs, quick restart, and high variance so "one more run" costs almost nothing.

For us this means:

- **The loop must be ≤ a few seconds and fully legible.** In our games the atom is:
  *read the situation → make the one input → see an immediate, satisfying result →
  score ticks → tension resets slightly higher*. If any of those four beats is weak,
  the whole game feels flat.
- **Restart friction must be near zero.** One tap to play again, from the same
  posture as the game itself. We already do this (press-to-restart); protect it.
- **The reward has to land in the same instant as the action.** Latency between input
  and feedback is the single fastest way to kill feel.

## 2. Flow — the difficulty curve is the game

Csikszentmihalyi's **flow** is the state of absorbed focus you reach when *challenge
matches skill*. Too hard → anxiety; too easy → boredom. A great game keeps the player
walking the ridge between them, and because the player's skill **rises over a
session**, the challenge has to rise with it.

Practical rules:

- **Easy to learn, hard to master.** One rule anyone grasps in seconds, with a skill
  ceiling that keeps rewarding practice. This is the whole design brief of our games —
  protect the "learn in 3 seconds" half as fiercely as the "deep to master" half.
- **The curve should ramp, not jump.** Difficulty rises smoothly with score (we do
  this with speed). Add *texture* to the ramp — distinct stages/tiers the player can
  feel arriving — so the run has an **arc** rather than a monotone slope. A stage is a
  named region of the curve ("the speed picks up", "a second orb joins"); it does not
  have to be a new rule.
- **Dynamic difficulty adjustment (DDA)** — nudging difficulty from live performance —
  is the pro version of this. We keep it *light and honest*: our curve keys off score
  (the player earns the ramp), never off hidden rubber-banding that fakes a result.
- **Give the player a breath.** Flow needs rhythm, not constant maximum pressure.
  Moments of ease between spikes (a slower stretch after a hard tier) make the spikes
  read as spikes.

## 3. Progression — the run has an arc; the account has a longer one

Two layers, and our games have historically only had a shadow of the first:

- **In-run progression (session arc).** Within a single run, things escalate in
  *readable stages*: faster, denser, a new wrinkle, a boss-beat / milestone. The
  player should be able to answer "how far did I get?" in stage terms, not just a
  number. Milestones (we have these) are the seed of this; **stages** are the
  structural version.
- **Meta-progression (the account arc).** Persistent progress that **carries across
  runs and accumulates over the player's whole history** — unlocks, achievements,
  cumulative totals, new modes/variants. This is the engine of long-term return: it
  makes failure productive ("no run is wasted") and turns a score-attack toy into
  something you *follow over months*. This is the layer that makes a player "feel cool
  that they followed the game from the beginning."

Meta-progression design cautions (learned from roguelites):

- **Never let it trivialise skill.** Persistent power that makes the game *easier* to
  win erodes the challenge that made it fun. Our safe forms are **cosmetic/expressive
  unlocks, new modes, achievements, and cumulative stat tracking** — reasons to return
  that don't nerf the core. Prefer "unlock a new way to play" over "unlock a way to
  win more easily."
- **Every run must bank something.** Even a bad run should tick a lifetime counter,
  chip toward the next unlock, or reveal a near-miss. That's the "productive failure"
  that fuels one-more-run.
- **Reveal gradually.** New wrinkles and options introduced over time double as a
  slow, self-paced tutorial and keep the game feeling *alive and updating*.

## 4. Game feel / "juice" — the same events, made to feel great

**Juice** is the layer of animation and audio that makes a working game feel
*satisfying*: screenshake, particles, flashes, easing, squash-and-stretch, chunky
sound. Vlambeer's "The Art of Screenshake" is the canonical text; the core insight is
that **feel is cheap to add and enormous in effect** — the same mechanic can feel dead
or delicious depending only on its juice.

Rules we hold to:

- **Juice must echo the mechanic.** Effects belong to specific meaningful events
  (a score, a near-miss, a stage change, death) — never random garnish. Screenshake on
  a gentle game reads as broken.
- **Feedback is layered.** A single good event can fire: a flash, a particle burst, a
  number pop, a sound, a tiny time-dilation. Stacking cheap layers is what makes a
  moment feel *big*.
- **Respect `prefers-reduced-motion`.** Juice is opt-out for people who need calm; our
  CSS already honours this and our canvas effects should scale down when it's set.
- **Restraint on the base state, generosity on payoff.** A calm idle field makes the
  payoff pop. Don't juice everything equally.

## 5. Scoring, risk/reward, and the near-miss

Arcade scoring is a design surface, not a counter:

- **Reward skilful risk.** Optional danger for optional reward — dive for the bonus or
  play safe — is the engine of arcade tension (Ikaruga-style chaining, close-pass
  skims, flush drops). We already seed this (prism motes, skim bonus, flush drops,
  clutch saves). Make the risky line *legible and tempting*.
- **Combos/chains** reward sustained skill and get harder to keep the longer they run —
  a self-balancing risk/reward. Bank-on-break (you can lose the chain) creates the
  tension.
- **The near-miss effect is real and powerful — use it honestly.** An *almost* fires
  the same reward circuitry as a win and drives "just one more". Surfacing near-misses
  ("closest call: 3px", "1 gate from a new best") is legitimate feedback. The ethical
  line: illuminate what genuinely happened; never fake a near-miss to manipulate.

## 6. Retention — honest reasons to come back

What brings a player back tomorrow, drawn from retention research — kept to the
*non-manipulative* subset that fits a no-accounts, no-tracking, local-only project:

- **The "one more run" loop** (short runs + banked meta-progress) is the strongest
  retention mechanic there is, and it needs no server, login, or notification.
- **Goals just out of reach.** A visible next unlock / next milestone / next rank the
  player is close to. Progress bars toward the next thing outperform abstract points.
- **Streaks and daily structure** boost return — but only when framed *shame-free*
  (celebrate the streak; never punish a break). We can offer a daily-seed later without
  accounts. Treat as optional, never guilt-based.
- **What we deliberately avoid:** dark patterns — timers that punish, fake scarcity,
  loss-framed nags, anything that leaks data. Our privacy/no-tracking stance is a
  feature; retention here is earned by the game being good, not by hooks that harm.

## 7. Onboarding — teach by playing

- **Start with action.** No wall of text; the player should be *doing* within a
  second. Our start panel is fine as a one-glance primer, but the game must teach
  itself in the first few seconds of play.
- **One concept at a time.** Introduce wrinkles sequentially (this is what staged
  in-run progression buys us for free — the first stage *is* the tutorial).
- **Teach in a safe space.** The opening moments should be low-stakes enough to
  experiment. Our games already seed a safe first few ticks; preserve that.
- **Say why, not just what.** A tip that explains the *strategy* ("flip early, read two
  ahead") teaches more than one that lists controls.

## 8. UI / HUD — glanceable, quiet, in-world

- **The HUD is read in peripheral vision.** Big, tabular-numeric score; secondary info
  (best, stage, multiplier) quieter and smaller. Never make the player *study* the HUD.
- **Show state changes, don't just store them.** A multiplier or stage should animate
  when it changes (pop, colour shift) — the change is the information.
- **Diegetic where possible.** Effects rendered in the play-field (the trail, the orb,
  the field colour shifting by stage) beat chrome bolted around the edges.
- **Clean base, expressive payoff** — the HUD equivalent of juice restraint. A calm
  default keeps the game feeling *simple* even as depth accretes underneath.

---

## The simple-but-deep checklist (apply to every growth change)

Before shipping any depth, it must pass all of these — this is how we honour "grows
over months" **and** "never convoluted" at the same time:

1. **Instantly playable still?** A first-time player can still start and understand the
   base game in ~3 seconds. New depth is *layered underneath*, not bolted in front.
2. **Optional, not mandatory?** Advanced systems (modes, unlocks, chains) are opt-in.
   The default path never *requires* the player to engage with them.
3. **Does it echo the one mechanic?** Depth extends the existing verb; it is not a
   second game stapled on. (New *verbs* are new games, not additions.)
4. **Readable at a glance?** Any new state has a clear, quiet visual. If it needs a
   paragraph to explain in-play, it's too much.
5. **Does a run bank something?** The change should make runs *matter more* over time
   (a stat, a step toward an unlock), not just add a number.
6. **Still stable + tested + clean?** Pure logic in the core with tests; feel/persist
   in the shell. Green before ship, previewed in Chrome. No stability or clarity
   regression — if it risks the polish bar, it doesn't ship.

If a change fails any line, cut it or shrink it until it passes. **Simple-but-deep
beats busy** is the whole project in four words.

---

## Sources

- [Compulsion loop — Wikipedia](https://en.wikipedia.org/wiki/Compulsion_loop)
- [Action → Feedback → Reward → Motivation → Repeat (Algoryte, Medium)](https://medium.com/@algoryte/action-feedback-reward-motivation-repeat-the-compulsive-game-loop-that-hooks-you-0ce432bd7463)
- [Compulsion Loops and Dopamine Hits — Make Tech Easier](https://www.maketecheasier.com/why-games-are-designed-addictive/)
- ["Addictive" Gameplay Loops and Compulsion Exit Ramps — access-ability.uk](https://access-ability.uk/2022/04/25/addictive-gameplay-loops-and-compulsion-exit-ramps/)
- [Flow Theory in Game Design — Blood Moon Interactive](https://www.bloodmooninteractive.com/articles/flow-theory.html)
- [Cognitive Flow: The Psychology of Great Game Design — Game Developer](https://www.gamedeveloper.com/design/cognitive-flow-the-psychology-of-great-game-design)
- [Dynamic Difficulty Adjustment in Games — IntechOpen](https://www.intechopen.com/chapters/1228576)
- [What is Meta-Progression? — GameBrief](https://www.gamebrief.net/glossary/meta-progression)
- [How to Design a Roguelite Meta-Progression — Bugnet Blog](https://bugnet.io/blog/how-to-design-a-roguelite-meta-progression)
- [Squeezing more juice out of your game design — GameAnalytics](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design)
- [The Art of Screenshake (Vlambeer / Jan Willem Nijman) — notes](https://gamedesignerkid.blogspot.com/2016/01/the-art-of-screenshake-source-code.html)
- [What Makes a Great Scoring System? Lessons from the Arcade — itch.io](https://itch.io/blog/810141/what-makes-a-great-scoring-system-lessons-from-the-arcade.amp)
- [The Design of Combos and Chains — Game Developer](https://www.gamedeveloper.com/design/the-design-of-combos-and-chains)
- [5 Arcade Risk-Reward Mechanics That Still Keep Us Playing — Arcade Attack](https://www.arcadeattack.co.uk/5-arcade-risk-reward-mechanics-that-still-keep-us-playing/)
- [The Near Miss Effect and Game Rewards — The Psychology of Games](https://www.psychologyofgames.com/2016/09/the-near-miss-effect-and-game-rewards/)
- [17 Proven Player Retention Strategies — Game Design Skills](https://gamedesignskills.com/game-design/player-retention/)
- [The Psychology of Hot Streak Game Design (shame-free streaks) — UX Magazine](https://uxmag.medium.com/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame-3dde153f239c)
- [Don't Spook the Newbies: 5 Game Onboarding Techniques — The Acagamic](https://acagamic.com/newsletter/2023/04/04/dont-spook-the-newbies-unveiling-5-proven-game-onboarding-techniques/)
- [Games UX: Building the right onboarding experience — UX Collective](https://uxdesign.cc/games-ux-building-the-right-onboarding-experience-a6e99cf4aaea)
