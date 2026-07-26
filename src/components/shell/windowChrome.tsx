'use client'

import { createContext, useContext } from 'react'

/* What a program can know about the window it is mounted in.

   Almost nothing needs this — a program is a body inside a frame and the
   frame handles itself. Two cases do:
     · `chrome: 'bare'` programs (the iPod) ARE the frame. They own the
       drag handle and the close control, so they need `startDrag`/`close`.
     · folders read their own contents off their registry entry, so they
       need `id`.

   Default is inert: rendered outside a Window (Storybook, a test), the
   handles no-op rather than throwing. */

export type WindowChrome = {
  id: string
  /** begin a free-floating drag from this pointer event (bare chrome only) */
  startDrag: (e: React.PointerEvent) => void
  close: () => void
}

const WindowChromeContext = createContext<WindowChrome>({
  id: '',
  startDrag: () => {},
  close: () => {},
})

export const WindowChromeProvider = WindowChromeContext.Provider

export function useWindowChrome() {
  return useContext(WindowChromeContext)
}
