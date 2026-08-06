# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-06 (s39 COMMAND.CTR v2 shipped; s38 skin-builder
> note → archive).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; NOTE the apex 308s to www — curl
  with -L or grep finds nothing). **Production = COMMAND.CTR v2 (s39).**
- **⚠️ Jake's rulings on the shared checkout: no more concurrent sessions
  on one working tree, and check `git branch --show-current` before EVERY
  commit** (s36/s37 race, archive). s39 shipped from an isolated worktree
  + a scratch `main` worktree for the merge — clean pattern.
- **COMMAND.CTR V2 SHIPPED 2026-08-06** (merge `24b2f30`): the deck is a
  living pipeline — inlet drops ideas to Jake, briefs route to leads,
  fan-out to the four, returns + PICKS climb back in `--accent` (forward
  = `--accent-expressive`). Measured bezier pipes (offset-chain anchors,
  arc-LUTs, one parked rAF, transform-only); pipe hover/tap slows packets
  + detail card; status = ephemeral toasts → receipts commit to a
  right-rail log (count pulses per commit; `24/76` honesty when capped).
  Nodes = avatar+name, model/role on hover/focus cards. Chip = two rows
  (glance / action, CTA centred <1240px). DOPPLER ledger: 16/16 closed,
  3 blockers re-verified. **AA floors MEASURED not eyeballed — alphas
  0.39→3:1, 0.52→4.5:1 on the CRT plates, documented in
  command.module.css.** `cc-timeline.json` Jake-lines = approved
  lowercase voice copy (uppercase-transform guards in CSS — don't undo).
- **⚠️ Shell-wide change in s39:** `Window.tsx` resting `left` is now
  `min(pos.x, 100vw − w − 12px)` so windows never open off-glass.
  Another session is mid-flight on `feat/shipped-sw-shelf` ALSO touching
  Window.tsx + registry.tsx — expect a small conflict at their merge.
- **FAMILY HUB CASE SHIPPED 2026-08-05** (`case-family-hub`): 7 sections,
  11 plates, PROGRESS.VWR margin rail, LaunchFilm lightbox. Assets
  `public/case/family-hub/evo/`; masters in `ref/` (never commit ref/).
- **RESUME.EXE v4 + BOX-86 live since 2026-08-04** (s37). Branches
  `cv-exe`/`suggestion-box` merged — deletable; `medieval-sfx*` once
  Jake confirms sfx live.
- **NEW FLAGSHIP SPEC'D — "The Desk"** (Notion): zoom out to the room the
  OS runs in; art direction OPEN. Next big build.
- **Branch `leaf-patch` (parked), CRITTERS v2** (`89970d8`) — reconcile
  at revive (archive).
- **Jake's s31 rule: feature work starts on its OWN branch;** main stays
  shippable.
- **Skins:** classic (light/dark) + medieval live; underwater = stub.
  Copy layer + EDIT.MODE LIVE — merge copy.json at KEY level.
- **Jake is preparing to APPLY.** Gaps: Red Pen exhibit assets · gate
  friction (audit's #1 risk). **Standing ask: push HIM to prune copy.**
- **Voice law (s35):** all user-facing drafts in Jake's spoken cadence;
  em dashes are an AI tell. s39 extension: his quoted verbatims render
  lowercase among the uppercase machines — that contrast is the tell.
- **Tracking:** Notion (connector live). Deck reporting works; COST read
  + zero-`list()` fix still wanted. Source `.env.local`; positional args.
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse`; reduced-motion by emulation. Never
  build while a dev server owns `.next` (worktrees have their OWN .next
  — safe to build there).

## Latest session — COMMAND.CTR v2: the pipeline (s39, 2026-08-06)

**Fable orchestrated lean from an isolated worktree (`cc-v2-pipeline`);
NYQUIST (Sonnet) restacked the chip, FOURIER (Opus) built + revised the
deck, DOPPLER (Opus) reviewed 16 findings + re-verified the 3 blockers.
Deck reported itself being rebuilt. Jake approved live mid-session
("ship it") after a headless screenshot.**

- **Jake's brief:** too much text at once; show a pipeline with ideas
  visibly moving; hover the moving idea for detail; statuses ephemeral
  like the desktop chat; picks climb UP from the leads (his catch — they
  wrongly fell from the inlet at first); verbatims in HIS voice, not
  machine telegraph; side-rail log with a pulse tying toasts to receipts.
- **Findings worth keeping:** DOPPLER's alpha advice was arithmetically
  wrong (0.32 ≠ 3:1; FOURIER measured real floors — trust measurement
  over review authority). Boot screen defeats headless
  `--virtual-time-budget` screenshots — use CDP probe (headless_shell
  `--remote-debugging-port` + Node's built-in WebSocket; probe script
  pattern in scratchpad, real waits, `Runtime.evaluate` for JS probes).
  `getBoundingClientRect` poisons anchor math during the window's open
  spring — offset chains are transform-immune (comment in file).
- Verified: tsc + build clean, JS probes (chip centring, window clamp at
  1100px), screenshots of replay traffic + fixed inks. Deploy 24b2f30.

## Next steps

1. **Jake: play the v2 deck LIVE on lunde.co** — hover pipes, open the
   rail, run a real session to see LIVE mode traffic; report anything off.
   Touch behavior (S4/S5) + medieval/skin re-measure verified in code,
   not on devices — worth a phone poke.
2. **Jake: sanity-walk Family Hub LIVE** — rail, demos, film sound,
   phone, medieval. Auto-zoom tuning parked.
3. **The Desk** — next flagship; Jake's 3D-room references incoming.
4. Cleanup when idle: delete merged branches (`cv-exe`, `suggestion-box`,
   `case-family-hub`, `worktree-cc-v2-pipeline`, `medieval-sfx*` once
   confirmed).
5. Gate friction (Jake) — audit's #1 risk, still unactioned.
6. COMMAND.CTR zero-`list()` fix · deck cost read · replay-your-session
   task (Up Next, P1) · Figma stale STRING vars · underwater — carried.
