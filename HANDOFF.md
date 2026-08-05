# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-31 (s35 draft → branch; s32–33 note → archive).

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
- **Family Hub case study DRAFTED (s35) — branch `case-family-hub`**
  (`087d56b`): `content/family-hub.mdx`, 7 sections on tracker §2's spine,
  4 new interactive plates (ResearchBars · SurfaceTriad · TandemSetup ·
  TokenThread), placeholders cite exact Figma nodes for the asset pass.
  cases.ts 70→85 "Drafted — in review", status LIVE on the branch only.
  Public-safe filters applied (no targets/CEO/backchannel/team-shrink).
  **PASS 2 landed (`6fb4567`) after Jake's review:** organizer/home-base
  framing (zero "kitchen wall"), prose ~halved, HubModes = Ambient/Active/
  Authenticated (no "focused" tier; big-dumb-buttons → shipped-hybrid
  honesty), Claim + Ledger type-hierarchy components, 11 plates.
  **Awaiting Jake's second read → merge.** Capture: tracker §2 (s32–33).
- **Tracking:** Notion (connector live). **Blob cap LIFTED (2026-08-01):**
  Jake upgraded Vercel to Pro w/ advanced Blob ops — NOT a monthly cap.
  Deck reporting RESUMED s35 (dispatch/return/merge all 200). Jake wants a
  COST read on normal deck usage — watch the Vercel bill, don't go crazy;
  zero-`list()` fix still worth doing. Script needs `.env.local` sourced
  (`CC_FEED_KEY`); usage = positional: `cc-report.mjs dispatch fable "" "label"`.
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse` role. Ports 3000/3210 often owned by
  concurrent sessions — temp launch.json entry, verify, revert; never
  `npm run build` while a foreign dev server owns `.next`.

## Session s36 — Notion small-batch: the lute and the box (2026-08-04)

**Fable solo, declared per §4.2: closed small tasks, taste-dominant
(sound design, roast copy, icon drawing); briefing overhead > execution.**

- **Notion P0 "agents explain themselves on hover" CLOSED** — already
  shipped 2026-07-26 (`8ce7cdc`, first-contact intro card); task was
  never marked Done.
- **Branch `medieval-sfx` (`f5ac7b6`, pushed):** medieval skin gets a
  lute-course pluck (detuned saw pair, octave down, lowpass damped,
  RMS level-matched via OfflineAudioContext probes). Same tunes, all
  call sites untouched; classic unchanged. Jake auditions → merge.
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
  f4b1ccf cv-exe` — ONLY when no other session is active.
- **New law for CREW/CLAUDE.md consideration:** before EVERY commit,
  check `git branch --show-current` — concurrent sessions switch
  branches under you in this single shared checkout.

## Latest session — Family Hub drafted: the leaf becomes a case study (s35, 2026-07-31)

**Fable drafting solo, declared per §4.2: prose voice + interactive-plate
design are taste work, and every input was already captured in tracker §2 —
nothing separable to delegate. Deck dark (Blob cap, same as s34).**

- **Branch `case-family-hub` (`087d56b`)** — `content/family-hub.mdx` +
  CaseFamilyHub program. Spine: bet (3 futures, Moves) → evidence (n=1,200)
  → system (surface triad) → persuasion-by-artifact → constraints (QR
  tandem + hardware margins) → ten-to-one (Red Pen ×2) → the ship. Thesis:
  *"The first skeptic it had to convert was me — then the board, then the
  factory."* Close: *"We retired the whiteboard."*
- **4 new interactives** (case/, invest palette: ink #E7E1D2 on inverse
  plate, one pink): ResearchBars (survey bars w/ overruled-research ledger),
  SurfaceTriad (ambient/active/focused), TandemSetup (5-step paired
  onboarding), TokenThread (avatar-token thread replay, weakest→strongest).
- **CaseFooter now takes `next.slug` and opens the window** — was a dead
  button; invest's footer → Family Hub, live.
- **Figma scan for the asset pass:** Presentations `457-473267` = 4 monthly
  leadership decks Aug–Nov 25 (Gantt, per-platform principles+grids,
  ambient studies: Magic Mirror/Clock/Weather/Art); Initial Prototypes
  `460-368545` = LoFi v1 → v2 → HiFi 7/9/25 ladder (hi-fi home
  `430-269991`). First Pass `459-473268` overflows the MCP transport —
  still unindexed. Placeholder captions cite exact node ids.
- Verified on this session's own port-3000 server (foreign session owned
  3210): gate bypassed via `sessionStorage lunde-gate=1`, 7 sections + all
  4 interactives probed by JS. **Gotcha for memory: AnimatePresence
  `mode="wait"` never swaps under the hidden-tab rAF freeze** — replaced
  with keyed remount + fade-in (also just simpler). tsc clean; stale
  console buffer replayed dead errors (known).
- Tracker §2 header → 🟩 DRAFTED. `.next/types/* 2.ts` duplicate-file junk
  causes tsc noise (pre-existing; filter with `grep -v '^.next'`).
- **PASS 2 (same session, 2026-08-01, `6fb4567`) — Jake's live review:**
  "kitchen wall" purged (product = all-in-one family organizer / home base;
  positioning verified against greenlight.com/family-hub + shop + WiFiHiFi
  press). Interaction model corrected to Ambient/Active + Authenticated
  gate (assistant mode exists, deliberately unlisted; big dumb buttons =
  punted-to-hybrid, said honestly). Prose ~halved; new Claim (display
  interstitial) + Ledger (mono spec-sheet) in case vocabulary; 6 new
  hiring-manager placeholders. "Weakest hardware" → "design with the grain
  of the hardware." Gotcha: `git mv` on a client component while dev server
  runs leaves a stale webpack module → 500 until server restart.
- **Blob cap lifted:** Vercel Pro upgrade; deck resumed (54/55 events).
  Jake wants a cost read on steady-state usage before we lean on it.
- **PASS 3 (`8a8ff27`) — the voice pass:** Jake flagged em dashes +
  "load-bearing" as AI tells; prose rewritten in his spoken cadence
  (verbatims from tracker §2 as the reference: "kind of convincing myself
  along the way", "to be fair, we kind of had to punt", "which is kinda
  funny"). Em dashes purged from prose + component strings; survivors are
  verbatim quotes and house label typography (secNo/FIG/cite). Rules saved
  to memory `case-study-voice-calibration` — applies to ALL future drafts.

## Next steps

1. **Jake: READ Family Hub pass 2** — branch `case-family-hub`,
   `/projects/family-hub` (behind the gate). Check: organizer framing,
   HubModes model, Claim/Ledger hierarchy, accounts-dissent line (§07).
   Merge = his call; then progress 85→100.
2. **NEW FEATURE, FRESH SESSION — the "evolution rail":** Jake's idea, he
   is providing assets. A floating element outside/barely overlapping the
   case text column that IS the Family Hub, evolving as you scroll:
   idea sketch → lo-fi wireframe → mid-fi → hi-fi prototype → production
   build (photo). Build notes for the next session: lives in
   CaseFamilyHub/case layout, right margin on desktop, hidden or inline on
   mobile (360px law); the case scrolls inside the WINDOW's scroll
   container, so sticky/position must anchor to that scroller, not the
   viewport; stage-switching driven by IntersectionObserver on sections
   (NOT rAF/scroll-linked springs — hidden-tab + reduced-motion safe;
   crossfade like HubModes' keyed remount). Five asset slots, swappable
   placeholders until Jake ships them (§2 law). Wants: playful, not a
   parlor trick; it should read as the persuasion-ladder thesis made
   literal.
3. **Jake:** save the Ryan avatar-token Slack screenshots (Red Pen exhibit
   → drops into Plate 09) + color before/after (Plate 10) + asset pass on
   the Figma-node placeholders.
4. **Jake:** eyeball tracker v2 in a real browser (idle animations, peek
   loop, toasts) + `critter-cast-v2.html`. Then revive `leaf-patch`
   (reconcile Family Hub 55→70 phase, slot sizes, Trash TAG-03) or park on.
5. **CV.EXE revisions on `cv-exe`** (BFA vs BA; dot-matrix line), then merge.
6. Gate friction (Jake) — audit's #1 risk, still unactioned.
7. COMMAND.CTR zero-`list()` fix after Blob cap resets (~Aug 1).
8. Figma stale STRING vars; typography finale; underwater; First Pass
   section `459-473268` still unindexed (MCP transport cap) — carried.
