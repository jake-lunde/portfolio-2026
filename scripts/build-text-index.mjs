/* TEXT INDEX build.
 *
 * The gap it closes, in Jake's words: "there are still lines I can't find
 * sources for. The first paragraph in README, I see the path but no copy
 * and no file. I need that for ALL text."
 *
 * He is right, and the reason is structural. INSPECT can name a stylesheet
 * (the bundler writes the module name into the class), a program (the
 * window carries a registry id) and a copy key (the node carries it as a
 * data attribute). A sentence written straight into a component carries
 * nothing at all: it is text nodes in a compiled bundle, and no amount of
 * DOM reading gets back to About.tsx.
 *
 * So the pointer is built the other way round, at build time. Walk the
 * source, key every string a component or an MDX file renders, and ship
 * the table. In the browser the tool normalizes the picked node's own text
 * the same way and looks it up. The match is by CONTENT, which is the
 * honest limit of it: the same sentence in two files lists both files, and
 * the SOURCE note says so.
 *
 * What gets indexed:
 * · every JsxText child of every element in src/**\/*.tsx, and one
 *   concatenated run per parent, so a paragraph with a link in the middle
 *   is findable by its whole first sentence as well as by each fragment;
 * · every paragraph of content/**\/*.mdx, which is where the case prose
 *   lives.
 *
 * What does not: src/design-system/*.mdx, which is Storybook documentation
 * and never renders on the desktop, so a pointer to it could only ever be
 * a wrong answer. Stories and tests are skipped for the same reason.
 *
 * Output -> src/lib/textIndex.generated.ts (committed; do not hand-edit).
 * Run: npm run text:index (wired into predev and prebuild).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = path.resolve(process.cwd())
const OUT_FILE = path.join(ROOT, 'src/lib/textIndex.generated.ts')

/* The normalizer is TS and this script is ESM, so it is transpiled in
   memory and imported: one definition, no twin to keep in step. */
const normalizeSrc = readFileSync(path.join(ROOT, 'src/lib/textNormalize.ts'), 'utf8')
const normalizeJs = ts.transpileModule(normalizeSrc, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { textKey } = await import(
  'data:text/javascript;base64,' + Buffer.from(normalizeJs).toString('base64')
)

/* ------------------------------------------------------------- entities */

/* JSX source writes entities and the DOM hands back glyphs, so the index
   has to decode before it normalizes. Only the ones this codebase actually
   writes, plus the numeric forms, which cost nothing to support. */
const NAMED = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  middot: '·',
  times: '×',
  deg: '°',
  eacute: 'é',
}

function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, (whole, body) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    }
    const hit = NAMED[body.toLowerCase()]
    return hit === undefined ? whole : hit
  })
}

/* ------------------------------------------------------------ the walk */

const SKIP_FILE = /\.stories\.tsx?$|\.test\.|\.generated\.|\.d\.ts$/
const SKIP_DIR = new Set(['node_modules', '.next', '.git'])

function filesUnder(dir, ext) {
  const out = []
  const walk = (at) => {
    for (const name of readdirSync(at)) {
      if (SKIP_DIR.has(name)) continue
      const full = path.join(at, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (full.endsWith(ext) && !SKIP_FILE.test(name)) out.push(full)
    }
  }
  walk(dir)
  return out
}

const index = new Map()

function record(raw, rel) {
  const key = textKey(decodeEntities(raw))
  if (!key) return
  const seen = index.get(key)
  if (!seen) index.set(key, [rel])
  else if (!seen.includes(rel)) seen.push(rel)
}

/** Direct JSX children that are literal text: the text nodes themselves,
    plus expression containers holding nothing but a string, which is how
    this codebase writes a deliberate space between two elements. */
function literalChildren(node) {
  const parts = []
  for (const child of node.children ?? []) {
    if (ts.isJsxText(child)) {
      parts.push({ own: true, text: child.getText() })
    } else if (
      ts.isJsxExpression(child) &&
      child.expression &&
      (ts.isStringLiteral(child.expression) ||
        ts.isNoSubstitutionTemplateLiteral(child.expression))
    ) {
      parts.push({ own: false, text: child.expression.text })
    }
  }
  return parts
}

/* Plenty of what the desktop renders never appears as JSX text: a gate's
   header, a card deck, a resume line all live as strings in a data module
   and arrive on screen through an expression. Jake asked for ALL text, so
   those count.

   Unlike JSX text and MDX prose, a string literal is a GUESS: most of them
   are machinery. So this side takes a filter, and the filter is that the
   string has to read like a sentence. Two words of three letters or more,
   and letters and spaces making up most of it. That keeps a gate's header
   and a crew line, and it throws out the thousand SVG path strings, canvas
   font shorthands, routes and mime types that would otherwise triple the
   table with keys nothing on screen can ever match. Import and export
   specifiers never get here at all: a module path is not words. */
function looksLikeProse(text) {
  if (!text.includes(' ')) return false
  const words = text.match(/(?<![\p{L}-])\p{L}{3,}(?![\p{L}-])/gu)
  if (!words || words.length < 2) return false
  const wordy = text.match(/[\p{L}\s]/gu)
  return !!wordy && wordy.length / text.length >= 0.6
}

function indexStrings(node, rel) {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    if (looksLikeProse(node.text)) record(node.text, rel)
    return
  }
  ts.forEachChild(node, (child) => indexStrings(child, rel))
}

function indexTs(file, rel) {
  const source = ts.createSourceFile(
    rel,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  const visit = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const parts = literalChildren(node)
      // each fragment on its own: a pick can land on the span holding one
      for (const part of parts) if (part.own) record(part.text, rel)
      /* and the whole run joined, so a paragraph broken up by an inline
         link still answers to its own first sentence. Joined on a space
         because the normalizer collapses runs of them anyway. */
      if (parts.length > 1) record(parts.map((p) => p.text).join(' '), rel)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  indexStrings(source, rel)
}

/* --------------------------------------------------------------- MDX */

/* Not a parser, and it does not need to be: the index only wants the words
   a reader would search for, so the syntax around them is cut away and
   anything left too short falls under the minimum by itself.

   Tags are cut by a scan rather than by a pattern, because the case files
   put whole elements inside attribute expressions and a lazy match ends
   at the first angle bracket it finds in one of those, leaving half a prop
   behind as a key nothing can ever hit. */
function stripTags(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    if (text[i] !== '<') {
      out += text[i++]
      continue
    }
    let j = i + 1
    let depth = 0
    let quote = ''
    while (j < text.length) {
      const c = text[j]
      if (quote) {
        if (c === quote) quote = ''
      } else if (c === '"' || c === "'") quote = c
      else if (c === '{') depth++
      else if (c === '}') depth = Math.max(0, depth - 1)
      else if (c === '>' && depth === 0) break
      j++
    }
    out += ' '
    i = j + 1
  }
  return out
}

function cleanMarkdown(text) {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links and images keep their label
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}>\s?/gm, '') // quotes
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '') // list markers
    .replace(/[*_`~]/g, '')
}

/* Attributes that hold machinery rather than words. Everything else a case
   file passes as a string is prose the reader sees: a hero's title, a
   stat's label, a plate's caption. */
const NOT_PROSE = new Set([
  'classname', 'class', 'href', 'src', 'img', 'id', 'style', 'target', 'rel', 'no',
])

function indexMdx(file, rel) {
  let text = readFileSync(file, 'utf8')
  text = text.replace(/^---\n[\s\S]*?\n---\n/, '') // frontmatter
  text = text.replace(/^```[\s\S]*?^```/gm, '') // fenced code
  text = text.replace(/^\s*(import|export)\s[\s\S]*?(?=\n\s*\n)/gm, '') // MDX module scope

  /* Prose passed as a prop, both shapes it takes here: a plain string, and
     a fragment holding marked-up text. Neither survives the tag scan, and
     both are lines a visitor can pick on the canvas. */
  for (const [, name, value] of text.matchAll(/([A-Za-z][\w-]*)\s*=\s*"([^"]*)"/g)) {
    if (!NOT_PROSE.has(name.toLowerCase())) record(value, rel)
  }
  for (const [, inner] of text.matchAll(/<>([\s\S]*?)<\/>/g)) {
    record(cleanMarkdown(stripTags(inner)), rel)
  }

  for (const block of stripTags(text).split(/\n\s*\n/)) record(cleanMarkdown(block), rel)
}

/* ------------------------------------------------------------- emit */

const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/')

for (const file of filesUnder(path.join(ROOT, 'src'), '.tsx')) indexTs(file, rel(file))
for (const file of filesUnder(path.join(ROOT, 'src'), '.ts')) indexTs(file, rel(file))
for (const file of filesUnder(path.join(ROOT, 'content'), '.mdx')) indexMdx(file, rel(file))

const keys = Array.from(index.keys()).sort()
const body = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(index.get(k))},`).join('\n')

/* The globs are spelled out rather than written as patterns: a pattern
   holding a star next to a slash closes the block comment it is sitting
   in, and the generated file stops being TypeScript. */
const out = `/* GENERATED by scripts/build-text-index.mjs from every .tsx under
   src and every .mdx under content — DO NOT EDIT. Run npm run text:index.

   Every string the site renders from code, keyed by the head of its
   normalized text (src/lib/textNormalize.ts), pointing at the file or
   files that write it. INSPECT's SOURCE block keys the picked node's own
   text the same way and prints whatever comes back: the answer to "where
   do these words live" for prose that has no copy key to give it away.

   Content-matched, so a line that appears in two files lists both. The
   panel says as much rather than picking one and sounding sure. */

export { TEXT_KEY_LEN } from './textNormalize'

export const TEXT_INDEX: Record<string, string[]> = {
${body}
}
`

writeFileSync(OUT_FILE, out)

const files = new Set()
for (const paths of index.values()) for (const p of paths) files.add(p)
console.log(
  `text index: ${keys.length} strings from ${files.size} files, ` +
    `${(Buffer.byteLength(out) / 1024).toFixed(1)}KB -> ${rel(OUT_FILE)}`,
)
