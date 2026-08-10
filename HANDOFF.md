# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-09 (s40/s40b note → archive; s41 note below).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; apex 308s to www — curl -L).
  **Production = README focus-ticker (merge 3d5530e, live-verified
  2026-08-09) on top of SHIPPED.SW + COMMAND.CTR v2.**
- **⚠️ Shared-checkout law: no concurrent sessions on one working tree;
  `git branch --show-current` before EVERY commit.** Another session's
  worktree (`minors-random-wallpaper`) was live during s40 — worktrees are
  the pattern; leave the main checkout on main.
- **`feat/ai-chat` (`a07dfe8`, worktree branch) AWAITS JAKE'S READ.**
  ABOUT THIS MACHINE retired into README (single identity door): FABLE
  avatar + bubble CTA at README's foot opens "Ask My AI" (SYS-20, `/ai`)
  — 5 authored cards stream locally, composer hits `/api/ai-chat` (Opus 5,
  per-IP cooldown, 8-msg cap). `/machine` 307→`/readme`. Live composer
  needs `ANTHROPIC_API_KEY` in Vercel env — **Jake sets it, dedicated
  Anthropic workspace + spend cap as backstop**; cards work keyless.
- **README focus-ticker SHIPPED** (merge `3d5530e`, verified live). Speed
  dial: `CRAWL_PX_PER_SEC` in About.tsx. Branch deletable.
- **TUNE.MODE ruled the build path for figma↔code live editing (s40b
  research, full landscape in Notion task):** adopt NOTHING external
  (all write Tailwind/regenerate; none lockable to tokens/). Phases:
  INSPECT.MODE read-only public (S) → token nudge + doctor-gated
  `/api/token-commit` modelled on copy-commit (M) → SPRING scrub with
  runtime override indirection in motion.ts (M) → agent-mediated (L,
  optional). Watch: Figma Make in-local-codebase (closed beta, Mac-only,
  no token enforcement). 4 open questions for Jake in the task page.
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

## Latest session — RECONCILE README × ABOUT THIS MACHINE (s41, 2026-08-09)

**Jake's Notion task: README/machine overlap dilutes the message. Rulings
(recorded in the task page): retire ABOUT THIS MACHINE fully · the memory
dataviz retires with it (live-ops personality belongs to COMMAND.CTR) ·
the essay window becomes a hybrid chat · coworkers card stays and leads ·
focus crawl keeps (already merged s40b).**

- **Build (NYQUIST, worktree → `feat/ai-chat`):** machine/ dir + copy keys
  deleted; README CTA block (suggest-box DOPPLER treatment, FABLE avatar);
  AiChat window — Family Hub Assistant card pattern (Figma 201258-38244),
  cards THE RECEIPTS · INDIVIDUAL · CRAFT · EDIT · SPARK in answers.ts
  (Fable-authored, review verbatims), rAF typewriter w/ reduced-motion
  instant path; `/api/ai-chat` follows suggestions-route idiom (nodejs,
  cooldown Map, honeypot, 503 offline). New dep `@anthropic-ai/sdk`.
- **Verified via worktree Bash dev server :3013 + pane JS probes:** README
  CTA renders + opens window · `/ai` deep link works · cards collapse to
  chips after first send · composer→503→offline copy→re-enables · 375px no
  overflow · console clean. NOT seen moving: the typewriter (hidden-tab
  rAF freeze; code path verified) — needs one visible-tab glance.
- Chat economics ruled with Jake: ~2.5¢/live turn on Opus 5, $2–4/mo
  realistic; hard backstop = spend-capped dedicated workspace key.
- Parking lot (Notion task): coin-op gate on the message cap ("INSERT
  COIN") — a bit, not a business.
- s40 flag RESOLVED: `/readme` deep link does open the window (it was the
  hidden-tab freeze).

## Next steps

1. **Jake: read `feat/ai-chat`** — card copy voice + chat feel (checkout
   the branch, `/readme` then `/ai`), then merge call. After merge: create
   a dedicated Anthropic workspace + spend-capped key, add
   `ANTHROPIC_API_KEY` to Vercel env to light the composer.
2. **Jake: feel the FOCUS crawl on lunde.co** (35px/s — `CRAWL_PX_PER_SEC`
   if off) — it's live.
3. **Jake: read the skills research + the TUNE.MODE plan** (both Notion
   task pages) — skills proposes case study #3 (agent supervision) +
   CUTS.APP; TUNE.MODE has 4 open questions (public INSPECT? PR vs main?
   Motion+? own program?).
4. **Jake rulings owed:** install the 4 hooks? · shelf live smoke + copy
   rewrite pass · Family Hub walk.
5. **The Desk** — next flagship (r3f ruling stands; Blender refs incoming).
6. Cleanup: delete merged branches (`cv-exe`, `suggestion-box`,
   `case-family-hub`, `worktree-cc-v2-pipeline`, `medieval-sfx*` on
   confirm) · `family-hub 2/` dup.
7. Carried: gate friction elsewhere · COMMAND.CTR zero-`list()` + cost
   read · replay-your-session task · Figma stale STRING vars · typography
   finale · underwater · eyeball tracker v2 / leaf-patch call.
