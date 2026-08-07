# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-06 (s39 SHIPPED.SW built; s38 skin-builder note →
> archive).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; NOTE the apex 308s to www — curl
  with -L or grep finds nothing). **Production = Family Hub ship (s36).**
- **⚠️ Jake's rulings on the shared checkout: no more concurrent sessions
  on one working tree, and check `git branch --show-current` before EVERY
  commit** (s36/s37 race, archive). Bit again in s39: another chat's dev
  server owned :3000 while s39 switched the checkout to its branch.
- **SHIPPED.SW BUILT, AWAITING JAKE'S TASTE PASS** (branch
  `feat/shipped-sw-shelf`, NOT merged): the Case Studies window is now a
  shelf of boxed 1992 software replacing the never-finishing installer.
  Details in the session note below. Taste checkpoints open: flip feel,
  install pacing, back-panel density (3 cols vs 2), box-art placeholders.
- **FAMILY HUB CASE SHIPPED 2026-08-05** (s36): 7 sections, 11 plates,
  4 interactives, PROGRESS.VWR evolution rail, LaunchFilm. Case windows
  1280×720 @ x24. Assets `public/case/family-hub/evo/`; masters in
  `ref/assets-casestudies/` (never commit ref/). Jake's live sanity-walk
  still pending.
- **RESUME.EXE v4 + BOX-86 live since 2026-08-04** (s37). Merged branches
  `cv-exe`, `suggestion-box`, `case-family-hub` safe to delete;
  `medieval-sfx`* once Jake confirms sfx live.
- **NEW FLAGSHIP SPEC'D — "The Desk"** (Notion): zoom out to the room the
  OS runs in; art direction OPEN, Jake's 3D refs incoming.
- **Branch `leaf-patch` (parked, CRITTERS v2 in s34, `89970d8`).** At
  revive: slot sizes; Family Hub 55 vs main 100; Trash TAG-03 `8934b21`.
- **Jake's s31 rule: feature work starts on its OWN branch;** main stays
  shippable.
- **Skins:** classic (light/dark) + medieval (knight-speak + sfx LIVE);
  underwater = stub. Copy layer + EDIT.MODE LIVE — rebase, merge copy.json
  at the KEY level, never force-push.
- **Jake is preparing to APPLY.** Audit gaps: Red Pen exhibit (Ryan
  avatar-token screenshots) · gate friction — s39's install-absorbed
  license check addresses the case-studies door once merged. **Standing
  ask: push HIM to prune and polish copy.**
- **Voice law (s35):** all user-facing drafts in Jake's spoken cadence;
  em dashes are an AI tell. s39 shelf copy is DRAFT — Jake rewrites.
- **Tracking:** Notion (connector live). Deck reporting works; cost read
  on steady-state usage wanted; zero-`list()` fix still worth it.
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse`; reduced-motion unverified by
  emulation. Never `npm run build` while any dev server owns `.next`
  (`lsof :3000 :3210` first).

## Latest session — SHIPPED.SW: the shelf sells what's here (s39, 2026-08-06→07)

**Fable planned + reviewed, NYQUIST (Opus) built, Fable landed one layout
fix solo (20-line scope — not worth a dispatch). Deck reported. Branch
`feat/shipped-sw-shelf`, 3 commits, NOT merged — Jake's taste pass next.**

- **The reframe (Jake's call):** the installer parody geared to progress
  became a shelf of boxed retail software from the parallel 1992 — the
  door sells the shipped work. Jake also ruled: browse free, gate the
  open (audit's #1 friction risk absorbed into the bit).
- **The build:** `src/programs/shelf/` (Shelf/ShelfBox/InstallOverlay/
  InstallBar). Boxes = fixed 3:4 slots, composed token-only placeholder
  fronts (art convention `/case/<slug>/box.webp`, none shipped yet),
  3D flip WITHOUT preserve-3d (per-face `perspective() rotateY()` —
  recede/roughen filters flatten 3D contexts), `inert` face swap, focus
  choreography, Escape ladder (overlay → unflip → window). Shipped boxes
  INSTALL: bar steps to 90, stalls for the license check (unchanged
  GateSphere, reframed by one copy line), 100 on unlock, case window
  opens. In-dev boxes stay shrink-wrapped (sheen + pink Stamp) with the
  verbatim nudge wiring. Registry: `progress` → shelf, 720×600 @
  (250,48); `/projects/<slug>` deep-link parent now `progress`;
  `projects` flat index kept registered+gated for bare `/projects`.
  InProgress.tsx + progress.module.css deleted; `progress.eyebrow/eta/
  etaLabel` pruned; nudge/offline/empty keys reused. Medieval: tomes
  (accent spine, hatched bar, TRANSCRIBE/EDITION/STILL BEING ILLUMINATED).
- **The fix (Fable):** install layer anchored to scroll content hung the
  license sphere 57px past the window bottom. Wrap pins to body height,
  grid scrolls internally, bar yields its rows during license. Probed
  headless (real viewports — the pane tab was hidden, layout degenerate):
  sphere + cancel fully visible at 1280×800 and 360×740.
- **Verified:** tsc, 25/25 tests, isolated prod build (28/28 pages —
  main `.next` never touched; another chat's dev server owned :3000).
  Probes: 4 boxes, 3 cols desktop / 2 @ 360px, no overflow, zero CLS
  (252×336 slot pre/post), flip a11y, license geometry, unlocked install
  opens `case:` window, medieval copy live. Reduced-motion + Lighthouse
  unverified by emulation (standing debt).
- **Pass 2 (Jake live-directed):** grid → ONE horizontal carousel (4th
  box hangs off — "no illusion of completeness"); hand-rolled `Box3D`
  six-face CSS cuboid (42px board, 980px camera on the row, 22deg
  resting turn ±14 scroll sweep, contact shadows on a `.plinth` outside
  the 3D context); INSTALL → PLAY ("installing is the printing mistake
  again"); license phase drops the whole frame to `--surface-inverse`.
  Recede filter flattens preserve-3d → registry `noRecede` opt-out
  (iPod precedent). Mid-pass GitHub-Desktop branch switch KILLED the
  agent (auto-stash); work verified intact vs stash and committed.
- **Pass 3:** flip CTAs deleted — one small `FLIP →` tag chip above
  each box (the accessible path: aria-expanded, Enter, focus return),
  front face still click-flips but tabIndex −1; Apple-TV cursor-pressure
  tilt (±7deg, push-AWAY sign verified, −6px lift + shadow swell,
  SPRINGS.window near-critical, own `.tilt` layer between parallax and
  flip; fine-pointer only, off under reduced motion); YouTube loop
  covers on the two shipped boxes (nocookie, muted, inert, aria-hidden,
  1.4 overscan crop kills the letterbox+title, duotone over top;
  invest `Nxl0uCGZNCw`, family-hub `G-tWcCCMdGE`). 60fps measured with
  both iframes under tilt (p95 16.8ms). Windows 720×552.
- **3D framework ruling (HERTZ eval, verified numbers):** shelf STAYS
  CSS 3D (iframes can't rasterize to WebGL textures; migration =
  ~180-235KB gzip for marginal gain + a11y regression). THE DESK =
  react-three-fiber + curated drei + Blender→GLTF→gltfjsx (~260-320KB
  code-split); screen-zoom illusion via the HANDOFF PATTERN (baked
  screen texture → crossfade to real DOM at matched rect; drei `<Html
  transform>` in reserve). Precedents: Galaxy Portfolio (steal its
  shader-precompile trick), freeCodeCamp cute-room pipeline, Bruno
  Simon. Spline ruled out (1MB+, proprietary format, video textures
  paywalled).
- **Flags:** YT autoplay refusal (data-saver/iOS low-power) leaves a
  visible un-clickable play button — proper fix = YT IFrame API dep,
  deliberately deferred · `public/case/family-hub 2/` untracked dup —
  Jake to delete · stale GitHub-Desktop stash@{0} = safe to drop ·
  `useFinePointer` per-box (hoist if a 5th case lands) · box art still
  swappable when Jake ships real assets.

## Next steps

1. **Jake taste pass on SHIPPED.SW** (dev server on :3000 serves the
   branch): flip feel, install pacing, license beat, 3-col vs 2-col
   back-panel density, medieval tomes. Then merge `feat/shipped-sw-shelf`.
2. **Jake: sanity-walk Family Hub LIVE on lunde.co** (carried from s38).
3. **Jake asset pass:** box art for the two shipped cases now joins the
   list (Ryan avatar-token screenshots · Plate 10 · Drop plates · box.webp).
4. **The Desk** — next flagship; 3D-room refs incoming.
5. Cleanup when idle: delete merged branches; `family-hub 2/` dup dir.
6. Carried: eyeball tracker v2 / `leaf-patch` revive-or-park · COMMAND.CTR
   zero-`list()` + deck cost read · Figma stale STRING vars · typography
   finale · underwater · First Pass `459-473268` unindexed.
