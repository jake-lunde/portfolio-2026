# Token RUNBOOK — updating LUNDE OS design tokens without prompting an agent

You are the design-systems owner. This is how you change tokens and let the
pipeline keep code true. Two paths: **Figma** (visual) and **local JSON**
(fast). Both land in the same place and self-validate.

---

## The system in one breath

`tokens/*.json` (Tokens Studio format — the **single source of truth**) →
`npm run tokens:build` (Style Dictionary) → `src/styles/tokens.generated.css`
+ `src/lib/motion.generated.ts` → the site. Figma mirrors `tokens/` via the
**TOKEN BRIDGE** plugin. **Never hand-edit the generated files.**

Three tiers: **core** (primitives — raw ramps; never consumed directly),
**semantic** (roles: `surface`/`content`/`accent`/`status.*`/`interactive.*`),
**component** (`button.*`). Themes are **modes**: `classic-light` is the base;
`classic-dark` and `medieval` are partial overrides layered by CSS cascade.

---

## Path A — Figma (the TOKEN BRIDGE plugin)

1. **PULL** first (plugin → Pull) to sync Figma from `main`.
2. Edit variables in the **semantic** collection. Pick the **mode** you mean:
   *Classic Light*, *Classic Dark*, or *Medieval*. Editing a value in a mode
   is a real per-mode override.
3. **PUSH** (plugin → Push). It opens/updates a PR on the `design-tokens`
   branch. **Where your edit lands** (the bridge figures this out):

   | You edited, in mode… | …a token the mode… | Lands in |
   |---|---|---|
   | Classic Light | anything | `semantic/classic-light.json` (or `scale`/`component` if that's its home) |
   | Classic Dark | already overrides (e.g. `accent`) | `semantic/classic-dark.json`, in place |
   | Classic Dark | only **inherits** (e.g. `focus`) | `semantic/classic-dark.json`, **new override materialized** |
   | Medieval | a `scale` token (e.g. `radius.control`) | `semantic/medieval.json`, **new override materialized** |

   (Before 2026-07-19 the last two were **silently dropped** — that bug is
   fixed. Reverting an override to the base value does *not* auto-delete the
   leaf; remove it in JSON if you want it gone.)
4. The PR runs CI (below). Green → **merge**. Then **PULL** again so Figma
   tracks `main`.

## Path B — local JSON (no Figma)

1. Edit `tokens/**/*.json` directly. Aliases are `{ref}` strings
   (`"{color.nasa.cobalt}"`, `"{accent}"`).
2. `npm run tokens:watch` rebuilds the CSS on save (or `npm run tokens:build`
   once).
3. `npm run tokens:doctor` before you commit. Green → PR → merge.

---

## The gate: `tokens:doctor`

Runs in CI on every `tokens/**` PR (`--strict --parity origin/main`) and
locally anytime. It makes the **A8 silent-death class impossible**.

| Code | Means | Fix |
|---|---|---|
| **D1** | A leaf and a group share a path (`border` leaf + `border.width`) | Rename one — this is what silently killed ~50 borders in A8. |
| **D2** | Two tokens kebab to the same `--var` | Rename so emitted names are unique per theme. |
| **D3** | Emitted var count ≠ expected enabled leaves | A declaration was dropped/duped — `tokens:build` and diff. |
| **D4** | A `{ref}` resolves to nothing (dangling/cyclic) in some theme | Fix the ref, or define the target in that theme. |
| **D5** | An AA contrast pair fails (`content`/`surface`, `status.*` on-base, …) | Adjust the hue's value. Pre-existing fails are allowlisted in the doctor (with a FIXME) so `--strict` stays enableable. |
| **D6 (error)** | A `var(--x)` is used in `src/` but **never emitted** | The consumer-side A8 symptom — you renamed/removed a token still in use. |
| **D6 (warn)** | A token is emitted but **consumed nowhere** | Fine for a new token before its adoption sweep; delete if truly dead. |
| **parity** | A computed value **changed/removed** vs `main` | Intended? If not, you regressed an existing token — only *added* is safe. |

---

## Never hand-edit
`src/styles/tokens.generated.css` · `src/lib/motion.generated.ts` — both are
build output (overwritten every build). The `design-tokens` branch is a
bot-owned scratch branch; don't develop on it.

## Known edges
- **Shadows** are single-string tokens (`shadow-*`) — editable per mode in
  Figma but read cleaner in JSON.
- **color-mix values** (`interactive.default.hover`) are baked per-skin
  literals with a `$description` derivation note; if you change a skin's
  `surface`, re-derive them (the note says how).
