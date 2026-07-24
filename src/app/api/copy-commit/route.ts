import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* EDIT.MODE (SYS-99) commit endpoint. Jake's in-place copy editor reads the
   current copy.json sha here, then commits edited slots straight to main via
   the GitHub Contents API — no CMS, no library, plain fetch.

   Auth: shared secret EDIT_MODE_KEY, compared timing-safe against the
   x-edit-key header. The secret NEVER ships to the client and is NEVER
   logged or echoed in an error body. Commit auth: GITHUB_COPY_TOKEN
   (server-only). Repo: GITHUB_COPY_REPO ("owner/repo") or the fallback. */

const REPO = process.env.GITHUB_COPY_REPO ?? 'jake-lunde/portfolio-2026'
const FILE_PATH = 'src/content/copy.json'
const BRANCH = 'main'
const GH = 'https://api.github.com'
const SKIN_SLOTS = ['medieval', 'underwater'] as const

type CopyEntry = string | ({ base: string } & Record<string, string>)
type Edit = { key: string; slot: string; value: string }

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

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

/** Fetch copy.json from main. Returns decoded content + blob sha. */
async function fetchCopy(
  token: string,
): Promise<{ sha: string; content: string } | { error: string; status: number }> {
  const res = await fetch(
    `${GH}/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
    { headers: ghHeaders(token), cache: 'no-store' },
  )
  if (!res.ok) return { error: 'github read failed', status: res.status }
  const json = (await res.json()) as { sha?: string; content?: string }
  if (!json.sha || typeof json.content !== 'string') {
    return { error: 'unexpected github response', status: 502 }
  }
  const content = Buffer.from(json.content, 'base64').toString('utf8')
  return { sha: json.sha, content }
}

/** Apply an edit to the parsed map in place, preserving key order and the
    string-vs-variant-map shape rule (base on a string stays a string; a skin
    slot on a string promotes to { base: <old string>, <skin>: value }). */
function applyEdit(data: Record<string, CopyEntry>, edit: Edit): void {
  const { key, slot, value } = edit
  const entry = data[key]
  if (slot === 'base') {
    if (entry !== null && typeof entry === 'object') entry.base = value
    else data[key] = value // string or new key stays a plain string
    return
  }
  // skin slot
  if (entry !== null && typeof entry === 'object') {
    entry[slot] = value
  } else {
    data[key] = { base: typeof entry === 'string' ? entry : '', [slot]: value }
  }
}

export async function GET(req: Request) {
  const auth = authState(req)
  if (auth === 'nokey') {
    return NextResponse.json({ error: 'edit mode not configured' }, { status: 501 })
  }
  if (auth === 'bad') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const token = process.env.GITHUB_COPY_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'commit token not configured' }, { status: 501 })
  }
  const file = await fetchCopy(token)
  if ('error' in file) {
    return NextResponse.json({ error: file.error }, { status: file.status })
  }
  return NextResponse.json({ sha: file.sha, content: file.content })
}

export async function POST(req: Request) {
  const auth = authState(req)
  if (auth === 'nokey') {
    return NextResponse.json({ error: 'edit mode not configured' }, { status: 501 })
  }
  if (auth === 'bad') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const token = process.env.GITHUB_COPY_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'commit token not configured' }, { status: 501 })
  }

  let body: { baseSha?: string; edits?: Edit[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  const baseSha = typeof body.baseSha === 'string' ? body.baseSha : ''
  const edits = (Array.isArray(body.edits) ? body.edits : [])
    .filter(
      (e): e is Edit =>
        !!e &&
        typeof e.key === 'string' &&
        typeof e.value === 'string' &&
        (e.slot === 'base' || (SKIN_SLOTS as readonly string[]).includes(e.slot)),
    )
    .map((e) => ({ key: e.key, slot: e.slot, value: e.value.slice(0, 4000) }))
    .slice(0, 200)

  if (!baseSha || edits.length === 0) {
    return NextResponse.json({ error: 'baseSha and at least one edit required' }, { status: 400 })
  }

  const file = await fetchCopy(token)
  if ('error' in file) {
    return NextResponse.json({ error: file.error }, { status: file.status })
  }

  // Optimistic-concurrency guard — the client re-applies onto fresh content
  // and re-presents the diff for approval.
  if (file.sha !== baseSha) {
    return NextResponse.json({ sha: file.sha, content: file.content }, { status: 409 })
  }

  let data: Record<string, CopyEntry>
  try {
    data = JSON.parse(file.content) as Record<string, CopyEntry>
  } catch {
    return NextResponse.json({ error: 'copy.json is not valid JSON' }, { status: 500 })
  }

  for (const edit of edits) applyEdit(data, edit)

  const next = JSON.stringify(data, null, 2) + '\n'
  const message = `COPY: EDIT.MODE — ${edits.length} key${edits.length === 1 ? '' : 's'}`

  const put = await fetch(`${GH}/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: ghHeaders(token),
    body: JSON.stringify({
      message,
      content: Buffer.from(next, 'utf8').toString('base64'),
      sha: file.sha,
      branch: BRANCH,
    }),
  })

  if (!put.ok) {
    // never echo the token or raw github body
    if (put.status === 409) {
      const fresh = await fetchCopy(token)
      if (!('error' in fresh)) {
        return NextResponse.json({ sha: fresh.sha, content: fresh.content }, { status: 409 })
      }
    }
    return NextResponse.json({ error: 'github commit failed' }, { status: put.status })
  }

  const result = (await put.json()) as { content?: { sha?: string }; commit?: { sha?: string } }
  return NextResponse.json({
    ok: true,
    sha: result.content?.sha ?? null,
    commit: result.commit?.sha ?? null,
    keys: edits.length,
  })
}
