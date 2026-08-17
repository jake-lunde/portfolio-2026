/* The write-up safety net (CLAUDE.md §4.4: "a session that doesn't write
   itself down didn't happen"). session-claim.mjs stubs every session note
   with a sentinel line that the deliberate end-of-session write-up removes.
   When a session dies, gets abandoned, or just forgets, the sentinel stays.
   This sweep finds those notes, pairs each with its Claude Code transcript
   (the claim's tool output is in there), waits for the transcript to go cold,
   digests it into something small, and hands digest + the standard write-up
   prompt (session-writeup.mjs --auto) to headless Claude Code on Sonnet,
   which fills the note and marks it `auto: true`. Then a ledger line and a
   scoped vault commit. Same shape as the inbox filer: cooling window, lock,
   ledger, git as the undo. Fires only on the miss; the deliberate write-up
   stays the norm and overwrites the auto text if the session resumes.

   Two ways in:
     launchd tick        node scripts/session-sweep.mjs            (every stub whose transcript is cold)
     SessionEnd hook     node scripts/session-sweep.mjs --transcript <path>   (that session's note, now)
   Flags: --dry-run (find + digest, no Claude, no writes) · --session NN
   (that note, ignore cooling) · --cool <minutes> · --verbose.
   No deps. Node ≥18. Env: JAIQUE_VAULT, CLAUDE_BIN, CLAUDE_PROJECTS,
   STATE_DIR, COOL_MS, MAX_PER_RUN, CLAUDE_TIMEOUT_MS. */

import {
  readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync,
  appendFileSync, openSync, closeSync, unlinkSync, copyFileSync,
} from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { homedir } from 'node:os'
import { execSync, execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const flag = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? undefined : (args[i + 1] ?? '') }
const has = (n) => args.includes(`--${n}`)
if (has('help') || has('h')) {
  console.log('usage: session-sweep.mjs [--transcript <path>] [--session NN] [--dry-run] [--cool <minutes>] [--verbose]')
  process.exit(0)
}

const REPO = dirname(dirname(fileURLToPath(import.meta.url)))
const VAULT = process.env.JAIQUE_VAULT ?? join(homedir(), 'jaique')
const NOTES = join(VAULT, 'Calendar', 'Notes')
const PROJECTS = process.env.CLAUDE_PROJECTS ?? join(homedir(), '.claude', 'projects')
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? '/opt/homebrew/bin/claude'
const STATE = process.env.STATE_DIR ?? join(homedir(), '.local', 'state', 'lunde-session-sweep')
const LEDGER = join(VAULT, 'Efforts', 'Notes', 'Organization daily pass', 'session sweep log.md')
const COOL_MS = flag('cool') ? Number(flag('cool')) * 60_000 : Number(process.env.COOL_MS ?? 2 * 60 * 60_000)
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN ?? 3)
const CLAUDE_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS ?? 15 * 60_000)
const DIGEST_MAX = 90_000 // chars handed to the agent; head + tail if longer
const SENTINEL = '_Session in progress — claimed'
const DRY = has('dry-run')
const VERBOSE = has('verbose')

mkdirSync(join(STATE, 'digests'), { recursive: true })
const log = (s) => { const line = `${new Date().toISOString()} ${s}`; console.log(line); appendFileSync(join(STATE, 'runs.log'), line + '\n') }
const vlog = (s) => { if (VERBOSE) log(s) }
const sh = (cmd, cwd = REPO) => { try { return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' } }
const pad = (n) => String(n).padStart(2, '0')
const stamp = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`

// --- lock (stale after 30 min: a killed run must not wedge the sweep) ------
const LOCK = join(STATE, 'run.lock')
if (existsSync(LOCK) && Date.now() - statSync(LOCK).mtimeMs < 30 * 60_000) { log('locked, another sweep is running'); process.exit(0) }
closeSync(openSync(LOCK, 'w'))
process.on('exit', () => { try { unlinkSync(LOCK) } catch {} })

// --- candidates: notes still carrying the sentinel ----------------------------
const stubs = readdirSync(NOTES)
  .map((f) => /^(\d{4}-\d{2}-\d{2}) s(\d+)\.md$/.exec(f))
  .filter(Boolean)
  .map((m) => ({ file: m[0], path: join(NOTES, m[0]), date: m[1], n: Number(m[2]) }))
  .filter((s) => readFileSync(s.path, 'utf8').includes(SENTINEL))
  .sort((a, b) => a.n - b.n)

// --- transcript lookup: the claim's tool output ("claimed sNN\nnote    …") is
// in exactly one transcript. grep shortlists (the literal \n keeps a session
// that merely *typed* "claimed s79" from matching); a parse confirms it sits in
// a tool_result. If several qualify, the newest wins.
const jsonlFiles = () => {
  const out = []
  for (const d of readdirSync(PROJECTS, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const dir = join(PROJECTS, d.name)
    for (const f of readdirSync(dir)) if (f.endsWith('.jsonl')) out.push(join(dir, f))
  }
  return out
}
const claimInTranscript = (path, n) => {
  const needle = new RegExp(`^claimed s0*${n}\\nnote\\s`, 'm')
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.includes(`claimed s`)) continue
    let o; try { o = JSON.parse(line) } catch { continue }
    const c = o.message?.content
    if (!Array.isArray(c)) continue
    for (const b of c) {
      if (b.type !== 'tool_result') continue
      const text = typeof b.content === 'string' ? b.content : (b.content ?? []).map((x) => x.text ?? '').join('\n')
      if (needle.test(text)) return true
    }
  }
  return false
}
const findTranscript = (n) => {
  let short = []
  try {
    // -F: fixed string; the \n is literal in the JSONL, so this is exact and cheap.
    short = execFileSync('grep', ['-rlF', '--include=*.jsonl', `claimed s${n}\\nnote`, PROJECTS], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim().split('\n').filter(Boolean)
  } catch { short = [] }
  const hits = short.filter((p) => claimInTranscript(p, n))
  if (!hits.length) return null
  return hits.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
}

// --- digest: the transcript, small. User and assistant text, tool calls by
// name (Bash: first line; Edit/Write: the path), pr-link records, custom title.
// Tool results are dropped except the claim's. System reminders stripped.
const stripReminders = (s) => s.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g, '').trim()
const digestTranscript = (path) => {
  const lines = readFileSync(path, 'utf8').split('\n')
  const turns = []
  const prs = new Set(), edited = new Set(), branches = new Set()
  let title = '', first = '', last = '', sessionId = '', cwd = '', claim = ''
  for (const line of lines) {
    if (!line) continue
    let o; try { o = JSON.parse(line) } catch { continue }
    if (o.type === 'pr-link') { prs.add(`#${o.prNumber} ${o.prUrl}`); continue }
    if (o.type === 'custom-title') { title = o.customTitle ?? title; continue }
    if (o.type !== 'user' && o.type !== 'assistant') continue
    if (o.isMeta || o.isSidechain) continue
    if (o.timestamp) { first ||= o.timestamp; last = o.timestamp }
    sessionId ||= o.sessionId ?? ''
    cwd ||= o.cwd ?? ''
    if (o.gitBranch) branches.add(o.gitBranch)
    const t = o.timestamp ? new Date(o.timestamp) : null
    const hm = t ? `${pad(t.getHours())}:${pad(t.getMinutes())}` : '--:--'
    const c = o.message?.content
    if (o.type === 'user') {
      if (typeof c === 'string') { const s = stripReminders(c); if (s) turns.push(`[${hm}] JAKE: ${s}`) }
      else if (Array.isArray(c)) for (const b of c) {
        if (b.type === 'text') { const s = stripReminders(b.text ?? ''); if (s) turns.push(`[${hm}] JAKE: ${s}`) }
        if (b.type === 'tool_result') {
          const text = typeof b.content === 'string' ? b.content : (b.content ?? []).map((x) => x.text ?? '').join('\n')
          const m = /^claimed s(\d+)\nnote\s+(.+)$/m.exec(text)
          if (m) claim = `claimed s${m[1]} → ${m[2]}`
          for (const u of text.matchAll(/https:\/\/github\.com\/jake-lunde\/portfolio-2026\/pull\/(\d+)/g)) prs.add(`#${u[1]} ${u[0]}`)
        }
      }
    } else if (Array.isArray(c)) {
      for (const b of c) {
        if (b.type === 'text' && b.text?.trim()) turns.push(`[${hm}] CLAUDE: ${b.text.trim()}`)
        if (b.type === 'tool_use') {
          const i = b.input ?? {}
          if (b.name === 'Bash') {
            const cmd = String(i.command ?? '').split('\n')[0].slice(0, 200)
            turns.push(`[${hm}] TOOL Bash: ${cmd}`)
            if (/session-claim\.mjs/.test(i.command ?? '')) turns.push(`[${hm}] TOOL Bash (claim, full): ${String(i.command).slice(0, 400)}`)
          } else if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(b.name)) {
            const p = String(i.file_path ?? i.notebook_path ?? '')
            edited.add(p); turns.push(`[${hm}] TOOL ${b.name}: ${p}`)
          } else if (b.name === 'Agent') turns.push(`[${hm}] TOOL Agent: ${i.description ?? ''}`)
          else if (b.name === 'Skill') turns.push(`[${hm}] TOOL Skill: ${i.skill ?? ''}`)
          else turns.push(`[${hm}] TOOL ${b.name}`)
        }
      }
    }
  }
  let body = turns.join('\n\n')
  if (body.length > DIGEST_MAX) {
    const head = body.slice(0, Math.floor(DIGEST_MAX * 0.25))
    const tail = body.slice(-Math.floor(DIGEST_MAX * 0.75))
    body = `${head}\n\n[… ${body.length - head.length - tail.length} chars of the middle elided; head and tail kept …]\n\n${tail}`
  }
  const facts = [
    `session id: ${sessionId}`, `transcript: ${path}`, `cwd: ${cwd}`, `branches seen: ${[...branches].join(', ') || '(none)'}`,
    `first turn: ${first}`, `last turn: ${last}`, `custom title: ${title || '(none)'}`, `claim: ${claim || '(no claim output found)'}`,
    `PRs seen: ${[...prs].join(' · ') || '(none)'}`,
    `files edited (${edited.size}): ${[...edited].slice(0, 60).join(', ')}${edited.size > 60 ? ' …' : ''}`,
  ]
  return { text: `# Transcript digest\n\n## Facts (extracted by script, trust these)\n${facts.map((f) => `- ${f}`).join('\n')}\n\n## Turns\n\n${body}\n`, last, turns: turns.length }
}

// --- claude -p ---------------------------------------------------------------
const callClaude = (prompt) => new Promise((resolve) => {
  const a = ['-p', '--model', 'sonnet', '--output-format', 'json', '--max-turns', '40', '--add-dir', VAULT, '--allowedTools', 'Read,Glob,Grep,Write,Edit']
  const child = spawn(CLAUDE_BIN, a, { cwd: REPO, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, CLAUDECODE: undefined } })
  let out = '', err = '', killed = false
  const timer = setTimeout(() => { killed = true; child.kill('SIGKILL') }, CLAUDE_TIMEOUT_MS)
  child.stdout.on('data', (d) => (out += d)); child.stderr.on('data', (d) => (err += d))
  child.on('error', (e) => { clearTimeout(timer); resolve({ ok: false, why: `spawn: ${e.message}` }) })
  child.on('close', (code) => {
    clearTimeout(timer)
    if (killed) return resolve({ ok: false, why: `timeout ${CLAUDE_TIMEOUT_MS}ms` })
    let env = null; try { env = JSON.parse(out) } catch {}
    resolve({ ok: code === 0 && env && !env.is_error, why: code !== 0 ? `exit ${code}: ${err.slice(-400)}` : env?.is_error ? `is_error: ${String(env.result).slice(0, 400)}` : '', result: env?.result, cost: env?.total_cost_usd })
  })
  child.stdin.end(prompt)
})

// -z: NUL-separated, unquoted — the vault's paths carry spaces and emoji.
const dirtyPaths = () => {
  try {
    return execFileSync('git', ['status', '--porcelain', '-z'], { cwd: VAULT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().split('\0').filter(Boolean).map((e) => e.slice(3))
  } catch { return [] }
}

// --- one note ------------------------------------------------------------------
const sweep = async (stub, transcript, why) => {
  const { text, last, turns } = digestTranscript(transcript)
  const digestPath = join(STATE, 'digests', `s${stub.n}.md`)
  writeFileSync(digestPath, text)
  const until = last ? stamp(new Date(last)) : ''
  log(`s${stub.n} ${why} · transcript ${basename(transcript)} · ${turns} turns → digest ${text.length} chars${DRY ? ' · DRY RUN, stopping here' : ''}`)
  if (DRY) return

  const prompt = sh(`node scripts/session-writeup.mjs --session ${stub.n} --auto "${digestPath}"${until ? ` --until "${until}"` : ''}`)
  if (!prompt) { log(`s${stub.n} FAIL: session-writeup.mjs printed nothing`); return }

  // Snapshot so a half-finished agent run can be rolled back file-by-file.
  const before = new Set(dirtyPaths())
  const snap = join(STATE, `s${stub.n}.before.md`)
  copyFileSync(stub.path, snap)

  const r = await callClaude(prompt)
  const noteNow = readFileSync(stub.path, 'utf8')
  const done = r.ok && !noteNow.includes(SENTINEL) && /^summary:\s*"?.+"?\s*$/m.test(noteNow) && !/^summary:\s*""\s*$/m.test(noteNow)
  if (!done) {
    copyFileSync(snap, stub.path)
    log(`s${stub.n} FAIL: ${r.why || 'note not filled'} · note restored from snapshot`)
    return
  }
  // Commit only what this run changed, under the paths it is allowed to touch.
  const mine = dirtyPaths().filter((p) => (p.startsWith('Calendar/Notes/') || p.startsWith('Efforts/')) && (!before.has(p) || p === `Calendar/Notes/${stub.file}`))
  const summary = /^summary:\s*"?(.+?)"?\s*$/m.exec(noteNow)?.[1] ?? ''
  const ledgerLine = `- ${stamp(new Date())} — s${stub.n} auto-written (${why}; ${turns} turns; ${r.cost != null ? `$${r.cost.toFixed(2)}` : 'cost n/a'}): ${summary}\n`
  if (!existsSync(LEDGER)) writeFileSync(LEDGER, `---\nup:\n  - "[[📦 Organization daily pass]]"\n---\n# session sweep log\n\nOne line per note the sweep auto-wrote (scripts/session-sweep.mjs in the portfolio repo). Runs are not sessions.\n\n`)
  appendFileSync(LEDGER, ledgerLine)
  mine.push(LEDGER.slice(VAULT.length + 1))
  try {
    execFileSync('git', ['add', '--', ...new Set(mine)], { cwd: VAULT, stdio: 'ignore' })
    execFileSync('git', ['commit', '-q', '-m', `s${stub.n} auto write-up (session sweep)`], { cwd: VAULT, stdio: 'ignore' })
    log(`s${stub.n} OK · committed ${new Set(mine).size} files · ${summary}`)
  } catch (e) {
    log(`s${stub.n} WRITTEN but commit failed: ${e.message.slice(0, 200)}`)
  }
}

// --- main ----------------------------------------------------------------------
// SessionEnd path: the transcript is final by definition, no cooling. Comes in
// as --transcript (hook running the sweep directly) or as hint files the hook
// drops in STATE/ended/ before kickstarting the launchd job (so the run does
// not die with the hook's process group).
const ended = async (t, why) => {
  if (!existsSync(t)) { log(`transcript not found: ${t}`); return }
  const m = /claimed s(\d+)\\nnote/.exec(readFileSync(t, 'utf8'))
  if (!m) { vlog(`no claim in ${basename(t)}, nothing to do`); return }
  const stub = stubs.find((s) => s.n === Number(m[1]))
  if (!stub) { vlog(`s${m[1]} already written up`); return }
  if (!claimInTranscript(t, stub.n)) { log(`s${stub.n}: transcript mentions the claim but not as a tool result, skipping`); return }
  await sweep(stub, t, why)
}
const main = async () => {
  if (flag('transcript')) { await ended(flag('transcript'), 'session ended'); return }
  const hints = join(STATE, 'ended')
  if (existsSync(hints)) {
    for (const f of readdirSync(hints)) {
      const p = join(hints, f)
      const t = readFileSync(p, 'utf8').trim()
      unlinkSync(p)
      if (t) await ended(t, 'session ended')
    }
  }
  const only = flag('session') ? Number(String(flag('session')).replace(/^s/, '')) : null
  const todo = only ? stubs.filter((s) => s.n === only) : stubs
  if (!todo.length) { vlog(only ? `s${only}: no stub` : 'no stubs, nothing to do'); return }
  let ran = 0
  for (const stub of todo) {
    if (!readFileSync(stub.path, 'utf8').includes(SENTINEL)) continue // written meanwhile (hint path, or a live session)
    if (ran >= MAX_PER_RUN) { log(`cap ${MAX_PER_RUN}/run reached, s${stub.n} waits for the next tick`); continue }
    const t = findTranscript(stub.n)
    if (!t) { vlog(`s${stub.n}: no transcript holds its claim, skipping`); continue }
    const idle = Date.now() - statSync(t).mtimeMs
    if (!only && idle < COOL_MS) { vlog(`s${stub.n}: transcript still warm (${Math.round(idle / 60_000)}m idle < ${Math.round(COOL_MS / 60_000)}m)`); continue }
    ran++
    await sweep(stub, t, only ? 'forced' : `cold ${Math.round(idle / 60_000)}m`)
  }
}
main().catch((e) => { log(`sweep crashed: ${e.stack ?? e}`); process.exit(1) })
