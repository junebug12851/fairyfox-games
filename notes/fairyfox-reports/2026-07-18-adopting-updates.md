---
date: 2026-07-18
procedure: adopting-updates
node: fairyfox-games
outcome: completed-partial
hub_version: 0.16.0
hub_commit: 5803ba3
chrome_bundle_version: 2.0.0
prev_hub_version: 0.14.3
---

# Process Report — adopting-updates, 2026-07-18

> A full, honest account of running a fairyfox system procedure. The point is to
> improve the system — so say what was rough even if the run succeeded. Voice: direct,
> matter-of-fact, no hype. Standard: `hub/standards/process-reports.md`.

## Outcome in one line

Adopted the **shared-chrome header** (bundle v2.0.0) — the fixed primary nav's new **Farms**
dropdown grouping Stories + Games — into this node's `_includes/header.html` + `assets/nav.js`,
preserving the two documented local divergences. Full-bundle re-vendor (reader.js, the card/`.tech`
CSS) deliberately scoped out. Previewed, released as v0.24.2.

## What was done

- This is the deferred follow-through to the **2026-07-18 update-check** report, which flagged the
  shared-chrome bundle as "held for a careful pass, not blind-copied." The owner then said adopt it,
  so this run is that adoption — a confirmed, previewed act (not skipping any safety).
- Read `12-shared-chrome.md`, `chrome/README.md`, `chrome/header.html`, `chrome/adapters/jekyll.md`,
  and the bundle `VERSION` (2.0.0).
- **Diffed the node's chrome against the bundle** to find the true delta. Key discovery: this node
  had *already* vendored most of the bundle in a prior pass — `styles.css` already carries the
  `.dd`/`.dp-panel`/`.nav-toggle`/`.nav-open` rules (lines 175-196), the header already had the
  `.nav-toggle` hamburger + `.brand-name`, and `default.html` already loads `nav.js` + `reader.js`
  with `reader.js` injecting the "Aa" button. The **only** gap was the nav markup itself: "Games"
  was still a flat top-level link instead of living in the Farms `<details>` dropdown.
- **Applied** the surgical change: rewrote the `<nav>` block in `_includes/header.html` to the
  bundle's Farms dropdown (Stories + Games), and replaced `assets/nav.js` with the hub's
  dropdown-aware version (the node's was the older flat-nav one).
- **Preserved two deliberate divergences** from the byte-identical bundle, documented inline: (1)
  the **Games** link points at this site's root (`{{ '/' | relative_url }}`), not the bundle's
  `https://fairyfox.io/games/` — that hub stub triggers the white-flash reload the node fixed
  earlier; (2) this node *is* the Games collection, so the Farms `<summary>` and the Games link are
  hard-coded `.active` (the bundle's `p contains '/games'` logic can't work under this node's
  `/fairyfox-games/` baseurl).
- **Scoped out** (recorded, not done): re-vendoring `reader.js` (the hub's is newer — adds a
  story-only reader lock irrelevant to a games site) and the hub's newer **card/`.tech`/`.proj-help`
  CSS system** (this node uses its own game-card design, not the hub's project-card). Neither is
  needed for the header and both carry more risk than reward here.
- **Verified** before/after: `node --test "games/**/*.test.js"` 630/630; clean `jekyll build`;
  headless-Chrome previews of the real chrome (linking the actual `styles.css`) — nav bar closed,
  Farms open, mobile hamburger, and the full served landing page (`jekyll serve`, HTTP 200) with the
  injected "Aa" button. All clean: correct active states, panel styling, no overflow/clipping.

## What went well

- The bundle README + jekyll adapter made the model clear (fixed nav, filled slots, pull CSS/JS as
  master). The `.active` guidance ("mark BOTH the Farms summary and the matching link") was exactly
  the ambiguity I'd have hit otherwise.
- Because the node had pre-vendored the CSS/JS, the "big scary re-vendor" collapsed to a two-file
  markup change. Diffing first (not copying first) is what surfaced that.

## What went wrong / friction

- **The bundle's fixed-nav rule and this node's justified divergences openly conflict, and the
  standard doesn't acknowledge it.** `header.html` says "copy verbatim… do not reorder, drop, add or
  rename," and the README says editing the fixed parts "re-introduces the drift the bundle exists to
  kill." But a subproject node MUST diverge on exactly two points — the Games URL (local vs the hub
  stub) and the always-active state — or it ships the white-flash bug and wrong highlighting. There's
  no blessed mechanism for a per-node override of a "fixed" item, so the node has to knowingly break
  the verbatim rule and document why. A scheduled/less-careful run would either ship the flash or not
  diverge at all.
- **`Compare-Object` (my diff tool) defaults to an unordered set diff and silently misled me** — it
  showed no header/nav delta, which I first misread as "the CSS lacks the dropdown," compounded by an
  earlier `Select-String -SimpleMatch` that treated my `|`-alternation pattern as a literal. Not a
  hub problem, but worth noting for any node doing CSS diffs: use an ordered/line diff.
- The bundle ships as *resolved static HTML* with absolute `fairyfox.io` URLs; a Jekyll node wants
  `relative_url` + Liquid `.active`. The adapter says this is fine ("convert if you prefer"), but it
  means the "byte-identical" promise never actually holds for a Jekyll node — the diff is always
  non-empty, so a future refresh can't be a clean byte compare. A *Liquid* reference variant of the
  header (or a documented normalisation) would make refresh diffs trustworthy.

## Suggestions / feedback

- Add a **"per-node overrides" section** to `12-shared-chrome.md`: name the legitimate reasons a node
  overrides a fixed-nav item (same-origin self-link to avoid a hub-stub round-trip; always-active
  section on a single-collection node) and how to mark them, so it's a sanctioned carve-out, not a
  silent rule-break. Tie to the white-flash/`/games/`-stub case.
- Ship a **Jekyll-flavoured `header.liquid`** (or a normalisation note) alongside the static
  `header.html`, so a Jekyll node's refresh diff is signal, not the constant absolute-vs-relative
  noise.
- The bundle couples with `compliance.md`'s new docs-site row (flagged in the 07-18 update-check
  report). Ship them so a node can adopt the row and the capability together.

## Environment

fairyfox-games: Jekyll mesh over static canvas games, Windows + PowerShell (never the bash sandbox),
Node 18, headless Chrome for visual verification (Chrome MCP not used). Hand-authored `_includes/`
chrome with pre-vendored bundle CSS/JS from an earlier pass — which is what made this adoption a
two-file change rather than a full re-vendor. Released via PR to branch-protected `main`, hand-tagged.
