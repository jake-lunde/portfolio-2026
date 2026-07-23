# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-19 (session 17).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`;
  push to main = deploy; verify via Vercel MCP + content-marker curl —
  GitHub status stays "pending" while Chromatic runs).
- **Skins:** classic (light/dark) + **medieval** (shipped 6eede3e —
  parchment/vermilion/gilt, MedievalSharp display; Jake later swapped
  Jacquard 12 → MedievalSharp mono for legibility). underwater = stub.
  Skin picker in Settings; `data-skin` + `data-theme` on <html>.
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
  first-load JS perf pass overdue; dataviz hand-drawn medieval pass +
  per-skin language table scoped on Notion; underwater everything.

## Active initiative — Typography round-trip (session 19, 2026-07-23)

**Figma TEXT STYLES bound to variables — built, NOT yet shipped (awaiting Jake's
in-Figma PULL check + his OK to push to main).** Edit a variable (e.g. line
height), PUSH, and it round-trips to the repo; the text style consumes it.
- **New tokens**: `core/font-figma.json` (Figma family names — Geist / Geist
  Mono / Geist Pixel) + `semantic/typography.json` (one DTCG `$type:typography`
  composite per role, referencing the CSS-facing `type.*` sub-tokens + font-figma
  names). Both are `disabled` in every $theme → SD emits NOTHING to CSS (parity
  literally 0-added/0-changed). Crux solved: CSS vs Figma want different units
  (leading `1.6`⇄`160`%, tracking `0.14em`⇄`14`%, weight str⇄FLOAT, family
  stack⇄real name) → a Figma-native representation, derived by the bridge.
- **Bridge** (`figma-plugin/src/{tokens,code}.ts`): PULL expands each composite
  into a `type` collection (6 bindable vars/role, Figma-native units) + creates
  one TextStyle/role (`Display`, `Heading/1`…), unit-set-then-bound. PUSH
  serializes edited `type` vars back through composite refs to the `type.*`
  sub-tokens in `semantic/scale` — guarded by a baseline compare so an untouched
  pull→push never delinks (same trap the semantic pass solved). 9 new unit tests
  (19 total pass); tsc clean; bundle builds.
- **Doctor D8** (composite completeness; dangling member ref = hard error) +
  RUNBOOK "Typography" section.
- **Decisions this session** (Jake): scope = Figma round-trip only (no CSS
  utility emit); fluid sizes (display/heading-1) pinned to desktop MAX + pull-only
  (font-size PUSH-back skipped for clamps); font-family/style pull-only; all 3
  Geist fonts confirmed present in the Figma file.
- **Verify in Figma**: PULL → expect a `type` collection + 10 text styles, each
  field 🔗 bound; edit a `line-height` var → PUSH → PR edits the role's `leading`
  sub-token. **Unverified headless**: that a bound lineHeight FLOAT reads as % —
  we set unit=PERCENT before binding for exactly this; confirm on first PULL.

## Next steps

1. **Type adoption sweep** (mechanical, delegate): map the 168 raw-px
   font-sizes + line-heights across src/**.css onto `--type-*` roles
   (nearest step). Clears the D6 type warns; makes the ramp the real source.
   Parity here is NOT zero-change (values snap) — Chromatic is the gate. (This
   is where the deferred CSS utility-class emit from composites folds in.)
2. **Fluid round-trip finale**: Desktop/Mobile MODE axis for the two clamp()
   sizes so both endpoints are Figma-tunable + PUSH-back (today: pull-only,
   desktop max). Adds a second mode axis to the bridge (today = skin modes only).
   Then per-skin (medieval) font-family override on text styles.
3. Prior: interactive/status adoption sweep; underwater skin; vocabulary
   toggle; Weavy probe at underwater asset pass.

