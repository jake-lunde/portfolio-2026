# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-04 (s37 CV.EXE v2 → branch; s35 note → archive).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs). Production = `938bc39`-era main;
  local main = origin/main.
- **⚠️ Branch `cv-exe` = CV.EXE v3, BUILT (`dffaea6`), awaiting Jake's
  walk-through.** Jake killed v2's furniture printer same-day (page never
  truly printed out of anything; placement funky) — v3 delivers through a
  **System 7 print dialog**: CV.EXE is a paper-chrome document window
  (icon back, slot 2), PRINT… opens the dialog (striped bar · Printer:
  LUNDE 1200·D · Quality Draft/NLQ, a real toy that changes job speed +
  chatter density · Cancel/Print · scaleX thermometer), Done fires the
  PDF, dialog puts itself away, focus returns. Escape closes the DIALOG
  only (capture-phase listener, EditMode precedent). Medieval = SCRIBE,
  sheet untranslated. `buildPasses()` lifted to `passes.tsx` for reuse by
  the future desk scene. Furniture plumbing fully retired (no
  withFurniture, no cvGrid, no pointer-events chain; `data-window-id`
  kept). Resume content unchanged from the s37 AI-screening rewrite:
  `resume.ts` → `build-cv.mjs` → committed deterministic PDF (build FAILS
  on page 2 or >200KB; never hand-edit); relative deltas only; sheet
  carries `data-no-translate`. ⚠️ `f4b1ccf` (BOX-86, concurrent DOPPLER
  session) swept up v3's registry/DesktopIcons/copy.json halves — the two
  commits ship together. Merge cv-exe → main = ship.
- **NEW FLAGSHIP SPEC'D — "The Desk"** (Notion, dated 2026-08-04): zoom out
  of the shell into the room the OS runs in — CRT, physical printer (the
  v2 object retires there), iPod dock, lava lamp, MIDI keys. Art direction
  OPEN: Jake's leading candidate = cute 3D room, his references incoming;
  fallback = flat illustrated; photo ruled out. AFTER CV + Family Hub.
- **Branch `leaf-patch` (parked) got CRITTERS v2 in s34** (`89970d8`):
  bento-sticker cast (no outlines, sleepy eyes, asymmetric), nine ragged
  leaf states. ⚠️ progress.module.css slot sizes may need a nudge at
  revive; branch says Family Hub 55 vs main's 85 — reconcile at merge.
  Trash TAG-03 "The Installer" restores from `8934b21` when this ships.
- **Standalone tracker REBUILT s34** (git-ignored): v2 cast, whimsy retheme,
  Jake's DATA edits + localStorage preserved. Cast sheet:
  `portfolio-tracker/critter-cast-v2.html`.
- **Jake's s31 rule: feature work starts on its OWN branch;** main stays
  shippable.
- **Skins:** classic (light/dark) + medieval (knight-speak LIVE); underwater
  = stub. Copy layer + EDIT.MODE LIVE — rebase, merge copy.json at the KEY
  level, never force-push.
- **Jake is preparing to APPLY.** Audit gaps: CV.EXE (v2 built, this branch)
  · Red Pen (UNBLOCKED s33 — exhibit = Ryan avatar-token Slack thread; Jake
  to save screenshots) · gate friction (audit's #1 risk, unactioned).
- **Family Hub case study DRAFTED through PASS 3 — branch `case-family-hub`**
  (voice pass `8a8ff27`; s36 evolution-rail work continues there). Facts:
  LIVE nationwide, Amazon launch ~Aug 2026; tracker §2 (s32–35) is the
  richest source in the repo — read it before touching career facts.
- **Voice law (s35, memory `case-study-voice-calibration`):** em dashes +
  "load-bearing" are AI tells in Jake's prose — write in his spoken cadence
  for ALL user-facing drafts (resume already complies).
- **Tracking:** Notion (connector live). **Blob cap LIFTED (Vercel Pro).**
  Deck reporting works (s37: dispatch/return/merge all 200). Jake wants a
  COST read on steady-state deck usage; zero-`list()` fix still worth it.
  Script: source `.env.local` first; positional args.
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse`; reduced-motion unverified by emulation
  (paths in place). Ports 3000/3210 often owned by concurrent sessions —
  never `npm run build` while a foreign dev server owns `.next`.

## Latest session — CV.EXE v3: the OS prints the resume (s37, 2026-08-04)

**Fable solo through THREE passes in one long session: v2 (furniture
printer), Jake's live review killing it, then v3 (print dialog) planned in
plan mode and shipped. Solo per §4.2 — resume voice + platform-idiom craft,
nothing separable. Deck reported. A concurrent DOPPLER session shipped
BOX-86 (suggestion box) into the same branch mid-flight.**

- **The v2→v3 lesson, worth keeping: physical objects want a physical
  layer.** The furniture printer failed because paper can't convincingly
  exit a machine that's really a scrolling window box. Jake's zoom-out
  instinct became The Desk (Notion); the resume delivery moved to where
  1992 actually delivered documents — the print dialog. The gag being
  ACCURATE is the site's whole voice.
- **Resume (from the v2 pass, unchanged in v3):** rewritten for 2026
  screening (ATS parse THEN an LLM summarizes for the recruiter — one
  narratable claim per bullet, scope first; Greenlight leads with Family
  Hub 0→1). **Parser trap:** pdfkit wrapped "3–4×" at the en dash; re-flow
  the sentence and re-run the pypdf string-presence check after ANY
  resume edit.
- **Dialog craft:** gate dialog's striped bar + Button primitive +
  InProgress-style thermometer, all re-cut in cv.module.css with semantic
  tokens; Escape = capture-phase + stopPropagation (EditMode precedent);
  progress = CSS scaleX, nothing on rAF; reduced-motion = instant
  delivery, "Sent to printer."
- **Verified in a real renderer** (pane freezes AnimatePresence exits —
  close behaviors CANNOT be probed in the pane): Escape/Cancel unmount,
  window survives, self-close after Done, focus restore, both skins +
  390px. AA floor 4.99. Zero drift 50/50 strings.
- Session breadcrumbs that cost real time: dev-server watcher died
  silently (SSR-grep a new classname = the tell); the pane's NATIVE width
  is <720 so it renders the mobile launcher (force resize_window 1280);
  an earlier HANDOFF rotation was written against pre-s31 history and had
  to be reconciled via merge (this session = s37).
- Notion: CV.EXE page carries v1→v2→v3 history; The Desk spec'd.

## Next steps

1. **Jake: walk the document** — open CV.EXE, PRINT…, try Draft AND NLQ,
   Escape mid-job, both skins, phone. Then merge `cv-exe` → main = the
   resume ships. (BOX-86 rides along — review DOPPLER's suggestion box in
   the same pass.)
2. **Jake: READ Family Hub pass 3** on `case-family-hub` (+ s36 evolution
   rail in progress there). Merge = his call; then progress 85→100.
3. **Jake:** save the Ryan avatar-token Slack screenshots (Red Pen exhibit)
   + color before/after + asset pass on the Figma-node placeholders.
4. **Jake:** eyeball tracker v2 + `critter-cast-v2.html`; then revive
   `leaf-patch` (reconcile phases, slot sizes, Trash TAG-03) or park on.
5. Gate friction (Jake) — audit's #1 risk, still unactioned.
6. COMMAND.CTR zero-`list()` fix (cost hygiene now, not quota emergency).
7. Figma stale STRING vars; typography finale; underwater; First Pass
   section `459-473268` still unindexed (MCP transport cap) — carried.
