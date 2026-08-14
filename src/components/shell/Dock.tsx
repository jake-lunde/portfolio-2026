'use client'

import { PROGRAMS } from '@/programs/registry'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { programName } from '@/lib/skinVocab'
import { sfx } from '@/lib/sound'
import { Icon } from './Icon'
import styles from './dock.module.css'

/* NeXTSTEP-style dock, poolsuite.net pass (case-rail). Every desktop
   program now lives here except README (the one identity door left on
   the desktop) and Trash (its own corner) — see DesktopIcons.tsx's
   header comment for that split and its mobile fallback.

   DOCKED_ORDER is this rail's reading order, left to right. DOCKED is
   the membership test DesktopIcons filters its own grid against.
   `feedback` rides along even though its registry entry is
   onDesktop:false today (Jake, s44) — the `onDesktop` filter below
   already keeps it off screen everywhere until he flips it back, at
   which point it lands here with no further wiring. */

export const DOCKED_ORDER = [
  'progress',
  'cv',
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
        return (
          <button
            key={p.id}
            type="button"
            className={styles.tile}
            /* the visible caption below the icon is aria-hidden (see
               below) so the running state has to reach an accessible
               name directly. aria-label over aria-pressed: aria-pressed
               claims toggle-button semantics (press again to un-press),
               and a second click here doesn't stop the program, it
               re-focuses it — a false promise a toggle role would make. */
            aria-label={running ? `${name} (running)` : name}
            onClick={() => launch(p.id)}
          >
            <Icon name={p.icon} />
            <span className={styles.label} data-copy-id={`program.${p.id}.name`} aria-hidden="true">
              {name}
            </span>
            <span className={styles.ledSlot}>
              {running && <span className={styles.led} aria-hidden="true" />}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
