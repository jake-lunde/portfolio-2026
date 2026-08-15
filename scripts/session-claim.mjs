/* Claim the next session number in the jaique vault — atomically.
   CLAUDE.md §4.4(a): every session writes `Calendar/Notes/YYYY-MM-DD sNN.md`.
   Concurrent sessions used to race on NN by listing the folder and adding
   one (s55 was lost that way). This script creates the note with O_EXCL
   so two sessions can never claim the same number, and stubs the
   frontmatter so the end-of-session job is appending narrative, not
   authoring a file.

   Usage (run at session START, from the repo):
     node scripts/session-claim.mjs
     node scripts/session-claim.mjs --effort "🖼️ Icon Design Update (E)" --title "the icons learn to move"
     node scripts/session-claim.mjs --dry            # show what would be claimed, write nothing

   Prints the claimed id, the note path, and the ledger line to paste
   into the effort's `## Sessions` at end of session. Never commits the
   vault (that stays an end-of-session act, CLAUDE.md §4.4).

   Vault path: $JAIQUE_VAULT or ~/jaique. */

import { openSync, writeSync, closeSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : (args[i + 1] ?? '')
}
const has = (name) => args.includes(`--${name}`)

if (has('help') || has('h')) {
  console.log('usage: session-claim.mjs [--effort "<Effort page name>"] [--title "<one line>"] [--dry]')
  process.exit(0)
}

const vault = process.env.JAIQUE_VAULT ?? join(homedir(), 'jaique')
const notesDir = join(vault, 'Calendar', 'Notes')
if (!existsSync(notesDir)) {
  console.error(`session-claim: vault Notes folder not found at ${notesDir} (set JAIQUE_VAULT?)`)
  process.exit(1)
}

// Local date, YYYY-MM-DD — sessions are stamped in Jake's timezone, not UTC.
const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`

// The counter is global across days (s65 on 08-14, s66 on 08-15), so take
// the max over every note, not just today's.
const highest = () =>
  readdirSync(notesDir)
    .map((f) => /^\d{4}-\d{2}-\d{2} s(\d+)\.md$/.exec(f))
    .filter(Boolean)
    .reduce((m, mm) => Math.max(m, Number(mm[1])), 0)

const branch = (() => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return ''
  }
})()

const effort = flag('effort')?.replace(/^\[\[|\]\]$/g, '').trim() || ''
const title = flag('title')?.trim() || ''

const stub = (id) => {
  const effortFm = effort ? `effort:\n  - "[[${effort}]]"\n` : 'effort:\n'
  const effortLine = effort ? `Effort: [[${effort}]]\n\n` : ''
  return (
    `---\n${effortFm}---\n` +
    `# ${date} ${id}${title ? ` — ${title}` : ''}\n\n` +
    effortLine +
    `_Session in progress — claimed ${date} ${clock}` +
    (branch ? `, branch \`${branch}\`` : '') +
    `. If this line is still here, the session ended without writing itself down._\n\n` +
    `## What landed\n\n`
  )
}

if (has('dry')) {
  const id = `s${pad(highest() + 1)}`
  console.log(`would claim ${id} → ${join(notesDir, `${date} ${id}.md`)}`)
  process.exit(0)
}

// O_EXCL ('wx') fails if the file exists — the atomic claim. On EEXIST a
// concurrent session got there first; take the next number and try again.
let n = highest() + 1
for (let tries = 0; tries < 50; tries++, n++) {
  const id = `s${pad(n)}`
  const path = join(notesDir, `${date} ${id}.md`)
  let fd
  try {
    fd = openSync(path, 'wx')
  } catch (e) {
    if (e.code === 'EEXIST') continue
    throw e
  }
  writeSync(fd, stub(id))
  closeSync(fd)
  console.log(`claimed ${id}`)
  console.log(`note    ${path}`)
  console.log(`ledger  - [[${date} ${id}|${id} — ${title || '<what happened>'}]]`)
  if (!effort) console.log(`effort  (none given — set \`effort:\` in the note before session end)`)
  process.exit(0)
}
console.error('session-claim: could not claim a number after 50 tries')
process.exit(1)
