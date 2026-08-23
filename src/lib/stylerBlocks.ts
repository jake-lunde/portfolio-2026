/* STYLER BLOCKS — which of a component's rows go in which block, and what
 * each row says about itself.
 *
 * styleCandidates.ts answers "what may this row become". This answers the
 * question in front of it: "what rows are there, and in what order does a
 * person expect to meet them". The order is Figma's inspector — Fill, Stroke,
 * Radius, Typography, Spacing — because that is the panel every visitor who
 * would open this already knows, and matching the reference beats improving on
 * it (house law §5).
 *
 * THE ROWS ARE THE COMPONENT'S, NOT THE PICK'S. A visitor clicks a label
 * inside a desktop icon; the block still lists desktop-icons' whole set. That
 * is the ruling this tier rests on — restyling the button restyles every
 * button — and a panel that showed only the properties the picked node
 * happens to read would be describing an instance, which the component tier
 * does not have.
 *
 * WHAT IS IN SCOPE. Every component-tier property in TOKEN_REFS, plus the
 * composite parents in TOKEN_COMPOSITES, minus the composite MEMBERS. The
 * members are excluded rather than locked-and-shown because they are already
 * on screen once: --stamp-text is the row, and --stamp-text-font-size is one
 * fifth of what that row does. Listing both would offer the same decision
 * twice, and the second copy would be the one you cannot use.
 *
 * A member is found by asking the manifest, not by re-reading the suffix
 * regex styleCandidates already owns: a property is a member if some
 * composite parent is a prefix of it. One home per fact.
 *
 * THE THREE LOCKED ROWS STAY. --menubar-h, --desktop-icons-cell-width and
 * --window-ctrl-size have no lawful ramp (styleCandidates explains why), and
 * hiding them would make the panel claim a component has no height. They draw
 * in the block their kind belongs to — all three are dimensions, so Spacing —
 * inert, wearing a lock.
 *
 * No 'use client' and no DOM: the test suite reads this in plain node, and
 * the panel is the only thing that needs a browser.
 */

import {
  componentIdOf,
  familyOf,
  propertySuffixOf,
  type StyleFamily,
} from './styleCandidates'
import { TOKEN_COMPOSITES, TOKEN_REFS } from './tokens.generated'

/** The five blocks, in the order the panel draws them. */
export const STYLER_BLOCKS = ['fill', 'stroke', 'radius', 'typography', 'spacing'] as const

export type StylerBlock = (typeof STYLER_BLOCKS)[number]

/** One row in a block. `role` is dashless, the shape every edit uses;
    `ref` is what the token file binds it to today, null for an OFF-GRID
    literal. `locked` rows carry no offer and take no click. */
export type StylerRow = {
  role: string
  /** the row's name with its component prefix off — 'RADIUS', 'TITLEBAR FILL' */
  label: string
  block: StylerBlock
  family: StyleFamily
  ref: string | null
  locked: boolean
  /** which layer of the component's anatomy this row paints. The component
      id itself for the rows the component owns directly (stylerLayers below) */
  layer: string
}

/** The five members the build expands one typography composite into, as
    `<parent>-<member>` suffix and the `--type-<role>-<part>` it reads from.
    Order is the order tokens.generated.css emits them, which is the order a
    diff of a rebind will show. */
export const COMPOSITE_MEMBERS: ReadonlyArray<readonly [string, string]> = [
  ['font-family', 'family'],
  ['font-size', 'size'],
  ['font-weight', 'weight'],
  ['line-height', 'leading'],
  ['letter-spacing', 'tracking'],
]

/** Is this property one fifth of a composite? Asked of the manifest rather
    than of a suffix list: the parents ARE the answer, and they move when the
    component files do. */
export function isCompositeMember(prop: string): boolean {
  for (const parent of Object.keys(TOKEN_COMPOSITES)) {
    if (prop.startsWith(`${parent}-`)) return true
  }
  return false
}

/* Fill or stroke, for the one family that spans both. The colour family is
   split by what the property PAINTS: a border color and a `-stroke` are the
   line, everything else is the area — a background, a fill, and the ink,
   which Figma also files under Fill for a text layer. */
const STROKE_COLOR = /-(?:border-color|stroke)$/

/** Which block a row belongs in, or null when the row is not one — the
    composite members, and anything that is not a component property at all.

    Every family has exactly one home, so a role can never land in two blocks
    or fall out of all five: `locked` is the only one that needed a judgement,
    and all three of its members are dimensions. */
export function blockOf(role: string): StylerBlock | null {
  if (!componentIdOf(role)) return null
  if (isCompositeMember(`--${role}`)) return null
  const family = familyOf(role)
  switch (family) {
    case 'color':
      return STROKE_COLOR.test(role) ? 'stroke' : 'fill'
    case 'border-width':
      return 'stroke'
    case 'radius':
      return 'radius'
    case 'type-role':
      return 'typography'
    case 'space':
      return 'spacing'
    case 'locked':
      // --menubar-h, --desktop-icons-cell-width, --window-ctrl-size: three
      // structural dimensions, drawn where dimensions live and inert there
      return 'spacing'
  }
}

/** 'window-titlebar-active-bg' under id 'window' -> 'TITLEBAR ACTIVE BG'.
    The block above the row already says the family, so the prefix that would
    repeat it comes off — Figma names the row "Radius", not "--button-radius"
    — and the full property name is still one hover away in the panel. */
export function rowLabel(role: string, id: string): string {
  const bare = role === id ? role : role.slice(id.length + 1)
  return bare.split('-').join(' ').toUpperCase()
}

/** Every row a component owns, in manifest order, block and layer assigned.
    Composite parents come after the properties, which is where
    TOKEN_COMPOSITES puts them; inside a block the panel draws them in this
    order. */
export function rowsFor(id: string): StylerRow[] {
  const out: StylerRow[] = []
  const add = (prop: string, ref: string | null) => {
    const role = prop.slice(2)
    if (componentIdOf(role) !== id) return
    const block = blockOf(role)
    if (!block) return
    const family = familyOf(role)
    out.push({
      role,
      label: rowLabel(role, id),
      block,
      family,
      ref,
      locked: family === 'locked',
      layer: id,
    })
  }
  for (const prop of Object.keys(TOKEN_REFS)) add(prop, TOKEN_REFS[prop])
  for (const prop of Object.keys(TOKEN_COMPOSITES)) add(prop, TOKEN_COMPOSITES[prop])
  assignLayers(id, out)
  return out
}

/** The rows grouped for drawing: block order fixed, empty blocks dropped —
    a stamp has no radius and a heading that stands over nothing is furniture
    pretending to be a finding.

    `layer` narrows it to one part of the anatomy, which is what the stage
    dock asks for; without it the whole component draws, flat, the way the
    inspector's panel used to. */
export function blocksFor(
  id: string,
  layer?: string | null,
): Array<{ block: StylerBlock; rows: StylerRow[] }> {
  const rows = rowsFor(id).filter((row) => !layer || row.layer === layer)
  return STYLER_BLOCKS.map((block) => ({
    block,
    rows: rows.filter((row) => row.block === block),
  })).filter((group) => group.rows.length > 0)
}

/* ---- the anatomy ----

   Jake, reviewing the stage: "styler should have layers to drill in so i can
   evaluate at the layer/container layer rather than exposing all tokens at
   once on the right." Window is twenty rows in one list, which is a list
   nobody reads.

   THE NAMES ALREADY SAY IT, so nothing new is declared. A component token is
   `<component>.<part?>.<variant?>.<property>` and styleCandidates owns the
   list of property tails: take the tail off the end and the component off the
   front and what is left is the part path — 'titlebar-active' out of
   --window-titlebar-active-bg, nothing at all out of --window-fill. The first
   segment of that path is the layer. So window reads WINDOW · CTRL · TITLE ·
   TITLEBAR · EXPLAINER, menubar reads MENUBAR · MENU · WORDMARK, and neither
   list was typed by hand. A part that gets renamed in the token file renames
   itself here, which a hand-kept list in stageSpecs would not do.

   THE THREE LOCKED ROWS are the one place the rule needs a second look:
   --window-ctrl-size, --menubar-h and --desktop-icons-cell-width match no
   property tail, so there is no path to cut. They go where their own siblings
   are — the first segment of the name, IF the component named a part with it.
   'ctrl' is a part (--window-ctrl-hover-bg), so the control size sits with the
   controls; 'cell' and 'h' name no part, so they stay on the root, which is
   where a structural dimension of the component itself belongs anyway. */

/** The part path a role encodes, or null when no property tail claims one.
    '' means the component itself — --stamp-fg is the stamp's own fill. */
function partPathOf(role: string, id: string): string | null {
  const suffix = propertySuffixOf(role)
  if (suffix === null) return null
  const path = role.slice(0, role.length - suffix.length)
  if (path === id) return ''
  return path.startsWith(`${id}-`) ? path.slice(id.length + 1) : ''
}

/** The first segment of a role's bare name — what a locked row is asked for. */
function headOf(role: string, id: string): string {
  return role === id ? '' : role.slice(id.length + 1).split('-')[0]
}

/** Write every row's layer, in two passes: the rows that name a property
    tail decide what the parts ARE, then the ones that do not join a part
    they can name. Mutating in place because these rows were minted one call
    ago and belong to nobody yet. */
function assignLayers(id: string, rows: StylerRow[]): void {
  const parts = new Set<string>()
  const paths = rows.map((row) => partPathOf(row.role, id))
  for (const path of paths) {
    if (path) parts.add(path.split('-')[0])
  }
  rows.forEach((row, at) => {
    const path = paths[at]
    if (path === null) {
      const head = headOf(row.role, id)
      row.layer = parts.has(head) ? head : id
      return
    }
    row.layer = path ? path.split('-')[0] : id
  })
}

/** One layer of a component's anatomy: the part, and the rows that paint it. */
export type StylerLayer = { id: string; label: string; rows: StylerRow[] }

/** 'titlebar' -> 'TITLEBAR'; the root layer wears the component's own name. */
export function layerLabel(layer: string, id: string): string {
  return (layer === id ? id : layer).split('-').join(' ').toUpperCase()
}

/** A component's layers, root first and the parts after it in manifest
    order. Never empty — every pilot component owns rows directly — and every
    row it has is in exactly one of them. */
export function layersFor(id: string): StylerLayer[] {
  const out: StylerLayer[] = []
  const at = new Map<string, StylerLayer>()
  const put = (key: string) => {
    let layer = at.get(key)
    if (!layer) {
      layer = { id: key, label: layerLabel(key, id), rows: [] }
      at.set(key, layer)
      out.push(layer)
    }
    return layer
  }
  // the root is minted first so it heads the list whatever order the
  // manifest happens to hand its rows over in
  put(id)
  for (const row of rowsFor(id)) put(row.layer).rows.push(row)
  return out.filter((layer) => layer.rows.length > 0)
}

/* ---- the X key's pairing ----

   Figma's X swaps a layer's fill and its stroke. The equivalent here is a
   pair of ROLES on the same part: window-fill and window-stroke,
   stamp-pink-fg and stamp-pink-border-color. The pair is found by name,
   because the component files encode the part in the name and nothing else
   records it — `<part path><side suffix>` — so two properties pair when they
   share a part path and sit on opposite sides.

   Deliberately conservative. A part with no counterpart, an OFF-GRID literal
   on either side (there is no token to hand over), or a picked row that is
   not a colour at all: all no-ops. A swap that guessed would move a binding
   the visitor did not point at. */

const FILL_SUFFIX = ['-bg', '-fill', '-fg']
const STROKE_SUFFIX = ['-border-color', '-stroke']

function partOf(role: string, suffixes: readonly string[]): string | null {
  for (const suffix of suffixes) {
    if (role.endsWith(suffix)) return role.slice(0, -suffix.length)
  }
  return null
}

/** The fill/stroke pair a row sits in, or the component's first pair when
    `role` is not in one. Both halves come back as rows, fill first. */
export function fillStrokePair(id: string, role?: string): [StylerRow, StylerRow] | null {
  const rows = rowsFor(id)
  const fills = rows.filter((r) => r.block === 'fill' && r.family === 'color')
  const strokes = rows.filter((r) => r.block === 'stroke' && r.family === 'color')

  const pairs: Array<[StylerRow, StylerRow]> = []
  for (const fill of fills) {
    const part = partOf(fill.role, FILL_SUFFIX)
    if (part === null) continue
    const stroke = strokes.find((s) => partOf(s.role, STROKE_SUFFIX) === part)
    if (stroke) pairs.push([fill, stroke])
  }
  if (pairs.length === 0) return null
  const asked = role ? pairs.find(([f, s]) => f.role === role || s.role === role) : undefined
  return asked ?? pairs[0]
}
