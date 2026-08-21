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
import { readFileSync, readdirSync } from 'node:fs'
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
const candidatesUrl = moduleUrl('src/lib/styleCandidates.ts', { './tokens.generated': tiersUrl })
const editUrl = moduleUrl('src/lib/tokenEdit.ts', {
  './palette': paletteUrl,
  './tokens.generated': tiersUrl,
  './styleCandidates': candidatesUrl,
})

const {
  applyComponentEdits,
  applyTokenEdits,
  componentFilePath,
  serializeComponentTokens,
  serializeTokens,
  tokenRef,
  validateEdit,
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

const COMPONENTS = ['button', 'desktop-icons', 'menubar', 'stamp', 'window']
const component = (id) => JSON.parse(src(componentFilePath(id)))

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

test('refuses a COMPONENT role — a palette primitive is not its ramp', () => {
  // the component tier has its own law (styleCandidates): a radius row takes
  // radius roles, and a core color primitive is not one of them. Even a role
  // whose ramp WOULD take a color still cannot land in a theme file.
  const r = applyTokenEdits(clone(light), clone(light), [{ role: 'button-radius', token: COBALT }])
  assert.equal(r.ok, false)
  assert.match(r.error, /not a candidate for "button-radius"/)

  const lawful = applyTokenEdits(clone(light), clone(light), [
    { role: 'button-bg', token: 'surface-raised' },
  ])
  assert.equal(lawful.ok, false)
  assert.match(lawful.error, /not semantic/)
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

/* ============================================================ COMPONENT

   STYLER's half. The failure modes are the same species as the semantic
   half's and just as quiet: a rebind that keeps the OFF-GRID note leaves a
   file that describes itself wrongly; a role minted rather than found puts a
   token in the JSON that no CSS reads; a mixed set writes one component's
   change into another's file. */

test('validateEdit takes a component rebind that is inside its ramp', () => {
  assert.equal(validateEdit({ role: 'button-radius', token: 'radius/pill' }), null)
  assert.equal(validateEdit({ role: 'button-bg', token: 'surface-raised' }), null)
  assert.equal(validateEdit({ role: 'menubar-gap', token: 'spacing/component/md' }), null)
  assert.equal(validateEdit({ role: 'stamp-border-width', token: 'border-width/subtle' }), null)
})

test('validateEdit refuses a target from the wrong family', () => {
  assert.match(
    validateEdit({ role: 'button-radius', token: 'surface' }),
    /token "surface" is not a candidate for "button-radius"/,
  )
  assert.match(
    validateEdit({ role: 'button-bg', token: 'space/2' }),
    /not a candidate for "button-bg"/,
  )
  // a core step behind a semantic role is still not the role
  assert.match(
    validateEdit({ role: 'button-radius', token: 'radius/md' }),
    /not a candidate for "button-radius"/,
  )
})

test('validateEdit refuses a locked structural dimension', () => {
  for (const role of ['menubar-h', 'window-ctrl-size', 'desktop-icons-cell-width']) {
    assert.match(validateEdit({ role, token: 'space/8' }), /is locked — no lawful ramp/)
  }
})

test('validateEdit refuses a palette primitive on a component color row', () => {
  // colour rows take semantic ROLES; the twelve primitives are the semantic
  // tier's raw material, and a component that aliased one would skip the layer
  // that makes skins possible
  assert.match(
    validateEdit({ role: 'button-bg', token: COBALT }),
    /token "color\/nasa\/cobalt" is not a candidate for "button-bg"/,
  )
})

/* THE TEXT STYLE ROW. Type styles are packages, not knobs (Jake, s100): a
   text element's one row swaps a whole typography role for a whole typography
   role. The parent it names — stamp.text — is the one component-tier token
   the build EXPANDS rather than emits, so it appears in TOKEN_TIERS nowhere;
   everything below would pass just as happily if validateEdit had quietly
   started answering "unknown role" to every one of them, which is why the
   lawful cases come first and by name. */

test('validateEdit takes a whole type role on a text element', () => {
  assert.equal(validateEdit({ role: 'stamp-text', token: 'typography/label' }), null)
  assert.equal(validateEdit({ role: 'window-title-text', token: 'typography/body-sm' }), null)
  assert.equal(validateEdit({ role: 'menubar-wordmark-text', token: 'typography/display' }), null)
  assert.equal(validateEdit({ role: 'desktop-icons-label-text', token: 'typography/micro' }), null)
})

test('validateEdit refuses half a type role, and every member row', () => {
  // the composite's own members are what a knob would reach for
  for (const half of ['type/label/size', 'type/label/weight', 'text/label', 'mono']) {
    assert.match(
      validateEdit({ role: 'stamp-text', token: half }),
      /is not a candidate for "stamp-text"/,
      half,
    )
  }
  // and the five rows the build expands the parent into stay shut, even when
  // handed the very role their parent could lawfully take
  for (const member of [
    'font-family',
    'font-size',
    'font-weight',
    'letter-spacing',
    'line-height',
  ]) {
    assert.match(
      validateEdit({ role: `stamp-text-${member}`, token: 'typography/label' }),
      /is locked — no lawful ramp/,
      member,
    )
  }
})

test('validateEdit still grades the semantic tier exactly as before', () => {
  assert.equal(validateEdit({ role: 'accent', token: COBALT }), null)
  assert.match(validateEdit({ role: 'accent', token: 'surface' }), /not in the palette/)
  assert.match(validateEdit({ role: 'border-width-thin', token: COBALT }), /is core, not semantic/)
  assert.match(validateEdit({ role: 'accent-ish', token: COBALT }), /unknown role/)
})

test('rebinds an OFF-GRID literal and retires the note that described it', () => {
  const button = component('button')
  assert.ok(button.button.sm['padding-y'].$description.startsWith('OFF-GRID'))

  const r = applyComponentEdits(button, [{ role: 'button-sm-padding-y', token: 'space/2' }])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json.button.sm['padding-y'], { $value: '{space.2}', $type: 'dimension' })
  // key order is the authored one, so the diff stays local
  assert.deepEqual(Object.keys(r.json.button.sm['padding-y']), ['$value', '$type'])
  // siblings are untouched, and so is the caller's tree
  assert.deepEqual(r.json.button.sm['padding-x'], button.button.sm['padding-x'])
  assert.deepEqual(r.json.button.md, button.button.md)
  assert.equal(button.button.sm['padding-y'].$value, '6px')
  assert.equal(r.applied[0].materialized, false)
})

test('rebinding a leaf that already carried a ref keeps its $type', () => {
  const r = applyComponentEdits(component('button'), [
    { role: 'button-radius', token: 'radius/pill' },
    { role: 'button-bg', token: 'surface-raised' },
  ])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json.button.radius, { $value: '{radius.pill}', $type: 'dimension' })
  assert.deepEqual(r.json.button.bg, { $value: '{surface-raised}', $type: 'color' })
  // The other half of this — "a leaf with no authored $type does not grow
  // one" — has nothing left to stand on: the typeless leaves were the loose
  // weight/tracking/family members, and the chrome-ramp rebind folded every
  // one of them into a typed `text` composite. The guard stays in tokenEdit;
  // restore the assertion the day a typeless component leaf exists again.
})

/* The round trip nobody should have to take on trust. applyComponentEdits
   was written before a composite existed and never mentions one: varIndex
   flattens any $value-bearing node, so stamp.text is just another leaf, and
   setLeaf spreads the leaf it found. Whether that is ACTUALLY true of a
   typography composite — whose $value is a ref like every other but whose
   $type must survive as `typography`, and whose authored key order puts $type
   FIRST — is a question for a test, not for a paragraph claiming it. */
test('rebinds a text element to a whole type role, $type intact', () => {
  const stamp = component('stamp')
  assert.deepEqual(stamp.stamp.text, { $type: 'typography', $value: '{typography.badge}' })

  const r = applyComponentEdits(stamp, [{ role: 'stamp-text', token: 'typography/label' }])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json.stamp.text, { $type: 'typography', $value: '{typography.label}' })
  // the authored order survives — $type first, the rewritten $value last —
  // which is what keeps this to one changed line
  assert.deepEqual(Object.keys(r.json.stamp.text), ['$type', '$value'])
  // siblings untouched, caller's tree untouched, nothing materialized
  assert.deepEqual(r.json.stamp.pink, stamp.stamp.pink)
  assert.equal(stamp.stamp.text.$value, '{typography.badge}')
  assert.equal(r.applied[0].materialized, false)

  const before = src(componentFilePath('stamp')).split('\n')
  const after = serializeComponentTokens(r.json).split('\n')
  const changed = before.filter((line, i) => line !== after[i])
  assert.equal(changed.length, 1, `expected one changed line, got ${changed.length}`)
})

test('a text style rebind travels with the rest of its component', () => {
  // one component, one file — the Text style row is not a special case for
  // the writer, and a set that mixes it with a colour row still lands as one
  const r = applyComponentEdits(component('window'), [
    { role: 'window-title-text', token: 'typography/control' },
    { role: 'window-fill', token: 'surface-raised' },
  ])
  assert.equal(r.ok, true)
  assert.deepEqual(r.json.window.title.text, {
    $type: 'typography',
    $value: '{typography.control}',
  })
  assert.equal(r.json.window.fill.$value, '{surface-raised}')
  assert.deepEqual(
    r.applied.map((e) => e.role),
    ['window-title-text', 'window-fill'],
  )
})

test('a rebind is a one-line diff', () => {
  const r = applyComponentEdits(component('window'), [
    { role: 'window-fill', token: 'surface' },
  ])
  assert.equal(r.ok, true)
  const before = src(componentFilePath('window')).split('\n')
  const after = serializeComponentTokens(r.json).split('\n')
  const changed = before.filter((line, i) => line !== after[i])
  assert.equal(changed.length, 1, `expected one changed line, got ${changed.length}`)
})

/* The directory, not the list — a sixth component file must round-trip too,
   and nobody will remember to add it here. The theme sets escape their em
   dashes because Tokens Studio wrote them; these were written by hand and do
   not, which is the whole reason there are two serializers. */
test('serialize is byte-stable against every component file on disk', () => {
  const ids = readdirSync(resolve(here, '..', 'tokens/component'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
  assert.deepEqual(ids.sort(), COMPONENTS)
  for (const id of ids) {
    assert.equal(serializeComponentTokens(component(id)), src(componentFilePath(id)), id)
    // and the escaping serializer would NOT be byte-stable — the split is real
    if (/[^\x00-\x7e]/.test(src(componentFilePath(id)))) {
      assert.notEqual(serializeTokens(component(id)), src(componentFilePath(id)), id)
    }
  }
})

test('refuses a set that spans two components', () => {
  const r = applyComponentEdits(component('button'), [
    { role: 'button-radius', token: 'radius/pill' },
    { role: 'stamp-border-width', token: 'border-width/subtle' },
  ])
  assert.equal(r.ok, false)
  assert.match(r.error, /span two components \(button, stamp\)/)
})

test('never mints a component leaf — a role absent from the tree is refused', () => {
  // menubar's roles are real, but not in button.json; a picker cannot promote
  const r = applyComponentEdits(component('button'), [
    { role: 'menubar-gap', token: 'spacing/component/xl' },
  ])
  assert.equal(r.ok, false)
  assert.match(r.error, /is not in menubar's token set/)
})

test('refuses a semantic or unknown role on the component path', () => {
  const semantic = applyComponentEdits(component('button'), [{ role: 'accent', token: COBALT }])
  assert.equal(semantic.ok, false)
  assert.match(semantic.error, /not in the palette|not a component property/)

  const unknown = applyComponentEdits(component('button'), [
    { role: 'button-nonsense', token: 'space/2' },
  ])
  assert.equal(unknown.ok, false)
  assert.match(unknown.error, /unknown role/)
})

test('the component path honours the same cap and the same duplicate rule', () => {
  const many = Array.from({ length: MAX_EDITS + 1 }, () => ({
    role: 'button-radius',
    token: 'radius/pill',
  }))
  const over = applyComponentEdits(component('button'), many)
  assert.equal(over.ok, false)
  assert.match(over.error, /too many edits/)

  const dupe = applyComponentEdits(component('button'), [
    { role: 'button-radius', token: 'radius/pill' },
    { role: 'button-radius', token: 'radius/circle' },
  ])
  assert.equal(dupe.ok, false)
  assert.match(dupe.error, /duplicate role/)

  assert.equal(applyComponentEdits(component('button'), []).ok, false)
})

test('componentFilePath is the id, and the id is the file name', () => {
  assert.equal(componentFilePath('desktop-icons'), 'tokens/component/desktop-icons.json')
  for (const id of COMPONENTS) assert.ok(component(id))
})
