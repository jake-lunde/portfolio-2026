'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { PROGRAMS } from '@/programs/registry'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { programName } from '@/lib/skinVocab'
import { sfx } from '@/lib/sound'
import { SPRINGS } from '@/lib/motion'
import { Icon } from './Icon'
import styles from './dock.module.css'

/* NeXTSTEP-style dock — POC on case-rail. The desktop grid (DesktopIcons)
   used to carry every onDesktop program in one reading order, doors and
   tail alike. The tail rides here instead: one fixed rail of uniform
   tiles, so it reads as a machined instrument rather than more desktop
   clutter — same size regardless of glyph, which is the entire point.

   DOCKED_ORDER is this rail's reading order, left to right. DOCKED is the
   membership test DesktopIcons filters its own grid against (see that
   file's header comment for the mobile fallback this forces). `feedback`
   rides along even though its registry entry is onDesktop:false today
   (Jake, s44) — the `onDesktop` filter below already keeps it off screen
   everywhere until he flips it back, at which point it lands here with no
   further wiring, exactly like it sat in the old ORDER array. */

export const DOCKED_ORDER = [
  'guestbook',
  'music',
  'fun',
  'feedback',
  'suggest',
  'spec-sheet',
  'settings',
]

export const DOCKED = new Set<string>(DOCKED_ORDER)

const rank = (id: string) => {
  const i = DOCKED_ORDER.indexOf(id)
  return i === -1 ? 999 : i
}

export function Dock() {
  const open = useWindows((s) => s.open)
  const windows = useWindows((s) => s.windows)
  const skin = useSettings((s) => s.skin)
  const reduced = useReducedMotion()
  // one tile's title hint is up at a time — a single id, not per-tile
  // state, keeps this to one subscription-free piece of state
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const programs = PROGRAMS.filter((p) => p.onDesktop && DOCKED.has(p.id)).sort(
    (a, b) => rank(a.id) - rank(b.id),
  )

  const launch = (id: string) => {
    sfx.open()
    // open() already focuses rather than re-opening a running program
    // (useWindows.open) — the dock leans on that, it does not special-case it
    open(id)
  }

  return (
    <nav className={styles.rail} aria-label="Dock">
      {programs.map((p) => {
        const name = programName(p.id, p.desktopLabel ?? p.name, skin)
        const running = windows.some((w) => w.id === p.id)
        const hovered = hoveredId === p.id
        return (
          <button
            key={p.id}
            type="button"
            className={styles.tile}
            /* the tile's visible content is icon + LED only — the name only
               shows on hover/focus as the title hint below — so the running
               state has to reach an accessible name directly. aria-label
               over aria-pressed: aria-pressed claims toggle-button
               semantics (press again to un-press), and a second click here
               doesn't stop the program, it re-focuses it — a false promise
               a toggle role would make. */
            aria-label={running ? `${name} (running)` : name}
            onClick={() => launch(p.id)}
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId((v) => (v === p.id ? null : v))}
            onFocus={() => setHoveredId(p.id)}
            onBlur={() => setHoveredId((v) => (v === p.id ? null : v))}
          >
            <Icon name={p.icon} />
            {running && <span className={styles.led} aria-hidden="true" />}
            <AnimatePresence>
              {hovered && (
                <motion.span
                  className={styles.label}
                  data-copy-id={`program.${p.id}.name`}
                  aria-hidden="true"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  transition={reduced ? { duration: 0 } : SPRINGS.mini}
                  data-spring="mini"
                >
                  {name}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )
      })}
    </nav>
  )
}
