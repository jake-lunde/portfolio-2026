# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-04 (s37 CV.EXE v2 → branch; s35 note → archive).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs). Production = `938bc39`-era main;
  local main = origin/main.
- **⚠️ Branch `cv-exe` = CV.EXE v2, BUILT, awaiting Jake's walk-through**
  (`5356da8` + merge of main). s30's open calls are CLOSED: BFA confirmed,
  dot-matrix summary line kept, title = Staff Product Designer. The printer
  is desktop FURNITURE: bare chrome, open by default under every desktop
  deep link (`windowsForPath` prepends `cv`; Desktop.tsx strips on mobile),
  no desktop icon (`.cvGrid`; the device is its own icon), mobile = printed
  page + sticky download bar, launcher keeps the icon. `resume.ts` →
  `build-cv.mjs` → committed deterministic PDF (build FAILS on page 2 or
  >200KB; never hand-edit). Resume rewritten for 2026 screening (ATS parse
  → LLM summarize): Greenlight spans Family Hub 0→1 → Invest deltas →
  production SwiftUI → Storybook↔Figma→Claude-PR pipeline. Relative deltas
  only; absolute internals never. Sheet carries `data-no-translate`.
  Windows carry `data-window-id`; cv window + wrappers are pointer-events
  none, visible objects opt in. Merge cv-exe → main = ship.
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

## Latest session — CV.EXE v2: the printer is furniture (s37, 2026-08-04)

**Fable solo (Jake tapped Fable in to redo s30's v1). Solo declared per
§4.2: the resume rewrite is Jake's voice at staff scope and the device is
skin craft — nothing separable. Deck reported (dispatch/return/merge).**

- **Resume, researched then rewritten:** 2026 screening = ATS parse THEN an
  LLM that summarizes for the recruiter, so each bullet is one narratable
  claim, scope first. Greenlight leads with Family Hub (first hardware
  product, vision → nationwide, sole designer) from tracker s32–35.
  **Parser trap:** pdfkit wrapped "3–4×" at the en dash, mangling the
  headline metric; fixed by re-flowing the sentence. The pypdf
  string-presence check catches this class — run after ANY resume edit.
- **Bare-chrome lessons the iPod never taught:** (1) bare windows don't
  impose height — the program must size itself; (2) a mostly-empty bare box
  eats desktop clicks — pointer-events none up the wrapper chain, visible
  objects opt in (probe: `elementFromPoint` over parked-paper air lands on
  the desktop widget behind); (3) paper parks via `paperLift` translateY on
  a 100%-height wrapper — Motion owns the inner element's transform.
- **Dev-server watcher can die silently** (serves stale modules, no compile
  lines): SSR-grep for a new CSS-module classname is the cheap tell;
  preview_stop/start fixes. The pane's NATIVE width is <720 → it renders
  the mobile launcher; force resize_window 1280 before desktop probes.
- **Merged main into cv-exe** (Trash on main, s32–35 HANDOFF history) and
  resolved HANDOFF conflicts here so Jake's merge is clean. My earlier
  rotation had renumbered this session s31 against stale history — main
  had already spent s31–35; corrected to s37.
- Notion CV.EXE page updated; deck confirmed healthy post-Pro.

## Next steps

1. **Jake: walk the desk** — press PRINT, TEAR OFF, drag the machine, both
   skins, phone (launcher icon → printed page). Then merge `cv-exe` → main
   = the resume ships.
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
