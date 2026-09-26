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

import { anatomyOf, type AnatomyNode } from './stylerAnatomy'
import { componentIdOf, familyOf, type StyleFamily } from './styleCandidates'
import { TOKEN_COMPOSITES, TOKEN_REFS } from './tokens.generated'

export type { AnatomyNode }

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
  /** which layer of the declared anatomy this row paints — the node id, which
      is the element's `data-part`. The root's id (the component id) for a row
      no node claims. Rows claimed by two nodes name the first of them; both
      nodes still carry the row (layersFor below). */
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


/* ---- the anatomy ----

   Jake, reviewing the stage: "styler should have layers to drill in so i can
   evaluate at the layer/container layer rather than exposing all tokens at
   once on the right." Window is twenty rows in one list, which is a list
   nobody reads.

   THE TREE IS DECLARED, not derived. stylerAnatomy.ts holds one per pilot and
   its header explains why the token names stopped being the source. What this
   half does is match the two together: every row a component declares is
   offered to every node's role prefixes, the longest claim takes it, and a row
   nothing claims falls to the root. Nothing here drops a node for being empty
   — the window's body takes no token and is still half the window.

   THE THREE LOCKED ROWS need no special case any more. --window-ctrl-size is
   claimed by `ctrl` the same way --window-ctrl-hover-bg is, --menubar-h by the
   bar's own `h`, and --desktop-icons-cell-width by the grid's `cell-width`.
   The derivation had to cut a property tail off first and those three have
   none, which is what made them the exception. A prefix does not care. */

/** A role with its component prefix off — '' for the component's own name,
    'titlebar-active-bg' for --window-titlebar-active-bg. */
function bareOf(role: string, id: string): string {
  return role === id ? '' : role.slice(id.length + 1)
}

/** One node's claim on a name: the prefix it declared, and which node it was. */
type Claim = { prefix: string; node: string }

function claimsOf(node: AnatomyNode, out: Claim[] = []): Claim[] {
  for (const prefix of node.roles ?? []) out.push({ prefix, node: node.id })
  for (const kid of node.children ?? []) claimsOf(kid, out)
  return out
}

/** Which nodes claim a bare role. A prefix matches on a dash boundary or as
    the whole name — `title` must not swallow `titlebar-fill` — and only the
    LONGEST match answers, so Version takes the rows Wordmark would otherwise
    have. More than one node comes back when two declared the same prefix
    (Close and Zoom are both `ctrl`), in declaration order. */
function claimants(bare: string, claims: readonly Claim[]): string[] {
  let longest = -1
  let out: string[] = []
  for (const { prefix, node } of claims) {
    if (bare !== prefix && !bare.startsWith(`${prefix}-`)) continue
    if (prefix.length > longest) {
      longest = prefix.length
      out = [node]
    } else if (prefix.length === longest) out.push(node)
  }
  return out
}

/** Write every row's primary layer. Mutating in place because these rows were
    minted one call ago and belong to nobody yet. */
function assignLayers(id: string, rows: StylerRow[]): void {
  const claims = claimsOf(anatomyOf(id))
  for (const row of rows) row.layer = claimants(bareOf(row.role, id), claims)[0] ?? id
}

/** One node of the anatomy, with the rows that paint it. `rows` is what the
    node takes itself; `subtreeRows` is that plus everything under it, deduped
    and still in manifest order — which is what the dock falls back on when a
    node takes nothing of its own. */
export type StylerLayer = {
  id: string
  /** copy key: the name a designer would find in a Figma layer list */
  name: string
  depth: number
  parent: string | null
  rows: StylerRow[]
  subtreeRows: StylerRow[]
  children: StylerLayer[]
}

/** A component's anatomy, as the ROOT node with its children hanging off it.
    Empty nodes stay: the tree is the component, not the token file. */
export function layersFor(id: string): StylerLayer {
  const root = anatomyOf(id)
  const rows = rowsFor(id)
  const claims = claimsOf(root)

  /* Every node that claims a row, not just the first. --window-ctrl-hover-bg
     paints two buttons and both of them list it. */
  const owned = new Map<string, Set<string>>()
  for (const row of rows) {
    const hit = claimants(bareOf(row.role, id), claims)
    for (const node of hit.length > 0 ? hit : [root.id]) {
      const at = owned.get(node) ?? new Set<string>()
      at.add(row.role)
      owned.set(node, at)
    }
  }

  const build = (node: AnatomyNode, depth: number, parent: string | null): StylerLayer => {
    const children = (node.children ?? []).map((kid) => build(kid, depth + 1, node.id))
    const mine = owned.get(node.id) ?? new Set<string>()
    const all = new Set(mine)
    for (const kid of children) for (const row of kid.subtreeRows) all.add(row.role)
    /* Filtering the manifest list rather than collecting as we go: it is what
       keeps a subtree in the order the token file declares it, and it dedupes
       the two-owner rows for free. */
    return {
      id: node.id,
      name: node.name,
      depth,
      parent,
      rows: rows.filter((row) => mine.has(row.role)),
      subtreeRows: rows.filter((row) => all.has(row.role)),
      children,
    }
  }
  return build(root, 0, null)
}

/** The tree as a list, pre-order — the order the panel draws it and the order
    the arrow keys walk it. */
export function flattenLayers(root: StylerLayer): StylerLayer[] {
  const out: StylerLayer[] = []
  const walk = (layer: StylerLayer) => {
    out.push(layer)
    for (const kid of layer.children) walk(kid)
  }
  walk(root)
  return out
}

/** Which rows the dock is showing, and whose they are. OWN is the ordinary
    answer. SUBTREE is a node that paints nothing itself and has children that
    do — Controls holds only a gap, Titlebar holds a whole titlebar — where an
    empty panel would read as "this part takes no tokens" and be wrong. EMPTY
    is the honest end of it: the window's body really does take none.

    Without a `layer` the whole component draws, flat, the way the inspector's
    panel used to. */
export type DockScope = 'own' | 'subtree' | 'empty'

export function dockFor(
  id: string,
  layer?: string | null,
): { scope: DockScope; groups: Array<{ block: StylerBlock; rows: StylerRow[] }> } {
  /* block order fixed, empty blocks dropped — a stamp has no radius and a
     heading that stands over nothing is furniture pretending to be a finding */
  const group = (rows: StylerRow[]) =>
    STYLER_BLOCKS.map((block) => ({
      block,
      rows: rows.filter((row) => row.block === block),
    })).filter((g) => g.rows.length > 0)
  if (!layer) return { scope: 'own', groups: group(rowsFor(id)) }
  const node = flattenLayers(layersFor(id)).find((l) => l.id === layer)
  if (!node) return { scope: 'empty', groups: [] }
  if (node.rows.length > 0) return { scope: 'own', groups: group(node.rows) }
  if (node.subtreeRows.length > 0) return { scope: 'subtree', groups: group(node.subtreeRows) }
  return { scope: 'empty', groups: [] }
}

/** The groups alone, for the callers that only want the rows. */
export function blocksFor(
  id: string,
  layer?: string | null,
): Array<{ block: StylerBlock; rows: StylerRow[] }> {
  return dockFor(id, layer).groups
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
