/* THE CURATION, kept honest.
 *
 * src/lib/styleCandidates.ts is a hand list — taste, typed out — and a hand
 * list rots quietly. Three ways, all of them silent:
 *
 * · A component gets promoted (the recipe in tokens/ARCHITECTURE.md), its new
 *   property lands on a suffix nobody classified, and STYLER either offers the
 *   wrong ramp or locks a row that should be editable.
 * · A candidate names a path that does not exist — a typo, or a token that
 *   moved — and the picker offers a binding that CI will reject as a broken
 *   ref, two steps and one PR later.
 * · A component gets re-bound BY HAND to something the picker does not offer.
 *   Then the panel cannot show a row its own current value, and the first
 *   thing STYLER does is silently mis-describe the file.
 *
 * So this file walks the real token JSON and the generated manifest and
 * refuses all three. Nothing here is mocked.
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
const {
  COMPONENT_IDS,
  componentIdOf,
  familyOf,
  candidatesFor,
  isLawfulTarget,
  CANDIDATES_BY_FAMILY,
  isComponentRole,
} = await import(moduleUrl('src/lib/styleCandidates.ts', { './tokens.generated': tiersUrl }))

const COMPONENT_ROLES = Object.keys(TOKEN_TIERS)
  .filter((name) => TOKEN_TIERS[name] === 'component')
  .map((name) => name.slice(2))

/* ------------------------------------------------------------- identity */

test('a role resolves to its component, longest prefix and segment-aligned', () => {
  assert.equal(componentIdOf('button-radius'), 'button')
  assert.equal(componentIdOf('desktop-icons-gap-row'), 'desktop-icons')
  assert.equal(componentIdOf('menubar-h'), 'menubar')
  assert.equal(componentIdOf('window-titlebar-active-fg'), 'window')
  // segment boundary, not a bare startsWith
  assert.equal(componentIdOf('buttonish-radius'), null)
  assert.equal(componentIdOf('accent'), null)
})

test('every component-tier property belongs to a registered component', () => {
  const orphans = COMPONENT_ROLES.filter((role) => !componentIdOf(role))
  assert.deepEqual(orphans, [], 'promote a component and it must join COMPONENT_IDS')
  assert.deepEqual([...COMPONENT_IDS].sort(), [...COMPONENT_IDS])
})

test('isComponentRole reads the manifest, not the name', () => {
  assert.equal(isComponentRole('button-radius'), true)
  assert.equal(isComponentRole('accent'), false)
  assert.equal(isComponentRole('button-nonsense'), false)
})

/* ----------------------------------------------------- the pinned map */

/* The whole pilot five, hand-checked. Not a convenience: classification is by
   suffix, and the near-misses are exactly the ones a regex gets wrong —
   `desktop-icons-cell-width` must NOT read as a border width, `window-ctrl-size`
   must NOT read as a font size, and `-fill` has to be a color even though the
   recipe's category list never named it. Pinning the whole map means the next
   promotion either fits the rules or shows up here as a diff. */
const FAMILY_MAP = {
  'button-bg': 'color',
  'button-expressive-hover-bg': 'color',
  'button-expressive-hover-fg': 'color',
  'button-fg': 'color',
  'button-md-border': 'border-width',
  'button-md-padding-x': 'space',
  'button-md-padding-y': 'space',
  'button-md-text-font-family': 'locked',
  'button-md-text-font-size': 'locked',
  'button-md-text-font-weight': 'locked',
  'button-md-text-letter-spacing': 'locked',
  'button-md-text-line-height': 'locked',
  'button-radius': 'radius',
  'button-sm-border': 'border-width',
  'button-sm-padding-x': 'space',
  'button-sm-padding-y': 'space',
  'button-sm-text-font-family': 'locked',
  'button-sm-text-font-size': 'locked',
  'button-sm-text-font-weight': 'locked',
  'button-sm-text-letter-spacing': 'locked',
  'button-sm-text-line-height': 'locked',
  'button-solid-bg': 'color',
  'button-solid-fg': 'color',
  'button-stroke': 'color',
  'button-system-hover-bg': 'color',
  'button-system-hover-fg': 'color',
  'desktop-icons-border-width': 'border-width',
  'desktop-icons-cell-width': 'locked',
  'desktop-icons-gap-column': 'space',
  'desktop-icons-gap-row': 'space',
  'desktop-icons-hover-bg': 'color',
  'desktop-icons-hover-border-color': 'color',
  'desktop-icons-icon-btn-gap': 'space',
  'desktop-icons-icon-btn-padding-bottom': 'space',
  'desktop-icons-icon-btn-padding-top': 'space',
  'desktop-icons-icon-btn-padding-x': 'space',
  'desktop-icons-label-text-font-family': 'locked',
  'desktop-icons-label-text-font-size': 'locked',
  'desktop-icons-label-text-font-weight': 'locked',
  'desktop-icons-label-text-letter-spacing': 'locked',
  'desktop-icons-label-text-line-height': 'locked',
  'menubar-bg': 'color',
  'menubar-border-color': 'color',
  'menubar-border-width': 'border-width',
  'menubar-gap': 'space',
  'menubar-h': 'locked',
  'menubar-menu-btn-border-width': 'border-width',
  'menubar-menu-btn-padding-x': 'space',
  'menubar-menu-btn-padding-y': 'space',
  'menubar-menu-btn-text-font-family': 'locked',
  'menubar-menu-btn-text-font-size': 'locked',
  'menubar-menu-btn-text-font-weight': 'locked',
  'menubar-menu-btn-text-letter-spacing': 'locked',
  'menubar-menu-btn-text-line-height': 'locked',
  'menubar-menu-glyph-btn-padding': 'space',
  'menubar-padding-x': 'space',
  'menubar-text-font-family': 'locked',
  'menubar-text-font-size': 'locked',
  'menubar-text-font-weight': 'locked',
  'menubar-text-letter-spacing': 'locked',
  'menubar-text-line-height': 'locked',
  'menubar-wordmark-text-font-family': 'locked',
  'menubar-wordmark-text-font-size': 'locked',
  'menubar-wordmark-text-font-weight': 'locked',
  'menubar-wordmark-text-letter-spacing': 'locked',
  'menubar-wordmark-text-line-height': 'locked',
  'menubar-wordmark-version-margin-left': 'space',
  'menubar-wordmark-version-text-font-family': 'locked',
  'menubar-wordmark-version-text-font-size': 'locked',
  'menubar-wordmark-version-text-font-weight': 'locked',
  'menubar-wordmark-version-text-letter-spacing': 'locked',
  'menubar-wordmark-version-text-line-height': 'locked',
  'stamp-border-color': 'color',
  'stamp-border-width': 'border-width',
  'stamp-fg': 'color',
  'stamp-padding-x': 'space',
  'stamp-padding-y': 'space',
  'stamp-pink-border-color': 'color',
  'stamp-pink-fg': 'color',
  'stamp-text-font-family': 'locked',
  'stamp-text-font-size': 'locked',
  'stamp-text-font-weight': 'locked',
  'stamp-text-letter-spacing': 'locked',
  'stamp-text-line-height': 'locked',
  'window-border-width': 'border-width',
  'window-ctrl-hover-bg': 'color',
  'window-ctrl-hover-border-color': 'color',
  'window-ctrl-hover-fg': 'color',
  'window-ctrl-size': 'locked',
  'window-explainer-btn-text-font-family': 'locked',
  'window-explainer-btn-text-font-size': 'locked',
  'window-explainer-btn-text-font-weight': 'locked',
  'window-explainer-btn-text-letter-spacing': 'locked',
  'window-explainer-btn-text-line-height': 'locked',
  'window-fill': 'color',
  'window-stroke': 'color',
  'window-title-controls-gap': 'space',
  'window-title-meta-text-font-family': 'locked',
  'window-title-meta-text-font-size': 'locked',
  'window-title-meta-text-font-weight': 'locked',
  'window-title-meta-text-letter-spacing': 'locked',
  'window-title-meta-text-line-height': 'locked',
  'window-title-text-font-family': 'locked',
  'window-title-text-font-size': 'locked',
  'window-title-text-font-weight': 'locked',
  'window-title-text-letter-spacing': 'locked',
  'window-title-text-line-height': 'locked',
  'window-titlebar-active-bg': 'color',
  'window-titlebar-active-border-color': 'color',
  'window-titlebar-active-fg': 'color',
  'window-titlebar-border-color': 'color',
  'window-titlebar-border-width': 'border-width',
  'window-titlebar-fill': 'color',
  'window-titlebar-gap': 'space',
  'window-titlebar-padding-x': 'space',
  'window-titlebar-padding-y': 'space',
}

test('familyOf classifies the pilot five exactly as pinned', () => {
  const actual = Object.fromEntries(COMPONENT_ROLES.map((role) => [role, familyOf(role)]))
  assert.deepEqual(actual, FAMILY_MAP)
})

test('the structural three and the composite members are all that is locked', () => {
  const locked = COMPONENT_ROLES.filter((role) => familyOf(role) === 'locked')
  const structural = locked.filter((role) => !/-text-/.test(role))
  assert.deepEqual(structural.sort(), ['desktop-icons-cell-width', 'menubar-h', 'window-ctrl-size'])
  for (const role of locked) assert.deepEqual(candidatesFor(role), [])
})

/* --------------------------------------------------------- the lists */

const EXPECTED_TIER = {
  color: 'semantic',
  radius: 'semantic',
  'border-width': 'semantic',
  // a type role's varName is one MEMBER of the composite (--type-<role>-size);
  // the members are semantic, the composite itself emits nothing at all
  'type-role': 'semantic',
}

test('every candidate names a property the build actually emits', () => {
  for (const [family, list] of Object.entries(CANDIDATES_BY_FAMILY)) {
    for (const candidate of list) {
      const tier = TOKEN_TIERS[candidate.varName]
      assert.ok(tier, `${family}: ${candidate.varName} is not in TOKEN_TIERS`)
      // the spacing list straddles on purpose: t-shirt roles are semantic, the
      // numeric ramp they alias is core and is offered because the pilots' own
      // bindings sit on it
      const expected =
        family === 'space' ? (candidate.token.startsWith('spacing/') ? 'semantic' : 'core') : EXPECTED_TIER[family]
      assert.equal(tier, expected, `${family}: ${candidate.varName} is ${tier}`)
    }
  }
})

/* The five properties a typography composite expands into, as the suffixes
   the CSS carries and the member names the semantic type ramp publishes. */
const TYPE_MEMBERS = [
  ['font-family', 'family'],
  ['font-size', 'size'],
  ['font-weight', 'weight'],
  ['letter-spacing', 'tracking'],
  ['line-height', 'leading'],
]

test('a candidate varName is the slash path joined with dashes', () => {
  for (const [family, list] of Object.entries(CANDIDATES_BY_FAMILY)) {
    // type-role is the one family where it cannot be: 'typography/badge' emits
    // no --typography-badge, it emits five --type-badge-* members. Checked by
    // the test below instead, which is the stronger claim anyway.
    if (family === 'type-role') continue
    for (const candidate of list) {
      assert.equal(candidate.varName, `--${candidate.token.split('/').join('-')}`, candidate.name)
      assert.ok(candidate.name.length > 0, candidate.token)
    }
  }
})

test('a type-role offer names a real role, and all five of its members emit', () => {
  for (const candidate of CANDIDATES_BY_FAMILY['type-role']) {
    assert.ok(candidate.name.length > 0, candidate.token)
    const role = candidate.token.replace(/^typography\//, '')
    assert.notEqual(role, candidate.token, `${candidate.token} is not a typography role`)
    // the varName is a representative member, not the composite — so pin the
    // whole set it stands for, or naming one could quietly stop meaning five
    assert.equal(candidate.varName, `--type-${role}-size`)
    for (const [, member] of TYPE_MEMBERS) {
      assert.equal(TOKEN_TIERS[`--type-${role}-${member}`], 'semantic', `--type-${role}-${member}`)
    }
  }
})

/* THE RETIRED KNOBS. STYLER shipped with font-size, tracking, weight and
   family lists; the ruling took them away, and their absence is the law, not
   an accident of a refactor — a re-added list would let a picker assemble a
   treatment out of loose pieces again. */
test('the loose type knobs are gone, and their suffixes fall to locked', () => {
  for (const retired of ['font-size', 'tracking', 'weight', 'family']) {
    assert.equal(retired in CANDIDATES_BY_FAMILY, false, `${retired} is back`)
  }
  assert.deepEqual(Object.keys(CANDIDATES_BY_FAMILY).sort(), [
    'border-width',
    'color',
    'locked',
    'radius',
    'space',
    'type-role',
  ])
  // the parent is the offer; every member of it, and any other stray bearing
  // one of the retired suffixes, is locked
  assert.equal(familyOf('stamp-text'), 'type-role')
  for (const [suffix] of TYPE_MEMBERS) assert.equal(familyOf(`stamp-text-${suffix}`), 'locked')
  for (const stray of ['button-tracking', 'button-weight', 'button-family', 'button-font-size']) {
    assert.equal(familyOf(stray), 'locked', stray)
  }
})

/* Every leaf path in the semantic and core sets, in slash form — the same walk
   the build does, so a candidate that resolves here is a candidate Style
   Dictionary can resolve too. */
function leafPaths(tree, prefix = []) {
  const out = []
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith('$')) continue
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const path = [...prefix, key]
    if ('$value' in value) out.push(path.join('/'))
    else out.push(...leafPaths(value, path))
  }
  return out
}

const AUTHORED = new Set(
  ['semantic', 'core'].flatMap((tier) =>
    readdirSync(resolve(root, 'tokens', tier))
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => leafPaths(JSON.parse(src(`tokens/${tier}/${f}`)))),
  ),
)

test('every candidate path is a real leaf in the semantic or core sets', () => {
  for (const [family, list] of Object.entries(CANDIDATES_BY_FAMILY)) {
    for (const candidate of list) {
      assert.ok(AUTHORED.has(candidate.token), `${family}: ${candidate.token} is not authored`)
    }
  }
})

test('the curated colors exclude the roles that are not chrome', () => {
  const tokens = CANDIDATES_BY_FAMILY.color.map((c) => c.token)
  for (const excluded of [
    'focus',
    'accent-expressive-mark',
    'accent-expressive-text',
    'status/positive/base',
    'status/danger/base',
    'shadow-print',
    'interactive/disabled/opacity',
  ]) {
    assert.equal(tokens.includes(excluded), false, `${excluded} should not be offered`)
  }
})

test('isLawfulTarget is the ramp, and nothing but the ramp', () => {
  assert.equal(isLawfulTarget('button-radius', 'radius/control'), true)
  assert.equal(isLawfulTarget('button-radius', 'radius/md'), false) // core step, not offered
  assert.equal(isLawfulTarget('button-bg', 'surface-raised'), true)
  assert.equal(isLawfulTarget('button-bg', 'color/nasa/cobalt'), false) // a primitive
  assert.equal(isLawfulTarget('button-sm-padding-y', 'space/2'), true)
  assert.equal(isLawfulTarget('button-sm-padding-y', 'radius/control'), false)
  assert.equal(isLawfulTarget('menubar-h', 'space/8'), false) // locked
})

/* ------------------------------------------------------- the invariant */

/* The five rows one typography composite expands into. A component text
   element carries ONE binding — `"text": "{typography.badge}"` — and the build
   splits it into font-family, font-size, font-weight, letter-spacing and
   line-height. None of the five is an offer, so they are checked by the test
   below rather than against a picker list. */
const TEXT_MEMBER = /-text-(?:font-family|font-size|font-weight|letter-spacing|line-height)$/

test('every real component binding is inside the ramp its row offers', () => {
  const strays = []
  for (const [prop, ref] of Object.entries(TOKEN_REFS)) {
    if (ref === null) continue // OFF-GRID literal: nothing to match
    const role = prop.slice(2)
    if (TEXT_MEMBER.test(role)) continue // a composite member, checked below
    if (familyOf(role) === 'locked') {
      strays.push(`${prop} is locked but bound to ${ref}`)
      continue
    }
    if (!candidatesFor(role).some((c) => c.token === ref)) {
      strays.push(`${prop} → ${ref} is outside the ${familyOf(role)} list`)
    }
  }
  assert.deepEqual(strays, [])
})

/* THE RULING, AS A TEST. Type styles are packages, not knobs (Jake,
   2026-08-21): a text element binds one semantic type role and gets all of it.
   Two ways that can rot, both silent. A component could go back to assembling
   a treatment from loose pieces — a bare `-tracking` here, a `-font-size`
   there — and the panel would happily offer each one, which is how the pilot
   five ended up with nine near-miss treatments in the first place. Or an
   element's five rows could drift onto two different roles, which renders as a
   type style that exists nowhere in the system. So: nothing outside a text
   element may reach into the ramp, every text element must carry all five
   members, its four ramp members must name ONE role, and none of the five may
   be offerable. */
test('a text element binds one whole type role, and no row can split it', () => {
  const elements = new Map()
  for (const [prop, ref] of Object.entries(TOKEN_REFS)) {
    const role = prop.slice(2)
    if (!TEXT_MEMBER.test(role)) {
      assert.ok(!ref?.startsWith('type/'), `${prop} binds ${ref} — half a type role`)
      continue
    }
    assert.equal(familyOf(role), 'locked', `${prop} is offerable; a composite member is not a knob`)
    // keep the '-text', so the key IS the composite parent's custom property
    const element = `--${role.replace(TEXT_MEMBER, '-text')}`
    if (!elements.has(element)) elements.set(element, [])
    elements.get(element).push([prop, ref])
  }
  assert.ok(elements.size > 0)
  for (const [element, members] of elements) {
    assert.equal(members.length, 5, `${element} carries ${members.length} of the five members`)
    // font-family names a face (--mono/--display); the other four name one role
    const roles = new Set(
      members.filter(([, ref]) => ref?.startsWith('type/')).map(([, ref]) => ref.split('/')[1]),
    )
    assert.deepEqual([...roles].length, 1, `${element} straddles type roles: ${[...roles]}`)
  }
  /* And the elements the MEMBERS describe are exactly the elements the PARENT
     manifest lists. The two are built from opposite ends — TOKEN_REFS out of
     the expanded dictionary, TOKEN_COMPOSITES off the source files — so this
     is where a parent that stopped expanding, or five orphan members with no
     parent left, would show up instead of passing quietly. */
  assert.deepEqual([...elements.keys()].sort(), Object.keys(TOKEN_COMPOSITES).sort())
})

/* ------------------------------------------------ the composite parents */

test('every composite parent is a type-role row bound inside its own ramp', () => {
  assert.equal(Object.keys(TOKEN_COMPOSITES).length, 11)
  for (const [prop, ref] of Object.entries(TOKEN_COMPOSITES)) {
    const role = prop.slice(2)
    // not in TOKEN_TIERS at all — the build expands the parent away — which is
    // exactly why the tier question has to be asked of both manifests
    assert.equal(TOKEN_TIERS[prop], undefined, `${prop} emits after all`)
    assert.equal(familyOf(role), 'type-role', `${prop} is ${familyOf(role)}`)
    assert.ok(componentIdOf(role), `${prop} belongs to no registered component`)
    // the curation honesty check: a picker must be able to show a row its own
    // current value, or STYLER mis-describes the file the moment it opens
    assert.equal(isLawfulTarget(role, ref), true, `${prop} → ${ref} is not an offer`)
  }
})

test('a composite parent and its five members name the same role', () => {
  const FACES = ['sans', 'mono', 'display']
  for (const [prop, ref] of Object.entries(TOKEN_COMPOSITES)) {
    const role = ref.replace(/^typography\//, '')
    assert.equal(ref, `typography/${role}`, prop)
    for (const [suffix, member] of TYPE_MEMBERS) {
      const memberProp = `${prop}-${suffix}`
      assert.equal(TOKEN_TIERS[memberProp], 'component', `${memberProp} does not emit`)
      if (suffix === 'font-family') {
        /* The one member that does NOT read type/<role>/family: the composite
           names a Figma face and the build swaps it for the skin's var()
           stack on the way in, so the member ref is --mono/--sans/--display.
           Losing that swap would bake "Geist Mono" into the component and
           take the per-skin face with it. */
        assert.ok(FACES.includes(TOKEN_REFS[memberProp]), `${memberProp} → ${TOKEN_REFS[memberProp]}`)
        continue
      }
      assert.equal(TOKEN_REFS[memberProp], `type/${role}/${member}`, memberProp)
    }
  }
})

test('the type-role offers are the authored typography roles, in order', () => {
  const authored = Object.keys(JSON.parse(src('tokens/semantic/typography.json')).typography).filter(
    (k) => !k.startsWith('$'),
  )
  assert.equal(authored.length, 18)
  assert.deepEqual([...TYPE_ROLES], authored)
  // 1:1 and in order — the list is derived, and nothing filters or re-sorts it
  assert.deepEqual(
    CANDIDATES_BY_FAMILY['type-role'].map((c) => c.token),
    authored.map((role) => `typography/${role}`),
  )
  // the names a person reads: title case, with the size segments left as caps
  const named = Object.fromEntries(CANDIDATES_BY_FAMILY['type-role'].map((c) => [c.token, c.name]))
  assert.equal(named['typography/body-lg'], 'Body LG')
  assert.equal(named['typography/heading-1'], 'Heading 1')
  assert.equal(named['typography/control-sm'], 'Control SM')
  assert.equal(named['typography/wordmark'], 'Wordmark')
})

test('TOKEN_REFS covers the component tier and nothing else', () => {
  assert.deepEqual(Object.keys(TOKEN_REFS).sort(), COMPONENT_ROLES.map((r) => `--${r}`).sort())
  // the OFF-GRID literals are the only nulls, and there really are some
  const nulls = Object.entries(TOKEN_REFS).filter(([, ref]) => ref === null)
  assert.ok(nulls.length > 0)
  for (const [prop] of nulls) assert.equal(TOKEN_TIERS[prop], 'component')
})
