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
- **Copy layer: LIVE.** `copy.json` (91 flat dot-keys; plain string or
  `{ base, medieval?, underwater? }`) + `copy.ts` (`t()`, `resolveCopy`) +
  `CopyText.tsx` (stamps `data-copy-id`); `program.<id>.name` carries skin
  vocabulary. NOTE: `Copy.tsx` is a forbidden filename — collides with
  `copy.ts` on a case-insensitive FS.
- **EDIT.MODE (SYS-99): SHIPPED, inert until env vars.** `/edit`: key gate
  (`EDIT_MODE_KEY`, timing-safe) → `[data-copy-id]` nodes contentEditable,
  Esc reverts, SAVE → `/api/copy-commit` → GitHub Contents API commits
  copy.json to main (`GITHUB_COPY_TOKEN`); baseSha mismatch → 409 rebase.
  Slot targeting is skin-aware. Commits: `COPY: EDIT.MODE — n keys`.
- **Type system: ADOPTED** (session 22): semantic ramp bound at 166
  sites; TOKEN BRIDGE aliases to core primitives. ⚠️ before next Figma
  PULL: delete stale STRING `core/leading|tracking|weight` vars.
- **DS pipeline:** `tokens/` (3-tier) → `scripts/build-tokens.mjs` →
  generated CSS/TS; TOKEN BRIDGE plugin PULL/PUSH; Chromatic; Storybook
  (SB10+Webpack).
- **Tracking:** Notion (connector live); COMMAND.CTR deck via
  `scripts/cc-report.mjs` (`set -a; source .env.local; set +a` first —
  plain `source` doesn't export).
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf pass
  overdue; underwater everything. `viz.module.css` + `studio.module.css` both
  pin `--accent: #5c7cff` for the always-dark CRT plate — wants a real
  `--accent-on-inverse` role. Medieval Studio maps `--accent` to the gilt
  expressive accent (vermilion is 2.5:1 on the ember plate), so the two
  accents collapse to one there. New In Progress + machine chrome strings are
  plain literals, not copy keys.

## Latest session — iPod STUDIO · ABOUT.MACHINE · IN.PROGRESS (session 24, 2026-07-26)

**Fable orchestrating; three parallel agents on disjoint files (FOURIER=iPod,
NYQUIST=machine, FOURIER-2=tracker); seam — registry entry + copy keys +
`cases.ts` progress — written by the orchestrator first. Zero conflicts.**
- **STUDIO = iPod video.** LCD (status / `n of N` / art / song·artist·album
  parsed from manifest titles / negative remaining) over a click wheel: four
  radial `<button>` zones + SELECT, plus rotational drag (24° detents →
  `sfx.tap()`, 540° volume sweep). Songs ←MENU— Now Playing —SELECT→
  Visualizer; canvas DSP moved intact to `Visualizer.tsx`, palette now via
  `getComputedStyle`. Medieval = 8-spoke wooden wheel; zones don't move.
- **ABOUT.MACHINE** → System 7 "About This Macintosh": identity block,
  `Total Memory 4,096K / Largest Unused Block 512K`, five bars reconciling
  exactly (1152+896+768+640+128 = 3,584 = 4,096−512), widths derived from the
  numbers. Essay + old SPECS behind a disclosure — content 340px, was ~2,000.
- **IN.PROGRESS (WIP-15)**, `/progress`: an OS 9 installer that never finishes.
  Aggregate bar (mean pct = 50%), per-case bars, ENCOURAGE → `POST /api/nudge`
  (blob, guestbook OIDC pattern, one per case per session). **Notification =
  optional `NUDGE_WEBHOOK_URL`**, Slack/Discord/ntfy `{text}`, silent if unset.
- **Live-found, fixed:** (1) `--pod-w: min(300px, 100%)` also fed heights — a
  `%` in a custom property resolves against the *matching axis*, collapsing the
  device to 72px tall; now `100vw`-based. (2) machine's disclosure collapsed
  only once Motion ran, so SSR shipped it expanded (CLS); closed height now in
  CSS. (3) machine bar column 96px → `minmax(150px, 1.15fr)`, own row <400px.
- Verified: contrast both dark plates (accent 5.41:1 / 5.75:1 medieval), 360px
  zero overflow ×3, screen nav, `/api/nudge` degraded shape. Preview pane
  reports a **0×0 viewport** — force `resize_window {w,h}` before believing
  any measurement (details in the pane memory).

## Next steps

1. **Jake — three env vars:** `EDIT_MODE_KEY` + `GITHUB_COPY_TOKEN` (carried
   from s23, still unset) and the new optional `NUDGE_WEBHOOK_URL`.
2. **Eyeball what probes can't judge:** wheel feel at 24°/540° under a thumb,
   medieval spoke weights at 204px, LCD type at 8–13px, pane-exit transitions.
3. **Title inconsistency, Jake's call:** README *Staff Product Designer* vs
   ABOUT.MACHINE *Design Lead* vs tracker *Senior Design Lead*. Left as-is.
4. **Figma:** stale STRING vars deletion + PULL verification (carried s22).
5. Typography fluid finale: MODE axis for clamp(); per-skin font-family on
   text styles. Then: language modifier on `t(key, skin)`; underwater; Weavy.
