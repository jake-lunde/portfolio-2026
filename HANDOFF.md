# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-10 (s41b/s42 notes → archive; s43 note below).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; apex 308s to www — curl -L).
  **Production = INSPECT SHELL (merge 5731587, 2026-08-10) on top of
  ASK MY AI + chat anatomy + INSPECT.MODE + focus-ticker + SHIPPED.SW.**
- **⚠️ Shared-checkout law: no concurrent sessions on one working tree;
  `git branch --show-current` before EVERY commit.** Another session's
  worktree (`minors-random-wallpaper`) was live during s40 — worktrees are
  the pattern; leave the main checkout on main.
- **ASK MY AI v3 + DOPPLER CHAT + FABLE MARK SHIPPED** (s43b, merges
  `e295bc9`; prod-probed). Chat-feed choreography (greeting+note one
  bubble springs in, cards stagger, carousel steps aside during replies);
  shared chat primitives at `src/components/chat/` (IdentityHeader,
  Bubble w/ thinking state, Feed, riseIn — new agent chat = header +
  greeting + canned cards, canned-first cost law); suggestion box is now
  a DOPPLER chat feed on those bones; menu-bar mark — now a `?` square
  borrowing the mode switcher's border (s43c; README's ask-me CTA
  removed, window back to 700: menu bar + deck are the only doors;
  once-ever discovery bubble, localStorage-sealed) + deck wires
  (FABLE→ai-chat, DOPPLER→suggest; other three await P1 mini-chats —
  fourier task). ⚠️ 360px menubar is now FULL — next control added must
  fold something. Original ship record (guardrails, spend caps):
  ABOUT THIS MACHINE retired into README (single identity door): FABLE
  bubble CTA at README's foot → "Ask My AI" (SYS-20, `/ai`); 5 authored
  cards local, composer live. Guardrails: global daily blob counter
  (`AI_CHAT_DAILY_MAX`, default 250) · per-IP 20/day · 8-msg session cap
  (graceful "email the human") · 5s cooldown (per-instance — observed
  missing across instances, accepted) · kill switch `AI_CHAT_OFF` ·
  **true backstop = spend limit on the key's Anthropic workspace (Jake
  confirms it's set)**. `/machine` 307→`/readme`. New dep
  `@anthropic-ai/sdk`. Parked bit: INSERT COIN gate on the cap (Notion).
- **README focus-ticker SHIPPED** (merge `3d5530e`, verified live). Speed
  dial: `CRAWL_PX_PER_SEC` in About.tsx. Branch deletable.
- **INSPECT.MODE IS NOW A TOOL MODE (the "INSPECT SHELL"), LIVE** —
  ◎ INSPECT menubar toggle (≥900px) or `/inspect`: desktop compresses to
  a canvas between paper docks — LAYERS tree left (WAI-ARIA, keyboard
  end-to-end, MutationObserver-fresh), INSPECTOR right (engine
  `src/lib/inspect.ts` unchanged: tokens w/ tier chips + core-law
  warnings, size-aware contrast, type, springs). Click picks · dblclick
  drills · ALT+CLICK operates the site · Escape ladder · dialogs exempt +
  above-dock z. LIVE NUDGE: semantic color roles re-alias from core
  PALETTE candidates, AA-judged per theme, inline-on-html preview only
  ("NOT SAVED" banner, RESET ALL, resets on exit) — persistence = phase 1,
  blocked on Jake's PR-vs-main ruling. tune.ts is the override channel;
  buildASkin untouched. Window program deleted; `/inspect` canonicals to
  `/readme`. EDIT.MODE mutual exclusion incl. disabled toggle state.
- **Notion research rulings (s40, full writeups in each task page):**
  hooks — none installed, adopt 4 (SessionStart deck-report, block
  generated-token edits, block forbidden commits, block prettier), ~15 min
  on Jake's OK · claude design/DesignSync — SKIP as infra (snapshot not
  sync, no Figma/Storybook), optional 20-min sketch-tool trial · skills
  research — "I use AI" is table stakes; top gaps: designing FOR agents
  (case study #3 spec drafted), evals-as-design-artifact, measurement
  beats; best originals: CUTS.APP (show the rejects), design system as
  MCP server, own "reversibility" vocabulary.
- **SHIPPED.SW live** (s39b, box-art marker verified); COMMAND.CTR v2 live
  (s38–39; cc-timeline Jake-lines = approved lowercase voice). Details archived.
- **Window.tsx shell:** resting `left` clamps on-glass; license phase grows
  the window via windows.ts requestSize/releaseSize (exact restore).
- **TAILOR-RESUME skill live**; OPEN: Jake rules Staff-vs-Senior title +
  75.8% activation metric.
- **FAMILY HUB CASE SHIPPED**; Jake's live sanity-walk pending.
- **THE DESK spec'd** (Notion): r3f + curated drei + Blender→GLTF; next
  flagship; refs incoming.
- **`leaf-patch` parked**; Jake's s31 rule: features on own branches.
- **Skins:** classic (light/dark) + medieval live; underwater stub. Copy
  layer + EDIT.MODE live — merge copy.json at KEY level, never force-push.
- **Jake is preparing to APPLY.** Gaps: Red Pen exhibit assets · shelf copy
  rewrite. **Standing ask: push Jake to prune copy.**
- **Voice law:** drafts in Jake's spoken cadence; em dashes are an AI tell;
  his verbatims lowercase among uppercase machines.
- **Known debts:** SpecSheet motion quote-strings · first-load JS perf ·
  underwater · `--accent-on-inverse` · reduced-motion by emulation ·
  medieval airbrush wash contrast · never build while a dev server owns
  the checkout .next · `family-hub 2/` dup dir (Jake deletes).

> s43b addendum (2026-08-10, the ai-chat session): chat-feed choreography
> + DOPPLER chat + fable mark all shipped (merges `e295bc9`), branches
> deleted, worktrees cleaned. Entry-point task Done (menu-bar mark + deck
> wire chosen over desktop tile/clippy — options in the task page);
> fourier "agents are clickable" framework developed + phased in its task.
> Next in that arc: P1 canned mini-chats for HERTZ/NYQUIST/FOURIER.

## Latest session — INSPECT SHELL: THE TOOL TAKES THE SCREEN (s43, 2026-08-10)

**Jake, on phase 0: "make it feel like the software I'm used to — layers
left, inspector right, in the toolbar, update live, less like another
window." Then "ship it when the fixes land!!" Both done.**

- **Build (NYQUIST worktree, 2 rounds):** shell `a470808` → DOPPLER 8
  findings fixed `afaf1b4` → merge `5731587`. Window program deleted;
  engine untouched. New: store/inspect.ts · lib/tune.ts (preview-only
  re-alias nudge, prior-stash reset) · components/inspect/* (shell,
  WAI-ARIA layers tree, inspector, code-split mount).
- **DOPPLER's sharpest:** fixed-position dialogs escaped the compressed
  canvas ABOVE the docks and trapped the visitor (Escape eaten by the
  mode ladder) → docks z6500 + [role="dialog"] exemption end-to-end ·
  keyboard-synthesized clicks (detail 0) made pick-vs-operate
  nondeterministic · tree went stale on in-window DOM churn → rAF-coalesced
  MutationObserver · Motion drag offsets stranded windows outside the
  canvas → ResizeObserver re-clamp (fixes browser-narrowing too).
- **Rulings that stick:** click picks / dblclick drills / ALT+CLICK
  operates (inverted from phase 0 — in the tool, alt means "use it") ·
  titlebar drag arranges (4px slop) · Escape ladder palette→selection→
  mode, transparent to open dialogs · recede off while on (flat canvas) ·
  paper docks, glyph toggle ◎ INSPECT (no icons in menubar) · 900px floor
  · compression = inset snap + dock transform slide (no layout tween on
  the OS container) · nudge candidates = buildASkin PALETTE as hexes
  (core primitives flatten at build — nothing to var() to), AA-judged
  per theme.
- Residual accepted: one Escape can close a non-dialog transient AND exit
  the mode · desktop icons/widgets have no tree rows (windows only) ·
  alt-click on a real link triggers browser download-default.
- Token debt sweep SCOPED (Notion P1 + session chip for Jake): manifest
  grep → re-alias ledger → doctor-zero. Phase 1 commit loop still awaits
  the PR-vs-main ruling; Motion+ answered (tuning fork yes, dependency no).

## Next steps

1. **Jake: walk ASK MY AI on lunde.co** — `/readme` foot → bubble → cards
   + a live question; eyeball the typewriter motion (never seen on a
   visible tab) and the card voice. **Confirm the workspace spend limit
   is set in the Anthropic console** — it's the only unhackable guard.
2. **Jake: drive the INSPECT SHELL on lunde.co** — ◎ INSPECT in the
   menubar. Click picks, alt+click uses the site, try a nudge on
   --accent. Then two rulings: token-commit path (PR vs main — unblocks
   saving nudges) + launch the token-debt-sweep chip.
3. **Jake: feel the FOCUS crawl on lunde.co** (35px/s — `CRAWL_PX_PER_SEC`
   if off) — it's live.
4. **Jake: read the skills research + the TUNE.MODE plan** (both Notion
   task pages) — skills proposes case study #3 (agent supervision) +
   CUTS.APP; TUNE.MODE questions 2–4 still open (token commits PR vs
   main? Motion+? — question 1 answered, phase 0 built).
5. **Jake rulings owed:** install the 4 hooks? · shelf live smoke + copy
   rewrite pass · Family Hub walk.
6. **The Desk** — next flagship (r3f ruling stands; Blender refs incoming).
7. Cleanup: delete merged branches (`cv-exe`, `suggestion-box`,
   `case-family-hub`, `worktree-cc-v2-pipeline`, `medieval-sfx*` on
   confirm) · `family-hub 2/` dup.
8. Carried: gate friction elsewhere · COMMAND.CTR zero-`list()` + cost
   read · replay-your-session task · Figma stale STRING vars · typography
   finale · underwater · eyeball tracker v2 / leaf-patch call.
