# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-26 (session 25).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs).
- **Skins:** classic (light/dark, follows OS) + **medieval** (parchment/
  vermilion/gilt, MedievalSharp display+mono, Eagle Lake body, hand-inked
  dataviz). underwater = stub. SkinSwitch in toolbar + Settings;
  `data-skin`/`data-theme` on `<html>`; per-skin icon art (Icon.tsx CSS swap)
  + vocabulary via the copy layer.
- **Shell architecture:** the desktop is CONSOLIDATED to 10 icons (README ·
  CASE STUDIES · ABOUT THIS MACHINE · GUESTBOOK · MUSIC · FUN · FEEDBACK ·
  SPEC SHEET · SETTINGS · TRASH). `onDesktop: false` means "in a drawer or
  behind a widget", never unreachable — deep links still work. Three window
  kinds via `chrome`: `paper`, `crt`, **`bare`** (no titlebar/grip; the program
  draws its own housing and closes itself — see the iPod — and reaches the
  frame through `components/shell/windowChrome.tsx`). Drawers are declarative:
  `folder: [ids]` on a registry entry + `programs/folder/Folder.tsx`. Inactive
  windows recede via `filter: opacity(.3)` — **`filter`, not `opacity`, because
  Motion owns the inline `opacity`** for open/close and inline beats CSS.
- **Copy layer: LIVE.** `copy.json` (98 flat dot-keys; plain string or
  `{ base, medieval?, underwater? }`) + `copy.ts` (`t()`, `resolveCopy`) +
  `CopyText.tsx` (stamps `data-copy-id`); `program.<id>.name` carries skin
  vocabulary. NOTE: `Copy.tsx` is a forbidden filename — collides with
  `copy.ts` on a case-insensitive FS.
- **EDIT.MODE (SYS-99): SHIPPED, inert until env vars.** `/edit`: key gate
  (`EDIT_MODE_KEY`, timing-safe) → `[data-copy-id]` contentEditable, Esc
  reverts, SAVE → `/api/copy-commit` → GitHub Contents API commits copy.json to
  main (`GITHUB_COPY_TOKEN`); 409 → rebase. Skin-aware slot targeting.
- **Type system ADOPTED** (s22): semantic ramp at 166 sites. ⚠️ before the next
  Figma PULL: delete stale STRING `core/leading|tracking|weight` vars.
- **DS pipeline:** `tokens/` (3-tier) → `scripts/build-tokens.mjs` → generated
  CSS/TS; TOKEN BRIDGE PULL/PUSH; Chromatic; Storybook (SB10+Webpack).
- **Tracking:** Notion (connector live); COMMAND.CTR deck via
  `scripts/cc-report.mjs` (`set -a; source .env.local; set +a` first — plain
  `source` doesn't export).
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf pass
  overdue; underwater everything. `viz.module.css` + `studio.module.css` pin
  `--accent: #5c7cff` for the always-dark CRT plate — wants a real
  `--accent-on-inverse` role; medieval Remixes maps `--accent` to the gilt
  expressive accent (vermilion is 2.5:1 on the ember plate), collapsing the two
  accents there. In Progress + machine chrome strings are still literals.

## Latest session — desktop consolidation · iPod afloat (session 25, 2026-07-26)

**Opus orchestrating; four parallel agents on disjoint files (FOURIER=iPod,
NYQUIST=icons/feedback/viz, DOPPLER=machine, HERTZ=CommandWidget); the seam —
registry, Folder, Window, copy keys — written by the orchestrator first. Zero
conflicts. Shipped to main.**

- **Renames** (registry + copy.json): Studio→Remixes, SEQ-16→Beat Machine,
  Jigsaw→Puzzles, Tattoo Gun→Tattoo Me, In Progress→**Case Studies** (`/cases`),
  viz Scrobbles→**History** (new `hidden` flag keeps a rehomed viz out of the
  Visualizers index while its id stays the address of window + deep link).
  PROJECTS + ??? off the desktop. New icons: `ipod`/`music`/`smiley`/`bubble`.
- **Click wheel volume — the MODEL was wrong, not the plumbing** (every
  suspected culprit proven fine, incl. 31 real writes reaching `<audio>`). The
  accumulator was unclamped: from the default 0.85 you pinned at 100% after
  81°, then banked every further degree as slack, so a 180° overshoot needed
  99° of reversal before anything moved. Replaced `rotary`/`onDetent`/`onTurn`
  with ONE callback — **`onTurn(deg) => consumedDeg`**; the wheel discards what
  the parent didn't spend, so slack cannot exist and 360° = one full sweep,
  relative to the grab by construction. Haptics in `lib/haptics.ts` — **iOS
  Safari has no `navigator.vibrate`, so it is Android-only.**
- **Recede-when-inactive is on the window's CHILDREN, not the window** — the
  paper stays opaque so stacked windows occlude instead of turning to soup.
  `filter`, not `opacity`, because Motion owns the inline `opacity`.
- **Medieval wheel = turned oak.** Timber is tinted with the gilt accent:
  parchment-mixed-into-the-plate alone lands on a dead grey. Grain lives in the
  rotating SVG, lighting on the static `.ring` — swap them and the highlight
  spins like a lighthouse. ⚠️ ROLES ARE INVERTED inside `.studio` (`--surface`
  is the dark plate, `--content` is parchment); getting that backwards paints a
  black "highlight". Zone labels went full `--content` in medieval — muted
  measured 3.19:1 on wood, fails AA; now 5.49:1.
- **ABOUT THIS MACHINE** lost the twirl-down and its SSR/CLS workaround; hugs
  at 600×420 (was 86px of dead space), CTA centred, opens the new `ai-opinion`
  window (`/ai`). Drawers hug ONE row via fixed 88px tracks — `minmax(88px,
  1fr)` stretched them and FUN wrapped 3+1.
- **`OS_VERSION` (`src/lib/version.ts`) is the ONE version literal** — it had
  drifted four ways (menu bar v0.2, Boot v0.2, README v0.1, machine "1.0").
- **COMMAND.CTR** back to a floating chip: LIVE (filled dot, raised frame,
  pulse) vs IDLE (hollow ring, flush, `LAST SESSION →`) — state on text +
  shape + elevation, never motion or colour alone. Sticky notes → FEEDBACK.
- **Three traps this session cost real time, now in memory, not repeated here:**
  `useId()` in a program component breaks hydration (use a constant id); this
  repo has **no prettier config** so `npx prettier` mangles the house style; the
  preview pane freezes rAF *and* CSS transitions, so inject
  `*{transition:none!important}` before trusting any computed style.

## Next steps

1. **Jake — three env vars:** `EDIT_MODE_KEY` + `GITHUB_COPY_TOKEN` (carried
   from s23, still unset) and the optional `NUDGE_WEBHOOK_URL`.
2. **Eyeball what probes can't judge:** wheel feel at 24°/360° under a thumb,
   haptics on an Android device, three overlapping windows all at 30% (reads a
   little muddy by design), medieval spoke weights, LCD type at 8–13px.
3. **Figma:** stale STRING vars deletion + PULL verification (carried s22).
4. Typography fluid finale: MODE axis for clamp(); per-skin font-family on text
   styles. Then: language modifier on `t(key, skin)`; underwater; Weavy.
