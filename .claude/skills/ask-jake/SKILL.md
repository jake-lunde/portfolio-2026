---
name: ask-jake
description: Which skill or flow fits the situation in this repo. A router over the vendored engineering skills, the house skills, and the LUNDE OS session protocol.
disable-model-invocation: true
---

# Ask Jake

The route map for working on LUNDE OS. The engineering skills are
Matt Pocock's family (vendored — see `.claude/skills/VENDORED.md`),
wired to this repo's config in `agents/`; the session protocol
around them is CLAUDE.md §4 and is not optional.

## The main flow: idea → ship

1. **`/grill-with-docs`** — relentless interview to bake the idea
   fully before any code. Runs `grilling` + `domain-modeling`
   underneath, so terms land in `CONTEXT.md` and hard technical
   decisions become ADRs (`adr/`) as they crystallise. Jake's
   taste/process calls stay vault rulings — lanes in
   `agents/domain.md`.
2. **Runnable question?** (state model, a UI you have to see) —
   detour through **`/prototype`**; the verdict folds back, the
   prototype survives on a `prototype/<name>` branch pointed at from
   the ticket.
3. **Multi-session build?**
   - Yes → **`/to-spec`** (spec note into the effort's folder), then
     **`/to-tickets`** (vertical-slice ticket notes with `blocked-by:`
     edges — tracker rules in `agents/issue-tracker.md`), then
     **`/implement`** per ticket, **one fresh session each**
     (CLAUDE.md §4.3; their "smart zone" is our 150k law).
   - No → `/implement` here in the same window.

   `/implement` gates with `tsc` (TDD is parked by ruling —
   2026-08-29, s125; raise it only when a logic-heavy subsystem makes
   test-first genuinely apt) and closes with the built-in
   `/code-review` before committing.

Keep grill → spec → tickets in one unbroken context window; each
implement session starts clean off its ticket, and claims its own
vault session number like any other session.

## Codebase health & references

- **`/improve-codebase-architecture`** — spare-moment survey for
  deepening opportunities; a picked candidate becomes an idea for the
  main flow.
- **`/codebase-design`** — the deep-module vocabulary (module,
  interface, depth, seam, adapter, leverage, locality). Model-invoked;
  speak it when designing shape.
- **`/domain-modeling`** — the glossary/ADR discipline itself, when
  the words are the problem.

## House skills

- **`/grilling` / `/grill-me`** (user-level) — the interview primitive
  / its stateless form for non-repo thinking.
- **`/mirror-to-figma`** — mirror a component into the Figma library.
- **`/tailor-resume`** — application variants under `ref/`.
- Built-in **`/code-review`** — review a diff/PR/branch.

## Not installed (vendor on demand from `~/Documents/github/skills`)

`wayfinder` (huge foggy efforts — decision maps, not deliverables),
`research`, `diagnosing-bugs`, `wizard`, `to-questionnaire`, `teach`.
`triage` stays out (no inbound queue); `tdd` stays out by ruling.

## The protocol wrapper (always)

Deck dispatch → work → `return`/`merge` (§4.1); session claim at start
and vault write-up at end (§4.4); tickets and specs live in the vault,
never a second tracker; never mint tickets Jake didn't ask for.
