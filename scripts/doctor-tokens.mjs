#!/usr/bin/env node
/* TOKEN DOCTOR — static integrity checks over tokens/ and the generated CSS.
 *
 * This is the safety net that makes the A8 class of failure impossible: a
 * token rename that silently drops declarations behind a GREEN build. Every
 * check runs against the SAME theme→set→kebab model the build uses, so what
 * the doctor asserts is what actually ships.
 *
 *   npm run tokens:doctor              # warnings don't fail the run
 *   npm run tokens:doctor -- --strict  # warnings become errors (CI gate)
 *   npm run tokens:doctor -- --parity <baseline.css>
 *
 * Checks (v1: D1–D4; v2 adds D5 contrast + D6 orphans):
 *   D1  leaf-vs-group collision   — a token path that is BOTH a leaf and a
 *                                    group prefix of another leaf (the A8 killer).
 *   D2  post-kebab name collision — two distinct paths emitting the same
 *                                    --kebab var in one theme.
 *   D3  declaration tripwire      — emitted var count per selector block vs the
 *                                    distinct enabled-leaf count the model expects.
 *   D4  {ref} integrity + cycles  — every alias resolves; no reference cycles.
 *   D5  AA contrast per theme     — audits fixed content/surface/accent pairs
 *                                    (+ status/interactive pairs if present)
 *                                    against WCAG AA. warn by default, error
 *                                    under --strict; pre-existing failures are
 *                                    allowlisted so --strict stays enableable.
 *   D6  orphaned custom props     — var(--x) consumed in src/ but never
 *                                    emitted (ERROR, the A8 symptom from the
 *                                    consumer side) or emitted but never
 *                                    consumed (WARN, not-yet-adopted).
 *
 * Exit non-zero on any ERROR (and on any WARN under --strict).
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(process.cwd())
const TOKENS_DIR = path.join(ROOT, 'tokens')
const OUT_FILE = path.join(ROOT, 'src/styles/tokens.generated.css')

// Selector strings must stay in lockstep with scripts/build-tokens.mjs.
const SELECTOR = {
  'classic-light': ":root,\n[data-skin='classic']",
  'classic-dark': "[data-theme='dark'],\n[data-skin='classic'][data-theme='dark']",
  medieval: "[data-skin='medieval']",
  underwater: "[data-skin='underwater']",
}

// Vars consumed from outside the token pipeline (next/font injects these at
// runtime); never emitted by tokens, and legitimately so.
const EXTERNAL_VAR_ALLOWLIST = [/^--font-/]

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const findings = [] // { code, level: 'error'|'warn', msg }
function err(code, msg) {
  findings.push({ code, level: 'error', msg })
}
function warn(code, msg) {
  findings.push({ code, level: 'warn', msg })
}

// ---------------------------------------------------------------------------
// Token loading (mirrors build-tokens.mjs's theme→set model)
// ---------------------------------------------------------------------------

const ALIAS_RE = /^\{([^}]+)\}$/

/** Walk a parsed token-set object into flat leaves (skips $-meta keys). */
function flattenSet(json) {
  const out = []
  const walk = (node, trail) => {
    if (node === null || typeof node !== 'object') return
    if ('$value' in node) {
      const rawValue = typeof node.$value === 'string' ? node.$value : String(node.$value)
      const m = ALIAS_RE.exec(rawValue.trim())
      out.push({
        path: trail.join('.'),
        rawValue,
        type: typeof node.$type === 'string' ? node.$type : undefined,
        isAlias: !!m,
        aliasRef: m ? m[1].trim() : undefined,
      })
      return
    }
    for (const key of Object.keys(node)) {
      if (key.startsWith('$')) continue
      walk(node[key], [...trail, key])
    }
  }
  walk(json, [])
  return out
}

/**
 * Nodes that are BOTH a leaf ($value) AND a group (have non-$ children). The
 * flattener short-circuits on $value and never sees the children — so the
 * child tokens are silently swallowed. This is the same-file half of D1;
 * the cross-file half is a path-prefix check over the merged universe.
 */
function findLeafGroupNodes(json) {
  const out = []
  const walk = (node, trail) => {
    if (node === null || typeof node !== 'object') return
    const childKeys = Object.keys(node).filter((k) => !k.startsWith('$'))
    if ('$value' in node && childKeys.length > 0) {
      out.push({ path: trail.join('.'), children: childKeys })
    }
    for (const key of childKeys) walk(node[key], [...trail, key])
  }
  walk(json, [])
  return out
}

/** Kebab var name for a token path — matches SD's name/kebab on our tokens. */
function kebab(tokenPath) {
  return tokenPath
    .split('.')
    .join('-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'))
}

async function loadModel() {
  const themes = await readJson(path.join(TOKENS_DIR, '$themes.json'))
  const metadata = await readJson(path.join(TOKENS_DIR, '$metadata.json'))
  const setFlat = {} // setName -> flat leaves
  const setRaw = {} // setName -> parsed JSON
  for (const set of metadata.tokenSetOrder) {
    const file = path.join(TOKENS_DIR, `${set}.json`)
    try {
      const json = await readJson(file)
      setRaw[set] = json
      setFlat[set] = flattenSet(json)
    } catch {
      warn('LOAD', `set "${set}" in $metadata but file missing/unreadable — skipped.`)
    }
  }
  return { themes, metadata, setFlat, setRaw }
}

/** Sets a theme enables (emit) and sources (resolve-only), preserving order. */
function themeSets(theme, metadata) {
  const enabled = []
  const source = []
  for (const set of metadata.tokenSetOrder) {
    const state = theme.selectedTokenSets[set]
    if (state === 'enabled') enabled.push(set)
    else if (state === 'source') source.push(set)
  }
  return { enabled, source }
}

// ---------------------------------------------------------------------------
// D1 — leaf-vs-group collision
// ---------------------------------------------------------------------------

function checkLeafGroupCollision(theme, sets, model) {
  const { setFlat, setRaw } = model
  const visible = [...sets.source, ...sets.enabled]

  // Same-file: a node carrying $value AND child tokens (children swallowed).
  for (const set of visible) {
    for (const n of findLeafGroupNodes(setRaw[set] ?? {})) {
      err(
        'D1',
        `[${theme.id}] "${set}" node "${n.path}" has $value AND children [${n.children.join(
          ', '
        )}] — the children are silently swallowed (the A8 failure).`
      )
    }
  }

  // Cross-file: one set's leaf path is a strict dotted prefix of another's.
  const paths = new Set()
  for (const set of visible) for (const t of setFlat[set] ?? []) paths.add(t.path)
  const list = [...paths]
  for (const a of list) {
    for (const b of list) {
      if (a === b) continue
      if (b.startsWith(a + '.')) {
        err(
          'D1',
          `[${theme.id}] path "${a}" is both a leaf and a group prefix of "${b}" — one silently wins (the A8 failure).`
        )
      }
    }
  }
}

// ---------------------------------------------------------------------------
// D2 — post-kebab emitted-name collision
// ---------------------------------------------------------------------------

function emittedLeaves(theme, sets, setFlat) {
  // Later enabled sets override earlier ones by path (SD merge order). Return
  // the winning leaf per path, in first-seen order.
  const byPath = new Map()
  for (const set of sets.enabled) {
    for (const t of setFlat[set] ?? []) byPath.set(t.path, { ...t, set })
  }
  return [...byPath.values()]
}

function checkKebabCollision(theme, leaves) {
  const byName = new Map() // kebab -> [paths]
  for (const t of leaves) {
    const name = kebab(t.path)
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name).push(t.path)
  }
  for (const [name, paths] of byName) {
    if (paths.length > 1) {
      err(
        'D2',
        `[${theme.id}] paths [${paths.join(', ')}] all emit --${name} — the last one wins, the rest vanish.`
      )
    }
  }
}

// ---------------------------------------------------------------------------
// D3 — declaration tripwire (model expectation vs generated CSS)
// ---------------------------------------------------------------------------

function parseSelectorBlocks(rawCss) {
  // Strip /* */ comments first so inter-block doc comments and inline
  // OFF-GRID notes never leak into a captured selector or decl count.
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '')
  // Returns [{ selector, declCount }]. Selector is normalized to collapse
  // whitespace so it can be matched against the SELECTOR map.
  const blocks = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(css)) !== null) {
    const selector = m[1].trim()
    if (!selector || selector.startsWith('/*') || !m[2].includes('--')) continue
    const declCount = (m[2].match(/(^|\n|;)\s*--[a-z0-9-]+\s*:/gi) || []).length
    blocks.push({ selector, declCount })
  }
  return blocks
}

function normalizeSelector(sel) {
  return sel.replace(/\s+/g, ' ').trim()
}

async function checkDeclTripwire(model, cssPath) {
  let css
  try {
    css = await fs.readFile(cssPath, 'utf8')
  } catch {
    warn('D3', `generated CSS not found at ${cssPath} — run tokens:build. Skipping tripwire.`)
    return
  }
  const blocks = parseSelectorBlocks(css)
  const bySelector = new Map()
  for (const b of blocks) bySelector.set(normalizeSelector(b.selector), b.declCount)

  for (const theme of model.themes) {
    const sel = SELECTOR[theme.id]
    if (!sel) continue
    const norm = normalizeSelector(sel)
    const actual = bySelector.get(norm)
    if (actual === undefined) {
      warn('D3', `no selector block for theme "${theme.id}" (${norm}) in ${path.basename(cssPath)}.`)
      continue
    }
    const sets = themeSets(theme, model.metadata)
    const expected = new Set(emittedLeaves(theme, sets, model.setFlat).map((t) => kebab(t.path))).size
    if (actual !== expected) {
      err(
        'D3',
        `[${theme.id}] emitted ${actual} vars but the model expects ${expected} enabled leaves — a declaration was dropped or duplicated. Rebuild and diff.`
      )
    }
  }
}

// ---------------------------------------------------------------------------
// D4 — {ref} integrity + cycles
// ---------------------------------------------------------------------------

function checkRefs(theme, sets, setFlat) {
  // Resolvable universe: path -> leaf, from enabled+source (enabled wins).
  const byPath = new Map()
  for (const set of [...sets.source, ...sets.enabled]) {
    for (const t of setFlat[set] ?? []) byPath.set(t.path, t)
  }
  const resolve = (refBody) => byPath.get(refBody.trim())

  for (const [startPath, tok] of byPath) {
    if (!tok.isAlias) continue
    // Walk the alias chain from this token; detect dangling + cycles.
    const seen = new Set()
    let cur = tok
    while (cur && cur.isAlias) {
      const key = cur.path
      if (seen.has(key)) {
        err('D4', `[${theme.id}] reference cycle through "${startPath}" (revisited "${key}").`)
        break
      }
      seen.add(key)
      const next = resolve(cur.aliasRef)
      if (!next) {
        err(
          'D4',
          `[${theme.id}] "${cur.path}" references {${cur.aliasRef}}, which resolves to nothing in this theme.`
        )
        break
      }
      cur = next
    }
  }
}

// ---------------------------------------------------------------------------
// D7 — type-ramp completeness. Every semantic `type.{role}` group must define
// at least size + leading + family (a role missing one of these can't render
// a complete text style). warn-only; the ramp is additive and this is a
// design-contract guard, not an A8-class safety check.
// ---------------------------------------------------------------------------

function checkTypeRamp(model) {
  const REQUIRED = ['size', 'leading', 'family']
  const scale = model.setRaw['semantic/scale']
  const typeGroup = scale && scale.type
  if (!typeGroup || typeof typeGroup !== 'object') return
  for (const role of Object.keys(typeGroup)) {
    if (role.startsWith('$')) continue
    const node = typeGroup[role]
    if (node === null || typeof node !== 'object') continue
    const missing = REQUIRED.filter((k) => !(node[k] && '$value' in node[k]))
    if (missing.length) {
      warn('D7', `type.${role} is missing required sub-token(s): [${missing.join(', ')}].`)
    }
  }
}

// ---------------------------------------------------------------------------
// Parity harness (--parity [ref]) — regression gate over resolved values.
//
// Parses the generated CSS (baseline + current) into selector blocks, layers
// them into the three shipping themes honoring cascade order (dark/medieval
// override the classic-light base — real CSS custom-property inheritance,
// not a merge we invented), resolves var(--x) chains within each theme's own
// merged map, then diffs per (theme, varName). CHANGED/REMOVED are
// regressions (errors, always — not gated behind --strict); ADDED is the
// point of additive token work and only shows up in the summary count.
// ---------------------------------------------------------------------------

const THEME_LAYERS = {
  'classic-light': ['classic-light'],
  'classic-dark': ['classic-light', 'classic-dark'],
  medieval: ['classic-light', 'medieval'],
}

/** Parse a generated-CSS string into normalized-selector -> Map(varName -> rawValue). */
function parseCssBlocks(cssText) {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, '')
  const blocks = new Map()
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(css)) !== null) {
    const selector = normalizeSelector(m[1])
    if (!selector || !m[2].includes('--')) continue
    const decls = blocks.get(selector) ?? new Map()
    for (const d of m[2].matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)) {
      decls.set(d[1], d[2].trim())
    }
    blocks.set(selector, decls)
  }
  return blocks
}

/** Layer selector blocks into the theme's merged raw (unresolved) var map. */
function buildThemeRawMaps(blocks) {
  const out = new Map()
  for (const [themeId, layerIds] of Object.entries(THEME_LAYERS)) {
    const merged = new Map()
    for (const layerId of layerIds) {
      const decls = blocks.get(normalizeSelector(SELECTOR[layerId]))
      if (!decls) continue
      for (const [name, value] of decls) merged.set(name, value)
    }
    out.set(themeId, merged)
  }
  return out
}

const VAR_REF_RE = /var\((--[a-zA-Z0-9-]+)\)/g

/** Resolve var(--x) chains within one theme's raw map. Unresolvable refs
 * (external vars like --font-sans, injected by next/font) are left as
 * literal var() text. `chain` is a per-resolution cycle guard. */
function resolveValue(rawValue, rawMap, chain) {
  let result = rawValue
  let guard = 0
  while (result.includes('var(--') && guard < 24) {
    guard++
    let changed = false
    result = result.replace(VAR_REF_RE, (match, refToken) => {
      const refName = refToken.slice(2)
      if (chain.has(refName)) return match // cycle — D4 owns reporting source cycles
      const refRaw = rawMap.get(refName)
      if (refRaw === undefined) return match // external var — leave as-is
      changed = true
      chain.add(refName)
      const out = resolveValue(refRaw, rawMap, chain)
      chain.delete(refName)
      return out
    })
    if (!changed) break
  }
  return result
}

function resolveThemeMap(rawMap) {
  const resolved = new Map()
  for (const name of rawMap.keys()) {
    resolved.set(name, resolveValue(rawMap.get(name), rawMap, new Set([name])))
  }
  return resolved
}

/** cssText -> Map(themeId -> Map(varName -> resolved computed value)). */
function buildResolvedThemeMaps(cssText) {
  const rawMaps = buildThemeRawMaps(parseCssBlocks(cssText))
  const resolved = new Map()
  for (const [themeId, rawMap] of rawMaps) resolved.set(themeId, resolveThemeMap(rawMap))
  return resolved
}

async function checkParity(refArg, currentCss, reporters) {
  if (!currentCss) {
    console.log('parity: current tokens.generated.css not found — run tokens:build. Skipping.')
    return
  }
  let baselineCss
  try {
    baselineCss = execSync(`git show ${refArg}:src/styles/tokens.generated.css`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    console.log(
      `parity: baseline "${refArg}:src/styles/tokens.generated.css" not found — first-time branch, skipping.`
    )
    return
  }

  const baseline = buildResolvedThemeMaps(baselineCss)
  const current = buildResolvedThemeMaps(currentCss)

  let unchanged = 0
  let added = 0
  let changed = 0
  let removed = 0

  for (const themeId of new Set([...baseline.keys(), ...current.keys()])) {
    const before = baseline.get(themeId) ?? new Map()
    const after = current.get(themeId) ?? new Map()
    for (const name of new Set([...before.keys(), ...after.keys()])) {
      const hasBefore = before.has(name)
      const hasAfter = after.has(name)
      if (hasBefore && hasAfter) {
        if (before.get(name) === after.get(name)) {
          unchanged++
        } else {
          changed++
          reporters.err(
            'PARITY',
            `[${themeId}] --${name} changed: "${before.get(name)}" -> "${after.get(name)}"`
          )
        }
      } else if (hasAfter) {
        added++
      } else {
        removed++
        reporters.err('PARITY', `[${themeId}] --${name} removed (was "${before.get(name)}").`)
      }
    }
  }

  console.log(
    `\nparity (vs ${refArg}): ${unchanged} unchanged, ${added} added, ${changed} changed, ${removed} removed.`
  )
}

// ---------------------------------------------------------------------------
// D5 — AA contrast per theme
//
// Luminance/contrast math copied (not imported — this is a Node script, that
// component is browser-side React) from
// src/programs/specsheet/SpecSheet.tsx ~L32-46 (channelLum/luminance/contrast).
// Keep these in lockstep by hand if SpecSheet's math ever changes.
// ---------------------------------------------------------------------------

function channelLum(c) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
function luminance([r, g, b]) {
  return 0.2126 * channelLum(r) + 0.7152 * channelLum(g) + 0.0722 * channelLum(b)
}
function contrastRatio(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Parse a resolved token value (hex or rgb/rgba) into an [r,g,b] triple. */
function parseColorValue(value) {
  if (typeof value !== 'string') return null
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(value.trim())
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    const n = parseInt(h, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(value.trim())
  if (rgb) {
    const parts = rgb[1].split(',').map((s) => parseFloat(s.trim()))
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => !Number.isNaN(n))) {
      return [parts[0], parts[1], parts[2]]
    }
  }
  return null
}

// Fixed pairs, audited in every theme. min is the WCAG ratio (4.5 = normal
// text AA, 3.0 = large-text/non-text AA).
const CONTRAST_PAIRS = [
  { fg: 'content', bg: 'surface', min: 4.5 },
  { fg: 'content-muted', bg: 'surface', min: 4.5 },
  { fg: 'content', bg: 'surface-raised', min: 4.5 },
  { fg: 'on-accent-expressive', bg: 'accent-expressive', min: 4.5 },
  { fg: 'accent', bg: 'surface', min: 3.0 },
  { fg: 'content-inverse', bg: 'surface-inverse', min: 4.5 },
]

/**
 * Pairs that fail AA today, keyed `${theme.id}/${fg}-${bg}`. --strict
 * promotes D5 failures to errors, so any pre-existing failure must land
 * here (permanently downgraded to warn) or a clean tree could never turn
 * --strict on in CI. Empty as of 2026-07-19 — every fixed pair above passes
 * AA in all three shipping themes (verified by hand before wiring this
 * check; see doctor-tokens D5 in HANDOFF for the numbers). Add entries here
 * — with a FIXME comment — the moment a real one shows up.
 */
const PREEXISTING_CONTRAST_ALLOWLIST = new Set([
  // 'medieval/on-accent-expressive-accent-expressive', // FIXME(medieval/on-accent-expressive vs accent-expressive): 4.1 — pre-existing, fix in a design pass
])

/** status.*.on-base/status.*.base and interactive.accent hover pairs — only
 * audited if FABLE's concurrent work has actually emitted them. */
function detectDynamicContrastPairs(varNames) {
  const pairs = []
  for (const name of varNames) {
    const m = /^status-(.+)-on-base$/.exec(name)
    if (!m) continue
    const baseName = `status-${m[1]}-base`
    if (varNames.has(baseName)) {
      pairs.push({ fg: name, bg: baseName, min: 4.5, label: `status.${m[1]} on-base/base` })
    }
  }
  if (varNames.has('interactive-accent-on-hover') && varNames.has('interactive-accent-hover')) {
    pairs.push({
      fg: 'interactive-accent-on-hover',
      bg: 'interactive-accent-hover',
      min: 4.5,
      label: 'interactive.accent on-hover/hover',
    })
  }
  return pairs
}

function checkContrast(model, resolvedThemeMaps, strict) {
  for (const theme of model.themes) {
    const resolved = resolvedThemeMaps.get(theme.id)
    if (!resolved) continue
    const varNames = new Set(resolved.keys())
    const pairs = [...CONTRAST_PAIRS, ...detectDynamicContrastPairs(varNames)]
    for (const { fg, bg, min, label } of pairs) {
      const fgRaw = resolved.get(fg)
      const bgRaw = resolved.get(bg)
      if (fgRaw === undefined || bgRaw === undefined) continue // not present in this theme
      const fgRgb = parseColorValue(fgRaw)
      const bgRgb = parseColorValue(bgRaw)
      if (!fgRgb || !bgRgb) {
        warn('D5', `[${theme.id}] --${fg}/--${bg}: couldn't parse "${fgRaw}"/"${bgRaw}" as a color — skipped.`)
        continue
      }
      const ratio = contrastRatio(fgRgb, bgRgb)
      if (ratio >= min) continue
      const pairLabel = label ?? `--${fg} on --${bg}`
      const allowKey = `${theme.id}/${fg}-${bg}`
      const msg = `[${theme.id}] ${pairLabel}: ${ratio.toFixed(2)}:1 fails AA (needs ${min}:1).`
      if (PREEXISTING_CONTRAST_ALLOWLIST.has(allowKey)) {
        warn('D5', `${msg} allowlisted pre-existing failure.`)
      } else if (strict) {
        err('D5', msg)
      } else {
        warn('D5', msg)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// D6 — orphaned custom properties (consumer/emitter mismatch)
// ---------------------------------------------------------------------------

const SRC_DIR = path.join(ROOT, 'src')
const SCAN_EXT_RE = /\.(css|tsx|ts)$/
const CONSUMED_RE = /var\(\s*--([a-zA-Z0-9-]+)/g
// Two shapes of "this codebase declares --x itself, outside the token
// pipeline": a plain CSS/object declaration (`--x: value` / `'--x': value`),
// and a computed-property key with a TS cast (`['--x' as string]: value`,
// as PhotoWall.tsx uses for its per-photo --tilt). Deliberately NOT scoped
// to "same file as the consumer" — --tilt is declared in PhotoWall.tsx and
// consumed in shell.module.css, two different files, and that's a fine
// pattern (inline style cascades to children styled by the module CSS).
const LOCAL_DECL_RE_1 = /--([a-zA-Z0-9-]+)\s*:/g
const LOCAL_DECL_RE_2 = /['"]--([a-zA-Z0-9-]+)['"]\s*(?:as\s+\w+)?\s*\]/g

async function walkSrcFiles(dir) {
  const out = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walkSrcFiles(p)))
    else if (SCAN_EXT_RE.test(entry.name)) out.push(p)
  }
  return out
}

function collectEmittedNames(blocks) {
  const names = new Set()
  for (const decls of blocks.values()) for (const name of decls.keys()) names.add(name)
  return names
}

async function checkOrphans(emittedNames) {
  let files
  try {
    files = await walkSrcFiles(SRC_DIR)
  } catch {
    warn('D6', `could not walk ${path.relative(ROOT, SRC_DIR)} — skipping orphan check.`)
    return
  }

  const declaredLocally = new Set()
  const consumedByName = new Map() // name -> Set(relative file path)

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8')
    for (const m of text.matchAll(LOCAL_DECL_RE_1)) declaredLocally.add(m[1])
    for (const m of text.matchAll(LOCAL_DECL_RE_2)) declaredLocally.add(m[1])
    for (const m of text.matchAll(CONSUMED_RE)) {
      const rel = path.relative(ROOT, file)
      if (!consumedByName.has(m[1])) consumedByName.set(m[1], new Set())
      consumedByName.get(m[1]).add(rel)
    }
  }

  for (const [name, fileSet] of consumedByName) {
    if (emittedNames.has(name)) continue
    if (EXTERNAL_VAR_ALLOWLIST.some((re) => re.test(`--${name}`))) continue
    if (declaredLocally.has(name)) continue
    err(
      'D6',
      `--${name} is used via var() in [${[...fileSet].join(
        ', '
      )}] but is never emitted by tokens and never locally declared — likely a renamed/removed token (the A8 symptom from the consumer side).`
    )
  }

  for (const name of emittedNames) {
    if (!consumedByName.has(name)) {
      warn('D6', `--${name} is emitted but never consumed via var() anywhere in src/ — dead, or not yet adopted.`)
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const strict = args.includes('--strict')
  const parityIdx = args.indexOf('--parity')
  const parityFile = parityIdx >= 0 ? args[parityIdx + 1] : null

  const model = await loadModel()

  for (const theme of model.themes) {
    const sets = themeSets(theme, model.metadata)
    checkLeafGroupCollision(theme, sets, model)
    checkKebabCollision(theme, emittedLeaves(theme, sets, model.setFlat))
    checkRefs(theme, sets, model.setFlat)
  }
  await checkDeclTripwire(model, OUT_FILE)
  checkTypeRamp(model)

  // D5 + D6 read the generated CSS once (the emitted truth, post-build).
  let currentCss = null
  try {
    currentCss = await fs.readFile(OUT_FILE, 'utf8')
  } catch {
    warn('DOCTOR', 'tokens.generated.css missing — run tokens:build (D5/D6/parity skipped).')
  }
  if (currentCss) {
    checkContrast(model, buildResolvedThemeMaps(currentCss), strict) // D5
    await checkOrphans(collectEmittedNames(parseCssBlocks(currentCss))) // D6
  }

  // Parity: --parity [ref], ref defaults to `main` (the PR base).
  if (parityIdx >= 0 && currentCss) {
    await checkParity(parityFile || 'main', currentCss, { err, warn })
  }

  // ---- report ----
  const errors = findings.filter((f) => f.level === 'error')
  const warns = findings.filter((f) => f.level === 'warn')
  for (const f of findings) {
    const tag = f.level === 'error' ? 'ERROR' : 'WARN '
    console.log(`${tag} ${f.code}  ${f.msg}`)
  }
  // --strict does NOT blanket-promote warnings: D5 contrast already self-
  // promotes to error under strict, and the A8-symptom orphan (consumed-but-
  // never-emitted) is always an error. The remaining warns — pre-existing
  // allowlisted contrast + emitted-but-not-yet-adopted tokens — must NOT gate
  // CI, or every additive token PR would fail before its adoption sweep.
  const failed = errors.length > 0
  console.log(
    `\n${failed ? '✗' : '✓'} doctor: ${errors.length} error(s), ${warns.length} warning(s)${
      strict ? ' (strict)' : ''
    }.`
  )
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('doctor crashed:', e)
  process.exit(2)
})
