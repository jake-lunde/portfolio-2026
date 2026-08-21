/* The bundle-freshness verdict, which is the piece standing between Jake and
 * another PULL that runs month-old code (see src/freshness.ts for the day that
 * earned this file). Pure logic, no Figma globals, no network.
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
const src = readFileSync(resolve(here, '../src/freshness.ts'), 'utf8')
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { judge, blocks, lines, stampLabel, STAMP } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
)

const SHAS = [
  'aaaaaaa1111111111111111111111111111111111',
  'bbbbbbb2222222222222222222222222222222222',
  'ccccccc3333333333333333333333333333333333',
  'ddddddd4444444444444444444444444444444444',
]

function stamp(overrides = {}) {
  return {
    sha: SHAS[0],
    branch: 'main',
    dirty: false,
    at: '2026-08-21T16:41:09.737Z',
    ...overrides,
  }
}

test('an unbuilt bundle carries no stamp when nothing defines one', () => {
  assert.equal(STAMP, null)
})

test('newest commit for the path means fresh', () => {
  const v = judge(stamp(), SHAS)
  assert.equal(v.kind, 'fresh')
  assert.equal(blocks(v), false)
})

test('an older commit on the branch is stale, and stale stops the run', () => {
  const v = judge(stamp({ sha: SHAS[2] }), SHAS)
  assert.equal(v.kind, 'stale')
  assert.equal(v.behind, 2)
  assert.equal(v.latest, SHAS[0])
  assert.equal(blocks(v), true)
})

test('stale says both SHAs and how to fix it', () => {
  const out = lines(judge(stamp({ sha: SHAS[2] }), SHAS), 'main')
  assert.equal(out[0].level, 'error')
  assert.match(out[0].text, /ccccccc/)
  assert.match(out[0].text, /aaaaaaa/)
  assert.match(out[0].text, /2 commits behind main/)
  assert.match(out[0].text, /npm run plugin:build/)
})

test('one commit behind is singular', () => {
  const out = lines(judge(stamp({ sha: SHAS[1] }), SHAS), 'main')
  assert.match(out[0].text, /1 commit behind/)
})

test('a commit not in the branch history reads as off-branch, and warns only', () => {
  const v = judge(stamp({ sha: 'eeeeeee5555', branch: 'bridge-work' }), SHAS)
  assert.equal(v.kind, 'off-branch')
  assert.equal(blocks(v), false)
  assert.equal(lines(v, 'main')[0].level, 'warn')
})

test('a dirty build cannot be judged against the branch, so it never blocks', () => {
  const v = judge(stamp({ dirty: true, sha: SHAS[3] }), SHAS)
  assert.equal(v.kind, 'dirty')
  assert.equal(blocks(v), false)
})

test('no stamp at all predates stamping, which stops the run', () => {
  const v = judge(null, SHAS)
  assert.equal(v.kind, 'unstamped')
  assert.equal(blocks(v), true)
})

test('built outside git is unknown, not stale', () => {
  const v = judge(stamp({ sha: '' }), SHAS)
  assert.equal(v.kind, 'unknown')
  assert.equal(blocks(v), false)
})

test('a path no commit has ever touched cannot be behind', () => {
  assert.equal(judge(stamp(), []).kind, 'fresh')
})

test('the badge names the build, and marks a local one', () => {
  assert.equal(stampLabel(stamp()), 'BUNDLE aaaaaaa · 08-21 16:41')
  assert.equal(stampLabel(stamp({ dirty: true })), 'BUNDLE aaaaaaa+local · 08-21 16:41')
  assert.equal(stampLabel(stamp({ sha: '' })), 'BUNDLE untracked · 08-21 16:41')
  assert.equal(stampLabel(null), 'BUNDLE unstamped')
})
