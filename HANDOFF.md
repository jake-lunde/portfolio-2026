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

## Next steps

1. **Adoption sweep** (mechanical, delegate): replace ad-hoc hover CSS in
   primitives.module.css / programs.module.css with the new
   --interactive-* vars; wire --status-* where states are shown; adopt
   --spacing-* in new CSS. Clears the 56 D6 "emitted-but-unadopted" warns.
2. Prove the loop live: edit a Dark-mode inherited token in Figma → PUSH →
   confirm it materializes in classic-dark.json (the bug that's now fixed).
3. Later: responsive type composites, underwater skin, vocabulary-rename
   toggle (off), Weavy probe at underwater asset pass (DS-OPS.md).
