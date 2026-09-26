# 0001 — The strict doctor gate lives in CI, not the commit route

Date: 2026-08-29 (ratified, s126; shipped 2026-08-21ish in `8846bb9`)

## Context

The TOKEN BRIDGE phase-1 sketch (vault, 2026-08-12) demanded a
server-side `doctor-tokens --strict` run inside `/api/token-commit`
before the PR opens — "non-negotiable." What shipped delegates the
strict gate to CI instead: `.github/workflows/tokens-sync.yml` fires
on any PR touching `tokens/**`, rebuilds, and runs
`tokens:doctor --strict --parity origin/main` as the merge gate
(`inspect-tune*` branches get `--parity-report` per the s123 ruling).

## Decision

The commit route validates edits structurally (tier rules, palette
primitives only, `MAX_EDITS`) and files the PR fast; the strict
doctor gate runs once, in CI, as the merge gate for every token PR —
human- or machine-authored.

## Consequences

- SAVE stays snappy: no 900-line doctor run inside a serverless
  route, no duplicated gate implementation to keep in sync.
- One gate guards all writers, which is the TOKEN BRIDGE invariant
  (single gated pipe to main).
- Trade-off accepted: a structurally-valid-but-unhealthy edit can
  open a PR. It can never merge, and the PR is the review surface
  anyway — a red check on a one-line PR is cheap; a slow or flaky
  SAVE is not.
- Reversing this later means either running the doctor in the route
  (cold-start + duplication cost) or a pre-flight doctor service;
  neither is planned.
