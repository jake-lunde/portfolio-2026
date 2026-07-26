'use client'

import { useSettings } from '@/store/settings'

/* Haptics — the physical half of the click track.
 *
 * REALITY CHECK: `navigator.vibrate` is a Chromium-on-Android API. iOS
 * Safari does not implement it at all, and there is no API-level substitute
 * (the label/`<input switch>` tricks are abuse, not craft), so on iPhone
 * this layer is a silent no-op and the audio click carries the feedback
 * alone. Feature-detected, never assumed.
 *
 * Gated by the same `sound` setting as sfx (src/lib/sound.ts): one switch
 * for "the machine announces itself", whichever sense it reaches. */

type Vibrating = Navigator & { vibrate?: (pattern: number | number[]) => boolean }

/** resolved once — the capability cannot change mid-session */
let supported: boolean | null = null

function can(): boolean {
  if (supported === null) {
    supported =
      typeof navigator !== 'undefined' && typeof (navigator as Vibrating).vibrate === 'function'
  }
  return supported
}

function buzz(pattern: number | number[]) {
  if (!can()) return
  if (!useSettings.getState().sound) return
  try {
    ;(navigator as Vibrating).vibrate!(pattern)
  } catch {
    /* some engines throw when the page is not visible — never let it surface */
  }
}

export const haptic = {
  /** whether this device can actually vibrate (for UI that wants to know) */
  supported: can,
  /** one rotary detent — the shortest pulse a phone can render */
  tick: () => buzz(8),
  /** a landed action: a button, a screen change */
  bump: () => buzz(18),
}
