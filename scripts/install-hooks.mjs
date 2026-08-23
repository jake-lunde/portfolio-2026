/* Point git at the repo's versioned hooks (.githooks/).
 *
 * Hooks are not versioned by git, so a checkout starts with none. This runs
 * from npm's `prepare` (so `npm install` wires it up) and by hand via
 * `npm run hooks:install`. Idempotent, quiet when there is nothing to do, and
 * never fails an install: a repo without hooks still builds fine.
 *
 * What it turns on: post-merge / post-checkout rebuild figma-plugin/dist when
 * incoming commits touched the plugin. See .githooks/rebuild-plugin.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HOOKS_PATH = '.githooks'

function git(...args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}

function tryGit(...args) {
  try {
    return git(...args)
  } catch {
    return null
  }
}

if (tryGit('rev-parse', '--git-dir') === null) {
  // Not a git checkout (a tarball, a build container). Nothing to install.
  process.exit(0)
}

const current = tryGit('config', '--get', 'core.hooksPath')
if (current === HOOKS_PATH) process.exit(0)

// core.hooksPath replaces .git/hooks wholesale, so say what is being orphaned.
const gitDir = tryGit('rev-parse', '--git-common-dir')
if (!current && gitDir) {
  const dir = path.resolve(ROOT, gitDir, 'hooks')
  let existing = []
  try {
    existing = readdirSync(dir).filter((f) => !f.endsWith('.sample'))
  } catch {
    existing = []
  }
  if (existing.length) {
    console.warn(
      `install-hooks: .git/hooks already holds ${existing.join(', ')}. ` +
        `Pointing git at ${HOOKS_PATH}/ will stop those from running. ` +
        `Move them into ${HOOKS_PATH}/ to keep them.`
    )
  }
}

if (tryGit('config', 'core.hooksPath', HOOKS_PATH) === null) {
  console.warn('install-hooks: could not set core.hooksPath. Run: git config core.hooksPath .githooks')
  process.exit(0)
}
const label = current ? `was "${current}"` : 'was unset'
console.log(`install-hooks: core.hooksPath -> ${HOOKS_PATH} (${label}).`)
