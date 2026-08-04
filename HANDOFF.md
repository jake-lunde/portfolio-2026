# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-04 (session 31).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs). **Production = `418c8b8`.**
- **⚠️ Branch `cv-exe` carries ALL CV work, unpushed, awaiting Jake's read:**
  `92b615b` SpecSheet fix · `2040fea` canonical title + gitignore · `7d65965`
  CV.EXE v1 · `9c050f8` HANDOFF · `5356da8` **CV.EXE v2 (current)**. Local
  `main` = origin. Merging cv-exe to main deploys it all.
- **⚠️ Branch `leaf-patch` PARKED at Jake's request (s30).** CASES caterpillar
  metaphor + Trash v1 (`e85a51c`, `8934b21`; latter local-only). Production
  was never on it (preview build only). SpecSheet fix already cherry-picked.
- **CV.EXE v2 = desktop FURNITURE.** Bare chrome (like the iPod); the machine
  sits on the desk, open by default under every desktop deep link
  (`windowsForPath` prepends `cv`; mobile strips it — Desktop.tsx). No desktop
  icon on desktop (`.cvGrid` hides it; the device is its own icon); mobile
  launcher keeps the icon, gets no machine — page arrives printed, sticky
  download bar. `src/content/resume.ts` → `scripts/build-cv.mjs` →
  `public/jake-lunde-resume.pdf` (committed, deterministic; build FAILS on
  page 2 or >200KB; never hand-edit). Resume rewritten for the 2026 double
  gate (ATS parse → LLM summarize): Greenlight block spans Family Hub 0→1 →
  Invest deltas → production SwiftUI → Storybook↔Figma→Claude-PR pipeline.
  Relative deltas only; absolute internals (survey n, user counts) never.
  Sheet carries `data-no-translate` (knight-speak must not rewrite facts).
  Windows now carry `data-window-id`; the cv window + wrappers are
  pointer-events none, visible objects opt in — parked-paper air must not
  eat desktop clicks.
- **Canonical title: Staff Product Designer** (LinkedIn confirms Jan 2026
  promotion). Site copy reconciled; "principal-level" gone.
- **Skins:** classic (light/dark) + medieval; underwater = stub. Knight-speak
  LIVE on prod. **Copy layer + EDIT.MODE LIVE** — rebase, merge copy.json at
  the KEY level, never force-push.
- **Jake is APPLYING for roles.** Audit gaps: resume (CV.EXE ✓ built), Red Pen
  (collab evidence), gate friction (unfixed). Family Hub is LIVE nationwide,
  Amazon launch ~Aug 2026 (tracker s32–35 is rich; case study drafted on
  branch `case-family-hub`).
- **DS pipeline:** tokens/ → build → generated CSS/TS; Chromatic; SB10 +
  Webpack. ⚠️ stale STRING `core/leading|tracking|weight` vars before next
  Figma PULL. No ESLint configured (`next lint` prompts interactively).
- **Tracking:** Notion (connector live). Blob cap RESET — deck reporting
  works again (s31 reported dispatch/return/merge fine). Zero-`list()` fix
  still top infra backlog.
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse`; reduced-motion path still unverified by
  emulation (code paths in place, both CV versions).

## Latest session — CV.EXE v2: furniture + the AI-pass resume (s31, 2026-08-04)

**Fable solo (Jake tapped Fable in to redo Shannon's v1). Solo because both
halves were taste: the resume rewrite is Jake's voice at staff scope, and the
device is skin craft — nothing separable to delegate. Deck reported.**

- **Resume for the 2026 double gate** (researched: ATS parse THEN an LLM
  summarizes for the recruiter): bullets became one narratable claim each,
  scope-first. Greenlight now leads with Family Hub (first hardware product,
  vision → nationwide, sole designer) sourced from tracker s32–35 — which
  moved a LOT since s29; read it before touching career facts again.
- **Parser trap worth remembering:** pdfkit wrapped "3–4×" at the en dash
  ("3–\n4×"), mangling the headline metric for dumb parsers. Fixed by
  restructuring the sentence so the metric sits mid-line; the pypdf
  string-presence check catches this class — run it after ANY resume edit.
- **Bare-chrome lessons v1 never hit:** (1) bare windows don't impose height —
  `height: 100%` resolves against auto and shoves the device off-screen; the
  program must size itself like the iPod. (2) A mostly-empty bare box eats
  desktop clicks — pointer-events none on window + wrappers, opt back in on
  visible objects. (3) The paper parks via `paperLift` (translateY on a
  100%-height wrapper; Motion owns the inner element's transform for tear).
- **Dev-server watcher can silently die:** server served stale modules with
  no compile lines; SSR grep for a new classname (`cv_paperLift__`) is the
  cheap tell; restart via preview_stop/start fixed it. Also: the pane's
  NATIVE width is <720 — it renders the mobile launcher; force
  resize_window 1280 before desktop probes.
- Notion CV.EXE page updated (v2 note appended); deck dispatch/return/merge
  all 200 — Blob cap confirmed reset.

## Next steps

1. **Jake:** walk the desk — press PRINT, TEAR OFF, drag the machine, both
   skins, phone. Then merge `cv-exe` → main = deploy.
2. **Leaf-patch decision** (parked): merge, revise, or abandon — Trash v1 is
   trapped behind it, incl. the ⚠️ DRAFT Assistants cause/year.
3. Gate friction (audit's #1 risk, still unactioned).
4. COMMAND.CTR zero-`list()` fix (cap has reset; backlog spec in s26 archive).
5. Figma stale STRING vars; typography finale; underwater (carried).
