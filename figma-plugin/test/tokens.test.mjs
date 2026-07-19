/* First tests in the repo. They exist because the PUSH cascade is the one
 * piece of the bridge whose failure mode is SILENT: a dropped edit looks
 * exactly like "the designer didn't change anything". tokens.ts is written
 * figma-global-free precisely so this logic can be exercised in isolation.
 *
 * Run: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'

// tokens.ts is TS with no runtime deps — transpile it in-memory and import.
const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(resolve(here, '../src/tokens.ts'), 'utf8')
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const mod = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
)
const {
  buildModel,
  writeTargetSet,
  owningSet,
  createLeafAtPath,
  semanticToken,
  enabledSemanticSets,
  flattenSet,
  leafAtPath,
} = mod

/* A miniature of the real repo: core primitives, a shared scale set, and three
 * themes where dark/medieval are PARTIAL overrides (exactly our cascade). */
const metadata = {
  tokenSetOrder: [
    'core/color',
    'semantic/scale',
    'semantic/classic-light',
    'semantic/classic-dark',
    'semantic/medieval',
  ],
}
const themes = [
  {
    id: 'classic-light',
    name: 'Light',
    selectedTokenSets: {
      'core/color': 'source',
      'semantic/scale': 'enabled',
      'semantic/classic-light': 'enabled',
    },
  },
  {
    id: 'classic-dark',
    name: 'Dark',
    selectedTokenSets: { 'core/color': 'source', 'semantic/classic-dark': 'enabled' },
  },
  {
    id: 'medieval',
    name: 'Medieval',
    selectedTokenSets: { 'core/color': 'source', 'semantic/medieval': 'enabled' },
  },
]
const files = () => ({
  'core/color': {
    color: {
      ink: { base: { $value: '#17150d', $type: 'color' } },
      nasa: { cobalt: { $value: '#2036c8', $type: 'color' } },
      doppler: { pink: { $value: '#f2a6c2', $type: 'color' } },
    },
  },
  'semantic/scale': { radius: { control: { $value: '8px', $type: 'dimension' } } },
  'semantic/classic-light': {
    content: { $value: '{color.ink.base}', $type: 'color' },
    accent: { $value: '{color.nasa.cobalt}', $type: 'color' },
    focus: { $value: '{accent}', $type: 'color' },
  },
  'semantic/classic-dark': { accent: { $value: '{color.doppler.pink}', $type: 'color' } },
  'semantic/medieval': { accent: { $value: '{color.doppler.pink}', $type: 'color' } },
})
const model = () => buildModel(metadata, themes, files())
const themeById = (id) => themes.find((t) => t.id === id)

test('flattenSet + leafAtPath read nested token trees', () => {
  const flat = flattenSet('semantic/classic-light', files()['semantic/classic-light'])
  assert.equal(flat.length, 3)
  const focus = flat.find((t) => t.path === 'focus')
  assert.equal(focus.isAlias, true)
  assert.equal(focus.aliasRef, 'accent')
  assert.ok(leafAtPath(files()['core/color'], 'color.ink.base'))
  assert.equal(leafAtPath(files()['core/color'], 'color.ink'), undefined) // group, not leaf
})

test('enabledSemanticSets returns every enabled semantic set, in order', () => {
  assert.deepEqual(enabledSemanticSets(themeById('classic-light')), [
    'semantic/scale',
    'semantic/classic-light',
  ])
})

test('writeTargetSet picks each theme private layer (most specific)', () => {
  const m = model()
  // classic-light enables BOTH scale and its own set; the theme-named one wins
  assert.equal(writeTargetSet(m, themeById('classic-light')), 'semantic/classic-light')
  assert.equal(writeTargetSet(m, themeById('classic-dark')), 'semantic/classic-dark')
  assert.equal(writeTargetSet(m, themeById('medieval')), 'semantic/medieval')
})

test('owningSet distinguishes defined-here from inherited', () => {
  const m = model()
  // dark defines accent itself…
  assert.equal(owningSet(m, themeById('classic-dark'), 'accent'), 'semantic/classic-dark')
  // …but only INHERITS focus and content (the silent-drop bug class)
  assert.equal(owningSet(m, themeById('classic-dark'), 'focus'), undefined)
  assert.equal(owningSet(m, themeById('classic-dark'), 'content'), undefined)
  // medieval inherits the scale token entirely
  assert.equal(owningSet(m, themeById('medieval'), 'radius.control'), undefined)
})

test('semanticToken falls back to the base DEFINITION, not a resolved value', () => {
  const m = model()
  // dark inherits focus as the alias `{accent}` — so it re-resolves against
  // DARK's accent (pink), which is what CSS inheritance does. If this ever
  // returned a flattened hex, dark would silently freeze at light's colour.
  const focus = semanticToken(m, themeById('classic-dark'), 'focus')
  assert.equal(focus.rawValue, '{accent}')
  assert.equal(focus.isAlias, true)
})

test('TRAP: untouched inherited token must compare EQUAL (no spurious override)', () => {
  const m = model()
  const baseline = semanticToken(m, themeById('classic-dark'), 'focus')
  const figmaSerialized = '{accent}' // designer touched nothing
  assert.equal(figmaSerialized, baseline.rawValue) // → push skips it
})

test('createLeafAtPath materializes an inherited token into a mode file', () => {
  const f = files()
  const dark = f['semantic/classic-dark']
  const baseline = semanticToken(model(), themeById('classic-dark'), 'focus')
  // designer rebinds Dark's focus to pink — previously DROPPED on push
  const ok = createLeafAtPath(dark, 'focus', '{color.doppler.pink}', { type: baseline.type })
  assert.equal(ok, true)
  assert.deepEqual(dark.focus, { $value: '{color.doppler.pink}', $type: 'color' })
})

test('createLeafAtPath materializes a nested (dotted) scale token', () => {
  const f = files()
  const med = f['semantic/medieval']
  assert.equal(createLeafAtPath(med, 'radius.control', '2px', { type: 'dimension' }), true)
  assert.deepEqual(med.radius, { control: { $value: '2px', $type: 'dimension' } })
})

test('createLeafAtPath never clobbers an existing leaf', () => {
  const f = files()
  const dark = f['semantic/classic-dark']
  assert.equal(createLeafAtPath(dark, 'accent', '#fff'), false)
  assert.equal(dark.accent.$value, '{color.doppler.pink}') // untouched
})

test('createLeafAtPath refuses a leaf-vs-group collision (the A8 failure mode)', () => {
  const obj = { border: { $value: '#000', $type: 'color' } }
  // "border" is a LEAF; writing border.width must be refused, not nested
  assert.equal(createLeafAtPath(obj, 'border.width', '1px'), false)
  assert.deepEqual(obj.border, { $value: '#000', $type: 'color' })
})
