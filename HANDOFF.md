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

## Active initiative (session 17 — interrupted by usage limits, resume me)

**DS-mirror + autonomy** per approved plan
(`~/.claude/plans/lively-sauteeing-snowflake.md`): FOURIER executing
steps 0–6 on branch `ds-mirror` — tokens:doctor (collision lint FIRST —
the A8 bug class), parity harness, interactive matrix + status roles,
semantic spacing, bridge extended-collections + PUSH materialization
(**fixes live bug: dark/medieval-mode edits of inherited tokens silently
dropped**), doctor v2 (contrast/orphans) + CI wiring, RUNBOOK.md.
STATUS AT INTERRUPTION: **Step 0 LANDED** (doctor-tokens.mjs D1-D4,
verified: planted dangling ref fires D4+D3, exit codes CI-correct;
interim push-warn in figma-plugin/src/code.ts ~352). HERTZ Weavy memo
DONE (DS-OPS.md + FABLE verdict: viable-later, probe at underwater asset
pass). Budget surgery DONE (CLAUDE.md 264→93, HANDOFF 929→47, CREW §7).
**STEPS 1–6 REMAIN** — resume as an OPUS-LED session (per CREW §7): read
the plan file §3 rollout table (~/.claude/plans/lively-sauteeing-
snowflake.md) — it contains the full design incl. the push
materialization algorithm (theme-major/name-major, writeTargetSet,
definition-string comparison), doctor v2 specs (D5 contrast/D6 orphans +
tokens-sync.yml wiring), interactive/status/spacing token shapes with
extraction sources, and RUNBOOK outline. FABLE gates: push algorithm
review + medieval status hues (danger must NOT reuse rubric.vermilion).
Parity harness (--parity) is step 1 — land before token changes.

## Next steps

1. Review FOURIER's steps as they land (parity gate each), ship.
2. Weavy memo → FABLE 3-sentence verdict → Notion.
3. Later: interactive-token adoption sweep (NYQUIST), responsive type,
   underwater skin, vocabulary-rename toggle (default off).
