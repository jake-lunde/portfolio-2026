'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useWindows } from '@/store/windows'
import { resolveWindow } from '@/programs/resolve'
import { BASE } from '@/lib/base'
import { MenuBar } from './MenuBar'
import { SkillsTicker } from './SkillsTicker'
import { DesktopIcons } from './DesktopIcons'
import { Wallpaper } from './Wallpaper'
import { NowPlayingWidget } from './NowPlayingWidget'
import { MiniPlayer } from './MiniPlayer'
import { StickyNotes } from './StickyNotes'
import { DailyWidget } from './DailyWidget'
import { PhotoWall } from './PhotoWall'
import { AmbientAgents } from './AmbientAgents'
import { Screensaver } from './Screensaver'
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
    // mobile lands on the launcher, not a full-bleed README
    const mobileRoot =
      window.innerWidth <= 720 && initialWindows.length === 1 && initialWindows[0] === 'readme'
    useWindows.getState().setInitial(mobileRoot ? [] : initialWindows)
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
      <SkillsTicker />
      <main ref={desktopRef} className={styles.desktop}>
        <Wallpaper />
        <NowPlayingWidget />
        <DesktopIcons />
        <DailyWidget />
        <MiniPlayer />
        <StickyNotes />
        <PhotoWall />
        <AmbientAgents />
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
      <Screensaver />
      {/* Global "roughen" filter for the hand-inked medieval dataviz. Defined
          once at the shell so the id resolves document-wide (no duplicate ids
          when several viz windows are open); applied via CSS to `.viz svg`
          only under [data-skin='medieval'] (see viz.module.css). Gentle,
          long-wavelength displacement — a quill waver on straight strokes
          that stays legible on the two text-bearing charts. */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <filter id="lunde-roughen" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.014"
              numOctaves="1"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    </>
  )
}
