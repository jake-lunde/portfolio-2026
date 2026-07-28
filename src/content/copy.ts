import type { Skin } from '@/store/settings'
import RAW from './copy.json'
import { toKnightSpeak } from './knightspeak'

/* EDIT.MODE contract — the seam between the copy layer (call sites
   render via t() / <Copy>) and the EDIT.MODE editor (finds nodes by
   data-copy-id, resolves the active slot, commits copy.json to main).

   copy.json is the single machine-editable source of user-facing
   strings: flat dot-namespaced keys → either a plain string (base
   copy, all skins) or a variant map { base, medieval?, underwater? }.
   classic never has a variant slot — it IS base. */

export type SkinSlot = Exclude<Skin, 'classic'>
export type CopySlot = 'base' | SkinSlot
export type SkinVariantMap = { base: string } & Partial<Record<SkinSlot, string>>
export type CopyEntry = string | SkinVariantMap

export const COPY = RAW as Record<string, CopyEntry>

/* A skin may carry a voice: a deterministic transform applied to base
   copy when the key has no hand-written slot for that skin. Hand-written
   slots always win. Derived values resolve under the SKIN's slot (not
   'base') so an EDIT.MODE edit commits as an explicit override — the
   commit API promotes string entries to variant maps — and never writes
   transformed text back into base. */
const SKIN_VOICE: Partial<Record<SkinSlot, (s: string) => string>> = {
  medieval: toKnightSpeak,
}

/** Which slot a key renders from under `skin`, and its value. The
    editor uses the same resolution, so an edit writes exactly the
    slot the user was looking at. `derived` marks a voice-transformed
    value — real to the reader, absent from copy.json. */
export function resolveCopy(
  key: string,
  skin: Skin,
): { slot: CopySlot; value: string; derived?: true } | null {
  const entry = COPY[key]
  if (entry === undefined) return null
  const base = typeof entry === 'string' ? entry : entry.base
  if (skin !== 'classic') {
    if (typeof entry !== 'string') {
      const v = entry[skin]
      if (v !== undefined) return { slot: skin, value: v }
    }
    const voice = SKIN_VOICE[skin]
    if (voice) {
      const spoken = voice(base)
      if (spoken !== base) return { slot: skin, value: spoken, derived: true }
    }
  }
  return { slot: 'base', value: base }
}

export function t(key: string, skin: Skin): string {
  const r = resolveCopy(key, skin)
  if (r) return r.value
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[copy] missing key: ${key}`)
  }
  return key
}
