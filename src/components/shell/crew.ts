/* The crew — one source of truth for avatars + presence verbs, shared by
   COMMAND.CTR and the ambient desktop agents. Avatars are per-skin: each
   skin gets its own cast, classic is the fallback for skins that don't
   (yet) have their own art. */

import type { Skin } from '@/store/settings'

const CLASSIC_AVATARS: Record<string, string> = {
  fable: '/cc/avatars/shape-101.svg',
  hertz: '/cc/avatars/shape-12.svg',
  nyquist: '/cc/avatars/shape-27.svg',
  fourier: '/cc/avatars/shape-46.svg',
  doppler: '/cc/avatars/shape-17.svg',
}

const MEDIEVAL_AVATARS: Record<string, string> = {
  fable: '/cc/avatars/medieval/element-16.svg',
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

export const CREW_IDS = Object.keys(CLASSIC_AVATARS)

export const CREW_VERBS: Record<string, string> = {
  fable: 'ORCHESTRATING',
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
  if (['machine', 'readme'].includes(id)) return 'fourier'
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff
  return ['hertz', 'nyquist', 'fourier', 'doppler'][h % 4]
}
