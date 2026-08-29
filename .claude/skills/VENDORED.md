# Vendored skills

These skill folders are vendored from Matt Pocock's engineering skills,
MIT-licensed: https://github.com/mattpocock/skills — local clone at
`~/Documents/github/skills`, copied at commit `6654f6b` (2026-08-29).

Vendored verbatim (minus each skill's `agents/openai.yaml`):

- `codebase-design` · `domain-modeling` · `grill-with-docs`
- `improve-codebase-architecture` · `prototype`
- `to-spec` · `to-tickets`

Local deviations (re-apply if re-vendoring from a newer clone):

- `implement/SKILL.md` — TDD paragraph replaced: TDD is parked by Jake's
  ruling (2026-08-29, s125); gate with `tsc --noEmit` + HANDOFF.md law.
- `domain-modeling/` and `improve-codebase-architecture/` — every
  `docs/adr` path rewritten to `adr` (this repo's `docs/` is private
  and never committed; ADRs live at root `adr/` instead).

Deliberately NOT vendored: `setup-matt-pocock-skills` (one-shot; its
output is `agents/*` + the CLAUDE.md block, hand-authored for the
vault tracker), `triage` (no inbound issue queue on a solo portfolio),
`tdd` (parked by ruling), `code-review` (collides with the built-in
/code-review), `ask-matt` (replaced by `ask-jake`). The rest of the
family (`wayfinder`, `research`, `diagnosing-bugs`, `wizard`, …) lives
in the clone; vendor on demand.

`grilling` and `grill-me` are installed user-level (`~/.claude/skills`),
not vendored here.
