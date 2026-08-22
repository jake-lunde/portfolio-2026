/* STYLE CANDIDATES — what a component property is allowed to be re-bound to,
 * and the one place that list is written down.
 *
 * STYLER is the component-tier sibling of INSPECT.MODE's live nudge: pick a
 * row on a component (button's radius, the menubar's gap), pick a replacement,
 * SAVE commits a rebind of tokens/component/<id>.json. The palette answered
 * that question for the semantic tier with twelve core primitives. It cannot
 * answer it here, because a component row is not always a color — a radius row
 * needs radii, a spacing row needs the spacing ramp — and because the lawful
 * target for a component token is a SEMANTIC role, not a primitive. The tier
 * chain is component → semantic → core; a button that aliased a hex would skip
 * the layer that makes skins possible.
 *
 * MOSTLY HAND-WRITTEN, AND THE RULE FOR WHEN IT ISN'T. Every ramp here could
 * be derived: sweep TOKEN_TIERS for everything semantic whose name starts with
 * `radius-` and you have the radius list for free. For colour, derivation gets
 * the mechanics right and the TASTE wrong — it would offer --focus and
 * --shadow-modal as fills, the accent-expressive-* indirection internals as
 * ink, and every core radius step beside the four semantic roles that actually
 * mean something. What belongs in front of a person choosing is a curated,
 * ORDERED set — scale order for a scale, design order for roles — and curation
 * is a judgment, so it is typed out.
 *
 * The test that decides which way a family goes: DERIVE WHERE THE SEMANTIC
 * TIER HAS ALREADY DONE THE CURATING, HAND-WRITE WHERE THE SEMANTIC SET HOLDS
 * THINGS THAT ARE NOT OFFERS. Colour fails it — status signals, shadows, the
 * focus ring and an AA workaround's internals all live in the same set as the
 * chrome colours. The typography roles pass it: semantic/typography.json is
 * eighteen complete, named type styles and nothing else, authored in design
 * order, so TYPE_ROLES comes off the generated manifest and there is one fewer
 * list to keep in sync by hand.
 *
 * Either way the honesty check is a test, not a generator: every real
 * component binding in TOKEN_REFS and TOKEN_COMPOSITES must land inside the
 * list its row would offer, so a curation that drifts from what the components
 * actually do fails `npm test`.
 *
 * WHY `locked` EXISTS. Two kinds of row have no lawful offer. Three pilot
 * properties — --menubar-h, --desktop-icons-cell-width, --window-ctrl-size —
 * are structural dimensions: real component decisions that belong in the token
 * files, but the spacing scale is inset and gap, not "how tall is the
 * menubar". And every `-text-` row is one member of a typography composite —
 * a text element binds ONE type role and the build expands it into five CSS
 * properties, so offering any single member would let a picker rebind a
 * font-size out from under the weight and tracking it shipped with. Type
 * styles are packages, not knobs (Jake, 2026-08-21). Both classify as
 * `locked` — visible, honest, and not editable. The structural three stay that
 * way until a ramp exists that means something for them. The composite members
 * stay that way for good: the `type-role` family below is the row they were
 * waiting for, drawn on the PARENT (--stamp-text, which the build expands and
 * therefore never emits), and the five members sit beneath it as read-only
 * consequences of the one choice.
 *
 * AND WHY FOUR FAMILIES ARE GONE. STYLER shipped with font-size, tracking,
 * weight and family lists — the loose type knobs, one row each. The same
 * ruling retires them: a text element that could take a `-tracking` from one
 * role and a `-font-size` from another would be assembling a treatment that
 * exists nowhere in the system, which is exactly the nine near-miss treatments
 * the pilot five started with. Phase 1 folded every one of those properties
 * into a composite, so the lists had no consumers left; deleting them is not
 * dead-code hygiene but the law catching up. Anything wearing one of those
 * suffixes that is not a composite member now falls through to `locked`, which
 * is the safe direction to fail.
 *
 * No 'use client' and no imports beyond the generated manifest, for the same
 * reason palette.ts has none: the commit route runs on the server and has to
 * read exactly the same law the panel drew.
 */

import { TOKEN_TIERS, TYPE_ROLES } from './tokens.generated'

/** The five pilot components. Kebab ids: token file name, `data-component`
    attribute and role prefix are deliberately the same string — that identity
    is what lets a role name resolve to a file with no lookup table. */
export const COMPONENT_IDS = [
  'button',
  'desktop-icons',
  'menubar',
  'stamp',
  'window',
] as const

export type ComponentId = (typeof COMPONENT_IDS)[number]

/** Which component a role belongs to, or null. LONGEST prefix wins and the
    match is on a segment boundary: 'menubar-h' is menubar's, but a future
    'menubarrel-x' would be nobody's. */
export function componentIdOf(role: string): string | null {
  let best: string | null = null
  for (const id of COMPONENT_IDS) {
    if (role !== id && !role.startsWith(`${id}-`)) continue
    if (!best || id.length > best.length) best = id
  }
  return best
}

/** The panel categories, split the way a PICKER has to split them — fill and
    stroke share one color list, but a radius row and a border-width row cannot
    share anything. `type-role` is one row per text element and its offers are
    whole type styles. `locked` is the honest last: a row with no lawful
    ramp. */
export type StyleFamily =
  | 'color'
  | 'radius'
  | 'border-width'
  | 'space'
  | 'type-role'
  | 'locked'

/* Classification is by PATH SUFFIX, because that is what the component token
   files encode: `<component>.<part?>.<variant?>.<property>` puts the property
   last, always. Longest suffix first — '-border-width' has to be read before
   '-border', and '-border-color' before either, or a stroke width picks up the
   color list. Two suffixes here are NOT in the original recipe and are in the
   files: '-fill' (window.fill, window.titlebar.fill) is a color, and the
   '-gap-row'/'-padding-top' style compound spacing names need a prefix match
   rather than a fixed list. Anything that matches nothing is locked, which is
   the safe direction to fail. */
const SUFFIX_RULES: ReadonlyArray<readonly [RegExp, StyleFamily]> = [
  // first, and before the parent rule below can read them: the five properties
  // one typography composite expands into. Half a role is never an offer.
  [/-text-(?:font-family|font-size|font-weight|letter-spacing|line-height)$/, 'locked'],
  // and then the parent itself — the one offer a text element gets. It is the
  // only row here whose name the stylesheet never carries, because the build
  // expands it away; its five members stay locked beneath it, moving together
  // when this one row changes.
  [/-text$/, 'type-role'],
  [/-border-color$/, 'color'],
  [/-border-width$/, 'border-width'],
  [/-color$/, 'color'],
  [/-(?:bg|fg|fill|stroke)$/, 'color'],
  [/-radius$/, 'radius'],
  [/-border$/, 'border-width'],
  [/-(?:gap|padding|margin)(?:-[a-z]+)*$/, 'space'],
]

/** Which ramp a COMPONENT role's row draws from. Roles from any other tier are
    not this function's business — ask TOKEN_TIERS first. */
export function familyOf(role: string): StyleFamily {
  for (const [pattern, family] of SUFFIX_RULES) {
    if (pattern.test(role)) return family
  }
  return 'locked'
}

/** One offer in a picker. `token` is the SOURCE path in slash form — what
    tokenRef() turns into the `{dot.ref}` the token files carry — and
    `varName` is the custom property that path emits, which is how the test
    cross-checks the curation against the generated manifest. */
export type StyleCandidate = { name: string; token: string; varName: string }

const c = (name: string, token: string, varName: string): StyleCandidate => ({
  name,
  token,
  varName,
})

/* COLOR — the semantic color roles that mean something as component chrome.
   Order is design order: grounds, then ink, then the line, then the accents,
   then the interactive states. Deliberately absent: status-* (a component
   chrome color is not a status signal — a stamp that means "danger" wants a
   status ROLE of its own, not a red border), shadow-* (out of scope by the
   recipe), focus (owned by the focus ring, not by a component's fill), and
   accent-expressive-mark/-text, which are the AA indirection's internals —
   binding a component to one of those would pin the workaround instead of
   the color. */
const COLORS: readonly StyleCandidate[] = [
  c('Surface', 'surface', '--surface'),
  c('Surface Raised', 'surface-raised', '--surface-raised'),
  c('Surface Inverse', 'surface-inverse', '--surface-inverse'),
  c('Content', 'content', '--content'),
  c('Content Muted', 'content-muted', '--content-muted'),
  c('Content Inverse', 'content-inverse', '--content-inverse'),
  c('Border', 'border', '--border'),
  c('Accent', 'accent', '--accent'),
  c('Accent Expressive', 'accent-expressive', '--accent-expressive'),
  c('On Accent Expressive', 'on-accent-expressive', '--on-accent-expressive'),
  c('Accent Support', 'accent-support', '--accent-support'),
  c('Interactive Default', 'interactive/default/base', '--interactive-default-base'),
  c('Interactive Hover', 'interactive/default/hover', '--interactive-default-hover'),
  c('Interactive Active', 'interactive/default/active', '--interactive-default-active'),
  c(
    'Interactive Content Hover',
    'interactive/default/content-hover',
    '--interactive-default-content-hover',
  ),
  c('Interactive Accent', 'interactive/accent/base', '--interactive-accent-base'),
  c('Interactive Accent Hover', 'interactive/accent/hover', '--interactive-accent-hover'),
  c('On Interactive Accent Hover', 'interactive/accent/on-hover', '--interactive-accent-on-hover'),
  c('Interactive Expressive Hover', 'interactive/expressive/hover', '--interactive-expressive-hover'),
  c(
    'On Interactive Expressive Hover',
    'interactive/expressive/on-hover',
    '--interactive-expressive-on-hover',
  ),
]

/* RADIUS — the four semantic roles, tightest first. The core steps
   (radius-xs/sm/md/lg/none/full) are the scale those roles are cut from and
   are not offered: a component that wants 8px wants `radius-control`, and the
   day control moves to 6px it should move with it. */
const RADII: readonly StyleCandidate[] = [
  c('Radius Control', 'radius/control', '--radius-control'),
  c('Radius Pill', 'radius/pill', '--radius-pill'),
  c('Radius Circle', 'radius/circle', '--radius-circle'),
  c('Radius Thinking', 'radius/thinking', '--radius-thinking'),
]

/* BORDER WIDTH — three semantic weights, thin to thick. Same rule as radius:
   the core hairline/thin/thick primitives stay behind them. */
const BORDER_WIDTHS: readonly StyleCandidate[] = [
  c('Border Width Subtle', 'border-width/subtle', '--border-width-subtle'),
  c('Border Width Default', 'border-width/default', '--border-width-default'),
  c('Border Width Strong', 'border-width/strong', '--border-width-strong'),
]

/* SPACE — the semantic t-shirt scale first, because that is what new work
   should reach for, then the numeric core ramp, because that is where the
   pilots' bindings actually sit (button, menubar and desktop-icons all alias
   space.N) and a picker that could not show a row its own current value would
   be lying about it. */
const SPACES: readonly StyleCandidate[] = [
  c('Component XS', 'spacing/component/xs', '--spacing-component-xs'),
  c('Component SM', 'spacing/component/sm', '--spacing-component-sm'),
  c('Component MD', 'spacing/component/md', '--spacing-component-md'),
  c('Component LG', 'spacing/component/lg', '--spacing-component-lg'),
  c('Component XL', 'spacing/component/xl', '--spacing-component-xl'),
  c('Space 1', 'space/1', '--space-1'),
  c('Space 2', 'space/2', '--space-2'),
  c('Space 3', 'space/3', '--space-3'),
  c('Space 4', 'space/4', '--space-4'),
  c('Space 5', 'space/5', '--space-5'),
  c('Space 6', 'space/6', '--space-6'),
  c('Space 8', 'space/8', '--space-8'),
  c('Space 12', 'space/12', '--space-12'),
]

/* TYPE ROLE — the whole offer for a text element, DERIVED from TYPE_ROLES
   rather than typed out, per the rule at the top of this file: the semantic
   typography set is already exactly eighteen complete type styles in design
   order, so hand-copying it here would only be a second place to get it wrong.

   `varName` is a REPRESENTATIVE MEMBER, and that is a compromise worth naming.
   Every other candidate emits one custom property and points at it; a
   typography composite emits five (family, size, weight, tracking, leading)
   and no single one of them IS the role. --type-<role>-size is the anchor: the
   member a panel would read back to show what a row currently measures, and
   the one the test cross-checks against the generated manifest. The other four
   are checked alongside it there — all five must exist and be semantic — so
   picking one to name never quietly stops meaning the other four. */
const SIZE_SEGMENT = /^(?:xs|sm|md|lg|xl)$/i
const roleName = (role: string): string =>
  role
    .split('-')
    .map((seg) =>
      SIZE_SEGMENT.test(seg) ? seg.toUpperCase() : seg.charAt(0).toUpperCase() + seg.slice(1),
    )
    .join(' ')

const TYPE_ROLE_STYLES: readonly StyleCandidate[] = TYPE_ROLES.map((role) =>
  c(roleName(role), `typography/${role}`, `--type-${role}-size`),
)

export const CANDIDATES_BY_FAMILY: Readonly<Record<StyleFamily, readonly StyleCandidate[]>> = {
  color: COLORS,
  radius: RADII,
  'border-width': BORDER_WIDTHS,
  space: SPACES,
  'type-role': TYPE_ROLE_STYLES,
  locked: [],
}

/** What this row may be re-bound to, in the order a picker should draw it. */
export function candidatesFor(role: string): readonly StyleCandidate[] {
  return CANDIDATES_BY_FAMILY[familyOf(role)]
}

/** The commit route's only defence against a hand-crafted POST binding a
    component property to something outside its ramp — a locked row, a color
    on a spacing row, a raw core radius. */
export function isLawfulTarget(role: string, token: string): boolean {
  return candidatesFor(role).some((candidate) => candidate.token === token)
}

/** True when the role names a property the component tier actually EMITS.

    Deliberately narrower than "is a component-tier token": a composite parent
    like --stamp-text is authored in the component tier and is a lawful STYLER
    row, but the build expands it away, so it emits nothing and this returns
    false for it. That is the honest answer to the question as asked, and no
    caller today wants the other one — tokenEdit grades a role by tier and has
    its own tierOfRole for exactly that reason. Widen this only when a caller
    appears that means "authored in the component tier", and rename it then. */
export function isComponentRole(role: string): boolean {
  return TOKEN_TIERS[`--${role}`] === 'component'
}
