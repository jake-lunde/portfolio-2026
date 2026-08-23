'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'motion/react'
import { useWindows } from '@/store/windows'
import { useShelfMode } from '@/store/shelfMode'
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
import { Nameplate } from './Nameplate'
import { AmbientAgents } from './AmbientAgents'
import { Screensaver } from './Screensaver'
import { Window } from './Window'
import { Boot } from './Boot'
import { InspectMount } from '@/components/inspect/InspectMount'
import { useInspect, type InspectTool } from '@/store/inspect'
import { KnightSpeakLayer } from '@/content/KnightSpeakLayer'
import styles from './shell.module.css'

/* SHELF.MODE — WORK opens a mode of the desk, not a window (Jake, "Hide
   Others"; store/shelfMode.ts). Code-split like a program: the boxes, the
   cover films and the launch overlay have no business in the shell bundle
   for a visitor who never presses WORK. Server-rendered when the deep
   link asks for it, so /cases still arrives with the shelf on it. */
const ShelfMode = dynamic(() =>
  import('@/programs/shelf/ShelfMode').then((m) => m.ShelfMode),
)

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
  initialShelfMode = false,
}: {
  initialWindows: string[]
  initialInspect?: InspectTool | null
  /** the /cases deep link: SHELF.MODE is not a window either, so the path
      cannot open it the way a path opens a program (resolve.ts) */
  initialShelfMode?: boolean
}) {
  const desktopRef = useRef<HTMLDivElement>(null)
  const stored = useWindows((s) => s.windows)
  const storedFocus = useWindows((s) => s.focused)
  const storedShelf = useShelfMode((s) => s.on)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // mobile lands on the launcher, not the boot desk (README used to boot
    // alone; the desk now sets out the player too — resolve.ts BOOT_WINDOWS)
    const mobileRoot =
      window.innerWidth <= 720 && initialWindows.join(',') === BOOT_WINDOWS.join(',')
    useWindows.getState().setInitial(mobileRoot ? [] : initialWindows)
    if (initialShelfMode) useShelfMode.getState().enter()
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
  const shelfMode = hydrated ? storedShelf : initialShelfMode

  /* Keep the URL pointing at what the reader is looking at (deep-linkable
     state). SHELF.MODE wins over the focused window while it is up — it
     covers the desk, so it IS what they are looking at, and leaving puts
     the window's own path back. */
  useEffect(() => {
    if (!hydrated) return
    const def = focused ? resolveWindow(focused) : null
    const path = BASE + (shelfMode ? '/cases' : (def?.path ?? '/'))
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path)
    }
  }, [hydrated, focused, shelfMode])

  return (
    <>
      {/* medieval voice for prose the copy layer doesn't key — mounted at
          the shell so it covers every program, window and route */}
      <KnightSpeakLayer />
      <MenuBar />
      <SkillsTicker />
      {/* the root of INSPECT.MODE's layer tree — the canvas has to be
          nameable from outside this module (LayersPanel finds it here) */}
      {/* `data-desk-recede` makes the desk's own contents behave like an
          inactive window: while ANY window holds focus the icons, the
          card, the wall and the audio widgets drop back (see .deskObject
          in shell.module.css). The store nulls `focused` only when the
          last window closes, so a cleared desk brings them all up. */}
      <main
        ref={desktopRef}
        className={styles.desktop}
        data-desktop-root=""
        data-desk-recede={focused && !shelfMode ? 'on' : 'off'}
        data-shelf-mode={shelfMode ? 'on' : 'off'}
      >
        {/* EVERYTHING ON THE DESK, IN ONE LAYER — and the dock rail
            deliberately outside it. SHELF.MODE sends this box back on the
            shelf's own 980px camera (shell.module.css, `.deskLayer`), and
            a recede is a thing done TO the desk: the rail is chrome, it is
            how you get a window back, and it is one of the three ways out
            of the mode, so it can never be part of what receded. Same
            exclusion the desk-recede rule already makes for it.

            At rest this element declares nothing — no transform, no
            opacity, no stacking context — so it is a pass-through wrapper
            and the desk behaves exactly as it did before it existed.
            `inert` is the keyboard half of the mode: the receded desk
            cannot be tabbed into, and a click on it lands on the catcher
            below rather than on a window nobody can read. */}
        {/* `data-desk-layer` is how INSPECT's LAYERS tree knows to step
            past this box: it is a mechanism, not a layer, and the desk's
            furniture reads at the tier it always read at
            (inspect/LayersPanel.tsx). */}
        <div className={styles.deskLayer} data-desk-layer="" inert={shelfMode || undefined}>
          <Wallpaper />
          <NowPlayingWidget />
          <DesktopIcons />
          {/* DAILY.SYS stood here until the refresh pass — Jake's read was
              "just doesn't feel super helpful". The component survives at
              DailyWidget.tsx; remounting it is this one line back. */}
          <MiniPlayer />
          {/* COMMAND.CTR stood here until case-rail round 4 — Jake's call
              that it's system chrome, not a floating widget. It now lives
              in the menu bar; see MenuBar.tsx and CommandWidget.tsx. */}
          <PhotoWall />
          {/* the machine says whose it is. Jake's name and title used to be
              one double-click deep inside README, which meant a stranger who
              closed that window, or who landed on the mobile launcher where
              no window opens at all, never saw it. Mounted after the wall so
              it paints over a full column of pins. */}
          <Nameplate />
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
        </div>
        {/* the bare desk, while the shelf is up: a click here leaves the
            mode. It sits above the receded desk and below the rail (see
            .deskCatcher), which is what lets the WORK tile stay lit and
            live while everything behind it is out of reach. */}
        {shelfMode && (
          <div
            className={styles.deskCatcher}
            aria-hidden="true"
            onClick={() => useShelfMode.getState().leave()}
          />
        )}
        <Dock />
      </main>
      <AnimatePresence>{shelfMode && <ShelfMode key="shelf-mode" />}</AnimatePresence>
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
