'use client'

import { create } from 'zustand'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'

/* SHELF.MODE — WORK is a MODE OF THE DESK, not a window (Jake's ruling,
 * "Hide Others"). Pressing WORK no longer opens IDX-16 in a frame: the
 * desk goes back on the shelf's own camera and the four boxes come up on
 * a plank that spans the screen. No titlebar, no close box — the plank is
 * the frame.
 *
 * It lives here for the same reason INSPECT.MODE's flag does (store/
 * inspect.ts): the window store can only hold windows, and three
 * unrelated callers — the dock tile, the desktop icon, the /cases deep
 * link — plus the case footer's "All work" all have to read one truth.
 *
 * Deliberately NOT persisted, same as INSPECT: entering is always an act
 * (or a link someone followed), never a state a reload restores.
 *
 * THE TRIGGER IS A MODULE VARIABLE, NOT STATE. It is a DOM node used on
 * the way out, to put focus back where the reader left it — in the store
 * it would re-render every subscriber for a value nothing renders.
 *
 * `returnFocus` READS it rather than consuming it, and that is deliberate:
 * the caller is an unmount cleanup, StrictMode runs mount/cleanup/mount on
 * every dev mount, and a one-shot handover would be spent by the phantom
 * cleanup and have nothing left for the real exit — focus would land on
 * the body, in production only ever after a dev session said it worked.
 * `enter` overwrites it and `leave({ restoreFocus: false })` clears it, so
 * the value is only ever stale in the direction of doing nothing.
 */

let trigger: HTMLElement | null = null

type ShelfModeState = {
  on: boolean
  /** `from` is the control that summoned the mode — focus goes back to it */
  enter: (from?: HTMLElement | null) => void
  /** `restoreFocus: false` when something else has taken focus already —
      PLAY hands it to the case window, and pulling it back would drop the
      reader behind the window they just opened (same rule Shelf's
      finishPlay has always followed). `silent: true` when the caller is
      about to make its own sound right after — the dock's tile-switch
      path plays `sfx.open()` for the tile it's opening, and a close sound
      first would be two sounds in one press. */
  leave: (opts?: { restoreFocus?: boolean; silent?: boolean }) => void
  toggle: (from?: HTMLElement | null) => void
}

export const useShelfMode = create<ShelfModeState>((set, get) => ({
  on: false,

  /* The sound lives here rather than at the four call sites: entering the
     mode is one event however it was summoned, and a dock tile, a desktop
     icon, a case footer and a deep link should not each be deciding what
     it sounds like. Same open/close pair every window uses — the mode is
     a thing arriving on the desk, and it should say so. */
  enter: (from) => {
    if (get().on) return
    trigger = from ?? null
    metric('shelf_mode_enter')
    sfx.open()
    set({ on: true })
  },

  leave: ({ restoreFocus = true, silent = false } = {}) => {
    if (!get().on) return
    if (!restoreFocus) trigger = null
    if (!silent) sfx.close()
    set({ on: false })
  },

  toggle: (from) => (get().on ? get().leave() : get().enter(from)),
}))

/** Put focus back on whatever opened the mode, if it is still on screen. */
export function returnFocus(): void {
  if (trigger?.isConnected) trigger.focus()
}
