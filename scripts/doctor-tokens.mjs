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
 *
 * Exit non-zero on any ERROR (and on any WARN under --strict).
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

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
// Parity harness (--parity <baseline.css>) — see checkParity in step 1
// ---------------------------------------------------------------------------

// Populated in step 1.
let checkParity = null

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

  if (parityFile && checkParity) {
    await checkParity(model, parityFile, { err, warn })
  } else if (parityFile) {
    warn('PARITY', 'parity harness not yet wired.')
  }

  // ---- report ----
  const errors = findings.filter((f) => f.level === 'error')
  const warns = findings.filter((f) => f.level === 'warn')
  for (const f of findings) {
    const tag = f.level === 'error' ? 'ERROR' : 'WARN '
    console.log(`${tag} ${f.code}  ${f.msg}`)
  }
  const failed = errors.length > 0 || (strict && warns.length > 0)
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
