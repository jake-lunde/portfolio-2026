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
 * WHY THE LISTS ARE HAND-WRITTEN. Every ramp here could be derived: sweep
 * TOKEN_TIERS for everything semantic whose name starts with `radius-` and you
 * have the radius list for free. Derivation gets the mechanics right and the
 * TASTE wrong. It would offer --focus and --shadow-modal as fills, the
 * accent-expressive-* indirection internals as ink, and every core radius step
 * beside the four semantic roles that actually mean something. What belongs in
 * front of a person choosing is a curated, ORDERED set — scale order for a
 * scale, design order for roles — and curation is a judgment, so it is typed
 * out. The honesty check is a test, not a generator: every real component
 * binding in TOKEN_REFS must land inside the list its row would offer, so a
 * curation that drifts from what the components actually do fails `npm test`.
 *
 * WHY `locked` EXISTS. Three pilot properties — --menubar-h,
 * --desktop-icons-cell-width, --window-ctrl-size — are structural dimensions.
 * They are real component decisions and they belong in the token files, but
 * there is no lawful ramp to offer for them: the spacing scale is inset and
 * gap, not "how tall is the menubar". Rather than offer the wrong ramp or
 * quietly omit the row, they classify as `locked` — visible, honest, and not
 * editable until a ramp exists that means something for them.
 *
 * No 'use client' and no imports beyond the generated manifest, for the same
 * reason palette.ts has none: the commit route runs on the server and has to
 * read exactly the same law the panel drew.
 */

import { TOKEN_TIERS } from './tokens.generated'

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

/** The five panel categories, split the way a PICKER has to split them —
    fill and stroke share one color list, but a radius row and a border-width
    row cannot share anything. `locked` is the honest sixth: a row with no
    lawful ramp. */
export type StyleFamily =
  | 'color'
  | 'radius'
  | 'border-width'
  | 'font-size'
  | 'tracking'
  | 'weight'
  | 'space'
  | 'family'
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
  [/-border-color$/, 'color'],
  [/-border-width$/, 'border-width'],
  [/-font-size$/, 'font-size'],
  [/-color$/, 'color'],
  [/-(?:bg|fg|fill|stroke)$/, 'color'],
  [/-radius$/, 'radius'],
  [/-border$/, 'border-width'],
  [/-tracking$/, 'tracking'],
  [/-weight$/, 'weight'],
  [/-family$/, 'family'],
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

/* FONT SIZE — the semantic UI size ramp, small to large (8/9/10/11/17px).
   The semantic TYPE ramp (--type-label-size and its siblings) is a different
   thing and is not offered here: those are members of a composite role that
   also carries leading, weight and tracking, and letting one row rebind a
   font-size to half a composite would split the role. Stamp binds through the
   ramp today — see the exception the invariant test pins. */
const FONT_SIZES: readonly StyleCandidate[] = [
  c('Text Micro', 'text/micro', '--text-micro'),
  c('Text Caption', 'text/caption', '--text-caption'),
  c('Text Label', 'text/label', '--text-label'),
  c('Text UI', 'text/ui', '--text-ui'),
  c('Text Body', 'text/body', '--text-body'),
]

/* TRACKING — the core ramp, 0.02em to 0.2em. No semantic tier exists for
   tracking; the component files already alias core here (button, menubar,
   stamp all do), and inventing a semantic layer for one picker would be a
   token-architecture decision made by a dropdown. */
const TRACKINGS: readonly StyleCandidate[] = [
  c('Tracking 02', 'tracking/02', '--tracking-02'),
  c('Tracking 06', 'tracking/06', '--tracking-06'),
  c('Tracking 08', 'tracking/08', '--tracking-08'),
  c('Tracking 10', 'tracking/10', '--tracking-10'),
  c('Tracking 12', 'tracking/12', '--tracking-12'),
  c('Tracking 14', 'tracking/14', '--tracking-14'),
  c('Tracking 16', 'tracking/16', '--tracking-16'),
  c('Tracking 18', 'tracking/18', '--tracking-18'),
  c('Tracking 20', 'tracking/20', '--tracking-20'),
]

/* WEIGHT — the core ramp, light to heavy. Same precedent as tracking. */
const WEIGHTS: readonly StyleCandidate[] = [
  c('Weight Regular', 'weight/regular', '--weight-regular'),
  c('Weight Medium', 'weight/medium', '--weight-medium'),
  c('Weight Semibold', 'weight/semibold', '--weight-semibold'),
  c('Weight Bold', 'weight/bold', '--weight-bold'),
  c('Weight Black', 'weight/black', '--weight-black'),
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

/* FAMILY — the three faces a skin publishes. --cjk is a fallback stack the
   type system reaches for by itself, never a component's choice. */
const FAMILIES: readonly StyleCandidate[] = [
  c('Sans', 'sans', '--sans'),
  c('Mono', 'mono', '--mono'),
  c('Display', 'display', '--display'),
]

export const CANDIDATES_BY_FAMILY: Readonly<Record<StyleFamily, readonly StyleCandidate[]>> = {
  color: COLORS,
  radius: RADII,
  'border-width': BORDER_WIDTHS,
  'font-size': FONT_SIZES,
  tracking: TRACKINGS,
  weight: WEIGHTS,
  space: SPACES,
  family: FAMILIES,
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

/** True when the role names a property the component tier actually emits.
    TOKEN_TIERS is the manifest; this is the same question tokenEdit asks, kept
    here so a caller that only imports the candidates can ask it too. */
export function isComponentRole(role: string): boolean {
  return TOKEN_TIERS[`--${role}`] === 'component'
}
