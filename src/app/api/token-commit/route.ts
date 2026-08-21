import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { GitHub, parseRepo } from '@/lib/github'
import {
  applyComponentEdits,
  applyTokenEdits,
  BASE_THEME,
  componentFilePath,
  isTokenTheme,
  MAX_EDITS,
  serializeComponentTokens,
  serializeTokens,
  themeFilePath,
  validateEdit,
  type TokenEdit,
  type TokenTheme,
  type TokenTree,
} from '@/lib/tokenEdit'
import { PALETTE } from '@/lib/palette'
import { candidatesFor, COMPONENT_IDS, componentIdOf } from '@/lib/styleCandidates'
import { TOKEN_TIERS } from '@/lib/tokens.generated'
import { REPO_SLUG as DEFAULT_REPO } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* INSPECT.MODE token commit (SYS-21). The live nudge re-casts a semantic
   role to a core primitive and previews it across the whole desktop; SAVE
   sends that re-cast here, and here it becomes a real edit to
   tokens/semantic/<theme>.json on a branch, as a PULL REQUEST.
   Jake's ruling: copy commits go straight to main, TOKEN commits do not.
   A token edit moves every skin downstream of it, so it gets reviewed.

   STYLER (s99) sends its rebinds down the same pipe, and the route sorts
   them by TIER rather than by caller: a semantic role edits the theme file,
   a component property edits tokens/component/<id>.json. One request can
   carry both — they are one intent, and splitting them across two PRs would
   ask a reviewer to hold half a change in their head — so the files are
   written in ONE commit onto the same branch, and the ledger names each file.

   The strict gate is CI, not this route: .github/workflows/tokens-sync.yml
   fires on any PR touching tokens/** and runs
   `tokens:doctor --strict --parity origin/main` — collisions, broken refs,
   AA contrast, orphans. What this route owes CI is a PR that is worth
   running: right theme file, known semantic COLOR role, a value that is one
   of the twelve palette primitives, never a raw hex. Everything past that
   is the doctor's job.

   Auth mirrors /api/copy-commit exactly — same shared secret EDIT_MODE_KEY,
   compared timing-safe against x-edit-key, so one arming covers both modes.
   The secret and GITHUB_COPY_TOKEN never ship to the client and are never
   logged or echoed; GitHub's own error bodies are never forwarded either. */

const REPO_SLUG = process.env.GITHUB_COPY_REPO ?? DEFAULT_REPO
const BASE_BRANCH = 'main'
/** One long-lived branch, like the Figma bridge's — a fresh branch per nudge
    would litter the repo with one-line PRs nobody closes. */
const PR_BRANCH = 'inspect-tune'
const PR_BODY_INTRO =
  'Opened from the live inspector — a semantic role re-cast to a core primitive, ' +
  'or a component property re-bound to a semantic role, committed as a token edit.\n\n' +
  'CI regenerates `src/styles/tokens.generated.css` and runs the token doctor ' +
  '(`--strict --parity origin/main`); Chromatic diffs the result.'

/** 'nokey' → EDIT_MODE_KEY unset (501); 'bad' → wrong key (401); 'ok'. */
function authState(req: Request): 'nokey' | 'bad' | 'ok' {
  const secret = process.env.EDIT_MODE_KEY
  if (!secret) return 'nokey'
  const provided = req.headers.get('x-edit-key') ?? ''
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  if (a.length !== b.length) return 'bad'
  return timingSafeEqual(a, b) ? 'ok' : 'bad'
}

type Gate = { gh: GitHub } | { res: NextResponse }

/** Auth + config in one place: both verbs need exactly this preamble. */
function gate(req: Request): Gate {
  const auth = authState(req)
  if (auth === 'nokey') {
    return { res: NextResponse.json({ error: 'edit mode not configured' }, { status: 501 }) }
  }
  if (auth === 'bad') {
    return { res: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  const token = process.env.GITHUB_COPY_TOKEN
  if (!token) {
    return { res: NextResponse.json({ error: 'commit token not configured' }, { status: 501 }) }
  }
  try {
    return { gh: new GitHub(token, parseRepo(REPO_SLUG)) }
  } catch {
    // a malformed GITHUB_COPY_REPO is a deployment fault, not a bad request
    return { res: NextResponse.json({ error: 'repo not configured' }, { status: 501 }) }
  }
}

/* ---- THE EDITABLE HEAD ----

   The thing this route is allowed to build on is NOT always main. Once a
   nudge has opened a PR, inspect-tune carries edits main has never seen, and
   the mode's own lifecycle makes a second save the NORMAL case: leaving
   INSPECT.MODE calls resetAll, so the visitor re-enters with an empty
   pending set and saves a different role next time. Reading from main and
   committing onto inspect-tune would hand GitHub a tree built from a file
   that never had the first edit in it — silently reverting it, inside the
   very PR that proposed it.

   So every read, the 409 guard and the commit parent all resolve against ONE
   ref: inspect-tune when a PR is holding it open, otherwise main. */
type Head = { ref: string; pr: { html_url: string; number: number } | null }

async function editableHead(gh: GitHub): Promise<Head> {
  const pr = await gh.openPr(PR_BRANCH, BASE_BRANCH)
  return { ref: pr ? PR_BRANCH : BASE_BRANCH, pr }
}

/** Read a token file at `ref` — text and blob sha from one response, so the
    sha the client round-trips as baseSha always describes the text it was
    shown. Null when GitHub says 404. */
async function readTokenFile(
  gh: GitHub,
  path: string,
  ref: string,
): Promise<{ sha: string; content: string } | null> {
  const file = await gh.getFileBase64(path, ref)
  if (!file) return null
  return { sha: file.sha, content: Buffer.from(file.base64, 'base64').toString('utf8') }
}

const readTheme = (gh: GitHub, theme: TokenTheme, ref: string) =>
  readTokenFile(gh, themeFilePath(theme), ref)

function parseTree(text: string): TokenTree | null {
  try {
    const json: unknown = JSON.parse(text)
    if (!json || typeof json !== 'object' || Array.isArray(json)) return null
    return json as TokenTree
  } catch {
    return null
  }
}

/** The human name of a target, whichever list it came from: the palette for a
    semantic re-cast, the row's own candidate list for a component rebind.
    Falls back to the path so a ledger line is never blank. */
function targetName(edit: TokenEdit): string {
  const palette = PALETTE.find((c) => c.token === edit.token)
  if (palette) return palette.name
  return candidatesFor(edit.role).find((c) => c.token === edit.token)?.name ?? edit.token
}

/** One file's worth of applied edits. `label` is what the commit subject names
    the scope by — the theme for a semantic edit, the component id for a
    rebind — because that is the word a reviewer scans the subject line for. */
type Change = {
  path: string
  label: string
  content: string
  applied: ReadonlyArray<TokenEdit & { materialized: boolean }>
}

/** House machine voice, and the line a reviewer reads first:
    `tune: re-alias accent → nasa/cobalt (classic-light)`. */
function summaryLine(edit: TokenEdit): string {
  const short = edit.token.replace(/^color\//, '')
  return `re-alias ${edit.role} → ${short}`
}

function commitMessage(changes: readonly Change[]): string {
  const all = changes.flatMap((ch) => ch.applied)
  const scope = changes.map((ch) => ch.label).join(', ')
  if (all.length === 1) return `tune: ${summaryLine(all[0])} (${scope})`
  return `tune: re-alias ${all.length} roles (${scope})`
}

/** The per-role ledger, shared by the PR body (on create) and the PR comment
    (on a second nudge onto an already-open PR). One section per file, so a
    request that moved both tiers reads as two lists, not one blurred one. */
function changesSection(changes: readonly Change[]): string {
  return changes
    .map((ch) =>
      [
        `## Changes — \`${ch.path}\``,
        ...ch.applied.map(
          (e) =>
            `- \`${e.role}\` → \`{${e.token.split('/').join('.')}}\` (${targetName(e)})` +
            (e.materialized ? ' — new override, materialized in this theme' : ''),
        ),
      ].join('\n'),
    )
    .join('\n\n')
}

export async function GET(req: Request) {
  const g = gate(req)
  if ('res' in g) return g.res

  /* `?component=<id>` serves a component set instead of a theme set — STYLER
     needs the current file to show what a row is bound to, and it has to read
     it from the SAME editable head the commit will parent, or the panel would
     draw values a pending PR has already moved. */
  const params = new URL(req.url).searchParams
  const component = params.get('component')
  if (component !== null) {
    if (!(COMPONENT_IDS as readonly string[]).includes(component)) {
      return NextResponse.json({ error: 'unknown component' }, { status: 400 })
    }
    try {
      const head = await editableHead(g.gh)
      const file = await readTokenFile(g.gh, componentFilePath(component), head.ref)
      if (!file) return NextResponse.json({ error: 'github read failed' }, { status: 502 })
      return NextResponse.json({ sha: file.sha, content: file.content })
    } catch {
      return NextResponse.json({ error: 'github read failed' }, { status: 502 })
    }
  }

  const theme = params.get('theme')
  if (!isTokenTheme(theme)) {
    return NextResponse.json({ error: 'unknown theme' }, { status: 400 })
  }

  try {
    const head = await editableHead(g.gh)
    const file = await readTheme(g.gh, theme, head.ref)
    if (!file) return NextResponse.json({ error: 'github read failed' }, { status: 502 })
    return NextResponse.json({ sha: file.sha, content: file.content })
  } catch {
    return NextResponse.json({ error: 'github read failed' }, { status: 502 })
  }
}

export async function POST(req: Request) {
  const g = gate(req)
  if ('res' in g) return g.res
  const gh = g.gh

  let body: { theme?: unknown; baseSha?: unknown; edits?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  const theme = body.theme
  if (!isTokenTheme(theme)) {
    return NextResponse.json({ error: 'unknown theme' }, { status: 400 })
  }
  const baseSha = typeof body.baseSha === 'string' ? body.baseSha : ''
  if (!baseSha) {
    return NextResponse.json({ error: 'baseSha required' }, { status: 400 })
  }
  if (!Array.isArray(body.edits) || body.edits.length === 0) {
    return NextResponse.json({ error: 'at least one edit required' }, { status: 400 })
  }
  if (body.edits.length > MAX_EDITS) {
    return NextResponse.json({ error: `too many edits (max ${MAX_EDITS})` }, { status: 400 })
  }
  // shape only — the apply functions own the law (tier, ramp, palette)
  const edits: TokenEdit[] = body.edits.map((e: unknown) => ({
    role: String((e as TokenEdit)?.role ?? ''),
    token: String((e as TokenEdit)?.token ?? ''),
  }))

  /* Validate BEFORE splitting. The partition below sorts by tier, and a role
     the manifest doesn't know has no tier to sort into — filtering first
     would drop it silently and answer 'no change' to a request that was
     actually illegal. One gate, then the split. */
  for (const edit of edits) {
    const bad = validateEdit(edit)
    if (bad) return NextResponse.json({ error: bad }, { status: 400 })
  }
  const semanticEdits = edits.filter((e) => TOKEN_TIERS[`--${e.role}`] === 'semantic')
  const componentEdits = edits.filter((e) => TOKEN_TIERS[`--${e.role}`] === 'component')

  let head: Head
  let file: { sha: string; content: string } | null
  let baseFile: { sha: string; content: string } | null
  try {
    head = await editableHead(gh)
    file = await readTheme(gh, theme, head.ref)
    /* The complete set, read ONLY to learn the PATH of an inherited role.
       It stays pinned to main: it is consulted for shape, never for values,
       and a half-finished override sitting on inspect-tune should not change
       where a role lives. */
    baseFile = theme === BASE_THEME ? file : await readTheme(gh, BASE_THEME, BASE_BRANCH)
  } catch {
    return NextResponse.json({ error: 'github read failed' }, { status: 502 })
  }
  if (!file || !baseFile) {
    return NextResponse.json({ error: 'github read failed' }, { status: 502 })
  }

  // Optimistic concurrency, same contract as copy-commit — but against the
  // editable head, which is the revision this commit will actually parent.
  if (file.sha !== baseSha) {
    return NextResponse.json({ sha: file.sha, content: file.content }, { status: 409 })
  }

  const target = parseTree(file.content)
  const base = parseTree(baseFile.content)
  if (!target || !base) {
    return NextResponse.json({ error: 'theme file is not valid JSON' }, { status: 500 })
  }

  /* One list of file writes, built tier by tier. A file whose serialization
     comes back identical is dropped rather than committed — GitHub would take
     it, but it would put a no-op blob in the tree and a line in the ledger
     that claims a change nobody made. */
  const changes: Change[] = []

  if (semanticEdits.length > 0) {
    const result = applyTokenEdits(target, base, semanticEdits)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    const next = serializeTokens(result.json)
    if (next !== file.content) {
      changes.push({
        path: themeFilePath(theme),
        label: theme,
        content: next,
        applied: result.applied,
      })
    }
  }

  /* Component edits, grouped by the component they belong to — one file per
     group, because applyComponentEdits works on exactly one set. The groups
     are read at the SAME editable head as the theme file, so a rebind stacks
     onto whatever the open PR already proposed instead of reverting it. */
  for (const [id, group] of groupByComponent(componentEdits)) {
    const path = componentFilePath(id)
    let componentFile: { sha: string; content: string } | null
    try {
      componentFile = await readTokenFile(gh, path, head.ref)
    } catch {
      return NextResponse.json({ error: 'github read failed' }, { status: 502 })
    }
    if (!componentFile) {
      return NextResponse.json({ error: 'github read failed' }, { status: 502 })
    }
    const tree = parseTree(componentFile.content)
    if (!tree) {
      return NextResponse.json({ error: 'component file is not valid JSON' }, { status: 500 })
    }
    const result = applyComponentEdits(tree, group)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    // component sets are hand-authored and unescaped — see serializeTokens
    const next = serializeComponentTokens(result.json)
    if (next !== componentFile.content) {
      changes.push({ path, label: id, content: next, applied: result.applied })
    }
  }

  if (changes.length === 0) {
    return NextResponse.json({ error: 'no change' }, { status: 400 })
  }

  try {
    const pr = await commitAndPr(gh, head, changes)
    return NextResponse.json({ prNumber: pr.number, prUrl: pr.html_url })
  } catch {
    // never echo the token or a raw github body
    return NextResponse.json({ error: 'github commit failed' }, { status: 502 })
  }
}

/** Component edits in arrival order, bucketed by component id. Insertion
    order is kept so the ledger reads in the order the visitor made the
    changes, not alphabetically. */
function groupByComponent(edits: readonly TokenEdit[]): Map<string, TokenEdit[]> {
  const groups = new Map<string, TokenEdit[]>()
  for (const edit of edits) {
    // validateEdit already refused a component role with no registered
    // component; the fallback keeps the type honest without inventing a path
    const id = componentIdOf(edit.role)
    if (!id) continue
    const group = groups.get(id)
    if (group) group.push(edit)
    else groups.set(id, [edit])
  }
  return groups
}

/* The PR cascade, modelled on the Figma bridge's (figma-plugin/src/code.ts):
   reset the scratch branch when nothing has it open, commit onto it, then
   either comment on the PR that already exists or open a new one. Same fixed
   branch every time, so a second nudge stacks onto the open PR instead of
   opening a second one.

   `head` is the SAME resolution the file was read and sha-guarded against —
   passed in rather than re-derived, so a PR opening between the read and the
   commit cannot make this build on a different ref than the one the guard
   approved. */
async function commitAndPr(
  gh: GitHub,
  head: Head,
  changes: readonly Change[],
): Promise<{ number: number; html_url: string }> {
  const existingPr = head.pr
  let branchSha = await gh.refShaOrNull(PR_BRANCH)

  if (branchSha && !existingPr) {
    // inspect-tune is a bot-owned scratch branch: with no PR holding it open
    // its tree can predate main, which would poison the next merge. Delete
    // and recreate from base head rather than stacking onto stale history.
    await gh.deleteBranch(PR_BRANCH)
    branchSha = null
  }

  const parentSha = branchSha ?? (await gh.refSha(BASE_BRANCH))
  const baseTree = await gh.commitTree(parentSha)
  // every touched file in ONE tree, so both tiers of one intent land as one
  // commit and a reviewer never sees half of it
  const treeSha = await gh.createTree(
    baseTree,
    changes.map((ch) => ({ path: ch.path, content: ch.content })),
  )
  const subject = commitMessage(changes)
  const commitSha = await gh.createCommit(subject, treeSha, parentSha)

  if (branchSha) await gh.updateBranch(PR_BRANCH, commitSha)
  else await gh.createBranch(PR_BRANCH, commitSha)

  const ledger = changesSection(changes)
  if (existingPr) {
    await gh.createPrComment(existingPr.number, ledger)
    return { number: existingPr.number, html_url: existingPr.html_url }
  }
  return gh.createPr(PR_BRANCH, BASE_BRANCH, subject, `${PR_BODY_INTRO}\n\n${ledger}`)
}
