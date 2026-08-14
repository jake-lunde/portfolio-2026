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
  **Production = main `6613397`: s56 fig. a strip (PR #10) on s54 FH
  media + s53 voice pass + s52 VHS signal + earlier stack.**
- **⚠️ Shared-checkout law:** no concurrent sessions on one working tree;
  `git branch --show-current` before EVERY commit; worktrees are the
  pattern; leave the main checkout on main.
- **Build law:** dev server and `npm run build` share `.next` —
  `preview_stop → build → preview_start`; corruption → `rm -rf .next`.
- **AI chat guardrails:** blob counter `AI_CHAT_DAILY_MAX` (250) ·
  per-IP 20/day · 8-msg cap · 5s cooldown · kill switch `AI_CHAT_OFF` ·
  backstop = workspace spend limit (vault task). `/machine` 307→`/readme`.
- **Token commit route:** `/api/token-commit` → branch `inspect-tune`,
  stacking PRs; gate = CI `tokens-sync.yml`. Blocked on
  `GITHUB_COPY_TOKEN` scopes (vault task).
- **Harness hooks live:** `.claude/settings.json` — SessionStart §4.1
  reminder; PreToolUse blocks generated edits, forbidden commits, prettier.
- **Skins:** classic (light/dark) + medieval live; underwater stub. Copy
  layer + EDIT.MODE live — merge copy.json at KEY level; never force-push
  (Jake's EDIT.MODE commits land on main under you). EDIT becomes
  INSPECT's third tool when `edit-in-inspect` merges (below).
- **Known debts:** SpecSheet motion quote-strings · first-load JS perf ·
  `--accent-on-inverse` · reduced-motion by emulation · medieval airbrush
  wash contrast · token-debt leftovers (ruling = vault task) ·
  `family-hub 2/` + `".claude/* 2.*"` dups (Jake deletes).
- **Cleanup owed (Jake runs; classifier blocks):** `git push origin
  --delete case-family-hub suggestion-box film-vhs-signal fh-figa-strip`
  (+`medieval-sfx*` on confirm); ~14 stale merged locals await ruling.

## Latest session — S57 EDIT X INSPECT (2026-08-14)

- **PR #11 OPEN (`edit-in-inspect`):** EDIT.MODE folded into INSPECT as
  a third tool. `src/programs/editmode/` deleted; engine now
  `inspect/useCopyEditing.ts` + `EditPanel.tsx` (right dock). `/edit` =
  deep link arming the tool (≥900px gate; mobile editing gone, accepted).
  Same `EDIT_MODE_KEY`; verify endpoint throttles 10 fails/hr/IP → 429.
  SOURCE row links case MDX to GitHub's editor (`CaseDef.source`).
  Dev-verified + tsc/build/tests green. Jake merges. Case chrome strings
  stay outside the copy layer — ruling + details in vault s57 note.

## Prior session — S56 FIG.A STRIP (2026-08-14) — SHIPPED

- **LIVE, main `6613397` (PR #10 + round 2):** Plate 01 stripped;
  annotations in the cap row beside FIG. A (⚠️ Figma MCP export bakes
  canvas gray into node PNGs; REST `/v1/images` + `FIGMA_PAT` keeps
  alpha). CDN-verified. Details: vault s56 note + archive.
- **S54 (PR #9 MERGED `3478b0a`):** FH stills + Plate 01 scrub. Plates
  04/05/06/08/10 still placeholders. Jake owes: delete `fh-plate-media`
  (dup `1da6d84`, force-delete safe) + its worktree.
