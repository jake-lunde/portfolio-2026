import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { del, list, put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* Five stars at the foot of a case study. Same Blob store + OIDC storeId
   pattern as the guestbook / puzzle leaderboard: no *_READ_WRITE_TOKEN env
   is injected in this setup, auth is Vercel OIDC via the store id.
   Versioned pathnames (ratings/votes-<ms>.json) because overwriting one
   path serves stale CDN reads; every write is a new blob, old ones pruned
   to the 3 newest. Read-merge-write on POST (best-effort race safety — a
   star rating doesn't need strict consistency).

   ONE VOTER, ONE VOTE, and re-voting overwrites. That is the whole spam
   answer, so no cookie has to ride along. The voter key is the first 16
   hex of sha256(ip + salt): the blob is public-access, so a raw IP would
   be readable by anyone with the URL. The hash is a dedup key and nothing
   else — it is never stored raw, never returned, and never read back to
   identify anyone. */

const storeId = () => process.env.guestbook_STORE_ID ?? process.env.BLOB_STORE_ID

// mirrors the written cases in src/programs/projects/cases.ts — kept as a
// flat list here so this route doesn't bundle the registry's client components
const RATABLE = new Set(['greenlight-invest', 'family-hub'])

const VOTES_PREFIX = 'ratings/votes-'
const MAX_VOTERS = 2000
const MAX_BODY_BYTES = 256
const COOLDOWN_MS = 2000

type Vote = { s: number; t: number }
type Case = Record<string, Vote>
type Votes = Record<string, Case>

// per-instance cooldown — best-effort, resets on cold start
const lastPost = new Map<string, number>()

function voterId(ip: string): string {
  const salt = process.env.RATING_SALT ?? 'lunde-os'
  return createHash('sha256').update(`${ip}|${salt}`).digest('hex').slice(0, 16)
}

function tally(votes: Case | undefined): { avg: number; count: number } {
  const stars = Object.values(votes ?? {}).map((v) => v.s)
  if (!stars.length) return { avg: 0, count: 0 }
  const sum = stars.reduce((a, b) => a + b, 0)
  return { avg: Math.round((sum / stars.length) * 10) / 10, count: stars.length }
}

async function readVotes(): Promise<Votes> {
  const { blobs } = await list({ prefix: VOTES_PREFIX, limit: 10, storeId: storeId() })
  const blob = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname))[0]
  if (!blob) return {}
  try {
    const res = await fetch(blob.downloadUrl ?? blob.url, { cache: 'no-store' })
    const d = await res.json()
    return d && typeof d === 'object' ? (d as Votes) : {}
  } catch {
    return {}
  }
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug') ?? ''
  if (!RATABLE.has(slug)) {
    return NextResponse.json({ error: 'unknown case' }, { status: 400 })
  }
  if (!storeId()) return NextResponse.json({ avg: 0, count: 0 })
  return NextResponse.json(tally((await readVotes())[slug]))
}

export async function POST(req: Request) {
  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'body too large' }, { status: 413 })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }
  const b = (body ?? {}) as Record<string, unknown>

  const slug = typeof b.slug === 'string' ? b.slug : ''
  if (!RATABLE.has(slug)) {
    return NextResponse.json({ error: 'unknown case' }, { status: 400 })
  }

  const stars = typeof b.stars === 'number' ? b.stars : NaN
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'bad stars' }, { status: 400 })
  }

  if (!storeId()) {
    return NextResponse.json({ error: 'no store' }, { status: 503 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  if (now - (lastPost.get(ip) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json({ error: 'one at a time — try again in a moment' }, { status: 429 })
  }
  lastPost.set(ip, now)

  const votes = await readVotes()
  const forCase: Case = { ...(votes[slug] ?? {}), [voterId(ip)]: { s: stars, t: now } }
  const ids = Object.keys(forCase)
  if (ids.length > MAX_VOTERS) {
    // drop the oldest votes past the cap — the newest MAX_VOTERS survive
    for (const id of ids.sort((a, c) => forCase[a].t - forCase[c].t).slice(0, ids.length - MAX_VOTERS)) {
      delete forCase[id]
    }
  }
  votes[slug] = forCase

  const stamp = String(now).padStart(14, '0')
  await put(`${VOTES_PREFIX}${stamp}.json`, JSON.stringify(votes), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    storeId: storeId(),
  })
  // prune older vote versions (keep the 3 newest)
  try {
    const { blobs } = await list({ prefix: VOTES_PREFIX, limit: 20, storeId: storeId() })
    const stale = blobs.sort((a, c) => c.pathname.localeCompare(a.pathname)).slice(3)
    if (stale.length) await del(stale.map((bl) => bl.url), { storeId: storeId() })
  } catch {
    /* pruning is best-effort */
  }

  return NextResponse.json({ ok: true, ...tally(forCase) })
}
