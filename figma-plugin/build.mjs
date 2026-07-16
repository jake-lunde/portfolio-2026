/* TOKEN BRIDGE — build script.
 *
 * Bundles the plugin with esbuild:
 *   src/code.ts        -> dist/code.js   (Figma sandbox entry; manifest.main)
 *   src/ui.ts          -> inlined <script> in dist/ui.html (manifest.ui)
 *
 * dist/ is gitignored — the plugin is built locally and loaded via
 * "Import plugin from manifest" in Figma. Pass --watch to rebuild on change.
 */
import { build, context } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(DIR, 'src')
const DIST = path.join(DIR, 'dist')
const watch = process.argv.includes('--watch')

const codeOptions = {
  entryPoints: [path.join(SRC, 'code.ts')],
  outfile: path.join(DIST, 'code.js'),
  bundle: true,
  format: 'iife',
  target: 'es2017',
  logLevel: 'info',
}

/** Bundle ui.ts to a string and inline it into ui.html -> dist/ui.html. */
async function buildUI() {
  const result = await build({
    entryPoints: [path.join(SRC, 'ui.ts')],
    bundle: true,
    format: 'iife',
    target: 'es2017',
    write: false,
    logLevel: 'silent',
  })
  const js = result.outputFiles[0].text
  const template = await readFile(path.join(SRC, 'ui.html'), 'utf8')
  const html = template.replace('<!--INLINE_SCRIPT-->', `<script>\n${js}\n</script>`)
  await writeFile(path.join(DIST, 'ui.html'), html)
  console.log('  dist/ui.html  (ui.ts inlined)')
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
    console.log('TOKEN BRIDGE: watching…')
  } else {
    await build(codeOptions)
    await buildUI()
    console.log('TOKEN BRIDGE: build complete.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
