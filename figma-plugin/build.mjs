/* TOKEN BRIDGE — build script.
 *
 * Bundles the plugin with esbuild:
 *   src/code.ts        -> dist/code.js   (Figma sandbox entry; manifest.main)
 *   src/ui.ts          -> inlined <script> in dist/ui.html (manifest.ui)
 *
 * dist/ is gitignored — the plugin is built locally and loaded via
 * "Import plugin from manifest" in Figma. Pass --watch to rebuild on change.
 *
 * Every bundle carries a build stamp (__BUILD_STAMP__): the HEAD commit that
 * last touched figma-plugin/, the branch, whether the tree was dirty, and the
 * time. src/freshness.ts checks it against GitHub before each PULL/PUSH, so a
 * bundle running behind the branch says so instead of quietly replaying
 * long-fixed bugs. The .githooks/ rebuild keeps it from happening in the first
 * place; the stamp is what catches the cases the hook misses.
 */
import { build, context } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(DIR, 'src')
const DIST = path.join(DIR, 'dist')
const watch = process.argv.includes('--watch')

/* A git hook exports GIT_DIR (and friends) to everything it runs. Inherit
 * those and git treats build.mjs's own cwd as the repo root, so `-- .` matches
 * the whole tree and the stamp comes out wrong. Drop them and let git discover
 * the repo from cwd like a normal invocation. */
const GIT_ENV_VARS = [
  'GIT_DIR',
  'GIT_COMMON_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_PREFIX',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
]
const gitEnv = { ...process.env }
for (const key of GIT_ENV_VARS) delete gitEnv[key]

/** Run git in the plugin dir; empty string when git has nothing to say. */
function git(...args) {
  try {
    return execFileSync('git', args, {
      cwd: DIR,
      env: gitEnv,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

/**
 * The stamp baked into both bundles. `sha` is the newest commit touching
 * figma-plugin/ rather than plain HEAD, so commits elsewhere in the repo never
 * read as plugin staleness. Empty sha = built outside a git checkout.
 */
function buildStamp() {
  const sha = git('log', '-1', '--format=%H', '--', '.')
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD') || 'unknown'
  // Ignored paths (dist/) never show up here, so this is src/build/manifest only.
  const dirty = git('status', '--porcelain', '--', '.').length > 0
  return { sha, branch, dirty, at: new Date().toISOString() }
}

const stamp = buildStamp()
const define = { __BUILD_STAMP__: JSON.stringify(stamp) }

const codeOptions = {
  entryPoints: [path.join(SRC, 'code.ts')],
  outfile: path.join(DIST, 'code.js'),
  bundle: true,
  format: 'iife',
  target: 'es2017',
  define,
  logLevel: 'info',
}

/** Bundle ui.ts to a string and inline it into ui.html -> dist/ui.html. */
async function buildUI() {
  const result = await build({
    entryPoints: [path.join(SRC, 'ui.ts')],
    bundle: true,
    format: 'iife',
    target: 'es2017',
    define,
    write: false,
    logLevel: 'silent',
  })
  const js = result.outputFiles[0].text
  const template = await readFile(path.join(SRC, 'ui.html'), 'utf8')
  const html = template.replace('<!--INLINE_SCRIPT-->', `<script>\n${js}\n</script>`)
  await writeFile(path.join(DIST, 'ui.html'), html)
  console.log('  dist/ui.html  (ui.ts inlined)')
}

function stampLine() {
  if (!stamp.sha) return '(no git, bundle unverifiable)'
  return `stamp ${stamp.sha.slice(0, 7)}${stamp.dirty ? '+local' : ''} on ${stamp.branch}`
}

async function main() {
  await mkdir(DIST, { recursive: true })
  if (watch) {
    const ctx = await context(codeOptions)
    await ctx.watch()
    await buildUI()
    // Re-inline UI on any change to the UI sources.
    const uiCtx = await context({
      entryPoints: [path.join(SRC, 'ui.ts')],
      bundle: true,
      define,
      write: false,
      plugins: [
        {
          name: 'reinline-ui',
          setup(b) {
            b.onEnd(() => buildUI())
          },
        },
      ],
    })
    await uiCtx.watch()
    console.log(`TOKEN BRIDGE: watching… ${stampLine()}`)
  } else {
    await build(codeOptions)
    await buildUI()
    console.log(`TOKEN BRIDGE: build complete. ${stampLine()}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
