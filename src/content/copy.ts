import type { Skin } from '@/store/settings'
import RAW from './copy.json'

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

/** Which slot a key renders from under `skin`, and its value. The
    editor uses the same resolution, so an edit writes exactly the
    slot the user was looking at. */
export function resolveCopy(
  key: string,
  skin: Skin,
): { slot: CopySlot; value: string } | null {
  const entry = COPY[key]
  if (entry === undefined) return null
  if (typeof entry === 'string') return { slot: 'base', value: entry }
  if (skin !== 'classic') {
    const v = entry[skin]
    if (v !== undefined) return { slot: skin, value: v }
  }
  return { slot: 'base', value: entry.base }
}

export function t(key: string, skin: Skin): string {
  const r = resolveCopy(key, skin)
  if (r) return r.value
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[copy] missing key: ${key}`)
  }
  return key
}
