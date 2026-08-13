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
  **Production = s53 VOICE PASS (`0660624`) on s52 VHS signal + s51 deck
  zero-list + s46 token commit route + INSPECT + ASK MY AI + SHIPPED.SW.**
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
- **Token commit route:** `/api/token-commit` → branch `inspect-tune`,
  stacking PRs; gate = CI `tokens-sync.yml`. Blocked on
  `GITHUB_COPY_TOKEN` scopes (vault task).
- **Harness hooks live:** `.claude/settings.json` — SessionStart §4.1
  reminder; PreToolUse blocks generated edits, forbidden commits, prettier.
- **Skins:** classic (light/dark) + medieval live; underwater stub. Copy
  layer + EDIT.MODE live — merge copy.json at KEY level; never force-push
  (Jake's EDIT.MODE commits land on main under you).
- **Known debts:** SpecSheet motion quote-strings · first-load JS perf ·
  `--accent-on-inverse` · reduced-motion by emulation · medieval airbrush
  wash contrast · token-debt leftovers (ruling = vault task) ·
  `family-hub 2/` + `".claude/* 2.*"` dups (Jake deletes).
- **Cleanup owed:** remote deletes Jake must run (classifier blocks
  them): `git push origin --delete case-family-hub suggestion-box
  film-vhs-signal`; `medieval-sfx*` on confirm. Locals swept s50; ~14
  stale merged (`worktree-agent-*`, `blue-update-test`, old `feat/*`)
  await ruling.

## Latest session — S54 FH MEDIA (2026-08-13)

- **PR #9 OPEN (`fh-plate-media`):** Family Hub moves 1–3 vision-deck
  stills + Plate 01 `PitchDeck` scroller (nine Figma groups, one 825px
  canvas; deck footer live-coded; #000 slide fill sampled from frame).
  Verified dev + mobile, build green, voice pass merged on top.
  Classifier blocks `gh pr merge` — Jake merges, then deletes branch +
  worktree `.claude/worktrees/fh-media`. Plates 04/05/06/08/10 still
  placeholders. Note: vault `2026-08-13 s54.md`.

## Prior session — S53 VOICE PASS (2026-08-13)

- **voice-pass MERGED `0660624`:** `VOICE.md` (repo root) is LAW for every
  written word on the site + agent chat with Jake (machine caps included);
  CLAUDE.md §2 points at it. Both case MDX reworded; copy.json
  de-em-dashed. Rulings: truth over punch; "green light" banned; survey
  quotes verbatim. Debt: hardcoded program strings still pre-voice.
- **⚠️ Web Analytics still NEVER ENABLED** (vault: "optimize analytics").
  Session note: vault `Calendar/Notes/2026-08-13 s53.md`. s52 → archive.
