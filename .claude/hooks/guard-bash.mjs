#!/usr/bin/env node
/* PreToolUse[Bash] — two CLAUDE.md laws made deterministic:
   §3.3  never commit ref/ docs/ portfolio-tracker* session-log.md
         invest-pull-quotes.md .env*
   memo  no prettier in this repo (no config/dep; rewrites house style)
   Exit 2 = block; stderr goes back to the agent. */
import { execFileSync } from 'node:child_process'

const raw = await new Promise((resolve) => {
  let d = ''
  process.stdin.on('data', (c) => (d += c))
  process.stdin.on('end', () => resolve(d))
})

let input
try {
  input = JSON.parse(raw)
} catch {
  process.exit(0) // malformed payload — never brick the tool
}

const cmd = input?.tool_input?.command ?? ''
const deny = (msg) => {
  console.error(msg)
  process.exit(2)
}

// ---- no-prettier rule: block prettier invoked as a command word ----------
if (/(^|[;&|(]\s*|\b(?:npx|bunx|pnpm dlx)\s+(?:-y\s+)?)prettier(\s|$|@)/.test(cmd)) {
  deny(
    'prettier is banned in this repo — no config, no dep; it rewrites the ' +
      'house style and cannot be round-tripped. Match the surrounding style by hand.'
  )
}

// ---- forbidden-path commits (CLAUDE.md §3.3) -----------------------------
const FORBIDDEN = /^(ref\/|docs\/|portfolio-tracker|session-log\.md|invest-pull-quotes\.md|\.env)/
const FORBIDDEN_IN_TEXT =
  /(^|[\s"'=])(ref\/|docs\/|portfolio-tracker|session-log\.md|invest-pull-quotes\.md|\.env)/

if (/\bgit\b[^\n;|&]*\bcommit\b/.test(cmd)) {
  const cwd = input?.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd()
  let staged = []
  try {
    staged = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
  } catch {
    /* not a repo / git unavailable — fall through */
  }
  const bad = staged.filter((f) => FORBIDDEN.test(f))
  if (bad.length) {
    deny(
      `Refusing commit — forbidden paths are staged (CLAUDE.md §3.3): ${bad.join(', ')}. ` +
        'Unstage them first: git restore --staged <path>'
    )
  }
}

// add + commit in one compound command stages AFTER this hook runs, so the
// staged-list check above can't see it — scan each shell segment that
// contains a `git ... add` for forbidden path tokens.
for (const segment of cmd.split(/[;&|]+/)) {
  if (/\bgit\b[^\n]*\badd\b/.test(segment) && FORBIDDEN_IN_TEXT.test(segment)) {
    deny(
      'Refusing — this command stages a forbidden path (CLAUDE.md §3.3: ref/, docs/, ' +
        'portfolio-tracker*, session-log.md, invest-pull-quotes.md, .env*).'
    )
  }
}
