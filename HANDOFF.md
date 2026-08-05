# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-02 (s36 evolution rail; s35 note → archive).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs). Production = `938bc39`-era main;
  local main = origin/main.
- **⚠️ Branch `cv-exe` = CV.EXE, pulled OFF main** (Jake: "still needs some
  work"). Open calls from s30: BFA vs BA; the dot-matrix summary line.
  Revise there, merge to ship. `docs/PLAN-CV-EXE.md` is the reference.
- **Branch `leaf-patch` (parked) got CRITTERS v2 in s34** (`89970d8`):
  bento-sticker cast redrawn (solid lumpy blobs, no outlines, sleepy
  half-moon eyes); leaf = nine ragged evenodd blade states. ⚠️ At revive:
  slot sizes in progress.module.css, branch phases say Family Hub 55 vs
  main's 70, Trash TAG-03 restores from `8934b21`. Standalone tracker
  rebuilt s34 (`portfolio-tracker/`, git-ignored, cast sheet
  `critter-cast-v2.html`).
- **Jake's s31 rule: feature work starts on its OWN branch;** main stays
  shippable.
- **Skins:** classic (light/dark) + medieval (knight-speak voice LIVE);
  underwater = stub. Copy layer + EDIT.MODE LIVE — expect copy.json commits
  on main between sessions; rebase, merge at the KEY level.
- **Jake is preparing to APPLY.** Audit gaps: CV.EXE (branch, needs
  revision) · Red Pen (exhibit = Ryan avatar-token Slack thread; Jake to
  save screenshots; details in portfolio-tracker.md) · gate friction
  (audit's #1 risk, unactioned).
- **Family Hub case on branch `case-family-hub`, through pass 3 + the
  EVOLUTION RAIL (s36, `f21fb5a`):** 7 sections, 11 plates, 4 interactives,
  Jake's spoken cadence (voice rules: memory `case-study-voice-calibration`).
  NEW: `EvolutionRail` — the Family Hub as a nested FAMILY.HUB mini-window
  riding the case's right margin, climbing sketch→proto→board-build→
  rein-in→ship (9 real Figma exports, v0.1→v1.0) as you scroll. Case
  windows now open 1150×680 so it earns its margin; hides below 1040px
  container (content-box!). **Awaiting Jake's read → merge.** cases.ts 85.
- **Tracking:** Notion (connector live). Blob cap LIFTED (Vercel Pro,
  2026-08-01); deck reporting live again — Jake wants a COST read on
  steady-state deck usage before we lean on it hard.
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse` role. Ports 3000/3210 often owned by
  concurrent sessions — check `lsof` first; never `npm run build` while a
  foreign dev server owns `.next`.

## Latest session — the evolution rail: persuasion ladder, literal (s36, 2026-08-02)

**Fable solo by declaration: one tightly-coupled taste feature (nested
window chrome + case CSS + live Figma exports) — splitting it would have
cost more context than it saved. Deck reported (58 events, 200s).**

- **`EvolutionRail` shipped to `case-family-hub` (`f21fb5a`):** Jake's
  idea, his Figma assets (scroller-viz `201161-12` — NINE stages, not the
  spec'd five). Mini-window mimics `.window` chrome (titlebar, ×-close,
  6px shadow); sticky inside `.windowBody` via absolute full-height slot;
  IntersectionObserver over hero+7 sections+footer, proportional map to
  stages; stacked `<img>`s crossfade by CSS opacity (reduced-motion
  guarded); ticks jump between beats (accent done / expressive current).
- **Traps hit, for the record:** container queries measure the CONTENT
  box (1147px article failed a 1100px query — 60px padding); the pane
  tab freezes IntersectionObserver delivery entirely (not just rAF), so
  end-to-end proof ran in Playwright headless_shell via scratchpad
  `playwright-core` + the ms-playwright cache; the footer can never reach
  a -55% tripline band, so v1.0 rides its own gentler observer.
- Verified headless: full v0.1→v1.0 sweep both directions, sticky at
  16px throughout, tick-jump lands its section, close unmounts, light +
  dark screenshots clean, narrow window hides rail + recenters column.
  tsc + prod build clean. Assets: `public/case/family-hub/evo/` ~315KB
  total webp (sharp from node_modules).
- Case window default 860×640 → 1150×680, pos x 100 (all cases; Invest
  unaffected visually — rail gated behind `.hasRail` on the article).
- **PASS 2 (`b4dc078`), Jake's review:** labels verbatim from his renamed
  Figma sections (Sketch → PoC → Wireframes → Hi-Fi Prototype → Color
  Explorations → On-Device Testing → Ship); per-stage exact export
  ratios + recropped halos = uniform 10px paper all round (aspect-ratio
  transition animates the window resize); sketch stage rebuilt LIVING —
  14 transparent cutouts on Figma coords, slow CSS drift loops, paused
  when faded out, stilled under reduced-motion. ⚠️ Ate a shared-`.next`
  corruption mid-verify (my s36 build ran while a foreign dev server
  owned `.next` — the §3.1 law, relearned): both servers sick, `rm -rf
  .next` fixed mine; **the other session's :3000 server needs its own
  restart.** Hero meta `&rsquo;` literal fixed in passing.
- **PASS 3 (`c6f5d0a`), Jake's review:** rail 150% (360px, clamp 280–360),
  shows from 640cqw with overlap blessed (column cedes spare width via one
  clamp()); frames re-exported after Jake normalized all to 1440-wide;
  FINALE: last two stages break out — paper→0, device hangs on an SVG
  wall (v0.9 plain / v1.0 kitchen w/ counter+plant, swaps for launch
  photography per §2). Case window 1280×720 @ x24 (fits 1280 laptops —
  x100 hung the rail offscreen). Gotchas: playwright-core `newPage` wants
  `viewport:` not `viewportSize:` (silently ignored → 1280×720 default);
  preview_stop can leave the process alive — `lsof :3210` before ANY
  build (ate .next corruption twice this session).
- **PASS 4 (`ca7c299`):** Jake answered the prototype question with SCREEN
  RECORDINGS (`ref/assets-casestudies/family hub/prototype-window/`, never
  commit ref/) — v0.2 + v0.6 stages now play his real PoC/hi-fi demos as
  muted loops in the mini-window. Pipeline: scratchpad `ffmpeg-static`
  (playwright's ffmpeg = vp8-only) → h264 mp4 crf27 + vp9 webm crf36,
  preload=none, play-only-while-up, poster still under reduced-motion.
  Gotcha: headless_shell has NO h264 — webm <source> fallback is what
  makes playback verifiable (and is good hygiene anyway). More recordings
  welcome: drop in same ref/ dir, same names → stage mapping in
  EvolutionRail STAGES.
- **PASS 5 (`72f38c2`):** demo stages on pure-black mat (sampled #000 —
  seamless with the recordings; Jake's rounding idea mooted as he
  predicted); PoC demo spans v0.2+v0.3 via deduped video elements
  (rolls through, never resets); posters = recordings' first frames
  (white Figma stills retired for demo stages); mini-window gained the
  main window's + control — zoom to 720px / restore, width transition.

## Next steps

1. **Jake: READ pass 3 + ride the rail** — branch `case-family-hub`,
   `/projects/family-hub` (gate). Rail taste calls to confirm: stage
   labels/versions (v0.1 SKETCH → v1.0 SHIP), 240px width, close-and-
   it's-gone-for-the-session. Merge = his call; then progress 85→100.
2. **Jake asset pass** (swappable slots, §2 law): Ryan avatar-token Slack
   screenshots → Plate 09 · color before/after → Plate 10 · remaining
   Drop plates (01, 04–06, 08, 11) · rail stages if he re-exports.
3. **CV.EXE revisions on `cv-exe`** (BFA vs BA; dot-matrix line), then merge.
4. Gate friction (Jake) — audit's #1 risk, still unactioned.
5. COMMAND.CTR zero-`list()` fix (Blob cap gone; cost read first).
6. Figma stale STRING vars; typography finale; underwater; First Pass
   section `459-473268` still unindexed (MCP transport cap) — carried.
