import { NextResponse } from 'next/server'
import { del, list, put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* Public jigsaw leaderboard — "BEST — WORLDWIDE". Same Blob store + OIDC
   storeId pattern as the guestbook / cc-feed / wall: no *_READ_WRITE_TOKEN
   env is injected in this setup, auth is Vercel OIDC via the store id.
   Versioned pathnames (puzzle/times-<ms>.json) because overwriting one
   path serves stale CDN reads; every write is a new blob, old ones
   pruned to the 3 newest. Read-merge-write on POST (best-effort race
   safety — a jigsaw leaderboard doesn't need strict consistency). */

const storeId = () => process.env.guestbook_STORE_ID ?? process.env.BLOB_STORE_ID

// mirrors the 5 ids in src/programs/puzzle/puzzleImages.ts — kept as a
// flat list here so this route doesn't bundle the canvas draw functions
const PUZZLE_IDS = new Set(['rings', 'louie', 'crew', 'moat', 'pixellou'])

const TIMES_PREFIX = 'puzzle/times-'
const MAX_PER_PUZZLE = 10
const MAX_BODY_BYTES = 1024

type Score = { name: string; secs: number }
type Board = Record<string, Score[]>

async function readBoard(): Promise<Board> {
  const { blobs } = await list({ prefix: TIMES_PREFIX, limit: 10, storeId: storeId() })
  const blob = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname))[0]
  if (!blob) return {}
  try {
    const res = await fetch(blob.downloadUrl ?? blob.url, { cache: 'no-store' })
    const d = await res.json()
    return d && typeof d === 'object' ? (d as Board) : {}
  } catch {
    return {}
  }
}

export async function GET() {
  if (!storeId()) return NextResponse.json({ times: {} })
  return NextResponse.json({ times: await readBoard() })
}

export async function POST(req: Request) {
  if (!storeId()) {
    return NextResponse.json({ error: 'no store' }, { status: 503 })
  }

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

  const puzzle = typeof b.puzzle === 'string' ? b.puzzle : ''
  if (!PUZZLE_IDS.has(puzzle)) {
    return NextResponse.json({ error: 'unknown puzzle' }, { status: 400 })
  }

  const rawName = typeof b.name === 'string' ? b.name : ''
  const name = (rawName.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim() || 'OPERATOR').slice(0, 12)

  const rawSecs = typeof b.secs === 'number' ? b.secs : NaN
  if (!Number.isFinite(rawSecs)) {
    return NextResponse.json({ error: 'bad secs' }, { status: 400 })
  }
  const secs = Math.round(Math.min(3600, Math.max(5, rawSecs)) * 10) / 10

  const board = await readBoard()
  const list_ = [...(board[puzzle] ?? []), { name, secs }]
    .sort((a, b2) => a.secs - b2.secs)
    .slice(0, MAX_PER_PUZZLE)
  board[puzzle] = list_

  const stamp = String(Date.now()).padStart(14, '0')
  await put(`${TIMES_PREFIX}${stamp}.json`, JSON.stringify(board), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    storeId: storeId(),
  })
  // prune older leaderboard versions (keep the 3 newest)
  try {
    const { blobs } = await list({ prefix: TIMES_PREFIX, limit: 20, storeId: storeId() })
    const stale = blobs.sort((a, b2) => b2.pathname.localeCompare(a.pathname)).slice(3)
    if (stale.length) await del(stale.map((bl) => bl.url), { storeId: storeId() })
  } catch {
    /* pruning is best-effort */
  }

  return NextResponse.json({ ok: true, times: board })
}
