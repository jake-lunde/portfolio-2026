/* Fence check for parallel crew lanes (CREW.md §1; scoped s93, built s96).
   Two lanes that look disjoint can still edit the same file — s93: a copy
   brief followed the em-dash ban across a file boundary into the mechanics
   lane's component. This intersects each branch's changed files vs
   origin/main, pairwise; any shared file means two lanes hold it and the
   PRs will conflict in whichever order they land.

     node scripts/crew-fence.mjs                      # every worktree branch
     node scripts/crew-fence.mjs lane-a lane-b [...]  # just this session's lanes

   Run before any `gh pr create`; exit 1 on overlap — resolve ownership
   first (one lane keeps the file, the other reports the wanted edit in its
   return). Diffs use origin/main...branch (merge-base), so branches already
   merged show clean. Fetch first if origin/main may be stale. */

import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const git = (...args) =>
  execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd()

const worktreeBranches = () =>
  git('worktree', 'list', '--porcelain')
    .split('\n')
    .filter((l) => l.startsWith('branch refs/heads/'))
    .map((l) => l.slice('branch refs/heads/'.length))

const branches = [...new Set(process.argv.slice(2).length ? process.argv.slice(2) : worktreeBranches())]
if (branches.length < 2) {
  console.log(`fence: ${branches.length} lane(s) — nothing to intersect`)
  process.exit(0)
}

const files = new Map() // branch → Set of changed paths
for (const b of branches) {
  try {
    const diff = git('diff', '--name-only', `origin/main...${b}`)
    files.set(b, new Set(diff ? diff.split('\n') : []))
  } catch {
    console.error(`fence: cannot diff origin/main...${b} — skipping (branch exists?)`)
  }
}

const overlaps = new Map() // file → [branches]
const lanes = [...files.keys()]
for (let i = 0; i < lanes.length; i++)
  for (let j = i + 1; j < lanes.length; j++)
    for (const f of files.get(lanes[i]))
      if (files.get(lanes[j]).has(f))
        overlaps.set(f, [...new Set([...(overlaps.get(f) ?? []), lanes[i], lanes[j]])])

for (const b of lanes) console.log(`  ${b}: ${files.get(b).size} file(s) vs origin/main`)

if (!overlaps.size) {
  console.log('fence: clean — no file held by two lanes')
  process.exit(0)
}
console.log(`\nfence: BLOCKED — ${overlaps.size} file(s) held by more than one lane:`)
for (const [f, bs] of overlaps) console.log(`  ${f}\n    ${bs.join('  ')}`)
process.exit(1)
