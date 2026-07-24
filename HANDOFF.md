# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-23 (session 21).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`;
  push to main = deploy; verify via Vercel MCP + content-marker curl —
  GitHub status stays "pending" while Chromatic runs).
- **Skins:** classic (light/dark) + **medieval** (shipped 6eede3e —
  parchment/vermilion/gilt, MedievalSharp display; Jake later swapped
  Jacquard 12 → MedievalSharp mono for legibility). underwater = stub.
  Skin picker in Settings **and** a toolbar SkinSwitch flyout trailing the
  wordmark (c61bb79); `data-skin` + `data-theme` on <html>. Skins now also
  re-costume desktop **icon art** (per-skin `<g>` swapped by CSS in Icon.tsx)
  and **words** (`src/lib/skinVocab.ts` — per-skin program names).
- **DS pipeline:** `tokens/` (3-tier: core/semantic/component, Tokens
  Studio JSON) → `scripts/build-tokens.mjs` (SD v4) →
  `tokens.generated.css` + `motion.generated.ts`. TOKEN BRIDGE Figma
  plugin (`figma-plugin/`) PULL/PUSH ↔ `design-tokens` branch PRs;
  `tokens-sync.yml` regen bot; Chromatic visual regression; Storybook
  catalog (SB10+Webpack, `.storybook/`).
- **Tracking:** Notion (connector live) — "Medieval Theme" project Done;
  COMMAND.CTR deck via `scripts/cc-report.mjs` (CC_FEED_KEY in
  .env.local).
- **Known debts:** SpecSheet motion values are hardcoded quote-strings;
  first-load JS perf pass overdue; per-skin language table (beyond app
  names) scoped on Notion; underwater everything. (Auto dark mode + dataviz
  hand-drawn medieval pass shipped session 21.)

## Latest session — Auto dark mode + hand-drawn medieval dataviz (session 21, 2026-07-23)

**Solo overnight run (Jake asleep, "pick one or two and take care of em").** Two
self-contained Notion tasks, both now Done. 3 source files, +56 lines, no forbidden
paths. tsc clean, prod build green.
- **Automatic dark mode** (`src/store/settings.ts`): the OS was only honored on the
  *first* visit (pre-paint script in `layout.tsx`) — after any manual toggle the
  `lunde-theme` pin won forever and live OS flips were ignored. Added a
  `matchMedia('(prefers-color-scheme: dark)')` `change` listener in `hydrate()`
  (module-level `systemThemeBound` guard — hydrate runs in both MenuBar + GateSphere,
  so bind once). On an OS appearance change the site follows AND clears the pin, so the
  system stays authoritative; the toolbar LGT/DRK toggle still overrides until the next
  OS change. Pre-paint script untouched → no FOUC. **Caveat:** the browser-preview
  pane updates `matches` but does NOT dispatch scheme `change` events (verified with a
  probe listener), so live-follow was proven by logic + tsc + build, not exercised
  in-pane. Will fire on a real macOS Appearance switch. If Jake prefers a *permanent*
  manual pin instead of "system change wins", drop the `localStorage.removeItem` line.
- **Hand-drawn medieval dataviz** (`Desktop.tsx` + `viz.module.css`): implemented
  Fable's scoped approach exactly — one `feTurbulence`+`feDisplacementMap` roughen
  filter (`#lunde-roughen`) defined ONCE in the shell (Desktop, so the id resolves
  document-wide with no duplicate-id risk when multiple viz windows are open), applied
  via a single CSS rule `:global([data-skin='medieval']) .viz svg { filter: url(...) }`.
  All 6 visualizers get the inked-quill waver with zero per-viz rework (they all route
  through `VizShell` = `.viz`). Gentle long-wavelength displacement (baseFreq 0.014,
  scale 1.8) so the two text-bearing charts (Flights, Taurus) stay legible. Filters are
  visual-only → scrub hit-testing untouched. Verified in-browser: Ride GPS trace +
  elevation read hand-inked under medieval; classic computes `filter: none` (no
  regression). Per-viz tuning still available later per Fable's note.

**Still pending from session 19 (unshipped, in HANDOFF-ARCHIVE):** the Typography
round-trip (Figma text styles bound to variables) is built but awaits Jake's in-Figma
PULL check + his OK to push. Untouched this session.

## Next steps

1. **Language modifier — extend beyond app names** (Notion: update language). The
   per-skin vocabulary mechanism now exists (`skinVocab.ts`, desktop labels + window
   titles). Next: translate the rest of the copy per skin (window body text, hints,
   dialog voices) — likely a broader `t(key, skin)` layer. Jake framed it as "a
   modifier that translates the copy, even the app names."
2. **Type adoption sweep** (mechanical, delegate): map the 168 raw-px font-sizes +
   line-heights across src/**.css onto `--type-*` roles (nearest step). Clears D6 type
   warns; makes the ramp the real source. Parity is NOT zero-change (values snap) —
   Chromatic is the gate.
3. **Typography fluid round-trip finale** (after Jake verifies session-19 build):
   Desktop/Mobile MODE axis for the two clamp() sizes so both endpoints are
   Figma-tunable + PUSH-back; then per-skin (medieval) font-family override on text
   styles.
4. Prior: interactive/status adoption sweep; underwater skin (unblocks the switcher's
   3rd row + icon/vocab variants); Weavy probe at underwater asset pass.

