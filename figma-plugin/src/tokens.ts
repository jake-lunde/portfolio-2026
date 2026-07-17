/* TOKEN BRIDGE — pure token logic (no Figma globals).
 *
 * This module is the single source of the mapping rules between the repo's
 * Tokens-Studio-style JSON (tokens/*.json) and Figma variables. It is
 * deliberately free of any `figma.*` calls so the rules can be reasoned about
 * (and, later, unit-tested) in isolation. code.ts is the thin Figma adapter
 * that drives these functions.
 *
 * Source shape (DTCG-ish):
 *   - a token leaf is any object carrying a `$value`, optionally `$type`
 *   - nesting encodes the token path: { color: { nasa: { cobalt: {$value} } } }
 *     => path "color.nasa.cobalt"
 *   - aliases are strings "{some.path}" or "{bareName}"
 *   - core/font.json tokens have NO $type — their values are font-stack strings
 *
 * Collections we build in Figma:
 *   - "core"      single mode; every token from core/* sets
 *   - "semantic"  one MODE per theme in $themes.json; every token NAME that
 *                 appears in any semantic/* set becomes one variable
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Metadata = { tokenSetOrder: string[] }

export type SelectedState = 'source' | 'enabled' | 'disabled'

export type ThemeDef = {
  id: string
  name?: string
  group?: string
  selectedTokenSets: Record<string, SelectedState>
}

export type TokenKind = 'COLOR' | 'FLOAT' | 'STRING'

/** A flattened leaf token, tagged with the set it came from. */
export type FlatToken = {
  set: string // e.g. "core/color"
  path: string // dotted path within the set, e.g. "color.paper.base" or "sans"
  rawValue: string // original $value coerced to string
  type?: string // $type if present
  isAlias: boolean
  aliasRef?: string // inner ref (no braces), e.g. "color.paper.base" or "ink"
}

/** Everything a pull needs, derived once from the fetched repo files. */
export type PulledModel = {
  metadata: Metadata
  themes: ThemeDef[]
  /** setName -> original parsed JSON (kept verbatim for round-trip on push) */
  files: Record<string, unknown>
  coreTokens: FlatToken[]
  /** setName -> flat tokens, for semantic/* sets only */
  semanticSets: Record<string, FlatToken[]>
  /** union of semantic token names, first-seen order */
  semanticNames: string[]
  /** component/* tokens (own single-mode collection; alias into semantic) */
  componentTokens: FlatToken[]
}

export type Rgba = { r: number; g: number; b: number; a: number }

/** Identity of the Figma variable a reference points at. */
export type VarRef = { collection: 'core' | 'semantic'; name: string }

// ---------------------------------------------------------------------------
// Set / naming helpers
// ---------------------------------------------------------------------------

export function isCoreSet(set: string): boolean {
  return set.startsWith('core/')
}

export function isSemanticSet(set: string): boolean {
  return set.startsWith('semantic/')
}

export function isComponentSet(set: string): boolean {
  return set.startsWith('component/')
}

/**
 * The Figma variable NAME for a semantic/component token. Internal keys and
 * refs stay dotted ("radius.control"), but Figma rejects "." in names and
 * treats "/" as a group separator — so nested tokens must slash. Flat names
 * ("content", "accent-expressive-text") pass through unchanged.
 */
export function figmaVarName(path: string): string {
  return path.split('.').join('/')
}

/**
 * Figma variable name for a core token.
 *   core/color  + "color.nasa.cobalt" -> "color/nasa/cobalt"
 *   core/font   + "sans"              -> "font/sans"
 *   core/layout + "menubar-h"         -> "layout/menubar-h"
 * Rule: prefix with the set's last path segment, UNLESS the token path already
 * begins with that segment (avoids "color/color/...").
 */
export function coreVarName(set: string, tokenPath: string): string {
  const setLast = set.split('/').pop() as string
  const segs = tokenPath.split('.')
  if (segs[0] === setLast) return segs.join('/')
  return [setLast, ...segs].join('/')
}

// ---------------------------------------------------------------------------
// Flattening
// ---------------------------------------------------------------------------

const ALIAS_RE = /^\{([^}]+)\}$/

function coerceValue(v: unknown): string {
  return typeof v === 'string' ? v : String(v)
}

/** Walk a parsed token-set object into flat leaf tokens. */
export function flattenSet(set: string, json: unknown): FlatToken[] {
  const out: FlatToken[] = []
  const walk = (node: unknown, trail: string[]) => {
    if (node === null || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if ('$value' in obj) {
      const rawValue = coerceValue(obj.$value)
      const m = ALIAS_RE.exec(rawValue.trim())
      out.push({
        set,
        path: trail.join('.'),
        rawValue,
        type: typeof obj.$type === 'string' ? (obj.$type as string) : undefined,
        isAlias: !!m,
        aliasRef: m ? m[1].trim() : undefined,
      })
      return
    }
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) continue // skip $description etc.
      walk(obj[key], [...trail, key])
    }
  }
  walk(json, [])
  return out
}

// ---------------------------------------------------------------------------
// Model assembly
// ---------------------------------------------------------------------------

/**
 * Build the pull model from already-fetched file contents.
 * @param files map of setName -> parsed JSON (must include every set in
 *              metadata.tokenSetOrder; extra keys are ignored)
 */
export function buildModel(
  metadata: Metadata,
  themes: ThemeDef[],
  files: Record<string, unknown>
): PulledModel {
  const coreTokens: FlatToken[] = []
  const semanticSets: Record<string, FlatToken[]> = {}
  const semanticNames: string[] = []
  const seenSemantic = new Set<string>()
  const componentTokens: FlatToken[] = []

  for (const set of metadata.tokenSetOrder) {
    const json = files[set]
    if (json === undefined) continue
    if (isCoreSet(set)) {
      coreTokens.push(...flattenSet(set, json))
    } else if (isSemanticSet(set)) {
      const flat = flattenSet(set, json)
      semanticSets[set] = flat
      for (const t of flat) {
        if (!seenSemantic.has(t.path)) {
          seenSemantic.add(t.path)
          semanticNames.push(t.path)
        }
      }
    } else if (isComponentSet(set)) {
      componentTokens.push(...flattenSet(set, json))
    }
  }

  return { metadata, themes, files, coreTokens, semanticSets, semanticNames, componentTokens }
}

/** The semantic set a theme emits (its single `enabled` semantic/* set). */
export function enabledSemanticSet(theme: ThemeDef): string | undefined {
  for (const [set, state] of Object.entries(theme.selectedTokenSets)) {
    if (isSemanticSet(set) && state === 'enabled') return set
  }
  return undefined
}

/**
 * Fallback theme for a token missing in some mode. Per spec: fall back to
 * classic-light's definition. Generically: the FIRST theme in $themes.json
 * (classic-light today) that actually defines the token. We copy that theme's
 * token DEFINITION (alias or literal) into the missing mode — which is exactly
 * what CSS inheritance does, since a mode that omits a token inherits :root
 * (classic-light). An aliased fallback (e.g. `focus: {blue}`) therefore still
 * tracks the consuming mode's `blue` — the correct behavior.
 */
export function semanticToken(
  model: PulledModel,
  theme: ThemeDef,
  name: string
): FlatToken | undefined {
  const set = enabledSemanticSet(theme)
  const direct = set ? model.semanticSets[set]?.find((t) => t.path === name) : undefined
  if (direct) return direct
  for (const fb of model.themes) {
    const fbSet = enabledSemanticSet(fb)
    const hit = fbSet ? model.semanticSets[fbSet]?.find((t) => t.path === name) : undefined
    if (hit) return hit
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Reference resolution (ref string -> Figma variable identity)
// ---------------------------------------------------------------------------

/**
 * Resolve an alias ref (no braces) to the variable it targets.
 *   - dotted refs ("color.nasa.cobalt") point into a core set
 *   - bare refs ("ink", "blue") point at a sibling semantic variable; if no
 *     such semantic name exists they fall back to a single-segment core token
 *     (e.g. a future `{sans}` / `{menubar-h}`)
 */
export function resolveRef(refBody: string, model: PulledModel): VarRef | null {
  const body = refBody.trim()
  // Semantic first — names may now be flat ("content") OR dotted
  // ("radius.control"), so a dot no longer means "core". The internal ref
  // name stays dotted; the Figma name is slashed at create/lookup time.
  if (model.semanticNames.includes(body)) return { collection: 'semantic', name: body }
  const core = model.coreTokens.find((t) => t.path === body)
  if (core) return { collection: 'core', name: coreVarName(core.set, core.path) }
  return null
}

// ---------------------------------------------------------------------------
// Kind (resolvedType) inference
// ---------------------------------------------------------------------------

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const RGBA_RE = /^rgba?\(([^)]+)\)$/i
const PX_RE = /^-?\d+(\.\d+)?px$/

/**
 * Concrete kind of a NON-alias value.
 * FLOAT is reserved for PIXEL dimensions (`NNpx`) only — those round-trip
 * exactly (pull `34px`->34, push 34->`34px`) and are pleasant to edit as
 * numbers in Figma. Non-px "dimensions" (`50%`, unitless `1.6`, `0.16s`, spring
 * constants) and multi-part values (shadows, font stacks) stay STRING so a push
 * never silently rewrites them (e.g. `50%` must NOT become `50px`).
 */
export function kindOfValue(rawValue: string, type?: string): TokenKind {
  const v = rawValue.trim()
  if (type === 'color') return 'COLOR'
  if (HEX_RE.test(v) || RGBA_RE.test(v) || v === 'transparent') return 'COLOR'
  if (PX_RE.test(v)) return 'FLOAT'
  return 'STRING'
}

/** Follow alias chains to a concrete kind. Cycle-guarded; defaults STRING. */
export function resolveKind(
  token: FlatToken,
  model: PulledModel,
  seen: Set<string> = new Set()
): TokenKind {
  if (!token.isAlias) return kindOfValue(token.rawValue, token.type)
  const key = `${token.set}::${token.path}`
  if (seen.has(key)) return 'STRING'
  seen.add(key)
  const ref = resolveRef(token.aliasRef as string, model)
  if (!ref) return 'STRING'
  if (ref.collection === 'core') {
    const target = model.coreTokens.find((t) => coreVarName(t.set, t.path) === ref.name)
    return target ? resolveKind(target, model, seen) : 'STRING'
  }
  // semantic target: pick any occurrence (its kind is mode-invariant)
  for (const set of Object.keys(model.semanticSets)) {
    const target = model.semanticSets[set].find((t) => t.path === ref.name)
    if (target) return resolveKind(target, model, seen)
  }
  return 'STRING'
}

// ---------------------------------------------------------------------------
// Value conversion  (token string -> Figma value)
// ---------------------------------------------------------------------------

function hexToRgba(hex: string): Rgba {
  let h = hex.slice(1)
  if (h.length === 3 || h.length === 4) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
  return { r, g, b, a }
}

function parseRgbaString(str: string): Rgba {
  const inner = (RGBA_RE.exec(str.trim()) as RegExpExecArray)[1]
  const parts = inner.split(',').map((s) => s.trim())
  const r = parseFloat(parts[0]) / 255
  const g = parseFloat(parts[1]) / 255
  const b = parseFloat(parts[2]) / 255
  const a = parts.length >= 4 ? parseFloat(parts[3]) : 1
  return { r, g, b, a }
}

/** token string -> Figma color object. */
export function toRgba(rawValue: string): Rgba {
  const v = rawValue.trim()
  if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  if (HEX_RE.test(v)) return hexToRgba(v)
  if (RGBA_RE.test(v)) return parseRgbaString(v)
  // Unknown color-ish string — fail soft to opaque black.
  return { r: 0, g: 0, b: 0, a: 1 }
}

/** token string -> number (px implied). */
export function toFloat(rawValue: string): number {
  return parseFloat(rawValue.replace(/px$/i, '').trim())
}

// ---------------------------------------------------------------------------
// Value conversion  (Figma value -> token string)  — used by PUSH
// ---------------------------------------------------------------------------

function clamp255(x: number): number {
  return Math.max(0, Math.min(255, Math.round(x * 255)))
}

/** Trim a float to at most 4 decimals with no trailing zeros: 0.18 -> "0.18". */
function fmtAlpha(a: number): string {
  const r = Math.round(a * 10000) / 10000
  return String(r)
}

/**
 * Serialize a Figma color back to a token string, matching existing file style:
 *   opaque   -> lowercase "#rrggbb"
 *   alpha<1  -> "rgba(r, g, b, a)"  (0-255 ints, decimal alpha)
 * `originalWasTransparent` keeps a literally-`transparent` token unchanged.
 */
export function rgbaToTokenString(c: Rgba, originalWasTransparent = false): string {
  const a = c.a ?? 1
  if (a >= 1) {
    const r = clamp255(c.r).toString(16).padStart(2, '0')
    const g = clamp255(c.g).toString(16).padStart(2, '0')
    const b = clamp255(c.b).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  if (a === 0 && originalWasTransparent) return 'transparent'
  return `rgba(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)}, ${fmtAlpha(a)})`
}

/** Number -> dimension string (px implied on pull). */
export function floatToTokenString(n: number): string {
  return `${n}px`
}

/**
 * Reconstruct an alias ref string from a resolved target token. For both
 * core and semantic targets the ref body is the token's own path within its
 * set ("color.paper.base", "sans", or the bare semantic name "ink").
 */
export function refStringForTarget(target: FlatToken): string {
  return `{${target.path}}`
}

// ---------------------------------------------------------------------------
// Deep clone + leaf mutation  — used by PUSH to rebuild a file from originals
// ---------------------------------------------------------------------------

export function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

// ---------------------------------------------------------------------------
// Change summaries — used by PUSH to describe the delta in the commit/PR
// ---------------------------------------------------------------------------

/** One changed token leaf: old/new are already token-string form (aliases keep their {ref}). */
export type ChangeEntry = { path: string; oldValue: string; newValue: string }

/** Plain-text line for the commit message body: "token.path: old → new". */
export function formatChangeLine(c: ChangeEntry): string {
  return `${c.path}: ${c.oldValue} → ${c.newValue}`
}

/** Markdown bullet for the PR body/comment: "- `token.path`: `old` → `new`". */
export function formatChangeMarkdown(c: ChangeEntry): string {
  return `- \`${c.path}\`: \`${c.oldValue}\` → \`${c.newValue}\``
}

/** Cap a list of lines at `max`, appending a "…and N more" summary line when truncated. */
export function capLines(lines: string[], max: number): string[] {
  if (lines.length <= max) return lines
  return [...lines.slice(0, max), `…and ${lines.length - max} more`]
}

/**
 * Given a parsed file object and a dotted token path, return the leaf object
 * (the one carrying `$value`), or undefined.
 */
export function leafAtPath(fileObj: unknown, path: string): Record<string, unknown> | undefined {
  let node: unknown = fileObj
  for (const seg of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[seg]
  }
  if (node !== null && typeof node === 'object' && '$value' in (node as object)) {
    return node as Record<string, unknown>
  }
  return undefined
}
