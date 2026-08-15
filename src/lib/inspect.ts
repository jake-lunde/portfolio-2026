import { TOKEN_TIERS } from './tokens.generated'
import { SPRING_TOKENS } from './motion.generated'
import { parseColor, hexToRgb, toHex, contrast, grade, type RGB } from './contrast'

/* INSPECT.MODE's engine — SYS-21. Pure DOM + arithmetic, no React, so the
   panel is only a renderer and the reading can be checked from a console.

   The question it answers: for any element on this desktop, which token
   custom properties style it, what do they resolve to HERE (a nested
   data-skin re-scopes the whole set), what does its fg/bg pair grade, and
   which named spring moves it.

   The honest limits, all fine for phase 0 and all worth knowing:
   · the cascade is approximated by DOCUMENT ORDER, not specificity — the
     last matching rule that sets a property wins. Right for this
     codebase (CSS modules, one rule per property per component) and
     wrong for a stylesheet that leans on specificity.
   · pseudo-class state is read live: a `:hover` rule matches only while
     the element is actually hovered.
   · declarations are read off the serialized declaration block, not the
     property enumeration, because a shorthand written with substitutions
     enumerates only longhands that read back empty (see collectFrom).
   · @container rules are SKIPPED: their condition is relative to a query
     container we can't identify from here, so walking them lands rows
     from mutually exclusive branches at once. Better absent than wrong.
   · selector lists are split on commas without parsing, so a comma inside
     :is()/:where()/:not() would split mid-selector. Zero such selectors in
     this codebase today; the split becomes a real parser when there is one. */

export type Tier = 'core' | 'semantic' | 'component' | 'unknown'

/** A declaration on the picked element whose value goes through var(). */
export type TokenRow = {
  property: string
  varNames: string[]
  raw: string
}

export type ResolvedToken = {
  varName: string
  tier: Tier
  /** the token's own computed text — "#2036C8", "12px", "600" */
  value: string
  rgb: RGB | null
  hex: string | null
}

export type TokenReport = TokenRow & { resolved: ResolvedToken[] }

export type EffectiveColors = {
  fg: RGB | null
  bg: RGB | null
  fgHex: string | null
  bgHex: string | null
  ratio: number | null
  grade: string | null
}

export type ChainEntry = { el: HTMLElement; label: string }

/** Where in the repo this element is written — a pointer to search for,
    never a resolved path. See sourceOf() for what each kind claims. */
export type SourceRow = {
  kind: 'styles' | 'copy' | 'program'
  /** the pointer as the panel prints it, e.g. `dock.module.css › .tile` */
  text: string
  /** the label of the ancestor it was read off, when it wasn't the pick */
  via: string | null
}

export type TypeInfo = {
  family: string
  size: string
  weight: string
  tracking: string
  leading: string
}

export type SpringInfo = {
  name: string
  stiffness: string
  damping: string
  mass: string | null
  /** the spring is declared on an ANCESTOR — true of everything inside a
      window, which rides the window's own opening spring */
  inherited: boolean
}

export type Inspection = {
  label: string
  chain: ChainEntry[]
  tokens: TokenReport[]
  colors: EffectiveColors
  type: TypeInfo
  /** the --type-* properties that showed up in `tokens`, for the TYPE section */
  typeVars: string[]
  spring: SpringInfo | null
  reskinned: boolean
  /** the SOURCE block: which files to open to change this thing */
  source: SourceRow[]
}

/* ---------------------------------------------------------------- probes */

/* Elements that cannot take a child, and SVG (an HTML span appended into
   the SVG namespace computes nothing useful). The probe moves to the
   nearest host that can hold it — resolution stays scoped close enough
   for a nested data-skin or an inline SKIN BUILDER override to apply. */
const VOID_TAGS = new Set([
  'AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'LINK',
  'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR', 'TEXTAREA', 'SELECT',
])

function probeHost(el: HTMLElement): HTMLElement {
  let node: HTMLElement | null = el
  while (node) {
    const isSvg = typeof SVGElement !== 'undefined' && node instanceof SVGElement
    if (!isSvg && !VOID_TAGS.has(node.tagName)) return node
    node = node.parentElement
  }
  return document.body
}

/** The custom property we substitute a token into to read its own text.
    Custom properties resolve var() chains at computed-value time whatever
    the token's TYPE is, so one probe reads colors, lengths and weights. */
const PROBE_PROP = '--inspect-probe'

const COLOR_FN_RE = /^(color-mix|color|oklch|oklab|lab|lch|hwb|hsla?|rgba?)\(/i

/** Generic token resolution: what does `varName` mean, standing where
    `el` stands? `property` is the declaration it was used in — it gives
    the browser a typed context for the second (applied) reading. */
export function resolveToken(el: HTMLElement, varName: string, property: string): ResolvedToken {
  const host = probeHost(el)
  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.setAttribute('data-inspect-probe', '')
  probe.setAttribute('data-no-translate', '')
  // absolute + visibility (not display:none) so lengths still lay out
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'

  const substitution = 'var(' + varName + ')'
  probe.style.setProperty(PROBE_PROP, substitution)
  if (!property.startsWith('--')) {
    try {
      probe.style.setProperty(property, substitution)
    } catch {
      /* a property the browser won't take from script — the literal read still works */
    }
  }

  host.appendChild(probe)
  const computed = getComputedStyle(probe)
  const literal = computed.getPropertyValue(PROBE_PROP).trim()
  const applied = property.startsWith('--') ? '' : computed.getPropertyValue(property).trim()
  host.removeChild(probe)

  const value = literal || applied
  let rgb = parseColor(value) ?? hexToRgb(value)
  // color-mix()/oklch() don't parse as channels but the applied reading is
  // already serialized to rgb() — take it only when the token IS a color
  if (!rgb && applied && COLOR_FN_RE.test(value)) rgb = parseColor(applied)

  return {
    varName,
    tier: tierOf(varName),
    value,
    rgb,
    hex: rgb ? toHex(rgb) : null,
  }
}

export function tierOf(varName: string): Tier {
  return TOKEN_TIERS[varName] ?? 'unknown'
}

/* ------------------------------------------------------- stylesheet walk */

/* Values nest and carry fallbacks — a substitution with a fallback names
   TWO tokens — so every name in a declaration is collected, not just the
   first.

   Careful with comments in this file: the token doctor's D6 check greps
   src/ for substitution syntax to find consumption sites, and it cannot
   tell prose from code. An illustrative example written out longhand
   here gets reported as an orphaned token. Describe, don't quote. */
const VAR_RE = /var\(\s*(--[\w-]+)/g

function varNamesIn(value: string): string[] {
  const out: string[] = []
  VAR_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = VAR_RE.exec(value)) !== null) {
    if (!out.includes(m[1])) out.push(m[1])
  }
  return out
}

/* `.thing::before` can't be matched with el.matches, and the rule still
   tells us which tokens the component reaches for. Strip the trailing
   pseudo-element and match the subject instead. Pseudo-CLASSES are left
   alone on purpose — :hover / :focus-visible are real live state. The
   single-colon legacy list needs the negative lookahead or it eats the
   head of a longer pseudo-class (:placeholder-shown → -shown). */
const PSEUDO_EL_RE =
  /::[\w-]+(\([^)]*\))?|:(before|after|first-line|first-letter|selection|placeholder|marker|backdrop)(?![\w-])/gi

/** Does `el` match this rule? Returns null for no match, otherwise the
    pseudo-element the matching selector carried — '' when it carried
    none. Rows from a pseudo-element say so: they style a different box. */
function matchSubject(el: HTMLElement, selectorText: string): string | null {
  for (const part of selectorText.split(',')) {
    let pseudo = ''
    const subject = part
      .replace(PSEUDO_EL_RE, (hit) => {
        if (!pseudo) pseudo = hit
        return ''
      })
      .trim()
    if (!subject) continue
    try {
      if (el.matches(subject)) return pseudo
    } catch {
      /* :has(), ::part(), vendor selectors older browsers choke on — skip it */
    }
  }
  return null
}

/* Declarations come from the serialized block, NOT from style.item(i).
   A shorthand whose value goes through substitutions is stored unresolved
   ("pending-substitution"): the enumeration lists only its longhands and
   every one of them reads back as the empty string, so a tokened border,
   background or gap is invisible to a property-by-property walk — most of
   a reading, gone. The serialized text keeps the shorthand as authored.

   Split on top-level semicolons only: quoted strings hold semicolons
   (content) and so do parenthesized values (a base64 url()). */
function declarationsIn(cssText: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  let depth = 0
  let quote = ''
  let start = 0

  const take = (chunk: string) => {
    const at = chunk.indexOf(':')
    if (at < 1) return
    const property = chunk.slice(0, at).trim()
    const value = chunk.slice(at + 1).trim()
    if (property && value) out.push([property, value])
  }

  for (let i = 0; i < cssText.length; i++) {
    const c = cssText[i]
    if (quote) {
      if (c === quote && cssText[i - 1] !== '\\') quote = ''
      continue
    }
    if (c === '"' || c === "'") quote = c
    else if (c === '(') depth++
    else if (c === ')') depth = Math.max(0, depth - 1)
    else if (c === ';' && depth === 0) {
      take(cssText.slice(start, i))
      start = i + 1
    }
  }
  take(cssText.slice(start))

  return out
}

function collectFrom(style: CSSStyleDeclaration, into: Map<string, TokenRow>, pseudo = '') {
  for (const [name, raw] of declarationsIn(style.cssText)) {
    if (!raw.includes('var(')) continue
    const varNames = varNamesIn(raw)
    if (varNames.length === 0) continue
    // a ::before row is a different box from the element's own — keyed
    // apart so neither overwrites the other
    const property = pseudo ? `${name} ${pseudo}` : name
    // last writer in document order wins; Map keeps the first insertion
    // POSITION, which reads better than shuffling rows on every override
    into.set(property, { property, varNames, raw })
  }
}

function walkRules(rules: CSSRuleList, el: HTMLElement, into: Map<string, TokenRow>) {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]

    /* @container: the condition is measured against a query container
       this walk can't identify, so both branches of a mutually exclusive
       pair would report at once. Skipped whole — see the header. */
    if (typeof CSSContainerRule !== 'undefined' && rule instanceof CSSContainerRule) continue

    // @media that doesn't apply right now isn't styling anything right now
    if (typeof CSSMediaRule !== 'undefined' && rule instanceof CSSMediaRule) {
      try {
        if (!window.matchMedia(rule.conditionText).matches) continue
      } catch {
        /* unparseable condition — walk it rather than lose the rules */
      }
      walkRules(rule.cssRules, el, into)
      continue
    }

    if (typeof CSSKeyframesRule !== 'undefined' && rule instanceof CSSKeyframesRule) continue

    if (typeof CSSStyleRule !== 'undefined' && rule instanceof CSSStyleRule) {
      const pseudo = matchSubject(el, rule.selectorText)
      if (pseudo !== null) collectFrom(rule.style, into, pseudo)
      // nested rules (CSS nesting, @supports inside a rule)
      const nested = (rule as CSSStyleRule & { cssRules?: CSSRuleList }).cssRules
      if (nested && nested.length) walkRules(nested, el, into)
      continue
    }

    // @supports, @layer, @container — transparent containers, walk through
    const group = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules
    if (group && group.length) walkRules(group, el, into)
  }
}

/** Every declaration styling `el` whose value goes through a token. */
export function collectTokenUsage(el: HTMLElement): TokenRow[] {
  const rows = new Map<string, TokenRow>()

  for (const sheet of Array.from(document.styleSheets)) {
    /* Our own instrumentation is not part of anybody's reading: the picked
       outline is stamped BEFORE the walk runs, so without this every
       report grows a phantom outline row citing the panel's own tokens. */
    const owner = sheet.ownerNode
    if (owner instanceof Element && owner.hasAttribute('data-inspect-style')) continue

    let rules: CSSRuleList | null = null
    try {
      rules = sheet.cssRules
    } catch {
      continue // cross-origin sheet — unreadable by design
    }
    if (rules) walkRules(rules, el, rows)
  }

  // inline style is the last word in the cascade
  collectFrom(el.style, rows)

  return Array.from(rows.values())
}

/** collectTokenUsage + resolution, in one pass. */
export function resolveTokenUsage(el: HTMLElement): TokenReport[] {
  return collectTokenUsage(el).map((row) => ({
    ...row,
    resolved: row.varNames.map((name) => resolveToken(el, name, row.property)),
  }))
}

/* ------------------------------------------------------------- contrast */

function alphaOf(color: string): number {
  const m = color.match(/rgba?\(([^)]+)\)/)
  if (!m) return color.trim() === 'transparent' ? 0 : 1
  const parts = m[1].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 4) return 1
  const a = parseFloat(parts[3])
  return Number.isNaN(a) ? 1 : a
}

/* WCAG "large text": 24px, or 18.66px at bold. The 3:1 grade belongs to
   that text ONLY — grade() takes a ratio and can't know the size, so a
   12px caption at 3.2:1 comes back AA·LG and reads as a pass. The size
   test lives here rather than in contrast.ts, which stays pure ratio
   arithmetic shared with SPEC.SHEET and the skin gates. */
function isLargeText(cs: CSSStyleDeclaration): boolean {
  const size = parseFloat(cs.fontSize)
  if (Number.isNaN(size)) return false
  if (size >= 24) return true
  const weight = cs.fontWeight === 'bold' ? 700 : parseFloat(cs.fontWeight)
  return size >= 18.66 && weight >= 700
}

/** Foreground as computed, background as PAINTED — the nearest ancestor
    that actually lays down an opaque color, which is what the eye reads
    and therefore what the ratio has to be measured against. */
export function effectiveColors(el: HTMLElement): EffectiveColors {
  const cs = getComputedStyle(el)
  const fg = parseColor(cs.color)

  let bg: RGB | null = null
  let node: HTMLElement | null = el
  while (node) {
    const painted = getComputedStyle(node).backgroundColor
    if (alphaOf(painted) > 0) {
      bg = parseColor(painted)
      if (bg) break
    }
    node = node.parentElement
  }
  if (!bg) {
    // nothing down the chain paints — the canvas does
    const canvas = getComputedStyle(document.documentElement).backgroundColor
    if (alphaOf(canvas) > 0) bg = parseColor(canvas)
  }

  const ratio = fg && bg ? contrast(fg, bg) : null
  let mark = ratio === null ? null : grade(ratio)
  if (mark === 'AA·LG' && !isLargeText(cs)) mark = 'FAIL'

  return {
    fg,
    bg,
    fgHex: fg ? toHex(fg) : null,
    bgHex: bg ? toHex(bg) : null,
    ratio,
    grade: mark,
  }
}

/* ------------------------------------------------------- identity + chain */

/* CSS-module classes ship as `File_class__hash`. The middle is the name
   the author wrote and the head is the module it came from, and between
   them they are the only readable thing on the node. The head used to be
   thrown away; SOURCE reads it now, so both groups are captured.

   The hash may contain UNDERSCORES, and it often starts with one. This
   pattern refused them, so roughly one class in eight fell through to the
   raw bundler name — the panel reported `div.inspectShell_head__wB_7b`
   where it meant `div.head`, and SOURCE would have walked up to an
   ancestor for a file the node had all along. Only the authored middle
   stays underscore-free, which is what keeps the split unambiguous:
   group two stops at the first underscore, and the `__` after it is the
   separator by construction. */
const MODULE_CLASS_RE = /^([A-Za-z0-9]+)_([A-Za-z0-9-]+)__[A-Za-z0-9_-]+$/

function readableClass(el: HTMLElement): string | null {
  const raw = el.getAttribute('class')
  if (!raw) return null
  const classes = raw.split(/\s+/).filter(Boolean)
  // the authored name hides in a module class, which is rarely the first
  // one on the node — keep looking before settling for whatever leads
  for (const cls of classes) {
    const m = cls.match(MODULE_CLASS_RE)
    if (m) return m[2]
  }
  return classes[0] ?? null
}

/** tag + the most human identity the node carries. A window announces
    itself by its live aria-label — the copy layer and skinVocab have
    already resolved that, so the chain reads in the visitor's skin
    without this file knowing the registry exists.

    Only the window ROOT gets that name. Handing it to every descendant
    made a whole LAYERS chain read "div · in Spec Sheet" — the same label
    on every chip, which is no identity at all. */
export function labelFor(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase()

  if (el.hasAttribute('data-window-id')) {
    const title = el.getAttribute('aria-label') || el.dataset.windowId || ''
    if (title) return `${tag} · ${title}`
  }

  const copyId = el.dataset.copyId
  if (copyId) return `${tag} · ${copyId}`

  const cls = readableClass(el)
  return cls ? `${tag}.${cls}` : tag
}

/** The picked element first, then every ancestor up to and including body. */
export function ancestorChain(el: HTMLElement): ChainEntry[] {
  const out: ChainEntry[] = []
  let node: HTMLElement | null = el
  while (node) {
    out.push({ el: node, label: labelFor(node) })
    if (node === document.body) break
    node = node.parentElement
  }
  return out
}

/* ------------------------------------------------------------- source */

/* SOURCE answers the question the rest of the panel leaves hanging: fine,
   so where do I go to change it? Everything here is a POINTER — a string
   to paste into a repo search — and not a resolved path, because none of
   it can be resolved from the browser:

   · the module file name is reconstructed from the class prefix the
     bundler wrote, and the bundler names that prefix after the file, or
     after the FOLDER when the file is an index.module.css. Two modules
     with the same basename in different folders also print the same;
   · a copy id is a key, and the panel says which file keys live in. It
     does not know whether the key resolved from base or from a skin slot;
   · a window id is a registry entry, and a program's markup lives in
     whatever component that entry points at, which this cannot see.

   Four style rows is the cap. A node with more module classes than that
   is a node whose fifth class is not what anyone came here to find. */

const SOURCE_MAX = 4

/** Every module stylesheet this node's own classList names, printed as a
    file and the authored class inside it. */
function moduleRowsOn(el: HTMLElement): string[] {
  const raw = el.getAttribute('class')
  if (!raw) return []
  const out: string[] = []
  for (const cls of raw.split(/\s+/).filter(Boolean)) {
    const m = cls.match(MODULE_CLASS_RE)
    if (!m) continue
    const text = `${m[1]}.module.css › .${m[2]}`
    if (!out.includes(text)) out.push(text)
    if (out.length === SOURCE_MAX) break
  }
  return out
}

export function sourceOf(el: HTMLElement): SourceRow[] {
  const rows: SourceRow[] = []

  /* An unclassed wrapper is still being styled by something upstream, and
     the nearest ancestor carrying a module class is the honest next stop.
     The row says so rather than presenting a parent's file as the pick's
     own. */
  let styles = moduleRowsOn(el)
  let via: string | null = null
  if (styles.length === 0) {
    let node = el.parentElement
    while (node) {
      const found = moduleRowsOn(node)
      if (found.length > 0) {
        styles = found
        via = labelFor(node)
        break
      }
      node = node.parentElement
    }
  }
  for (const text of styles) rows.push({ kind: 'styles', text, via })

  const copyHost = el.closest<HTMLElement>('[data-copy-id]')
  const copyId = copyHost?.dataset.copyId
  if (copyHost && copyId) {
    rows.push({
      kind: 'copy',
      text: `copy.json › ${copyId}`,
      via: copyHost === el ? null : labelFor(copyHost),
    })
  }

  const win = el.closest<HTMLElement>('[data-window-id]')
  const winId = win?.dataset.windowId
  if (winId) rows.push({ kind: 'program', text: `registry.tsx › '${winId}'`, via: null })

  return rows
}

/* ---------------------------------------------------------------- motion */

const SPRING_NAMES = new Set(Object.keys(SPRING_TOKENS))

/** Which named spring moves this? Read off the nearest [data-spring]
    ancestor — the components declare it at the motion element, so the
    mapping maintains itself as the shell grows. A hit on an ancestor is
    still true (the subtree rides that spring) but it is not the same
    claim as a spring declared HERE, so it reports as inherited. */
export function springFor(el: HTMLElement): SpringInfo | null {
  const host = el.closest<HTMLElement>('[data-spring]')
  const name = host?.dataset.spring
  if (!name || !SPRING_NAMES.has(name)) return null

  const root = getComputedStyle(document.documentElement)
  const fallback = SPRING_TOKENS[name as keyof typeof SPRING_TOKENS] as Record<string, number>
  const read = (key: string): string | null => {
    const css = root.getPropertyValue('--spring-' + name + '-' + key).trim()
    if (css) return css
    const js = fallback?.[key]
    return js === undefined ? null : String(js)
  }

  return {
    name,
    stiffness: read('stiffness') ?? '—',
    damping: read('damping') ?? '—',
    mass: read('mass'),
    inherited: host !== el,
  }
}

/* ------------------------------------------------------------ type + skin */

export function typeInfo(el: HTMLElement): TypeInfo {
  const cs = getComputedStyle(el)
  return {
    family: cs.fontFamily,
    size: cs.fontSize,
    weight: cs.fontWeight,
    tracking: cs.letterSpacing,
    leading: cs.lineHeight,
  }
}

/** A subtree carrying its own data-skin resolves tokens LOCALLY — the
    live skin previews in SPEC.SHEET are exactly this. Worth saying out
    loud, or the panel looks like it's lying about the page. */
export function isReskinned(el: HTMLElement): boolean {
  const scope = el.closest('[data-skin]')
  return !!scope && scope !== document.documentElement
}

/* --------------------------------------------------------------- assembly */

export function inspectElement(el: HTMLElement): Inspection {
  const tokens = resolveTokenUsage(el)
  const typeVars: string[] = []
  for (const row of tokens) {
    for (const name of row.varNames) {
      if (name.startsWith('--type-') && !typeVars.includes(name)) typeVars.push(name)
    }
  }

  return {
    label: labelFor(el),
    chain: ancestorChain(el),
    tokens,
    colors: effectiveColors(el),
    type: typeInfo(el),
    typeVars,
    spring: springFor(el),
    reskinned: isReskinned(el),
    source: sourceOf(el),
  }
}
