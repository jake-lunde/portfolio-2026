/* TOKEN BRIDGE — Figma sandbox entry (code.ts).
 *
 * Thin adapter between Figma's variable API and the pure rules in tokens.ts /
 * github.ts. Responsibilities:
 *   - hold settings (PAT / repo / branch) in figma.clientStorage
 *   - PULL:  GitHub tokens/*.json -> Figma variables (core + semantic modes)
 *   - PUSH:  Figma variables -> changed tokens/*.json -> design-tokens PR
 *
 * The PAT lives only here (sandbox) + clientStorage; it is never posted to the
 * UI iframe and never written to the status log.
 */

import { GitHub, parseRepo } from './github'
import {
  buildModel,
  capLines,
  coreVarName,
  deepClone,
  enabledSemanticSets,
  figmaVarName,
  floatToTokenString,
  formatChangeLine,
  formatChangeMarkdown,
  createLeafAtPath,
  isComponentSet,
  isCoreSet,
  leafAtPath,
  owningSet,
  refStringForTarget,
  resolveKind,
  resolveRef,
  rgbaToTokenString,
  semanticToken,
  toFloat,
  toRgba,
  writeTargetSet,
  type ChangeEntry,
  type FlatToken,
  type Metadata,
  type PulledModel,
  type Rgba,
  type ThemeDef,
  type TokenKind,
} from './tokens'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CORE_COLLECTION = 'core'
const SEMANTIC_COLLECTION = 'semantic'
const COMPONENT_COLLECTION = 'component'
const PR_BRANCH = 'design-tokens'
const PR_TITLE = 'tokens: edits from TOKEN BRIDGE (Figma)'
const PR_BODY_INTRO =
  'Automated by the TOKEN BRIDGE Figma plugin.\n\n' +
  'Design tokens edited in Figma, serialized back to `tokens/*.json`. ' +
  'CI regenerates `src/styles/tokens.generated.css`; Chromatic diffs the result.'
const CHANGE_LIST_CAP = 20
const TOKENS_DIR = 'tokens'
const DEFAULT_REPO = 'jake-lunde/portfolio-2026'
const DEFAULT_BRANCH = 'main'

const SETTINGS_KEYS = { pat: 'tb.pat', repo: 'tb.repo', branch: 'tb.branch' }

// ---------------------------------------------------------------------------
// UI plumbing
// ---------------------------------------------------------------------------

type LogLevel = 'info' | 'ok' | 'warn' | 'error'

function log(message: string, level: LogLevel = 'info'): void {
  figma.ui.postMessage({ type: 'log', level, message })
}

figma.showUI(__html__, { width: 380, height: 560, themeColors: false })

type UIMessage =
  | { type: 'ui-ready' }
  | { type: 'save-settings'; pat: string; repo: string; branch: string }
  | { type: 'pull' }
  | { type: 'push' }

figma.ui.onmessage = async (msg: UIMessage) => {
  try {
    if (msg.type === 'ui-ready') {
      await sendSettings()
    } else if (msg.type === 'save-settings') {
      await saveSettings(msg.pat, msg.repo, msg.branch)
    } else if (msg.type === 'pull') {
      await runGuarded('PULL', pull)
    } else if (msg.type === 'push') {
      await runGuarded('PUSH', push)
    }
  } catch (e) {
    log(errorText(e), 'error')
  }
}

async function runGuarded(label: string, fn: (gh: GitHub, branch: string) => Promise<void>) {
  const pat = (await figma.clientStorage.getAsync(SETTINGS_KEYS.pat)) as string | undefined
  const repo = ((await figma.clientStorage.getAsync(SETTINGS_KEYS.repo)) as string) || DEFAULT_REPO
  const branch =
    ((await figma.clientStorage.getAsync(SETTINGS_KEYS.branch)) as string) || DEFAULT_BRANCH
  if (!pat) {
    log('No PAT saved. Paste a fine-grained token (Contents r/w) and Save first.', 'error')
    return
  }
  log(`${label} starting…`)
  const gh = new GitHub(pat, parseRepo(repo))
  await fn(gh, branch)
  log(`${label} done.`, 'ok')
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

async function sendSettings(): Promise<void> {
  const pat = (await figma.clientStorage.getAsync(SETTINGS_KEYS.pat)) as string | undefined
  const repo = ((await figma.clientStorage.getAsync(SETTINGS_KEYS.repo)) as string) || DEFAULT_REPO
  const branch =
    ((await figma.clientStorage.getAsync(SETTINGS_KEYS.branch)) as string) || DEFAULT_BRANCH
  // NB: the PAT value itself is never sent to the UI — only whether one exists.
  figma.ui.postMessage({ type: 'settings', repo, branch, hasPat: !!pat })
}

async function saveSettings(pat: string, repo: string, branch: string): Promise<void> {
  // Only overwrite the stored PAT when a non-empty value is supplied, so
  // re-saving repo/branch doesn't wipe an existing token.
  if (pat && pat.trim()) await figma.clientStorage.setAsync(SETTINGS_KEYS.pat, pat.trim())
  await figma.clientStorage.setAsync(SETTINGS_KEYS.repo, (repo || DEFAULT_REPO).trim())
  await figma.clientStorage.setAsync(SETTINGS_KEYS.branch, (branch || DEFAULT_BRANCH).trim())
  log('Settings saved.', 'ok')
  await sendSettings()
}

// ---------------------------------------------------------------------------
// Fetch + build the model
// ---------------------------------------------------------------------------

async function fetchModel(gh: GitHub, branch: string): Promise<PulledModel> {
  const metaText = await gh.getFileRaw(`${TOKENS_DIR}/$metadata.json`, branch)
  if (!metaText) throw new Error(`tokens/$metadata.json not found on ${branch}.`)
  const metadata = JSON.parse(metaText) as Metadata

  const themesText = await gh.getFileRaw(`${TOKENS_DIR}/$themes.json`, branch)
  if (!themesText) throw new Error(`tokens/$themes.json not found on ${branch}.`)
  const themes = JSON.parse(themesText) as ThemeDef[]

  const files: Record<string, unknown> = {}
  for (const set of metadata.tokenSetOrder) {
    const text = await gh.getFileRaw(`${TOKENS_DIR}/${set}.json`, branch)
    if (!text) {
      log(`Set "${set}" listed in metadata but file missing — skipping.`, 'warn')
      continue
    }
    files[set] = JSON.parse(text)
  }
  return buildModel(metadata, themes, files)
}

// ---------------------------------------------------------------------------
// Figma collection / variable helpers
// ---------------------------------------------------------------------------

async function getOrCreateCollection(name: string): Promise<VariableCollection> {
  const cols = await figma.variables.getLocalVariableCollectionsAsync()
  const existing = cols.find((c) => c.name === name)
  return existing ?? figma.variables.createVariableCollection(name)
}

/** Ensure the semantic collection has one mode per theme (mode name = theme.id). */
function ensureModes(col: VariableCollection, themes: ThemeDef[]): Record<string, string> {
  const byTheme: Record<string, string> = {}
  // Reuse the default mode for the first theme; add/rename the rest.
  themes.forEach((theme, i) => {
    const existing = col.modes.find((m) => m.name === theme.id)
    if (existing) {
      byTheme[theme.id] = existing.modeId
      return
    }
    if (i === 0) {
      col.renameMode(col.modes[0].modeId, theme.id)
      byTheme[theme.id] = col.modes[0].modeId
    } else {
      byTheme[theme.id] = col.addMode(theme.id)
    }
  })
  return byTheme
}

type VarIndex = Map<string, Variable>

async function buildVarIndex(): Promise<Map<string, VarIndex>> {
  // collectionId -> (variableName -> Variable)
  const all = await figma.variables.getLocalVariablesAsync()
  const byCol = new Map<string, VarIndex>()
  for (const v of all) {
    let idx = byCol.get(v.variableCollectionId)
    if (!idx) {
      idx = new Map()
      byCol.set(v.variableCollectionId, idx)
    }
    idx.set(v.name, v)
  }
  return byCol
}

function getOrCreateVariable(
  name: string,
  col: VariableCollection,
  kind: TokenKind,
  index: Map<string, VarIndex>
): Variable {
  const colIdx = index.get(col.id) ?? new Map<string, Variable>()
  const existing = colIdx.get(name)
  if (existing) {
    if (existing.resolvedType !== kind) {
      log(
        `Variable "${col.name}/${name}" exists as ${existing.resolvedType}, token wants ${kind}; reusing existing type.`,
        'warn'
      )
    }
    return existing
  }
  const created = figma.variables.createVariable(name, col, kind)
  colIdx.set(name, created)
  index.set(col.id, colIdx)
  return created
}

// ---------------------------------------------------------------------------
// PULL
// ---------------------------------------------------------------------------

async function pull(gh: GitHub, branch: string): Promise<void> {
  const model = await fetchModel(gh, branch)
  log(
    `Fetched ${Object.keys(model.files).length} sets, ${model.themes.length} themes from ${branch}.`
  )

  const coreCol = await getOrCreateCollection(CORE_COLLECTION)
  const semCol = await getOrCreateCollection(SEMANTIC_COLLECTION)
  const compCol = model.componentTokens.length
    ? await getOrCreateCollection(COMPONENT_COLLECTION)
    : null
  const modeByTheme = ensureModes(semCol, model.themes)

  const index = await buildVarIndex()
  const coreVars: VarIndex = new Map() // keyed by coreVarName (slashed)
  const semVars: VarIndex = new Map() // keyed by dotted token name (ref key)
  const compVars: VarIndex = new Map() // keyed by dotted token path

  // Pass 1 — create/find every variable so aliases have targets to point at.
  // Internal keys stay dotted (matching refs); the Figma NAME is slashed.
  for (const t of model.coreTokens) {
    const name = coreVarName(t.set, t.path)
    const v = getOrCreateVariable(name, coreCol, resolveKind(t, model), index)
    coreVars.set(name, v)
  }
  for (const name of model.semanticNames) {
    // Kind is mode-invariant; derive from any occurrence.
    const repr = representativeSemantic(model, name)
    const kind = repr ? resolveKind(repr, model) : 'COLOR'
    const v = getOrCreateVariable(figmaVarName(name), semCol, kind, index)
    semVars.set(name, v)
  }
  if (compCol) {
    for (const t of model.componentTokens) {
      const v = getOrCreateVariable(figmaVarName(t.path), compCol, resolveKind(t, model), index)
      compVars.set(t.path, v)
    }
  }

  // Pass 2 — assign values / aliases.
  const coreModeId = coreCol.modes[0].modeId
  for (const t of model.coreTokens) {
    const v = coreVars.get(coreVarName(t.set, t.path)) as Variable
    setValue(v, coreModeId, t, model, coreVars, semVars)
  }
  for (const theme of model.themes) {
    const modeId = modeByTheme[theme.id]
    for (const name of model.semanticNames) {
      const tok = semanticToken(model, theme, name)
      if (!tok) {
        log(`No value for semantic "${name}" in theme "${theme.id}" — left unset.`, 'warn')
        continue
      }
      const v = semVars.get(name) as Variable
      setValue(v, modeId, tok, model, coreVars, semVars)
    }
  }
  if (compCol) {
    const compModeId = compCol.modes[0].modeId
    for (const t of model.componentTokens) {
      const v = compVars.get(t.path) as Variable
      setValue(v, compModeId, t, model, coreVars, semVars)
    }
  }

  log(
    `Upserted ${coreVars.size} core + ${semVars.size} semantic${
      compVars.size ? ` + ${compVars.size} component` : ''
    } variables (${model.themes.map((t) => t.id).join(', ')}).`,
    'ok'
  )
}

function representativeSemantic(model: PulledModel, name: string): FlatToken | undefined {
  for (const set of Object.keys(model.semanticSets)) {
    const hit = model.semanticSets[set].find((t) => t.path === name)
    if (hit) return hit
  }
  return undefined
}

function setValue(
  v: Variable,
  modeId: string,
  token: FlatToken,
  model: PulledModel,
  coreVars: VarIndex,
  semVars: VarIndex
): void {
  if (token.isAlias) {
    const ref = resolveRef(token.aliasRef as string, model)
    if (!ref) {
      log(`Unresolved alias ${token.rawValue} for "${token.path}".`, 'warn')
      return
    }
    const target = ref.collection === 'core' ? coreVars.get(ref.name) : semVars.get(ref.name)
    if (!target) {
      log(`Alias target ${ref.collection}/${ref.name} missing for "${token.path}".`, 'warn')
      return
    }
    v.setValueForMode(modeId, figma.variables.createVariableAlias(target))
    return
  }
  const kind = v.resolvedType
  if (kind === 'COLOR') v.setValueForMode(modeId, toRgba(token.rawValue))
  else if (kind === 'FLOAT') v.setValueForMode(modeId, toFloat(token.rawValue))
  else v.setValueForMode(modeId, token.rawValue)
}

// ---------------------------------------------------------------------------
// PUSH
// ---------------------------------------------------------------------------

async function push(gh: GitHub, branch: string): Promise<void> {
  // Diff Figma against the current repo state (the PR base) so the PR shows the
  // true delta. We re-fetch rather than trusting a stored memo.
  const model = await fetchModel(gh, branch)

  const cols = await figma.variables.getLocalVariableCollectionsAsync()
  const coreCol = cols.find((c) => c.name === CORE_COLLECTION)
  const semCol = cols.find((c) => c.name === SEMANTIC_COLLECTION)
  const compCol = cols.find((c) => c.name === COMPONENT_COLLECTION)
  if (!coreCol || !semCol) {
    throw new Error('Missing "core"/"semantic" collections — run PULL first.')
  }
  const index = await buildVarIndex()
  const coreIdx = index.get(coreCol.id) ?? new Map<string, Variable>()
  const semIdx = index.get(semCol.id) ?? new Map<string, Variable>()
  const compIdx = compCol ? index.get(compCol.id) ?? new Map<string, Variable>() : new Map()
  const modeByTheme = modeIndex(semCol)
  const allVars = await figma.variables.getLocalVariablesAsync()
  const varById = new Map(allVars.map((v) => [v.id, v]))

  const changes: ChangeEntry[] = []
  // One clone per set, shared by BOTH passes below: a semantic edit can land in
  // a different file than the set it was read from (materialization), so the
  // old "clone inside the per-set loop" shape can't work.
  const clones = new Map<string, unknown>()
  const dirty = new Set<string>()
  const cloneOf = (set: string): unknown | undefined => {
    const original = model.files[set]
    if (original === undefined) return undefined
    if (!clones.has(set)) clones.set(set, deepClone(original))
    return clones.get(set)
  }

  // --- core + component: per-set, single-mode collections ---
  for (const set of model.metadata.tokenSetOrder) {
    const clone = cloneOf(set)
    if (clone === undefined) continue

    if (isCoreSet(set)) {
      const coreMode = coreCol.modes[0].modeId
      for (const t of model.coreTokens.filter((x) => x.set === set)) {
        const v = coreIdx.get(coreVarName(t.set, t.path))
        if (!v) continue // unknown to Figma — leave original untouched
        const next = serializeVarValue(v, coreMode, t, varById, model)
        if (next !== null && applyLeaf(clone, t.path, next, t)) {
          dirty.add(set)
          changes.push({ path: t.path, oldValue: t.rawValue, newValue: next })
        }
      }
    } else if (isComponentSet(set) && compCol) {
      // component set — single-mode collection; Figma name is slashed
      const compMode = compCol.modes[0].modeId
      for (const t of model.componentTokens.filter((x) => x.set === set)) {
        const v = compIdx.get(figmaVarName(t.path))
        if (!v) continue
        const next = serializeVarValue(v, compMode, t, varById, model)
        if (next !== null && applyLeaf(clone, t.path, next, t)) {
          dirty.add(set)
          changes.push({ path: t.path, oldValue: t.rawValue, newValue: next })
        }
      }
    }
  }

  // --- semantic: THEME-major / NAME-major ---
  // Every theme is a MODE of the semantic collection, so every mode must be
  // read. The old per-set shape only ever visited the FIRST theme that enabled
  // a set, which silently dropped edits to tokens a mode merely INHERITS
  // (e.g. `focus` in Classic-Dark, any scale token in Medieval).
  //
  // Comparison is against the token DEFINITION string pull wrote into this mode
  // (alias vs alias), never a resolved colour — so an untouched inherited
  // `{accent}` compares equal and never materializes a spurious override.
  // Reverting an existing override to the base value does NOT delete the leaf;
  // de-materialization is deliberately manual (doctor flags redundant ones).
  for (const theme of model.themes) {
    const modeId = modeByTheme[theme.id]
    if (modeId === undefined) continue
    const target = writeTargetSet(model, theme)

    for (const name of model.semanticNames) {
      const v = semIdx.get(figmaVarName(name))
      if (!v) continue
      const baseline = semanticToken(model, theme, name)
      if (!baseline) continue
      const next = serializeVarValue(v, modeId, baseline, varById, model)
      if (next === null || next === baseline.rawValue) continue

      const owner = owningSet(model, theme, name)
      if (owner !== undefined) {
        // this theme already defines the token — write in place
        const clone = cloneOf(owner)
        if (clone !== undefined && applyLeaf(clone, name, next, baseline)) {
          dirty.add(owner)
          changes.push({
            path: `${theme.id} · ${name}`,
            oldValue: baseline.rawValue,
            newValue: next,
          })
        }
        continue
      }

      // inherited-only → materialize an override in the theme's own file
      if (target === undefined) continue
      const clone = cloneOf(target)
      if (clone === undefined) continue
      if (createLeafAtPath(clone, name, next, { type: baseline.type })) {
        dirty.add(target)
        changes.push({
          path: `${theme.id} · ${name} (new override)`,
          oldValue: baseline.rawValue,
          newValue: next,
        })
        log(`Materialized override: ${name} → ${target} (${theme.id})`, 'info')
      }
    }
  }

  const changed: Array<{ path: string; content: string }> = []
  for (const set of model.metadata.tokenSetOrder) {
    if (!dirty.has(set)) continue
    changed.push({
      path: `${TOKENS_DIR}/${set}.json`,
      content: JSON.stringify(clones.get(set), null, 2) + '\n',
    })
  }

  // Warn about Figma variables that aren't in any pulled set (ignored on push).
  reportUnknownVars(coreIdx, semIdx, model)

  if (changed.length === 0) {
    log('No token changes vs repo — nothing to push.', 'ok')
    return
  }
  log(`${changes.length} token(s) changed across ${changed.length} file(s):`)
  for (const f of changed) log(`  • ${f.path}`)

  const prUrl = await commitAndPr(gh, branch, changed, changes)
  log(`PR ready: ${prUrl}`, 'ok')
}

function modeIndex(col: VariableCollection): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of col.modes) out[m.name] = m.modeId
  return out
}

/**
 * Serialize a Figma variable's value for a mode back to a token string, or
 * null if it should be skipped. Aliases -> "{ref}"; colors -> hex/rgba;
 * floats -> "NNpx"; strings -> as-is.
 */
function serializeVarValue(
  v: Variable,
  modeId: string,
  token: FlatToken,
  varById: Map<string, Variable>,
  model: PulledModel
): string | null {
  const raw = v.valuesByMode[modeId]
  if (raw === undefined) return null

  if (isAliasValue(raw)) {
    const target = varById.get(raw.id)
    if (!target) {
      log(`Alias target for "${token.path}" not found; leaving original value.`, 'warn')
      return null
    }
    const refBody = refBodyForVariable(target, model)
    if (!refBody) {
      log(`Cannot map alias target "${target.name}" back to a token ref; leaving original.`, 'warn')
      return null
    }
    return refBody
  }

  const kind = v.resolvedType
  if (kind === 'COLOR') {
    const c = raw as Rgba
    return rgbaToTokenString(c, token.rawValue.trim() === 'transparent')
  }
  if (kind === 'FLOAT') return floatToTokenString(raw as number)
  return String(raw)
}

function isAliasValue(x: unknown): x is VariableAlias {
  return (
    typeof x === 'object' &&
    x !== null &&
    (x as { type?: string }).type === 'VARIABLE_ALIAS' &&
    typeof (x as { id?: unknown }).id === 'string'
  )
}

/** Map a Figma variable (alias target) back to a "{ref}" body string. */
function refBodyForVariable(target: Variable, model: PulledModel): string | null {
  // core target: reverse the naming rule via the core token whose var name matches
  const core = model.coreTokens.find((t) => coreVarName(t.set, t.path) === target.name)
  if (core) return refStringForTarget(core)
  // semantic target: Figma name is slashed (radius/control) → dotted ref path.
  const dotted = target.name.split('/').join('.')
  if (model.semanticNames.includes(dotted)) return `{${dotted}}`
  return null
}

/**
 * Write `next` into the cloned file at `token.path`, but only if it differs
 * from the original string. Returns true when a change was written.
 */
function applyLeaf(
  clone: unknown,
  path: string,
  next: string,
  token: FlatToken
): boolean {
  if (next === token.rawValue) return false
  const leaf = leafAtPath(clone, path)
  if (!leaf) return false
  leaf.$value = next
  return true
}

function reportUnknownVars(coreIdx: VarIndex, semIdx: VarIndex, model: PulledModel): void {
  // Figma-name sets (slashed) to compare against the collections' actual keys.
  const coreNames = new Set(model.coreTokens.map((t) => coreVarName(t.set, t.path)))
  const semNames = new Set(model.semanticNames.map(figmaVarName))
  const extra: string[] = []
  for (const name of coreIdx.keys()) if (!coreNames.has(name)) extra.push(`core/${name}`)
  for (const name of semIdx.keys()) if (!semNames.has(name)) extra.push(`semantic/${name}`)
  if (extra.length) {
    log(`Ignoring ${extra.length} Figma variable(s) with no matching token: ${extra.join(', ')}`, 'warn')
  }
}

/** Commit message: title + blank line + change lines (capped), or just the title if none. */
function commitMessage(changes: ChangeEntry[]): string {
  const lines = capLines(changes.map(formatChangeLine), CHANGE_LIST_CAP)
  return lines.length ? `${PR_TITLE}\n\n${lines.join('\n')}` : PR_TITLE
}

/** Markdown "## Changes" section shared by the PR body (on create) and PR comment (on push). */
function changesSection(changes: ChangeEntry[]): string {
  const lines = capLines(changes.map(formatChangeMarkdown), CHANGE_LIST_CAP)
  return ['## Changes', ...lines].join('\n')
}

async function commitAndPr(
  gh: GitHub,
  base: string,
  files: Array<{ path: string; content: string }>,
  changes: ChangeEntry[]
): Promise<string> {
  const existingPr = await gh.openPr(PR_BRANCH, base)
  let branchSha = await gh.refShaOrNull(PR_BRANCH)

  if (branchSha && !existingPr) {
    // design-tokens is a bot-owned scratch branch — when nothing has it open
    // as a PR, its tree can predate files main has since added (it's
    // long-lived), which would poison the next merge if we stacked onto it.
    // No force-push semantics needed: delete + recreate from base head.
    await gh.deleteBranch(PR_BRANCH)
    branchSha = null
    log(`"${PR_BRANCH}" was stale — reset to ${base} head.`)
  }

  const baseSha = branchSha ?? (await gh.refSha(base))
  const baseTree = await gh.commitTree(baseSha)
  const treeSha = await gh.createTree(baseTree, files)

  // If the new tree is identical to the parent's (e.g. a re-push whose edits
  // already live on design-tokens), skip the commit to avoid empty commits.
  if (treeSha === baseTree) {
    log('Changes already present on the branch — no new commit.', 'ok')
    return existingPr?.html_url ?? '(open a PR for design-tokens on GitHub)'
  }

  const commitSha = await gh.createCommit(commitMessage(changes), treeSha, baseSha)

  if (branchSha) {
    await gh.updateBranch(PR_BRANCH, commitSha) // fast-forward (parent = branch head)
    log(`Pushed to existing "${PR_BRANCH}".`)
  } else {
    await gh.createBranch(PR_BRANCH, commitSha)
    log(`Created "${PR_BRANCH}".`)
  }

  if (existingPr) {
    await gh.createPrComment(existingPr.number, changesSection(changes))
    log(`Commented change summary on PR #${existingPr.number}.`)
    return existingPr.html_url
  }
  const body = `${PR_BODY_INTRO}\n\n${changesSection(changes)}`
  return gh.createPr(PR_BRANCH, base, PR_TITLE, body)
}
