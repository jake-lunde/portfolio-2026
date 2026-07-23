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

/** The six DTCG `typography` composite members the bridge binds to a text style. */
export const TYPO_FIELDS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'fontStyle',
] as const
export type TypoField = (typeof TYPO_FIELDS)[number]

/** One member of a typography composite — a ref ("{type.body.size}") or a literal ("0", "Regular"). */
export type TypoMember = { rawValue: string; isAlias: boolean; aliasRef?: string }

/**
 * A parsed `$type: typography` composite (one role). The bridge expands each
 * into individual Figma-native bindable variables + a TextStyle; it never
 * becomes a plain semantic variable (its members reference those instead).
 */
export type TypographyComposite = {
  role: string // "display", "heading-1", … (the "typography." root is stripped)
  set: string // owning set, e.g. "semantic/typography"
  members: Record<TypoField, TypoMember>
}

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
  /** `$type: typography` composites (own `type` collection + Figma text styles) */
  typographyComposites: TypographyComposite[]
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
 * The typography-composite set (a `semantic/*` set by prefix, but parsed
 * specially — its object-valued composites would break flattenSet). Checked
 * BEFORE isSemanticSet in buildModel.
 */
export function isTypographySet(set: string): boolean {
  return set === 'semantic/typography' || set.endsWith('/typography')
}

/**
 * A `type.<role>.<field>` sub-token path. These are the CSS-facing type ramp in
 * semantic/scale; the typography composites reference them and the `type`
 * collection owns their Figma representation, so they are EXCLUDED from the
 * plain semantic variables (no ghost STRING `type/*` vars in Figma).
 */
export function isTypeRole(path: string): boolean {
  return path === 'type' || path.startsWith('type.')
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

/**
 * Parse `$type: typography` composites out of a typography set. A composite leaf
 * carries an OBJECT `$value` (the member map), which flattenSet can't handle —
 * hence this dedicated walker. The "typography." root segment is stripped from
 * the role name.
 */
export function flattenTypography(set: string, json: unknown): TypographyComposite[] {
  const out: TypographyComposite[] = []
  const walk = (node: unknown, trail: string[]) => {
    if (node === null || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if (
      '$value' in obj &&
      obj.$type === 'typography' &&
      obj.$value !== null &&
      typeof obj.$value === 'object'
    ) {
      const role = trail[0] === 'typography' ? trail.slice(1).join('.') : trail.join('.')
      const val = obj.$value as Record<string, unknown>
      const members = {} as Record<TypoField, TypoMember>
      for (const field of TYPO_FIELDS) {
        const raw = field in val ? coerceValue(val[field]) : ''
        const m = ALIAS_RE.exec(raw.trim())
        members[field] = { rawValue: raw, isAlias: !!m, aliasRef: m ? m[1].trim() : undefined }
      }
      out.push({ role, set, members })
      return
    }
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) continue
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
  const typographyComposites: TypographyComposite[] = []

  for (const set of metadata.tokenSetOrder) {
    const json = files[set]
    if (json === undefined) continue
    if (isCoreSet(set)) {
      coreTokens.push(...flattenSet(set, json))
    } else if (isTypographySet(set)) {
      // MUST precede isSemanticSet — 'semantic/typography' matches both.
      typographyComposites.push(...flattenTypography(set, json))
    } else if (isSemanticSet(set)) {
      const flat = flattenSet(set, json)
      semanticSets[set] = flat // keep type.* here for composite ref lookup…
      for (const t of flat) {
        if (isTypeRole(t.path)) continue // …but the `type` collection owns their variables
        if (!seenSemantic.has(t.path)) {
          seenSemantic.add(t.path)
          semanticNames.push(t.path)
        }
      }
    } else if (isComponentSet(set)) {
      componentTokens.push(...flattenSet(set, json))
    }
  }

  return {
    metadata,
    themes,
    files,
    coreTokens,
    semanticSets,
    semanticNames,
    componentTokens,
    typographyComposites,
  }
}

/**
 * ALL semantic/* sets a theme emits, in $themes.json order. A theme can layer
 * more than one — e.g. classic-light enables both `semantic/scale` (mode-
 * invariant intent aliases: radius.control, text.label, …) and
 * `semantic/classic-light` (its own color roles). Do not assume exactly one.
 */
export function enabledSemanticSets(theme: ThemeDef): string[] {
  const out: string[] = []
  for (const [set, state] of Object.entries(theme.selectedTokenSets)) {
    if (isSemanticSet(set) && state === 'enabled') out.push(set)
  }
  return out
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
  for (const set of enabledSemanticSets(theme)) {
    const hit = model.semanticSets[set]?.find((t) => t.path === name)
    if (hit) return hit
  }
  for (const fb of model.themes) {
    if (fb === theme) continue
    for (const set of enabledSemanticSets(fb)) {
      const hit = model.semanticSets[set]?.find((t) => t.path === name)
      if (hit) return hit
    }
  }
  return undefined
}

/**
 * The semantic set a theme OWNS — the file an override MATERIALIZES into when
 * a designer edits a token that this theme merely inherits (see push()).
 * It's the enabled semantic set no OTHER theme enables (the theme's private
 * layer); if several qualify, the last in tokenSetOrder wins (most specific),
 * so classic-light picks semantic/classic-light over the shared-in-spirit
 * semantic/scale.
 */
export function writeTargetSet(model: PulledModel, theme: ThemeDef): string | undefined {
  const mine = enabledSemanticSets(theme)
  const others = new Set<string>()
  for (const t of model.themes) {
    if (t === theme) continue
    for (const s of enabledSemanticSets(t)) others.add(s)
  }
  const priv = mine.filter((s) => !others.has(s))
  const pool = priv.length ? priv : mine
  let best: string | undefined
  let bestIdx = -Infinity
  for (const s of pool) {
    const i = model.metadata.tokenSetOrder.indexOf(s)
    if (i >= bestIdx) {
      bestIdx = i
      best = s
    }
  }
  return best
}

/**
 * The set within a theme's own enabled sets that DEFINES `name` — i.e. where an
 * edit should be written back. undefined means the theme only inherits the
 * token (via semanticToken's cross-theme fallback), so the caller materializes.
 */
export function owningSet(
  model: PulledModel,
  theme: ThemeDef,
  name: string
): string | undefined {
  for (const set of enabledSemanticSets(theme)) {
    if ((model.semanticSets[set] ?? []).some((t) => t.path === name)) return set
  }
  return undefined
}

/**
 * Materialize a NEW leaf at a dotted path, creating intermediate groups and
 * carrying $type/$description over from the inherited token being overridden.
 * Returns false if anything already occupies the path (never clobbers) or if a
 * path segment collides with an existing leaf — the A8 failure mode, refused
 * here rather than silently nested.
 */
export function createLeafAtPath(
  fileObj: unknown,
  path: string,
  value: string,
  proto?: Pick<FlatToken, 'type'> & { description?: string }
): boolean {
  if (fileObj === null || typeof fileObj !== 'object') return false
  const segs = path.split('.')
  let node = fileObj as Record<string, unknown>
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]
    const nxt = node[seg]
    if (nxt === undefined) node[seg] = {}
    else if (nxt === null || typeof nxt !== 'object' || '$value' in (nxt as object)) return false
    node = node[seg] as Record<string, unknown>
  }
  const last = segs[segs.length - 1]
  if (node[last] !== undefined) return false
  const leaf: Record<string, unknown> = { $value: value }
  if (proto?.type) leaf.$type = proto.type
  if (proto?.description) leaf.$description = proto.description
  node[last] = leaf
  return true
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
// Typography — composite member resolution + Figma-native unit conversion
// ---------------------------------------------------------------------------
//
// CSS and Figma want DIFFERENT units for the same concept, so a text style
// can't bind to the CSS-facing sub-tokens directly:
//   leading   unitless 1.6   <->  lineHeight   FLOAT 160  (PERCENT)
//   tracking  0.14em         <->  letterSpacing FLOAT 14  (PERCENT)
//   weight    "400"          <->  fontWeight   FLOAT 400
//   size      15px / clamp() <->  fontSize     FLOAT 15   (px; fluid -> desktop max)
//   family    var(--font-…)  <->  fontFamily   STRING "Geist"  (via font-figma.*)
// These pure converters (and their inverses, used by PUSH) are the whole reason
// the typography pass exists. Rounding trims JS float noise (1.6*100 = 160.0000…).

function roundTo(n: number, dp = 4): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

/** Desktop (max) px of a size value: last comma-part of a clamp(), else the px itself. */
export function clampMaxPx(rawValue: string): number {
  const v = rawValue.trim()
  const m = /^clamp\((.*)\)$/i.exec(v)
  if (m) {
    const parts = m[1].split(',')
    return toFloat(parts[parts.length - 1])
  }
  return toFloat(v)
}

/** True when a size is fluid (a clamp) — such sizes are pull-only (no PUSH-back). */
export function isFluidSize(rawValue: string): boolean {
  return /clamp\(/i.test(rawValue)
}

export function leadingToPercent(rawValue: string): number {
  return roundTo(parseFloat(rawValue.trim()) * 100, 3)
}
export function percentToLeading(n: number): string {
  return String(roundTo(n / 100, 6))
}

export function emToPercent(rawValue: string): number {
  const v = rawValue.trim()
  if (!v || v === '0') return 0
  return roundTo(parseFloat(v.replace(/em$/i, '')) * 100, 3)
}
export function percentToEm(n: number): string {
  if (n === 0) return '0'
  return `${roundTo(n / 100, 6)}em`
}

export function weightToFloat(rawValue: string): number {
  return parseFloat(rawValue.trim())
}
export function floatToWeight(n: number): string {
  return String(Math.round(n))
}

/** Find a token by dotted path — semantic sets first (type.*, roles), then core. */
export function lookupToken(model: PulledModel, dottedPath: string): FlatToken | undefined {
  for (const set of Object.keys(model.semanticSets)) {
    const hit = model.semanticSets[set].find((t) => t.path === dottedPath)
    if (hit) return hit
  }
  return model.coreTokens.find((t) => t.path === dottedPath)
}

/** Follow an alias chain to its concrete (non-alias) string value. Cycle-guarded. */
export function concreteValue(
  token: FlatToken,
  model: PulledModel,
  seen: Set<string> = new Set()
): string {
  if (!token.isAlias) return token.rawValue
  const ref = token.aliasRef as string
  if (seen.has(ref)) return token.rawValue
  seen.add(ref)
  const next = lookupToken(model, ref)
  return next ? concreteValue(next, model, seen) : token.rawValue
}

/** Resolve a composite member to its concrete string value (alias -> chased; literal -> itself). */
export function memberConcrete(member: TypoMember, model: PulledModel): string {
  if (!member.isAlias) return member.rawValue
  const t = lookupToken(model, member.aliasRef as string)
  return t ? concreteValue(t, model) : member.rawValue
}

/** The set that DEFINES a dotted semantic path (the PUSH write target for a member). */
export function setDefiningPath(model: PulledModel, dottedPath: string): string | undefined {
  for (const set of Object.keys(model.semanticSets)) {
    if (model.semanticSets[set].some((t) => t.path === dottedPath)) return set
  }
  return undefined
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
