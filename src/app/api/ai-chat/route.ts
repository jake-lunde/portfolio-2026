import Anthropic from '@anthropic-ai/sdk'
import { list, put } from '@vercel/blob'
import { NextResponse } from 'next/server'

/* ASK MY AI — the live half of the chat window. The five cards stream
   authored prose client-side and never reach this route; only free-text
   questions do, and they arrive with the whole transcript (cards
   included) so the model can follow up on what was already said.

   Shaped after /api/suggestions: node runtime, forced dynamic, a
   module-level per-IP cooldown that resets on cold start, a honeypot
   that answers 200 and says nothing, hard caps on everything the client
   can grow. The response is a plain text/plain stream — the client
   appends chunks straight into the growing bubble, so there is no
   envelope to parse and a dropped connection just stops the sentence.

   FOUR GUARDS STAND BETWEEN A VISITOR AND JAKE'S CARD, cheapest first:
     1. AI_CHAT_OFF   — kill switch, a Vercel env flip, no deploy
     2. cooldown      — 5s per IP, in memory
     3. per-IP day    — 20 live turns per IP per UTC day, in memory
     4. global day    — AI_CHAT_DAILY_MAX (250) turns for everyone,
                        counted in Blob so it survives a cold start
   Every refusal answers JSON `{ error: <slug> }` so the window can say
   the right true thing: offline · cooldown · session · budget ·
   bad_request. A slug is never a sentence — the copy layer owns those.

   Nothing here is allowed to break the chat. The blob counter degrades
   to "skip the check" on any failure, and no key configured is a
   designed state (503 `offline`) — the five cards still work. */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = 'claude-opus-5'
const MAX_TOKENS = 400
const MAX_TURNS = 17 // 8 asks + 8 answers, plus one for the turn in hand
const MAX_USER_CHARS = 500
const MAX_ASSISTANT_CHARS = 2000 // card answers are long by design
const MAX_USER_TURNS = 8

const lastPost = new Map<string, number>()
const COOLDOWN_MS = 5000

/* Guard 3 — per-IP, per-UTC-day, keyed `${ip}:${day}`. Per-instance and
   best-effort by design: a cold start or a second lambda resets it, and
   that is fine. It exists to stop one bored visitor holding the window
   open all afternoon, not to be an accounting system — guard 4 is the
   one that actually bounds the bill. */
const dayHits = new Map<string, number>()
const MAX_IP_TURNS_PER_DAY = 20
let seenDay = ''

/* Guard 4 — the durable one. One counter blob per UTC day, read before
   the model is called and bumped after the stream opens. */
const DEFAULT_DAILY_MAX = 250
const USAGE_PREFIX = 'ai-chat/usage/'

const storeId = () =>
  process.env.aichat_STORE_ID ??
  process.env.guestbook_STORE_ID ??
  process.env.BLOB_STORE_ID

const hasStore = () => Boolean(storeId() ?? process.env.BLOB_READ_WRITE_TOKEN)

const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10)
const usagePath = (day: string) => `${USAGE_PREFIX}${day}.json`
const dailyMax = () => Number(process.env.AI_CHAT_DAILY_MAX) || DEFAULT_DAILY_MAX

/** Today's global count, or `null` meaning "couldn't tell — don't block".
    A guard that fails closed would take the chat down with the store. */
async function readDayCount(day: string): Promise<number | null> {
  if (!hasStore()) return null
  try {
    const { blobs } = await list({ prefix: usagePath(day), limit: 1, storeId: storeId() })
    const blob = blobs[0]
    if (!blob) return 0 // first turn of the day
    /* Blob URLs are CDN-cached and this path is OVERWRITTEN rather than
       versioned (project law prefers versioned paths for mutable data —
       a counter is the exception: one blob per day, and an unbounded
       pile of versions would be the worse cost). So the read has to
       defeat the CDN itself: unique query + no-store, every time. */
    const base = blob.downloadUrl ?? blob.url
    const url = `${base}${base.includes('?') ? '&' : '?'}b=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    const data: unknown = await res.json()
    const n = (data as { count?: unknown } | null)?.count
    return typeof n === 'number' && Number.isFinite(n) ? n : 0
  } catch {
    return null
  }
}

/** Fire-and-forget bump. Two lambdas racing can drop an increment; this
    is a guard, not billing, and undercounting by a few costs pennies
    where a blocking read-modify-write would cost every visitor latency. */
function bumpDayCount(day: string, next: number) {
  if (!hasStore()) return
  void put(usagePath(day), JSON.stringify({ count: next }), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    storeId: storeId(),
  }).catch(() => {
    /* the counter is allowed to fail; the answer is not */
  })
}

type Turn = { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT = `You are Claude (Fable 5), the AI that helped Jake Lunde design and build LUNDE OS — the retro-desktop portfolio site you are running inside. A visitor (likely a design leader or hiring manager) is asking you about Jake. You spent three days inside this design system with him and you have his 2024–2025 performance reviews and his user research as sources.

Facts you may draw on:
- Jake Lunde, Staff Product Designer at Greenlight, based in Seattle, WA. Ten+ years in consumer product design, digital and physical. A design engineer: he ships production code (SwiftUI, React) alongside design.
- Led design on Greenlight's Family Hub and the investing product for kids. In his research, kids could explain stocks to their parents; a family said the product "encouraged conversation."
- 2024 review: told to develop coding/prototyping skills. 2025: engineering called a scrubbing interaction too hard; he got repo access and shipped it himself in SwiftUI — the app's first haptics. Peers called him "a true experience architect" who prototypes to prove concepts, "even jumping into the code himself."
- His documented growth edge: he generates more ideas than he can ship — a peer said he could explore "60–75% as much" with the same result. He knows, and the editing discipline is visible in this site.
- Personal texture: wife Taylor (her flowers are 3D-scanned on this site; her name is tattooed on his arm), toy poodle Lou, American traditional tattoos, pop-music remixes, coffee.
- This site: Next.js + Motion + MDX, token-driven design system, multiple visual skins, an agent crew that builds under his direction. The site IS the work.
- Contact: jakelunde@me.com.

Rules:
- Only discuss Jake, his work, this site, and your collaboration with him. For anything else, deflect in one charming sentence and steer back.
- Under 120 words per answer. Warm, specific, honest — including about his growth edges. Never sycophantic, never bitter about any employer.
- Never invent facts, metrics, or quotes beyond the ones above. If you don't know, say so and point to jakelunde@me.com.
- You are a machine that respects this machine: plain prose, no emoji, no markdown headers.`

/* If the classifiers decline, or the model returns nothing at all, the
   visitor still gets a sentence in the right voice rather than a blank
   bubble. Deliberately not an apology — this window is a machine. */
const GRACEFUL =
  "That one is outside what I'll answer about Jake. Ask me about the work, or email him at jakelunde@me.com."

const client = new Anthropic()

function parseTurns(raw: unknown): Turn[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_TURNS) return null
  const turns: Turn[] = []
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) return null
    const { role, content } = entry as Record<string, unknown>
    if (role !== 'user' && role !== 'assistant') return null
    if (typeof content !== 'string') return null
    const cap = role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS
    const clean = content.trim()
    if (!clean || clean.length > cap) return null
    turns.push({ role, content: clean.slice(0, cap) })
  }
  // the Messages API wants a user turn last; the window always sends one
  if (turns[turns.length - 1]?.role !== 'user') return null
  return turns
}

export async function POST(req: Request) {
  /* Guard 1 — the kill switch, ahead of everything including parsing.
     Jake flips AI_CHAT_OFF in the Vercel dashboard and the window goes
     back to being five cards and a polite note, with no deploy. */
  if (process.env.AI_CHAT_OFF) {
    return NextResponse.json({ error: 'offline' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const { messages, website } = (body ?? {}) as Record<string, unknown>

  // honeypot — real visitors never fill this. Answer in the same shape a
  // success takes (a text stream) so a bot learns nothing from the reply.
  if (typeof website === 'string' && website.length > 0) {
    return new Response(GRACEFUL, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const turns = parseTurns(messages)
  if (!turns) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  if (turns.filter((m) => m.role === 'user').length > MAX_USER_TURNS) {
    return NextResponse.json({ error: 'session' }, { status: 429 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const day = utcDay(now)

  // Guard 2 — the 5s cooldown
  if (now - (lastPost.get(ip) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json({ error: 'cooldown' }, { status: 429 })
  }
  lastPost.set(ip, now)

  /* Guard 3 — the per-IP daily ration. Yesterday's keys are dropped the
     first time a new date is seen rather than on a timer: the map only
     grows while the instance is warm, so one sweep a day is enough. */
  if (day !== seenDay) {
    seenDay = day
    for (const key of dayHits.keys()) {
      if (!key.endsWith(`:${day}`)) dayHits.delete(key)
    }
  }
  const ipKey = `${ip}:${day}`
  const ipTurns = dayHits.get(ipKey) ?? 0
  if (ipTurns >= MAX_IP_TURNS_PER_DAY) {
    return NextResponse.json({ error: 'budget' }, { status: 429 })
  }

  // never log, echo or branch on the key's VALUE — only on its presence
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'offline' }, { status: 503 })
  }

  /* Guard 4 — the global daily budget, checked BEFORE the model is
     called because after is too late to matter. `null` means the store
     couldn't answer; the three in-memory guards carry it from there. */
  const spent = await readDayCount(day)
  if (spent !== null && spent >= dailyMax()) {
    return NextResponse.json({ error: 'budget' }, { status: 429 })
  }

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // low effort: this is a 120-word answer from a fixed brief, not a
      // reasoning task — and a visitor is watching the words arrive
      output_config: { effort: 'low' },
      // the brief is identical on every request; cache it so the second
      // question in a sitting reads the prefix instead of re-paying it
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: turns,
    })

    // the turn is spent the moment the model is engaged, so both
    // counters move here — not on a successful last token, which a
    // visitor could avoid by closing the tab
    dayHits.set(ipKey, ipTurns + 1)
    if (spent !== null) bumpDayCount(day, spent + 1)

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encode = new TextEncoder()
        let wrote = 0
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta' &&
              event.delta.text
            ) {
              wrote += event.delta.text.length
              controller.enqueue(encode.encode(event.delta.text))
            }
          }
          // a refusal lands as HTTP 200 with an empty content array, which
          // would otherwise render as an empty bubble — say something
          await stream.finalMessage()
          if (wrote === 0) controller.enqueue(encode.encode(GRACEFUL))
        } catch {
          // mid-stream failure: close cleanly rather than tearing the
          // connection, so the client keeps whatever already landed
          if (wrote === 0) controller.enqueue(encode.encode(GRACEFUL))
        }
        controller.close()
      },
    })

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'upstream' }, { status: 500 })
  }
}
