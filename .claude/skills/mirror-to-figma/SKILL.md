---
name: mirror-to-figma
description: Mirror a code component (React + Storybook story) into Figma as a variable-bound component/variant set. Use when asked to "mirror X to Figma", "add X to the Figma library", "rebuild X in Figma", "sync the component to Figma", or to refresh an existing Figma mirror after a component changes. Covers the props/args -> Figma component-property mapping.
---

# MIRROR TO FIGMA

Build (or refresh) a Figma mirror of a component that lives in code, with its
dimensions **bound to the TOKEN BRIDGE-synced variables** so a token edit
restyles the Figma library and the product from one source.

## The law (do not violate)

**Token values round-trip; component structure flows ONE WAY: code → Figma.**

- Code (`src/components/**` + its `.stories.tsx`) is the source of truth for
  what a component *is*.
- Figma holds a **mirror**. Never reverse-sync structure: it clobbers
  designers' in-progress work, detaches instances, and drops overrides.
- A variant a designer adds in Figma is a **request**, not a change. File it
  as an issue/PR against the code. It is not real until it ships in React.

Write path is the **Figma Plugin API via the Figma MCP** (`use_figma`). Load
the `figma-use` skill for API rules before writing. REST cannot create canvas
nodes — do not try.

## Step 0 — Pre-flight: is this component actually mirrorable?

**You cannot mirror to parity what isn't tokenized.** Before touching Figma,
read the component's CSS module and list every visual declaration. Sort into:

- **Tokenized** (`var(--x)`) → bindable. Good.
- **Hardcoded** (raw px/hex/em) → **NOT bindable**. Binding a Figma variable
  here creates a *false* mirror that silently disagrees with production.

If hardcoded values exist, STOP and report them to the user with the choice:
(a) tokenize them first (preferred — it's a small additive PR), or (b) mirror
them as **static** values in Figma and explicitly note them as unbound drift
risks. Never silently paper over the gap.

Also note any value that differs per theme/mode (e.g. a `[data-theme='dark']`
override) — that binds to a *semantic* variable whose mode carries the change,
not to two separate static values.

## Step 1 — Map props/args → Figma component properties

This is the core translation, and the part people get wrong. Read the
component's TypeScript prop types AND its `.stories.tsx` `argTypes`/`args`.

Decision procedure, in order, for each prop:

| Ask | Then | Figma type |
|---|---|---|
| Does it change **resting** appearance? If **no** → | don't mirror it | — (document only) |
| Finite string-literal union (`'sm' \| 'md'`) | promote to a variant axis | **VARIANT** |
| Boolean that changes the whole style (`disabled`) | variant axis, boolean-typed | **VARIANT** |
| Boolean that only shows/hides a layer (`hasIcon`) | bind to layer visibility | **BOOLEAN** |
| Text content (`children`, `label`) | text-layer content | **TEXT** |
| Node/slot (`icon`, `leading`, `trailing`) | swappable nested instance | **INSTANCE_SWAP** |
| Handlers (`onClick`), `ref`, `...rest`, `aria-*`, `data-*`, `id` | never mirror | — |

**Naming discipline (non-negotiable).** Figma property names must match the
prop names **exactly, case-sensitive** (`size`, not `Size`), and variant
values must match the literal union members exactly (`sm`/`md`, not
`Small`/`Medium`). This is what makes Code Connect mapping trivial later and
makes drift mechanically detectable. Renaming for prettiness breaks both.

**Defaults.** Figma's default variant (first frame in the set) must match the
**component's own defaults** — the values in the TSX destructuring
(`tone = 'expressive', size = 'sm'`), *not* the story's `args`, which are just
a demo state and often differ. If they disagree, mirror the component's and
mention the discrepancy.

**CSS pseudo-states are not props.** `:hover`/`:focus`/`:active` have no prop
to map. Default: **do not** create state variants — document them instead.
Only add a `state` axis if the designer genuinely needs to spec/annotate
those states, because it multiplies the matrix (below).

### Combinatorics discipline

A variant set is the **cartesian product** of its axes:
`frames = axis1 × axis2 × …`. Two 2-value axes = 4 frames; add a 3-value
state axis = 12; add one boolean = 24. This explodes fast and each frame is
hand-maintained surface area.

Rule: **only promote a prop to a variant axis if it changes the resting
visual style.** Budget ~20–30 frames per set; past that, drop an axis
(document it instead) or split the component. If an axis produces visually
*identical* frames, it does not belong in the variant set — say so.

## Step 2 — Build bottom-up (atoms first)

For anything nested, mirror in dependency order — the same order you'd build
by hand:

1. Mirror the **atoms** the component composes (they may already exist —
   reuse, don't duplicate).
2. Compose molecules from **instances** of those atoms, never redrawn copies.
   A redrawn copy is drift on day one.
3. Use **auto-layout** to mirror the CSS box model (padding/gap direction),
   so the Figma component resizes like the real one.

Check for an existing mirror before creating: if one exists, **refresh it in
place** (rebind, add missing variants) rather than creating a duplicate that
splits instance history.

## Step 3 — Bind every dimension to a variable

Bind, don't type numbers. Map each tokenized CSS declaration to its variable
in the `core` / `semantic` / `component` collections:

| CSS | Figma property | Collection |
|---|---|---|
| `border-radius` | corner radius | `component` (e.g. `button/radius`) |
| `border-width` | stroke weight | `semantic` (e.g. `border/default`) |
| `border-color`, `background`, `color` | stroke/fill | `semantic` color role |
| `font-size` | text size | `semantic` (e.g. `text/label`) |
| `padding`, `gap` | auto-layout padding/gap | `core` (e.g. `space/3`) |

Where a variant changes a binding (e.g. `sm` → `border/default`, `md` →
`border/strong`), **rebind per variant frame** — that's the whole point of
the axis.

**Known non-binding cases** (state them, don't fake them):
- **font-family / font-weight** — Figma binds *installed fonts*, not CSS
  stacks like `var(--font-mono), 'SF Mono', …`. Carry as documentation; these
  stay code-authoritative.
- **letter-spacing / line-height** — bindable only if tokenized; often isn't.

## Step 4 — Verify parity (never eyeball it)

Parity means **both surfaces read the same token**, not "looks about right."

1. For each bound property, compare the Figma variable's resolved value
   against the computed CSS value from the running Storybook
   (`getComputedStyle`) in the same theme/mode. They must match exactly.
   Beware: reading computed styles mid-transition returns stale values —
   disable transitions when probing.
2. Screenshot the Figma variant set next to the Storybook story, same theme.
3. Report a table: property → token → Figma value → CSS value → match?
4. Explicitly list anything left **unbound** (hardcoded in CSS, or
   non-bindable per Step 3) as known drift.

The real end-to-end proof: change the bound token in Figma → PUSH → PR →
merge → the change appears in the Figma mirror, Storybook, Chromatic, and
production. One value, four surfaces.

## Step 5 — Report

Summarize: component mirrored, variant axes chosen (and any props
deliberately *not* mirrored, with why), every binding made, unbound/drift
items, and the parity table. If you skipped tokenization gaps, say so loudly.

---

## Worked example — Button (the judgment call)

`Button.tsx` props: `tone: 'system' | 'expressive'`, `size: 'sm' | 'md'`,
`children`, plus `...React.ButtonHTMLAttributes`.

Naive mapping says two variant axes (2 × 2 = 4 frames). **Wrong.** Reading
`primitives.module.css`: `.btnSystem` and `.btnExpressive` define *only*
`:hover` rules. At rest, `tone` produces **zero** visual difference — so a
`tone` axis yields two byte-identical frames.

Correct mirror: **`size` is the only real variant axis** (2 frames — it
changes font-size, border-width, padding). `tone` is documented as a hover
behavior, or annotated on a spec frame. `children` → TEXT property. The
`...rest` HTML attributes → not mirrored.

Bindings: corner radius → `component: button/radius`; stroke color →
`semantic: content` (note the dark-mode override to `border` rides the mode);
`sm` → stroke `border/default`, text `text/caption`; `md` → stroke
`border/strong`, text `text/label`.

**Unbound drift found in pre-flight (report, don't hide):** `.btnMd` padding
is hardcoded `7px 18px` (so binding it to `button/padding-x` would be a false
mirror), `font-weight: 700`, `letter-spacing`, and `.btnExpressive:hover`'s
raw `#17150d` are all untokenized.

The lesson the example teaches: **mirror what the CSS actually does, not what
the prop signature implies.**
