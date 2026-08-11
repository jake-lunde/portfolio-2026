# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-11 (s45 note → archive; s46 note below).

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
  the checkout .next · `family-hub 2/` dup dir (Jake deletes).

> s43b addendum (2026-08-10, the ai-chat session): chat-feed choreography
> + DOPPLER chat + fable mark all shipped (merges `e295bc9`), branches
> deleted, worktrees cleaned. Entry-point task Done (menu-bar mark + deck
> wire chosen over desktop tile/clippy — options in the task page);
> fourier "agents are clickable" framework developed + phased in its task.
> Next in that arc: P1 canned mini-chats for HERTZ/NYQUIST/FOURIER.

## Latest session — S46 TOKEN COMMIT ROUTE: THE INSPECTOR FILES PAPERWORK (2026-08-11)

**Handoff item 4 → shipped same session (Jake: "lets fuckin jam").
Opus implementer + DOPPLER audit, Fable orchestrating; merge `7e9f07a`,
branch deleted, deck reported throughout.**

- Route + SAVE UI as the current-state bullet describes. DOPPLER round:
  2 HIGH (stacking revert — fixed via editable-head; `$description`
  deletion on re-alias — fixed, diffs are one line again) + 4 MEDIUM
  (chip invisible in classic-dark: `--content-inverse` ≡ `--content`
  there, swapped to surface-on-content 15:1; prLink AA; live-region +
  focus drops; discarded 409 body → one-shot retry) — all fixed.
  Security surface verified clean: no injection path (role regex + tier
  + palette allowlists), no secret echo, tree confined to the one theme
  file.
- **Deviation from the Notion sketch, Jake-blessed by merge:** doctor
  `--strict` gate runs in CI on the PR (tokens-sync.yml pre-existed),
  not server-side pre-commit — the sketch predates the PR ruling.
- Verified live pre-merge: prod build green, 50/50 tests (25-case pure
  tokenEdit suite added), full UI chain driven on dev (pick → re-cast
  → save row → wrong-key reject w/ focus kept → RESET ALL clean);
  route ladder curl-proven 401/401/501.
- Jake's design Qs answered in-chat and captured in the Notion "editing
  modes ledger" task: re-cast = remapping semantic→core (yes); no
  minting roles from the panel (legislation, not value edit); type/space
  extend via the same mechanic; component-isolation stage + mode
  unification are unscoped ideas awaiting his want.

## Next steps

1. **Jake: walk ASK MY AI on lunde.co** — `/readme` foot → bubble → cards
   + a live question; eyeball the typewriter motion (never seen on a
   visible tab) and the card voice. **Confirm the workspace spend limit
   is set in the Anthropic console** — it's the only unhackable guard.
2. **Jake: drive the finished INSPECT SHELL on lunde.co** — INSPECT in
   the menubar; crown + SELECT/OPERATE are live. **Jake: buy Motion+**
   (his account) → then run the motion+ task (Notion, P2).
3. **Token debt sweep — Jake is spinning up a fresh session for it:**
   scoped P1, brief + ledger method in Notion →
   https://app.notion.com/p/3b8d29ee9854810399d8c387686eab5c —
   re-alias core-consumed-raw, adopt/kill the 54 dead tokens, doctor→0.
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
