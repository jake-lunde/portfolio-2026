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

/** Which of the two tools the pointer is currently holding.
 *
 * SELECT is the picker: a plain click takes the thing under it as an
 * object, a double-click drills. OPERATE hands the canvas back to the
 * visitor — the site behaves exactly as it does with no tool up.
 *
 * ALT is always the OTHER tool, momentarily. That is the whole bargain,
 * and it is the reason this is a two-state switch rather than two
 * unrelated modifiers: the header always says which one is resting in
 * your hand, and the key always says what happens if you reach past it.
 *
 * The tool is NOT sticky across entries: every way into the mode lands in
 * SELECT, because entering the tool is the act of pointing at something.
 * (setOn/toggle reset it; nothing else needs to.)
 */
export type InspectTool = 'select' | 'operate'

type InspectState = {
  on: boolean
  tool: InspectTool
  toggle: () => void
  setOn: (v: boolean) => void
  setTool: (t: InspectTool) => void
}

export const useInspect = create<InspectState>((set) => ({
  on: false,
  tool: 'select',
  toggle: () => set((s) => ({ on: !s.on, tool: 'select' })),
  setOn: (v) => set({ on: v, tool: 'select' }),
  setTool: (tool) => set({ tool }),
}))
