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
const {
  addRoot,
  canRedo,
  canUndo,
  clearHistory,
  count,
  pendingEdits,
  rebind,
  redo,
  removeRoot,
  resetAll,
  resetRole,
  undo,
  writesFor,
} = await import(
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

test('every pill on every modifier row names a copy key that exists', () => {
  const keys = [
    ...[...specSrc.matchAll(/label: '([\w.]+)'/g)].map((m) => m[1]),
    ...[...stageSrc.matchAll(/label: '([\w.]+)'/g)].map((m) => m[1]),
    // the axis names, which the rows carry as a `name=` prop
    ...[...stageSrc.matchAll(/name="([\w.]+)"/g)].map((m) => m[1]),
    'styler.layers',
  ]
  assert.ok(keys.length >= 16, 'the labels were found at all')
  for (const key of keys) assert.ok(key in COPY, `${key} is in copy.json`)
  // all four axes are named, and the block that holds them is too
  for (const key of [
    'styler.axis.viewport',
    'styler.axis.state',
    'styler.axis.set',
    'styler.axis.variant',
    'styler.modifiers',
  ]) {
    assert.ok(keys.includes(key) || stageSrc.includes(`k="${key}"`), `${key} is on the panel`)
  }
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

/* ---------------------------------------------- the s107 wide review */

const stageCss = src('src/components/inspect/stylerStage.module.css')
const shellCss = src('src/components/inspect/inspectShell.module.css')

test('every copy key the stage names exists', () => {
  // the tabs are checked above by their `label:` shape; this is everything
  // else the room says out loud, the aria-labels on the grips included
  const keys = [
    ...[...stageSrc.matchAll(/k="([\w.]+)"/g)].map((m) => m[1]),
    ...[...stageSrc.matchAll(/t\('([\w.]+)', skin\)/g)].map((m) => m[1]),
    ...[...stageSrc.matchAll(/label="([\w.]+)"/g)].map((m) => m[1]),
  ]
  assert.ok(keys.includes('styler.grip.layers'), 'the grips were found')
  for (const key of keys) assert.ok(key in COPY, `${key} is in copy.json`)
})

test('the revert button and the way out do not share one sentence', () => {
  // Jake, s107: "'put the component back' should be 'revert'." The close X
  // keeps the sentence; the button that drops the pending set gets its own
  assert.equal(COPY['styler.resetall'], 'REVERT')
  assert.notEqual(COPY['styler.resetall'], COPY['styler.close'])
  assert.match(COPY['styler.close'], /DESKTOP/)
})

test('the commit foot is the last thing in the dock', () => {
  /* Jake, s111: "fix the export options to the bottom of that panel." The bar
     spent one review as a band across the canvas floor (s107, when the dock
     was 304px and the row folded in it); the dock opens at 384 now and the
     row fits, so it went back to the panel it sends. */
  const dockAt = stageSrc.indexOf('className={styles.dock}')
  const dockEnd = stageSrc.indexOf('</aside>', dockAt)
  const bodyAt = stageSrc.indexOf('className={styles.dockBody}')
  const barAt = stageSrc.indexOf('className={styles.commit}')
  assert.ok(dockAt > 0 && barAt > 0, 'both were found')
  assert.ok(barAt > dockAt && barAt < dockEnd, 'the bar is inside the right dock')
  assert.ok(barAt > bodyAt, 'and below the blocks, which is where the keyboard reaches it')
  // and the key gate went with it, or SAVE asks for a key nobody can see
  assert.ok(stageSrc.indexOf('saver.keyGate()') > barAt, 'the gate draws in the bar')
  assert.ok(stageSrc.indexOf('saver.saveStatus()') > barAt, 'and so does the status')
  // a column of three: the modifiers, a body that scrolls, a foot that does
  // not. Nothing is positioned, so twenty rows can never push the button off.
  const foot = stageCss.slice(stageCss.indexOf('.commit {'))
  assert.match(foot.slice(0, foot.indexOf('}')), /flex: none/)
  assert.ok(!/\.commit \{[^}]*position:/.test(stageCss), 'the foot is not positioned')
  assert.ok(stageCss.includes('.commitRow > :first-child'), 'the count may shrink and wrap')
})

test('the walls open where the stylesheet says they do', () => {
  const stops = (name) => {
    const m = stageSrc.match(new RegExp(`const ${name} = \\{ min: (\\d+), def: (\\d+), max: (\\d+) \\}`))
    assert.ok(m, `${name} declares its stops`)
    return { min: +m[1], def: +m[2], max: +m[3] }
  }
  const left = stops('LEFT')
  const right = stops('RIGHT')
  for (const [name, w] of [
    ['LEFT', left],
    ['RIGHT', right],
  ]) {
    assert.ok(w.min < w.def && w.def < w.max, `${name} opens between its own stops`)
  }
  // the left panel is INSPECT's own width, still — one number, two panels
  const inspect = src('src/app/globals.css').match(/--inspect-left: (\d+)px/)
  assert.equal(left.def, +inspect[1], 'the left wall opens on --inspect-left')
  // and the right one opens wider than the inspector's dock, which is the
  // whole change: 304px is where the rows were folding
  const opens = stageCss.match(/--styler-right: (\d+)px/)
  assert.equal(right.def, +opens[1], 'the sheet and the grip agree on the default')
  assert.ok(right.def > right.min, 'the dock opens wider than it may be dragged')
  assert.equal(right.min, +src('src/app/globals.css').match(/--inspect-right: (\d+)px/)[1])
  // and the layout gives up before the two walls eat the bench: a wider dock
  // with the old breakpoint is the wrapping back again, one size down
  const stack = +stageCss.match(/@media \(max-width: (\d+)px\)/)[1]
  assert.ok(stack - (left.def + right.def) >= 170, 'the narrowest side-by-side still has a bench')
})

test('a grip is a separator a keyboard can move', () => {
  assert.ok(stageSrc.includes('role="separator"'), 'it is a separator')
  assert.ok(stageSrc.includes('aria-orientation="vertical"'), 'a vertical one')
  assert.ok(/tabIndex=\{0\}/.test(stageSrc), 'and it is reachable')
  for (const attr of ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-controls']) {
    assert.ok(stageSrc.includes(attr), `${attr} is reported`)
  }
  for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
    assert.ok(stageSrc.includes(`'${key}'`), `${key} moves the wall`)
  }
  assert.ok(stageSrc.includes('onDoubleClick={onReset}'), 'and a double-click puts it back')
  // pointer capture, not window listeners: a fast drag leaves the strip
  assert.ok(stageSrc.includes('setPointerCapture'), 'the strip takes the pointer')
  assert.ok(stageSrc.includes('releasePointerCapture'), 'and gives it back')
})

test('the small type in the room steps to a role the ramp already has', () => {
  // Jake, s107: "fonts seem small as well." Micro to control, both of them
  // roles in tokens.generated.css — never a literal size
  const step = shellCss.slice(shellCss.indexOf('[data-styler-stage]'))
  assert.ok(step.includes('var(--type-control-size)'), 'the dock steps up')
  assert.ok(stageSrc.includes('data-styler-stage'), 'and the stage sets the hook it reads')
  assert.ok(stageCss.includes('var(--type-control-size)'), 'the tab rows step with it')
  for (const sheet of [stageCss, shellCss]) {
    const sizes = [...sheet.matchAll(/font-size: (?!var\()([^;]+);/g)].map((m) => m[1])
    assert.deepEqual(sizes, [], 'no hand-written font size anywhere in either sheet')
  }
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

/* ------------------------------------------------------- undo and redo */

/* A history is the one piece of state in this module that can be WRONG rather
   than merely absent, and every way it goes wrong is quiet: a redo stack that
   survives a fresh move replays a branch nobody is on, a composite that comes
   back with four of its five members looks right on screen, and a stack that
   is never cleared lets a fresh room undo its way into the last one's pending
   set. So the moves are exercised rather than the shape of the code. */

/** Put the module back to nothing held and nothing remembered. */
const quiet = () => {
  resetAll()
  clearHistory()
}

const BADGE = candidatesFor('stamp-text').find((c) => c.token === 'typography/badge')

test('undo and redo walk the pending set one move at a time', () => {
  quiet()
  assert.equal(canUndo(), false)
  assert.equal(canRedo(), false)

  rebind('button-radius', PILL)
  assert.equal(count(), 1)
  assert.equal(canUndo(), true)

  assert.equal(undo(), true)
  assert.equal(count(), 0)
  assert.equal(canUndo(), false)
  assert.equal(canRedo(), true)

  assert.equal(redo(), true)
  assert.deepEqual(pendingEdits(), [{ role: 'button-radius', token: 'radius/pill' }])
  assert.equal(canRedo(), false)
  quiet()
})

test('an empty stack answers no rather than pretending it moved', () => {
  quiet()
  assert.equal(undo(), false)
  assert.equal(redo(), false)
  quiet()
})

test('undo takes a composite back all five members at a time', () => {
  quiet()
  const tile = fakeRoot()
  addRoot(tile)

  rebind('stamp-text', BADGE)
  assert.equal(tile.props.size, 5)
  undo()
  assert.equal(tile.props.size, 0, 'not four of them')
  redo()
  assert.equal(tile.props.get('--stamp-text-letter-spacing'), 'var(--type-badge-tracking)')

  removeRoot(tile)
  quiet()
})

test('REVERT is one move, and undo brings the whole set back', () => {
  quiet()
  rebind('button-radius', PILL)
  rebind('stamp-text', BADGE)
  assert.equal(count(), 2)

  resetAll()
  assert.equal(count(), 0)
  undo()
  assert.equal(count(), 2, 'one press, one set')
  quiet()
})

test('a fresh move clears the redo stack', () => {
  quiet()
  rebind('button-radius', PILL)
  undo()
  assert.equal(canRedo(), true)
  rebind('stamp-text', BADGE)
  assert.equal(canRedo(), false, 'the branch nobody is on is gone')
  quiet()
})

test('a move that changes nothing never enters the history', () => {
  quiet()
  resetRole('button-radius') // nothing held on that role
  resetAll() // nothing held at all
  assert.equal(canUndo(), false, 'or the key does nothing and looks broken')
  quiet()
})

test('the history is bounded and the oldest move falls off the end', () => {
  quiet()
  const ramp = candidatesFor('button-radius')
  assert.ok(ramp.length > 1, 'the radius row has a ramp to walk')
  for (let n = 0; n < 60; n += 1) rebind('button-radius', ramp[n % ramp.length])

  let steps = 0
  while (undo()) steps += 1
  assert.equal(steps, 50, 'fifty back, and the sixtieth is REVERT territory')
  quiet()
})

test('the stage drops the history as it opens, and keeps the pending set', () => {
  quiet()
  rebind('button-radius', PILL)
  clearHistory()
  assert.equal(canUndo(), false)
  assert.equal(count(), 1, 'clearing the history is not a revert')
  quiet()
  // the room is the thing that calls it, on the way IN — the teardown that
  // drops a pending set runs after the room is already gone
  assert.ok(stageSrc.includes('clearHistory()'), 'the stage clears it')
})

test('undo and redo sit on the command key, guarded', () => {
  const blocksSrc = src('src/components/inspect/StylerBlocks.tsx')
  assert.match(blocksSrc, /key: 'z', meta: true, when: canUndo/)
  assert.match(blocksSrc, /key: 'z', meta: true, shift: true, when: canRedo/)
  assert.ok(!isReserved({ key: 'z', meta: true }), 'the browser does not want this one')

  // and the two chords do not answer for each other
  const seen = []
  const off = registerHotkeys('undo-redo', [
    { key: 'z', meta: true, run: () => seen.push('undo') },
    { key: 'z', meta: true, shift: true, run: () => seen.push('redo') },
  ])
  handleKey(key('z', { metaKey: true }))
  handleKey(key('z', { metaKey: true, shiftKey: true }))
  assert.deepEqual(seen, ['undo', 'redo'])
  off()
})

/* ------------------------------------------------ the anatomy markers */

test('every anatomy marker on a component names a layer its tokens declare', () => {
  /* data-part is what the bench direct-selects by, and the only thing that
     makes it agree with the layer list on the left is the name. A marker
     naming a part the token files do not have is a click that selects
     nothing, silently. */
  const files = {
    window: 'src/components/shell/Window.tsx',
    menubar: 'src/components/shell/MenuBar.tsx',
    'desktop-icons': 'src/components/shell/DesktopIcons.tsx',
    stamp: 'src/components/primitives/Stamp.tsx',
  }
  for (const [id, path] of Object.entries(files)) {
    // both spellings: a literal attribute, and the ternary Stamp writes
    const marks = [...src(path).matchAll(/data-part=(?:"([a-z-]+)"|\{[^}]*?'([a-z-]+)')/g)].map(
      (m) => m[1] ?? m[2],
    )
    assert.ok(marks.length > 0, `${id} carries markers at all`)
    const known = new Set(layersFor(id).map((layer) => layer.id))
    for (const part of marks) assert.ok(known.has(part), `${id}'s "${part}" is one of its layers`)
  }
})

test('the bench picks with Figma’s two gestures, and swallows only one', () => {
  assert.ok(stageSrc.includes('onClickCapture'), 'the pick is made before the sample reacts')
  assert.ok(stageSrc.includes('onDoubleClickCapture'), 'and a double-click enters the group')
  // ⌘ is the tool's; a plain click still belongs to the sample under it
  const capture = stageSrc.slice(stageSrc.indexOf('onClickCapture'))
  const guarded = capture.slice(0, capture.indexOf('onDoubleClickCapture'))
  assert.match(guarded, /if \(direct\) \{\s*e\.preventDefault\(\)\s*e\.stopPropagation\(\)/)
})

/* ------------------------------------------------------- the modifiers */

test('the token set is one control, and it is the one SAVE reads', () => {
  // one row on the panel, not a flyout in the crown and not a second tab row
  assert.ok(!stageSrc.includes('SetSwitch'), 'the crown flyout is gone')
  assert.ok(!stageSrc.includes('aria-haspopup="menu"'), 'and nothing opens a menu any more')
  assert.match(stageSrc, /axis="set"\s*\n\s*name="styler\.axis\.set"/, 'it is a modifier row')
  // picking one writes the settings store, both halves of it
  assert.match(stageSrc, /setSkin\(next\.skin\)/)
  assert.match(stageSrc, /setTheme\(next\.theme\)/)
  // and the bench reads back exactly what the commit hook reads
  assert.ok(stageSrc.includes('themeFor(skin, theme)'), 'the bench reads the store')
  assert.ok(
    src('src/components/inspect/useTokenSave.tsx').includes('themeFor(skin, theme)'),
    'and so does the button that sends it',
  )
  // the crown's copy went with the control
  assert.ok(!('styler.set.change' in COPY), 'the flyout prompt left copy.json')
  assert.ok('styler.axis.set' in COPY, 'the axis name stayed')
})

test('every modifier is a row in the dock, and every row is one control', () => {
  /* Jake, s111: "make all of the modifiers be elements in the styler panel on
     the right (desktop, mobile + default, hover, etc + classic, medieval +
     variant active, resting)." Four axes, one component, one block. */
  const dockAt = stageSrc.indexOf('className={styles.dock}')
  const modsAt = stageSrc.indexOf('className={styles.mods}')
  const bodyAt = stageSrc.indexOf('className={styles.dockBody}')
  assert.ok(modsAt > dockAt, 'the block is in the right dock')
  assert.ok(modsAt < bodyAt, 'and above the blocks it sets up')
  const axes = [...stageSrc.matchAll(/axis="(\w+)"/g)].map((m) => m[1])
  assert.deepEqual(axes, ['viewport', 'state', 'set', 'variant'])
  // one component draws all four, or four segmented controls start to differ
  assert.equal([...stageSrc.matchAll(/function AxisRow\(/g)].length, 1)
  assert.equal([...stageSrc.matchAll(/<AxisRow\b/g)].length, 4)
  // VARIANT swaps what the bench SHOWS, so it is a tablist and the bench is
  // its panel; the other three set the one panel, which is a radio group
  assert.match(stageSrc, /role=\{tabs \? 'tablist' : 'radiogroup'\}/)
  assert.match(stageSrc, /role=\{tabs \? 'tab' : 'radio'\}/)
  assert.equal([...stageSrc.matchAll(/^\s+tabs\s*$/gm)].length, 1, 'exactly one row is tabs')
  assert.ok(stageSrc.includes('aria-controls={BENCH_ID}'), 'every row still names the bench')
  // and both marks paint the same pill, or a visitor can see which is which
  assert.match(stageCss, /\.tab\[aria-selected='true'\],\s*\n\s*\.tab\[aria-checked='true'\]/)
})

test('a modifier row is a segmented control a keyboard can walk', () => {
  const row = stageSrc.slice(stageSrc.indexOf('function AxisRow('), stageSrc.indexOf('/** THE GRIP'))
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']) {
    assert.ok(row.includes(`'${key}'`), `${key} moves the caret`)
  }
  // roving tabindex: one stop per row, so Tab crosses an axis in one press
  assert.match(row, /tabIndex=\{on \? 0 : -1\}/)
  // and the caret follows the pick, which is what automatic activation means
  assert.ok(row.includes('document.getElementById(itemId(axis, next.id))?.focus()'))
})

test('the state row is offered only where the component has a hover to show', () => {
  /* A HOVER pill on a component whose tokens declare no hover would be a
     control that paints nothing and blames the visitor for not seeing it. The
     spec declares the states; the TOKEN NAMES are what this checks it against,
     so the two can never drift apart in silence. */
  const body = specSrc.slice(specSrc.indexOf('export const STAGE_SPECS'))
  for (const id of COMPONENT_IDS) {
    const at = body.indexOf(/^[a-z]+$/.test(id) ? `\n  ${id}: {` : `\n  '${id}': {`)
    const spec = body.slice(at, at + 400)
    const states = spec.match(/states: \[([^\]]*)\]/)
    assert.ok(states, `${id} declares its states`)
    const offersHover = states[1].includes("'hover'")
    const hasHover = rowsFor(id).some((row) => row.role.includes('-hover-'))
    assert.equal(offersHover, hasHover, `${id}: the row matches what its tokens declare`)
    assert.ok(states[1].includes("'default'"), `${id} always has a resting state`)
  }
  // and the panel draws the row only when there is a choice in it
  assert.ok(stageSrc.includes('states.length > 1 && state &&'), 'one state draws no row')
})

test('the bench holds the state down, and the pilot hover rules answer to it', () => {
  // there is no way to hover a sample on somebody else's behalf, so the mount
  // declares the state and the components' own rules read it
  assert.match(stageSrc, /data-styler-state=\{state\?\.id \?\? 'default'\}/)
  const forced = /:is\(:hover, \[data-styler-state='hover'\] \*\)/
  const shellSheet = src('src/components/shell/shell.module.css')
  const primitives = src('src/components/primitives/primitives.module.css')
  assert.match(shellSheet, new RegExp(`\\.ctrl${forced.source}`), 'window ctrl')
  assert.match(shellSheet, new RegExp(`\\.iconBtn${forced.source}`), 'desktop icons')
  assert.match(primitives, new RegExp(`\\.btnSystem${forced.source}`), 'button, system')
  assert.match(primitives, new RegExp(`\\.btnExpressive${forced.source}`), 'button, expressive')
  // one declaration of what hover looks like, never a forced copy beside it
  for (const [name, sheet] of [
    ['shell', shellSheet],
    ['primitives', primitives],
  ]) {
    const bare = [...sheet.matchAll(/\.(ctrl|iconBtn|btnSystem|btnExpressive):hover\b/g)]
    assert.deepEqual(bare, [], `${name} has no unforced copy of a pilot hover rule`)
  }
})

test('the pilot components size themselves against a container, not the screen', () => {
  /* Jake, s111: "I feel like I'm not able to manipulate the mobile view." A
     @media rule asks the screen, and a 360px bench in a 1440px room gets the
     wide answer, so the mobile form was a thing the tool could not draw. */
  const shellSheet = src('src/components/shell/shell.module.css')
  const at = (needle) => shellSheet.indexOf(needle)
  assert.ok(at('@container viewport (max-width: 720px)') > 0, 'the mobile block moved')
  assert.ok(at('@container viewport (min-width: 721px)') > 0, 'and the desktop one with it')
  // every pilot selector is under a container rule now, and none under a
  // viewport media query at the same breakpoint
  const container = shellSheet.slice(at('@container viewport (max-width: 720px)'))
  const block = container.slice(0, container.indexOf('\n}\n'))
  for (const sel of [
    '.icons',
    '.iconBtn',
    '.window',
    '.titlebar',
    '.title',
    '.ctrl',
    '.titleControls',
    '.resizeGrip',
    '.wordmark span',
  ]) {
    assert.ok(block.includes(`${sel} {`) || block.includes(`${sel},`), `${sel} is in the container`)
  }
  // the desk's own two stayed behind: where the dock's programs live at this
  // width is a fact about the desktop, and a desk goes on no bench
  const media = shellSheet.slice(at('@media (max-width: 720px)'))
  assert.ok(media.includes('.trashGrid'), 'trashGrid is still a viewport rule')
  assert.ok(media.includes('.dockedGrid'), 'and so is dockedGrid')
})

test('a locked row wears a glyph and keeps the word in the tree', () => {
  /* The word LOCKED sat in a chip in a column of bindings, where it read as
     one more binding. A padlock reads as "not an offer" at a glance — but
     only to the eye, so the chip carries the name the word used to be. */
  const blocksSrc = src('src/components/inspect/StylerBlocks.tsx')
  assert.ok(blocksSrc.includes('function LockGlyph()'), 'there is a glyph')
  assert.ok(!/<CopyText k="styler.locked"/.test(blocksSrc), 'the word is off the screen')
  assert.ok('styler.locked' in COPY, 'and the copy key survived')
  const chip = blocksSrc.slice(blocksSrc.indexOf('data-tier="locked"'))
  const open = chip.slice(0, chip.indexOf('</span>'))
  assert.match(open, /role="img"/, 'the chip is the label')
  assert.match(open, /aria-label=\{t\('styler\.locked', skin\)\}/, 'named from the copy layer')
  assert.match(open, /<LockGlyph \/>/)
  // the house's small-chrome recipe: currentColor, no fill, decorative
  const glyph = blocksSrc.slice(blocksSrc.indexOf('function LockGlyph()'))
  const svg = glyph.slice(0, glyph.indexOf('</svg>'))
  assert.match(svg, /stroke="currentColor"/)
  assert.match(svg, /fill="none"/)
  assert.match(svg, /aria-hidden="true"/)
  assert.match(svg, /viewBox="0 0 32 32"/, 'the 32-unit grid the other glyphs use')
})

test('the container is declared on the body and again on the bench', () => {
  /* The nearest named ancestor wins, which is the whole mechanism: body is
     the screen, the bench is closer, so MOBILE narrows the component without
     touching the room around it. Body rather than the desktop element because
     `container-type: inline-size` makes a box the containing block for every
     fixed descendant under it, and body is the one that already IS the
     viewport — the desktop starts below the menu bar, INSPECT.MODE insets its
     sides, and the menu bar is its sibling rather than its child. */
  const globals = src('src/app/globals.css')
  const body = globals.slice(globals.indexOf('\nbody {'), globals.indexOf('\nbody,\n'))
  assert.match(body, /container-name: viewport/)
  assert.match(body, /container-type: inline-size/)
  assert.match(body, /height: 100%/, 'and body is still the whole screen')
  assert.match(stageCss, /container: viewport \/ inline-size/, 'the bench takes the same name')
  // MOBILE is the site's own floor, and it is a real CSS width or the query
  // has nothing to measure
  assert.match(stageCss, /\.mountMobile \{[^}]*width: 360px/)
  assert.match(stageCss, /\.mountMobile \{[^}]*box-sizing: content-box/)
  assert.match(stageSrc, /styles\.mountMobile/, 'and the viewport row turns it on')
})

test('the button on the floor says what it does, and says it once', () => {
  assert.equal(COPY['styler.save'], 'OPEN PR')
  assert.ok(stageSrc.includes(`k="styler.save"`), 'the stage uses its own key')
  assert.ok(!stageSrc.includes('shell.saveTarget'), 'the theme chip left with the tab row')
  // the inspector keeps its own, and its own destination chip with it
  assert.equal(COPY['inspect.save'], 'SAVE → PR')
  assert.ok(src('src/components/inspect/InspectorPanel.tsx').includes(`k="inspect.save"`))
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
