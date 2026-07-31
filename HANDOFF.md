# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-31 (s32–33 interview wrap; s34 note → archive).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs). Production = `938bc39`-era main;
  local main = origin/main.
- **⚠️ Branch `cv-exe` = CV.EXE, pulled OFF main** (Jake: "still needs some
  work"). Open calls from s30: BFA vs BA; the dot-matrix summary line.
  Revise there, merge to ship. `docs/PLAN-CV-EXE.md` is the reference.
- **Branch `leaf-patch` (parked) got CRITTERS v2 in s34** (`89970d8`):
  Jake killed the v1 art ("looks like an SVG"); the cast is redrawn to his
  bento-sticker reference — solid lumpy merged blobs, NO outlines/seams,
  sleepy half-moon eyes, asymmetric; leaf = nine ragged evenodd blade
  states (bite scoops + chewed-through holes) over a once-drawn skeleton.
  Tokens unchanged (ink/surface/accent). ⚠️ Slot sizes in
  progress.module.css may want a nudge at revive (viewBox ratios shifted);
  branch phases still say Family Hub 55 vs main's 70 — reconcile at merge.
  Trash TAG-03 "The Installer" restores from `8934b21` when this ships.
- **Standalone tracker REBUILT s34** (`portfolio-tracker/portfolio-interview-
  tracker.html`, git-ignored): same v2 cast in monarch orange + leaf greens,
  full whimsy retheme — grass-blade nibble ledger, caterpillar-bump pbars,
  blob checkboxes, wobbly hand-ruled borders, h1 squiggle, idle inch/bob/
  sway (reduced-motion-guarded), caterpillar peeking over the footer rule.
  Jake's verbatim/DATA edits and localStorage (`gl-field-notes-v1`) were
  preserved untouched. Cast sheet: `portfolio-tracker/critter-cast-v2.html`.
- **Jake's s31 rule: feature work starts on its OWN branch;** main stays
  shippable.
- **Skins:** classic (light/dark) + medieval (knight-speak voice LIVE);
  underwater = stub. Copy layer + EDIT.MODE LIVE — expect copy.json commits
  on main between sessions; rebase, merge at the KEY level.
- **Jake is preparing to APPLY.** Audit gaps: CV.EXE (branch, needs
  revision) · Red Pen (UNBLOCKED s33 — exhibit = Ryan avatar-token Slack
  thread; Jake to save screenshots; details in portfolio-tracker.md) ·
  gate friction (audit's #1 risk, unactioned).
- **Family Hub interview COMPLETE (s32–33): leaf 14/14, took wing.** Full
  12-beat arc + 4 chapters + Red Pen receipts in `portfolio-tracker.md` §2;
  research verified (`ref/research/family hub/`, curated quotes in
  `ref/famhub-pull-quotes.md`); NDA ruling = default PUBLIC (exceptions:
  internal sales targets, CEO criticism — editorial). Site cases.ts at
  70% "Story blocked end to end · drafting next" (deployed `938bc39`).
  **Next task = DRAFT the case study — fresh session per §4.3.**
- **Tracking:** Notion (connector live). **⚠️ COMMAND.CTR deck 500s — Blob
  ops cap until ~Aug 1** (s26 incident, archive); zero-`list()` fix = top
  infra backlog. s34 skipped deck reporting for this reason.
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse` role. Ports 3000/3210 often owned by
  concurrent sessions — temp launch.json entry, verify, revert; never
  `npm run build` while a foreign dev server owns `.next`.

## Latest session — Family Hub interview: the leaf takes wing (s32–33, 2026-07-29→31)

**Fable interviewing Jake directly across three days — the case-study
capture pipeline working as designed. One HERTZ/Sonnet delegate (Notion
research fetch — blocked on binary attachments, later resolved by local
files); solo otherwise: interviewing IS taste work. Deck dark (Blob cap).**

- **Family Hub §2 of portfolio-tracker.md is now the densest capture in
  the repo:** 12-beat arc (vision team → skeptic-driver → board/all-hands
  → first web app → Glow DS → sprint → cuts → ship) + ch.2 onboarding
  (BLE dream cut → QR dual-screen tandem; takeover pattern; 10×9 avatar
  system) + ch.3 launch (color rein-in, DevTools-loop origin, Plus-plan
  AI bet, firefighting) + ch.4 hardware (Shenzhen/Ray, Jake's 15" call,
  RAM-fight-for-animations, keyboard-APK gambit, PNG-folder boot seq).
- **Hardest problem [Jake]: NOT a screen problem — solo at scale** (20→5
  designers, ~10x eng). Survival kit = flexibility across disciplines,
  digital-office instant reviews, "hold nothing preciously," tooling as
  precision guidance ("remixing"). Second: sustaining his own belief.
- **Red Pen receipts landed:** Ryan avatar-token thread (weakest→strongest,
  verbatim Slack, engineer caught it — THE exhibit; Jake saving
  screenshots) · color rein-in owned as Jake's own "I was wrong" ·
  accounts dissent + Mother's-Day pace = one advocacy theme, public-safe
  renderings written. ⚠️ Sales targets + CEO criticism = never public.
- **Research verified from local files** (`ref/research/family hub/`):
  n=1,200 Sept-2025 survey; >80% appeal pre-price; calendar 58% top
  feature, privacy 54% top function; adults-manage/kids-view/PIN model is
  research-backed. Curated quotes → `ref/famhub-pull-quotes.md` (thesis:
  "would love one tool instead"). Corrections to Jake's recall logged.
- **Interaction-models Figma canvas reviewed tile-by-tile** (node
  453-342132; six mobile integration models w/ pros-cons, Ambient→Active→
  Focused triad, ecosystem slide w/ CarPlay absorbing Live Drive). Designs
  index: Notion "Designs" page → 6 nodes, 3 still unreviewed
  (Initial Prototypes 460-368545 · Presentations 457-473267 ·
  First Pass 459-473268).
- Shipped to prod: cases.ts Family Hub 55→70 (`938bc39`, verified via
  Vercel MCP + content-marker curl). Standalone tracker DATA updated to
  14/14 (coexisted cleanly with s34's concurrent art retheme).
- Memory: `jake-next-role-criteria` saved (visionary leadership, not
  market-chasing; never bitter about GL in public copy).

## Next steps

1. **DRAFT the Family Hub case study — fresh session** (spine = tracker §2
   arc; voice check vs CaseInvest; thesis candidate: persuasion-by-artifact
   / one designer, ten engineers). Then cases.ts 70→85 "drafted".
2. **Jake:** save the Ryan avatar-token Slack screenshots (Red Pen exhibit)
   + drop the color before/after states into the design file.
3. **Jake:** eyeball tracker v2 in a real browser (idle animations, peek
   loop, toasts) + `critter-cast-v2.html`. Then revive `leaf-patch`
   (reconcile Family Hub 55→70 phase, slot sizes, Trash TAG-03) or park on.
4. **CV.EXE revisions on `cv-exe`** (BFA vs BA; dot-matrix line), then merge.
5. Gate friction (Jake) — audit's #1 risk, still unactioned.
6. COMMAND.CTR zero-`list()` fix after Blob cap resets (~Aug 1).
7. Figma stale STRING vars; typography finale; underwater; remaining Figma
   nodes review (Presentations = board/all-hands material) — carried.
