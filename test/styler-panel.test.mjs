/* THE PANEL'S PURE HALF.
 *
 * STYLER's panel is the first thing on this desktop that writes a token
 * REFERENCE rather than a value, and three of its mistakes would be silent:
 *
 * · A composite that expands into four members instead of five. The row
 *   changes, the desktop moves, and one property keeps the treatment it came
 *   with — a size from Label sitting under Badge's tracking, which is exactly
 *   the assembled-treatment failure the type-role row was minted to stop.
 * · A role that lands in no block. It vanishes off the panel and the panel
 *   claims the component does not have it. That class of bug has bitten this
 *   codebase before, so the test is a PARTITION test, not a spot check.
 * · A candidate whose var() does not exist. The preview writes
 *   `var(--radius-pil)`, the browser drops the declaration, the row says it
 *   changed and nothing moves.
 *
 * The registry gets tested here too, and only where it is pure: matching,
 * dispatch order, scoping and unregister. The window listener is not
 * exercised — this harness is plain node with no DOM (the whole suite is;
 * see token-edit.test.mjs) and the modules are written to no-op without one.
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
const root = resolve(here, '..')
const src = (p) => readFileSync(resolve(root, p), 'utf8')

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

const tiersUrl = moduleUrl('src/lib/tokens.generated.ts')
const { TOKEN_TIERS, TOKEN_REFS, TOKEN_COMPOSITES, TYPE_ROLES } = await import(tiersUrl)
const candidatesUrl = moduleUrl('src/lib/styleCandidates.ts', { './tokens.generated': tiersUrl })
const { COMPONENT_IDS, componentIdOf, familyOf, candidatesFor, CANDIDATES_BY_FAMILY } =
  await import(candidatesUrl)
const blocksUrl = moduleUrl('src/lib/stylerBlocks.ts', {
  './tokens.generated': tiersUrl,
  './styleCandidates': candidatesUrl,
})
const {
  STYLER_BLOCKS,
  COMPOSITE_MEMBERS,
  blockOf,
  blocksFor,
  fillStrokePair,
  isCompositeMember,
  layerLabel,
  layersFor,
  rowLabel,
  rowsFor,
} = await import(blocksUrl)
const { addRoot, count, pendingEdits, rebind, removeRoot, resetAll, resetRole, writesFor } =
  await import(
    moduleUrl('src/lib/stylerTune.ts', {
      './styleCandidates': candidatesUrl,
      './stylerBlocks': blocksUrl,
    })
  )
const { handleKey, isReserved, matches, registerHotkeys, activeScopes } = await import(
  moduleUrl('src/lib/hotkeys.ts')
)
/* the three sets the stage's second axis offers are the three the commit
   route writes to, and tokenEdit is where that list lives */
const { TOKEN_THEMES } = await import(
  moduleUrl('src/lib/tokenEdit.ts', {
    './palette': moduleUrl('src/lib/palette.ts'),
    './tokens.generated': tiersUrl,
    './styleCandidates': candidatesUrl,
  })
)

/** Every custom property the generated CSS actually emits — the only list
    allowed to say whether a var() the panel writes resolves to anything. */
const EMITTED = new Set(
  Array.from(src('src/styles/tokens.generated.css').matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim), (m) =>
    m[1],
  ),
)

const COMPONENT_ROLES = Object.keys(TOKEN_TIERS)
  .filter((name) => TOKEN_TIERS[name] === 'component')
  .map((name) => name.slice(2))

/* ------------------------------------------------ composite expansion */

test('one type-role edit writes all five members, and nothing else', () => {
  const badge = candidatesFor('stamp-text').find((c) => c.token === 'typography/badge')
  assert.ok(badge, 'the badge style is on offer for a text row')
  const writes = writesFor('stamp-text', badge)
  assert.deepEqual(writes, [
    ['--stamp-text-font-family', 'var(--type-badge-family)'],
    ['--stamp-text-font-size', 'var(--type-badge-size)'],
    ['--stamp-text-font-weight', 'var(--type-badge-weight)'],
    ['--stamp-text-line-height', 'var(--type-badge-leading)'],
    ['--stamp-text-letter-spacing', 'var(--type-badge-tracking)'],
  ])
})

test('every member a composite expands into is a property the build emits', () => {
  for (const parent of Object.keys(TOKEN_COMPOSITES)) {
    for (const [member] of COMPOSITE_MEMBERS) {
      const prop = `${parent}-${member}`
      assert.equal(
        TOKEN_TIERS[prop],
        'component',
        `${prop} is a component property the build emits`,
      )
    }
  }
})

test('every type role a text row may take resolves to five real properties', () => {
  for (const role of TYPE_ROLES) {
    const candidate = CANDIDATES_BY_FAMILY['type-role'].find(
      (c) => c.token === `typography/${role}`,
    )
    assert.ok(candidate, `${role} is on offer`)
    for (const [, part] of COMPOSITE_MEMBERS) {
      assert.ok(EMITTED.has(`--type-${role}-${part}`), `--type-${role}-${part} is emitted`)
    }
  }
})

test('a composite rebind writes the parent it was asked about, member by member', () => {
  for (const parent of Object.keys(TOKEN_COMPOSITES)) {
    const role = parent.slice(2)
    const candidate = candidatesFor(role).find((c) => c.token === TOKEN_COMPOSITES[parent])
    assert.ok(candidate, `${parent}'s own binding is on its offer list`)
    const writes = writesFor(role, candidate)
    assert.equal(writes.length, COMPOSITE_MEMBERS.length)
    for (const [prop] of writes) {
      assert.equal(TOKEN_TIERS[prop], 'component', `${prop} is a real property`)
    }
  }
})

/* ------------------------------------------------- candidate -> var() */

test('every candidate the panel can write names a property the build emits', () => {
  for (const [family, list] of Object.entries(CANDIDATES_BY_FAMILY)) {
    for (const candidate of list) {
      assert.ok(
        EMITTED.has(candidate.varName),
        `${family} candidate ${candidate.token} points at ${candidate.varName}`,
      )
    }
  }
})

test('a plain rebind writes exactly one property, as a reference', () => {
  const pill = candidatesFor('button-radius').find((c) => c.token === 'radius/pill')
  assert.ok(pill)
  assert.deepEqual(writesFor('button-radius', pill), [['--button-radius', 'var(--radius-pill)']])
})

/* -------------------------------------------------- block assignment */

test('every component role lands in exactly one block, or is a composite member', () => {
  for (const role of COMPONENT_ROLES) {
    const block = blockOf(role)
    if (block === null) {
      assert.ok(
        isCompositeMember(`--${role}`),
        `${role} is off the panel only because it is one fifth of a composite`,
      )
      continue
    }
    assert.ok(STYLER_BLOCKS.includes(block), `${role} lands in a real block (${block})`)
  }
})

test('the rows of a component are its whole set, once each', () => {
  const listed = new Set()
  for (const id of COMPONENT_IDS) {
    for (const row of rowsFor(id)) {
      assert.equal(componentIdOf(row.role), id, `${row.role} is ${id}'s`)
      assert.ok(!listed.has(row.role), `${row.role} is listed once`)
      listed.add(row.role)
    }
  }
  const expected = [...COMPONENT_ROLES, ...Object.keys(TOKEN_COMPOSITES).map((p) => p.slice(2))]
    .filter((role) => !isCompositeMember(`--${role}`))
    .sort()
  assert.deepEqual([...listed].sort(), expected)
})

test('a composite parent draws as a Typography row, its members draw nowhere', () => {
  for (const parent of Object.keys(TOKEN_COMPOSITES)) {
    assert.equal(blockOf(parent.slice(2)), 'typography', `${parent} is a Typography row`)
    for (const [member] of COMPOSITE_MEMBERS) {
      assert.equal(blockOf(`${parent.slice(2)}-${member}`), null, `${parent}-${member} is not a row`)
    }
  }
})

test('the three structural dimensions are listed, in Spacing, and inert', () => {
  const structural = ['menubar-h', 'desktop-icons-cell-width', 'window-ctrl-size']
  for (const role of structural) {
    assert.equal(familyOf(role), 'locked', `${role} has no ramp`)
    assert.equal(blockOf(role), 'spacing')
    const row = rowsFor(componentIdOf(role)).find((r) => r.role === role)
    assert.ok(row, `${role} is on the panel`)
    assert.equal(row.locked, true)
    assert.equal(candidatesFor(role).length, 0, `${role} offers nothing`)
  }
})

test('colour rows split by what they paint', () => {
  assert.equal(blockOf('button-bg'), 'fill')
  assert.equal(blockOf('stamp-fg'), 'fill')
  assert.equal(blockOf('window-fill'), 'fill')
  assert.equal(blockOf('button-stroke'), 'stroke')
  assert.equal(blockOf('menubar-border-color'), 'stroke')
  // a width is the line's, whatever it is called
  assert.equal(blockOf('window-border-width'), 'stroke')
})

test('blocks draw in a fixed order and an empty one never draws', () => {
  for (const id of COMPONENT_IDS) {
    const groups = blocksFor(id)
    const order = groups.map((g) => g.block)
    assert.deepEqual(
      order,
      STYLER_BLOCKS.filter((b) => order.includes(b)),
      `${id}'s blocks are in panel order`,
    )
    for (const group of groups) assert.ok(group.rows.length > 0, `${id} draws no empty block`)
  }
  // the stamp has no corner and no gap of its own
  assert.deepEqual(
    blocksFor('stamp').map((g) => g.block),
    ['fill', 'stroke', 'typography', 'spacing'],
  )
})

test('a row is named without the prefix the block already said', () => {
  assert.equal(rowLabel('button-radius', 'button'), 'RADIUS')
  assert.equal(rowLabel('window-titlebar-active-bg', 'window'), 'TITLEBAR ACTIVE BG')
  assert.equal(rowLabel('desktop-icons-cell-width', 'desktop-icons'), 'CELL WIDTH')
})

/* ------------------------------------------------------- the anatomy */

/* THE DRILL. Jake, s105: evaluate at the layer, not at twenty rows at once.
   The layers are DERIVED from the token names, so the failure to guard is a
   quiet one: a rule that stops matching drops rows onto the root, the list
   still draws, and the only symptom is a component that suddenly has no
   parts. So this is a partition test like the block one above it. */

test('every row lands in exactly one layer, and the layers are the whole set', () => {
  for (const id of COMPONENT_IDS) {
    const layers = layersFor(id)
    const seen = []
    for (const layer of layers) {
      assert.ok(layer.rows.length > 0, `${id}/${layer.id} draws no empty layer`)
      for (const row of layer.rows) {
        assert.equal(row.layer, layer.id, `${row.role} is filed under ${layer.id}`)
        seen.push(row.role)
      }
    }
    assert.deepEqual(
      seen.sort(),
      rowsFor(id)
        .map((r) => r.role)
        .sort(),
      `${id}'s layers hold its whole set, once each`,
    )
  }
})

test('the root layer comes first and wears the component name', () => {
  for (const id of COMPONENT_IDS) {
    const layers = layersFor(id)
    assert.equal(layers[0].id, id, `${id}'s own rows head the list`)
    assert.equal(layers[0].label, id.split('-').join(' ').toUpperCase())
  }
  assert.equal(layerLabel('titlebar', 'window'), 'TITLEBAR')
  assert.equal(layerLabel('desktop-icons', 'desktop-icons'), 'DESKTOP ICONS')
})

test('the parts come from the token names, not from a hand-kept list', () => {
  const named = (id) => layersFor(id).map((l) => l.id)
  assert.deepEqual(named('window'), ['window', 'ctrl', 'title', 'titlebar', 'explainer'])
  assert.deepEqual(named('menubar'), ['menubar', 'menu', 'wordmark'])
  assert.deepEqual(named('stamp'), ['stamp', 'pink'])
  assert.deepEqual(named('desktop-icons'), ['desktop-icons', 'hover', 'icon', 'label'])

  const layerOf = (id, role) => rowsFor(id).find((r) => r.role === role)?.layer
  // the property tail comes off and the first segment of what is left is the
  // layer, whatever else the name carries between them
  assert.equal(layerOf('window', 'window-titlebar-active-bg'), 'titlebar')
  assert.equal(layerOf('window', 'window-titlebar-padding-x'), 'titlebar')
  assert.equal(layerOf('window', 'window-title-meta-text'), 'title')
  assert.equal(layerOf('menubar', 'menubar-wordmark-version-margin-left'), 'wordmark')
  // and a row with no part path at all is the component's own
  assert.equal(layerOf('window', 'window-fill'), 'window')
  assert.equal(layerOf('menubar', 'menubar-gap'), 'menubar')
})

test('a locked row joins the part it names, or the root when it names none', () => {
  const layerOf = (id, role) => rowsFor(id).find((r) => r.role === role)?.layer
  // 'ctrl' is a part the window's other rows already named
  assert.equal(layerOf('window', 'window-ctrl-size'), 'ctrl')
  // 'h' and 'cell' name no part, so they stay with the component itself
  assert.equal(layerOf('menubar', 'menubar-h'), 'menubar')
  assert.equal(layerOf('desktop-icons', 'desktop-icons-cell-width'), 'desktop-icons')
})

test('the dock scoped to a layer draws that layer and nothing else', () => {
  for (const id of COMPONENT_IDS) {
    const whole = blocksFor(id).flatMap((g) => g.rows.map((r) => r.role))
    const drilled = []
    for (const layer of layersFor(id)) {
      const groups = blocksFor(id, layer.id)
      for (const group of groups) {
        assert.ok(group.rows.length > 0, `${id}/${layer.id} draws no empty block`)
        for (const row of group.rows) {
          assert.equal(row.layer, layer.id, `${row.role} belongs on this layer`)
          drilled.push(row.role)
        }
      }
      // block order survives the scoping
      const order = groups.map((g) => g.block)
      assert.deepEqual(order, STYLER_BLOCKS.filter((b) => order.includes(b)))
    }
    assert.deepEqual(drilled.sort(), whole.slice().sort(), `${id} loses no row to the drill`)
  }
  // the drill is what it was minted for: window's twenty rows, nine at worst
  const biggest = Math.max(...layersFor('window').map((l) => l.rows.length))
  assert.ok(biggest < rowsFor('window').length / 2, 'no layer is half the component')
})

/* ------------------------------------------------------ the two axes */

/* The tabs re-arrange data that already existed — the specs' variants and the
   commit route's three token sets — so what can go wrong is a MISMATCH: a tab
   whose label names no copy key renders the key, and a set the commit route
   has never heard of offers a SAVE with nowhere to go. StylerStage.tsx is JSX
   over five real components and cannot be imported in a harness with no DOM,
   so both read off the source, the way the spec-coverage test above does. */

const stageSrc = src('src/components/inspect/StylerStage.tsx')
const specSrc = src('src/components/inspect/stageSpecs.tsx')
const COPY = JSON.parse(src('src/content/copy.json'))

test('the token-set axis offers exactly the three sets SAVE can commit to', () => {
  const sets = [...stageSrc.matchAll(/\{ id: '([a-z-]+)', skin:/g)].map((m) => m[1])
  assert.deepEqual(sets, [...TOKEN_THEMES])
})

test('every tab on either axis names a copy key that exists', () => {
  const keys = [
    ...[...specSrc.matchAll(/label: '([\w.]+)'/g)].map((m) => m[1]),
    ...[...stageSrc.matchAll(/label: '([\w.]+)'/g)].map((m) => m[1]),
    'styler.axis.variant',
    'styler.axis.set',
    'styler.layers',
  ]
  assert.ok(keys.length >= 12, 'the labels were found at all')
  for (const key of keys) assert.ok(key in COPY, `${key} is in copy.json`)
})

test('the bench still registers itself, or the skin previews go half-dead', () => {
  // the finding two tests below this one, held to: a non-active token set on
  // the bench is a nested data-skin wrapper, and a nested wrapper only takes
  // a rebind because stylerTune was told about it
  assert.ok(stageSrc.includes('addRoot(el)'), 'the bench is registered')
  assert.ok(stageSrc.includes('removeRoot(el)'), 'and unregistered on the way out')
  assert.ok(/ref=\{benchRef\}/.test(stageSrc), 'the registered element is the bench')
  assert.ok(/data-skin=\{set\.skin\}/.test(stageSrc), 'and the bench is the skin wrapper')
})

/* ------------------------------------------------------ the X pairing */

test('a fill pairs with the stroke on its own part', () => {
  assert.deepEqual(
    fillStrokePair('window', 'window-titlebar-fill').map((r) => r.role),
    ['window-titlebar-fill', 'window-titlebar-border-color'],
  )
  assert.deepEqual(
    fillStrokePair('stamp', 'stamp-pink-border-color').map((r) => r.role),
    ['stamp-pink-fg', 'stamp-pink-border-color'],
  )
  // asked about a row that is in no pair, it falls back to the component's
  // first one rather than guessing a partner for the row
  assert.deepEqual(
    fillStrokePair('button', 'button-radius').map((r) => r.role),
    ['button-bg', 'button-stroke'],
  )
})

test('a component with no fill/stroke pair swaps nothing', () => {
  assert.equal(fillStrokePair('desktop-icons', 'desktop-icons-gap-row')?.[0].role, 'desktop-icons-hover-bg')
  // both halves of every pair are colour rows, or the swap would hand a
  // radius to a border
  for (const id of COMPONENT_IDS) {
    const pair = fillStrokePair(id)
    if (!pair) continue
    for (const row of pair) assert.equal(row.family, 'color', `${row.role} is a colour`)
  }
})

/* ------------------------------------------- the stage's extra roots */

/* THE FINDING THIS GUARDS. tokens.generated.css declares every component
   property inside `:root, [data-skin='classic']`, so a nested classic wrapper
   — which is how the stage draws a second skin beside the first —
   re-declares all of them and an inline write on <html> never reaches inside
   it. The stage registers its wrappers and every rebind mirrors onto them.
   Lose that and the preview goes quietly half-dead: the big spread moves and
   the skin tiles do not. */

test('the component tier is declared in the classic block, which is why roots exist', () => {
  const css = src('src/styles/tokens.generated.css')
  const classicBlock = css.indexOf("[data-skin='classic'] {")
  const darkBlock = css.indexOf("[data-theme='dark'],")
  assert.ok(classicBlock >= 0 && darkBlock > classicBlock)
  for (const prop of ['--button-radius', '--stamp-fg', '--window-fill']) {
    const hits = [...css.matchAll(new RegExp(`^\\s*${prop}\\s*:`, 'gm'))]
    assert.equal(hits.length, 1, `${prop} is declared once`)
    assert.ok(hits[0].index < darkBlock, `${prop} is in the classic block`)
  }
})

/** An element, as much of one as stylerTune touches. */
function fakeRoot() {
  const props = new Map()
  return {
    props,
    getAttribute: () => null,
    removeAttribute: () => {},
    style: {
      setProperty: (k, v) => props.set(k, v),
      removeProperty: (k) => props.delete(k),
      getPropertyValue: (k) => props.get(k) ?? '',
    },
  }
}

const PILL = candidatesFor('button-radius').find((c) => c.token === 'radius/pill')

test('a registered root takes every write the document root takes', () => {
  const tile = fakeRoot()
  addRoot(tile)
  rebind('button-radius', PILL)
  assert.equal(tile.props.get('--button-radius'), 'var(--radius-pill)')

  resetRole('button-radius')
  assert.equal(tile.props.has('--button-radius'), false)
  removeRoot(tile)
})

test('a root registered late catches up on what is already pending', () => {
  rebind('button-radius', PILL)
  const tile = fakeRoot()
  addRoot(tile)
  assert.equal(tile.props.get('--button-radius'), 'var(--radius-pill)')

  // and a composite carries all five members onto it
  const badge = candidatesFor('stamp-text').find((c) => c.token === 'typography/badge')
  rebind('stamp-text', badge)
  assert.equal(tile.props.get('--stamp-text-font-size'), 'var(--type-badge-size)')
  assert.equal(tile.props.size, 6)

  resetAll()
  assert.equal(tile.props.size, 0)
  assert.equal(count(), 0)
  removeRoot(tile)
})

test('an unregistered root stops taking writes', () => {
  const tile = fakeRoot()
  addRoot(tile)
  removeRoot(tile)
  rebind('button-radius', PILL)
  assert.equal(tile.props.size, 0)
  assert.deepEqual(pendingEdits(), [{ role: 'button-radius', token: 'radius/pill' }])
  resetAll()
})

/* ------------------------------------------------ the stage's specs */

test('every pilot component has a spec to put on the bench', () => {
  /* stageSpecs.tsx is JSX over five real components, so it cannot be
     imported in a harness with no DOM. The thing worth guarding is the
     COVERAGE — a component the panel offers OPEN COMPONENT for and the stage
     cannot draw is a dead end — and that reads straight off the source. */
  const source = src('src/components/inspect/stageSpecs.tsx')
  const body = source.slice(source.indexOf('export const STAGE_SPECS'))
  for (const id of COMPONENT_IDS) {
    const key = /^[a-z]+$/.test(id) ? `\n  ${id}: {` : `\n  '${id}': {`
    assert.ok(body.includes(key), `${id} has a stage spec`)
  }
})

/* --------------------------------------------------- the key registry */

/** A KeyboardEvent, as much of one as the registry reads. */
const key = (k, mods = {}) => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
  prevented: false,
  preventDefault() {
    this.prevented = true
  },
  stopPropagation() {},
})

test('a chord matches its modifiers exactly', () => {
  assert.ok(matches({ key: 'ArrowUp' }, key('ArrowUp')))
  // the undeclared modifier has to be absent, or Shift+Up steps twice
  assert.ok(!matches({ key: 'ArrowUp' }, key('ArrowUp', { shiftKey: true })))
  assert.ok(matches({ key: 'ArrowUp', shift: true }, key('ArrowUp', { shiftKey: true })))
  // meta is the platform's command key, either spelling
  assert.ok(matches({ key: 's', meta: true }, key('s', { metaKey: true })))
  assert.ok(matches({ key: 's', meta: true }, key('s', { ctrlKey: true })))
  assert.ok(!matches({ key: 's', meta: true }, key('s')))
  // Shift+x reports 'X'
  assert.ok(matches({ key: 'x', shift: true }, key('X', { shiftKey: true })))
})

test('a handled key is swallowed and an unhandled one is not', () => {
  const seen = []
  const off = registerHotkeys('t1', [{ key: 'x', run: () => seen.push('x') }])
  const hit = key('x')
  assert.equal(handleKey(hit), true)
  assert.equal(hit.prevented, true)
  assert.deepEqual(seen, ['x'])

  const miss = key('y')
  assert.equal(handleKey(miss), false)
  assert.equal(miss.prevented, false)
  off()
})

test('unregistering takes the bindings with it', () => {
  const seen = []
  const off = registerHotkeys('t2', [{ key: 'x', run: () => seen.push('x') }])
  handleKey(key('x'))
  off()
  handleKey(key('x'))
  assert.deepEqual(seen, ['x'])
  assert.deepEqual(activeScopes(), [])
})

test('the newest scope answers first, and a guard passes the key down', () => {
  const seen = []
  const offA = registerHotkeys('a', [{ key: 'x', run: () => seen.push('a') }])
  const offB = registerHotkeys('b', [
    { key: 'x', when: () => false, run: () => seen.push('b-guarded') },
    { key: 'z', run: () => seen.push('b') },
  ])
  handleKey(key('x'))
  handleKey(key('z'))
  assert.deepEqual(seen, ['a', 'b'])

  // a disabled scope is not asked at all
  const offC = registerHotkeys('c', [{ key: 'z', run: () => seen.push('c') }], {
    enabled: () => false,
  })
  handleKey(key('z'))
  assert.deepEqual(seen, ['a', 'b', 'b'])
  offA()
  offB()
  offC()
})

test('re-registering an id replaces it rather than stacking', () => {
  const seen = []
  registerHotkeys('same', [{ key: 'x', run: () => seen.push('first') }])
  const off = registerHotkeys('same', [{ key: 'x', run: () => seen.push('second') }])
  handleKey(key('x'))
  assert.deepEqual(seen, ['second'])
  assert.deepEqual(activeScopes(), ['same'])
  off()
  assert.deepEqual(activeScopes(), [])
})

test('the browser keeps its own shortcuts', () => {
  for (const k of ['w', 't', 'n', 'l', 'q', 'r']) {
    assert.ok(isReserved({ key: k, meta: true }), `meta+${k} is the browser's`)
    assert.ok(!isReserved({ key: k }), `${k} on its own is ours`)
  }
  assert.ok(!isReserved({ key: 's', meta: true }))

  const seen = []
  const off = registerHotkeys('reserved', [
    { key: 'w', meta: true, run: () => seen.push('w') },
    { key: 's', meta: true, run: () => seen.push('s') },
  ])
  assert.equal(handleKey(key('w', { metaKey: true })), false)
  assert.equal(handleKey(key('s', { metaKey: true })), true)
  assert.deepEqual(seen, ['s'])
  off()
})
