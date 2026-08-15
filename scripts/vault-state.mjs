/* Print the LUNDE OS Map's Current state box for the terminal.
   The box in Obsidian is three Dataview queries over vault frontmatter;
   sessions can't run Dataview, so this reads the same fields and prints
   the same three views. Run at session start (CLAUDE.md preamble):

     node scripts/vault-state.mjs            # latest 8 sessions, open asks, tasks in play
     node scripts/vault-state.mjs --sessions 20
     node scripts/vault-state.mjs --json     # raw, for other scripts

   Sources (keep in sync with the queries in Atlas/Maps/LUNDE OS Map.md):
     Calendar/Notes/YYYY-MM-DD sNN.md  → session, date, summary, open[], effort[]
     Efforts/Notes/<Effort>/<task>.md  → up[], status

   Vault path: $JAIQUE_VAULT or ~/jaique. No dependencies; the YAML here is
   the narrow dialect the vault actually uses (scalars, quoted strings,
   `- item` lists), parsed by hand on purpose. */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const args = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? dflt : args[i + 1]
}
const vault = process.env.JAIQUE_VAULT ?? join(homedir(), 'jaique')
const LIMIT = Number(flag('sessions', 8))
const IN_PLAY = new Set(['scoped', 'up-next', 'in-progress', 'waiting-on-jake'])

// --- tiny frontmatter reader --------------------------------------------
const unquote = (s) => {
  s = s.trim()
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/\\"/g, '"')
  if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'")
  return s
}
const frontmatter = (text) => {
  if (!text.startsWith('---')) return {}
  const end = text.indexOf('\n---', 3)
  if (end === -1) return {}
  const out = {}
  let key = null
  for (const raw of text.slice(3, end).split('\n')) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) continue
    const item = /^\s+-\s*(.*)$/.exec(line)
    if (item && key) {
      if (!Array.isArray(out[key])) out[key] = []
      out[key].push(unquote(item[1]))
      continue
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line)
    if (!kv) continue
    key = kv[1]
    const v = kv[2].trim()
    if (v === '' ) out[key] = out[key] ?? null
    else if (v === '[]') out[key] = []
    else if (v.startsWith('[') && v.endsWith(']')) out[key] = v.slice(1, -1).split(',').map(unquote).filter(Boolean)
    else out[key] = unquote(v)
  }
  return out
}
const wiki = (s) => (s ?? '').replace(/^\[\[|\]\]$/g, '').replace(/\|.*$/, '')
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : []
  })

// --- sessions -------------------------------------------------------------
const notesDir = join(vault, 'Calendar', 'Notes')
const sessions = readdirSync(notesDir)
  .filter((f) => /^\d{4}-\d{2}-\d{2} s\d+\.md$/.test(f))
  .map((f) => {
    const fm = frontmatter(readFileSync(join(notesDir, f), 'utf8'))
    const m = /^(\d{4}-\d{2}-\d{2}) s(\d+)\.md$/.exec(f)
    return {
      id: `s${m[2]}`,
      session: Number(String(fm.session ?? m[2]).replace(/^s/, '')) || Number(m[2]),
      date: fm.date ?? m[1],
      title: f.replace(/\.md$/, ''),
      summary: fm.summary ?? '',
      open: Array.isArray(fm.open) ? fm.open : [],
      effort: (Array.isArray(fm.effort) ? fm.effort : fm.effort ? [fm.effort] : []).map(wiki),
    }
  })
  .sort((a, b) => b.session - a.session)

// --- tasks ------------------------------------------------------------------
const tasks = walk(join(vault, 'Efforts', 'Notes'))
  .map((p) => {
    const fm = frontmatter(readFileSync(p, 'utf8'))
    return {
      name: p.split('/').pop().replace(/\.md$/, ''),
      status: fm.status ?? '',
      up: (Array.isArray(fm.up) ? fm.up : fm.up ? [fm.up] : []).map(wiki),
    }
  })
  .filter((t) => IN_PLAY.has(t.status))
  .sort((a, b) => a.up.join().localeCompare(b.up.join()) || a.status.localeCompare(b.status))

if (args.includes('--json')) {
  console.log(JSON.stringify({ sessions: sessions.slice(0, LIMIT), tasks }, null, 2))
  process.exit(0)
}

// --- render -------------------------------------------------------------------
const latest = sessions.slice(0, LIMIT)
console.log('# Current state (from vault frontmatter) — prod = origin/main HEAD\n')
console.log(`## Latest sessions (${latest.length} of ${sessions.length})`)
for (const s of latest) {
  const eff = s.effort.length ? `  [${s.effort.join(', ')}]` : ''
  console.log(`- ${s.title}${eff}`)
  console.log(`    ${s.summary || '(no summary yet)'}`)
}
const asks = latest.flatMap((s) => s.open.map((o) => ({ id: s.id, o })))
console.log(`\n## Waiting on Jake (${asks.length})`)
for (const a of asks) console.log(`- ${a.id}: ${a.o}`)
if (!asks.length) console.log('- (nothing open in the latest sessions)')
console.log(`\n## Tasks in play (${tasks.length})`)
let lastUp = null
for (const t of tasks) {
  const up = t.up.join(', ') || '(no effort)'
  if (up !== lastUp) console.log(`- ${up}`), (lastUp = up)
  console.log(`    - ${t.name} · ${t.status}`)
}
