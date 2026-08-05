/* DOPPLER moonlights in the suggestion box. Review unit, deadpan,
   suspicious of everything — including your idea, live, as you type it.
   Same voice register as crewDialog.ts: uppercase, ≤44 chars, no emoji.
   Lines are hardcoded TS (crewDialog precedent), not copy.json — persona
   voice, identical across skins.

   Each rule fires at most once per draft; keyword rules outrank length
   milestones so the specific jab always beats the generic one. */

export type RoastRule = {
  id: string
  test: (idea: string) => boolean
  line: string
}

const letters = (s: string) => s.replace(/[^a-z]/gi, '')
const capsRatio = (s: string) => {
  const l = letters(s)
  if (l.length < 12) return 0
  return l.replace(/[^A-Z]/g, '').length / l.length
}

export const ROAST_RULES: RoastRule[] = [
  // ---- keyword jabs (specific first) ----
  {
    id: 'crypto',
    test: (s) => /\b(crypto|blockchain|nft|web3|bitcoin)\b/i.test(s),
    line: 'NO COINS. THE SLOT IS FOR IDEAS.',
  },
  {
    id: 'ai',
    test: (s) => /\b(ai|a\.i\.|llm|gpt|chatbot)\b/i.test(s),
    line: 'AI. GROUNDBREAKING. NEVER HEARD THAT ONE.',
  },
  {
    id: 'darkmode',
    test: (s) => /dark ?mode/i.test(s),
    line: 'WE HAVE DARK MODE. CHECK SETTINGS. NEXT.',
  },
  {
    id: 'just',
    test: (s) => /\bjust\b/i.test(s),
    line: '"JUST." EVERY BIG ESTIMATE STARTS THERE.',
  },
  {
    id: 'simple',
    test: (s) => /\b(simple|easy|quick)\b/i.test(s),
    line: 'SIMPLE. THE MOST EXPENSIVE WORD I KNOW.',
  },
  {
    id: 'emoji',
    test: (s) => /\p{Extended_Pictographic}/u.test(s),
    line: 'AN EMOJI. ON A 1992 MACHINE. BOLD.',
  },
  {
    id: 'question',
    test: (s) => /\?/.test(s),
    line: 'ASKING ME? I JUST WORK HERE.',
  },
  {
    id: 'shout',
    test: (s) => capsRatio(s) > 0.6,
    line: 'SHOUTING DOES NOT IMPROVE THE IDEA.',
  },
  {
    id: 'flattery',
    test: (s) => /\b(love|great|awesome|amazing)\b/i.test(s),
    line: 'FLATTERY. NOTED. SCORE UNAFFECTED.',
  },
  // ---- length milestones ----
  {
    id: 'start',
    test: (s) => s.length >= 1,
    line: 'GO ON. I AM LISTENING. UNFORTUNATELY.',
  },
  {
    id: 'mid',
    test: (s) => s.length >= 55,
    line: 'STILL GOING. BRAVE.',
  },
  {
    id: 'long',
    test: (s) => s.length >= 110,
    line: 'EASY. IT IS A SUGGESTION, NOT A SAGA.',
  },
  {
    id: 'limit',
    test: (s) => s.length >= 137,
    line: 'THE BOX HAS LIMITS. YOU FOUND THEM.',
  },
]

/* Special cases the rules table can't see (state transitions, timers) —
   the component owns their triggers. */
export const IDLE_LINE = 'NO RUSH. I AM PAID IN TOKENS.'
export const WIPE_LINE = 'COWARD.'
export const GREETING = 'STATE YOUR IDEA. I WILL SCORE IT. FAIRLY-ISH.'
export const AGAIN_LINE = 'AGAIN? VERY WELL.'
export const METHODOLOGY = 'METHODOLOGY: PROPRIETARY. DO NOT APPEAL.'

/* Scoring — deterministic on purpose: the same idea always earns the
   same number, so resubmitting to fish for a better score gets you
   exactly the same verdict. That is the joke, and also the appeal
   process. Hash spreads 25–90; small bonuses for ideas sized like ideas
   and for buttering up the management. */
export function scoreIdea(idea: string): { score: number; verdict: string } {
  const s = idea.trim().toLowerCase()
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let score = 25 + (Math.abs(h) % 66)
  if (s.length >= 40 && s.length <= 120) score += 5
  if (/\b(jake|lunde)\b/.test(s)) score += 5
  score = Math.min(100, score)
  return { score, verdict: verdictFor(score) }
}

function verdictFor(score: number): string {
  if (score >= 90) return 'FINE. IT IS GOOD. DO NOT GLOAT.'
  if (score >= 75) return 'APPROVED WITH SUSPICION.'
  if (score >= 55) return 'FILED UNDER "MAYBE".'
  if (score >= 35) return 'THE BOX HAS SEEN WORSE. BARELY.'
  return 'FILED. VERTICALLY.'
}
