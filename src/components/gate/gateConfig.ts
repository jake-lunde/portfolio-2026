/* Per-skin clearance copy for the Projects wing gate. Classic strings are
   byte-identical to the originals — this is a refactor, not a rewrite. */

import type { Skin } from '@/store/settings'

export type GateConfig = {
  code: string
  hint: string
  header: string
  granted: string
  denied: string
}

const classic: GateConfig = {
  code: 'HOWDY',
  hint: 'THE PASSWORD IS MYSTERIOUS AND IMPORTANT',
  header: 'RESTRICTED WING · REFINE THE MACRODATA TO ENTER',
  granted: 'ACCESS GRANTED. WELCOME TO THE PROJECTS WING, REFINER.',
  denied: 'ACCESS DENIED. THE DATA WAS NOT REFINED. THE BOARD IS NOT PLEASED.',
}

const medieval: GateConfig = {
  code: 'QUILL',
  hint: "CLEARANCE HINT: THE SCRIBE'S INSTRUMENT, FIVE LETTERS",
  header: 'THE SCRIPTORIUM IS SEALED · SPEAK THE WORD TO ENTER',
  granted: 'THE GATES OPEN. ENTER, PILGRIM OF THE WORK.',
  denied: 'THE WORD IS FALSE. THE ABBOT IS NOT PLEASED.',
}

export const GATE: Record<Skin, GateConfig> = {
  classic,
  medieval,
  underwater: classic, // no copy yet — falls back to classic
}
