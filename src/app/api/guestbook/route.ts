import { NextResponse } from 'next/server'
import { list, put } from '@vercel/blob'

/* Guestbook ledger — one blob per entry under guestbook/ in the connected
   public store. The store was linked with the env prefix "guestbook", so
   the token arrives as guestbook_READ_WRITE_TOKEN (BLOB_READ_WRITE_TOKEN
   kept as fallback). Race-free (no read-modify-write). Without a token
   (fresh local dev) it degrades to a "ledger not connected" state. */

export type GuestbookEntry = {
  name: string
  note: string
  ts: number // epoch ms, recorded server-side
}

const MAX_NAME = 40
const MAX_NOTE = 280
const MAX_ENTRIES = 200

const blobToken = () =>
  process.env.BLOB_READ_WRITE_TOKEN ?? process.env.guestbook_READ_WRITE_TOKEN

const hasStore = () => Boolean(blobToken())

// per-instance cooldown — best-effort, resets on cold start
const lastPost = new Map<string, number>()
const COOLDOWN_MS = 5000

export async function GET() {
  if (!hasStore()) {
    return NextResponse.json({ entries: [], durable: false })
  }
  const { blobs } = await list({ prefix: 'guestbook/', limit: 1000, token: blobToken() })
  const recent = blobs
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
    .slice(0, MAX_ENTRIES)
  const entries = (
    await Promise.all(
      recent.map(async (b) => {
        try {
          const res = await fetch(b.downloadUrl ?? b.url, { cache: 'no-store' })
          return (await res.json()) as GuestbookEntry
        } catch {
          return null
        }
      })
    )
  ).filter((e): e is GuestbookEntry => e !== null && typeof e.name === 'string')
  entries.sort((a, b) => b.ts - a.ts)
  return NextResponse.json({ entries, durable: true })
}

export async function POST(req: Request) {
  if (!hasStore()) {
    return NextResponse.json(
      { error: 'The ledger is not connected to storage yet.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { name, note, website } = (body ?? {}) as Record<string, unknown>

  // honeypot — real visitors never fill this
  if (typeof website === 'string' && website.length > 0) {
    return NextResponse.json({ ok: true })
  }

  const cleanName = typeof name === 'string' ? name.trim().slice(0, MAX_NAME) : ''
  const cleanNote = typeof note === 'string' ? note.trim().slice(0, MAX_NOTE) : ''
  if (!cleanName || !cleanNote) {
    return NextResponse.json({ error: 'Name and note are both required.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  if (now - (lastPost.get(ip) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json({ error: 'One signature at a time — try again in a moment.' }, { status: 429 })
  }
  lastPost.set(ip, now)

  const entry: GuestbookEntry = { name: cleanName, note: cleanNote, ts: now }
  await put(
    `guestbook/${now}-${Math.random().toString(36).slice(2, 8)}.json`,
    JSON.stringify(entry),
    { access: 'public', addRandomSuffix: false, contentType: 'application/json', token: blobToken() }
  )
  return NextResponse.json({ entry })
}
