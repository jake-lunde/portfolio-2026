import Anthropic from '@anthropic-ai/sdk'
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

   No key configured → 503 `offline`, which the window renders as "my
   live wire isn't plugged in yet. The cards still work." — true, and the
   window is still worth opening without it. */

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
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
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
    return NextResponse.json({ error: 'Ask me something shorter.' }, { status: 400 })
  }

  if (turns.filter((m) => m.role === 'user').length > MAX_USER_TURNS) {
    return NextResponse.json({ error: 'capped' }, { status: 429 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  if (now - (lastPost.get(ip) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json({ error: 'One question at a time.' }, { status: 429 })
  }
  lastPost.set(ip, now)

  // never log, echo or branch on the key's VALUE — only on its presence
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'offline' }, { status: 503 })
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
    return NextResponse.json({ error: 'The wire dropped.' }, { status: 500 })
  }
}
