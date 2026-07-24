import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* EDIT.MODE key gate. The editor POSTs the entered key in the x-edit-key
   header; we compare it timing-safe against EDIT_MODE_KEY and answer only
   ok / rejected / not-configured. The secret never leaves the server and is
   never logged. On ok the client caches the key in sessionStorage and sends
   it as x-edit-key on every /api/copy-commit call. */

export async function POST(req: Request) {
  const secret = process.env.EDIT_MODE_KEY
  if (!secret) {
    return NextResponse.json({ error: 'edit mode not configured' }, { status: 501 })
  }
  const provided = req.headers.get('x-edit-key') ?? ''
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  const ok = a.length === b.length && timingSafeEqual(a, b)
  if (!ok) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
