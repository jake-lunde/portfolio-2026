/* The crew — one source of truth for WHO these units are (identity,
   model, job, and the one-line answer to "what am I looking at"),
   shared by COMMAND.CTR, the ambient desktop agents and the deck chip.

   The cast is a PYRAMID, and the shape is the argument: Jake is the
   human at the top — he writes the briefs, judges the returns and owns
   the taste. FABLE orchestrates. Four units do the fan-out. Avatars are
   per-skin; each skin gets its own cast, classic is the fallback for
   skins that don't (yet) have their own art. Jake has no sprite on
   purpose — the human is drawn as a monogram plate so the human/agent
   distinction is structural, not just positional. */

import type { Skin } from '@/store/settings'

export type CrewMember = {
  id: string
  name: string
  /** the model behind the call sign — or HUMAN, for the one human */
  model: string
  /** the job, in one word */
  role: string
  /** what this unit is, in the unit's own voice — used by the deck and
      the first-hover introduction on the desktop */
  blurb: string
}

/** Jake's own portrait — drawn as a full-colour IMAGE, never a mask.
    The crew are silhouettes in one ink; the human is in colour. That is
    the whole distinction, and it survives a squint at 15px.
    (Source of truth: `ref/stamp/jake-vector.svg`, copied into public/
    because `ref/` is never committed. A medieval engraving of the same
    portrait is sitting in `ref/stamp/medieval/` when a per-skin variant
    is wanted.) */
export const HUMAN_PORTRAIT = '/cc/avatars/jake.svg'

/** The human. Top of the pyramid; not an agent, and drawn like it. */
export const HUMAN: CrewMember = {
  id: 'jake',
  name: 'JAKE LUNDE',
  model: 'HUMAN',
  role: 'DESIGN ENGINEER',
  blurb: 'WRITES THE BRIEF · CURATES THE RETURN · OWNS THE TASTE',
}

/** The middle tier — the two units Jake talks to directly. FABLE holds
    the baton on taste days; SHANNON runs the build sessions, which is
    most of them (medium-sized work, medium creativity, high volume). */
export const LEADS: CrewMember[] = [
  {
    id: 'fable',
    name: 'FABLE',
    model: 'FABLE-5',
    role: 'ORCHESTRATION',
    blurb: 'TAKES THE BRIEF, SPLITS IT, HANDS OUT THE TICKETS',
  },
  {
    id: 'shannon',
    name: 'SHANNON',
    model: 'OPUS-5',
    role: 'EXECUTION',
    blurb: 'RUNS THE BUILD, SHIPS THE BUILD',
  },
]

/** The fan-out — routed by task SHAPE, not by skill (see CREW.md §2):
    closed work to the Sonnet units, open work to the Opus units. */
export const DELEGATES: CrewMember[] = [
  {
    id: 'hertz',
    name: 'HERTZ',
    model: 'SONNET-5',
    role: 'RESEARCH',
    blurb: 'MEASURES, CITES, NEVER GUESSES',
  },
  {
    id: 'nyquist',
    name: 'NYQUIST',
    model: 'SONNET-5',
    role: 'IMPLEMENTATION',
    blurb: 'BUILDS WHAT THE BRIEF SPECS, EXACTLY',
  },
  {
    id: 'fourier',
    name: 'FOURIER',
    model: 'OPUS-5',
    role: 'SYNTHESIS',
    blurb: 'MAKES THE CALLS THE BRIEF LEFT OPEN',
  },
  {
    id: 'doppler',
    name: 'DOPPLER',
    model: 'OPUS-5',
    role: 'REVIEW',
    blurb: 'READS THE DIFF BACK, APPROVES WITH SUSPICION',
  },
]

/** Every agent, leads first. Jake is deliberately NOT in here —
    anything iterating CREW is iterating machines. */
export const CREW: CrewMember[] = [...LEADS, ...DELEGATES]

export const CREW_IDS = CREW.map((c) => c.id)

/** id → member, humans included. */
export const CREW_BY_ID: Record<string, CrewMember> = Object.fromEntries(
  [HUMAN, ...CREW].map((c) => [c.id, c])
)

/** Is this an id the feed is allowed to name? Guards the live feed
    against a mis-typed report writing garbage onto the deck. */
export function isCrewId(id: unknown): id is string {
  return typeof id === 'string' && (id === HUMAN.id || CREW_IDS.includes(id))
}

const CLASSIC_AVATARS: Record<string, string> = {
  fable: '/cc/avatars/shape-101.svg',
  shannon: '/cc/avatars/shape-60.svg',
  hertz: '/cc/avatars/shape-12.svg',
  nyquist: '/cc/avatars/shape-27.svg',
  fourier: '/cc/avatars/shape-46.svg',
  doppler: '/cc/avatars/shape-17.svg',
}

const MEDIEVAL_AVATARS: Record<string, string> = {
  fable: '/cc/avatars/medieval/element-16.svg',
  shannon: '/cc/avatars/medieval/element-35.svg',
  hertz: '/cc/avatars/medieval/element-15.svg',
  nyquist: '/cc/avatars/medieval/element-37.svg',
  fourier: '/cc/avatars/medieval/element-52.svg',
  doppler: '/cc/avatars/medieval/element-32.svg',
}

export const CREW_AVATARS: Record<Skin, Record<string, string>> = {
  classic: CLASSIC_AVATARS,
  medieval: MEDIEVAL_AVATARS,
  underwater: CLASSIC_AVATARS, // no art yet — falls back to classic
}

/** Resolve an agent's avatar for the active skin, falling back to classic. */
export function avatarFor(agent: string, skin: Skin): string {
  return CREW_AVATARS[skin]?.[agent] ?? CREW_AVATARS.classic[agent]
}

export const CREW_VERBS: Record<string, string> = {
  fable: 'ORCHESTRATING',
  shannon: 'RUNNING THE SESSION',
  hertz: 'MEASURING',
  nyquist: 'MOUNTING',
  fourier: 'COMPOSING',
  doppler: 'INSPECTING',
}

/* which unit shows up when a window opens — semantic beats, hash fallback */
export function agentForWindow(id: string): string {
  if (id === 'command') return 'fable'
  if (id.startsWith('case:')) return 'doppler'
  if (id.startsWith('viz:')) return 'hertz'
  if (['studio', 'booth', 'puzzle', 'paint', 'sequencer'].includes(id)) return 'nyquist'
  // the chat window IS Claude answering for itself — the orchestrator
  // shows up as itself, not as a delegate
  if (id === 'ai-chat') return 'fable'
  if (id === 'readme') return 'fourier'
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff
  return ['hertz', 'nyquist', 'fourier', 'doppler'][h % 4]
}
