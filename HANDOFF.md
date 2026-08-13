# HANDOFF — current state (code-adjacent only; rotates per CLAUDE.md §4.4)

> **Projects · tasks · rulings live in the jaique vault** —
> `/Users/jake/jaique`, start at `Atlas/Maps/LUNDE OS Map.md`
> (law: CLAUDE.md §3.6). Notion is RETIRED (s49). Session notes: vault
> `Calendar/Notes/`. Older HANDOFF notes: `HANDOFF-ARCHIVE.md`. Jake's
> ideas doc (Google Drive "Portfolio 2026 / Updates and Ideas") — re-read
> at session start; his freshest silent edits are his real priorities.

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`;
  push to main = deploy; verify via Vercel MCP + content-marker `curl -sL`
  — GitHub status stays "pending" while Chromatic runs; apex 308s to www).
  **Production = s52 VHS SIGNAL (`21ef552`) on s51 deck zero-list + s46
  token commit route + s44 misc quartet + INSPECT + ASK MY AI + SHIPPED.SW.**
- **PR #7 MERGED `cb48868` (s48 storybook catalog):** ruling boards on
  main; Wave 2 = settings-store decorator (vault: "rule the PR 6 ledger").
- **⚠️ Shared-checkout law:** no concurrent sessions on one working tree;
  `git branch --show-current` before EVERY commit; worktrees are the
  pattern; leave the main checkout on main.
- **Build law:** dev server and `npm run build` share `.next` —
  `preview_stop → build → preview_start`; corruption → `rm -rf .next`.
- **AI chat guardrails:** daily blob counter `AI_CHAT_DAILY_MAX` (250) ·
  per-IP 20/day · 8-msg session cap · 5s cooldown (per-instance,
  accepted) · kill switch `AI_CHAT_OFF` · true backstop = workspace spend
  limit (Jake-confirm task in vault). Dep: `@anthropic-ai/sdk`.
  `/machine` 307→`/readme`.
- **Token commit route:** `/api/token-commit` → fixed branch
  `inspect-tune`, stacking PRs; merge gate = CI `tokens-sync.yml`
  (doctor --strict --parity). Blocked on `GITHUB_COPY_TOKEN` needing
  Pull requests:write + Issues:write (vault task).
- **Harness hooks live:** checked-in `.claude/settings.json` + hooks —
  SessionStart §4.1 reminder; PreToolUse blocks generated-file edits,
  forbidden-path commits, prettier.
- **Skins:** classic (light/dark) + medieval live; underwater stub. Copy
  layer + EDIT.MODE live — merge copy.json at KEY level; never force-push
  (Jake's EDIT.MODE commits land on main under you).
- **Window.tsx shell:** resting `left` clamps on-glass; license phase
  grows window via windows.ts requestSize/releaseSize (exact restore).
- **Known debts:** SpecSheet motion quote-strings · first-load JS perf ·
  `--accent-on-inverse` · reduced-motion by emulation · medieval airbrush
  wash contrast · token-debt leftovers (ruling = vault task) ·
  `family-hub 2/` + `".claude/* 2.*"` dups (Jake deletes).
- **Cleanup owed:** remote deletes Jake must run (classifier blocks
  them): `git push origin --delete case-family-hub suggestion-box
  film-vhs-signal`; `medieval-sfx*` on confirm. Locals swept s50; ~14
  stale merged (`worktree-agent-*`, `blue-update-test`, old `feat/*`)
  await ruling.

## Latest session — S52 VHS SIGNAL (2026-08-13)

- **PR #8 MERGED `21ef552`, LIVE (marker-verified):** CSS-only VHS pass
  on shelf cover films — `.filmVhs` leaf in `.filmWrap` (scanlines + 12s
  tracking roll, transform-only), gated on the film's `data-clear`
  (printed art never dressed; pass-4 no-filter law holds); medieval
  strikes it. Taste dials in shelf.module.css `.filmVhs`. NTSCplayer
  RULED OUT (desktop mpv app, GPL shaders, no license) — look, not code.
- **⚠️ Web Analytics still NEVER ENABLED** (vault: "optimize analytics").
  Session note: vault `Calendar/Notes/2026-08-13 s52.md`. s51 → archive.
