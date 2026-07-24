# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-24 (session 23).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`;
  push to main = deploy; verify via Vercel MCP + content-marker curl —
  GitHub status stays "pending" while Chromatic runs).
- **Skins:** classic (light/dark, auto-follows OS) + **medieval**
  (parchment/vermilion/gilt, MedievalSharp display+mono, Eagle Lake body,
  hand-inked dataviz). underwater = stub. SkinSwitch flyout in toolbar +
  Settings; `data-skin`/`data-theme` on <html>; per-skin icon art
  (Icon.tsx CSS swap) + vocabulary — now via the copy layer.
- **Copy layer (session 23): LIVE.** `src/content/copy.json` (82 flat
  dot-keys; plain string or `{ base, medieval?, underwater? }`) +
  `copy.ts` (`t()`, `resolveCopy` → displayed slot) + `CopyText.tsx`
  (stamps `data-copy-id`). skinVocab folded in (`program.<id>.name`);
  `programName()` is a thin wrapper, same signature. This is the shared
  foundation for the language-modifier task. NOTE: `Copy.tsx` name is
  forbidden — collides with `copy.ts` on case-insensitive FS.
- **EDIT.MODE (SYS-99): SHIPPED, inert until env vars.** Hidden program
  at `/edit`: key gate (`EDIT_MODE_KEY`, timing-safe, sessionStorage) →
  armed mode makes `[data-copy-id]` nodes contentEditable (plaintext),
  accent dirty-highlight, Esc reverts, SAVE.CHANGES panel (portal,
  SPRINGS.deck) → POST `/api/copy-commit` → GitHub Contents API commits
  copy.json to main (`GITHUB_COPY_TOKEN`, `GITHUB_COPY_REPO` optional
  override); baseSha mismatch → 409 rebase + re-approve. Slot targeting
  is skin-aware via `resolveCopy`. Commit msgs: `COPY: EDIT.MODE — n keys`.
- **Type system: ADOPTED** (session 22): semantic ramp bound at 166
  sites; TOKEN BRIDGE aliases to core primitives. ⚠️ before next Figma
  PULL: delete stale STRING `core/leading|tracking|weight` vars.
- **DS pipeline:** `tokens/` (3-tier) → `scripts/build-tokens.mjs` →
  generated CSS/TS; TOKEN BRIDGE plugin PULL/PUSH; Chromatic; Storybook
  (SB10+Webpack).
- **Tracking:** Notion (connector live); COMMAND.CTR deck via
  `scripts/cc-report.mjs` (`set -a; source .env.local; set +a` first —
  plain `source` doesn't export).
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf
  pass overdue; underwater everything.

## Latest session — EDIT.MODE: copy layer + in-situ editor (session 23, 2026-07-24)

**Fable orchestrating; NYQUIST(sweep) + FOURIER(program+API) parallel, disjoint
files. Shipped 1f39a8c.** Contract (copy.json/copy.ts/CopyText.tsx) written by
orchestrator first = the seam; both agents built against it, zero conflicts.
- Live-verified end-to-end (JS probes): auth matrix (401/200/501), arm, in-place
  edit, dirty rows, Esc revert (window-close suppressed), medieval slot
  targeting (`Oubliette → The Pit` wrote slot `medieval`), token-missing SAVE
  lockout. Fixed live-found bug: stale `data-edit-old` across skin switch.
- Casing landmine: `Copy.tsx` vs `copy.ts` — bundler resolution tries `.ts`
  first on case-insensitive FS; component renamed `CopyText.tsx`.
- **Jake to go live:** Vercel env → `EDIT_MODE_KEY` (pick a key) +
  `GITHUB_COPY_TOKEN` (fine-grained PAT, contents RW on portfolio-2026).
  A placeholder local dev key sits in .env.local (read it there; rotate at will).
- Unverified live: Safari caret on transformed windows; real GitHub commit
  round-trip (coded + reviewed, token was absent locally by design).

## Next steps

1. **Jake:** set the two Vercel env vars above → try `/edit` on lunde.co; first
   real commit round-trip + Safari caret check.
2. **Figma:** stale STRING vars deletion + PULL verification (carried from s22).
3. Typography fluid finale: MODE axis for clamp() sizes; per-skin font-family
   override on text styles.
4. Language modifier can now build on `t(key, skin)`. Prior: interactive/status
   sweep; underwater; Weavy probe.
