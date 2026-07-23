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

## Active initiative — DS-mirror COMPLETE (session 18, 2026-07-19)

Shipped to main (67d7b30, deploy READY). The token system now mirrors the
Minimal-DS two-layer reference (our names, their structure) AND the designer
can update tokens prompt-free:
- **Bridge PUSH fixed** (e24fb84): dark/medieval-mode edits of INHERITED
  tokens were silently dropped; now theme-major/name-major with override
  materialization into the theme's own file. First unit tests in repo
  (`npm test`, 10 cases on the figma-free tokens.ts logic).
- **New dimensions** (d007046): interactive state matrix + status roles
  (positive/warning/danger/info), all 3 skins, every pair AA-audited.
  Medieval danger = near-black oxblood (vermilion IS the accent, so danger
  separates by VALUE not hue — documented in-token, "never adjacent").
- **Semantic spacing** (67d7b30): spacing.component/layout t-shirt scale
  (reverses old Decision C; --space-N still emits).
- **tokens:doctor** (c01dd4c + 67d7b30): D1-D2 collision lint (A8 armor),
  D3 declaration tripwire, D4 refs, D5 AA contrast, D6 orphans, --parity
  computed-value gate. Wired into tokens-sync.yml (--strict --parity
  origin/main) — designer PRs self-validate. --strict gates real errors
  only; not-yet-adopted tokens stay soft warns.
- **tokens/RUNBOOK.md**: Jake's prompt-free manual (Figma + JSON paths,
  mode→file landing table, doctor error decode).

**Typography ramp v1 (2026-07-19, 58e655c) — SHIPPED foundation, not yet
adopted.** core/font-size (2xs..4xl px) + core/leading (none..loose) scales;
semantic `type.{display,heading-1/2/3,body-lg,body,label,caption,micro,mono}`
role groups (size/leading/weight/tracking/family, referencing core), grounded
in the site survey; emits `--type-*` / `--font-size-*` / `--leading-*` vars.
Parity 0-changed (177 added). doctor gained D7 (type-role completeness). FABLE
set type.label weight→regular (faithful to .mono-label's inherited 400). The
new vars are DEFINED-BUT-UNCONSUMED (107 D6 warns — expected).

## Next steps

1. **Type adoption sweep** (mechanical, delegate): map the 168 raw-px
   font-sizes + line-heights across src/**.css onto `--type-*` roles
   (nearest step). Clears the D6 type warns; makes the ramp the real source.
   Parity here is NOT zero-change (values snap) — Chromatic is the gate.
2. **Type round-trip finale** (the "next" Jake chose): DTCG `typography`
   composites ($type:typography) + a custom SD emit (utility classes or
   grouped props) + NEW bridge capability to create/bind Figma TEXT STYLES
   from the composites (separate from the variable API) + Desktop/Mobile
   MODE representation of the fluid display sizes so clamp() is Figma-tunable.
3. Prior: interactive/status adoption sweep; underwater skin; vocabulary
   toggle; Weavy probe at underwater asset pass.

