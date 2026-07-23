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
  flattenTypography,
  clampMaxPx,
  isFluidSize,
  leadingToPercent,
  percentToLeading,
  emToPercent,
  percentToEm,
  weightToFloat,
  floatToWeight,
  isTypeRole,
  memberConcrete,
  setDefiningPath,
  lookupToken,
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

// ---------------------------------------------------------------------------
// Typography — Figma-native unit conversions (the crux) + composite plumbing
// ---------------------------------------------------------------------------

test('clampMaxPx extracts the desktop (max) px; plain px passes through', () => {
  assert.equal(clampMaxPx('clamp(34px, 6vw, 62px)'), 62)
  assert.equal(clampMaxPx('clamp(28px,5.5vw,38px)'), 38)
  assert.equal(clampMaxPx('15px'), 15)
})

test('isFluidSize flags clamp() sizes (which are pull-only)', () => {
  assert.equal(isFluidSize('clamp(34px, 6vw, 62px)'), true)
  assert.equal(isFluidSize('15px'), false)
})

test('leading <-> lineHeight% round-trips (unitless multiplier x100)', () => {
  assert.equal(leadingToPercent('1.6'), 160)
  assert.equal(leadingToPercent('1'), 100)
  assert.equal(leadingToPercent('1.62'), 162)
  assert.equal(percentToLeading(160), '1.6')
  assert.equal(percentToLeading(100), '1')
  assert.equal(percentToLeading(162), '1.62')
  // identity across the round-trip (the property that matters for PUSH)
  for (const v of ['1', '1.15', '1.3', '1.5', '1.6', '1.62', '1.7', '1.9']) {
    assert.equal(percentToLeading(leadingToPercent(v)), v)
  }
})

test('tracking em <-> letterSpacing% round-trips; 0 stays 0', () => {
  assert.equal(emToPercent('0.14em'), 14)
  assert.equal(emToPercent('0.2em'), 20)
  assert.equal(emToPercent('0'), 0)
  assert.equal(emToPercent(''), 0)
  assert.equal(percentToEm(14), '0.14em')
  assert.equal(percentToEm(0), '0')
  for (const v of ['0.08em', '0.14em', '0.16em', '0.2em']) {
    assert.equal(percentToEm(emToPercent(v)), v)
  }
})

test('weight <-> fontWeight round-trips as a plain number', () => {
  assert.equal(weightToFloat('400'), 400)
  assert.equal(weightToFloat('700'), 700)
  assert.equal(floatToWeight(400), '400')
  assert.equal(floatToWeight(700), '700')
})

test('isTypeRole matches only type.* sub-token paths', () => {
  assert.equal(isTypeRole('type.display.leading'), true)
  assert.equal(isTypeRole('type'), true)
  assert.equal(isTypeRole('leading.none'), false)
  assert.equal(isTypeRole('accent'), false)
})

/* A miniature typography model: core scales + a scale set carrying two type
 * roles (one fluid, one aliased-to-core) + the composites that reference them. */
const typoMeta = {
  tokenSetOrder: [
    'core/font-size',
    'core/leading',
    'core/weight',
    'core/tracking',
    'core/font-figma',
    'semantic/scale',
    'semantic/typography',
    'semantic/classic-light',
  ],
}
const typoThemes = [
  { id: 'classic-light', name: 'Light', selectedTokenSets: { 'semantic/scale': 'enabled' } },
]
const typoFiles = () => ({
  'core/font-size': { 'font-size': { xl: { $value: '15px', $type: 'dimension' } } },
  'core/leading': { leading: { none: { $value: '1' }, normal: { $value: '1.5' } } },
  'core/weight': { weight: { regular: { $value: '400' } } },
  'core/tracking': { tracking: { 14: { $value: '0.14em' } } },
  'core/font-figma': { 'font-figma': { display: { $value: 'Geist Pixel' }, mono: { $value: 'Geist Mono' } } },
  'semantic/scale': {
    type: {
      display: {
        size: { $value: 'clamp(34px, 6vw, 62px)', $type: 'dimension' },
        leading: { $value: '{leading.none}' },
        weight: { $value: '{weight.regular}' },
        tracking: { $value: '0' },
      },
      label: {
        size: { $value: '{font-size.xl}', $type: 'dimension' },
        leading: { $value: '{leading.normal}' },
        weight: { $value: '{weight.regular}' },
        tracking: { $value: '{tracking.14}' },
      },
    },
  },
  'semantic/typography': {
    typography: {
      display: {
        $type: 'typography',
        $value: {
          fontFamily: '{font-figma.display}',
          fontSize: '{type.display.size}',
          fontWeight: '{type.display.weight}',
          lineHeight: '{type.display.leading}',
          letterSpacing: '{type.display.tracking}',
          fontStyle: 'Regular',
        },
      },
      label: {
        $type: 'typography',
        $value: {
          fontFamily: '{font-figma.mono}',
          fontSize: '{type.label.size}',
          fontWeight: '{type.label.weight}',
          lineHeight: '{type.label.leading}',
          letterSpacing: '{type.label.tracking}',
          fontStyle: 'Regular',
        },
      },
    },
  },
  'semantic/classic-light': {},
})
const typoModel = () => buildModel(typoMeta, typoThemes, typoFiles())

test('flattenTypography parses composites; buildModel routes them off semanticNames', () => {
  const m = typoModel()
  assert.equal(m.typographyComposites.length, 2)
  const display = m.typographyComposites.find((c) => c.role === 'display')
  assert.equal(display.members.fontSize.aliasRef, 'type.display.size')
  assert.equal(display.members.fontStyle.isAlias, false)
  assert.equal(display.members.fontStyle.rawValue, 'Regular')
  // type.* sub-tokens are NOT plain semantic variables (the `type` collection owns them)
  assert.ok(!m.semanticNames.some((n) => n.startsWith('type.')))
  // …but they remain resolvable for the composite refs
  assert.ok(lookupToken(m, 'type.display.leading'))
})

test('memberConcrete chases refs through scale to core (the pull value source)', () => {
  const m = typoModel()
  const label = m.typographyComposites.find((c) => c.role === 'label')
  assert.equal(memberConcrete(label.members.fontSize, m), '15px') // {type.label.size}->{font-size.xl}
  assert.equal(memberConcrete(label.members.lineHeight, m), '1.5') // ->{leading.normal}
  assert.equal(memberConcrete(label.members.letterSpacing, m), '0.14em') // ->{tracking.14}
  assert.equal(memberConcrete(label.members.fontFamily, m), 'Geist Mono')
  // and the full Figma-native conversions line up
  assert.equal(clampMaxPx(memberConcrete(label.members.fontSize, m)), 15)
  assert.equal(leadingToPercent(memberConcrete(label.members.lineHeight, m)), 150)
  assert.equal(emToPercent(memberConcrete(label.members.letterSpacing, m)), 14)
})

test('setDefiningPath locates the scale set that owns a type sub-token (PUSH target)', () => {
  const m = typoModel()
  assert.equal(setDefiningPath(m, 'type.label.leading'), 'semantic/scale')
  assert.equal(setDefiningPath(m, 'nope.nope'), undefined)
})
