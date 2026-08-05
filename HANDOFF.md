# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-04 (s37 RESUME.EXE v4; s36 note merged in; s35 → archive).

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
  Trash TAG-03 "The Installer" restores from `8934b21` when this ships.
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

## Latest session — RESUME.EXE v4: it prints itself (s37, 2026-08-04)

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
  f4b1ccf cv-exe` — ONLY when no other session is active. **Jake has
  since ruled: no more concurrent sessions on one working tree.**
- **New law for CREW/CLAUDE.md consideration:** before EVERY commit,
  check `git branch --show-current` — concurrent sessions switch
  branches under you in this single shared checkout.

## Next steps

1. ~~RESUME.EXE~~ **SHIPPED (s37).** Sanity-walk it live on lunde.co when
   convenient (both skins, phone). Cleanup when idle: delete merged
   branches `cv-exe` + `suggestion-box`; audition `medieval-sfx`.
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
