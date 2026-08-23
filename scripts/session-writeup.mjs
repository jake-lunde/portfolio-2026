/* Assemble the end-of-session write-up brief for a subagent.
   CLAUDE.md §4.4: the orchestrator keeps the judgment (a short brief of what
   mattered) and hands the reading + formatting to a Sonnet agent, so the
   big-context session stops paying to author prose. This script gathers
   everything the agent needs and prints one complete prompt to stdout.

   Usage (run from the portfolio repo, at session END):
     node scripts/session-writeup.mjs --session 68 --brief "what landed: … / ruled: … / open: … / PRs: …"
     node scripts/session-writeup.mjs --brief-file /path/to/brief.md        # session = highest note today
   Then: paste the output into an Agent call (model sonnet, run in background),
   review `git -C ~/jaique diff`, commit the vault.

   Auto mode (the safety net, scripts/session-sweep.mjs): a session that
   ended without writing itself down has no brief, so the agent derives one
   from a transcript digest and the note is marked `auto: true`.
     node scripts/session-writeup.mjs --session 79 --auto /path/to/digest.md [--until "YYYY-MM-DD HH:MM"]

   Gathers: the note stub (path, claim time, effort), repo commits since the
   claim, uncommitted vault changes, the effort page(s) and their task notes.
   Vault path: $JAIQUE_VAULT or ~/jaique. */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : (args[i + 1] ?? '')
}
const sh = (cmd, cwd) => {
  try {
    return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

const vault = process.env.JAIQUE_VAULT ?? join(homedir(), 'jaique')
const notesDir = join(vault, 'Calendar', 'Notes')
const repo = process.cwd()

// --- which note ---------------------------------------------------------------
const notes = readdirSync(notesDir)
  .map((f) => /^(\d{4}-\d{2}-\d{2}) s(\d+)\.md$/.exec(f))
  .filter(Boolean)
  .map((m) => ({ file: m[0], date: m[1], n: Number(m[2]) }))
  .sort((a, b) => b.n - a.n)
const want = flag('session') ? Number(String(flag('session')).replace(/^s/, '')) : notes[0]?.n
const note = notes.find((x) => x.n === want)
if (!note) {
  console.error(`session-writeup: no note for s${want} in ${notesDir}`)
  process.exit(1)
}
const notePath = join(notesDir, note.file)
const noteText = readFileSync(notePath, 'utf8')

const digest = flag('auto')
if (digest && !existsSync(digest)) {
  console.error(`session-writeup: --auto digest not found at ${digest}`)
  process.exit(1)
}
const brief = digest
  ? `AUTO WRITE-UP. The orchestrating session ended without writing a brief, so there is no ground truth here: derive the brief yourself from the transcript digest at \`${digest}\` (Read it first, all of it). Extract: what landed (concrete, with PR numbers only where the digest shows them) · what Jake ruled (only if he plainly did, in his own turns) · what waits on Jake · task status changes. Where the digest is ambiguous, say less rather than guess. Never invent a PR, a ruling, or an ask. If the digest shows the session was pure Q&A with nothing landing, say so in one line and leave \`open:\` empty.`
  : flag('brief-file')
    ? readFileSync(flag('brief-file'), 'utf8').trim()
    : (flag('brief') ?? '').trim()
if (!brief) {
  console.error('session-writeup: --brief "…", --brief-file <path> or --auto <digest> is required (the judgment is yours, not the agent\'s)')
  process.exit(1)
}

// --- facts from the stub ------------------------------------------------------
const claimed = /claimed (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/.exec(noteText)
const localStamp = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
const since = claimed ? `${claimed[1]} ${claimed[2]}` : localStamp(new Date(statSync(notePath).birthtimeMs))
const efforts = [...noteText.matchAll(/^\s+-\s*"?\[\[([^\]|]+)/gm)].map((m) => m[1])
const fmEnd = noteText.indexOf('\n---', 3)
const frontmatter = noteText.slice(0, fmEnd + 4)

// --- effort pages + task notes ------------------------------------------------
const effortDirs = ['On', 'Ongoing', 'Simmering', 'Sleeping'].map((d) => join(vault, 'Efforts', d))
const findEffort = (name) => {
  for (const d of effortDirs) if (existsSync(join(d, `${name}.md`))) return join(d, `${name}.md`)
  return null
}
const taskFolder = (name) => name.replace(/^\S+\s+/, '').replace(/\s+\((O?E)\)$/, '')
const effortBlocks = efforts.map((name) => {
  const page = findEffort(name)
  const tdir = join(vault, 'Efforts', 'Notes', taskFolder(name))
  const tasks = existsSync(tdir)
    ? readdirSync(tdir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
          const t = readFileSync(join(tdir, f), 'utf8')
          const st = /^status:\s*(.+)$/m.exec(t)?.[1] ?? '?'
          return `    - ${f.replace(/\.md$/, '')} · ${st}`
        })
    : ['    (no task folder)']
  const heads = page
    ? readFileSync(page, 'utf8')
        .split('\n')
        .filter((l) => l.startsWith('## '))
        .map((l) => l.slice(3))
        .join(' · ')
    : '(page not found)'
  return `- **${name}**\n  page: ${page ?? '(not found under Efforts/*)'}\n  sections: ${heads}\n  tasks (${tdir}):\n${tasks.join('\n')}`
})

// --- repo + vault activity ----------------------------------------------------
// --until bounds the window when the write-up runs long after the session
// (the sweep passes the transcript's last timestamp) so later sessions'
// commits stay out of this note.
const until = flag('until')?.trim()
const commits =
  sh(`git log --all --since="${since}"${until ? ` --until="${until}"` : ''} --date=short --format="%h %ad %s"`, repo) ||
  '(no commits since claim)'
const branch = sh('git rev-parse --abbrev-ref HEAD', repo)
const vaultDirty = sh('git status --short', vault) || '(clean)'

// --- the prompt ---------------------------------------------------------------
console.log(`You are writing up LUNDE OS session s${note.n} in Jake's jaique vault. The orchestrating session already did the work and decided what mattered; your job is the reading and the prose. Do it exactly, then stop.

## Files
- Session note (already stubbed by the claim script): \`${notePath}\`
- Vault root: \`${vault}\`   · Portfolio repo: \`${repo}\` (branch \`${branch}\`)
- Voice law: \`${join(repo, 'VOICE.md')}\` — read it first; every sentence you write follows it. No em dashes anywhere (use a comma, a period, or a colon). Plain, concise, a little dry. Truth over punch.
- Protocol: \`${join(repo, 'CLAUDE.md')}\` §4.4 (read that section only).

## Orchestrator's brief (the judgment; treat as ground truth)
${brief}

## Current note frontmatter (fill it, keep the key order and quoting style)
\`\`\`yaml
${frontmatter}
\`\`\`

## Effort(s) this session belongs to
${effortBlocks.join('\n') || '- (none in frontmatter — set effort: from the brief before anything else)'}

## Repo commits since the claim (${since}${until ? ` → ${until}` : ''})
\`\`\`
${commits}
\`\`\`

## Uncommitted vault changes right now (what this session touched)
\`\`\`
${vaultDirty}
\`\`\`

## Do
1. In the note's frontmatter: set \`summary:\` to ONE line, at most 160 characters, plain text, no links or backticks, lowercase register like the note titles ("the icons lose their matte and learn to move"); set \`open:\` to a YAML list of the things that wait on Jake per the brief (empty list \`[]\` if none). Keep \`effort:\` unless the brief adds efforts (then add them; a session names every effort it touched).
2. Replace the "_Session in progress …_" line with the narrative (if the session sweep already auto-wrote this note, replace everything below the \`Effort:\` line instead and drop \`auto: true\` from the frontmatter; the brief outranks the auto text): one short intro paragraph (what the session was, whether prod changed), then \`## What landed\` (bullets, concrete, with PR links as \`[PR #N](https://github.com/jake-lunde/portfolio-2026/pull/N)\` when the brief names them), \`## Ruled\` only if Jake ruled on something, \`## Open\` (the same items as \`open:\`, one line each). Read \`Calendar/Notes/2026-08-15 s67.md\` and \`s68.md\` in the same folder for the shape and register; match them.
3. Effort page(s): add a \`## Shipped\` line (\`- YYYY-MM-DD — what, PR #N\`) if something shipped; add to \`## Rulings\` if Jake ruled; leave \`## Sessions\` alone (it is a Dataview query, computed). Update \`status:\` on any task note the brief says was done / started / blocked (\`done\` · \`in-progress\` · \`waiting-on-jake\`).
4. Do NOT touch the Map's Current state box tables (computed) or its Standing bullets unless the brief says a debt changed. Do NOT create task notes the brief doesn't name. Do NOT run git.
5. Return: the final \`summary:\` line, the \`open:\` list, and a list of every vault file you changed with one line each on what changed. Nothing else.${
  digest
    ? `

## Auto mode (this write-up was not reviewed by the session that did the work)
- Add \`auto: true\` to the frontmatter, on its own line right after \`open:\`'s list. Keep every other key.
- Right under the \`Effort:\` line (or under the title if there is none), add this line verbatim, then a blank line: \`_Auto-written by the session sweep from the transcript; nobody who did the work reviewed it. If this session resumes, the deliberate write-up overwrites this._\`
- If \`effort:\` is empty, set it from the \`--effort\` the digest shows in the claim command; if there was none, choose the one effort under \`${join(vault, 'Efforts')}/{On,Ongoing,Simmering,Sleeping}\` the work most plainly served, and say so in the intro paragraph.
- Effort pages and task notes: only touch them for facts the digest states outright (a PR merged, a task the session plainly finished). When unsure, leave them.
- Every "waits on Jake" item must trace to something in the digest. Fewer, true items beat a full list.`
    : ''
}`)
