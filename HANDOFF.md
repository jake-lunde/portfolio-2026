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
  **Production = s46 TOKEN COMMIT ROUTE (`7e9f07a`) on s44 MISC QUARTET +
  INSPECT SHELL + ASK MY AI + chat anatomy + focus-ticker + SHIPPED.SW.**
- **PR #7 MERGED `cb48868` (s48 storybook catalog, waves 1+1.5,
  build-153 rulings in `7f533bd`):** TypeRamp/SnapFinder ruling boards
  now on main; Wave 2 = settings-store decorator (ruling sequence:
  vault task "rule the PR 6 ledger").
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
- **Cleanup owed:** remote deletes Jake must run (classifier blocks them
  for Claude): `git push origin --delete case-family-hub suggestion-box`.
  `medieval-sfx*` still on confirm. Locals `cv-exe`/`case-family-hub`
  swept s50; `worktree-cc-v2-pipeline` was already gone. ~14 more stale
  merged locals (`worktree-agent-*`, `blue-update-test`, old `feat/*`)
  await Jake's ruling.

## Latest session — S50 VAULT SHAKEDOWN (2026-08-12)

First task run through the vault. Family Hub binary pull re-attacked
from 3 new angles (MCP fetch/download-attachment/raw API) — all dead,
findings in the task note; verdict stands: Jake hand-pulls (still blocks
Notion trash). Branch sweep: locals `cv-exe`+`case-family-hub` deleted
(remote deletes → Jake, see Cleanup owed). Vault workflow verdict +
friction notes: vault `Calendar/Notes/2026-08-12 s50.md`. s49 summary →
HANDOFF-ARCHIVE.
