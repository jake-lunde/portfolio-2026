'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useWindows } from '@/store/windows'
import { resolveWindow, BOOT_WINDOWS } from '@/programs/resolve'
import { BASE } from '@/lib/base'
import { MenuBar } from './MenuBar'
import { SkillsTicker } from './SkillsTicker'
import { DesktopIcons } from './DesktopIcons'
import { Dock } from './Dock'
import { Wallpaper } from './Wallpaper'
import { NowPlayingWidget } from './NowPlayingWidget'
import { MiniPlayer } from './MiniPlayer'
import { PhotoWall } from './PhotoWall'
import { AmbientAgents } from './AmbientAgents'
import { Screensaver } from './Screensaver'
import { Window } from './Window'
import { Boot } from './Boot'
import { InspectMount } from '@/components/inspect/InspectMount'
import { useInspect, type InspectTool } from '@/store/inspect'
import { KnightSpeakLayer } from '@/content/KnightSpeakLayer'
import styles from './shell.module.css'

/* The OS. Server pages hand us the windows a deep link opens; after
   hydration the store owns everything and the URL follows the focused
   window via history.replaceState (view-state, not navigation).

   `initialInspect` is the /inspect and /edit deep link: INSPECT.MODE is a
   tool mode rather than a window now, so the path cannot open it the way
   every other path opens a program — it opens README onto the canvas and
   arms the tool over the top. The value is WHICH TOOL the link asks for,
   because /edit lands holding the copy editor. After that the mode is
   orthogonal to the URL and the focus-sync below carries on as normal. */

export function Desktop({
  initialWindows,
  initialInspect = null,
}: {
  initialWindows: string[]
  initialInspect?: InspectTool | null
}) {
  const desktopRef = useRef<HTMLDivElement>(null)
  const stored = useWindows((s) => s.windows)
  const storedFocus = useWindows((s) => s.focused)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // mobile lands on the launcher, not the boot desk (README used to boot
    // alone; the desk now sets out the player too — resolve.ts BOOT_WINDOWS)
    const mobileRoot =
      window.innerWidth <= 720 && initialWindows.join(',') === BOOT_WINDOWS.join(',')
    useWindows.getState().setInitial(mobileRoot ? [] : initialWindows)
    /* the tool needs a canvas between its two docks — same floor the
       menubar toggle and InspectShell keep. /edit below 900px simply does
       not arm: the editor is Jake's desk tool and he is at a desk. */
    if (initialInspect && window.innerWidth > 900)
      useInspect.getState().setOn(true, initialInspect)
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
      {/* medieval voice for prose the copy layer doesn't key — mounted at
          the shell so it covers every program, window and route */}
      <KnightSpeakLayer />
      <MenuBar />
      <SkillsTicker />
      {/* the root of INSPECT.MODE's layer tree — the canvas has to be
          nameable from outside this module (LayersPanel finds it here) */}
      <main ref={desktopRef} className={styles.desktop} data-desktop-root="">
        <Wallpaper />
        <NowPlayingWidget />
        <DesktopIcons />
        <Dock />
        {/* DAILY.SYS stood here until the refresh pass — Jake's read was
            "just doesn't feel super helpful". The component survives at
            DailyWidget.tsx; remounting it is this one line back. */}
        <MiniPlayer />
        {/* COMMAND.CTR stood here until case-rail round 4 — Jake's call
            that it's system chrome, not a floating widget. It now lives
            in the menu bar; see MenuBar.tsx and CommandWidget.tsx. */}
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
      {/* INSPECT.MODE's docks — code-split, and mounted OUTSIDE the
          desktop so the canvas it compresses is not its own ancestor */}
      <InspectMount />
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
