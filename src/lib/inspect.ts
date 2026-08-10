import { TOKEN_TIERS } from './tokens.generated'
import { SPRING_TOKENS } from './motion.generated'
import { parseColor, hexToRgb, toHex, contrast, grade, type RGB } from './contrast'

/* INSPECT.MODE's engine — SYS-21. Pure DOM + arithmetic, no React, so the
   panel is only a renderer and the reading can be checked from a console.

   The question it answers: for any element on this desktop, which token
   custom properties style it, what do they resolve to HERE (a nested
   data-skin re-scopes the whole set), what does its fg/bg pair grade, and
   which named spring moves it.

   Two honest limits, both fine for phase 0 and both worth knowing:
   · the cascade is approximated by DOCUMENT ORDER, not specificity — the
     last matching rule that sets a property wins. Right for this
     codebase (CSS modules, one rule per property per component) and
     wrong for a stylesheet that leans on specificity.
   · pseudo-class state is read live: a `:hover` rule matches only while
     the element is actually hovered. */

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
   alone on purpose — :hover / :focus-visible are real live state. */
const PSEUDO_EL_RE =
  /::[\w-]+(\([^)]*\))?|:(before|after|first-line|first-letter|selection|placeholder|marker|backdrop)\b/gi

function matchesSelector(el: HTMLElement, selectorText: string): boolean {
  for (const part of selectorText.split(',')) {
    const subject = part.replace(PSEUDO_EL_RE, '').trim()
    if (!subject) continue
    try {
      if (el.matches(subject)) return true
    } catch {
      /* :has(), ::part(), vendor selectors older browsers choke on — skip it */
    }
  }
  return false
}

function collectFrom(style: CSSStyleDeclaration, into: Map<string, TokenRow>) {
  for (let i = 0; i < style.length; i++) {
    const property = style.item(i)
    const raw = style.getPropertyValue(property)
    if (!raw || !raw.includes('var(')) continue
    const varNames = varNamesIn(raw)
    if (varNames.length === 0) continue
    // last writer in document order wins; Map keeps the first insertion
    // POSITION, which reads better than shuffling rows on every override
    into.set(property, { property, varNames, raw: raw.trim() })
  }
}

function walkRules(rules: CSSRuleList, el: HTMLElement, into: Map<string, TokenRow>) {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]

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
      if (matchesSelector(el, rule.selectorText)) collectFrom(rule.style, into)
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

/** Foreground as computed, background as PAINTED — the nearest ancestor
    that actually lays down an opaque color, which is what the eye reads
    and therefore what the ratio has to be measured against. */
export function effectiveColors(el: HTMLElement): EffectiveColors {
  const fg = parseColor(getComputedStyle(el).color)

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
  return {
    fg,
    bg,
    fgHex: fg ? toHex(fg) : null,
    bgHex: bg ? toHex(bg) : null,
    ratio,
    grade: ratio === null ? null : grade(ratio),
  }
}

/* ------------------------------------------------------- identity + chain */

/* CSS-module classes ship as `Component_class__hash`. The middle is the
   name the author wrote, and it's the only readable thing on the node. */
const MODULE_CLASS_RE = /^[A-Za-z0-9]+_([A-Za-z0-9-]+)__[A-Za-z0-9-]+$/

function readableClass(el: HTMLElement): string | null {
  const raw = el.getAttribute('class')
  if (!raw) return null
  for (const cls of raw.split(/\s+/).filter(Boolean)) {
    const m = cls.match(MODULE_CLASS_RE)
    return m ? m[1] : cls
  }
  return null
}

/** tag + the most human identity the node carries. A window announces
    itself by its live aria-label — the copy layer and skinVocab have
    already resolved that, so the chain reads in the visitor's skin
    without this file knowing the registry exists. */
export function labelFor(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase()

  const win = el.closest<HTMLElement>('[data-window-id]')
  if (win) {
    const title = win.getAttribute('aria-label') || win.dataset.windowId || ''
    if (title) {
      return win === el ? `${tag} · ${title}` : `${tag} · in ${title}`
    }
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

/* ---------------------------------------------------------------- motion */

const SPRING_NAMES = new Set(Object.keys(SPRING_TOKENS))

/** Which named spring moves this? Read off the nearest [data-spring]
    ancestor — the components declare it at the motion element, so the
    mapping maintains itself as the shell grows. */
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
  }
}
