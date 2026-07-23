# Token architecture — the 3-tier refactor (A8)

> Jake's call (2026-07-17): the current token source mixes tiers — `radius/btn`
> (a component decision) sits in `core` next to `radius/sm` (a primitive), and
> the "semantic" layer only covers colors + shadows. This spec re-tiers the
> system to industry standard **core → semantic → component** before Medieval
> (A6), so a new theme slots into a correct system.

## The three tiers

| Tier | Figma collection | Emits CSS? | Rule |
|---|---|---|---|
| **Core** (primitive) | `core` (1 mode) | no (`source` only) — resolves away | Raw scales. No meaning, no component ever references these directly. |
| **Semantic** (alias) | `semantic` (modes: classic-light, classic-dark, …) | yes — role names | Intent. **This is the API components consume.** Every value is an alias to core. |
| **Component** (alias) | `component` (1 mode) | yes — `--button-radius` etc | Only where a component must diverge from a semantic default. Aliases semantic. |

**Consumption law (the whole point):** product CSS references **semantic and
component** vars only — never core. `var(--surface)`, `var(--radius-control)`,
`var(--button-radius)`; never `var(--radius-sm)` or a raw hex.

## Proposed tree (names are the review fork — react before the sweep)

### Core (primitives — internal, don't emit)
- `color.*` — unchanged raw palette (paper.base, ink.base, nasa.cobalt, void.*, cream.*, …)
- `radius.0=0, radius.xs=2, radius.sm=4, radius.md=8, radius.lg=12, radius.pill=999px, radius.circle=50%`
- `space.0=0, space.50=2, space.100=4, space.150=6, space.200=8, space.300=12, space.400=16, space.500=20, space.600=24, space.800=32`
- `size.text.100=8 … 500=17` (the raw type ramp: 8/9/10/11/13/17)
- `border.100=1, border.150=1.5, border.200=2`
- `duration.*`, `spring.*` (unchanged — already primitive)

### Semantic (aliases — emit, the component API)
- **color** (keep the brand words — they're already role-names, not hexes):
  `surface → color.paper.base`, `surface-raised → color.paper.raised`,
  `content → color.ink.base`, `content-muted → color.ink.soft`,
  `accent → color.nasa.cobalt`, `accent-expressive → color.doppler.pink`,
  `line`, `focus → accent`, `plate`, `plate-content`, the `pink-*`/shadow roles.
  *(Alias names shown; whether the EMITTED var stays `--paper` or becomes
  `--surface` is Decision A below.)*
- **radius**: `radius-control → radius.md`, `radius-surface → radius.sm`,
  `radius-pill → radius.pill`, `radius-circle → radius.circle`
- **border**: `border-hairline → border.100`, `border-default → border.150`,
  `border-strong → border.200`
- **type**: `text-body → size.text.500`, `text-label → size.text.300`,
  `text-caption → size.text.200`, `text-micro → size.text.100`, `text-lead`
- **space**: semantic spacing aliases (`space-inset-*`, `space-gap-*`) OR keep
  the numeric `space-N` as the semantic layer (Decision C)

### Component (aliases — emit, only real divergences)
- `button-radius → radius-control`, `button-label → text-label`,
  `button-border → border-strong`
- add others only when a component genuinely diverges (stamp, plate, window)

## Two/three decisions for Jake (the only real forks)

- **Decision A — semantic color var names.** Keep the beloved `--paper`/`--ink`/
  `--blue`/`--pink` as the emitted semantic names (minimal churn, on-brand, and
  they ARE role-ish), **or** rename to generic `--surface`/`--content`/`--accent`
  (textbook-pure, bigger sweep, stronger "I know tiering" signal, but loses the
  LUNDE-OS flavor). *FABLE lean: keep paper/ink/blue/pink — they're good
  semantic names; purity for its own sake isn't worth the flavor loss.*
- **Decision B — the 7px button.** Today `radius/btn = 7px` sits off any scale.
  Snap `radius-control` to `radius.md = 8px` (clean scale, ~imperceptible
  change) **or** keep 7px as a bespoke core step `radius.control-legacy`.
  *FABLE lean: snap to 8.*
- **Decision C — spacing semantic layer.** Introduce intent names
  (`space-inset-md`) **or** treat the numeric `--space-N` as already-semantic
  and just move them out of `core` into `semantic`. *FABLE lean: numeric stays
  — spacing scales rarely need intent names; over-semanticizing spacing is a
  common DS over-engineering.*

## Execution plan (parity-gated, no site breakage)

1. **Author** the new `tokens/` tree (core/semantic/component sets +
   `$themes`/`$metadata`). Build script updates: component collection emits;
   core stays `source`.
2. **Parity gate** (like A0–A2): for every var that KEEPS its name, computed
   value must be identical light+dark. Renamed vars (per Decision A) get a
   codemod: `var(--old)` → `var(--new)` across `src/**/*.css`, verified by a
   grep that zero `--old` usages remain.
3. **Cutover**, `npm run build` green, Chromatic diff = only intended changes
   (e.g. the 7→8px button if Decision B snaps).
4. **Re-pull into Figma** via TOKEN BRIDGE → the variable collections reshape
   into core/semantic/component; re-bind the Button mirror to the new
   component/semantic vars; re-set scopes + code syntax.
5. Update `SPEC.SHEET` + `DS-OPS.md` to describe the tiers.

Delegation: FABLE designs + parity gate + Figma; NYQUIST runs the CSS codemod
sweep (closed, mechanical, grep-verifiable).

## Decision C — REVERSED (2026-07-19, DS-mirror step 3)

Original Decision C kept spacing numeric-only (`--space-1..12`), declining a
semantic spacing layer. The Minimal-DS reference (Jake's durable target) models
`Spacing/{Component,Layout}` as a t-shirt dimension, and it reads better in
Figma than raw numerics. So `semantic/scale.json` now adds
`spacing.component.{xs..xl}` and `spacing.layout.{sm..xl}` aliasing the `space.N`
core scale. **Both layers coexist**: `--space-N` still emits unchanged; the
t-shirt tokens are additive. Adopt `--spacing-component-*` in new CSS; a sweep
of existing `var(--space-N)` usage is optional and mechanical.
