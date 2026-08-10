# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-09 (s41 note → archive; s42 note below).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; apex 308s to www — curl -L).
  **Production = INSPECT.MODE (merge 7263e42, live-verified 2026-08-09)
  on top of README focus-ticker + SHIPPED.SW + COMMAND.CTR v2.**
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
- **INSPECT.MODE (TUNE.MODE phase 0) SHIPPED** (Jake: "merge it and ship
  it!!"; merge `7263e42`, deploy READY, marker-curl verified; branch
  deleted). Public read-only token
  x-ray: SYS-21, `rings` desktop icon, `/inspect`; SCAN or alt-click →
  LAYERS chain · TOKENS (real var() provenance off CSSOM cssText, tier
  chips, core-law warnings) · size-aware CONTRAST grade · TYPE · MOTION
  via `data-spring` tags (27 sites, all 8 springs). New infra:
  `tokens.generated.ts` manifest (199 props → tier; build fails loud on
  cross-theme tier collisions — caught `--display/--sans/--mono` mis-tiered
  core). DOPPLER audit: 13 findings, all fixed. Probe-verified + prod
  build green. Panel already flagged real debt: menubar hairline (core)
  + dead `--wash-x`. TUNE.MODE phases 1–2 (token nudge + commit · SPRING
  scrub) still open — questions 2–4 in the Notion task.
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

## Latest session — INSPECT.MODE PHASE 0 (s42, 2026-08-09)

**Jake ruled question 1 by acclamation ("it is a designer flex!! build
it") → INSPECT.MODE is public + on the desktop. Built, audited, verified;
on branch per s31 law.**

- **Build (NYQUIST worktree → my review):** `src/lib/inspect.ts` engine +
  InspectMode program + `tokens.generated.ts` emit in build-tokens.mjs +
  `data-spring` at 27 sites. 3 commits: build `81edaa3` → CRT-ink fix
  `e94988a` → DOPPLER fixes `34661ba`.
- **DOPPLER audit paid for itself twice:** (1) tier merge let classic
  outvote medieval — the panel would have publicly accused ~90 legal
  `--sans/--mono/--display` uses; (2) `style.item()` never enumerates
  var()-bearing shorthands — ~440 declarations (background/border/gap)
  were invisible until the walk moved to `cssText`. Also: @container
  leaked closed conditions; own injected sheet self-reported; AA·LG was
  size-blind. All fixed.
- **CRT ink rule learned** (memory + archive): crt bodies paint
  `--surface-inverse` with NO token re-scope — on-body text must be
  `--content-inverse`; EDIT.MODE only dodges it via muted/accent/fills.
- Verified: headless_shell CDP probes (arm/hover/pick/exempt/Escape/
  teardown, zero leftovers, console clean), light + dark shots,
  tokens:doctor at baseline, tsc + prod build green.
- Phase-0 debts (Notion task): no keyboard path to a FIRST pick ·
  @container skipped not evaluated · data-spring reports authored intent
  under reduced-motion · nested data-skin pick = probe burst.
- Concurrent-session note: s41 rotated HANDOFF mid-session; laws held
  (worktrees, branch check before commit, main stayed on main).

## Next steps

1. **Jake: read `feat/ai-chat`** — card copy voice + chat feel (checkout
   the branch, `/readme` then `/ai`), then merge call. After merge: create
   a dedicated Anthropic workspace + spend-capped key, add
   `ANTHROPIC_API_KEY` to Vercel env to light the composer.
2. **Jake: play with INSPECT.MODE on lunde.co** — it's live; hit SCAN
   and click the menubar (it catches a real hairline violation).
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
