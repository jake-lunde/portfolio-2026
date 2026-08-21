# HANDOFF — code-adjacent invariants (near-static by CLAUDE.md §4.4)

> **Prod = `origin/main` HEAD.** Push to main is deploy, so git already
> records what's live — never write prod SHAs here. Verify ships via
> Vercel MCP + a content-marker `curl -sL` (GitHub combined status stays
> "pending" while Chromatic runs; ~1min CDN lag; apex 308s to www).
> **Current state · session narrative · debts → jaique vault**:
> `Atlas/Maps/LUNDE OS Map.md`, Current state box (law CLAUDE.md §3.6).
> This file is the ONLY handoff cloud sessions can read — invariants
> only, keep every line true; session narrative never returns here
> (rotated blocks: `HANDOFF-ARCHIVE.md`).
> Jake's ideas doc (Drive "Portfolio 2026 / Updates and Ideas"): re-read
> at session start, his freshest silent edits are his real priorities.

## Invariants

- **Live:** https://lunde.co — Vercel `portfolio-2026`, team `lunde-os`.
- **⚠️ Shared-checkout law:** no concurrent sessions on one working
  tree; `git branch --show-current` before EVERY commit; worktrees are
  the pattern; leave the main checkout on main.
- **Branch law (Jake, s31):** every feature starts on its own branch;
  main takes only reviewed, ship-ready commits — it must stay shippable
  on short notice.
- **Build law:** dev server and `npm run build` share `.next` —
  `preview_stop → build → preview_start`; corruption → `rm -rf .next`.
- **AI chat guardrails:** blob counter `AI_CHAT_DAILY_MAX` (250) ·
  per-IP 20/day · 8-msg cap · 5s cooldown · kill switch `AI_CHAT_OFF` ·
  backstop = workspace spend limit (vault task). `/machine` 307→`/readme`.
- **Token commit route:** `/api/token-commit` → branch `inspect-tune`,
  stacking PRs; gate = CI `tokens-sync.yml`. `GITHUB_COPY_TOKEN` scopes
  fixed 2026-08-21 (unverified until the first real SAVE).
- **Hooks:** harness in `.claude/settings.json` — SessionStart §4.1
  reminder; PreToolUse blocks generated edits, forbidden commits,
  prettier. Git in `.githooks/`, wired by npm `prepare` (by hand:
  `npm run hooks:install`) — post-merge/post-checkout rebuild
  `figma-plugin/dist`, and a bundle behind the branch blocks its PULL.
- **Skins & copy:** classic (light/dark) + medieval live; underwater
  stub. Copy layer live — merge `copy.json` at KEY level; never
  force-push: live copy edits are a per-pick affordance in INSPECT's
  inspector (COPY block) and still commit straight to main under you.
