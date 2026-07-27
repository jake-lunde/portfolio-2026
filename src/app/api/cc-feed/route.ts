import { NextResponse } from 'next/server'
import { del, list, put } from '@vercel/blob'
import { isCrewId } from '@/components/shell/crew'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* COST NOTE — read this before touching the GET path.
   Every readFeed() costs a Blob `list()`, which is a BILLED operation, and
   this endpoint is polled by a chip that sits on the desktop forever. One
   browser left open overnight was quietly spending thousands of ops. Three
   defences, cheapest first:
     1. the CDN answers most polls (s-maxage below), so they never reach us
     2. a module-scope cache answers most of the rest — serverless instances
        are reused, so a burst of misses still costs ONE list()
     3. the clients don't poll a hidden tab at all (see CommandWidget)
   A write invalidates the cache in-process; other instances catch up within
   FEED_TTL_MS. This is a deck of build telemetry — 20 seconds of staleness
   is free, and a billed op per visitor per 20s is not. */
const FEED_TTL_MS = 20_000
const EDGE_TTL_S = 20

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

const ACTIONS = ['dispatch', 'status', 'return', 'review', 'merge', 'prompt', 'curate'] as const

type FeedEvent = {
  t: number
  agent: string
  action: (typeof ACTIONS)[number]
  target?: string
  label: string
  redact?: boolean
}

/* A report naming a unit that doesn't exist is a bug in the reporter,
   and it used to reach the deck as "--AGENT · --task". Now it is
   rejected on write AND filtered on read, so a feed that already has
   junk in it heals itself on the next GET instead of needing a --reset. */
const wellFormed = (e: FeedEvent) =>
  typeof e?.t === 'number' &&
  typeof e?.label === 'string' &&
  isCrewId(e?.agent) &&
  (e.target === undefined || isCrewId(e.target)) &&
  (ACTIONS as readonly string[]).includes(e?.action)

let cache: { at: number; data: { updated: number; events: FeedEvent[] } } | null = null

/** The cached read every GET goes through. Only a cache MISS costs a
    `list()`; a write clears it so the next read is honest. */
async function readFeedCached(): Promise<{ updated: number; events: FeedEvent[] }> {
  if (cache && Date.now() - cache.at < FEED_TTL_MS) return cache.data
  const data = await readFeed()
  cache = { at: Date.now(), data }
  return data
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
      events: Array.isArray(d.events) ? d.events.filter(wellFormed).slice(-MAX_EVENTS) : [],
    }
  } catch {
    return { updated: 0, events: [] }
  }
}

export async function GET() {
  if (!storeId()) return NextResponse.json({ updated: 0, events: [] })
  return NextResponse.json(await readFeedCached(), {
    // the CDN absorbs the polling: N visitors × a poll each collapse to one
    // origin hit per window, and a stale answer still serves while it refreshes
    headers: {
      'Cache-Control': `public, s-maxage=${EDGE_TTL_S}, stale-while-revalidate=60`,
    },
  })
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
    .filter(wellFormed)
    .map((e) => ({ ...e, label: e.label.slice(0, 60) }))

  // a writer must not read its own stale cache
  cache = null
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
  cache = { at: Date.now(), data: payload }
  return NextResponse.json({ ok: true, count: events.length })
}
