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

/** Which tool the pointer is currently holding.
 *
 * SELECT is the picker: a plain click takes the thing under it as an
 * object, a double-click drills. OPERATE hands the canvas back to the
 * visitor — the site behaves exactly as it does with no tool up.
 *
 * ALT is always the OTHER of THOSE TWO, momentarily. That is the whole
 * bargain, and it is the reason those two are a switch rather than two
 * unrelated modifiers: the header always says which one is resting in
 * your hand, and the key always says what happens if you reach past it.
 *
 * There were three for a while. EDIT.MODE (SYS-99) came in from its own
 * program at /edit and stood here as a third segment, and Jake struck it:
 * live copy editing is a thing you do TO A PICK, not a hand you have to
 * put on first. It is an affordance in the inspector now — pick anything,
 * rewrite it in place if it is copy, follow SOURCE if it is not (see
 * components/inspect/useCopyEditing.ts).
 *
 * The tool is NOT sticky across entries: every way into the mode lands in
 * SELECT, because entering the tool is the act of pointing at something.
 * setOn still takes one so a deep link can name it.
 */
export type InspectTool = 'select' | 'operate'

/* THE STAGE lives here too, for one reason: it is a mode inside a mode, and
   putting the tool down has to take it with it. Jake's note on the first cut
   of STYLER was that styling and inspecting are two experiences and the panel
   was showing both at once — so the five blocks left the inspector and became
   a takeover, and `stage` is which component that takeover is holding. Every
   way OUT of the tool clears it, which is why setOn and toggle write it rather
   than leaving it to a cleanup somewhere else to remember. */

type InspectState = {
  on: boolean
  tool: InspectTool
  /** the `data-component` STYLER has isolated on the stage, or null */
  stage: string | null
  toggle: () => void
  setOn: (v: boolean, tool?: InspectTool) => void
  setTool: (t: InspectTool) => void
  setStage: (id: string | null) => void
}

export const useInspect = create<InspectState>((set) => ({
  on: false,
  tool: 'select',
  stage: null,
  toggle: () => set((s) => ({ on: !s.on, tool: 'select', stage: null })),
  setOn: (v, tool = 'select') => set({ on: v, tool, stage: null }),
  setTool: (tool) => set({ tool }),
  setStage: (stage) => set({ stage }),
}))
