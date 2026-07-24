import type { Skin } from '@/store/settings'

/* Per-skin vocabulary — the seed of the "language modifier" (Notion:
   update language). Each skin re-costumes not just the pixels but the
   *words*: classic is canonical (the registry `name`), and a skin lists
   only what it renames. Anything absent falls back to the canonical
   name, so a half-translated skin still reads cleanly.

   The medieval lexicon leans on real manuscript / castle vocabulary so
   the OS reads like an artifact from a parallel 1392:
   incipit/colophon bookend a codex the way DOC-00 and SYS-14 bookend the
   system; an oubliette is literally a place of forgetting (deletion).

   Labels render uppercase via CSS — author them in Title Case here. */

export const SKIN_PROGRAM_NAMES: Partial<Record<Skin, Record<string, string>>> = {
  medieval: {
    readme: 'Incipit',
    projects: 'Works',
    studio: 'Workshop',
    visualizers: 'Scrying',
    guestbook: 'The Ledger',
    booth: 'Portraiture',
    puzzle: 'Labyrinth',
    paint: 'Illuminator',
    sequencer: 'Psaltery',
    command: 'The Keep',
    'field-notes': '???', // sealed — no name to reveal yet
    'spec-sheet': 'Colophon',
    machine: 'The Engine',
    trash: 'Oubliette',
    settings: 'The Workings',
    'now-playing': 'Now Sounding',
  },
}

/** Resolve a program's display name for the active skin (name = desktop
    label + window title). Falls back to the canonical name. */
export function programName(id: string, canonical: string, skin: Skin): string {
  return SKIN_PROGRAM_NAMES[skin]?.[id] ?? canonical
}
