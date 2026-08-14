import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* EDIT.MODE key gate. The editor POSTs the entered key in the x-edit-key
   header; we compare it timing-safe against EDIT_MODE_KEY and answer only
   ok / rejected / not-configured. The secret never leaves the server and is
   never logged. On ok the client caches the key in sessionStorage and sends
   it as x-edit-key on every /api/copy-commit call. */

/* Ten wrong guesses an hour per IP, then 429. Per-instance and
   best-effort, the same bargain the AI chat's cooldown makes (see
   api/ai-chat): a cold start or a second lambda resets the count, and
   that is fine. This is not the security boundary — the key is long and
   the compare is timing-safe — it is there so a script cannot sit on this
   endpoint all afternoon for free. A CORRECT key does not count against
   the window and clears it, so Jake re-arming in ten tabs never locks
   himself out. */
const FAILS = new Map<string, { n: number; until: number }>()
const WINDOW_MS = 60 * 60 * 1000
const MAX_FAILS = 10

export async function POST(req: Request) {
  const secret = process.env.EDIT_MODE_KEY
  if (!secret) {
    return NextResponse.json({ error: 'edit mode not configured' }, { status: 501 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const seen = FAILS.get(ip)
  if (seen && seen.until > now && seen.n >= MAX_FAILS) {
    return NextResponse.json({ error: 'too many attempts' }, { status: 429 })
  }

  const provided = req.headers.get('x-edit-key') ?? ''
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  const ok = a.length === b.length && timingSafeEqual(a, b)
  if (!ok) {
    const live = seen && seen.until > now ? seen : { n: 0, until: now + WINDOW_MS }
    FAILS.set(ip, { n: live.n + 1, until: live.until })
    // one sweep per rejection keeps the map from growing forever without
    // a timer holding the instance awake
    for (const [k, v] of FAILS) if (v.until <= now) FAILS.delete(k)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  FAILS.delete(ip)
  return NextResponse.json({ ok: true })
}
