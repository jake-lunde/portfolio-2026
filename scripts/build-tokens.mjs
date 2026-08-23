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
import { register, expandTypesMap } from '@tokens-studio/sd-transforms'
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

/* THE SOURCE-ONLY TIER. semantic/typography is `disabled` in every $theme,
 * which is a FIGMA-side instruction (Tokens Studio owns those as text styles,
 * not variables) that the CSS build used to read as "don't load". It has to
 * load now: a component text element binds one whole typography composite —
 * stamp's is a single ref to typography.badge — and SD can only expand that
 * into the five CSS custom properties if the composite is in the dictionary.
 * Loaded, never emitted: the per-file `enabled` filter below already excludes
 * it, and that exclusion is load-bearing. Emitted, a `typography` composite
 * renders as the CSS `font` shorthand, which has no slot for letter-spacing
 * and drops it silently — silently, because this build runs with warnings
 * disabled. Only for the theme that lists it; classic-dark and medieval carry
 * neither this set nor the core scales it references. */
const SOURCE_ONLY = ['semantic/typography']

/* THE FIGMA FACE NAMES, ON THE WAY TO CSS. A composite's fontFamily names the
 * installed Figma face ("Geist Mono") because that is the only thing a Figma
 * TEXT STYLE can be built from; CSS needs the same face as the var() stack the
 * skin publishes. Same three faces, two names, so the CSS build swaps one for
 * the other as the tokens come in and the composites keep ONE convention for
 * both readers. Without it a component that binds a whole composite would bake
 * "Geist Mono" into its font-family and lose the fallback stack — and the
 * per-skin face swap with it. */
const FIGMA_FACE_REF = /^\{font-figma\.([a-z]+)\}$/
StyleDictionary.registerPreprocessor({
  name: 'figma-face-to-css-stack',
  preprocessor: (tokens) => {
    const swap = (node) => {
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string') {
          const face = FIGMA_FACE_REF.exec(value)
          if (face) node[key] = `{${face[1]}}`
        } else if (value && typeof value === 'object') {
          swap(value)
        }
      }
      return node
    }
    return swap(structuredClone(tokens))
  },
})

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

/* Tier says WHICH LAYER a property was authored in; this says WHAT IT IS
 * BOUND TO. STYLER shows a component's current binding and offers the lawful
 * alternatives, and it can only name the current one if the build hands it
 * the authored source path — the emitted CSS carries a var() or a literal,
 * never the token path behind it.
 *
 * COMPONENT TIER ONLY, and that is not laziness: the component sets emit
 * once, under :root, so a property has exactly one authored value and this
 * map can be a flat Record. Semantic properties are re-declared per theme and
 * would need a per-theme map to say anything true.
 *
 * A ref is recorded only when the authored $value is EXACTLY one whole
 * reference ("{radius.control}"). An OFF-GRID literal, a composite, or a
 * value with a reference embedded in a larger string records null — there is
 * no single source token to name, and guessing one would put a lie in front
 * of the person choosing the replacement. Slash form, matching palette.ts,
 * because tokenRef() is the one place slashes become dots. */
const REF_ONLY = /^\{([^{}]+)\}$/
const refOf = (token) => {
  const raw = token.original?.$value
  if (typeof raw !== 'string') return null
  const m = REF_ONLY.exec(raw.trim())
  return m ? m[1].split('.').join('/') : null
}

StyleDictionary.registerFormat({
  name: 'json/token-refs',
  format: ({ dictionary }) => {
    const out = {}
    for (const token of dictionary.allTokens) {
      if (tierOf(token.filePath) !== 'component') continue
      out[`--${token.name}`] = refOf(token)
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
  const sourceOnly = Object.keys(theme.selectedTokenSets).filter((s) => SOURCE_ONLY.includes(s))
  const source = [...sets.map(([s]) => s), ...sourceOnly].map((s) => path.join('tokens', `${s}.json`))
  const enabled = new Set(
    sets.filter(([, v]) => v === 'enabled').map(([s]) => path.resolve(TOKENS_DIR, `${s}.json`))
  )

  /* What reaches the stylesheet: a token from an `enabled` set, minus the
   * composite member that is not a CSS property. `fontStyle` names the FONT
   * FILE a weight implies ("Bold"), which is what Figma binds a text style to
   * and what `font-style` in CSS emphatically does not mean. It is derived
   * from fontWeight, so dropping it costs nothing and keeps the emitted set at
   * the five properties a text element actually declares. */
  const emits = (token) =>
    enabled.has(path.resolve(token.filePath)) && token.path.at(-1) !== 'fontStyle'

  const sd = new StyleDictionary({
    source,
    preprocessors: ['tokens-studio'],
    usesDtcg: true,
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: {
      css: {
        transformGroup: 'tokens-studio-kebab',
        buildPath: 'src/styles/generated/',
        preprocessors: ['figma-face-to-css-stack'],
        /* One typography composite per text element in the component tier,
         * expanded here into --<component>-text-font-family / -font-size /
         * -font-weight / -letter-spacing / -line-height. SCOPED TO THE
         * COMPONENT TIER on purpose: expanding the semantic composites too
         * would destroy the very tokens the component refs point at. */
        expand: {
          typesMap: expandTypesMap,
          include: (token) => tierOf(token.filePath) === 'component',
        },
        files: [
          {
            destination: `${theme.id}.css`,
            format: 'css/variables',
            // emit only tokens that came from an `enabled` set
            filter: emits,
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
            filter: emits,
          },
          {
            destination: `${theme.id}.refs.json`,
            format: 'json/token-refs',
            filter: emits,
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
 * no runtime getComputedStyle). Two sources, one per tier: the spring
 * physics are primitives (tokens/core/motion.json); the duration ramp is
 * role-named and therefore semantic (tokens/semantic/motion.json), so the
 * tier map grades var(--duration-tap) in product CSS as legal. */
const motion = JSON.parse(await fs.readFile(path.join(TOKENS_DIR, 'core/motion.json'), 'utf8'))
const motionRoles = JSON.parse(
  await fs.readFile(path.join(TOKENS_DIR, 'semantic/motion.json'), 'utf8')
)
const springs = Object.fromEntries(
  Object.entries(motion.spring).map(([name, params]) => [
    name,
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Number(v.$value)])),
  ])
)
const durations = Object.fromEntries(
  Object.entries(motionRoles.duration)
    .filter(([name]) => !name.startsWith('$')) // skip $description on the group
    .map(([name, v]) => [name, v.$value])
)
const motionTs =
  '/* GENERATED by scripts/build-tokens.mjs from tokens/core/motion.json +\n' +
  '   tokens/semantic/motion.json — DO NOT EDIT. */\n\n' +
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

/* The component tier's authored bindings, merged the same way. Component sets
 * are `enabled` in exactly one theme today, so the merge is a formality — but
 * if a second theme ever enables one, two different refs under one name is a
 * real contradiction (this map is flat), and it should be heard, not averaged.
 * First write wins, in $themes order, and the disagreement is logged. */
const refs = {}
for (const theme of themes) {
  const part = JSON.parse(await fs.readFile(path.join(OUT_DIR, `${theme.id}.refs.json`), 'utf8'))
  for (const [name, ref] of Object.entries(part)) {
    if (!(name in refs)) {
      refs[name] = ref
      continue
    }
    if (refs[name] === ref) continue
    console.warn(`  ⚠ ref collision: ${name} is ${refs[name]} and ${ref} — keeping the first`)
  }
}
const refEntries = Object.keys(refs)
  .sort()
  .map((name) => `  '${name}': ${refs[name] === null ? 'null' : `'${refs[name]}'`},`)
  .join('\n')

/* THE COMPOSITE PARENTS, read straight off the source files.
 *
 * A component text element binds ONE typography role — stamp's `text` is a
 * single ref to {typography.badge} — and that binding is the row STYLER
 * draws: one "Text style" offer per text element, never five knobs (Jake's
 * ruling, s100 — type styles are packages, not knobs).
 *
 * It cannot come out of the dictionary the way TOKEN_TIERS and TOKEN_REFS do.
 * The css platform's `expand` splits every component typography composite
 * into its five members BEFORE any format runs, so by the time
 * json/token-refs walks dictionary.allTokens the parent is gone — only
 * --stamp-text-font-size and its four siblings are left, and none of them is
 * the offer. The parent survives in exactly one place: the source file. So
 * read the source.
 *
 * That read is theme-independent by construction, which is what lets one flat
 * map be true: the component sets have no theme axis at all — they emit once,
 * under :root, and per-skin divergence rides the semantic refs — so
 * tokens/component/*.json IS the binding for every skin. The guard below
 * proves each parent is real by insisting its five members actually emitted;
 * a composite sitting in a set no theme enables would otherwise put a row in
 * front of a person that moves nothing when they change it.
 *
 * Only a WHOLE ref counts, the same rule refOf uses. A composite assembled
 * inline out of five member refs is a treatment, not a role, and there is no
 * single token to name.
 */
const COMPOSITE_MEMBERS = [
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
  'line-height',
]

const compositeParents = (node, prefix = [], out = []) => {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const next = [...prefix, key]
    if (!('$value' in value)) {
      compositeParents(value, next, out)
      continue
    }
    if (value.$type !== 'typography' || typeof value.$value !== 'string') continue
    const m = REF_ONLY.exec(value.$value.trim())
    if (m) out.push([`--${next.join('-')}`, m[1].split('.').join('/')])
  }
  return out
}

const COMPONENT_DIR = path.join(TOKENS_DIR, 'component')
const composites = {}
for (const file of (await fs.readdir(COMPONENT_DIR)).filter((f) => f.endsWith('.json')).sort()) {
  const tree = JSON.parse(await fs.readFile(path.join(COMPONENT_DIR, file), 'utf8'))
  for (const [name, ref] of compositeParents(tree)) composites[name] = ref
}
for (const [name, ref] of Object.entries(composites)) {
  const missing = COMPOSITE_MEMBERS.filter((m) => tiers[`${name}-${m}`] !== 'component')
  if (missing.length > 0) {
    throw new Error(
      `${name} binds {${ref.split('/').join('.')}} but ${missing.join(', ')} never emitted — ` +
        'the composite is in a set no theme enables, so STYLER would draw a row that moves nothing',
    )
  }
}
const compositeEntries = Object.keys(composites)
  .sort()
  .map((name) => `  '${name}': '${composites[name]}',`)
  .join('\n')

/* THE ROLES ON OFFER, in the order they were authored. DERIVED, where COLORS
 * in styleCandidates.ts is hand-curated, and the difference is a rule worth
 * writing down: derive where the semantic tier has already done the curating,
 * hand-write only where the semantic set holds things that are not offers.
 * The colour roles fail that test — status signals, shadows, the focus ring
 * and the accent-expressive AA indirection's internals all sit beside the
 * chrome colours, and half of them would be a mistake to put in a dropdown.
 * semantic/typography.json passes it: every entry in it is a complete,
 * named type style a text element may wear, and the authored order IS the
 * design order (the content ramp, then the chrome ramp). Nothing to filter,
 * nothing to reorder, and one fewer list to keep in sync by hand. */
const typographySet = JSON.parse(
  await fs.readFile(path.join(TOKENS_DIR, 'semantic/typography.json'), 'utf8'),
)
const typeRoles = Object.keys(typographySet.typography).filter((r) => !r.startsWith('$'))
const roleEntries = typeRoles.map((role) => `  '${role}',`).join('\n')

const tiersTs =
  '/* GENERATED FILE — DO NOT EDIT. Run npm run tokens:build. */\n\n' +
  '/* Every custom property tokens.generated.css emits, mapped to the tier it\n' +
  ' * was authored in. INSPECT.MODE grades declarations against it: a core\n' +
  " * primitive consumed raw in product CSS is house-law violation, and a\n" +
  ' * property absent from this map came from outside the token system. */\n' +
  "export const TOKEN_TIERS: Record<string, 'core' | 'semantic' | 'component'> = {\n" +
  `${tierEntries}\n}\n\n` +
  '/* What each COMPONENT-tier property is currently bound to, as the source\n' +
  " * token's path in slash form — or null where the author wrote a literal\n" +
  ' * (the OFF-GRID values) and there is no source token to name. STYLER reads\n' +
  ' * it to show the binding a row is about to replace. Component tier only:\n' +
  ' * those sets emit once, under :root, so one flat map can be true. */\n' +
  'export const TOKEN_REFS: Record<string, string | null> = {\n' +
  `${refEntries}\n}\n\n` +
  '/* Every component text element, mapped to the ONE typography role it wears.\n' +
  ' * Read off the source files rather than the dictionary, because the build\n' +
  ' * expands each composite into its five CSS members before any format sees\n' +
  " * it — so these names appear in neither map above, and the members that do\n" +
  ' * appear are locked. This is the row STYLER offers: a whole type style,\n' +
  ' * swapped for another whole type style. */\n' +
  'export const TOKEN_COMPOSITES: Record<string, string> = {\n' +
  `${compositeEntries}\n}\n\n` +
  '/* The semantic typography roles, in authored order — the content ramp then\n' +
  ' * the chrome ramp. The candidate list for a Text style row is derived from\n' +
  ' * this, not typed out: every entry is a complete named style a text element\n' +
  ' * may wear, so there is nothing here that is not an offer. */\n' +
  'export const TYPE_ROLES: readonly string[] = [\n' +
  `${roleEntries}\n]\n`
await fs.writeFile(path.join(ROOT, 'src/lib/tokens.generated.ts'), tiersTs)
console.log(
  `✓ wrote src/lib/tokens.generated.ts (${Object.keys(tiers).length} properties, ` +
    `${Object.keys(refs).length} component refs, ${Object.keys(composites).length} text ` +
    `elements, ${typeRoles.length} type roles)`
)
