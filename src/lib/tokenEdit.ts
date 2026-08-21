/* TOKEN EDIT — the pure half of the token commit.
 *
 * INSPECT.MODE's live nudge previews a semantic role re-cast to a core
 * primitive (src/lib/tune.ts). SAVE turns that preview into a real edit of
 * tokens/semantic/<theme>.json, which /api/token-commit puts on a branch and
 * opens as a PR. Everything in THIS file is deterministic and I/O-free —
 * no fetch, no fs, no env — so the whole apply/validate step is exercised by
 * `npm test` without a network or a token.
 *
 * Two things here are load-bearing and easy to get wrong:
 *
 * · MATERIALIZATION. classic-light is the complete base set; classic-dark
 *   and medieval are PARTIAL overrides that inherit everything they don't
 *   restate. Re-casting a role the target theme never mentions therefore has
 *   to CREATE the key in the target's own file — editing classic-light would
 *   silently move every other theme too. (tokens/RUNBOOK.md says the same.)
 *
 * · NAME SHAPE. A CSS custom property is the token's path joined with '-';
 *   the path may be nested (status.positive.on-base ->
 *   --status-positive-on-base), so a role can never be treated as a flat
 *   key. We index the real paths out of the JSON — target first, then the
 *   base set for the roles the target inherits — and refuse a role we cannot
 *   find a path for, rather than guessing a shape the build would not emit.
 *
 * Alias refs inside the token files use DOTS ({color.nasa.cobalt}); the
 * palette carries slashes (color/nasa/cobalt). One replace bridges them.
 *
 * SINCE STYLER (s99) this file serves two tiers, and they are not symmetric:
 *
 * · SEMANTIC edits re-cast a role to one of the twelve palette primitives,
 *   per theme, with the materialization dance above.
 * · COMPONENT edits re-bind one component property to a semantic role (or a
 *   core ramp step where no semantic tier exists), in ONE file, with no theme
 *   axis at all — the component sets emit once, under :root, and per-skin
 *   divergence rides the semantic refs. So there is nothing to materialize
 *   and nothing to inherit: applyComponentEdits is the smaller half.
 *
 * What the two share is the shape of the law — validateEdit is the single
 * gate, and it grades a role by the tier the generated manifest records for
 * it (tierOfRole below), never by guessing from its name.
 */

import { isCandidateToken } from './palette'
import { componentIdOf, familyOf, isLawfulTarget } from './styleCandidates'
import { TOKEN_COMPOSITES, TOKEN_TIERS } from './tokens.generated'

/** The three theme sets in tokens/$themes.json — the only commit targets. */
export const TOKEN_THEMES = ['classic-light', 'classic-dark', 'medieval'] as const
export type TokenTheme = (typeof TOKEN_THEMES)[number]

/** The complete set every partial theme inherits from. */
export const BASE_THEME: TokenTheme = 'classic-light'

/** One live nudge, previewed at a time, is generous — twelve is the whole
    palette and well past any honest session. The cap exists so a crafted
    POST cannot turn one arming into an unbounded rewrite. */
export const MAX_EDITS = 12

export function themeFilePath(theme: TokenTheme): string {
  return `tokens/semantic/${theme}.json`
}

/** The component tier's file for an id. The id IS the file name — that
    identity (id = `data-component` = role prefix = file name) is what lets a
    role resolve to a file with no lookup table. */
export function componentFilePath(id: string): string {
  return `tokens/component/${id}.json`
}

export function isTokenTheme(v: unknown): v is TokenTheme {
  return typeof v === 'string' && (TOKEN_THEMES as readonly string[]).includes(v)
}

/** Which file the visitor is actually looking at, from the settings store's
    skin + theme. tokens/$themes.json carries exactly three sets: classic
    splits by theme, medieval does not (its selector wins over the dark one
    in the generated CSS, so a medieval desktop reads medieval.json in both
    appearances). A skin with no set yet — underwater — has nowhere to
    commit, and SAVE says so rather than guessing. */
export function themeFor(skin: string, theme: string): TokenTheme | null {
  if (skin === 'medieval') return 'medieval'
  if (skin === 'classic') return theme === 'dark' ? 'classic-dark' : 'classic-light'
  return null
}

/** A role re-cast to a palette token. `role` is the custom property without
    its leading dashes ('accent', 'status-positive-base'). */
export type TokenEdit = { role: string; token: string }

export type TokenNode = { $value?: unknown; $type?: unknown } & Record<string, unknown>
export type TokenTree = Record<string, unknown>

export type ApplyResult =
  | { ok: true; json: TokenTree; applied: Array<TokenEdit & { materialized: boolean }> }
  | { ok: false; error: string }

function isLeaf(v: unknown): v is TokenNode {
  return !!v && typeof v === 'object' && !Array.isArray(v) && '$value' in (v as object)
}

/** Every leaf in a token tree, as customProperty -> path. Nested groups
    flatten with '-', which is exactly how the build names them. */
export function varIndex(tree: TokenTree): Map<string, string[]> {
  const out = new Map<string, string[]>()
  const walk = (node: TokenTree, path: string[]) => {
    for (const key of Object.keys(node)) {
      const value = node[key]
      const next = [...path, key]
      if (isLeaf(value)) out.set(`--${next.join('-')}`, next)
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as TokenTree, next)
      }
    }
  }
  walk(tree, [])
  return out
}

function leafAt(tree: TokenTree, path: string[]): TokenNode | null {
  let node: unknown = tree
  for (const seg of path) {
    if (!node || typeof node !== 'object') return null
    node = (node as TokenTree)[seg]
  }
  return isLeaf(node) ? node : null
}

/** Write the leaf at `path`, minting intermediate groups. Existing keys keep
    their position; a brand-new key lands at the end of the object it belongs
    to, which is where a hand edit would put it. */
function setLeaf(tree: TokenTree, path: string[], leaf: TokenNode): void {
  let node: TokenTree = tree
  for (const seg of path.slice(0, -1)) {
    const child = node[seg]
    if (!child || typeof child !== 'object' || Array.isArray(child)) node[seg] = {}
    node = node[seg] as TokenTree
  }
  node[path[path.length - 1]] = leaf
}

/** 'color/nasa/cobalt' -> '{color.nasa.cobalt}' — the alias shape the token
    files (and Style Dictionary) actually read. */
export function tokenRef(token: string): string {
  return `{${token.split('/').join('.')}}`
}

/** The tier a role was AUTHORED in — two manifests, one answer, and the
    second one is not an afterthought.

    TOKEN_TIERS covers every custom property the stylesheet emits, which was
    the whole population until a text element started binding a whole
    typography composite. The build expands those composites into their five
    CSS members before it writes the tier map, so the parent (--stamp-text)
    emits nothing and appears nowhere in TOKEN_TIERS — while being a real
    component-tier token, the one STYLER offers a Text style row on, and the
    one an edit names. TOKEN_COMPOSITES is where it survives.

    Every place that asks "what tier is this role" has to ask both, or a
    lawful composite edit validates and then falls out of the routing: not
    semantic, not component, silently nothing. Hence one function, exported,
    used by the route's partition too. Undefined means "no such role" — the
    manifest is the only list, never a hand-written one. */
export function tierOfRole(role: string): 'core' | 'semantic' | 'component' | undefined {
  const tier = TOKEN_TIERS[`--${role}`]
  if (tier) return tier
  return `--${role}` in TOKEN_COMPOSITES ? 'component' : undefined
}

/** Validate one edit against house law, without touching any tree. The role
    must be a KNOWN custom property (tokens.generated.ts is the manifest —
    never a hand-written list), and the tier it was authored in decides which
    law applies:

    · SEMANTIC — one of the twelve palette primitives, nothing else.
    · COMPONENT — a lawful target from the row's own ramp
      (styleCandidates.ts), which is type-aware: a fill takes a color role, a
      radius takes a radius role, a locked structural dimension takes nothing.
    · CORE — refused. A primitive is the bottom of the chain; re-pointing one
      moves every role above it at once, which is a design decision, not a
      nudge.

    Raw hexes are refused by construction in both paths: there is no field to
    carry one, and neither candidate list holds a literal. */
export function validateEdit(edit: TokenEdit): string | null {
  if (!edit || typeof edit.role !== 'string' || typeof edit.token !== 'string') {
    return 'edit must be { role, token }'
  }
  if (!/^[a-z0-9-]+$/.test(edit.role)) return `bad role "${edit.role}"`
  const tier = tierOfRole(edit.role)
  if (!tier) return `unknown role "${edit.role}"`

  if (tier === 'component') {
    if (!componentIdOf(edit.role)) {
      return `role "${edit.role}" belongs to no registered component`
    }
    if (familyOf(edit.role) === 'locked') {
      return `role "${edit.role}" is locked — no lawful ramp`
    }
    if (!isLawfulTarget(edit.role, edit.token)) {
      return `token "${edit.token}" is not a candidate for "${edit.role}"`
    }
    return null
  }

  if (tier !== 'semantic') return `role "${edit.role}" is ${tier}, not semantic`
  if (!isCandidateToken(edit.token)) return `token "${edit.token}" is not in the palette`
  return null
}

/** Apply the edits to a parsed theme file.
 *
 * `target` is the theme being committed to; `base` is the complete set
 * (classic-light) used ONLY to learn the path of a role the target inherits
 * — its own values are never read and never written. Pass the same tree for
 * both when committing to the base itself.
 *
 * Pure: `target` is not mutated, a new tree is returned. */
export function applyTokenEdits(
  target: TokenTree,
  base: TokenTree,
  edits: readonly TokenEdit[],
): ApplyResult {
  if (!Array.isArray(edits) || edits.length === 0) return { ok: false, error: 'no edits' }
  if (edits.length > MAX_EDITS) return { ok: false, error: `too many edits (max ${MAX_EDITS})` }

  const seen = new Set<string>()
  for (const edit of edits) {
    const bad = validateEdit(edit)
    if (bad) return { ok: false, error: bad }
    // validateEdit passes component roles too; this function is the SEMANTIC
    // half, and a component role reaching it would be a routing bug upstream
    if (tierOfRole(edit.role) !== 'semantic') {
      return { ok: false, error: `role "${edit.role}" is not semantic` }
    }
    if (seen.has(edit.role)) return { ok: false, error: `duplicate role "${edit.role}"` }
    seen.add(edit.role)
  }

  const targetIdx = varIndex(target)
  const baseIdx = varIndex(base)
  const json = JSON.parse(JSON.stringify(target)) as TokenTree
  const applied: Array<TokenEdit & { materialized: boolean }> = []

  for (const edit of edits) {
    const prop = `--${edit.role}`
    const path = targetIdx.get(prop) ?? baseIdx.get(prop)
    if (!path) return { ok: false, error: `role "${edit.role}" is not in the semantic sets` }

    // Only a COLOR role can take a color primitive. The shadow and opacity
    // roles in these files are semantic too, and re-aliasing one of those to
    // a hex would emit a rule the browser drops.
    const inTarget = leafAt(json, path)
    const existing = inTarget ?? leafAt(base, path)
    if (existing && existing.$type !== 'color') {
      return { ok: false, error: `role "${edit.role}" is not a color token` }
    }

    const materialized = !targetIdx.has(prop)
    /* Re-aliasing an EXISTING leaf edits it in place: everything else the
       author put on it survives, $description above all. Several roles carry
       a derivation note ("baked from color-mix(…) — re-derive if --surface
       changes"), and dropping one both destroys the note and shifts every
       line below it, turning a one-line change into a whole-file diff.
       A MATERIALIZED leaf is deliberately minted bare instead: the base's
       $description describes the BASE's derivation, and copying it into a
       theme that just overrode that value would be a lie. */
    setLeaf(json, path, {
      ...(inTarget ?? {}),
      $value: tokenRef(edit.token),
      $type: 'color',
    })
    applied.push({ ...edit, materialized })
  }

  return { ok: true, json, applied }
}

/** Apply STYLER's edits to ONE parsed component file.
 *
 * The component tier has no theme axis — its sets emit once, under :root, and
 * per-skin divergence rides the semantic refs — so there is no base tree to
 * consult and nothing to materialize. All the asymmetry that makes
 * applyTokenEdits complicated is simply absent here; what is left is one
 * file, one rule, and a refusal to invent anything.
 *
 * ONE COMPONENT PER CALL. Every edit must belong to the same component,
 * because `tree` is that component's file and a stray role would either be
 * silently dropped or minted into the wrong file. The route partitions first
 * and calls this once per group, so a mixed set arriving here is a bug worth
 * hearing about, not a case to accommodate.
 *
 * NEVER MINTS A LEAF. A role whose path is not already in the tree is
 * refused. Materialization is a SEMANTIC idea — a theme overriding a role it
 * inherits — and it has no meaning here: a component property that does not
 * exist yet is a promotion (the recipe in tokens/ARCHITECTURE.md), authored by
 * hand alongside the CSS that consumes it, not conjured by a picker.
 *
 * Pure: `tree` is not mutated, a new tree is returned. */
export function applyComponentEdits(
  tree: TokenTree,
  edits: readonly TokenEdit[],
): ApplyResult {
  if (!Array.isArray(edits) || edits.length === 0) return { ok: false, error: 'no edits' }
  if (edits.length > MAX_EDITS) return { ok: false, error: `too many edits (max ${MAX_EDITS})` }

  const seen = new Set<string>()
  let component: string | null = null
  for (const edit of edits) {
    const bad = validateEdit(edit)
    if (bad) return { ok: false, error: bad }
    if (tierOfRole(edit.role) !== 'component') {
      return { ok: false, error: `role "${edit.role}" is not a component property` }
    }
    const id = componentIdOf(edit.role)
    if (component && id !== component) {
      return { ok: false, error: `edits span two components (${component}, ${id})` }
    }
    component = id
    if (seen.has(edit.role)) return { ok: false, error: `duplicate role "${edit.role}"` }
    seen.add(edit.role)
  }

  const idx = varIndex(tree)
  const json = JSON.parse(JSON.stringify(tree)) as TokenTree
  const applied: Array<TokenEdit & { materialized: boolean }> = []

  for (const edit of edits) {
    const prop = `--${edit.role}`
    const path = idx.get(prop)
    if (!path) return { ok: false, error: `role "${edit.role}" is not in ${component}'s token set` }
    const existing = leafAt(json, path)
    if (!existing) return { ok: false, error: `role "${edit.role}" is not a leaf` }

    /* $description GOES. This is the opposite of the semantic path's rule,
       and for the opposite reason: the only descriptions in the component
       files are the OFF-GRID notes — "OFF-GRID literal. Snap to {space.2}
       (8px) when approved." — which describe the LITERAL this edit is
       replacing. Keeping one on a leaf that now reads {space.2} would leave a
       note calling a binding a literal and prescribing the snap it just took:
       a lie sitting in the file, and the next reader would believe it. The
       authored $type survives, because the property's kind did not change. */
    const { $description: _retired, ...rest } = existing
    setLeaf(json, path, { ...rest, $value: tokenRef(edit.token) })
    // `materialized` is meaningless for a tier with no inheritance; it stays
    // in the shape so the route's ledger and the PR body can be one code path
    applied.push({ ...edit, materialized: false })
  }

  return { ok: true, json, applied }
}

/** The on-disk shape: 2-space indent, one trailing newline, and non-ASCII
    escaped back to \uXXXX.

    That last part is not fussiness. The three theme sets were authored by
    Tokens Studio, which escapes; classic-light and medieval carry em dashes
    inside $description strings, so a plain JSON.stringify round-trip
    de-escapes two lines nobody edited and the PR stops being a one-line
    diff. Verified byte-stable against all three targets. */
export function serializeTokens(json: TokenTree): string {
  const text = JSON.stringify(json, null, 2) + '\n'
  // printable source only: the class is "anything outside plain ASCII"
  return text.replace(/[^\x00-\x7e]/g, (c) =>
    '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
  )
}

/** The same shape for the COMPONENT sets, minus the escaping — and that
    difference is the files', not a preference. The theme sets came out of
    Tokens Studio and are escaped on disk; the five component sets were
    written by hand (s98) and carry their em dashes literally, all through the
    OFF-GRID notes. Running the escaping serializer over one of them rewrites
    every line that has a dash in it, which is precisely the whole-file diff
    the escaping exists to prevent — the rule is "match what the author
    wrote", and the two families were written differently.

    Two named functions rather than one boolean flag: a flag has a right and a
    wrong way round, and getting it wrong is invisible until the PR renders. */
export function serializeComponentTokens(json: TokenTree): string {
  return JSON.stringify(json, null, 2) + '\n'
}
