/* The TEXT index's pure half. It exists for the same reason the token
 * commit's tests do: the failure mode is SILENT. The build keys a string
 * off the source, the browser keys the same string off the DOM, and if
 * those two ever stop agreeing the index becomes a table nothing can hit.
 * Nothing throws. SOURCE just quietly stops naming a file, which is the
 * exact gap this was built to close.
 *
 * So: the normalizer is checked from both sides of that seam (an entity in
 * a .tsx file, the glyph the browser hands back), and the generated index
 * is checked for the one line Jake asked about by name.
 *
 * src/lib/textNormalize.ts is written with no imports precisely so this can
 * run with no build step.
 *
 * Run: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'

const here = dirname(fileURLToPath(import.meta.url))
const src = (p) => readFileSync(resolve(here, '..', p), 'utf8')

function moduleUrl(path) {
  const js = ts.transpileModule(src(path), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return 'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
}

const { normalizeText, textKey, TEXT_KEY_LEN, TEXT_MIN_LEN } = await import(
  moduleUrl('src/lib/textNormalize.ts')
)

/* The generated module re-exports TEXT_KEY_LEN from the normalizer, which
   is a relative import a data: URL cannot follow. Each table in it is a
   plain object literal, so they are read as text and parsed. The slice is
   bounded at the closing brace in column zero: the file holds more than
   one table now, and an open-ended slice would swallow the next one. */
const generated = src('src/lib/textIndex.generated.ts')

function table(name) {
  const open = generated.indexOf('{', generated.indexOf(`export const ${name}`))
  const close = generated.indexOf('\n}', open)
  assert.ok(open > 0 && close > open, `no ${name} in the generated index`)
  return JSON.parse(
    generated
      .slice(open, close + 2)
      .trim()
      // the file keeps the house trailing comma; JSON does not take one
      .replace(/,\s*}$/, '}'),
  )
}

const TEXT_INDEX = table('TEXT_INDEX')
const MODULE_PATHS = table('MODULE_PATHS')

/* ------------------------------------------------------------ the seam */

test('the two sides of an entity normalize to the same string', () => {
  // what About.tsx writes, once the build has decoded it
  const fromSource = 'I’m a product designer shipping production code'
  // what the browser hands back from textContent
  const fromDom = "I'm a product designer shipping production code"
  assert.equal(normalizeText(fromSource), normalizeText(fromDom))
})

test('JSX indentation collapses to the browser one space', () => {
  const jsx = '\n        This site is the argument:\n        it is a small operating system\n      '
  const dom = 'This site is the argument: it is a small operating system'
  assert.equal(normalizeText(jsx), normalizeText(dom))
})

test('a non-breaking space is a space', () => {
  assert.equal(normalizeText('LUNDE OS is here'), normalizeText('LUNDE OS is here'))
})

test('leading and trailing punctuation comes off, inner punctuation stays', () => {
  assert.equal(normalizeText('  “Numbers on a screen.” '), 'numbers on a screen')
  assert.equal(normalizeText('one, two and three'), 'one, two and three')
})

test('a string under the minimum has no key', () => {
  assert.equal(textKey('OPEN'), '')
  assert.equal(textKey('  ,  '), '')
  assert.ok('a design engineer'.length > TEXT_MIN_LEN)
  assert.equal(textKey('a design engineer'), 'a design engineer')
})

test('a key is never longer than the key length', () => {
  const long = 'the quick brown fox jumps over the lazy dog and keeps on running'
  assert.equal(textKey(long).length, TEXT_KEY_LEN)
  assert.equal(textKey(long), normalizeText(long).slice(0, TEXT_KEY_LEN))
})

/* ------------------------------------------------------- the index itself */

/* Pinned to README's opening paragraph, which is written straight into
   About.tsx and so is exactly the case the index exists for. Jake rewrites
   this prose from time to time. When he does, the index is rebuilt and
   this fixture moves with it. Re-copy the paragraph's rendered text. */
test('the README paragraph Jake asked about points at its own file', () => {
  // the pick's textContent, exactly as the browser reports it
  const picked =
    'I’m Jake, and I’ve been designing solutions for humans and businesses ' +
    'for over 10 years.'
  assert.deepEqual(TEXT_INDEX[textKey(picked)], ['src/programs/about/About.tsx'])
})

test('case prose points at its MDX file', () => {
  const hits = Object.entries(TEXT_INDEX).filter(([, files]) =>
    files.some((f) => f.endsWith('.mdx')),
  )
  assert.ok(hits.length > 0, 'no MDX prose was indexed')
})

test('every key is a key the normalizer would have produced', () => {
  for (const key of Object.keys(TEXT_INDEX)) {
    assert.ok(key.length >= TEXT_MIN_LEN, `too short: ${key}`)
    assert.ok(key.length <= TEXT_KEY_LEN, `too long: ${key}`)
    // a truncated key can end mid-word, so only whole ones round-trip
    if (key.length < TEXT_KEY_LEN) assert.equal(normalizeText(key), key)
  }
})

test('every value is a repo-relative path, listed once', () => {
  for (const [key, files] of Object.entries(TEXT_INDEX)) {
    assert.ok(Array.isArray(files) && files.length > 0, `no file for ${key}`)
    assert.equal(new Set(files).size, files.length, `duplicate file for ${key}`)
    for (const file of files) {
      assert.ok(/^(src|content)\//.test(file), `not a source path: ${file}`)
    }
  }
})

/* A server route's strings never reach a node anybody can pick, so a
   pointer at one is a wrong answer waiting to be given. */
test('no server route is in the index', () => {
  for (const [key, files] of Object.entries(TEXT_INDEX)) {
    for (const file of files) {
      assert.ok(!file.startsWith('src/app/api/'), `${key} points at a server route`)
    }
  }
})

/* ------------------------------------------------------ module stylesheets */

/* SOURCE links a STYLES row by looking its basename up here, so a key that
   is not a basename, or a path that no longer exists, is a row that quietly
   stops resolving. The failure is as silent as the string index's. */
test('every module stylesheet maps to files that exist and match the name', () => {
  const entries = Object.entries(MODULE_PATHS)
  assert.ok(entries.length > 0, 'no module stylesheets were indexed')
  for (const [name, files] of entries) {
    assert.ok(name.endsWith('.module.css'), `not a stylesheet name: ${name}`)
    assert.ok(!name.includes('/'), `a key is a basename, not a path: ${name}`)
    assert.ok(Array.isArray(files) && files.length > 0, `no file for ${name}`)
    assert.equal(new Set(files).size, files.length, `duplicate file for ${name}`)
    for (const file of files) {
      assert.ok(file.startsWith('src/'), `not a source path: ${file}`)
      assert.ok(file.endsWith(`/${name}`), `${file} is not named ${name}`)
      assert.ok(existsSync(resolve(here, '..', file)), `missing file: ${file}`)
    }
  }
})
