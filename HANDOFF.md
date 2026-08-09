# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-09 (s39b SHIPPED.SW note → archive; s40 note below).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; apex 308s to www — curl -L).
  **Production = SHIPPED.SW (merge 009d1f9) on top of COMMAND.CTR v2.**
- **⚠️ Shared-checkout law: no concurrent sessions on one working tree;
  `git branch --show-current` before EVERY commit.** Another session's
  worktree (`minors-random-wallpaper`) was live during s40 — worktrees are
  the pattern; leave the main checkout on main.
- **`feat/readme-focus-ticker` (`d8a15e6`) AWAITS JAKE'S READ — not merged.**
  README.TXT FOCUS line crawls like the skills ticker (35px/s, ✦ seam,
  overflow-gated, reduced-motion static+ellipsis, EDIT.MODE parks it,
  ghost aria-hidden). Live-verified in dev server s40 (34.8px/s measured,
  no CLS, console clean). Speed dial: `CRAWL_PX_PER_SEC` in About.tsx.
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

## Latest session — NOTION SWEEP: four tasks, three answers, one crawl (s40, 2026-08-09)

**Jake away ("have fun"); Fable orchestrated 4 parallel agents off the
Notion board. Deck reported dispatch→returns throughout.**

- **README.TXT ticker** (NYQUIST, worktree): FocusLine component in
  About.tsx + programs.module.css — details in Current state above.
  Verified by switching main checkout to the branch (other session's
  worktree made in-worktree verify impossible: no node_modules), dev
  server + JS probes, then restored to main. Agent worktree left detached
  at `d8a15e6`; branch preserved.
- **Research written into Notion task pages** (hooks · claude design ·
  skills — see rulings above). All three marked Done; readme task checked
  off but held for Jake's merge call.
- **Skills research is the artifact Jake should read first**: 53 postings
  pulled API-direct + Lenny-archive operator quotes; ranked gap analysis;
  "if you only do three" = agent-supervision case study #3, CUTS.APP +
  measurement beats, design-law-as-agent-skill over MCP.
- Flags: lint unusable repo-wide (no eslint config — `next lint` drops to
  interactive prompt; pre-existing) · `/readme` deep link didn't open the
  window in the preview pane (window appeared only after icon
  double-click — possibly hidden-tab rAF freeze, possibly real; check on
  a visible tab before treating as a bug).

## Next steps

1. **Jake: read + merge call on `feat/readme-focus-ticker`** (crawl feel:
   35px/s — one dial if off).
2. **Jake: read the skills research** (Notion task page) — it proposes
   case study #3 (agent supervision) and CUTS.APP; both fit the APPLY push.
3. **Jake rulings owed:** install the 4 hooks? · claude design trial or
   skip-and-close · shelf live smoke + copy rewrite pass · Family Hub walk.
4. **The Desk** — next flagship (r3f ruling stands; Blender refs incoming).
5. Cleanup: delete merged branches (`cv-exe`, `suggestion-box`,
   `case-family-hub`, `worktree-cc-v2-pipeline`, `medieval-sfx*` on
   confirm) · `family-hub 2/` dup.
6. Carried: gate friction elsewhere · COMMAND.CTR zero-`list()` + cost
   read · replay-your-session task · Figma stale STRING vars · typography
   finale · underwater · eyeball tracker v2 / leaf-patch call.
