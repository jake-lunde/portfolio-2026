import { NextResponse } from 'next/server'
import { list, put } from '@vercel/blob'
import { CASES } from '@/programs/projects/cases'

/* Encouragement line — one blob per nudge under nudges/<slug>/ in the
   connected public store. Auth is Vercel OIDC + store id (same fallback
   chain the guestbook uses) — no read-write token is injected in this
   setup. Race-free (no read-modify-write): the count IS the blob count.
   Without a store id (fresh local dev) it degrades to
   { counts: {}, durable: false } and the UI disables its buttons.

   ENV
   · nudge_STORE_ID | guestbook_STORE_ID | BLOB_STORE_ID — blob store.
   · NUDGE_WEBHOOK_URL — OPTIONAL. If set, every nudge POSTs
     { text: "…" } to this URL, which is the payload shape Slack,
     Discord (/slack-compatible endpoints) and ntfy all accept as-is.
     Unset = no notification, silently. Failures never fail the request. */

export type NudgeBlob = {
  slug: string
  ts: number // epoch ms, recorded server-side
}

const SLUGS = new Set(CASES.map((c) => c.slug))

const storeId = () =>
  process.env.nudge_STORE_ID ?? process.env.guestbook_STORE_ID ?? process.env.BLOB_STORE_ID

const hasStore = () => Boolean(storeId() ?? process.env.BLOB_READ_WRITE_TOKEN)

// per-instance cooldown — best-effort, resets on cold start
const lastPost = new Map<string, number>()
const COOLDOWN_MS = 3000

const PREFIX = 'nudges/'
const MAX_PAGES = 20

/** Blob count per slug. pathname is `nudges/<slug>/<ts>-<rand>.json`. */
async function counts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  let cursor: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await list({ prefix: PREFIX, limit: 1000, cursor, storeId: storeId() })
    for (const b of res.blobs) {
      const slug = b.pathname.slice(PREFIX.length).split('/')[0]
      if (slug && SLUGS.has(slug)) out[slug] = (out[slug] ?? 0) + 1
    }
    if (!res.hasMore || !res.cursor) break
    cursor = res.cursor
  }
  return out
}

/** Fire-and-forget ping to Jake. Never throws, never blocks for long. */
async function notify(slug: string, total: number) {
  const url = process.env.NUDGE_WEBHOOK_URL
  if (!url) return
  const c = CASES.find((x) => x.slug === slug)
  const name = c ? `${c.name} (${c.org})` : slug
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `LUNDE OS · someone pressed ENCOURAGE on ${name} — ${total} total. Get back to it.`,
      }),
      signal: AbortSignal.timeout(2500),
    })
  } catch {
    /* a dead webhook must never break the encouragement line */
  }
}

export async function GET() {
  if (!hasStore()) {
    return NextResponse.json({ counts: {}, durable: false })
  }
  try {
    return NextResponse.json({ counts: await counts(), durable: true })
  } catch {
    return NextResponse.json({ counts: {}, durable: false })
  }
}

export async function POST(req: Request) {
  if (!hasStore()) {
    return NextResponse.json(
      { error: 'The encouragement line is not connected to storage yet.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { slug, website } = (body ?? {}) as Record<string, unknown>

  // honeypot — real visitors never fill this
  if (typeof website === 'string' && website.length > 0) {
    return NextResponse.json({ ok: true })
  }

  if (typeof slug !== 'string' || !SLUGS.has(slug)) {
    return NextResponse.json({ error: 'Unknown case study.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  if (now - (lastPost.get(ip) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json(
      { error: 'One nudge at a time — he heard you.' },
      { status: 429 }
    )
  }
  lastPost.set(ip, now)

  // the blob records the nudge, nothing about who sent it
  const entry: NudgeBlob = { slug, ts: now }
  await put(
    `${PREFIX}${slug}/${now}-${Math.random().toString(36).slice(2, 8)}.json`,
    JSON.stringify(entry),
    { access: 'public', addRandomSuffix: false, contentType: 'application/json', storeId: storeId() }
  )

  let total = 0
  try {
    total = (await counts())[slug] ?? 1
  } catch {
    total = 1
  }

  await notify(slug, total)

  return NextResponse.json({ slug, count: total })
}
