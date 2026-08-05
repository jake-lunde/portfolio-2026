# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-05 (s38 board picks; s36 + s37 notes → archive).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; NOTE the apex 308s to www — curl
  with -L or grep finds nothing). **Production = `4305f19` (s37 ship).**
- **RESUME.EXE v4 + BOX-86 SHIPPED to production 2026-08-04** (cv-exe
  merged, fast-forward; verified live: `/resume` serves, PDF 200
  `application/pdf` 4.4KB, desktop shows RESUME.EXE). Open the window and
  it prints itself: System 7 job card (striped bar, scaleX thermometer,
  dot-matrix chatter, ~2.1s; medieval "Scribing…"), page fades in, one
  button: DOWNLOAD PDF. Icon = tractor-feed sheet (medieval charter+seal;
  printer icon reserved for the desk scene); id stays `cv`; path
  `/resume` (old `/cv` soft-falls to readme). Resume content = JAKE'S OWN
  pruning pass (2026-08-04 MD). `resume.ts` → `build-cv.mjs` → committed
  deterministic PDF (one page, 84pt slack; build FAILS on page 2 or
  >200KB; never hand-edit); relative deltas only; sheet carries
  `data-no-translate`; full text in DOM from first paint. BOX-86 shipped
  in the same merge after Jake's review + fixes (outlined bubble tail,
  radius-md corners — chat, not chrome). Branches `cv-exe` and
  `suggestion-box` are now merged content — safe to delete.
- **NEW FLAGSHIP SPEC'D — "The Desk"** (Notion, dated 2026-08-04): zoom out
  of the shell into the room the OS runs in — CRT, physical printer (the
  v2 object retires there), iPod dock, lava lamp, MIDI keys. Art direction
  OPEN: Jake's leading candidate = cute 3D room, his references incoming;
  fallback = flat illustrated; photo ruled out. AFTER CV + Family Hub.
- **Branch `leaf-patch` (parked) got CRITTERS v2 in s34** (`89970d8`):
  bento-sticker cast (no outlines, sleepy eyes, asymmetric), nine ragged
  leaf states. ⚠️ progress.module.css slot sizes may need a nudge at
  revive; branch says Family Hub 55 vs main's 85 — reconcile at merge.
  Trash "The Installer" restores from `8934b21` when this ships — renumber
  to TAG-05 (TAG-03/04 taken by s38 `trash-good-ideas`).
- **Standalone tracker REBUILT s34** (git-ignored): v2 cast, whimsy retheme,
  Jake's DATA edits + localStorage preserved. Cast sheet:
  `portfolio-tracker/critter-cast-v2.html`.
- **Jake's s31 rule: feature work starts on its OWN branch;** main stays
  shippable.
- **Skins:** classic (light/dark) + medieval (knight-speak LIVE); underwater
  = stub. Copy layer + EDIT.MODE LIVE — rebase, merge copy.json at the KEY
  level, never force-push.
- **Jake is preparing to APPLY.** Audit gaps: RESUME.EXE (v4 built, this
  branch) · Red Pen (UNBLOCKED s33 — exhibit = Ryan avatar-token Slack
  thread; Jake to save screenshots) · gate friction (audit's #1 risk,
  unactioned). **Jake's standing ask: push HIM to prune and polish copy —
  he is the person, and the person gets the job.**
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

## Latest session — board picks: two review branches (s38, 2026-08-05)

**Fable orchestrating per §4.2: NYQUIST (Sonnet, own worktree) took the
closed code tasks; Trash copy written solo — voice work stays home. Deck
reported. Jake's ask: spend remaining usage on Notion board picks.**

- **`trash-good-ideas` (`0081527`, worktree s37-board-picks): TAG-03 "The
  Groupchat Guide" + TAG-04 "The AI Sidecar"** — Jake's dictated Greenlight
  memos (Notion P0s) filed per the file's ADDING ONE protocol. Memos use
  his own language (anticipate/alert/answer/act; 97%-in-15-min). ⚠️ cause
  + origin lines DRAFTED from tracker context (AI Interaction Models
  slide, 2025) — he never dictated why they died; his fact pass required.
  Both paper; sidecar dictation says "I want to use it" — pink candidate
  if he wants to move the wash (ONE pink max). Verified headless: 4
  records render, stamps + fields correct.
- **`minors-random-wallpaper` SHIPPED (merge `3be2035`, Jake's call,
  2026-08-05).** Live-verified: five fresh headless visits to lunde.co
  drew five different patterns (old build = always waves). Chunk-grep
  verify fails here — wallpapers.ts rides a lazy chunk the homepage HTML
  never names; probe behavior, not bundles. Branch can be deleted.
  What shipped: wallpaper default now `'random'` — resolved in `hydrate()` client-side
  only (no hydration mismatch; saved picks still pin; die-face Random
  swatch in Settings; 'plain' excluded from pool). Louie she/her: 3 fixes
  (ModelsViz comment, make-louie.mjs, AiOpinion "gets her pills");
  "his wife" = Jake's, untouched. tsc + prod build clean.
- **⚠️ NEW TRAP (memory `preview-start-launch-dir`):** preview_start in a
  worktree session still launches against the MAIN checkout's `.next` —
  hit §3.1 with the other session's :3000 live; killed inside a minute.
  If that server acts sick: restart it, `rm -rf .next`. Worktree verify
  pattern: Bash dev server on a free port + playwright headless probe.
- Notion: all four task summaries updated, statuses In Progress —
  "needs Jake's read." Deck: 6 events, all 200.

## Next steps

1. ~~RESUME.EXE~~ **SHIPPED (s37).** Sanity-walk it live on lunde.co when
   convenient (both skins, phone). Cleanup when idle: delete merged
   branches `cv-exe` + `suggestion-box`; audition `medieval-sfx`.
2. **Jake: READ Family Hub pass 3** on `case-family-hub` (+ s36 evolution
   rail in progress there). Merge = his call; then progress 85→100.
   **Also read s38's `trash-good-ideas`** (TAG-03/04 — fact pass the
   cause/origin lines); Jake said he'll circle back. Wallpaper branch
   already shipped on his word.
3. **Jake:** save the Ryan avatar-token Slack screenshots (Red Pen exhibit)
   + color before/after + asset pass on the Figma-node placeholders.
4. **Jake:** eyeball tracker v2 + `critter-cast-v2.html`; then revive
   `leaf-patch` (reconcile phases, slot sizes, Trash TAG-03) or park on.
5. Gate friction (Jake) — audit's #1 risk, still unactioned.
6. COMMAND.CTR zero-`list()` fix (cost hygiene now, not quota emergency).
7. Figma stale STRING vars; typography finale; underwater; First Pass
   section `459-473268` still unindexed (MCP transport cap) — carried.
