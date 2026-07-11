/* The crew — one source of truth for avatars + presence verbs, shared by
   COMMAND.CTR and the ambient desktop agents. */

export const CREW_AVATARS: Record<string, string> = {
  fable: '/cc/avatars/shape-101.svg',
  hertz: '/cc/avatars/shape-12.svg',
  nyquist: '/cc/avatars/shape-27.svg',
  fourier: '/cc/avatars/shape-46.svg',
  doppler: '/cc/avatars/shape-17.svg',
}

export const CREW_IDS = Object.keys(CREW_AVATARS)

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
