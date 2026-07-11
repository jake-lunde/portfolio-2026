import { NextResponse } from 'next/server'
import { del, list, put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* COMMAND.CTR live feed. The orchestrating Claude session POSTs event
   batches here (guarded by CC_FEED_KEY); the site GETs them publicly.
   Events marked redact:true carry no label at all server-side won't —
   the REPORTER strips secret text before it ever leaves the machine;
   the flag just tells the UI to draw marker blackouts. Same Blob store
   + OIDC storeId pattern as the guestbook. */

const storeId = () => process.env.guestbook_STORE_ID ?? process.env.BLOB_STORE_ID
// versioned pathnames: overwriting one path serves stale CDN reads (same
// lesson as the guestbook) — every write is a new URL, old ones pruned
const FEED_PREFIX = 'cc/feed-'
const MAX_EVENTS = 80

type FeedEvent = {
  t: number
  agent: string
  action: 'dispatch' | 'status' | 'return' | 'review' | 'merge'
  target?: string
  label: string
  redact?: boolean
}

async function readFeed(): Promise<{ updated: number; events: FeedEvent[] }> {
  const { blobs } = await list({ prefix: FEED_PREFIX, limit: 10, storeId: storeId() })
  const blob = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname))[0]
  if (!blob) return { updated: 0, events: [] }
  try {
    const res = await fetch(blob.downloadUrl ?? blob.url, { cache: 'no-store' })
    const d = await res.json()
    return {
      updated: typeof d.updated === 'number' ? d.updated : 0,
      events: Array.isArray(d.events) ? d.events.slice(-MAX_EVENTS) : [],
    }
  } catch {
    return { updated: 0, events: [] }
  }
}

export async function GET() {
  if (!storeId()) return NextResponse.json({ updated: 0, events: [] })
  return NextResponse.json(await readFeed())
}

export async function POST(req: Request) {
  const key = process.env.CC_FEED_KEY
  if (!key || req.headers.get('x-cc-key') !== key) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!storeId()) {
    return NextResponse.json({ error: 'no store' }, { status: 503 })
  }

  let body: { events?: FeedEvent[]; reset?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  const incoming = (body.events ?? [])
    .filter(
      (e) =>
        typeof e?.t === 'number' &&
        typeof e?.agent === 'string' &&
        typeof e?.label === 'string' &&
        ['dispatch', 'status', 'return', 'review', 'merge'].includes(e?.action)
    )
    .map((e) => ({ ...e, label: e.label.slice(0, 60) }))

  const current = body.reset ? { events: [] as FeedEvent[] } : await readFeed()
  const events = [...current.events, ...incoming].slice(-MAX_EVENTS)
  const payload = { updated: Date.now(), events }

  const stamp = String(Date.now()).padStart(14, '0')
  await put(`${FEED_PREFIX}${stamp}.json`, JSON.stringify(payload), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    storeId: storeId(),
  })
  // prune older feed versions (keep the 3 newest)
  try {
    const { blobs } = await list({ prefix: FEED_PREFIX, limit: 20, storeId: storeId() })
    const stale = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname)).slice(3)
    if (stale.length) await del(stale.map((b) => b.url), { storeId: storeId() })
  } catch {
    /* pruning is best-effort */
  }
  return NextResponse.json({ ok: true, count: events.length })
}
