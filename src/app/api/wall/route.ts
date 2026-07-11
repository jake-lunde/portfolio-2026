import { NextResponse } from 'next/server'
import { del, list, put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* Public photo wall — moderated. Visitors POST a booth snap (base64 JPEG)
   which lands in wall/pending/ for review. Jake reviews at /wall-review
   (guarded by CC_FEED_KEY) and approves into wall/live/ (max 3, oldest
   pruned) or rejects (deleted). Same Blob store + OIDC storeId pattern as
   the guestbook — no read-write token is injected in this setup. */

const storeId = () => process.env.guestbook_STORE_ID ?? process.env.BLOB_STORE_ID

const MAX_LIVE = 3
const MAX_PENDING = 24
const MAX_PHOTO_BYTES = 200_000
const COOLDOWN_MS = 60_000
const JPEG_DATA_URL = /^data:image\/jpeg;base64,/

// per-instance cooldown — best-effort, resets on cold start
const lastPost = new Map<string, number>()

export async function GET(req: Request) {
  const url = new URL(req.url)

  if (url.searchParams.get('admin') === '1') {
    const key = url.searchParams.get('key')
    if (!key || key !== process.env.CC_FEED_KEY) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    if (!storeId()) return NextResponse.json({ pending: [] })

    const { blobs } = await list({ prefix: 'wall/pending/', storeId: storeId() })
    const pending = blobs
      .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
      .map((b) => ({ pathname: b.pathname, url: b.downloadUrl ?? b.url, uploadedAt: b.uploadedAt }))
    return NextResponse.json({ pending })
  }

  if (!storeId()) return NextResponse.json({ photos: [] })
  const { blobs } = await list({ prefix: 'wall/live/', storeId: storeId() })
  const photos = blobs
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
    .slice(0, MAX_LIVE)
    .map((b) => b.url)
  return NextResponse.json({ photos })
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const b = (body ?? {}) as Record<string, unknown>

  // ---- admin actions (review desk) ----
  if (b.admin === true) {
    const key = typeof b.key === 'string' ? b.key : ''
    if (!key || key !== process.env.CC_FEED_KEY) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    if (!storeId()) {
      return NextResponse.json({ error: 'no store' }, { status: 503 })
    }

    const pathname = typeof b.pathname === 'string' ? b.pathname : ''
    const verdict = b.verdict === 'approve' || b.verdict === 'reject' ? b.verdict : null
    if (!pathname || !verdict) {
      return NextResponse.json({ error: 'bad request' }, { status: 400 })
    }

    if (verdict === 'reject') {
      await del(pathname, { storeId: storeId() })
      return NextResponse.json({ ok: true })
    }

    // approve — copy pending blob content into wall/live/, then delete the pending blob
    const { blobs: found } = await list({ prefix: pathname, storeId: storeId() })
    const source = found[0]
    if (!source) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    const res = await fetch(source.downloadUrl ?? source.url, { cache: 'no-store' })
    const buffer = Buffer.from(await res.arrayBuffer())
    await put(`wall/live/${Date.now()}.jpg`, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/jpeg',
      storeId: storeId(),
    })
    await del(pathname, { storeId: storeId() })

    // prune wall/live/ to the 3 newest
    const { blobs: liveBlobs } = await list({ prefix: 'wall/live/', storeId: storeId() })
    const overflow = liveBlobs
      .sort((a, b2) => +new Date(b2.uploadedAt) - +new Date(a.uploadedAt))
      .slice(MAX_LIVE)
    await Promise.all(overflow.map((o) => del(o.pathname, { storeId: storeId() })))

    return NextResponse.json({ ok: true })
  }

  // ---- visitor submission (booth snap for review) ----
  if (!storeId()) {
    return NextResponse.json(
      { error: 'The wall is not connected to storage yet.' },
      { status: 503 }
    )
  }

  const { photo, website } = b as { photo?: unknown; website?: unknown }

  // honeypot — real visitors never fill this
  if (typeof website === 'string' && website.length > 0) {
    return NextResponse.json({ ok: true })
  }

  if (typeof photo !== 'string' || !JPEG_DATA_URL.test(photo)) {
    return NextResponse.json({ error: 'Invalid photo.' }, { status: 400 })
  }

  const base64 = photo.replace(JPEG_DATA_URL, '')
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.byteLength > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: 'Photo too large.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  if (now - (lastPost.get(ip) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json(
      { error: 'One snap at a time — try again in a moment.' },
      { status: 429 }
    )
  }
  lastPost.set(ip, now)

  await put(
    `wall/pending/${now}-${Math.random().toString(36).slice(2, 8)}.jpg`,
    buffer,
    { access: 'public', addRandomSuffix: false, contentType: 'image/jpeg', storeId: storeId() }
  )

  // prune pending overflow beyond MAX_PENDING (oldest first)
  const { blobs: pendingBlobs } = await list({ prefix: 'wall/pending/', storeId: storeId() })
  if (pendingBlobs.length > MAX_PENDING) {
    const overflow = pendingBlobs
      .sort((a, b2) => +new Date(a.uploadedAt) - +new Date(b2.uploadedAt))
      .slice(0, pendingBlobs.length - MAX_PENDING)
    await Promise.all(overflow.map((o) => del(o.pathname, { storeId: storeId() })))
  }

  return NextResponse.json({ ok: true })
}
