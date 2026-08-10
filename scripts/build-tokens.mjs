/* Design-token build — Style Dictionary v4 + Tokens Studio transforms.
 * Source of truth: tokens/ (Tokens Studio / DTCG JSON). One SD run per theme
 * from tokens/$themes.json; each theme emits ONLY its `enabled` sets (so
 * classic-dark is a lean override block) while `source` sets resolve refs.
 * outputReferencesFilter keeps var(--blue)/var(--ink) for EMITTED tokens (so
 * the component-scoped --blue pins still cascade into --focus) and resolves
 * references to internal primitives (core/color) down to literals.
 * Output → src/styles/tokens.generated.css (committed; do not hand-edit).
 */
import StyleDictionary from 'style-dictionary'
import { usesReferences, getReferences } from 'style-dictionary/utils'
import { register } from '@tokens-studio/sd-transforms'
import { promises as fs } from 'node:fs'
import path from 'node:path'

register(StyleDictionary)

/* The 'tokens-studio' group names with camelCase; our CSS is kebab
 * (--paper-2, --ink-soft, --menubar-h). Clone the group, swap the name
 * transform to name/kebab. */
const tsGroup = StyleDictionary.hooks.transformGroups['tokens-studio']
StyleDictionary.registerTransformGroup({
  name: 'tokens-studio-kebab',
  transforms: [...tsGroup.filter((t) => !t.startsWith('name/')), 'name/kebab'],
})

const ROOT = path.resolve(process.cwd())
const TOKENS_DIR = path.join(ROOT, 'tokens')
const OUT_DIR = path.join(ROOT, 'src/styles/generated')
const OUT_FILE = path.join(ROOT, 'src/styles/tokens.generated.css')

/* Tier = the source directory a token was authored in (tokens/core,
 * tokens/semantic, tokens/component). INSPECT.MODE reads this to grade a
 * declaration against house law — a core primitive consumed raw in product
 * CSS is a violation, and the inspector can only say so if the build tells
 * it which tier each emitted custom property came from. Emitted alongside
 * the CSS, from the same filtered dictionary, so the map can never list a
 * property the stylesheet doesn't actually ship. */
const TIERS = ['core', 'semantic', 'component']
const tierOf = (filePath) => {
  const seg = path.relative(TOKENS_DIR, path.resolve(filePath)).split(path.sep)[0]
  return TIERS.includes(seg) ? seg : null
}

StyleDictionary.registerFormat({
  name: 'json/token-tiers',
  format: ({ dictionary }) => {
    const out = {}
    for (const token of dictionary.allTokens) {
      const tier = tierOf(token.filePath)
      if (tier) out[`--${token.name}`] = tier
    }
    return JSON.stringify(out, null, 2)
  },
})

/* Final selector model. classic-dark also matches today's bare
 * [data-theme='dark'] so dark mode keeps working before the data-skin
 * attribute exists (introduced in Milestone B / store widening). */
const SELECTOR = {
  'classic-light': ":root,\n[data-skin='classic']",
  'classic-dark': "[data-theme='dark'],\n[data-skin='classic'][data-theme='dark']",
  medieval: "[data-skin='medieval']",
  underwater: "[data-skin='underwater']",
}

const themes = JSON.parse(await fs.readFile(path.join(TOKENS_DIR, '$themes.json'), 'utf8'))
await fs.mkdir(OUT_DIR, { recursive: true })

for (const theme of themes) {
  const sets = Object.entries(theme.selectedTokenSets).filter(([, v]) => v !== 'disabled')
  const source = sets.map(([s]) => path.join('tokens', `${s}.json`))
  const enabled = new Set(
    sets.filter(([, v]) => v === 'enabled').map(([s]) => path.resolve(TOKENS_DIR, `${s}.json`))
  )

  const sd = new StyleDictionary({
    source,
    preprocessors: ['tokens-studio'],
    usesDtcg: true,
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: {
      css: {
        transformGroup: 'tokens-studio-kebab',
        buildPath: 'src/styles/generated/',
        files: [
          {
            destination: `${theme.id}.css`,
            format: 'css/variables',
            // emit only tokens that came from an `enabled` set
            filter: (token) => enabled.has(path.resolve(token.filePath)),
            options: {
              selector: SELECTOR[theme.id],
              usesDtcg: true,
              // Emit var() for a token's references only when EVERY referenced
              // target is itself emitted in THIS theme (i.e. lives in an
              // `enabled` set) — so semantic→semantic and the tier chains
              // (component→semantic→core) keep var() and the component-scoped
              // --accent pins still cascade into --focus, while references to
              // internal `source` primitives (core/color) resolve to literals.
              // Custom (not SD's outputReferencesFilter, which crashes on the
              // deeper multi-hop chains this 3-tier model introduces).
              outputReferences: (token, opts) => {
                const val = opts.usesDtcg ? token.original.$value : token.original.value
                if (!usesReferences(val)) return false
                let refs
                try {
                  refs = getReferences(val, opts.dictionary.tokens, {
                    usesDtcg: opts.usesDtcg,
                    warnImmediately: false,
                  })
                } catch {
                  return false
                }
                return (
                  refs.length > 0 &&
                  refs.every((r) => r && r.filePath && enabled.has(path.resolve(r.filePath)))
                )
              },
            },
          },
          {
            destination: `${theme.id}.tiers.json`,
            format: 'json/token-tiers',
            // the SAME filter as the CSS file above: one dictionary, two
            // renderings, so the map and the stylesheet can't drift
            filter: (token) => enabled.has(path.resolve(token.filePath)),
          },
        ],
      },
    },
  })
  await sd.buildAllPlatforms()
}

// concatenate per-theme files in $themes order into one committed file
const header =
  '/* GENERATED by scripts/build-tokens.mjs from tokens/ — DO NOT EDIT.\n' +
  '   Run `npm run tokens:build` after editing tokens. */\n\n'
let out = header
for (const theme of themes) {
  const css = await fs.readFile(path.join(OUT_DIR, `${theme.id}.css`), 'utf8')
  out += css.trimEnd() + '\n\n'
}
await fs.writeFile(OUT_FILE, out)
console.log(`✓ wrote src/styles/tokens.generated.css (${themes.length} themes)`)

/* Motion tokens also emit as a typed TS module — springs are consumed by
 * motion/react in JS, where CSS custom properties can't reach (SSR-safe:
 * no runtime getComputedStyle). Source: tokens/core/motion.json. */
const motion = JSON.parse(await fs.readFile(path.join(TOKENS_DIR, 'core/motion.json'), 'utf8'))
const springs = Object.fromEntries(
  Object.entries(motion.spring).map(([name, params]) => [
    name,
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Number(v.$value)])),
  ])
)
const durations = Object.fromEntries(
  Object.entries(motion.duration).map(([name, v]) => [name, v.$value])
)
const motionTs =
  '/* GENERATED by scripts/build-tokens.mjs from tokens/core/motion.json — DO NOT EDIT. */\n\n' +
  `export const SPRING_TOKENS = ${JSON.stringify(springs, null, 2)} as const\n\n` +
  `export const DURATION_TOKENS = ${JSON.stringify(durations, null, 2)} as const\n`
await fs.writeFile(path.join(ROOT, 'src/lib/motion.generated.ts'), motionTs)
console.log('✓ wrote src/lib/motion.generated.ts')

/* The tier map, merged across themes in $themes order. Themes CAN disagree:
 * a property may be authored in core for one skin and re-declared in the
 * semantic set of another (--display/--sans/--mono do exactly this — core
 * in classic, semantic/medieval.json in medieval). A property that any skin
 * publishes as its per-skin API IS semantic, whatever the other skin's
 * source file, so SEMANTIC wins the collision and the disagreement is
 * logged by name — a new one should never pass unseen. Read by
 * src/lib/inspect.ts. */
const tiers = {}
for (const theme of themes) {
  const part = JSON.parse(await fs.readFile(path.join(OUT_DIR, `${theme.id}.tiers.json`), 'utf8'))
  for (const [name, tier] of Object.entries(part)) {
    const prior = tiers[name]
    if (prior === undefined) {
      tiers[name] = tier
      continue
    }
    if (prior === tier) continue
    const winner = prior === 'semantic' || tier === 'semantic' ? 'semantic' : prior
    tiers[name] = winner
    console.warn(`  ⚠ tier collision: ${name} is ${prior} and ${tier} — recording ${winner}`)
  }
}
const tierEntries = Object.keys(tiers)
  .sort()
  .map((name) => `  '${name}': '${tiers[name]}',`)
  .join('\n')
const tiersTs =
  '/* GENERATED FILE — DO NOT EDIT. Run npm run tokens:build. */\n\n' +
  '/* Every custom property tokens.generated.css emits, mapped to the tier it\n' +
  ' * was authored in. INSPECT.MODE grades declarations against it: a core\n' +
  " * primitive consumed raw in product CSS is house-law violation, and a\n" +
  ' * property absent from this map came from outside the token system. */\n' +
  "export const TOKEN_TIERS: Record<string, 'core' | 'semantic' | 'component'> = {\n" +
  `${tierEntries}\n}\n`
await fs.writeFile(path.join(ROOT, 'src/lib/tokens.generated.ts'), tiersTs)
console.log(`✓ wrote src/lib/tokens.generated.ts (${Object.keys(tiers).length} properties)`)
