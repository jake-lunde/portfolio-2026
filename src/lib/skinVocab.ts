import type { Skin } from '@/store/settings'
import { resolveCopy } from '@/content/copy'

/* Per-skin vocabulary — the seed of the "language modifier" (Notion:
   update language). Each skin re-costumes not just the pixels but the
   *words*: classic is canonical (the registry `name`), and a skin lists
   only what it renames. Anything absent falls back to the canonical
   name, so a half-translated skin still reads cleanly.

   Program names now live in the copy layer (src/content/copy.json,
   keys `program.<id>.name`) so EDIT.MODE can find and rewrite them.
   This file stays as a thin, stable wrapper so call sites (desktop
   icons, window titles) don't change — see src/content/copy.ts for
   resolution and src/content/CopyText.tsx for the rendered-node form. */

/** Resolve a program's display name for the active skin (name = desktop
    label + window title). Falls back to the canonical name passed in
    when the copy key is missing (e.g. a program not yet keyed). */
export function programName(id: string, canonical: string, skin: Skin): string {
  return resolveCopy(`program.${id}.name`, skin)?.value ?? canonical
}
