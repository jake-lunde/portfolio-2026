# HANDOFF — LUNDE OS continuation brief

> Maintained by the Claude instances working on this repo with Jake.
> Last full update: 2026-07-08 (Fable 5, end of its run — hello, Opus 4.8).
> Read `CLAUDE.md` first; it is design law. This file is process + state + backlog.
> Jake's ideas doc (Google Drive, "Portfolio 2026 / Updates and Ideas") is the
> source for new asks — re-read it at session start; he edits it silently and
> his freshest edits are his real priorities.

---

## RESUME.EXE v4: it prints itself (s37, 2026-08-04)

**Fable solo through FOUR passes in one long session: v2 (furniture
printer) → Jake's live review killed it → v3 (System 7 print dialog,
planned in plan mode) → v4 after Jake USED v3: rename to RESUME.EXE,
auto-print on open, his own copy pass applied. Solo per §4.2 — resume
voice + platform-idiom craft. Deck reported.**

- **The arc, worth keeping:** physical objects want a physical layer (the
  furniture printer died there; The Desk in Notion inherits it) — and
  even good chrome loses to observed behavior: Jake used v3 and called
  that nobody presses Print on a resume. v4: open RESUME.EXE and the job
  card runs itself (~2.1s thermometer + chatter, medieval "Scribing…"),
  the page fades in, one button remains: DOWNLOAD PDF. Draft/NLQ,
  Cancel/Print and PrintDialog.tsx retired. Icon = tractor-feed sheet
  (medieval keeps the charter+seal; the printer icon stays drawn for the
  desk scene). Path `/cv` → `/resume` (old path soft-falls to readme).
- **Content is Jake's own pruning pass, applied verbatim** (his edited
  MD): printer hook line cut, code bullets merged, "primary designer",
  Code Generation skills label (wider label column in BOTH renderers),
  his colophon. One page, 84pt slack, 49/49 strings, 3–4× intact. THE
  DIVISION OF LABOR TO ENCOURAGE: the machine typesets, Jake prunes — he
  asked to be pushed toward more of exactly this.
- **Parser trap (recurring):** pdfkit wraps mid-metric at en dashes;
  re-flow the sentence and re-run the pypdf string-presence check after
  ANY resume edit.
- **Verified in a real renderer** (pane freezes AnimatePresence exits):
  mid-job scaleX(0.43)/sheet opacity 0 → done/sheet 1, RESUME.EXE title,
  Jake's colophon, both skins, 390px. AA floor 4.99 (v3 measurements;
  v4 reuses the same tokens/chrome).
- Breadcrumbs: dev-server watcher can die silently (SSR-grep a fresh
  classname = the tell); pane NATIVE width <720 renders the launcher
  (force resize_window 1280); two HANDOFF merge-reconciles this session
  because main kept moving underneath.

## Notion small-batch: the lute and the box (2026-08-04)

**Fable solo, declared per §4.2: closed small tasks, taste-dominant
(sound design, roast copy, icon drawing); briefing overhead > execution.**

- **Notion P0 "agents explain themselves on hover" CLOSED** — already
  shipped 2026-07-26 (`8ce7cdc`, first-contact intro card); task was
  never marked Done.
- **MEDIEVAL SFX SHIPPED (s36 pt 2, `1ac2a58` via `medieval-sfx-2`
  → merged to main):** Jake auditioned the pluck, liked it, then
  supplied recorded samples (`ref/assets-medieval/sounds`, ref/ never
  committed → converted to 96k AAC in `public/sfx/`, 2.6MB→127KB via
  afconvert). Medieval open→affirm, close→close, plus an enter-mode
  fanfare in both skin switchers (0.4 gain — his master peaks 0.91;
  affirm/close ship at his levels, already in polite ratio). Synth
  pluck stays for taps + gate pentatonic + telemetry (samples would
  smear at that rate). Branches `medieval-sfx` / `medieval-sfx-2` can
  be deleted once Jake confirms live. **Pt 3 (2026-08-05): classic got
  its own re-enter fanfare** (`enter-classic.m4a`, same 0.4 gain — raw
  RMS matches the medieval fanfare); sfx.enterMedieval generalized to
  sfx.enterSkin(target), both switchers updated.
- **Branch `suggestion-box` (`40d80bf`, pushed):** BOX-86, the Notion
  P1 brief. 140-char idea slot; DOPPLER (one-ink mask) roasts the draft
  live (roasts.ts: keyword jabs > milestones, once each), deterministic
  score + verdict ("APPROVED WITH SUSPICION." at 75+). Write-only Blob
  ledger `/api/suggestions` (guestbook store, honeypot + cooldown, no
  GET — ideas go to Jake's dashboard only). New ballot-box icon,
  medieval chest variant, name voices to "Petitions". Verified both
  skins by JS probe; storage-down degrades to pink "Scored, not filed".
  Jake reads → merge. V2 (comment mode) unstarted.
- **⚠️ CROSS-SESSION GIT RACE (settled; one optional cleanup):** a
  CV.EXE session (s37) switched this shared working tree to `cv-exe`
  33s after this session branched, so BOX-86 (`f4b1ccf`) landed on
  `cv-exe`; an attempted un-do popped s37's fresh "CV.EXE v3"
  (`dffaea6`) — s37 then recommitted it (`ae57f39`) plus its HANDOFF
  (`e5c794e`) ON TOP of the box, baking BOX-86 into cv-exe history.
  s36 stopped fighting: tree restored clean to `ae57f39`, box ALSO
  standalone on `suggestion-box` (same content). Net effect: additive
  and harmless — merging cv-exe ships the box too (audition both).
  If Jake wants it out of cv-exe history: `git rebase --onto 30442a8
  f4b1ccf cv-exe` — ONLY when no other session is active. **Jake has
  since ruled: no more concurrent sessions on one working tree.**
- **New law for CREW/CLAUDE.md consideration:** before EVERY commit,
  check `git branch --show-current` — concurrent sessions switch
  branches under you in this single shared checkout.

## Family Hub drafted: the leaf becomes a case study (s35, 2026-07-31→08-01)

**Fable drafting solo, declared per §4.2: prose voice + interactive-plate
design are taste work, and every input was already captured in tracker §2 —
nothing separable to delegate. Deck dark (Blob cap, same as s34).**

- **Branch `case-family-hub` (`087d56b`)** — `content/family-hub.mdx` +
  CaseFamilyHub program. Spine: bet (3 futures, Moves) → evidence (n=1,200)
  → system (surface triad) → persuasion-by-artifact → constraints (QR
  tandem + hardware margins) → ten-to-one (Red Pen ×2) → the ship. Thesis:
  *"The first skeptic it had to convert was me — then the board, then the
  factory."* Close: *"We retired the whiteboard."*
- **4 new interactives** (case/, invest palette): ResearchBars ·
  SurfaceTriad · TandemSetup · TokenThread. CaseFooter now takes
  `next.slug` and opens the window — invest's footer → Family Hub, live.
- **Figma scan for the asset pass:** Presentations `457-473267`; Initial
  Prototypes `460-368545` (LoFi v1 → v2 → HiFi 7/9/25, hi-fi home
  `430-269991`). First Pass `459-473268` overflows MCP transport.
- Verified on this session's own port-3000 server; gate bypassed via
  `sessionStorage lunde-gate=1`. **Gotcha: AnimatePresence `mode="wait"`
  never swaps under the hidden-tab rAF freeze** — keyed remount + fade.
- **PASS 2 (2026-08-01, `6fb4567`) — Jake's live review:** "kitchen wall"
  purged (product = all-in-one family organizer / home base, verified
  against greenlight.com/family-hub + press). HubModes = Ambient/Active +
  Authenticated gate. Prose ~halved; Claim (display interstitial) + Ledger
  (mono spec-sheet) join the case vocabulary; 6 new hiring-manager
  placeholders. Gotcha: `git mv` on a client component under a running dev
  server leaves a stale webpack module → 500 until restart.
- **Blob cap lifted:** Vercel Pro upgrade; deck resumed. Jake wants a cost
  read on steady-state usage.
- **PASS 3 (`8a8ff27`) — the voice pass:** Jake flagged em dashes +
  "load-bearing" as AI tells; prose rewritten in his spoken cadence
  (tracker §2 verbatims as reference). Em dashes purged from prose +
  component strings; survivors are verbatim quotes and house label
  typography. Rules saved to memory `case-study-voice-calibration` —
  applies to ALL future drafts.

## Family Hub interview: the leaf takes wing (s32–33, 2026-07-29→31)

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

## FIELD NOTES v2: bento blobs (s34, 2026-07-31)

**Fable, art pass done PERSONALLY — Jake asked ("i wonder if you personally
could take another pass"), and taste is never delegated anyway. Three
sketch rounds against the "have a nice day" bento reference (Figma node
201140:9169), self-critiqued via headless-shell renders.**

- **The style law that fixed it: no outlines, no symmetry, eyes do the
  face.** v1 failed as stroked/mirrored clip-art. v2 = merged uneven
  circles (the bento proves plain circles read organic when radii and
  baseline vary), sleepy lidded pupils (flat top, round bottom), everything
  tilted a few degrees. Bento-proof detail: bumps can be perfect circles —
  wobble belongs in the ARRANGEMENT, not each shape.
- **Leaf v2 insight — draw the skeleton once, UNDER nine evenodd blade
  paths.** Eaten regions expose the rib automatically; holes chewed
  mid-arc (subpaths, fill-rule evenodd — legal in programs, unlike ids).
  Margins are lumpy; veins died with the clip-art look.
- **Tracker retheme carries the metaphor into the FURNITURE:** ledger =
  meadow (grass blades, eaten = green, next = orange w/ antenna dot),
  pbar fill = row of caterpillar bumps (repeating radial-gradient),
  checkbox = blob, tick = rotated bite, borders = uneven radii per card,
  peek critter clipped behind the footer rule (resting state VISIBLE —
  animations start at 0%, so a "rises occasionally" loop must idle UP or
  static/reduced-motion users see nothing).
- Jake edited DATA concurrently (verbatims, s32/s33); my edits were
  CSS/art-block-only and coexisted — one mid-stream "modified on disk"
  warning, no collisions.
- Notion task commented (still In Progress — Jake reviews); deck skipped
  (Blob cap); tracker JS `node --check` clean; branch `tsc --noEmit` clean.

---

## CV.EXE: the printer prints (session 30, 2026-07-28)

**Shannon/Opus solo — the session was a content negotiation with Jake (his
facts, his voice, his risk appetite) plus one tightly-coupled feature. Both
halves are taste, which §4.2 never delegates. Deck unreported (Blob cap).**

- **Three premises were wrong, and checking beat complying.** Production was
  never on the leaf patch (its Vercel build is `target: null`, a preview), so
  nothing needed reverting. Session 29 had already made the Notion project, so
  nothing needed creating. And `docs/PLAN-CV-EXE.md` §0.3 said to "reuse" the
  3–4×/355% figures as already published — they are not published anywhere on
  the site, making them a FIRST disclosure. Rule adopted: **relative deltas on
  Jake's own work ship; absolute internal volumes never do.**
- **pdfkit, not @react-pdf/renderer.** A single ATS column needs no reconciler,
  and built-in Helvetica means zero font embedding: the ATS-safe face and a
  4.4KB file in one decision.
- **The reveal is CSS, not Motion, on purpose** — Motion drives from rAF, which
  a hidden tab freezes, so a visitor who printed then switched tabs would
  return to a sheet reading "done" and showing nothing.
- **Verification, worth re-reading:** the preview pane reports
  `document.hidden`, freezing rAF AND CSS transitions — it can prove state but
  never appearance. Real renders came from the cached ms-playwright
  `headless_shell` over raw CDP (Node 22 has global `WebSocket`). Zero drift
  proven: all 50 exported strings matched in both printout and PDF text layer
  (via pypdf — `pdftotext` is NOT installed here).
- Closed a real hole: `portfolio-tracker/` (the directory, holding internal
  metrics and screenshots) was never gitignored — only the `.md` was.

## The hiring audit + Trash v1 + SpecSheet fix (session 29, 2026-07-28)

**Fable solo (audit = taste, never delegated; build tasks small + closed —
delegation overhead > work). Walked lunde.co as a Google hiring manager,
then executed Jake's follow-ups. Work landed on branch `leaf-patch`, not main.**

- **Audit:** interview-worthy if cases complete; 4 gaps = gate friction,
  no resume, solo-monument signal, padlocked Trash. Ranked adds: Trash
  (done), CV.EXE (planned, P1), Red Pen, Build A Skin, DEVLOG, Lou
  screensaver, Ask The Machine.
- **Trash v1 OPEN** — disposal records replace the padlock. Three tags:
  Grows With You (pink, tracker-sourced), The Assistants (Sprout/Dusty/
  Penny/Buck/Scout, Figma team-library 442:338964 — ⚠️ cause-of-death +
  year DRAFTED, need Jake), The Installer (site's own kill). Copy via
  `trash.*` keys; window 480×560, `/trash` deep link.
- **SpecSheet skin-reactive** — MutationObserver watches `data-skin` too;
  accent + typeface names quoted per skin (next/font hashes families, so
  they can't be read from the DOM). Cherry-picked to main in session 30
  as `92b615b`; the rest of the commit stays parked with the branch.
- **Notion:** 4 project pages created (CV.EXE dated today, Medium; Red Pen
  incl. sufficiency verdict: Invest alone NOT enough — zero critique
  artifacts captured yet; Build A Skin outlined; Ask The Machine parked).
- **Tracker:** Red Pen capture checklist added (quote pushback, before/
  after, one "I was wrong" receipt per project, artifact screenshots).
- Deck unreported (Blob cap).

## MEDIEVAL: knight-speak voice (session 28, 2026-07-28)

**Fable solo (small closed task; Jake on a fixed budget — delegation overhead
would have exceeded the work). Notion task "update language": translate site
copy to olde english under medieval WITHOUT verbosity bloat. Built on branch
`medieval-language-translator` (`9cd65f8`), unmerged — Jake reviews, then
merge. A concurrent session was editing visual assets in the same tree; only
`src/content/copy.ts` + `knightspeak.ts` were committed.**

- **Design: deterministic dictionary, not generative.** `knightspeak.ts` =
  phrase-first, word-boundary, case-preserving rules curated against the
  actual copy.json corpus (11 keys transform today, max growth +2 chars,
  one string shrinks). "you"→thee after prepositions; "thy"→thine before
  vowels; contractions handled ("you're"→"thou art"); facts/tech labels
  untouched because they're not in the dictionary.
- **EDIT.MODE seam is the load-bearing decision:** derived values resolve
  as slot `medieval` (not `base`), so an edit under medieval commits as an
  explicit override — copy-commit already promotes string entries to
  variant maps (route.ts). Editing derived text can never clobber base.
- Extension point: `SKIN_VOICE` map in copy.ts — underwater gets a voice by
  adding one entry.
- Verified live (JS probes, own server on :3210 via temp launch.json entry,
  reverted): medieval renders "Gramercy for coming by!" / "The first page
  be thine."; classic unchanged; console clean. Desktop icons open on
  single click — synthetic double_click toggles a window open+closed.
- **Shipped same session** (Jake approved; Sonnet delegate): cherry-picked
  onto origin/main as `89550d0` — 95b357c stayed local per Jake's explicit
  "translator only" call. Vercel READY, `gramercy` marker confirmed in the
  live chunk (lunde.co 308s to www — curl needs `-L`). Local main rebase
  blocked by the concurrent session's dirty tree.
- Deck dispatch/merge unreported (no CC_FEED_KEY in env + Blob cap 500s).
  Notion task → Done.

---

## FIELD NOTES: the leaf patch (session 27, 2026-07-27)

**Fable orchestrating on a $58 budget. Jake's wife's metaphor: projects are
leaves a caterpillar eats to become a butterfly — replaces plate development
on BOTH tracker and site. Two Opus delegates (Surface B: critters + program
reskin, one leaf revision round; Surface A: tracker single-file rewrite,
resumed once after a connection drop). Committed `95b357c` locally, NOT
pushed — copy drafts await Jake.**

- **Taste round that mattered:** first leaf never looked eaten (8 scallop
  notches; 55% ≈ 100%). Fix = nine pre-authored silhouettes chewed tip→stem,
  bare-rib skeleton at 8/8, geometry generated once by de Casteljau split
  (`gen-leaf-states.mjs`, scratchpad-only). One `<g>` visible at a time.
- **Durable character source = `critters.tsx` + tracker preview HTML.** The
  scratchpad `critter-svgs.md` handoff doc is ephemeral; if the drawings need
  editing, edit critters.tsx and re-inline into the tracker by hand (the two
  surfaces intentionally duplicate paths — drift risk accepted, noted here).
- **Static-art review trick:** browser-pane `file://` tabs render as
  snapshots and refuse screenshots; Playwright's cached headless shell
  (`~/Library/Caches/ms-playwright/chromium_headless_shell-*/…/headless_shell
  --headless --screenshot=…`) renders them fine. rAF-freeze caveat doesn't
  apply to static SVG.
- **Site leaf is blue on classic** — `--accent` is the only legal fill (a
  green would be an invented third color). Tracker (standalone, not
  token-bound) got monarch orange instead. Flag to Jake if the blue reads odd.
- **Chrysalis exists only in the tracker** (ladder rung 80% + drawing);
  site data has no "drafted" signal — revisit if a `stage` field ever lands
  on CaseDef.
- Notion task "update case study tracker vibe" → In Progress + summary
  comment. Deck dispatch/merge unreported (Blob cap 500s).

---

## Latest session — desktop consolidation · iPod afloat (session 25, 2026-07-26)

**Opus orchestrating; four parallel agents on disjoint files (FOURIER=iPod,
NYQUIST=icons/feedback/viz, DOPPLER=machine, HERTZ=CommandWidget); the seam —
registry, Folder, Window, copy keys — written by the orchestrator first. Zero
conflicts. Shipped as `fc37c82`; verified live on lunde.co.**

- **Renames** (registry + copy.json): Studio→Remixes, SEQ-16→Beat Machine,
  Jigsaw→Puzzles, Tattoo Gun→Tattoo Me, In Progress→**Case Studies** (`/cases`),
  viz Scrobbles→**History** (new `hidden` flag keeps a rehomed viz out of the
  Visualizers index while its id stays the address of window + deep link).
  PROJECTS + ??? off the desktop. New icons: `ipod`/`music`/`smiley`/`bubble`.
- **Click wheel volume — the MODEL was wrong, not the plumbing** (every
  suspected culprit proven fine, incl. 31 real writes reaching `<audio>`). The
  accumulator was unclamped: from the default 0.85 you pinned at 100% after
  81°, then banked every further degree as slack, so a 180° overshoot needed
  99° of reversal before anything moved. Replaced `rotary`/`onDetent`/`onTurn`
  with ONE callback — **`onTurn(deg) => consumedDeg`**; the wheel discards what
  the parent didn't spend, so slack cannot exist and 360° = one full sweep,
  relative to the grab by construction. Haptics in `lib/haptics.ts` — **iOS
  Safari has no `navigator.vibrate`, so it is Android-only.**
- **Recede-when-inactive is on the window's CHILDREN, not the window** — the
  paper stays opaque so stacked windows occlude instead of turning to soup.
  `filter`, not `opacity`, because Motion owns the inline `opacity`.
- **Medieval wheel = turned oak.** Timber is tinted with the gilt accent:
  parchment-mixed-into-the-plate alone lands on a dead grey. Grain lives in the
  rotating SVG, lighting on the static `.ring` — swap them and the highlight
  spins like a lighthouse. ⚠️ ROLES ARE INVERTED inside `.studio` (`--surface`
  is the dark plate, `--content` is parchment); getting that backwards paints a
  black "highlight". Zone labels went full `--content` in medieval — muted
  measured 3.19:1 on wood, fails AA; now 5.49:1.
- **ABOUT THIS MACHINE** lost the twirl-down and its SSR/CLS workaround; hugs
  at 600×420 (was 86px of dead space), CTA centred, opens the new `ai-opinion`
  window (`/ai`). Drawers hug ONE row via fixed 88px tracks — `minmax(88px,
  1fr)` stretched them and FUN wrapped 3+1.
- **`OS_VERSION` (`src/lib/version.ts`) is the ONE version literal** — it had
  drifted four ways (menu bar v0.2, Boot v0.2, README v0.1, machine "1.0").
- **COMMAND.CTR** back to a floating chip: LIVE (filled dot, raised frame,
  pulse) vs IDLE (hollow ring, flush, `LAST SESSION →`) — state on text +
  shape + elevation, never motion or colour alone. Sticky notes → FEEDBACK.
- **Three traps this session cost real time, now in memory, not repeated here:**
  `useId()` in a program component breaks hydration (use a constant id); this
  repo has **no prettier config** so `npx prettier` mangles the house style; the
  preview pane freezes rAF *and* CSS transitions, so inject
  `*{transition:none!important}` before trusting any computed style.

## Latest session — iPod STUDIO · ABOUT.MACHINE · IN.PROGRESS (session 24, 2026-07-26)

**Fable orchestrating; three parallel agents on disjoint files (FOURIER=iPod,
NYQUIST=machine, FOURIER-2=tracker); seam — registry entry + copy keys +
`cases.ts` progress — written by the orchestrator first. Zero conflicts.**
- **STUDIO = iPod video.** LCD (status / `n of N` / art / song·artist·album
  parsed from manifest titles / negative remaining) over a click wheel: four
  radial `<button>` zones + SELECT, plus rotational drag (24° detents →
  `sfx.tap()`, 540° volume sweep). Songs ←MENU— Now Playing —SELECT→
  Visualizer; canvas DSP moved intact to `Visualizer.tsx`, palette now via
  `getComputedStyle`. Medieval = 8-spoke wooden wheel; zones don't move.
- **ABOUT.MACHINE** → System 7 "About This Macintosh": identity block,
  `Total Memory 4,096K / Largest Unused Block 512K`, five bars reconciling
  exactly (1152+896+768+640+128 = 3,584 = 4,096−512), widths derived from the
  numbers. Essay + old SPECS behind a disclosure — content 340px, was ~2,000.
- **IN.PROGRESS (WIP-15)**, `/progress`: an OS 9 installer that never finishes.
  Aggregate bar (mean pct = 50%), per-case bars, ENCOURAGE → `POST /api/nudge`
  (blob, guestbook OIDC pattern, one per case per session). **Notification =
  optional `NUDGE_WEBHOOK_URL`**, Slack/Discord/ntfy `{text}`, silent if unset.
- **Live-found, fixed:** (1) `--pod-w: min(300px, 100%)` also fed heights — a
  `%` in a custom property resolves against the *matching axis*, collapsing the
  device to 72px tall; now `100vw`-based. (2) machine's disclosure collapsed
  only once Motion ran, so SSR shipped it expanded (CLS); closed height now in
  CSS. (3) machine bar column 96px → `minmax(150px, 1.15fr)`, own row <400px.
- Verified: contrast both dark plates (accent 5.41:1 / 5.75:1 medieval), 360px
  zero overflow ×3, screen nav, `/api/nudge` degraded shape. Preview pane
  reports a **0×0 viewport** — force `resize_window {w,h}` before believing
  any measurement (details in the pane memory).

---

## Latest session — EDIT.MODE: copy layer + in-situ editor (session 23, 2026-07-24)

**Fable orchestrating; NYQUIST(sweep) + FOURIER(program+API) parallel, disjoint
files. Shipped 1f39a8c.** Contract (copy.json/copy.ts/CopyText.tsx) written by
orchestrator first = the seam; both agents built against it, zero conflicts.
- Live-verified end-to-end (JS probes): auth matrix (401/200/501), arm, in-place
  edit, dirty rows, Esc revert (window-close suppressed), medieval slot
  targeting (`Oubliette → The Pit` wrote slot `medieval`), token-missing SAVE
  lockout. Fixed live-found bug: stale `data-edit-old` across skin switch.
- Casing landmine: `Copy.tsx` vs `copy.ts` — bundler resolution tries `.ts`
  first on case-insensitive FS; component renamed `CopyText.tsx`.
- **Jake to go live:** Vercel env → `EDIT_MODE_KEY` (pick a key) +
  `GITHUB_COPY_TOKEN` (fine-grained PAT, contents RW on portfolio-2026).
  A placeholder local dev key sits in .env.local (read it there; rotate at will).
- Unverified live: Safari caret on transformed windows; real GitHub commit
  round-trip (coded + reviewed, token was absent locally by design).

## Rotated: Type overhaul: adoption sweep + bridge aliases (session 22, 2026-07-24)

**Fable orchestrating; HERTZ(research) + NYQUIST(sweep) + FOURIER(bridge) delegated.
Shipped 8d8daab.** Jake's three Figma complaints root-caused and fixed: (a)
"hardcoded labels" = bridge baked typography literals because core leading/tracking/
weight lacked `$type` → STRING vars can't alias FLOAT fields; now typed + aliased.
(b) "crazy line-heights" = orphan `1.62` literal + duplicate `leading.body` concept
rendered as bare %; now ONE concept, every role traces to the named 6-step leading
ramp. (c) "no weight ramp" = roles only used 400/700; now 400/600/700 visible +
medium 500 primitive. Value snaps shipped (Chromatic-gated): case prose 17→15px,
body leading 1.62→1.7, heading-3 700→600, specsheet specimen snaps, sub-8px chrome
→8px. Deviation from Greenlight ref (deliberate): kept unitless named leading ramp
over index-paired px line-heights.
- **⚠️ BEFORE Jake's next Figma PULL:** delete stale STRING `core/leading|tracking|
  weight` variables (ideally the whole `type` collection) — bridge reuses existing
  resolvedTypes; STRING can't alias into FLOAT. Fresh files fine. Also unverified
  until live PULL: alias creation in-Figma, text-style binding, Geist font loading.
- **EDIT.MODE scoped** (Notion P1, "Scoped"): git-backed in-situ copy editing —
  `t(key, skin)` copy layer (shared foundation with the language-modifier task) +
  hidden desktop program, contentEditable on keyed nodes, diff panel, GitHub
  Contents API commit to main. One session, crew-split. Jake approved the approach.
- Review note: no DOPPLER pass — mechanical sweep verified by tsc/build/doctor +
  25 plugin tests; Chromatic gates visuals. NYQUIST's stale value-comments fixed.

## Rotated: Auto dark mode + hand-drawn medieval dataviz (session 21, 2026-07-23)

**Solo overnight run (Jake asleep, "pick one or two and take care of em").** Two
self-contained Notion tasks, both now Done. 3 source files, +56 lines, no forbidden
paths. tsc clean, prod build green.
- **Automatic dark mode** (`src/store/settings.ts`): the OS was only honored on the
  *first* visit (pre-paint script in `layout.tsx`) — after any manual toggle the
  `lunde-theme` pin won forever and live OS flips were ignored. Added a
  `matchMedia('(prefers-color-scheme: dark)')` `change` listener in `hydrate()`
  (module-level `systemThemeBound` guard — hydrate runs in both MenuBar + GateSphere,
  so bind once). On an OS appearance change the site follows AND clears the pin, so the
  system stays authoritative; the toolbar LGT/DRK toggle still overrides until the next
  OS change. Pre-paint script untouched → no FOUC. **Caveat:** the browser-preview
  pane updates `matches` but does NOT dispatch scheme `change` events (verified with a
  probe listener), so live-follow was proven by logic + tsc + build, not exercised
  in-pane. Will fire on a real macOS Appearance switch. If Jake prefers a *permanent*
  manual pin instead of "system change wins", drop the `localStorage.removeItem` line.
- **Hand-drawn medieval dataviz** (`Desktop.tsx` + `viz.module.css`): implemented
  Fable's scoped approach exactly — one `feTurbulence`+`feDisplacementMap` roughen
  filter (`#lunde-roughen`) defined ONCE in the shell (Desktop, so the id resolves
  document-wide with no duplicate-id risk when multiple viz windows are open), applied
  via a single CSS rule `:global([data-skin='medieval']) .viz svg { filter: url(...) }`.
  All 6 visualizers get the inked-quill waver with zero per-viz rework (they all route
  through `VizShell` = `.viz`). Gentle long-wavelength displacement (baseFreq 0.014,
  scale 1.8) so the two text-bearing charts (Flights, Taurus) stay legible. Filters are
  visual-only → scrub hit-testing untouched. Verified in-browser: Ride GPS trace +
  elevation read hand-inked under medieval; classic computes `filter: none` (no
  regression). Per-viz tuning still available later per Fable's note.

## Rotated: Skin switcher + per-skin desktop identity (session 20, 2026-07-23)

**Shipped to main (c61bb79, deployed).** Three Notion tasks landed: "put button to
toggle in toolbar" + "update icons for desktop apps" (Done); "update language" seeded.
- **Toolbar SkinSwitch** (`src/components/shell/SkinSwitch.tsx`): compact control
  trailing the wordmark showing the active skin, flying out to CLASSIC/MEDIEVAL/
  UNDERWATER. Each row wraps in `data-skin={id}` — because the generated token CSS
  scopes skins by *bare* attribute selector, a nested `data-skin` re-scopes
  `--surface`/`--accent`/`--mono` for that subtree, so each row is a REAL preview in
  its own palette + face (medieval row literally renders MedievalSharp on parchment).
  Underwater has no token scope yet → disabled + dimmed. Spring motion (SPRINGS.deck),
  reduced-motion + Escape/outside-click close. `menuLeft` wrapper groups wordmark +
  switch; light/dark toggle stays in `menuRight` (classic only).
- **Per-skin icon art** (`Icon.tsx` + `Icon.module.css`): Icon renders both a
  `.glyphClassic <g>` and (where present) a `.glyphMedieval <g>`; swapped purely by
  CSS off `[data-skin]` — no JS, SSR-safe, instant. 15 woodcut/heraldic medieval
  glyphs for the desktop programs. Classic-hide gated on `.hasMedieval` so
  variant-less icons keep classic under every skin.
- **Per-skin vocabulary** (`src/lib/skinVocab.ts`): `programName(id, canonical, skin)`
  overrides a program's display name (desktop label + window title + a11y). Medieval
  lexicon: README→Incipit, Projects→Works, …, Settings→The Workings. Consumed by
  `DesktopIcons.tsx` + `Window.tsx`. See memory `per-skin-reskin-mechanics`.

## Rotated: Typography round-trip — Figma text styles bound to variables (session 19, 2026-07-23)

**Built, NOT yet shipped (awaiting Jake's in-Figma PULL check + his OK to push to
main).** Edit a variable (e.g. line height), PUSH, and it round-trips to the repo;
the text style consumes it.
- **New tokens**: `core/font-figma.json` (Figma family names — Geist / Geist Mono /
  Geist Pixel) + `semantic/typography.json` (one DTCG `$type:typography` composite
  per role, referencing the CSS-facing `type.*` sub-tokens + font-figma names). Both
  `disabled` in every $theme → SD emits NOTHING to CSS (parity literally
  0-added/0-changed). Crux solved: CSS vs Figma want different units (leading
  `1.6`⇄`160`%, tracking `0.14em`⇄`14`%, weight str⇄FLOAT, family stack⇄real name)
  → a Figma-native representation, derived by the bridge.
- **Bridge** (`figma-plugin/src/{tokens,code}.ts`): PULL expands each composite into
  a `type` collection (6 bindable vars/role, Figma-native units) + creates one
  TextStyle/role (`Display`, `Heading/1`…), unit-set-then-bound. PUSH serializes
  edited `type` vars back through composite refs to the `type.*` sub-tokens in
  `semantic/scale` — guarded by a baseline compare so an untouched pull→push never
  delinks. 9 new unit tests (19 total pass); tsc clean; bundle builds.
- **Doctor D8** (composite completeness; dangling member ref = hard error) + RUNBOOK
  "Typography" section.
- **Decisions** (Jake): scope = Figma round-trip only (no CSS utility emit); fluid
  sizes (display/heading-1) pinned to desktop MAX + pull-only; font-family/style
  pull-only; all 3 Geist fonts confirmed present in the Figma file.
- **Verify in Figma**: PULL → expect a `type` collection + 10 text styles, each field
  🔗 bound; edit a `line-height` var → PUSH → PR edits the role's `leading` sub-token.
  **Unverified headless**: that a bound lineHeight FLOAT reads as % — we set
  unit=PERCENT before binding for exactly this; confirm on first PULL.

## Rotated: DS-mirror COMPLETE + Typography ramp v1 (session 18, 2026-07-19)

Shipped to main (67d7b30, deploy READY). The token system mirrors the Minimal-DS
two-layer reference AND the designer can update tokens prompt-free:
- **Bridge PUSH fixed** (e24fb84): dark/medieval-mode edits of INHERITED tokens
  were silently dropped; now theme-major/name-major with override materialization.
  First unit tests in repo (`npm test`, 10 cases on figma-free tokens.ts logic).
- **New dimensions** (d007046): interactive state matrix + status roles, all 3
  skins, every pair AA-audited. Medieval danger = near-black oxblood (separates
  by VALUE not hue — "never adjacent").
- **Semantic spacing** (67d7b30): spacing.component/layout t-shirt scale
  (reverses old Decision C; --space-N still emits).
- **tokens:doctor** (c01dd4c + 67d7b30): D1-D6 lint + --parity gate, wired into
  tokens-sync.yml (--strict --parity origin/main).
- **tokens/RUNBOOK.md**: prompt-free manual.
- **Typography ramp v1** (58e655c): core/font-size + core/leading scales;
  semantic `type.{display…mono}` role groups; D7 (type-role completeness). Vars
  were DEFINED-BUT-UNCONSUMED (107 D6 warns — expected).

---

## 1. State of the system (2026-07-08)

**Live at https://lunde.co** (canonical domain; host is Vercel project
`portfolio-2026`, team `lunde-os`; push to main = deploy).

**Programs, all live:** README · Projects → Greenlight Invest case study
(MDX + interactive Moat/Scrub/FrequencyBars) · Guestbook (durable, Blob) ·
6 Visualizers now **broken out as desktop icons** (Ride, Flowers, Scrobbles,
Flights, Slopes, Taurus — each opens its viz:<id> window standalone; the
Visualizers folder still exists as the /visualizers index but is off the
desktop) · Studio (Jake's 5 remixes, WMP-style WebAudio viz — BARS/SCOPE/
RINGS) · Now Playing (**Apple Music LIVE**) · Photo Booth (per-pixel VHS/
dither/duotone/CRT; **PIN TO WALL** stores last 3 snaps in localStorage) ·
Jigsaw · Tattoo Gun (trace game) · About This Machine · Trash (padlocked) ·
Settings · **COMMAND.CTR** (brutalist orchestration deck — five named agent
units with animated shape avatars replaying the build history from
`src/programs/command/cc-timeline.json`; crew + delegation policy in
CLAUDE.md §13.5; avatars in `public/cc/avatars/`, assigned in
CommandCenter.tsx AVATARS map).

**2026-07-09 (Fable 5 finale, agent-orchestrated):** Visualizers back in a
folder (icon-grid) with viz desktop icons retired; Flowers→**Models** shelf
(photoscan flowers + procedural 662-face Louie from `scripts/make-louie.mjs`;
'jake' slot pending his scan; 3D clipping fixed: scale 0.46 centered).
`@vercel/analytics` live (pageviews free; custom events wired via
`src/lib/metrics.ts` but need Vercel Pro to appear). Scrobbles "Apple era":
`/api/apple-history` aggregates Apple recent-played (API caps ~50 tracks, NO
timestamps — per HERTZ research; never fake weekly counts), bake via
`scripts/applemusic-bake.mjs` against the live route, gap weeks render as
dashed blue carrier band. Legacy /visualizers/flowers aliases to models.

**2026-07-10 (Fable, usage-limited sprint):** Scrobbles timeframe truncated
at the last.fm dropoff (+2 carrier stubs). Mobile: no auto-README (launcher
first), 28px touch targets on titlebars. Studio: volume knob (rotary, drag
vertical, keyboard arrows) + per-track album art (`art` field in manifest).
PhotoWall: Jake's default polaroid pin (public/booth/jake-default.jpg,
dismissible via localStorage). COMMAND.CTR: **live mode** — /api/cc-feed
(Blob `cc/feed.json`; POST guarded by CC_FEED_KEY env — in Jake's Vercel +
.env.local; report with `scripts/cc-report.mjs`), LIVE chip when feed fresh
<15min, replay fallback, **marker-blackout redactions** (`redact:true` events
→ deterministic black bars; reporter must pre-strip secret text), telemetry
blips (dispatch rises/return falls/merge lands; status silent). Jigsaw: 5
generated puzzles (rings/louie-3D/crew/moat/pixel-lou in puzzleImages.ts),
timer from first touch, local top-5 leaderboard (names from guest-name key),
confetti. ORCHESTRATION RULE: when dispatching agents in live sessions,
report via cc-report.mjs so the site's deck mirrors reality.

**2026-07-10 (later — live crew):** cc-feed is LIVE-verified end to end
(CC_FEED_KEY in Vercel; feed uses VERSIONED blob paths cc/feed-<ts>.json —
single-path overwrite serves stale CDN reads, same lesson as guestbook; keep
~3, prune rest; space cc-report calls ≥2s or batch, read-modify-write races
lose events). Ambient agents shipped (`shell/AmbientAgents.tsx` + shared
`shell/crew.ts`): bottom-edge wanderer w/ shift changes + dispatch flashes on
window-open (agentForWindow mapping). Moderated public wall shipped (NYQUIST
built /api/wall + /wall-review?key=CC_FEED_KEY): booth pins → wall/pending/,
Jake approves → wall/live/ (≤3 shown to everyone); PhotoWall = own local pins
+ approved; Jake's default polaroid only when wall empty. SEQ-16 shipped
(/seq): 16×3 WebAudio sequencer (kick/snare/blip), BPM 60-180, 5 blip notes,
4 localStorage slots. ORCHESTRATION RULE stands: report dispatches live.

**Shell:** wallpaper system (7 patterns) · classic-Mac scrollbars · Geist/
Geist Mono/Geist Pixel type system · LOU.SYS screensaver (5-min idle; pixel
Lou over the perspective checkerboard; triple-click the menu-bar clock to
summon) · Now-Playing desktop widget (polls /api/now-playing) · **resizable
windows** (bottom-right ribbed grip; size persisted per-window in the store
for the session; `store/windows.ts` `sizes` map) · conceit year 1992 · v0.2.

**Desktop widgets** (edges, z-index 2, hidden < 900px): NowPlayingWidget
(top-right, Apple recent-played) · DailyWidget (bottom-left, live coffee +
Lou's-meds gauges from `lib/dailySystems.ts`) · PhotoWall (right edge, last
3 pinned booth snaps from localStorage key `lunde-booth-wall`; Photo Booth
calls `pinPhoto()` exported from PhotoWall.tsx).

**Windows now fit their content on open** (Opus 4.8, 2026-07-08): default
sizes in registry.tsx/vizRegistry.tsx were re-fitted from measured overflow.
Method if you add/change a window: open it in preview at 1280×820, measure
`windowBody.scrollHeight - clientHeight`, add that + ~8px buffer to the
declared height, keep ≤ ~730 so it clears the `max-height: calc(100%-24px)`
clamp on an 800px laptop. Long-form windows (case study, About This Machine
essay) intentionally still scroll.

**Known debts:** first-load JS is ~242 kB (was 155) — perf pass overdue;
Photo Booth's live-camera path has never been human-verified end to end;
(coloring book retired 2026-07-10 in favor of the Tattoo Gun trace game).

## 2. Architecture map (30 seconds)

- `src/programs/registry.tsx` — desktop programs (icon + window + deep link).
- `src/programs/projects/cases.ts` — case studies (`case:<slug>`).
- `src/programs/visualizers/vizRegistry.tsx` — visualizers (`viz:<id>`,
  deep-linked /visualizers/<id>).
- `src/programs/resolve.ts` — window id → window def; `windowsForPath`;
  `ALL_PATHS` drives SSG.
- `src/store/windows.ts` · `src/store/settings.ts` (theme/sound/wallpaper).
- `src/lib/studioPlayer.ts` — singleton audio engine (playback survives
  window close). `src/lib/appleMusicToken.ts` — Apple JWT.
- `src/components/shell/` — MenuBar, Desktop, Window, Wallpaper(+s),
  Screensaver, LouSprite (pixel map — edit the string grid), NowPlayingWidget.
- `scripts/*.mjs` — data bakes: raw personal data in gitignored `ref/` →
  committed JSON. Never runtime-fetch personal data.
- `content/*.mdx` — case prose. `src/programs/paint/tattooPaths.ts` — tattoo stencils.

## 3. Process rules (learned the hard way — do not relearn)

1. **Dev server and `npm run build` share `.next` and corrupt each other.**
   The trap that keeps biting: `preview_start` silently REUSES a running
   server. Sequence strictly: `preview_stop` → build → `preview_start`.
   Symptoms of corruption: ENOENT manifests, `__webpack_modules__[moduleId]
   is not a function`, black pages. Fix: stop server, sometimes `rm -rf .next`.
2. **Deploy = push to main** (`PATH="/opt/homebrew/bin:$PATH" git push`;
   gh is authed via keyring). Poll the commit status API until success, then
   curl the live routes. Never force-push without Jake's explicit OK.
3. **Never commit:** `ref/` (raw GPS, the Apple `.p8`, tattoo/Lou photos),
   `portfolio-tracker.md`, `session-log.md`, `invest-pull-quotes.md`,
   `docs/`, `.env*`. Grep `git status` for these before every commit.
   History was rewritten once over a leak; don't earn a second.
4. **MDX components taking markdown children render `<div>`, never `<p>`.**
5. **Vercel Blob = OIDC + `storeId: process.env.guestbook_STORE_ID`.**
   No `*_READ_WRITE_TOKEN` exists. Don't "fix" it.
6. **Preview-browser quirks:** rAF pauses when backgrounded (exit animations
   freeze — not a bug); synthetic enter/leave events don't fire React
   handlers — call `__reactProps` handlers directly; navigation + eval race —
   navigate in one eval, act in the next with a setTimeout.
7. **Secrets stay ephemeral** (per-run env vars); the safety classifier will
   rightly block persisting them and publishing content under your own name
   to the live site — don't fight it, hand those decisions to Jake.
8. Prerender errors can be flaky — rebuild once before debugging.
9. Commits end with the Claude co-author line.

## 4. Design guardrails (beyond CLAUDE.md)

- Blue = system, pink = the one expressive mark. CRT surfaces pin
  `--blue:#5c7cff`. Pink is never text on cream (`.hl-pink` treatment).
- Display/bold/highlight = Geist Pixel 400, tracking 0, ≥ ~12px, no CJK.
- Every viz: HUD flips idle-totals ↔ scrub-state; mono `Layer NN` labels;
  `sfx.tap()` on scrub boundaries; `useReducedMotion`; labeled SVGs.
- Personal-data features bake privacy in silently (trim GPS ends, normalize
  coords). Jake never asks for this; do it anyway.
- New programs must feel like the others: paper or CRT chrome, stamps for
  empty states, one signature interaction each.

## 5. THE BACKLOG (updated 2026-07-08 from Jake's doc — his freshest edits first)

### Jake's current emphasis (newly added/edited by him in the doc)
1. ~~**Window resizing**~~ ✅ SHIPPED 2026-07-08 (Opus 4.8).
2. ~~**Windows fit their content**~~ ✅ SHIPPED 2026-07-08 — defaults re-fitted;
   resize handles anything left. See §1 method note.
3. ~~**Daily tracker → ambient desktop widget**~~ ✅ SHIPPED 2026-07-08 (Opus).
   Still open sub-idea: hover cursor shows Jake's face getting happier as
   coffee fills — needs his face art; deferred until it exists.
4. **Studio: album artwork per track** — he'll need to drop art files in
   `ref/` or `public/audio/art/`; extend the manifest schema (`art` field).
5. **Now Playing: spinning record** — vinyl disc rendered behind/beside the
   album art, rotating (pause under reduced-motion). Widget + window.
6. **Settings: background color** — his edit says "Set the background
   *color*": paper-tint variants (cream/cool/warm/void?) alongside pattern
   wallpapers. Stay inside the two-accent law — tint the paper, don't add hues.

### P0 — content debt (Jake said it himself: "i will need to get back to
### actually generating case studies at some point")
7. **Family Hub case study** — interview → tracker → MDX (Invest pipeline).
   His LinkedIn describes it: hardware+software, calendars, AI assistant,
   safety map, chores, photos, "massive undertaking in only months."
   Signature viz: per-member concentric rings.
8. **Tooling case study** — "I build my own leverage," 3 tools, interlocking
   circles viz. Needs interview.
9. **Meta case study** — the raw material is rich and current in local
   `session-log.md` (bottom sections). This is the differentiator; nudge him.
10. **Real Invest assets** into the dashed Plates; `invest-pull-quotes.md`
    still missing from the repo.
11. **Perf + a11y pass** — 242 kB first load needs splitting scrutiny
    (audio manifest? viz data imports? check what landed in shared chunks);
    Lighthouse; keyboard sweep; contrast on CRT surfaces.
12. **SEO** ("make my page the top search result") — metadataBase lunde.co,
    OG images in the archival style, sitemap, JSON-LD Person.

### P1 — queued from the doc (everything needed is on hand or nearly)
13. **Last.fm ↔ Apple Music gap-fill** — Apple env vars are live now; merge
    recent Apple history into Scrobbles ("LIVE" vs "BAKED" chips).
14. **Snake game** — opens the Arcade program finally. CRT, blue snake, pink
    apple, localStorage high score.
15. **Photo Booth scrapbook** — Blob-backed pinned wall. Get Jake's explicit
    moderation sign-off first (strangers' faces, his storage).
16. **Low-poly queue** — Louie scan, "me?" (a scan of Jake) — pipeline ready
    (`scripts/obj-to-model.mjs`); needs his captures in `ref/`.
17. **Coins easter egg** (his face, redeemable) + **trading cards** — needs
    his face/character art ("Stuff for Jake" list); combine into one
    collectible system when art lands.
18. **Boot character + favicon** — waiting on his character design; favicon
    could ship early with pixel Lou (ask — Lou may BE the character).
19. **Screensaver head option** — his doc still mentions bouncing head
    illustration; LOU.SYS shipped — offer head as alternate saver object
    when art exists.
20. **Buzzfeed quiz** ("Which LUNDE OS program are you?") — copy session
    with Jake, then trivial to build.
21. **Screen time / silly stats** — needs a joke angle from Jake.
22. **Invest updates** — multi-company Moat (hand-write 3–4 datasets),
    haptics extended to Moat taps + viz milestones (navigator.vibrate).

### 2026-07-10 (Fable, session 3 — orchestrated) — SHIPPED
Projects wing GATED by a Severance/MDR sphere (`components/gate/GateSphere.tsx`
+ `store/gate.ts`; passcode LOUIE; fibonacci-sphere of letters, cursor-gravity
zoom, letters fly to slots, classic-Mac verdict dialog; `gated` flag on
resolveWindow, rendered in Window.tsx before the body; sessionStorage unlock).
Coloring book REPLACED by **Tattoo Gun** (`programs/paint/`, was pages.ts →
now `tattooPaths.ts`): WarioWare-style trace game, 6 tattoos as hand-authored
pixel strokes, pixel-gun cursor, 25s timer, coverage+precision score, local
bests. Ambient wanderer enlarged to 34px, campy speech bubbles
(`crewDialog.ts` by FOURIER), FLEES the cursor (pink, springy). Skills ticker
under the menu bar (`SkillsTicker.tsx`, desktop inset bumped +21px). README
rewritten + business-card header w/ Jake's photo (NYQUIST). Puzzle leaderboard
now always visible. Plane icon redrawn. GATE SOUNDS in `lib/sound.ts`
(`gateSfx`: pick/remove/success/fail). Skills-flex brief (12 ideas, FOURIER)
lives in this session's chat — top 3: user-research artifacts, design-system
docs, product-strategy/metrics.
BACKLOG (Jake asked, not yet built):
- **Digital billboard** — Jake wants "a note maybe a digital billboard for
  later." Unbuilt on purpose (underspecced). Likely: a desktop billboard/
  marquee surface for announcements ("NOW: open to Staff/Principal roles",
  "new case study dropping"), editable via a keyed endpoint like cc-feed, or
  just a static rotating message. Confirm intent + copy w/ Jake first.
- **Skills-flex programs** (FOURIER's brief): ACCESS.PANEL (a11y), FIELD.NOTES
  (research), SPEC.SHEET (design system), METRICS.CTR (strategy), MAN pages,
  MOTION.SPEC, EDGE.CASES gallery. These prove the *product-design* side the
  engineering-heavy site under-shows.

### 2026-07-11 (Fable, session 4 — wave-2 polish, all 10 asks) — SHIPPED
GATE FIXED: pointer capture on the sphere wrapper was retargeting clicks away
from the letter buttons (never capture on a parent whose children need
clicks); also added drag-vs-click discrimination (6px), release INERTIA
(velocity + exp decay blending back to ambient drift), a safety timer so
letter flights always land even if Motion's onAnimationComplete never fires
(hidden tab), and the sphere re-skinned PINK. Business card → POSTAGE STAMP
(About.tsx `stampCard`, Kyoto Forest format: type left / pinstripe plate
right; mark = public/mark.png alpha-extract of ref/mark/stamp-jake.png via
PIL saturation threshold, inked var(--pink) through CSS mask; perforation =
4-layer radial-gradient background). STICKY NOTES (shell/StickyNotes.tsx):
4 real quotes (2 Lattice peers, parent, kid-13) — z-index 0, décor loses to
windows. TATTOO FIDELITY PASS: all 6 stencils redrawn against the actual
photos (tattooPaths.ts) — dice tumble w/ bounce marks (1+3 pips), heart
carries the TAYLOR banner w/ skeleton letters, bed is the canopy cube w/
back band, wolf is faceted w/ dotted seams + crescent, Bob = body-with-face
holding ball-head, mouse = jack-o-lantern head + curly tail. AGENTS: first
scare = startle JUMP (wanderJump keyframes), second = flee; edge exits walk
fully off-screen then 5s off-duty gap before the next unit enters (no more
corner-camping rip). CC WIDGET (shell/CommandWidget.tsx): top-center pill,
pink pulsing dot when feed <15min fresh, expandable 4-event mini feed +
"OPEN FULL DECK"; command program off the desktop (onDesktop:false, /command
+ window intact; widget hides while the window is open). NYQUIST: MiniPlayer
(shell/MiniPlayer.tsx, shows when track playing & studio closed, art+◁▷❚❚×),
PUBLIC jigsaw leaderboard (/api/puzzle-times, versioned blob paths
puzzle/times-<ts>.json keep-3, validated POST, "BEST — WORLDWIDE", local
fallback), piece affordances (blue drop-shadow outline unplaced, scale+shadow
while dragging, flat when locked), trash pinned bottom-left, DailyWidget →
bottom-right. FOURIER: FIELD.NOTES (/field-notes, RES-13, research dossier
w/ real Invest quotes, placeholder ledger stamped) + SPEC.SHEET (/spec,
SYS-14, LIVE token doc — getComputedStyle + real WCAG luminance math,
re-reads on theme flip; motion values quoted from Window.tsx are hardcoded
strings — flagged). CLAUDE.md gained §13.6: always update HANDOFF at end of
session. GOTCHA learned: preview-pane tab reports document.hidden → rAF and
Motion animations freeze; don't chase "stuck" opacity/transforms in
screenshots — verify computed z/state via JS instead.

### 2026-07-11 (Fable, session 5 — 10 micro-polish fixes) — SHIPPED
(1) FIELD.NOTES hidden as a mystery icon: registry `desktopLabel: '???'` +
new `mystery` Icon (dashed frame + '?'); window title/route unchanged, opens
normally. (2) SPEC.SHEET icon redrawn — fanned paint-chips + 'A' type
specimen (color/type/tokens) replacing the janky swatch. (3) Sticky notes
repositioned to center band (left %-anchored) so the Now-Playing widget no
longer covers them; stickies stay z-index 0 décor. (4) Now-Playing widget
label 'Last played' → 'Now playing' (+aria). (5) Now-Playing PROGRAM off the
desktop (onDesktop:false); state lives in the widget. (6) Carried Jake's CSS
tweak (stamp perforation holes → var(--paper-2), plate border removed).
(7) PhotoWall dead hover × removed. (8) PhotoWall click-to-zoom lightbox
(`.photoZoom` fixed overlay, click-anywhere / Esc to close; pins are now
<button>s, cursor zoom-in). (9) CommandWidget only renders when live (idle
state gone). (10) Desktop icons: new `ProgramDef.desktopLabel`; DesktopIcons
imposes explicit ORDER (README·GUESTBOOK·MACHINE top row, SETTINGS always
last) and `.icons` switched to row-flow 3-col so the top row is literal;
mobile `.icons` scrolls (overflow-y:auto, top/bottom inset) and trash joins
the grid (`.trashGrid` shown ≤720px, `.trashIcon` corner hidden). ADD-A-
PROGRAM NOTE: desktop order is now the ORDER array in DesktopIcons.tsx, not
registry order — add new ids there (before 'settings').

### 2026-07-11 (Fable, session 6 — reverts + shared-element zoom + doctrine)
CC WIDGET REVERTED (Jake's call): CommandWidget.tsx deleted + its CSS;
command back on the desktop (registry onDesktop:true, 'command' in the
DesktopIcons ORDER array). SPEC.SHEET icon take 3: Pantone-style paint chip
(solid block + spec lines, second chip behind). FIELD.NOTES fully sealed:
registry name '???' → programs/fieldnotes/Sealed.tsx (dossier-folder SVG +
SEALED stamp + RES-13 note, Trash-teaser pattern; window 430×380); the real
FieldNotes.tsx stays dormant — to launch, restore name/component/size.
PHOTO ZOOM is now a TRUE shared element (Motion layoutId=photo URL): the
pinned polaroid itself flies to center (72vmin) and back on click-anywhere/
Esc — no separate lightbox img; wall siblings animate the gap (layout prop).
NOW-PLAYING widget shrunk to polaroid size (132px, matches photoWall) and
zooms the same way (layoutId np-card). CLAUDE.md §13.5 HARDENED: deck + 
delegation are session PROTOCOL for any orchestrating model — solo sessions
must self-report to the deck and declare "going solo" reasoning in the final
reply. NEW: CREW.md — delegation doctrine v1 (task-shape routing:
closed→Sonnet, open→Opus, taste/vision→orchestrator; whole-problems-first
splitting; economics; deck-viz roadmap incl. ownership lanes + solo events).
Read it before dispatching. GOTCHA: hidden preview tab stalls AnimatePresence
exits (overlay lingers at opacity 0) — state is correct, don't chase it.

### 2026-07-15 (Fable, session 7 — Design-System pipeline, Milestone A start)
On branch **design-system-pipeline** (NOT merged/deployed — feature work).
Plan: /Users/jake/.claude/plans/lively-sauteeing-snowflake.md (approved).
Goal: re-skinnable OS (classic|medieval|underwater) via a real token
pipeline + Storybook + Figma (Tokens Studio). Pipeline-first; v1 = pipeline
proven + Medieval. Classic keeps light+dark; others single-palette.
SHIPPED A0-A2 (commit 7f3eafa): token source-of-truth established.
- `tokens/` = Tokens Studio/DTCG JSON (core primitives color/font/layout +
  semantic classic-light/classic-dark + $themes/$metadata). Primitives
  resolve away; semantics alias them so --blue:#2036c8 emerges as before.
- `scripts/build-tokens.mjs` = Style Dictionary v4 + @tokens-studio/
  sd-transforms, one SD run per theme. TWO gotchas solved: (1) tokens-studio
  transformGroup names camelCase → cloned the group swapping name→name/kebab
  (kebab is what the site uses); (2) outputReferencesFilter (from
  'style-dictionary/utils') keeps var(--blue)/var(--ink) for EMITTED tokens
  but flattens primitive refs to literals — required for parity + the
  component --blue cascade. Emits FINAL data-skin selector model; classic-dark
  ALSO matches bare [data-theme='dark'] so dark works pre-store-widening.
- `src/styles/tokens.generated.css` (committed) imported by globals.css;
  hand-authored :root/[data-theme=dark] var blocks DELETED (utilities stay).
  Intermediates `src/styles/generated/` are gitignored.
- npm: tokens:build + prebuild/predev hooks + tokens:watch (onchange dep).
- PARITY GATE PASSED: computed-value diff of all 18 tokens (light+dark),
  hand-authored vs generated = ZERO. Clean build passes; dark CRT verified;
  site visually identical. HMR flakes on globals @import edits — clean
  restart (stop→build→start) needed after cutover, expected.
NEXT: A3 Storybook (@storybook/nextjs 8.5, font decorator, data-skin/theme
toolbar, catalog primitives+CaseComponents+Tokens board, Chromatic) — big
greenfield, good Opus-dispatch candidate. Then A4 (spacing/radius/type/motion
tokens + lib/motion.ts), A5 (Figma loop + end-to-end proof), A6 (Medieval
token set). Milestone B (in-site skin swap: store widening + subsystem
refactors) comes after the pipeline is proven. NOT pushed — awaiting Jake's
go to merge/deploy (A0-A2 is visually a no-op so safe to land anytime).

### 2026-07-15 (Fable, session 7 cont. — A3 Storybook, on branch storybook-catalog)
NOT on main yet (branch storybook-catalog, commit 0a432d7; A0-A2 already
merged+deployed to main). Dispatched FOURIER (Opus) for A3, reviewed + fixed.
SHIPPED A3: @storybook/nextjs 8.6 (Webpack5) catalog.
- Catalog: primitives/ (Stamp+tone control, UnderConstruction), case/
  CaseComponents (all 9 presentational components, one story each + full
  anatomy), design-system/Tokens = LIVE board reading getComputedStyle off
  the generated tokens (proof-of-pipeline page).
- .storybook/preview.tsx: 4 next/font faces re-instantiated (+offline
  fallbacks), imports tokens.generated.css + globals.css, Theme toolbar
  (classic-light/dark, medieval, underwater) → decorator sets data-skin/
  data-theme matching the generated selectors EXACTLY.
- Scripts storybook / build-storybook; storybook-static/ gitignored.
- FABLE REVIEW FIX: Tokens board didn't react to the toolbar on the MDX
  docs page (story decorators don't wrap bare MDX). Fixed by rendering it
  through an embedded <Story> (Tokens.stories.tsx + attached-docs
  <Meta of>/<Story of>). Verified: docs+canvas both switch light<->dark;
  build-storybook + tsc green.
- KNOWN DEBT: .storybook/main.ts has a webpackFinal DefinePlugin-dedupe
  hack because @storybook/nextjs 8.6 breaks on Next 15.4+ (repo is on
  15.5.20, NOT the 15.3.3 the plan assumed). Correct fix = Storybook 9 bump
  (supports Next 15.4+/React 19). Filed as a spawned follow-up task.
NEXT (Milestone A cont.): A4 (spacing/radius/type-scale/shadow/motion
tokens + src/lib/motion.ts consolidating 7 spring sites), A5 (Figma loop via
Tokens Studio + GitHub sync — needs Jake's Tokens Studio Pro seat + point
sync at repo; the end-to-end demo), A6 (Medieval token set). Then Milestone
B = in-site skin swap (store widening + subsystem refactors). Storybook
deploy target = Chromatic (needs Jake's account/token) — deferred.
OPEN: merge storybook-catalog → main? (safe; SB is dev-only, doesn't touch
the deployed site). Awaiting Jake.

### 2026-07-15 (Fable, session 8 — plan review + Chromatic finished)
FABLE (Fable 5) reviewed Opus's executed plan: VERDICT SOUND, four findings,
all resolved. A3.5 DONE (commit e2a6d0a on main): Chromatic CI green —
CHROMATIC_PROJECT_TOKEN set as repo secret via gh from .env.local (value
never echoed); workflow fixed (node 20→22 to match local 22.16; added the
A2-planned FRESHNESS GUARD: `npm run tokens:build && git diff --exit-code --
src/styles/tokens.generated.css` fails CI on stale generated CSS — critical
for future Tokens Studio PRs; onlyChanged/TurboSnap to stretch free 5k
snapshots). First run: completed/success; catalog PUBLISHED at
https://6a57efd8ebeed5b15d1ed8a9-hsxdbidcdf.chromatic.com/ (stable per-build
URL pattern; canonical entry = chromatic.com project page). Vercel deploy
unaffected, lunde.co 200. A3.6 DONE: seven byte-identical `* 2.*` macOS
duplicate artifacts deleted (worktree spin-off residue — watch for these
after background worktree tasks). PLAN AMENDED (lively-sauteeing-snowflake):
A5 now includes single-file consolidation (tokens/ multi-file →
tokens/tokens.json set-keyed) for the FREE Tokens Studio plugin tier
(decision: start free, Pro ~€17/mo only if multi-file/theme UI earns it),
with parity re-check after. SB 8→9/10 bump in flight in a SEPARATE worktree
session (task_b46a7142) — do NOT touch .storybook/ on main until it lands;
webpackFinal hack retires with it. NEXT: A4 (spacing/radius/border/
type-scale/shadow/motion tokens + src/lib/motion.ts consolidating the 7
inline spring sites + first consuming CSS slice), then A5 (Figma loop:
consolidate → plugin sync on design-tokens branch → edit→PR→CSS proof),
A6 (Medieval tokens). Then Milestone B.

### 2026-07-16 (Fable, session 9 — A4 + TOKEN BRIDGE merged; Figma loop CLOSED)
Commit 29cf799 on main. THE ROUND-TRIP IS PRODUCTION-PROVEN: while this
session was offline Jake installed the plugin and pushed two PRs from Figma
(#1 changed --blue to #2adbff, #2 reverted); PR #1 merged with stale
generated CSS and the chromatic freshness guard FAILED main exactly as
designed — the guard's first real catch. tokens-sync.yml (now on main)
auto-regenerates artifacts on future token PRs so that failure mode is
closed end-to-end.
SHIPPED: A4 (5 new core token sets spacing/radius/border/type/motion, all
values extracted verbatim; build emits src/lib/motion.generated.ts;
src/lib/motion.ts SPRINGS/DURATIONS consolidates all 7 spring sites; shadow
tokens shadow-print/-lg/lift/sticky/-lift/pin/modal consumed by
shell.module.css, dark overrides absorbed by token flip) + TOKEN BRIDGE
(figma-plugin/: manifest w/ api.github.com-only networkAccess, tokens.ts
pure mapping — FLOAT=px-only after the 50% fix, aliases round-trip as
Figma variable aliases, transparent preserved; github.ts git-data client;
code.ts PULL/PUSH; lo-fi terminal UI; PAT in clientStorage only).
GOTCHAS/RESCUES: (1) GitHub Desktop AUTO-STASHES on branch switch —
FOURIER's final fixes (% corruption, empty-commit guard, tsconfig exclude)
were stranded in stash@{2}; recovered. Stashes @{0}/@{1} are Jake's, left
alone. (2) tokens-sync originally committed only the CSS — patched to also
commit motion.generated.ts. (3) ALL tokens/*.json normalized to the
plugin's 2-space serialization (generated artifacts verified byte-stable)
so Figma pushes never carry formatting noise. (4) figma-plugin/dist/ is
GITIGNORED — after clone/branch switch the Figma dev-plugin entry breaks;
fix = npm run plugin:build, then Figma > Plugins > Development > Import
plugin from manifest > figma-plugin/manifest.json. Jake hit this ("cant
find the plugin").
BRANCH NOTE: local branches blue-update-test + design-tokens are Jake's
test artifacts; design-tokens also exists on origin (the plugin's PR
branch — it accumulates plugin commits by design).
NOTION: Jake is migrating tracking to Notion and shared a TOKEN BRIDGE
notes page — NOT REACHABLE from this session (no Notion MCP tools visible;
page URL is auth-walled). His notes may contain untriaged bug reports.
Next session: check for Notion MCP again, or ask Jake to paste.
NEXT: A6 Medieval token set (the pipeline is fully ready for it — author
semantic/medieval.json + $themes entry, [data-skin='medieval'] emits,
verify in SB toolbar + Chromatic + a Figma pull showing the new mode).
Then Milestone B (store widening + subsystem refactors).

### 2026-07-16 (Fable, session 10 — A7 component loop; commit bcde312 on main)
ROOT CAUSE of Jake's two Notion gripes (page 39fd29ee985480f78889c8ac426cb74c
— Notion MCP works now; both boxes ticked + comment posted):
1. "chromatic fails" — PR #3's `Tokens sync` run FAILED: `fatal: pathspec
   'src/lib/motion.generated.ts' did not match any files`. The design-tokens
   branch was STALE (tree predated A4), so CI checked it out and ran the OLD
   build script which never emits motion.generated.ts → my `git add` of a
   missing path hard-failed → no regen → stale CSS merged → freshness guard
   correctly reddened main. PR #4 passed (branch had caught up).
   FIXED TWO LAYERS: (a) tokens-sync.yml stages only artifacts that EXIST,
   then checks `git diff --cached` (also catches new untracked artifacts);
   (b) plugin resets design-tokens (delete+recreate from base head) whenever
   no PR is open on it — never stacks on an ancient tree again.
2. "diffs unreadable" — formatting noise was the one-time normalization
   (done session 9). NOW the PUSH reports `token.path: old → new` in the
   commit body, PR body on create, and a PR COMMENT on re-push.
ALSO: Chromatic URL confusion — the link Jake had is a FROZEN per-build
permalink; the living catalog is the project's latest build (or
main--<appid>.chromatic.com).
SHIPPED A7: Button primitive (src/components/primitives/Button.tsx +
story; tones system/expressive, sizes sm/md; consumes --radius-btn/
--border-rule/--border-heavy/--text-chrome-*) adopted in gate verdict +
Tattoo Gun; per-program button CSS deleted. NYQUIST token sweep across
shell/case/programs/settings/guestbook CSS (exact-match borders, chrome
type, spacing → tokens). DS-OPS.md written (Jake's work translation:
Enterprise Figma + tokens-in-code + React/Storybook → recommends Variables
REST API sync over a plugin; ports parity gate, freshness guard, regen bot,
single-writer rule, failure table). .claude/launch.json now has both dev
servers (lunde-os :3000, storybook :6006).
GOTCHAS: (1) shell ate backticks in the A7 commit message (two phrases
missing — cosmetic, left alone; QUOTE COMMIT BODIES OR AVOID BACKTICKS).
(2) Classifier + GitHub Actions API both had outages this session; use
`until <cmd>; do sleep N; done` in run_in_background rather than chained
sleeps (harness blocks those).
NEXT — A7.4/A7.5 REMAIN (need Jake): Figma library mirror via the Figma MCP
(skills figma-generate-library + figma-use; needs Jake's file open/URL —
mirror Button bound to the synced `semantic` variables), then THE DEMO:
Jake changes radius/btn in Figma → PUSH → PR (now with readable summary) →
tokens-sync regen → merge → corners change in Storybook + lunde.co.
THEN A6 Medieval (Jake is collecting changes).

### 2026-07-17 (Fable, session 11 — TEXTBOOK token restructure A8; commit 6f338c4)
Jake's DS critique was right: core+semantic were mixed (radius/btn next to
radius/sm) and paper/ink are brand metaphors that break underwater. RESHIPPED
as 3-tier + theme-agnostic roles.
- TIERS: core (primitives + raw scales: color ramp, space, radius none/xs/sm/
  md/lg/full, border widths, size ramp, motion, fonts) -> semantic (color
  ROLES mode-aware + scale intents: radius/control, border/default, text/label)
  -> component (button/radius -> radius/control -> radius/md=8). Full chain
  emits as var() so one edit flows through all tiers.
- RENAMES (563 identifiers, 36 files, whole-identifier codemod): paper->
  surface, paper-2->surface-raised, ink->content, ink-soft->content-muted,
  plate->surface-inverse, plate-ink->content-inverse, line->border, blue->
  accent, pink->accent-expressive, green->accent-support, pink-text/mark->
  accent-expressive-text/mark; radius-btn->button-radius, border-rule/heavy->
  border-default/strong, text-chrome-*->text-micro/caption/label/ui. Spacing
  kept NUMERIC (Jake's call). Button radius snapped 7->8 (base-8).
- PARITY: computed values of all roles identical to old names, light+dark;
  only button radius changed (intended). Build+tsc+Chromatic green, site
  visually identical.
- BUILD GOTCHA (saved to memory): SD v4 outputReferencesFilter CRASHES on
  multi-hop ref chains (component->semantic->core) with
  "Cannot read properties of undefined (reading 'join')" in
  outputReferencesFilter.js. Replaced with a null-safe custom predicate in
  build-tokens.mjs (emit var() only when every ref target's filePath is an
  `enabled` set this theme). Also: spacing set file is core/spacing.json but
  group is "space" -> $themes/$metadata must say "core/spacing".
- Storybook scroll bug FIXED: globals.css body{overflow:hidden} (OS owns
  viewport) leaked into Storybook via the globals import; re-enabled
  html/body scroll in .storybook/preview.tsx (Storybook-only).
- FABLE Notion bot: NOTION_FABLE_TOKEN in .env.local, integration auth's as
  bot "FABLE" (users/me confirmed). Posts comments as itself via Notion REST
  (distinct from the OAuth connector which acts as Jake). BUT pages must be
  shared with the FABLE integration first (Notion: page/db ... > Connections
  > add FABLE). Jake to grant at the Portfolio DB level.
- FIGMA MIRROR (prior turn, still valid): Button component set on page 77:432
  bound to synced variables; all 77 vars got scopes + WEB codeSyntax
  (var(--x)). font/* left unbound (CSS stacks, not Figma families).
CRITICAL NEXT — DO NOT PULL WITH THE PLUGIN YET: the token rename means a
PULL would create new-named vars (surface/content/...) as NEW variables,
ORPHAN the old (paper/ink...), and mishandle the new component/button set
(plugin only knows core/semantic collection prefixes). NEXT CHUNK: (a) update
figma-plugin PULL/PUSH to handle the component tier (3rd collection) + the
renamed semantic; (b) re-tier Figma (rename semantic vars, add component
collection, rebind the Button); (c) THEN Jake can pull. After that: A6
Medieval (author semantic/medieval.json color roles only — scale/component
stay :root; the whole point of role names).
OPEN WORK QUESTIONS Jake raised (his job, few designers/many eng): (1) eng
makes a component in Storybook, disconnected from Figma -> answer: generate/
refresh the Figma mirror from the story on demand (deliberate publish, not
live sync) + Code Connect to link+detect drift; structure is code-
authoritative. (2) eng hardcodes/uses wrong token -> answer: CODE-side
governance, NOT Figma round-trip: stylelint rule banning raw hex/px in
component CSS + a token-allowlist lint (var must exist in generated set) +
Chromatic. A hardcoded-value->token linter is 'the nut' and it's crackable
in code. Offer to codify into DS-OPS.md.

### 2026-07-17 (Fable, session 12 — plugin 3-tier fix + DS-OPS + FABLE live)
- PLUGIN BUG FIXED (commit f803599): Jake pulled into a cleared file ->
  'invalid variable name'. Cause: the 3-tier restructure added NESTED
  semantic tokens (radius.control, text.label); the plugin used the raw
  DOTTED path as the Figma variable name and Figma rejects '.' -> crash on
  first semantic var -> pass-2 never runs -> core shows white. Fixes in
  figma-plugin/src/{tokens,code}.ts: (a) figmaVarName(path) slashes dots for
  the Figma NAME, internal keys/refs stay dotted, applied at every create/
  lookup incl. PUSH + refBodyForVariable (slash->dot reverse) + unknown-var
  report; (b) resolveRef now checks semanticNames FIRST (dotted semantic is
  valid now, was assumed core); (c) COMPONENT tier added — component/* sets
  were silently dropped; now their own single-mode 'component' collection,
  pass1 create + pass2 alias-assign into semantic. Dry-run vs token files:
  31 semantic + 4 component, zero dots in Figma names, zero unresolved
  aliases. tsc+plugin:build green. JAKE ACTION: re-import plugin (new dist,
  gitignored -> run npm run plugin:build first), DELETE the half-populated
  core/semantic vars, then PULL -> core(59)+semantic(31)+component(4).
- DS-OPS.md §3.5 added (Jake's ask): few-designers/many-eng scenarios.
  A (component in SB not in Figma) -> on-demand mirror publish + Code Connect
  coverage check as drift detector, NOT live structural sync. B (hardcode/
  wrong token) -> CODE governance: stylelint disallowed-list + token
  allowlist rule + value->token linter + Chromatic; Figma is never the
  enforcement layer, CI is. Includes sample stylelint config.
- FABLE Notion bot NOW WORKING as a distinct identity: Jake shared the
  TOKEN BRIDGE page (39fd29ee985480f78889c8ac426cb74c) with the FABLE
  integration; posting via Notion REST (NOTION_FABLE_TOKEN) with a
  json.dumps body (shell -d mangles JSON — use python/urllib or --data @file).
  Left a FABLE comment there re: the plugin fix. To comment on OTHER pages,
  each must be shared with the FABLE integration (or share the parent DB).
- Storybook scroll fix shipped earlier this arc (preview.tsx re-enables
  html/body scroll; globals body{overflow:hidden} had leaked in).
NEXT: after Jake's clean PULL, re-tier the Figma Button (it was bound to old
paper/ink vars pre-rename; rebind to surface/content + button/radius from the
component collection) — or just regenerate the mirror. THEN A6 Medieval:
author semantic/medieval.json COLOR ROLES only (scale/component stay :root)
+ a 'medieval' entry in $themes; the plugin will create a medieval MODE on
the semantic collection on next pull.

### 2026-07-17 (session 13 — SECOND plugin bug, deeper than session 12's)
Jake reran PULL after the session-12 fix (rebuilt+reimported per instructions).
No crash this time, but 7 "No value for semantic X in theme Y — left unset"
warnings for accent-support/focus/shadow-lift/shadow-sticky/shadow-sticky-lift/
shadow-pin/shadow-modal, in BOTH classic-light AND classic-dark — even though
classic-light.json clearly defines all 7.
- ROOT CAUSE (figma-plugin/src/tokens.ts `enabledSemanticSet`): $themes.json's
  classic-light entry enables TWO semantic sets — `semantic/scale` (mode-
  invariant intent aliases: radius.control, text.label, …) AND
  `semantic/classic-light` (its own color roles) — because A8 introduced the
  scale.json intent layer. `enabledSemanticSet` (singular) assumed exactly one
  enabled semantic set per theme and returned on the FIRST match via
  `Object.entries` order — which is `semantic/scale` (it's listed first in the
  JSON), so it never even looked at `semantic/classic-light` for direct
  lookups.
- Two symptoms, one worse than the other:
  1. Visible: the 7 tokens ONLY defined in classic-light.json (not in scale.json
     or classic-dark.json) had nowhere to resolve from → the printed warnings.
  2. SILENT and worse: classic-light's OWN color roles (surface, content,
     accent, border, accent-expressive*) were resolving via the function's
     fallback-to-other-themes path — landing on classic-DARK's definitions —
     with no warning printed at all, because `semanticToken`'s direct lookup
     only checked `semantic/scale` (found nothing) before falling back. So the
     PULL Jake just ran likely populated classic-light's Figma mode with
     classic-dark's actual color values for most roles.
- FIX (figma-plugin/src/tokens.ts + code.ts, uncommitted as of this writing —
  see below): renamed to `enabledSemanticSets` (plural), returns ALL enabled
  semantic/* sets for a theme in $themes.json order; `semanticToken` now
  searches every one of the theme's OWN sets before falling back to other
  themes; PUSH's set→theme lookup in code.ts (`enabledSemanticSets(th)
  .includes(set)`) updated to match. Hand-traced against the live
  `$themes.json` + all three semantic/*.json files for every one of the 31
  semantic names — confirms both bugs are fixed (classic-light now resolves
  its own values directly; the 7 shadow/focus/accent-support tokens resolve
  in classic-light directly and classic-dark inherits them via fallback, per
  the documented fallback contract).
- The tooling outage (Bash safety-classifier refusing state-changing commands
  for a stretch this session; read-only commands were unaffected throughout)
  cleared on its own — no code/config change needed. `tsc --noEmit -p
  figma-plugin` clean, `npm run plugin:build` clean, committed as **f02680a**
  and **pushed to main**.
- JAKE ACTION (still required, same as session 12's shape): re-import the
  plugin (new dist, gitignored → pull the repo, then it's already built — no
  need to rebuild unless you edit figma-plugin/src again), **DELETE the
  current semantic Figma variables** (light mode is currently showing
  classic-DARK's colors per the silent bug above — don't trust what's there),
  then PULL again. Confirm: zero "no value" warnings, and classic-light's
  `accent`/`surface`/`content` variables show LIGHT values (cobalt blue
  #2036c8 / paper cream #e7e1d2), not dark's.

### 2026-07-18 (session 14 — /mirror-to-figma skill + DS-OPS tier 3)
Jake asked how component mirroring gets automated ("plugin? agent? or just
command you?"). Answer given + codified: the ONLY write path to the Figma
canvas is the Plugin API (REST can't create nodes — it reads structure and,
on Enterprise, r/w variables); the hard part is the semantic TRANSLATION
(props→variant axes, CSS→bindings), which is why an agent stays in the loop
at every tier. No off-the-shelf tool does it (Code Connect only LINKS;
Figma's Storybook plugin embeds a preview; html.to.design gives flat unbound
layers).
- NEW SKILL `.claude/skills/mirror-to-figma/SKILL.md` (first skill in this
  repo — `.claude/skills/` created). Encodes: the one-way-structure law;
  Step 0 pre-flight TOKENIZATION AUDIT (you cannot mirror to parity what
  isn't tokenized — stop and report rather than fake a binding); Step 1 the
  props→Figma-property mapping table Jake explicitly asked for (enum→VARIANT,
  style-changing bool→VARIANT, layer-toggle bool→BOOLEAN, text→TEXT,
  slot→INSTANCE_SWAP, handlers/aria/rest→never); EXACT case-sensitive name
  matching (prop `size` → property `size`, values `sm`/`md`) so Code Connect
  mapping stays trivial and drift is mechanically detectable; defaults come
  from the TSX destructuring NOT story args (they differ on Button!);
  pseudo-states are not props; cartesian-product combinatorics budget
  (~20-30 frames); atoms-first bottom-up build w/ instances not copies;
  binding table; parity verified by computed-value comparison NOT eyeballing.
- WORKED EXAMPLE in the skill = Button, chosen because it teaches judgment:
  naive mapping gives tone×size = 4 frames, but `.btnSystem`/`.btnExpressive`
  define ONLY `:hover` rules — at rest `tone` is visually identical, so a
  tone axis would produce two IDENTICAL frames. Correct mirror: `size` is the
  only real variant axis. "Mirror what the CSS actually does, not what the
  prop signature implies."
- DS-OPS.md §3.6 added (brief, per Jake): the three tiers — T1 on-demand,
  T2 codified command (**the sweet spot**; the friction was never WHO
  triggers it but re-specifying the procedure), T3 CI-triggered headless
  agent off a Code Connect coverage-check failure. THE T3 GUARDRAIL: the
  agent DRAFTS to a staging page, a human ACCEPTS — never auto-write into
  the published library, that's how designers' files get clobbered.
- PRE-FLIGHT AUDIT FINDINGS on Button (spawned as task_c35c5b5d, NOT fixed
  here): `.btnMd` padding hardcoded `7px 18px` (and the component token
  `button/padding-x` exists but NOTHING consumes it — .btnSm uses --space-3
  directly); `font-weight: 700` + `letter-spacing` hardcoded (no typography
  weight/tracking tokens exist at all); `.btnExpressive:hover` has raw hex
  `#17150d` (a live DS-OPS §3.5 Scenario B violation); Button.stories.tsx
  comment still says `--text-chrome-*` (stale post-A8-rename).
NEXT: A7.4 the actual Figma Button mirror is now UNBLOCKED procedurally but
should wait on task_c35c5b5d, else the mirror bakes in unbound drift. Jake
also asked about typography tokens — gap confirmed real (sizes exist via
core/size + semantic/scale text.*; weight/tracking/leading-scale/type-ROLE
composites do NOT). Figma caveat to remember: font-size + line-height bind
fine (FLOAT), font-family/weight do NOT (Figma binds installed fonts, not
CSS stacks like `var(--font-mono), 'SF Mono'`) — so those stay
code-authoritative.

### 2026-07-18 (session 15 — A8 BORDER REGRESSION FOUND + Button tokenized)
Started as "do the Button cleanup then mirror to Figma." The /mirror-to-figma
Step 0 pre-flight audit immediately paid for itself by surfacing a LIVE
VISUAL REGRESSION that had been shipped to lunde.co.
- **THE REGRESSION (fixed, f14d3da).** A8 (6f338c4) named the semantic color
  role `border` while border-WIDTH primitives already lived under a `border.*`
  group (core hairline/thin/thick; semantic/scale default/strong). In the
  merged Style Dictionary tree `border` cannot be both a leaf and a group —
  the color leaf won and EVERY width token silently vanished from the output.
  48 declarations across shell/case/programs/guestbook/primitives consumed
  `--border-hairline|default|strong`, which were never emitted; an undefined
  var() invalidates the whole `border` shorthand, so those borders resolved
  to NONE. Menubar rule, sticky-note frames, window borders, polaroid frame
  were all absent on the live site. Verified in-browser: menubar
  border-bottom `0px none` -> `1.5px solid` after the fix.
  Also leaked `--button-border: {border.default};` (a literal unresolved ref)
  into shipped CSS.
  FIX: widths got their own namespace — core group `border` -> `border-width`,
  semantic `border.default/strong` -> `border-width.default/strong`, 48
  consumers renamed `--border-*` -> `--border-width-*` (verified 48->48, zero
  old names left). Color role keeps the clean name `border`.
  WHY THE A8 PARITY GATE MISSED IT: it diffed computed values for COLOR
  tokens and never asserted that every consumed var actually RESOLVES. The
  DS-OPS §3.5.2 token-allowlist lint would have caught this at CI — that is
  now clearly worth BUILDING here, not just recommending at work. Strong
  candidate for the next work item.
  NOTE: Figma tolerated what SD could not — the semantic collection happily
  held both `border [COLOR]` and `border/default [FLOAT]`, since Figma names
  are strings with `/` as mere display grouping. So Figma will NOT warn you
  about this class of collision. Only the build does.
- **BUTTON TOKENIZED (9fb3742).** New core scales, values extracted verbatim
  from real usage: core/weight.json (regular 400/semibold 600/bold 700/black
  800) and core/tracking.json keyed by hundredths of an em (02/06/08/10/12/
  14/16/18/20 — numeric, NOT semanticized, same call as spacing; deliberately
  omits the 0.04/0.05/0.13 noise values so a later sweep collapses rather
  than enshrines them). New semantic role `on-accent-expressive` ->
  {color.ink.base} replaces the raw #17150d in .btnExpressive:hover (a live
  §3.5 Scenario B violation); theme-invariant so it is defined once in
  classic-light and dark inherits via the :root cascade.
  component/button.json restructured to match what the CSS ACTUALLY does —
  the old flat shape (radius/border/label/padding-x) described a button that
  does not exist (sm and md differ in font-size, border-width, tracking AND
  padding) and border/label/padding-x were consumed by NOTHING. Now
  button.radius + button.weight (variant-invariant) and
  button.{sm,md}.{font-size,border,tracking,padding-x,padding-y}.
  The 3 off-grid paddings (sm-y 6px, md-x 18px, md-y 7px) are carried as
  component-tier LITERALS with $description flags — spacing is base-4 and
  none land on it. Verbatim ON PURPOSE (zero-visual-change migration).
  **OPEN DECISION FOR JAKE: snap them to the grid?** He has said "7 is wacky"
  and prefers base-8; the snap is a deliberate visual change and belongs in
  its own PR. Not done unilaterally.
  PARITY GATE (computed styles on the real hashed CSS classes, dev server):
  sm 700/9px/1.08px/6px 12px/1.5px/r8 and md 700/10px/1.4px/7px 18px/2px/r8
  — identical to pre-change. 13/13 token resolutions exact. build passes.
- **FIGMA MIRROR BLOCKED ON A JAKE-ONLY STEP.** Inspected his file
  (LQbDBqtpVxCb7QcDgEFQlN): target is section 201012:2 named "components"
  (5868x4525, empty) on a page alongside "inspo" and "🧬 design system".
  His variables are from the LAST pull, i.e. PRE-today: core still has
  border/hairline|thin|thick, semantic still has border/default|strong, and
  component has only the 4 OLD flat vars (button/border|label|padding-x|
  radius). Missing entirely: weight/*, tracking/*, on-accent-expressive,
  border-width/*, and the new button/{sm,md}/* tier.
  Deliberately did NOT hand-create them — TOKEN BRIDGE is the single writer
  for token variables (DS-OPS §1.8); hand-creating would make me a second
  writer and defeat the architecture. JAKE MUST PULL FIRST.
  That PULL doubles as the live test of BOTH fixes shipped this week: the
  multi-set semantic resolution fix (f02680a) and the component tier with
  NESTED names, which exercises figmaVarName slashing `button.sm.padding-x`
  -> `button/sm/padding-x`.
  AFTER PULL: the renames leave ORPHANS behind (old border/thin|thick|
  hairline, border/default|strong, button/border|label|padding-x) — the
  plugin's reportUnknownVars should list them; delete them.
  THEN the mirror is unblocked: per /mirror-to-figma the honest Button is
  ONE variant axis (size sm|md), NOT tone x size — .btnSystem/.btnExpressive
  define only :hover rules so a tone axis emits two identical frames.

### 2026-07-18 (session 15b — FIGMA BUTTON MIRROR SHIPPED, A7.4 done)
Jake pulled + deleted orphans; verified clean (component collection = exactly
the 12 expected vars, semantic has on-accent-expressive + border-width/*, core
has weight/* + tracking/*, zero orphans). Then built the mirror per the new
/mirror-to-figma skill.
- **BUILT:** component set `Button` (node 201017:7) on page "🧬 design system"
  inside section 201012:2 "components". Variants `size=sm` (default, matches
  the TSX default) and `size=md`. TEXT property named `children` — the React
  prop name EXACTLY, per the skill's naming rule, so Code Connect mapping
  stays trivial.
- **ONE variant axis, not two** — the skill's worked example proved out in
  practice: `tone` is hover-only (.btnSystem/.btnExpressive define only :hover),
  so a tone axis would have emitted two identical frames. tone is documented
  in the component description instead, along with the hover token pairs.
- **PARITY GATE PASSED, allMatch:true on BOTH variants.** Every binding
  resolves through the full 3-tier chain to exactly the computed CSS value:
    button/radius -> radius/control -> radius/md = 8
    button/sm/padding-x -> spacing/space/3 = 12 ; sm/padding-y = 6
    button/sm/border -> border-width/default -> border/border-width/thin = 1.5
    button/sm/font-size -> text/caption -> size/caption = 9
    (md: 18 / 7 / border-width/strong->thick = 2 / text/label->size/label = 10)
    fill surface->color/paper/base #e7e1d2 ; stroke+text content->ink/base
- **UNBOUND (expected, documented in the component description):**
  letter-spacing (token is a STRING em value; set static 12%/14%) and
  font-weight/family (Figma binds INSTALLED fonts, not CSS stacks; set Geist
  Mono Bold). These stay code-authoritative — exactly the non-binding cases
  the skill predicted.
- **TWO PLUGIN-API GOTCHAS worth remembering** (both cost a retry):
  1. `combineAsVariants` throws "Grouped nodes must be in the same page as the
     parent" — newly created components land on the DEFAULT first page, so
     `page.appendChild(node)` them onto the target page BEFORE combining.
  2. Verifying bindings: `setBoundVariable('strokeWeight', v)` EXPANDS into
     `strokeTopWeight/Bottom/Left/Right`, and text `fontSize` binds as an
     ARRAY `[{VARIABLE_ALIAS}]` (per-segment). Reading `boundVariables
     .strokeWeight` / `.fontSize.id` returns undefined and makes a correct
     build look broken. Read the per-side fields and array[0].
- COSMETIC NIT (not fixed): core emits `border/border-width/thin` — doubled
  prefix, because coreVarName prefixes with the SET's last segment ("border"
  from core/border.json) and the group is now "border-width". Renaming the
  file tokens/core/border.json -> border-width.json would yield a clean
  `border-width/thin`. Harmless; would require a re-pull + orphan delete.
NEXT: (a) Jake's call on snapping the 3 off-grid button paddings (6/18/7) to
the base-8 grid — its own PR, deliberate visual change. (b) The DS-OPS §3.5.2
token-allowlist CI lint is now clearly worth BUILDING here — it would have
caught the border regression. (c) A6 Medieval remains the next big phase.

### 2026-07-18 (Fable, session 16 — MEDIEVAL SHIPPED, commit 6eede3e)
THE SECOND SKIN IS LIVE on lunde.co. Settings → Skin → Medieval (or
localStorage lunde-skin). Task source was Jake's NOTION board (Medieval
Theme project — now the task tracker of record; Notion MCP connector is
available; board statuses updated to Done with summaries). Jake's comment
granted creative latitude; his TYPE PICKS overrode mine: MedievalSharp
display / Eagle Lake body / Jacquard 12 mono (pixel blackletter), loaded in
layout.tsx + preview.tsx as --font-medieval-*; the medieval token set
points --display/--sans/--mono at them.
SHIPPED: semantic/medieval.json (parchment #e9dfc5 / gall #241a10 /
vermilion #9e2b1e accent / gilt #b8860b expressive-marks-only (2.45:1 —
routed through accent-expressive-text→content, same discipline as pink) /
lapis #2f4c7e support; brown shadow suite) + core primitives; scribe stamp
public/mark-medieval.png (binarized alpha, 27KB, per-skin mask swap in
programs.module.css); illuminated INCIPIT drop cap on README (hits the
eyebrow p — kept deliberately, reads as rubricated incipit); quill cursor
(globals.css, nib hotspot 2,22); NYQUIST-1: data-skin wiring (store skin +
pre-paint + MenuBar toggle classic-only + Settings picker w/ live token
tiles + underwater SOON), avatars per-skin (crew.ts avatarFor(agent,skin);
medieval cast: fable=el-16 radiant eye, hertz=el-15, nyquist=el-37,
fourier=el-52 orbit sun, doppler=el-32 twin crescents; CommandCenter dup
map DELETED), gateConfig.ts (classic HOWDY byte-identical; medieval QUILL
'THE SCRIPTORIUM IS SEALED', letters rebuild on skin change), diaper
wallpaper tile; NYQUIST-2: puzzlesFor(skin) w/ 4 PLATE I-IV cover-fit
plates (public/puzzle/medieval/), filtersFor(skin) w/ ILLUMINATED
(5-color posterize + edge ink) + WOODBLOCK (contrast-stretch threshold +
midtone hatch) both time-static, voicesFor/playersFor(skin) w/ CLAV
(detuned squares+LP sweep) FLUTE (sine+vibrato+breath) BELL (FM, index
ramp scaled f*4) MONK (saw through 500/800Hz formants), reshapeGrid guards
saved slots across kit sizes; window ornament ([data-skin] 2px frame, 3px
double titlebar rule, ::before/::after vermilion corner Ls).
GOTCHAS: (1) GitHub combined commit status stays 'pending' while Chromatic
runs — Vercel can be READY; verify via Vercel MCP (team
team_mBCpEYQWNE8tOhUxd1Zcjz9b, prj_vG3DsqZlQAugYnFY6uDIV7vJjsgj) + a
content marker curl, expect ~1min CDN lag. (2) Notion page share ≠ database
share (board needed the connector). (3) Jacquard 12 at ≤10px mono sizes is
borderline legible — Jake should eyeball; remedy = medieval text-scale
overrides via semantic/scale or a less ornate mono fallback for micro
sizes.
NEXT (scoped on Notion): dataviz hand-drawn pass (feTurbulence+
feDisplacementMap roughen filter on viz SVGs under [data-skin='medieval']
— approach noted on the task page, inspo node 201018-6); language as a
per-skin string-table modifier (answered YES on the task page); Storybook
toolbar could add the medieval skin option if not already (preview.tsx has
it from A3 — verify labels); Chromatic will baseline the medieval
snapshots on next run.

### Newly added by Jake in the doc (2026-07-08 diff — not yet scoped)
- **Gallery Wall** — "record of what people are doing on the site." Pairs with
  "more logging when users use my site." A privacy-respecting activity feed
  (window opens, viz interactions, guestbook signs) rendered as a live wall.
  Needs a logging endpoint + store decision (Blob append? KV?). Ask Jake how
  public/identifying he wants it.
- **Synth Program: 16 bars** — a step sequencer ("save tunes for others to
  listen to"). WebAudio (reuse studioPlayer patterns); persistence = Blob.
  A real project; scope with Jake.
- ~~**Photo Booth: pin last photo(s) to the desktop**~~ ✅ SHIPPED 2026-07-08
  (Opus) — last 3 snaps, **localStorage per-visitor** (no server, no
  moderation exposure). A *shared/public* wall would still need Blob + a
  moderation decision from Jake; not built.
- **Jigsaw: leaderboard timer + completion celebration** — time-to-solve,
  localStorage best; confetti/stamp burst on solve. Celebration is quick and
  unblocked; leaderboard-across-users needs a store.

### Ambient roaming agents (Jake asked for ideas, 2026-07-10 — not built)
The crew shouldn't live only in COMMAND.CTR. Sketches, cheapest first:
1. **Wandering avatar**: one agent shape at a time strolls the desktop edge
   (like Lou in the saver but tiny, 20px, during active use) — pauses near
   the window you have focused, "inspects" it, moves on. Pure CSS/motion.
2. **Dispatch flashes**: when a visitor opens a program, the matching agent
   briefly appears next to the window titlebar ("NYQUIST · MOUNTING") then
   fades. Ties agents to real UI events without a backend.
3. **Menu-bar presence**: a rotating tiny avatar in the menu bar showing
   "on duty" agent; clicking it opens COMMAND.CTR.
4. **Boot cameo**: agents' shapes flick past during the boot sequence.
5. **Live-mode spillover**: when the cc-feed is LIVE, the dispatched agent's
   avatar physically walks from the Command Center window to the desktop
   edge and back on each dispatch/return. The showpiece; needs #1's walker.
Recommend building #1 + #2 first (no backend, high charm), #5 when live
sessions become routine.

### Photo-wall moderation (Jake wants a shared public wall — design agreed)
Current: per-visitor localStorage + Jake's default pin. To go shared-public:
1. Booth "PIN TO WALL" → POST to /api/wall (new) → Blob `wall/pending/<ts>.jpg`
   (compressed ≤120KB, honeypot + rate-limit like guestbook).
2. NOTHING shows publicly from pending. Jake reviews at `/wall-review` — a
   page gated by CC_FEED_KEY-style secret (`?key=`) listing pending images
   with APPROVE (move to `wall/live/`) / REJECT (delete) buttons.
3. PhotoWall renders `wall/live/` (last 3) + visitor's own local pins
   (instant gratification while awaiting review — pins feel immediate to the
   pinner, appear to everyone only post-approval).
4. Vercel Blob TTL cleanup: pending older than 14 days gets purged by the
   review page on load. Estimated build: one session. Storage cost: pennies.

### From-Claude ideas Jake adopted into his doc (still open)
23. **Trash contents** — the killed-ideas archive ("Grows with You" et al.
    as redacted memos). The lock is already on the desktop; this fills it.
    Source material: portfolio-tracker.md tradeoffs row.
24. **Print stylesheet** — Invest case prints as a 1992 government report.
25. **Degauss/Konami** — screen wobble + a trading card drops (pairs with #17).

### Deferred (don't start without Jake)
- Density slider (he must write the 3 Invest tiers first; view-state, not route).
- Accent emphasis setting.

## 6. How to work with Jake (two days of observation, still accurate)

- Deploy early, screenshot in chat; he reacts to seeing things.
- His doc edits are silent — diff it at session start; checkboxes are his,
  leave them to him.
- Batch your asks into single bolded steps; he clears them fast.
- When he says "keep going," pick the highest-leverage unblocked item.
- He'll ask for honesty (see About This Machine) — give it, kindly.
- The site's soul is personal artifacts made monumental. New features should
  pass the test: does this contain something only Jake's life could supply?

## 7. Session-start checklist

1. `git pull` · `git status` (check nothing sensitive is staged).
2. Read CLAUDE.md → this file → diff the ideas doc.
3. `curl -sL https://lunde.co/api/now-playing` (Apple alive?) · check `ref/`
   for new drops · check the Blob dashboard-ish via /api/guestbook.
4. preview_stop → build → preview_start. Verify before push.
5. Update §1/§5 here when you ship. Add case-study beats to local
   session-log.md when something story-worthy happens — Jake is collecting
   them for the meta case study.

## Latest session — COMMAND.CTR: the human on top (session 26, 2026-07-26)

**Opus (SHANNON) orchestrating. Round 1 solo — one entangled feature across the
deck, the chip, the sprites, the reporter AND the API, every seam a shared type.
Round 2 dispatched two: NYQUIST on the avatar strokes, DOPPLER on the WHAT IS
THIS chrome pattern (disjoint files: shell chrome + registry + copy.json vs. the
deck). Zero conflicts. SHIPPED as `8ce7cdc`, verified live on lunde.co: the new
`/cc/avatars/jake.svg` serves 200, and `/api/cc-feed` now returns ZERO
`--agent`/`--task` rows — the read-filter healed the stored junk with no
`--reset`, exactly as designed.**

- **⚠️ `cc-report.mjs` keeps its OWN roster** (a node script can't import the TS
  crew module) and it was stale the moment SHANNON existed — the merge report
  bounced off my own guard. Add a call sign in BOTH `crew.ts` and that array.

- **The deck is a PYRAMID now, and the shape is the argument.** JAKE (portrait
  plate, `HUMAN · DESIGN ENGINEER`) centred on top with his prompts on a rail
  directly beneath him → FABLE (FABLE-5, orchestration) + **SHANNON (OPUS-5,
  execution — new call sign, same signal-theory family)** → the four
  delegates. Edges are
  labelled (`↓ BRIEF`, `RETURNS ↑ JAKE CURATES`, `↓ DISPATCH · ONE WHOLE TASK
  EACH`) so the loop reads without a caption. Delegate models corrected to
  OPUS-5.
- **Jake's own portrait is the avatar** (`ref/stamp/jake-vector.svg` → copied to
  `public/cc/avatars/jake.svg`, since `ref/` is never committed). Drawn as a
  full-colour `<img>`, never a CSS mask: the crew are one-ink silhouettes, the
  human is the only picture of a person. A medieval engraving of the same
  portrait sits in `ref/stamp/medieval/` for a per-skin variant later.
- **Prompt fragments are precise DIRECTION, per Jake** ("TWO ACCENTS PER SKIN.
  NEVER A THIRD.", "DECIMATE THE PHOTOSCAN UNDER 2K FACES") — never "make it
  cool". The deck must show him steering, not delegating the taste.
- **Two new event actions: `prompt` and `curate`** (agent `jake`) — his asks
  and his picks are first-class telemetry, quoted in the feed with ✎/✓. Prompt
  fragments live on their OWN rail, not read off the feed: the ticker holds 7
  rows and the human speaks rarely, so he'd scroll away in seconds.
- **`crew.ts` is now the single source of crew identity** (id/name/model/role/
  blurb + `isCrewId`); `cc-timeline.json` is just `recorded` + `sequence`. At
  rest a unit's status line says what it IS, not "STANDING BY" — the explainer
  lives where a visitor actually looks.
- **The `--AGENT · --task` bug was the REPORTER, not the deck.** A session
  called `cc-report.mjs` with flags against a positional parser, so `--agent`
  became the call sign. It now takes both forms and **refuses unknown call
  signs**; the API validates ids on write AND filters them on read, so the
  junk already in the blob heals on the next GET — no `--reset` needed.
- **The chip is one row, one target:** state · cast (JL + 5 faces, the one
  named by the leading edge lit) · leading edge inline · ENTER COMMAND CENTER.
  The expanding feed is gone. Its max-width is derived, not guessed:
  `calc(100% - 620px)` keeps 310px of clearance from the icon grid.
- **First contact on the desktop:** the first time your cursor finds a
  wandering unit it does NOT bolt — it turns and says who it is, its model and
  its last real task (live feed, else a recorded fallback). Once per unit,
  remembered in `lunde-crew-met`. The hold uses a REF (`holdUntil`), because
  the walk loop restarts on every state-dep change and a local would reset.
- **Round 2 (Jake, live over Notion comments):** the pyramid's middle tier is
  TWO units (FABLE + SHANNON) because Opus-5 runs most sessions; his prompt
  fragments must read as **precise direction**, never "make it cool"; his own
  portrait replaces the monogram, in colour, with no stroke around it.
- **`WHAT IS THIS` is a new SHELL pattern, not a deck feature** (DOPPLER's
  dispatch): `ProgramDef.explainer` holds a copy key, and the titlebar's meta
  slot (`CTR-11`) becomes a tooltip-pattern button — hover AND focus, Esc/blur
  dismissal sequenced BEFORE the window's own Esc-to-close. Any program opts in
  with one registry line. The deck's inline thesis band is gone; its text lives
  at `command.explainer`.
- **The transmission log is collapsed by default** and the window is sized to
  that state (800×592). Opening it scrolls the body ~78px — a disclosure the
  visitor asked for, not a layout failure.
- **The prompt rail: `AnimatePresence mode="popLayout"` + a reserved 66px +
  `overflow: hidden`.** Without popLayout the arriving chip stacked on the
  leaving one and the box grew for a beat; with it, the leaving chip leaves the
  flow (and needs clipping so it doesn't spill onto the tier below).
- **New motion token `human`** (150/22/mass 1.1, `tokens/core/motion.json`):
  Jake's inputs move analog — slower, heavier, allowed to overshoot — while the
  machines keep `deck`'s digital snap. Springs still come only from tokens.
- **Edge labels ride the tier grid** so BRIEF sits over FABLE and RETURNS over
  SHANNON, with the rule running through each label and stopping at it. The
  labels paint `var(--surface-inverse)` — the same token the CRT body uses — so
  the routing lines die at the type; `.edge` needs `z-index: 1` because the
  lines are absolutely positioned in the tier BELOW it.
- **`height: 100%`, not just `min-height`, on `.ctr`** — a flex column can only
  shrink a child when its own height is definite; the feed is the one elastic
  band and absorbs what the pyramid doesn't need. Window is 800×720.

## Incident — Blob quota burn on /api/cc-feed (session 26, 2026-07-26)

**Jake's Vercel Blob usage went 75% → 100% in two hours. `/api/cc-feed` took
264 GETs in four hours, and EVERY GET called Blob `list()` — a billed
operation. Three compounding causes, only one of which was new:**

1. **No cache anywhere.** `readFeed()` hit `list()` on every single request.
2. **No visibility gating.** The desktop chip polls for as long as a tab is
   open — a background tab left overnight billed all night for zero eyeballs.
   Intervals were 20s (deck) and 45s (chip).
3. **My own traffic.** Verification browsing on lunde.co plus background
   `until curl` loops I left running while waiting on deploys — those polled
   the endpoint every 10–20s for minutes at a time. A real share of the 264
   was me, not passive visitors. **Kill polling loops when the wait ends.**

**Fixed and deployed:** module-scope cache in the route (one `list()` per 20s
per warm instance, cleared on write); clients skip polling entirely while
`document.visibilityState !== 'visible'` and refresh on `visibilitychange`;
intervals 20s→60s and 45s→120s; and the per-page-load feed read that
AmbientAgents used for sprite intros is gone (recorded fallbacks instead).

⚠️ **Already-open tabs keep the OLD intervals until reloaded.**

**CONFIRMED by the usage dashboard (2026-07-27):** the metric is **Blob
Advanced Operations**, not bytes. **List = 2,370 of 2,485 ops (95.4%)**, Put =
115; 99.5% on the `guestbook` store, which is the one `/api/cc-feed` shares.
Jul 26 (~430) and Jul 27 (~860) are the two largest bars in thirty days — the
days this feature was built. Jul 11 (~630) is the same bug at a lower rate.
Cap appears to be 2,500/month.

**THE REAL FIX, not yet done — start the next session here.** Everything
shipped so far only rate-limits a call that should not exist. `list()` is in
the read path solely to find the newest VERSIONED blob, and versioning exists
solely because a single overwritten path served stale CDN reads. Blob lets the
writer set the object's own cache lifetime:

```
put(path, data, { cacheControlMaxAge: 30, ... })
```

That kills staleness at the source → a FIXED path becomes safe → the read is a
plain `fetch` of a known URL → **`list()` leaves the read path entirely**, and
`put`'s prune-by-list goes with it. ~95% of the account's Blob usage goes to
roughly zero. Sequence it: prove `cacheControlMaxAge` actually holds on a
throwaway path FIRST (one put + one del), then migrate `readFeed`, then delete
the versioning + pruning. Same trap applies as everywhere else in this
incident — **verify on production, never on localhost.**

~~Unresolved: which metric actually hit 100%.~~ Reads cannot consume
storage BYTES — the feed blob is a few KB and prunes to 3 versions — so if
the dashboard's 100% is bytes, the cause is elsewhere (`/api/wall` stores
booth photos; guestbook and puzzle-times share the store). `vercel blob list`
answers it. If it is operations, it resets monthly and the fixes above cut
the ongoing rate.

⚠️ **Do not try again to CDN-cache this route** without new information — see
the comment in `next.config.mjs`. Handler `Cache-Control`, segment
`revalidate`, and a next.config `headers()` entry were all tried; all three
are overwritten by `max-age=0, must-revalidate` on the deployed function
because the route reads its blob with `no-store`. The next.config one applies
against a local `next start`, which makes it look fixed — verify on
production, not localhost.


## Latest session — branch surgery + the bin ships (s31, 2026-07-28)

**Fable solo (pure orchestration: rebase surgery, a two-line content cut,
deploy verification — nothing delegable). Deck unreported (Blob cap).**

- **Surgery, no force-push needed** (nothing was pushed): `git branch cv-exe
  main` snapshot, then `rebase --onto 2040fea 7d65965 main` dropped CV.EXE
  from main while keeping spec fix + title + HANDOFF rotate. Autostash
  carried the concurrent session's dirty `figma-plugin/code.ts` through.
- **Trash restored from `8934b21` via `checkout <sha> -- <files>`** (cherry-
  pick would have collided with the already-picked SpecSheet + diverged
  copy.json), TAG-03 cut per Jake, copy keys + registry applied by hand.
  Also re-applied the `spec-sheet.foot` copy line the s30 cherry-pick
  dropped.
- Verified on a temp `:3333` launch entry (3000 AND 3210 both owned by other
  sessions' servers; entry reverted). No local `npm run build` — a foreign
  dev server shares `.next`; Vercel's build was the gate and went READY.
- Live checks: `Disposal records`=1, `The Assistants`=1, `The Installer`=0,
  `Grows With You`=1, spec foot updated. Console clean, knight-speak
  derives on the new copy ("The reasons be the point — peruse the tags").

