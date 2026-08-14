# HANDOFF — current state (code-adjacent only; rotates per CLAUDE.md §4.4)

> **Projects · tasks · rulings → jaique vault** (`/Users/jake/jaique`,
> start `Atlas/Maps/LUNDE OS Map.md`; law CLAUDE.md §3.6). Notion RETIRED.
> Session notes: vault `Calendar/Notes/`; older notes `HANDOFF-ARCHIVE.md`.
> Jake's ideas doc (Drive "Portfolio 2026 / Updates and Ideas") — re-read
> at session start; his freshest silent edits are his real priorities.

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`;
  push to main = deploy; verify via Vercel MCP + content-marker `curl -sL`
  — GitHub status stays "pending" while Chromatic runs; apex 308s to www).
  **Production = main `fcdffa4`: s54 FH media + pitch scrub (PR #9
  merged) on s53 voice pass + s52 VHS signal + earlier stack.**
- **⚠️ Shared-checkout law:** no concurrent sessions on one working tree;
  `git branch --show-current` before EVERY commit; worktrees are the
  pattern; leave the main checkout on main.
- **Build law:** dev server and `npm run build` share `.next` —
  `preview_stop → build → preview_start`; corruption → `rm -rf .next`.
- **AI chat guardrails:** blob counter `AI_CHAT_DAILY_MAX` (250) ·
  per-IP 20/day · 8-msg cap · 5s cooldown · kill switch `AI_CHAT_OFF` ·
  true backstop = workspace spend limit (Jake-confirm task in vault).
  Dep: `@anthropic-ai/sdk`. `/machine` 307→`/readme`.
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
- **Cleanup owed (Jake runs; classifier blocks):** `git push origin
  --delete case-family-hub suggestion-box film-vhs-signal`
  (+`medieval-sfx*` on confirm); ~14 stale merged locals await ruling.

## Latest session — S56 FIG.A STRIP (2026-08-14)

- **PR #10 OPEN (`fh-figa-strip`):** Plate 01 stripped — nine pitch
  groups re-exported transparent at 2x (⚠️ Figma MCP asset export bakes
  the canvas gray into node PNGs; use REST `/v1/images` + `FIGMA_PAT`
  for alpha). Deck annotations now live text in the plate cap row beside
  FIG. A (slow ticker + 18px edge fades on overflow; reduced-motion
  safe); intro group keeps baked text. Deck #000 box gone; `Plate.cap`
  is ReactNode; PitchDeck renders its own Plate; carousel reports its
  slide. Verified desktop + mobile probes; build green. Note: vault
  `2026-08-14 s56.md`. Flag: "it's morning state" typo is deck-verbatim.
- **⚠️ Stranded working-tree edit:** family-hub.mdx hero meta (role /
  partners / GLOW DS wording) changed under the session, uncommitted on
  the `fh-figa-strip` checkout — Jake routes it (branch or main).

## Prior session — S54 FH MEDIA (2026-08-13)

- **PR #9 MERGED (`3478b0a`):** FH moves 1–3 stills + Plate 01 scrub.
  Plates 04/05/06/08/10 still placeholders. Jake owes: delete
  `fh-plate-media` (stray dup `1da6d84` — force-delete safe) + worktree
  `.claude/worktrees/fh-media`. Note: vault s54. s53 → archive.
