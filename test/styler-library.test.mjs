/* THE SHELF'S PURE HALF — /styler, the library that lists every promoted
 * component.
 *
 * The page itself is JSX over five real components inside a Next route, so
 * it cannot be imported in a harness with no DOM (the whole suite is plain
 * node; see token-edit.test.mjs). What CAN be held here is the part that
 * would fail silently:
 *
 * · A component promoted into COMPONENT_IDS with no spec behind it. The
 *   shelf draws a card, the card opens the stage, and the stage returns
 *   null — a door onto nothing. styler-panel.test.mjs holds one direction
 *   of that already; this holds the other, so a spec added and never
 *   promoted is caught too.
 * · A card that opens on a variant the spec does not have. The thumbnail is
 *   blank and the component looks broken rather than the shelf looking
 *   broken.
 * · A copy key the page renders and copy.json has never heard of. t() falls
 *   back to the key, so the header would read "styler.library.title".
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
const candidatesUrl = moduleUrl('src/lib/styleCandidates.ts', { './tokens.generated': tiersUrl })
const { COMPONENT_IDS } = await import(candidatesUrl)
const blocksUrl = moduleUrl('src/lib/stylerBlocks.ts', {
  './tokens.generated': tiersUrl,
  './styleCandidates': candidatesUrl,
})
const { layersFor, rowsFor } = await import(blocksUrl)
const { libraryEntries } = await import(
  moduleUrl('src/lib/stylerLibrary.ts', {
    './styleCandidates': candidatesUrl,
    './stylerBlocks': blocksUrl,
  })
)

const COPY = JSON.parse(src('src/content/copy.json'))
const specSrc = src('src/components/inspect/stageSpecs.tsx')
const librarySrc = src('src/components/inspect/StylerLibrary.tsx')

/** The keys of STAGE_SPECS, read off the source the same way
    styler-panel.test.mjs reads it: the file is JSX over five real
    components and there is nothing to import in a harness with no DOM. */
function specIds() {
  const body = specSrc.slice(specSrc.indexOf('export const STAGE_SPECS'))
  return [...body.matchAll(/^ {2}'?([a-z-]+)'?: \{$/gm)].map((m) => m[1])
}

/* ------------------------------------------------------- the shelf's list */

test('the promoted list and the stage recipes are the same set', () => {
  /* Both directions. A promoted id with no spec is a card that opens onto a
     null stage; a spec that is not promoted is a component the shelf will
     never show, which is a recipe nobody can reach. */
  assert.deepEqual([...specIds()].sort(), [...COMPONENT_IDS].sort())
})

test('the shelf holds every promoted component, in the promoted order', () => {
  assert.deepEqual(
    libraryEntries().map((e) => e.id),
    [...COMPONENT_IDS],
  )
})

test('every card opens on the first variant its spec declares', () => {
  for (const entry of libraryEntries()) {
    assert.equal(entry.variant, 0, `${entry.id} opens on variant 0`)
  }
  /* and the card READS that index rather than writing 0 itself, or the
     helper above is a claim about nothing */
  assert.match(librarySrc, /spec\.variants\(skin\)\[variant\]/)
})

test('the counts on a card are the component anatomy, not a guess', () => {
  for (const entry of libraryEntries()) {
    assert.equal(entry.layers, layersFor(entry.id).length)
    assert.equal(entry.tokens, rowsFor(entry.id).length)
    assert.ok(entry.layers > 0, `${entry.id} has layers`)
    assert.ok(entry.tokens > 0, `${entry.id} has rows`)
  }
})

/* --------------------------------------------------------------- the words */

test('every copy key the library renders exists in copy.json', () => {
  const keys = [
    /* Dotted keys only, either quote style: JSX props are written with
       double quotes and t() calls with single, and `params.get('c')` is a
       query param rather than a copy key. */
    ...[...librarySrc.matchAll(/(?:CopyText k=|closeLabelKey=|t\()['"](\w+(?:\.\w+)+)['"]/g)].map(
      (m) => m[1],
    ),
  ]
  assert.ok(keys.length >= 6, 'the keys were found at all')
  for (const key of keys) assert.ok(key in COPY, `${key} is in copy.json`)
})

test('the shelf has a door back to the machine it belongs to', () => {
  /* /styler draws no menubar and no dock, so the page's only way back to the
     OS is this link. Lose it and a visitor who arrived on a shared URL is in
     a room with no handle on the inside. */
  assert.match(librarySrc, /<Link className=\{styles\.back\} href="\/">/)
  assert.match(librarySrc, /k="styler\.library\.back"/)
  assert.ok('styler.library.back' in COPY)
  // the words carry the meaning; the arrow is scenery in front of them
  assert.match(COPY['styler.library.back'], /BACK TO THE DESKTOP/)
  assert.match(src('src/components/inspect/stylerLibrary.module.css'), /\.back:focus-visible/)
})

test('the inspector foot carries the door to the shelf', () => {
  const panel = src('src/components/inspect/InspectorPanel.tsx')
  assert.match(panel, /href="\/styler"/)
  assert.match(panel, /styler\.library\.link/)
  assert.ok('styler.library.link' in COPY)
})

test('the stage names its exit after the door it was opened by', () => {
  // the OS keeps the key it shipped with; the library passes the other one
  const stage = src('src/components/inspect/StylerStage.tsx')
  assert.match(stage, /closeLabelKey = 'styler\.close'/)
  assert.match(librarySrc, /closeLabelKey="styler\.close\.library"/)
  assert.ok('styler.close' in COPY && 'styler.close.library' in COPY)
})

/* --------------------------------------------------------------- the floor */

test('the shelf gives up at the same width the stage does', () => {
  const shell = src('src/components/inspect/InspectShell.tsx')
  const stageCss = src('src/components/inspect/stylerStage.module.css')
  const floor = /\(max-width: 900px\)/
  assert.match(librarySrc, floor)
  assert.match(shell, floor)
  assert.match(stageCss, floor)
})
