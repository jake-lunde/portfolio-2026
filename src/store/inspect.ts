'use client'

import { create } from 'zustand'

/* INSPECT.MODE's on/off flag — SYS-21.
 *
 * The mode is not a window, so nothing in the window store can hold it and
 * nothing in the URL owns it after entry. It lives here so the menubar
 * toggle, the mode shell and the deep-link entry all read one truth.
 *
 * Deliberately NOT persisted: a tool mode that survives a reload would
 * greet a returning visitor with a compressed desktop and two panels they
 * never asked for. Entering is always an act.
 */

type InspectState = {
  on: boolean
  toggle: () => void
  setOn: (v: boolean) => void
}

export const useInspect = create<InspectState>((set) => ({
  on: false,
  toggle: () => set((s) => ({ on: !s.on })),
  setOn: (v) => set({ on: v }),
}))
