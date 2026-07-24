# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-24 (session 22).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`;
  push to main = deploy; verify via Vercel MCP + content-marker curl —
  GitHub status stays "pending" while Chromatic runs).
- **Skins:** classic (light/dark, auto-follows OS) + **medieval**
  (parchment/vermilion/gilt, MedievalSharp display+mono, Eagle Lake body,
  hand-inked dataviz). underwater = stub. SkinSwitch flyout in toolbar +
  Settings; `data-skin`/`data-theme` on <html>; per-skin icon art
  (Icon.tsx CSS swap) + vocabulary (`src/lib/skinVocab.ts`).
- **Type system (session 22): ADOPTED.** Semantic ramp (display,
  heading-1/2/3, body-lg/body/**body-sm**, label, caption, micro, mono)
  is the real source: 166 sites bound to `--type-*`/`--weight-*`/
  `--leading-*`; only 15 documented decorative/fluid one-offs remain raw
  (§5 notes in-file). weight.medium=500 exists (Geist variable fonts).
  TOKEN BRIDGE now creates Figma variable ALIASES to core primitives
  (3-tier chains); leading/tracking/weight are FLOAT, stored Figma-native
  (percent); fontStyle derived from weight (single-weight guard for
  pixel/medieval faces).
- **DS pipeline:** `tokens/` (3-tier: core/semantic/component, Tokens
  Studio JSON) → `scripts/build-tokens.mjs` (SD v4) →
  `tokens.generated.css` + `motion.generated.ts`. TOKEN BRIDGE Figma
  plugin (`figma-plugin/`) PULL/PUSH ↔ `design-tokens` branch PRs;
  `tokens-sync.yml` regen bot; Chromatic visual regression; Storybook
  catalog (SB10+Webpack).
- **Tracking:** Notion (connector live); COMMAND.CTR deck via
  `scripts/cc-report.mjs` (CC_FEED_KEY in .env.local; args:
  `<action> <agent> <target|""> <label>`; `source .env.local` first).
- **Known debts:** SpecSheet motion values hardcoded quote-strings;
  first-load JS perf pass overdue; underwater everything.

## Latest session — Type overhaul: adoption sweep + bridge aliases (session 22, 2026-07-24)

**Fable orchestrating; HERTZ(research) + NYQUIST(sweep) + FOURIER(bridge) delegated.
Shipped 8d8daab.** Jake's three Figma complaints root-caused and fixed: (a)
"hardcoded labels" = bridge baked typography literals because core leading/tracking/
weight lacked `$type` → STRING vars can't alias FLOAT fields; now typed + aliased.
(b) "crazy line-heights" = orphan `1.62` literal + duplicate `leading.body` concept
rendered as bare %; now ONE concept, every role traces to the named 6-step leading
ramp. (c) "no weight ramp" = roles only used 400/700; now 400/600/700 visible +
medium 500 primitive. Value snaps shipped (Chromatic-gated): case prose 17→15px,
body leading 1.62→1.7, heading-3 700→600, specsheet specimen snaps, sub-8px chrome
→8px. Deviation from Greenlight ref (deliberate): kept unitless named leading ramp
over index-paired px line-heights.
- **⚠️ BEFORE Jake's next Figma PULL:** delete stale STRING `core/leading|tracking|
  weight` variables (ideally the whole `type` collection) — bridge reuses existing
  resolvedTypes; STRING can't alias into FLOAT. Fresh files fine. Also unverified
  until live PULL: alias creation in-Figma, text-style binding, Geist font loading.
- **EDIT.MODE scoped** (Notion P1, "Scoped"): git-backed in-situ copy editing —
  `t(key, skin)` copy layer (shared foundation with the language-modifier task) +
  hidden desktop program, contentEditable on keyed nodes, diff panel, GitHub
  Contents API commit to main. One session, crew-split. Jake approved the approach.
- Review note: no DOPPLER pass — mechanical sweep verified by tsc/build/doctor +
  25 plugin tests; Chromatic gates visuals. NYQUIST's stale value-comments fixed.

## Next steps

1. **Jake in Figma:** delete stale STRING vars per ⚠️ above, press PULL, verify
   alias chains + text styles (incl. new Body/Small); then OK the PUSH round-trip.
2. **EDIT.MODE build session** (Notion task has full scope) — do the `t(key, skin)`
   layer first; it unblocks the language modifier too.
3. **Typography fluid finale:** Desktop/Mobile MODE axis for the two clamp() sizes;
   per-skin (medieval) font-family override on text styles.
4. Prior: interactive/status adoption sweep; underwater skin; Weavy probe.
