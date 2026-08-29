# Domain Docs

How the engineering skills consume this repo's domain documentation.
Layout: **single-context** — one `CONTEXT.md` at the repo root,
ADRs in root `adr/` (committed; the repo's `docs/` is private and
never committed — that's why ADRs don't live at the family's default
`docs/adr` path).

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the LUNDE OS glossary.
- **`adr/`** — decision records touching the area you're in.

If a file doesn't exist yet, proceed silently; `/domain-modeling`
creates entries lazily when a term or decision actually crystallises.

## The lanes — one home per fact (CLAUDE.md §3.7)

Deciding *where a decision goes* is the load-bearing part:

- **`adr/`** — hard-to-reverse **technical/architecture** decisions
  and their why: why this seam, this library, this data shape. The
  record that stops a future session re-litigating or re-suggesting.
- **Vault rulings** (effort pages / task notes) — Jake's **taste,
  product, and process** calls: how he wants the work done, what a
  thing should feel like. Never duplicate these as ADRs; an ADR may
  *cite* a ruling by date.
- **CLAUDE.md** — binding law only. When an ADR-sized decision hardens
  into law, the law is the home and the ADR shrinks to a pointer.
- **Claude memory files** — machine mechanics and tool gotchas, never
  decisions.
- **`CONTEXT.md`** — vocabulary only: what a term means, never why a
  decision was made.

## Use the glossary's vocabulary

When output names a domain concept (ticket title, spec, refactor
proposal, test name), use the `CONTEXT.md` term. A concept you need
that isn't in the glossary is a signal: either you're inventing
language the project doesn't use, or there's a real gap — note it for
`/domain-modeling`. Voice and tone are separate law: `VOICE.md`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly:

> _Contradicts ADR-0007 (…), but worth reopening because…_
