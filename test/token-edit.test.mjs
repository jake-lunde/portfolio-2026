/* The token commit's pure half. These exist for the same reason the TOKEN
 * BRIDGE tests do: the failure mode is SILENT. A materialization that writes
 * into the base set instead of the theme's own file moves every skin at
 * once, and the PR still looks like a one-line change. A slash that never
 * became a dot produces `{color/nasa/cobalt}`, which Style Dictionary
 * resolves to nothing and CI reports as a broken ref two steps later.
 *
 * src/lib/tokenEdit.ts is written I/O-free precisely so this can run with no
 * network, no token and no Next server.
 *
 * Run: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'

const here = dirname(fileURLToPath(import.meta.url))
const src = (p) => readFileSync(resolve(here, '..', p), 'utf8')

/** Transpile a TS module in memory and return it as a data: URL, rewriting
    its relative imports to the data: URLs of already-built dependencies. */
function moduleUrl(path, deps = {}) {
  let code = src(path)
  for (const [spec, url] of Object.entries(deps)) {
    code = code.split(`'${spec}'`).join(`'${url}'`)
  }
  const js = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return 'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
}

const paletteUrl = moduleUrl('src/lib/palette.ts')
const tiersUrl = moduleUrl('src/lib/tokens.generated.ts')
const editUrl = moduleUrl('src/lib/tokenEdit.ts', {
  './palette': paletteUrl,
  './tokens.generated': tiersUrl,
})

const {
  applyTokenEdits,
  serializeTokens,
  tokenRef,
  varIndex,
  themeFor,
  isTokenTheme,
  themeFilePath,
  MAX_EDITS,
} = await import(editUrl)

const light = JSON.parse(src('tokens/semantic/classic-light.json'))
const dark = JSON.parse(src('tokens/semantic/classic-dark.json'))
const medieval = JSON.parse(src('tokens/semantic/medieval.json'))
const clone = (o) => JSON.parse(JSON.stringify(o))

const COBALT = 'color/nasa/cobalt'
const GLOW = 'color/nasa/glow'

/* ---------------------------------------------------------- name shape */

test('varIndex flattens nested groups the way the build names them', () => {
  const idx = varIndex(light)
  assert.deepEqual(idx.get('--accent'), ['accent'])
  assert.deepEqual(idx.get('--status-positive-on-base'), ['status', 'positive', 'on-base'])
  assert.deepEqual(idx.get('--interactive-default-content-hover'), [
    'interactive',
    'default',
    'content-hover',
  ])
  // groups themselves are not roles
  assert.equal(idx.has('--status'), false)
})

test('varIndex reads medieval, including the roles it alone carries', () => {
  const idx = varIndex(medieval)
  assert.deepEqual(idx.get('--accent-support'), ['accent-support'])
  assert.deepEqual(idx.get('--status-danger-on-base'), ['status', 'danger', 'on-base'])
  assert.deepEqual(idx.get('--interactive-default-active'), ['interactive', 'default', 'active'])
  // medieval overrides the type roles; they are leaves, not groups
  assert.deepEqual(idx.get('--display'), ['display'])
  // it does NOT carry interactive.accent.* — that one is inherited
  assert.equal(idx.has('--interactive-accent-hover'), false)
})

test('tokenRef converts the palette slash path to the alias dot path', () => {
  assert.equal(tokenRef(COBALT), '{color.nasa.cobalt}')
  assert.equal(tokenRef('color/blood/light'), '{color.blood.light}')
})

/* ------------------------------------------------------------- applying */

test('re-aliases a role in place in the base set', () => {
  const r = applyTokenEdits(clone(light), clone(light), [{ role: 'accent', token: GLOW }])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json.accent, { $value: '{color.nasa.glow}', $type: 'color' })
  assert.equal(r.applied[0].materialized, false)
})

test('re-aliases a NESTED role in place', () => {
  const r = applyTokenEdits(clone(light), clone(light), [
    { role: 'status-positive-base', token: 'color/verdigris/light' },
  ])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json.status.positive.base, {
    $value: '{color.verdigris.light}',
    $type: 'color',
  })
})

test('materializes an inherited role into the dark theme, not the base', () => {
  // accent-support lives only in classic-light; dark inherits it
  assert.equal('accent-support' in dark, false)
  const target = clone(dark)
  const base = clone(light)
  const r = applyTokenEdits(target, base, [{ role: 'accent-support', token: COBALT }])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json['accent-support'], { $value: '{color.nasa.cobalt}', $type: 'color' })
  assert.equal(r.applied[0].materialized, true)
  // the base set is never touched, and neither is the caller's tree
  assert.equal('accent-support' in target, false)
  assert.deepEqual(base['accent-support'], light['accent-support'])
})

test('materializes a nested inherited role, minting its groups', () => {
  // classic-dark has interactive.default.hover but no interactive.accent.*
  const r = applyTokenEdits(clone(dark), clone(light), [
    { role: 'interactive-accent-hover', token: GLOW },
  ])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json.interactive.accent.hover, {
    $value: '{color.nasa.glow}',
    $type: 'color',
  })
  // the sibling that was already there survives
  assert.ok(r.json.interactive.default.hover)
  assert.equal(r.applied[0].materialized, true)
})

test('an in-place re-alias keeps the authored $description', () => {
  // interactive.default.hover carries a derivation note; losing it both
  // destroys the note and shifts every line below, so a one-line change
  // arrives as a whole-file diff
  const r = applyTokenEdits(clone(light), clone(light), [
    { role: 'interactive-default-hover', token: GLOW },
  ])
  assert.equal(r.ok, true)
  const leaf = r.json.interactive.default.hover
  assert.equal(leaf.$value, '{color.nasa.glow}')
  assert.equal(leaf.$type, 'color')
  assert.equal(leaf.$description, light.interactive.default.hover.$description)
  // and the surviving key ORDER is what keeps the diff to one line
  assert.deepEqual(Object.keys(leaf), ['$value', '$type', '$description'])

  const before = src('tokens/semantic/classic-light.json').split('\n')
  const after = serializeTokens(r.json).split('\n')
  const changed = before.filter((line, i) => line !== after[i])
  assert.equal(changed.length, 1, `expected one changed line, got ${changed.length}`)
})

test('any extra authored keys on a leaf survive an edit', () => {
  const target = clone(light)
  target.accent.$extensions = { 'com.figma': { scopes: ['ALL'] } }
  target.accent.$description = 'the system accent'
  const r = applyTokenEdits(target, clone(light), [{ role: 'accent', token: GLOW }])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json.accent, {
    $value: '{color.nasa.glow}',
    $type: 'color',
    $extensions: { 'com.figma': { scopes: ['ALL'] } },
    $description: 'the system accent',
  })
})

test('a MATERIALIZED leaf is minted bare — the base note is not copied', () => {
  // classic-dark inherits interactive.default.content-hover; the base leaf
  // has no $description, so use one that does: accent-support has none —
  // assert the general rule against a base leaf carrying extras
  const base = clone(light)
  base['accent-support'].$description = 'describes the BASE derivation'
  const r = applyTokenEdits(clone(dark), base, [
    { role: 'accent-support', token: 'color/verdigris/light' },
  ])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json['accent-support'], {
    $value: '{color.verdigris.light}',
    $type: 'color',
  })
})

test('applies several edits at once, in order', () => {
  const r = applyTokenEdits(clone(light), clone(light), [
    { role: 'accent', token: GLOW },
    { role: 'accent-support', token: 'color/report/green' },
  ])
  assert.equal(r.ok, true)
  assert.deepEqual(
    r.applied.map((e) => e.role),
    ['accent', 'accent-support'],
  )
})

/* ------------------------------------------------------------ refusals */

test('refuses a role that is not in the token manifest', () => {
  const r = applyTokenEdits(clone(light), clone(light), [{ role: 'accent-ish', token: COBALT }])
  assert.equal(r.ok, false)
  assert.match(r.error, /unknown role/)
})

test('refuses a CORE role — semantic tier only', () => {
  // --border-width-thin is core in tokens.generated.ts
  const r = applyTokenEdits(clone(light), clone(light), [
    { role: 'border-width-thin', token: COBALT },
  ])
  assert.equal(r.ok, false)
  assert.match(r.error, /not semantic/)
})

test('refuses a COMPONENT role', () => {
  const r = applyTokenEdits(clone(light), clone(light), [{ role: 'button-radius', token: COBALT }])
  assert.equal(r.ok, false)
  assert.match(r.error, /not semantic/)
})

test('refuses a semantic role that is not a colour', () => {
  const r = applyTokenEdits(clone(light), clone(light), [{ role: 'shadow-print', token: COBALT }])
  assert.equal(r.ok, false)
  assert.match(r.error, /not a color/)
})

test('refuses a token outside the twelve — including a raw hex', () => {
  for (const token of ['color/ink/base', '#2036C8', 'color.nasa.cobalt', '']) {
    const r = applyTokenEdits(clone(light), clone(light), [{ role: 'accent', token }])
    assert.equal(r.ok, false, `accepted ${token}`)
    assert.match(r.error, /not in the palette/)
  }
})

test('refuses more than the cap, and refuses an empty set', () => {
  const many = Array.from({ length: MAX_EDITS + 1 }, () => ({ role: 'accent', token: COBALT }))
  const over = applyTokenEdits(clone(light), clone(light), many)
  assert.equal(over.ok, false)
  assert.match(over.error, /too many edits/)
  assert.equal(applyTokenEdits(clone(light), clone(light), []).ok, false)
})

test('refuses the same role twice', () => {
  const r = applyTokenEdits(clone(light), clone(light), [
    { role: 'accent', token: COBALT },
    { role: 'accent', token: GLOW },
  ])
  assert.equal(r.ok, false)
  assert.match(r.error, /duplicate role/)
})

test('refuses a malformed edit shape', () => {
  assert.equal(applyTokenEdits(clone(light), clone(light), [{ role: 'accent' }]).ok, false)
  assert.equal(
    applyTokenEdits(clone(light), clone(light), [{ role: '../../etc', token: COBALT }]).ok,
    false,
  )
})

/* ---------------------------------------------------------- formatting */

/* All THREE commit targets, because the escaping rule in serializeTokens
   claims all three: classic-light and medieval carry escaped em dashes in
   $description, classic-dark is pure ASCII. A target that does not round-trip
   byte-for-byte turns every PR into a reformatting diff. */
test('serialize is byte-stable against all three targets on disk', () => {
  for (const [name, tree] of [
    ['classic-light', light],
    ['classic-dark', dark],
    ['medieval', medieval],
  ]) {
    assert.equal(serializeTokens(tree), src(`tokens/semantic/${name}.json`), name)
  }
})

test('a medieval edit is a one-line diff too', () => {
  const r = applyTokenEdits(clone(medieval), clone(light), [
    { role: 'accent-support', token: 'color/gilt/gold' },
  ])
  assert.equal(r.ok, true)
  assert.equal(r.applied[0].materialized, false) // medieval has its own
  const before = src('tokens/semantic/medieval.json').split('\n')
  const after = serializeTokens(r.json).split('\n')
  const changed = before.filter((line, i) => line !== after[i])
  assert.equal(changed.length, 1, `expected one changed line, got ${changed.length}`)
})

test('an edit changes one value and nothing else about the file', () => {
  const before = src('tokens/semantic/classic-light.json')
  const r = applyTokenEdits(clone(light), clone(light), [{ role: 'accent', token: GLOW }])
  const after = serializeTokens(r.json)
  assert.ok(after.endsWith('}\n'))
  assert.equal(after.includes('\n  "surface": {'), true) // 2-space indent held
  const diff = before
    .split('\n')
    .map((line, i) => (line === after.split('\n')[i] ? null : i))
    .filter((i) => i !== null)
  assert.equal(diff.length, 1, `expected one changed line, got ${diff.length}`)
  // key order is untouched
  assert.deepEqual(Object.keys(r.json), Object.keys(light))
})

test('a materialized key lands at the end, leaving the rest in order', () => {
  const r = applyTokenEdits(clone(dark), clone(light), [{ role: 'accent-support', token: COBALT }])
  const keys = Object.keys(r.json)
  assert.deepEqual(keys.slice(0, -1), Object.keys(dark))
  assert.equal(keys[keys.length - 1], 'accent-support')
})

/* --------------------------------------------------------- the targets */

test('themeFor maps the settings store onto the three theme sets', () => {
  assert.equal(themeFor('classic', 'light'), 'classic-light')
  assert.equal(themeFor('classic', 'dark'), 'classic-dark')
  // medieval's selector wins over the dark one — one file, both appearances
  assert.equal(themeFor('medieval', 'light'), 'medieval')
  assert.equal(themeFor('medieval', 'dark'), 'medieval')
  // no token set yet — SAVE has nowhere to go
  assert.equal(themeFor('underwater', 'light'), null)
})

test('only the three theme sets are commit targets', () => {
  assert.equal(isTokenTheme('classic-light'), true)
  assert.equal(isTokenTheme('scale'), false)
  assert.equal(isTokenTheme('../../package'), false)
  assert.equal(themeFilePath('medieval'), 'tokens/semantic/medieval.json')
})
