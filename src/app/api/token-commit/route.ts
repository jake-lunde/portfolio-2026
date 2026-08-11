import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { GitHub, parseRepo } from '@/lib/github'
import {
  applyTokenEdits,
  BASE_THEME,
  isTokenTheme,
  MAX_EDITS,
  serializeTokens,
  themeFilePath,
  type TokenEdit,
  type TokenTheme,
  type TokenTree,
} from '@/lib/tokenEdit'
import { PALETTE } from '@/lib/palette'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* INSPECT.MODE token commit (SYS-21). The live nudge re-casts a semantic
   role to a core primitive and previews it across the whole desktop; SAVE
   sends that re-cast here, and here it becomes a real edit to
   tokens/semantic/<theme>.json on a branch, as a PULL REQUEST.
   Jake's ruling: copy commits go straight to main, TOKEN commits do not.
   A token edit moves every skin downstream of it, so it gets reviewed.

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

const REPO_SLUG = process.env.GITHUB_COPY_REPO ?? 'jake-lunde/portfolio-2026'
const BASE_BRANCH = 'main'
/** One long-lived branch, like the Figma bridge's — a fresh branch per nudge
    would litter the repo with one-line PRs nobody closes. */
const PR_BRANCH = 'inspect-tune'
const PR_BODY_INTRO =
  'Opened from INSPECT.MODE — a semantic role re-cast to a core primitive in the ' +
  'live inspector, committed as a token edit.\n\n' +
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

/** Read a theme file at `ref` — text and blob sha from one response, so the
    sha the client round-trips as baseSha always describes the text it was
    shown. Null when GitHub says 404. */
async function readTheme(
  gh: GitHub,
  theme: TokenTheme,
  ref: string,
): Promise<{ sha: string; content: string } | null> {
  const file = await gh.getFileBase64(themeFilePath(theme), ref)
  if (!file) return null
  return { sha: file.sha, content: Buffer.from(file.base64, 'base64').toString('utf8') }
}

function parseTree(text: string): TokenTree | null {
  try {
    const json: unknown = JSON.parse(text)
    if (!json || typeof json !== 'object' || Array.isArray(json)) return null
    return json as TokenTree
  } catch {
    return null
  }
}

const paletteName = (token: string) => PALETTE.find((c) => c.token === token)?.name ?? token

/** House machine voice, and the line a reviewer reads first:
    `tune: re-alias accent → nasa/cobalt (classic-light)`. */
function summaryLine(edit: TokenEdit): string {
  const short = edit.token.replace(/^color\//, '')
  return `re-alias ${edit.role} → ${short}`
}

function commitMessage(edits: readonly TokenEdit[], theme: TokenTheme): string {
  if (edits.length === 1) return `tune: ${summaryLine(edits[0])} (${theme})`
  return `tune: re-alias ${edits.length} roles (${theme})`
}

/** The per-role ledger, shared by the PR body (on create) and the PR comment
    (on a second nudge onto an already-open PR). */
function changesSection(
  edits: ReadonlyArray<TokenEdit & { materialized: boolean }>,
  theme: TokenTheme,
): string {
  const lines = edits.map(
    (e) =>
      `- \`${e.role}\` → \`{${e.token.split('/').join('.')}}\` (${paletteName(e.token)})` +
      (e.materialized ? ' — new override, materialized in this theme' : ''),
  )
  return [`## Changes — \`${themeFilePath(theme)}\``, ...lines].join('\n')
}

export async function GET(req: Request) {
  const g = gate(req)
  if ('res' in g) return g.res

  const theme = new URL(req.url).searchParams.get('theme')
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
  // shape only — applyTokenEdits owns the law (semantic tier, palette token)
  const edits: TokenEdit[] = body.edits.map((e: unknown) => ({
    role: String((e as TokenEdit)?.role ?? ''),
    token: String((e as TokenEdit)?.token ?? ''),
  }))

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

  const result = applyTokenEdits(target, base, edits)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const next = serializeTokens(result.json)
  if (next === file.content) {
    return NextResponse.json({ error: 'no change' }, { status: 400 })
  }

  try {
    const pr = await commitAndPr(gh, head, theme, next, result.applied)
    return NextResponse.json({ prNumber: pr.number, prUrl: pr.html_url })
  } catch {
    // never echo the token or a raw github body
    return NextResponse.json({ error: 'github commit failed' }, { status: 502 })
  }
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
  theme: TokenTheme,
  content: string,
  applied: ReadonlyArray<TokenEdit & { materialized: boolean }>,
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
  const treeSha = await gh.createTree(baseTree, [{ path: themeFilePath(theme), content }])
  const commitSha = await gh.createCommit(commitMessage(applied, theme), treeSha, parentSha)

  if (branchSha) await gh.updateBranch(PR_BRANCH, commitSha)
  else await gh.createBranch(PR_BRANCH, commitSha)

  const changes = changesSection(applied, theme)
  if (existingPr) {
    await gh.createPrComment(existingPr.number, changes)
    return { number: existingPr.number, html_url: existingPr.html_url }
  }
  return gh.createPr(
    PR_BRANCH,
    BASE_BRANCH,
    commitMessage(applied, theme),
    `${PR_BODY_INTRO}\n\n${changes}`,
  )
}
