# HANDOFF — current state (code-adjacent only; rotates per CLAUDE.md §4.4)

> **Projects · tasks · rulings: jaique vault** (`/Users/jake/jaique`,
> hub `Atlas/Maps/LUNDE OS Map.md`; CLAUDE.md §3.6). Session notes:
> vault `Calendar/Notes/`; older notes `HANDOFF-ARCHIVE.md`. Jake's
> ideas doc (Drive "Portfolio 2026 / Updates and Ideas") — re-read at
> session start; his freshest silent edits are his real priorities.

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`;
  push to main = deploy; verify Vercel MCP + content-marker `curl -sL` —
  GitHub status stays "pending" under Chromatic; apex 308s to www).
  **Production = s53 VOICE PASS (`0660624`) + s52 VHS + s51 zero-list +
  s46 token route + INSPECT + ASK MY AI + SHIPPED.SW.**
- **⚠️ Shared-checkout law:** one session per working tree; `git branch
  --show-current` before EVERY commit; worktrees are the pattern.
- **Build law:** dev server and `npm run build` share `.next` —
  `preview_stop → build → preview_start`; corruption → `rm -rf .next`.
- **AI chat guardrails:** blob counter `AI_CHAT_DAILY_MAX` 250 · per-IP
  20/day · 8-msg cap · 5s cooldown · kill switch `AI_CHAT_OFF`; backstop
  = workspace spend limit (vault task). `/machine` 307→`/readme`.
- **Token commit route:** `/api/token-commit` → `inspect-tune` stacking
  PRs; gate CI `tokens-sync.yml`; blocked on `GITHUB_COPY_TOKEN` scopes
  (vault task).
- **Harness hooks live:** `.claude/settings.json` — SessionStart §4.1
  reminder; PreToolUse blocks generated edits, forbidden commits, prettier.
- **Skins:** classic (light/dark) + medieval live; underwater stub. Copy
  layer + EDIT.MODE live — merge copy.json at KEY level; never force-push
  (Jake's EDIT.MODE commits land on main under you). EDIT becomes
  INSPECT's third tool when `edit-in-inspect` merges (below).
- **Known debts:** SpecSheet motion quote-strings · first-load JS perf ·
  `--accent-on-inverse` · reduced-motion by emulation · medieval airbrush
  contrast · token-debt leftovers (vault) · `".claude/* 2.*"` dups.
- **Cleanup owed:** Jake runs remote deletes (classifier blocks them):
  `git push origin --delete case-family-hub suggestion-box
  film-vhs-signal`; `medieval-sfx*` on confirm. ~14 stale merged locals
  await ruling.

## Latest session — S57 EDIT X INSPECT (2026-08-14)

- **PR OPEN (`edit-in-inspect`):** EDIT.MODE folded into INSPECT as a
  third tool. `src/programs/editmode/` deleted; engine now
  `inspect/useCopyEditing.ts` + `EditPanel.tsx` (right dock). `/edit` =
  deep link arming the tool (≥900px gate; mobile editing gone, accepted).
  Same `EDIT_MODE_KEY`; verify endpoint throttles 10 fails/hr/IP → 429.
  SOURCE row links case MDX to GitHub's editor (`CaseDef.source`).
  Dev-verified + tsc/build/tests green. Jake merges. Case chrome strings
  stay outside the copy layer — ruling + details in vault s57 note.

## Prior session — S54 FH MEDIA (2026-08-13)

- **PR #9 OPEN (`fh-plate-media`):** Family Hub vision-deck stills +
  Plate 01 `PitchDeck` scroller. Verified dev + mobile, build green.
  Jake merges, then deletes branch + worktree `fh-media`. Plates
  04/05/06/08/10 still placeholders. ⚠️ Local `fh-plate-media` carries
  stray dup commit `1da6d84` (fix already on main as `1d6e9be`) —
  force-delete is safe. Details: vault `2026-08-13 s54.md` + archive.
- **⚠️ Web Analytics still NEVER ENABLED** (vault: "optimize analytics").
  s53 (voice pass, merged `0660624`) → archive.
