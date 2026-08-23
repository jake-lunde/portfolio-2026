#!/usr/bin/env node
/* FIGMA MAP — the Code Connect table, kept in the repo (figma.map.json).
 *
 * Code Connect is two halves: a WRITE (Figma component key → import path +
 * props↔properties) and a READ (Figma substituting the snippet in MCP reads).
 * The read is plan-gated; we own the write and do the read ourselves. Rows
 * are keyed on the component KEY — the same stable identity Code Connect
 * keys on. Frames are containers; components are the truth.
 *
 *   node scripts/figma-map.mjs write --node 201067:4 \
 *        --import src/components/primitives/Button --props Size=size,label=children
 *      Reads the set from Figma (key, name, property names), writes or
 *      replaces its row, prints the description pointer + a use_figma
 *      snippet that sets it. Two writes, one source. Props not listed
 *      map by identity when the Figma property name equals a prop name.
 *
 *   node scripts/figma-map.mjs resolve <key|nodeId|name> [--props '{"Size":"md"}']
 *      The read half, for the ingest skill: import line + JSX. Note that
 *      get_design_context surfaces a placed instance's SET NODE ID (in its
 *      "Component descriptions" block) and not its key, so rows carry both.
 *      An unmapped component exits 2 — loud, never a silent frame.
 *
 *   node scripts/figma-map.mjs check
 *      Liveness: every row's node still exists, still carries the row's
 *      key and name, every mapped Figma property still exists on the set,
 *      every importPath resolves to a file; and every component set on
 *      the design-system page has a row (else: owed to mirror coverage).
 *
 * Reads Figma via REST (FIGMA_PAT from env or .env.local). REST cannot
 * write descriptions — that is the use_figma snippet `write` prints.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..')
const MAP = path.join(ROOT, 'figma.map.json')
const REPO = 'jake-lunde/portfolio-2026'

const [cmd, ...rest] = process.argv.slice(2)
const flags = {}
const positional = []
for (let i = 0; i < rest.length; i++) {
  const a = rest[i]
  if (a.startsWith('--')) flags[a.slice(2)] = rest[i + 1]?.startsWith('--') ? true : rest[++i]
  else positional.push(a)
}

async function loadMap() {
  try {
    return JSON.parse(await fs.readFile(MAP, 'utf8'))
  } catch {
    return { file: flags.file ?? 'LQbDBqtpVxCb7QcDgEFQlN', components: [] }
  }
}

async function pat() {
  if (process.env.FIGMA_PAT) return process.env.FIGMA_PAT
  try {
    const env = await fs.readFile(path.join(ROOT, '.env.local'), 'utf8')
    const m = env.match(/^FIGMA_PAT=(.+)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  } catch {}
  throw new Error('FIGMA_PAT missing (env or .env.local)')
}

async function figma(p) {
  const res = await fetch(`https://api.figma.com/v1${p}`, { headers: { 'X-Figma-Token': await pat() } })
  if (!res.ok) throw new Error(`Figma ${res.status} on ${p}`)
  return res.json()
}

/** Component-set facts REST exposes: key, name, property names (suffix stripped). */
async function readSet(file, nodeId) {
  const j = await figma(`/files/${file}/nodes?ids=${encodeURIComponent(nodeId)}&depth=1`)
  const n = j.nodes[nodeId]
  if (!n) throw new Error(`node ${nodeId} not in file ${file}`)
  const doc = n.document
  if (doc.type !== 'COMPONENT_SET' && doc.type !== 'COMPONENT')
    throw new Error(`${nodeId} is a ${doc.type}, not a component (frames are containers, not truth)`)
  const meta = (n.componentSets ?? {})[nodeId] ?? (n.components ?? {})[nodeId] ?? {}
  const properties = Object.keys(doc.componentPropertyDefinitions ?? {}).map((k) => k.split('#')[0])
  return { key: meta.key, name: doc.name, description: meta.description ?? '', properties }
}

/** The one-line pointer the component description carries — derived from the row. */
export function pointer(row) {
  return `→ ${REPO} ${row.importPath} · props: figma.map.json`
}

const POINTER_RE = /^→ jake-lunde\/portfolio-2026 \S+ · props: figma\.map\.json\n*/

async function write() {
  const map = await loadMap()
  const nodeId = flags.node
  const importPath = flags.import
  if (!nodeId || !importPath) throw new Error('write needs --node <id> --import <path>')
  const set = await readSet(map.file, nodeId)
  const given = Object.fromEntries(
    String(flags.props ?? '')
      .split(',')
      .filter(Boolean)
      .map((pair) => pair.split('=').map((s) => s.trim()))
  )
  const props = {}
  for (const p of set.properties) props[p] = given[p] ?? p
  for (const p of Object.keys(given)) if (!(p in props)) throw new Error(`--props names "${p}", which the set has no property for (has: ${set.properties.join(', ')})`)
  const row = { key: set.key, nodeId, name: set.name, importPath, props }
  const i = map.components.findIndex((r) => r.key === row.key || r.nodeId === nodeId)
  if (i >= 0) map.components[i] = row
  else map.components.push(row)
  map.components.sort((a, b) => a.name.localeCompare(b.name))
  await fs.writeFile(MAP, JSON.stringify(map, null, 2) + '\n')
  const line = pointer(row)
  // The description IS the pointer (Jake, s116): prose there drifts the
  // moment the component changes, and every fact it held has a home
  // elsewhere (the skill, the CSS, the derived-annotations task).
  if (set.description.replace(POINTER_RE, '').trim())
    console.log(`note: the set's description carries prose beyond the pointer — the snippet replaces it`)
  const next = line
  console.log(`${i >= 0 ? 'rewrote' : 'added'} row ${row.name} (${row.key})`)
  console.log(`description pointer:\n  ${line}`)
  console.log(`\nset it with use_figma (REST cannot write descriptions):\n`)
  console.log(`const n = await figma.getNodeByIdAsync(${JSON.stringify(nodeId)});\nn.description = ${JSON.stringify(next)};`)
}

async function resolve() {
  const map = await loadMap()
  const q = positional[0]
  if (!q) throw new Error('resolve needs a key, nodeId or name')
  const row = map.components.find((r) => r.key === q || r.nodeId === q || r.name === q)
  if (!row) {
    console.error(`UNMAPPED: ${q} has no row in figma.map.json — owed to mirror coverage, not a frame to rebuild`)
    process.exit(2)
  }
  const overrides = flags.props ? JSON.parse(flags.props) : {}
  const attrs = Object.entries(overrides)
    .map(([figmaProp, v]) => {
      const name = figmaProp.split('#')[0]
      const prop = row.props[name]
      if (!prop) throw new Error(`instance sets "${name}", which the row does not map`)
      return [prop, v]
    })
  const children = attrs.find(([p]) => p === 'children')
  const jsxAttrs = attrs.filter(([p]) => p !== 'children').map(([p, v]) => ` ${p}=${typeof v === 'string' ? JSON.stringify(v) : `{${JSON.stringify(v)}}`}`).join('')
  const jsx = children ? `<${row.name}${jsxAttrs}>${children[1]}</${row.name}>` : `<${row.name}${jsxAttrs} />`
  console.log(`import { ${row.name} } from '@/${row.importPath.replace(/^src\//, '')}'`)
  console.log(jsx)
  console.log(`props: ${JSON.stringify(row.props)}`)
}

async function check() {
  const map = await loadMap()
  let errors = 0
  const fail = (m) => { errors++; console.log(`✗ ${m}`) }
  for (const row of map.components) {
    const before = errors
    const exists = await fs.stat(path.join(ROOT, `${row.importPath}.tsx`)).then(() => true, () => false)
    if (!exists) fail(`${row.name}: ${row.importPath}.tsx is not in the repo`)
    let set
    try { set = await readSet(map.file, row.nodeId) } catch (e) { fail(`${row.name}: ${e.message}`); continue }
    if (set.key !== row.key) fail(`${row.name}: key moved ${row.key} → ${set.key} (mirror recreated? re-run write)`)
    if (set.name !== row.name) fail(`${row.name}: Figma now calls it "${set.name}"`)
    for (const p of Object.keys(row.props)) if (!set.properties.includes(p)) fail(`${row.name}: property "${p}" gone from the set`)
    for (const p of set.properties) if (!(p in row.props)) fail(`${row.name}: set grew property "${p}" the row does not map`)
    if (set.description.trim() !== pointer(row)) fail(`${row.name}: description is not exactly the pointer`)
    if (errors === before) console.log(`✓ ${row.name} ${row.key}`)
  }
  // Every component set in the file should have a row, or be listed as owed.
  const j = await figma(`/files/${map.file}?depth=3`) // sets live 3 deep: page → section → set
  const owed = Object.entries(j.componentSets ?? {}).filter(([id]) => !map.components.some((r) => r.nodeId === id))
  const sets = Object.entries(j.componentSets ?? {})
  if (owed.length) {
    console.log(`\nunmapped component sets (owed to mirror coverage, or not LUNDE OS components):`)
    for (const [id, s] of owed) console.log(`  ${s.name} ${id} ${s.key}`)
  }
  console.log(`\n${map.components.length}/${sets.length} sets mapped · ${errors} error${errors === 1 ? '' : 's'}`)
  process.exit(errors ? 1 : 0)
}

const run = { write, resolve, check }[cmd]
if (!run) {
  console.error('usage: figma-map.mjs write|resolve|check — see header')
  process.exit(1)
}
run().catch((e) => { console.error(e.message); process.exit(1) })
