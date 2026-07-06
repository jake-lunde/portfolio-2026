'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useWindows } from '@/store/windows'
import { resolveWindow } from '@/programs/resolve'
import { BASE } from '@/lib/base'
import { MenuBar } from './MenuBar'
import { DesktopIcons } from './DesktopIcons'
import { GlyphField } from './GlyphField'
import { Window } from './Window'
import { Boot } from './Boot'
import styles from './shell.module.css'

/* The OS. Server pages hand us the windows a deep link opens; after
   hydration the store owns everything and the URL follows the focused
   window via history.replaceState (view-state, not navigation). */

export function Desktop({ initialWindows }: { initialWindows: string[] }) {
  const desktopRef = useRef<HTMLDivElement>(null)
  const stored = useWindows((s) => s.windows)
  const storedFocus = useWindows((s) => s.focused)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    useWindows.getState().setInitial(initialWindows)
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const windows = hydrated
    ? stored
    : initialWindows.map((id, i) => ({ id, z: 10 + i }))
  const focused = hydrated
    ? storedFocus
    : initialWindows[initialWindows.length - 1] ?? null

  // keep the URL pointing at the focused window (deep-linkable state)
  useEffect(() => {
    if (!hydrated) return
    const def = focused ? resolveWindow(focused) : null
    const path = BASE + (def?.path ?? '/')
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path)
    }
  }, [hydrated, focused])

  return (
    <>
      <MenuBar />
      <main ref={desktopRef} className={styles.desktop}>
        <GlyphField />
        <DesktopIcons />
        <AnimatePresence>
          {windows.map((w) => {
            const def = resolveWindow(w.id)
            if (!def) return null
            return (
              <Window
                key={w.id}
                def={def}
                z={w.z}
                active={focused === w.id}
                desktopRef={desktopRef}
              />
            )
          })}
        </AnimatePresence>
      </main>
      <Boot />
    </>
  )
}
