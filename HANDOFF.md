# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-28 (session 30).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs). **Production = `418c8b8`.**
- **⚠️ Local `main` is 3 commits AHEAD of origin, unpushed, awaiting Jake's
  read:** `92b615b` SpecSheet skin-reactive · `2040fea` canonical title +
  gitignore · `7d65965` CV.EXE. Pushing these deploys them.
- **⚠️ Branch `leaf-patch` is PARKED at Jake's request (s30).** Holds the CASES
  caterpillar metaphor + Trash v1 (`e85a51c`, `8934b21`; the latter is
  local-only). Production was never on it — its Vercel build is a PREVIEW
  (`target: null`). Only the SpecSheet fix was cherry-picked to main.
- **CV.EXE (DOC-01) is BUILT** — `/cv`, desktop slot 2 after README.
  `src/content/resume.ts` is the single source of truth; the window renders it
  and `scripts/build-cv.mjs` renders it to `public/jake-lunde-resume.pdf`
  (committed, deterministic, 4.4KB) via `predev`/`prebuild`. Never hand-edit
  the PDF; the build fails on page 2 or >200KB. **The sheet's
  `data-no-translate` is load-bearing** — KnightSpeakLayer was rewriting
  "kids"→"younglings" under medieval, falsifying a CV.
- **Canonical title: Staff Product Designer.** LinkedIn confirms the Jan 2026
  promotion from Design Lead, so the tracker's "Senior Design Lead" is stale,
  not conflicting. Site copy reconciled; "principal-level" is gone.
- **Skins:** classic (light/dark) + medieval; underwater = stub. Knight-speak
  voice LIVE on prod (derived translation via SKIN_VOICE; explicit slots win).
- **Copy layer + EDIT.MODE LIVE in production** — expect copy.json commits on
  main between sessions; rebase and merge at the KEY level, never force-push.
- **Jake is preparing to APPLY for roles.** Session-29 audit gaps: resume
  (→ CV.EXE, now built), collaboration evidence thin (→ Red Pen), gate taxes
  return visits (unfixed, discuss). Notion projects: CV.EXE (Done) · The Red
  Pen · Build A Skin · Ask The Machine.
- **DS pipeline:** tokens/ → build → generated CSS/TS; Chromatic; SB10+
  Webpack. ⚠️ delete stale STRING `core/leading|tracking|weight` vars before
  next Figma PULL. No ESLint configured — `next lint` prompts interactively.
- **Tracking:** Notion (connector live). **⚠️ COMMAND.CTR deck 500s — Blob
  Advanced Ops capped until ~Aug 1; don't hammer.** Zero-`list()` fix still
  top infra backlog (spec in archived s26 incident).
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse` role.

## Latest session — CV.EXE: the printer prints (s30, 2026-07-28)

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

## Next steps

1. **Jake:** read the resume in CV.EXE. Two open calls: BFA vs BA on the
   diploma, and whether the summary's "This PDF came off a dot-matrix printer
   I built at lunde.co" line stays. Then push the 3 commits = deploy.
2. **Leaf-patch decision** (parked): merge, revise, or abandon — and Trash v1
   is trapped behind that call, including the ⚠️ DRAFT Assistants cause/year.
3. Gate friction (Jake): visible second door + localStorage + `?ref=`
   auto-unlock — the audit's #1 risk, still unactioned.
4. COMMAND.CTR zero-`list()` fix after the Blob cap resets (~Aug 1).
5. Figma stale STRING vars; typography finale; underwater (carried).
