import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

/* Suggestion box — write-only ledger. One blob per idea under
   suggestions/ in the same store the guestbook uses (OIDC + store id,
   no read-write token). Deliberately no GET: suggestions are for Jake,
   read from the store dashboard, never republished to visitors. The
   score rides along because future-Jake deserves to know what DOPPLER
   thought. */

type Suggestion = {
  idea: string
  score: number
  verdict: string
  ts: number // epoch ms, recorded server-side
}

const MAX_IDEA = 140
const MAX_VERDICT = 60

const storeId = () =>
  process.env.suggestions_STORE_ID ??
  process.env.guestbook_STORE_ID ??
  process.env.BLOB_STORE_ID

const hasStore = () => Boolean(storeId() ?? process.env.BLOB_READ_WRITE_TOKEN)

// per-instance cooldown — best-effort, resets on cold start
const lastPost = new Map<string, number>()
const COOLDOWN_MS = 5000

export async function POST(req: Request) {
  if (!hasStore()) {
    return NextResponse.json(
      { error: 'The box is not connected to storage yet.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { idea, score, verdict, website } = (body ?? {}) as Record<string, unknown>

  // honeypot — real visitors never fill this
  if (typeof website === 'string' && website.length > 0) {
    return NextResponse.json({ ok: true })
  }

  const cleanIdea = typeof idea === 'string' ? idea.trim().slice(0, MAX_IDEA) : ''
  if (!cleanIdea) {
    return NextResponse.json({ error: 'An idea is required. Even a bad one.' }, { status: 400 })
  }
  const cleanScore =
    typeof score === 'number' && Number.isFinite(score)
      ? Math.min(100, Math.max(0, Math.round(score)))
      : 0
  const cleanVerdict = typeof verdict === 'string' ? verdict.slice(0, MAX_VERDICT) : ''

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  if (now - (lastPost.get(ip) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json({ error: 'One idea at a time — the box is small.' }, { status: 429 })
  }
  lastPost.set(ip, now)

  const entry: Suggestion = { idea: cleanIdea, score: cleanScore, verdict: cleanVerdict, ts: now }
  await put(
    `suggestions/${now}-${Math.random().toString(36).slice(2, 8)}.json`,
    JSON.stringify(entry),
    { access: 'public', addRandomSuffix: false, contentType: 'application/json', storeId: storeId() }
  )
  return NextResponse.json({ ok: true })
}
