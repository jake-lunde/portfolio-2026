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

## Typography — Figma TEXT STYLES bound to variables

The type ramp round-trips as real Figma **text styles**, so you tune type the
same way you tune color: edit a variable, PUSH, done.

**How it's wired.** `semantic/typography.json` holds one DTCG `$type:typography`
composite per role (`display`, `heading-1`…`mono`), each referencing the
CSS-facing `type.*` sub-tokens in `semantic/scale` plus a Figma font name from
`core/font-figma.json`. On **PULL** the bridge expands every composite into a
`type` variable collection — six bindable variables per role
(`type/<role>/font-size | line-height | letter-spacing | font-weight |
font-family | font-style`) — and creates/updates one **text style** per role
(`Display`, `Heading/1`, …) with each field 🔗 **bound** to its variable.

**To change type:** PULL → in the `type` collection edit e.g.
`type/heading-1/line-height` → **PUSH**. The bridge writes the change back to the
role's sub-token in `semantic/scale.json` (`type.heading-1.leading`). The text
style updates because it's bound to the variable — you never edit the style's
fields directly (they show the variable link).

**Units are Figma-native in the `type` collection** (the bridge converts):
line-height & letter-spacing are **percent** (CSS `1.6` ⇄ `160`; `0.14em` ⇄
`14`); weight & size are plain numbers. Don't hand-type `em`/unitless here.

**Caveats (this iteration):**
- **Fluid sizes** (`display`, `heading-1` use `clamp()`) are **pull-only** —
  bound to the desktop **max**; editing them in Figma won't PUSH back until the
  Desktop/Mobile mode axis lands. Every non-fluid size, and all line-heights,
  round-trip fully.
- **font-family / font-style are pull-only** (a shared/derived concern); edit
  families in `core/font-figma.json`. `font-weight` binding is honored by
  variable fonts; for static families (Geist) the weight is carried by
  font-style, so its variable may not visibly drive the style.
- Fonts must exist in the Figma file (Geist / Geist Mono / Geist Pixel).
- `tokens:doctor` **D8** guards this: every `type.*` role needs a composite and
  every composite ref must resolve (dangling ref = hard error).

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
| **D7 (warn)** | A `type.{role}` group is missing `size`/`leading`/`family` | Add the sub-token; a role can't render a complete text style without them. |
| **D8 (warn)** | A `type.{role}` has no `typography.{role}` composite (or a member is missing) | Add/complete the composite in `semantic/typography.json` so the role gets a text style. |
| **D8 (error)** | A `typography.*` composite member `{ref}` resolves to nothing | Fix the ref — it would break text-style creation on PULL. |
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
