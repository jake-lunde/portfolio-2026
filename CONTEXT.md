# CONTEXT.md — the LUNDE OS glossary

The domain vocabulary for this repo. Use these terms exactly in specs,
tickets, test names, and proposals; don't drift to synonyms. Grown
lazily by `/domain-modeling` — add a term when it's actually resolved,
not speculatively. Voice and tone are separate law (`VOICE.md`); this
file is about which nouns exist, not how they sound.

## The machine

- **LUNDE OS** — the site itself: Jake's portfolio as a retro desktop
  OS from a parallel 1992. The site IS the work.
- **skin** — a complete visual identity for the OS: `classic` (with
  light/dark modes), `medieval`, `underwater` (future). A skin is a
  token set, not a theme file; nested `data-skin` re-scopes tokens.
- **program** — a windowed app on the desk, registered declaratively
  in `src/programs/registry.tsx` and code-split. Adding one must stay
  cheap. _Avoid_: app, applet, widget.
- **desk** — the desktop surface programs open onto; the **boot desk**
  is its first-load state, boot sequence included.
- **window chrome** — titlebar, borders, controls that the OS draws
  around a program.

## Tokens & appearance

- **token** — a named design value in `tokens/` (Tokens Studio JSON),
  built by `npm run tokens:build` into generated CSS/TS. Single source
  of truth; generated files are never hand-edited.
- **core / semantic** — the two token tiers: core primitives (raw
  scales) are never consumed directly; product CSS speaks semantic
  roles (`--surface`, `--content`, `--accent`, `--border`, …).
- **accent / accent-expressive** — the two allowed accents per skin:
  system accent, and the expressive accent (marks-only where AA
  fails). Never a third.
- **copy layer** — every UI string as a `copy.json` key resolved via
  `t()`/`resolveCopy`; programs never hardcode visible words.

## Case studies

- **plate** — one full scene/section of a case study route (e.g. the
  live-audit plate, plate 04). Fixed-ratio media wells inside a plate
  hold swappable placeholders until Jake ships assets.
- **demo reel** — a looped prototype recording played inside a plate
  (`DemoReel`).

## Editing & bridge

- **INSPECT / TUNE / EDIT** — the on-site editing modes: INSPECT
  selects, TUNE nudges token values, EDIT (a COPY block per pick)
  edits copy. A **pick** is the element currently selected.
- **doctor** — the token-health gate on inspect/tune PRs (parity
  checks between tokens, CSS, and the Figma mirror).
- **TOKEN BRIDGE** — the two-way Figma↔code token/component sync: the
  Storybook set mirrored into Figma plus the plugin that pulls edits
  back.
- **mirror** — a Figma component/variant set generated from a code
  component + its Storybook story (see `/mirror-to-figma`).

## Process nouns (vault-side, used in specs/tickets)

- **effort** — a feature-scale body of work; one page in the vault's
  `Efforts/`. Every session and ticket belongs to one.
- **ticket** — one vertical-slice task note under
  `Efforts/Notes/<Effort>/`, carrying `status:` and `blocked-by:`
  (see `agents/issue-tracker.md`).
- **ruling** — a decision Jake made, recorded in the vault with its
  date. Rulings are taste/process; technical decisions are ADRs
  (`adr/`).
