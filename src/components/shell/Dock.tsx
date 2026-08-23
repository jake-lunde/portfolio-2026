'use client'

import { PROGRAMS } from '@/programs/registry'
import { useWindows } from '@/store/windows'
import { useShelfMode } from '@/store/shelfMode'
import { useSettings } from '@/store/settings'
import { programName } from '@/lib/skinVocab'
import { sfx } from '@/lib/sound'
import { Icon } from './Icon'
import styles from './dock.module.css'

/* NeXTSTEP-style dock, poolsuite.net pass (case-rail, round 3). Every
   desktop program now lives here except README (the one identity door
   left on the desktop) and spec-sheet, which just left for the menubar
   (other workstream) — see DesktopIcons.tsx's header comment for the
   desktop/mobile split. Trash joined this round too, last tile.

   Two exports, two different jobs — they used to be one list and that
   conflated them:
   - RAIL_ORDER is what THIS component renders, left to right. It drops
     spec-sheet (gone from the rail) and adds trash (new, last).
   - DOCKED_ORDER / DOCKED (below) is the membership test DesktopIcons
     filters its own grid against — it KEEPS spec-sheet, because on
     mobile there is no menubar for spec-sheet to live in, so mobile
     still needs it in the launcher grid; drop it from DOCKED and it
     would resurface as an orphan desktop icon and vanish from mobile in
     the same move. Trash stays out of DOCKED_ORDER, same as before —
     DesktopIcons has always special-cased trash on its own.

   `feedback` rides along even though its registry entry is
   onDesktop:false today (Jake, s44) — the `onDesktop` filter below
   already keeps it off screen everywhere until he flips it back, at
   which point it lands here with no further wiring. */

export const RAIL_ORDER = [
  'progress',
  'cv',
  'guestbook',
  'music',
  'fun',
  'feedback',
  'suggest',
  'settings',
  'trash',
]

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

const RAIL = new Set<string>(RAIL_ORDER)

const rank = (id: string) => {
  const i = RAIL_ORDER.indexOf(id)
  return i === -1 ? 999 : i
}

export function Dock() {
  const open = useWindows((s) => s.open)
  const windows = useWindows((s) => s.windows)
  const shelfOn = useShelfMode((s) => s.on)
  const toggleShelf = useShelfMode((s) => s.toggle)
  const leaveShelf = useShelfMode((s) => s.leave)
  const skin = useSettings((s) => s.skin)

  const programs = PROGRAMS.filter((p) => p.onDesktop && RAIL.has(p.id)).sort(
    (a, b) => rank(a.id) - rank(b.id),
  )

  /* WORK IS THE ONE TILE THAT DOES NOT OPEN A WINDOW. It brings the shelf
     up on the desk instead (store/shelfMode.ts), it lights the same way a
     running program lights, and pressing it again puts the desk back —
     which is the one place the rail's "a second click re-focuses, it does
     not stop the program" rule genuinely inverts. The tile passes itself
     along so focus can come home to it on the way out. */
  const launch = (id: string, from: HTMLElement) => {
    if (id === 'progress') {
      toggleShelf(from)
      return
    }
    /* ANY OTHER TILE PUTS THE DESK BACK AND OPENS ITSELF, in one press
       (Jake). The rail is the one piece of furniture that stays lit and
       live while the shelf is up, so a tile that only dismissed the mode
       would be asking for the same click twice — and a dock tile has
       always meant "give me this program", never "close what you were
       doing first". `restoreFocus: false`: measured, focus stays on the
       dock tile through this path, so this just stops it jumping back to
       the WORK tile once the program below opens. `silent: true`: the
       open below plays its own sound; without this the leave's close
       sound would double up with it in one press. */
    if (shelfOn) leaveShelf({ restoreFocus: false, silent: true })
    sfx.open()
    // open() already focuses rather than re-opening a running program
    // (useWindows.open) — the dock leans on that, it does not special-case it
    open(id)
  }

  return (
    <nav className={styles.rail} aria-label="Dock">
      {programs.map((p) => {
        const name = programName(p.id, p.desktopLabel ?? p.name, skin)
        const running = p.id === 'progress' ? shelfOn : windows.some((w) => w.id === p.id)
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
            onClick={(e) => launch(p.id, e.currentTarget)}
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
