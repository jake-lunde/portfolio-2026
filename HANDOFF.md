# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-11 (s46 note → archive; s47 note below).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; apex 308s to www — curl -L).
  **Production = s46 TOKEN COMMIT ROUTE (merge 7e9f07a, 2026-08-11,
  401-marker verified) on top of s44 MISC QUARTET + INSPECT SHELL +
  ASK MY AI + chat anatomy + focus-ticker + SHIPPED.SW.**
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
  fourier task). s44 re-ordered the bar (INSPECT · ♪ · sun/moon · ? ·
  clock) and the glyph swap bought back ~40px of 360 slack — one more
  control fits before something must fold. Original ship record
  (guardrails, spend caps):
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
- **DIAL-IN SHIPPED (Jake: "ship it!"; merge `86dc3fc`, READY, marker
  verified; branch deleted):** menubar toggle text-only · mode hides
  menubar+ticker, docks root-level full-height, accent-flooded CROWN
  header (titlebar idiom, tokened ink — AA 6.6/5.3/5.6 per skin) with
  SELECT/OPERATE toggle (DevTools picker; alt = momentarily the other
  tool) + LGT/DRK + exit ✕. No DOPPLER round (small chrome surface,
  full probe table).
- **MOTION+ RULED: Jake buys it.** Task scoped in Notion ("motion+
  upgrade", P2): law = re-cut in house idiom, values through
  motion.json, reduced-motion gated, data-spring tags; first three =
  window exit choreography · shelf/case shimmer · magnetic icons
  (dialed to 1992); Studio = tuning fork only, never writes components.
- **INSPECT.MODE IS NOW A TOOL MODE (the "INSPECT SHELL"), LIVE** —
  ◎ INSPECT menubar toggle (≥900px) or `/inspect`: desktop compresses to
  a canvas between paper docks — LAYERS tree left (WAI-ARIA, keyboard
  end-to-end, MutationObserver-fresh), INSPECTOR right (engine
  `src/lib/inspect.ts` unchanged: tokens w/ tier chips + core-law
  warnings, size-aware contrast, type, springs). Click picks · dblclick
  drills · ALT+CLICK operates the site · Escape ladder · dialogs exempt +
  above-dock z. LIVE NUDGE: semantic color roles re-alias from core
  PALETTE candidates, AA-judged per theme, inline-on-html preview only
  — and as of s46 SAVE opens a real PR (bullet below). tune.ts is the
  override channel; buildASkin untouched. Window program deleted;
  `/inspect` canonicals to `/readme`. EDIT.MODE mutual exclusion incl.
  disabled toggle state.
- **TOKEN COMMIT ROUTE SHIPPED (s46, merge `7e9f07a`, prod 401-marker
  verified):** `/api/token-commit` — copy-commit's mold (same x-edit-key,
  409 flow) but commits `tokens/semantic/<theme>.json` to fixed branch
  `inspect-tune` and opens/stacks a PR; CI `tokens-sync.yml`
  (doctor --strict --parity) is the merge gate. Editable head = branch
  while its PR is open (second SAVE stacks, never reverts). Server
  validates semantic-color roles (TOKEN_TIERS) + 12 PALETTE candidates
  only — raw hex unreachable. Panel: SAVE → PR (THEME) chip, shared
  arming w/ EDIT.MODE (`lib/editKey`, one sessionStorage slot), AA-fail
  block, PR link, live-region a11y. figma-plugin's GitHub client
  promoted to `src/lib/github.ts` (shared, both builds green).
  **⚠️ Jake: add Pull requests:write + Issues:write to
  GITHUB_COPY_TOKEN** — until then SAVE arms but can't open the PR.
  Editing-modes ledger (modes today · Jake's goals · parity arc:
  motion → type/space → component stage → unification) in Notion task
  "editing modes ledger".
- **HARNESS HOOKS LIVE (s45, merge `5e533cf`):** checked-in
  `.claude/settings.json` + `.claude/hooks/` — SessionStart injects the
  §4.1 dispatch reminder; PreToolUse blocks hand-edits to
  `*.generated.*` token output, forbidden-path commits (§3.3), and any
  prettier run. New sessions inherit them automatically (hooks load at
  session start — running sessions unaffected).
- **Notion research rulings (s40, full writeups in each task page):**
  claude design/DesignSync — SKIP as infra (snapshot not
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
  the checkout .next · `family-hub 2/` + `".claude/* 2.*"` dups (Jake
  deletes). Token debt: PR #6 sweeps core-consumed-raw (155 re-aliases,
  doctor 0 err/30 warn); leftovers = ~70 snap-candidates + kill-list in
  the PR ledger, awaiting Jake's ramp ruling.

> s43b addendum (2026-08-10, the ai-chat session): chat-feed choreography
> + DOPPLER chat + fable mark all shipped (merges `e295bc9`), branches
> deleted, worktrees cleaned. Entry-point task Done (menu-bar mark + deck
> wire chosen over desktop tile/clippy — options in the task page);
> fourier "agents are clickable" framework developed + phased in its task.
> Next in that arc: P1 canned mini-chats for HERTZ/NYQUIST/FOURIER.

## Latest session — S47 TOKEN DEBT SWEEP: THE PRIMITIVES GO HOME (2026-08-11)

**Handoff item 3, the scoped P1 (Notion "token debt sweep") → PR #6
open, awaiting Jake's merge + ledger rulings. Fable orchestrating;
4 Sonnet patch crews (disjoint module families) + 1 Opus tokens crew;
deck reported throughout. Zero-visual-change law held.**

- **Doctor 2→0 errors, 51→30 warnings.** Both errors were misdiagnoses:
  `--print-t` = doctor blind spot (TSX inline declarations — D6 now
  scans them); `--wash-x` = undeclared knob (now `0%` beside
  `--wash-turn`). The 18 `--spring-*` "dead" warnings were false too:
  `inspect.ts springFor()` reads them via `getPropertyValue`, invisible
  to the var() grep — documented D6 allowlist, emission kept (killing
  it would have silently degraded INSPECT.MODE).
- **155 value-identical re-aliases across 21 modules** (5 commits, one
  per family): space→spacing-component/layout by context ·
  hairline/thin/thick→subtle/default/strong · radius-md/full→
  control/circle · radius-none→0 · prose leading-relaxed→leading-body ·
  exact-match type-role adoptions. Verified by a mechanical diff audit
  (every -/+ pair vs the mapping table) + parity 597/3/0/0 + 50/50
  tests + prod build. Chromatic on the PR is the final visual gate.
- **New legislation:** semantic `border-width.subtle` (1px; ramp subtle<
  default<strong) · tier relocations, names unchanged: `duration.*`
  core→semantic, `menubar-h` core→component (they were role-named
  tokens misfiled as primitives — INSPECT graded every honest use a
  violation).
- **The ledger is in the PR body — Jake's rulings:** ~70 snap-candidates
  (mono UI text one step off its role tracking — rule the ramp, next
  pass is mechanical) · case `.statBig`/`.section h2` near display/
  heading-1 · kill-list recs (kill font-size-sm/md, duration-slow,
  radius-none, text-body[=17px, surprise]; keep type sub-tokens +
  status/interactive color roles + spacing-layout-xl) · `--space-5`
  needs a role or a blessing.
- Follow-ups: next Figma pull moves relocated vars between collections
  (re-bind); stale comment figma-plugin/src/tokens.ts:145; semantic
  tier now holds literal durations (precedent exists) — deliberate
  call later; untracked `".claude/* 2.*"` dup files = macOS artifacts,
  Jake deletes.

## Next steps

1. **Jake: walk ASK MY AI on lunde.co** — `/readme` foot → bubble → cards
   + a live question; eyeball the typewriter motion (never seen on a
   visible tab) and the card voice. **Confirm the workspace spend limit
   is set in the Anthropic console** — it's the only unhackable guard.
2. **Jake: drive the finished INSPECT SHELL on lunde.co** — INSPECT in
   the menubar; crown + SELECT/OPERATE are live. **Jake: buy Motion+**
   (his account) → then run the motion+ task (Notion, P2).
3. **Jake: merge PR #6 (token debt sweep) + rule its ledger** —
   https://github.com/jake-lunde/portfolio-2026/pull/6 — Chromatic diff
   should be EMPTY (zero-change law); rulings owed: snap-candidates ramp,
   kill-list, --space-5. Notion task → In review.
4. **Jake: add Pull requests:write + Issues:write to GITHUB_COPY_TOKEN**
   (Vercel env) — the inspector's SAVE can't open PRs without them —
   then nudge a color on lunde.co and merge your first `inspect-tune` PR.
5. **Jake: feel the FOCUS crawl on lunde.co** (35px/s — `CRAWL_PX_PER_SEC`
   if off) — it's live.
6. **Jake: read the skills research + the TUNE.MODE plan** (both Notion
   task pages) — skills proposes case study #3 (agent supervision) +
   CUTS.APP; TUNE.MODE questions 2–4 still open (token commits PR vs
   main? Motion+? — question 1 answered, phase 0 built).
7. **Jake rulings owed:** shelf live smoke + copy rewrite pass · Family
   Hub walk.
8. **The Desk** — next flagship (r3f ruling stands; Blender refs incoming).
9. Cleanup: delete merged branches (`cv-exe`, `suggestion-box`,
   `case-family-hub`, `worktree-cc-v2-pipeline`, `medieval-sfx*` on
   confirm) · `family-hub 2/` dup.
   **Jake: eyeball s44 on lunde.co** — RESUME.EXE's feeding paper (the
   feel dial is TICKS/TICK_MS in CV.tsx), the glyph bar, the mobile
   deck card.
10. Carried: gate friction elsewhere · COMMAND.CTR zero-`list()` + cost
   read · replay-your-session task · Figma stale STRING vars · typography
   finale · underwater · eyeball tracker v2 / leaf-patch call.
