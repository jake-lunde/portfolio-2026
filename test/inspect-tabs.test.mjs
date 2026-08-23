/* THE INSPECTOR'S TAB STEP — pure, so it is testable without a DOM.
 *
 * InspectorPanel.tsx cannot be imported here (it is JSX over React, and
 * this harness has no DOM — see styler-panel.test.mjs's note on
 * stageSpecs.tsx for the same limit). The keyboard rule both tab rows
 * share lives in src/lib/tabs.ts precisely so it has a pure half worth
 * guarding on its own: clamped, never wrapped, and the same for every
 * key that is not one of the four tab-navigation keys.
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

function moduleUrl(path) {
  const js = ts.transpileModule(src(path), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return 'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
}

const { tabStep } = await import(moduleUrl('src/lib/tabs.ts'))

test('arrow keys step by one, clamped at the ends', () => {
  assert.equal(tabStep(0, 3, 'ArrowRight'), 1)
  assert.equal(tabStep(1, 3, 'ArrowRight'), 2)
  // the last tab does not wrap to the first
  assert.equal(tabStep(2, 3, 'ArrowRight'), 2)
  assert.equal(tabStep(1, 3, 'ArrowLeft'), 0)
  // the first tab does not wrap to the last
  assert.equal(tabStep(0, 3, 'ArrowLeft'), 0)
})

test('Home and End jump to the ends from anywhere', () => {
  assert.equal(tabStep(1, 4, 'Home'), 0)
  assert.equal(tabStep(1, 4, 'End'), 3)
  assert.equal(tabStep(0, 4, 'Home'), 0)
  assert.equal(tabStep(3, 4, 'End'), 3)
})

test('a key that is not tab navigation is left alone', () => {
  assert.equal(tabStep(0, 3, 'Enter'), null)
  assert.equal(tabStep(0, 3, 'Escape'), null)
  assert.equal(tabStep(0, 3, 'a'), null)
})

test('an empty tab list has nowhere to step, whatever the key', () => {
  assert.equal(tabStep(0, 0, 'ArrowRight'), null)
  assert.equal(tabStep(0, 0, 'Home'), null)
})

test('a single tab holds still on either arrow', () => {
  assert.equal(tabStep(0, 1, 'ArrowRight'), 0)
  assert.equal(tabStep(0, 1, 'ArrowLeft'), 0)
})
