'use client'

import { PROGRAMS } from '@/programs/registry'
import { useWindows } from '@/store/windows'
import { useShelfMode } from '@/store/shelfMode'
import { useSettings } from '@/store/settings'
import { programName } from '@/lib/skinVocab'
import { sfx } from '@/lib/sound'
import { Icon } from './Icon'
import { DOCKED, DOCKED_ORDER } from './Dock'
import styles from './shell.module.css'

/* Desktop launcher. README is the only door left standing. Trash joined
   the dock rail this round (Dock.tsx: RAIL_ORDER, last tile) — it no
   longer has a desktop-corner instance of its own, but it still rides
   the scrolling grid on mobile (.trashGrid, unchanged) since the rail
   doesn't render there.

   THE SPLIT (poolsuite pass, case-rail): the grid used to carry every
   onDesktop program in one reading order. Everything but README now
   rides the bottom Dock instead (Dock.tsx): a NeXTSTEP-style rail of
   uniform tiles, so it reads as one machined row rather than more
   desktop clutter. DOCKED (Dock.tsx) is the membership test;
   DOOR_ORDER below is just the one door that stayed.

   The dock doesn't render below the shell's mobile floor (720px — the
   same width that turns windows into a full-bleed stack), and a media
   query can't reach into JSX to exclude an id. So the docked programs are
   ALSO rendered here, in the rail's own reading order, hidden by default
   (.dockedGrid) and shown only inside that same media query — mirroring
   how .trashGrid already works. Nothing renders twice: on desktop the
   docked buttons are display:none and the rail is the only copy on
   screen; below 720px the rail is display:none and the grid is the only
   copy.

   README is the single identity door (session 41 retired ABOUT THIS
   MACHINE): the machine's own opinion now hangs off a CTA inside it. */

const DOOR_ORDER = ['readme']

const doorRank = (id: string) => {
  const i = DOOR_ORDER.indexOf(id)
  return i === -1 ? 5000 : i
}

const dockedRank = (id: string) => {
  const i = DOCKED_ORDER.indexOf(id)
  return i === -1 ? 5000 : i
}

export function DesktopIcons() {
  const open = useWindows((s) => s.open)
  const toggleShelf = useShelfMode((s) => s.toggle)
  const skin = useSettings((s) => s.skin)
  const desktopPrograms = PROGRAMS.filter((p) => p.onDesktop)
  const trash = desktopPrograms.find((p) => p.id === 'trash')
  const doors = desktopPrograms
    .filter((p) => p.id !== 'trash' && !DOCKED.has(p.id))
    .sort((a, b) => doorRank(a.id) - doorRank(b.id))
  // mobile-only fallback: the same programs the dock holds, rendered here
  // too and hidden by CSS above the mobile floor (see header comment)
  const dockedForMobile = desktopPrograms
    .filter((p) => DOCKED.has(p.id))
    .sort((a, b) => dockedRank(a.id) - dockedRank(b.id))

  /* WORK opens no window from here either — it brings the shelf up on the
     desk (store/shelfMode.ts, and Dock.tsx has the same fork). This grid
     is the mobile launcher in practice, where the mode is full-bleed. */
  const launch = (id: string, from: HTMLElement) => {
    if (id === 'progress') {
      toggleShelf(from)
      return
    }
    sfx.open()
    open(id)
  }

  /* data-part is the anatomy marker STYLER's bench direct-selects by: one
     per part the token names already declare (lib/stylerBlocks.ts:
     layersFor), so ⌘+click on the stage lands on the same layer the left
     panel lists. An attribute and nothing else — only the stage reads it. */
  const iconBtn = (p: (typeof desktopPrograms)[number], extra = '') => (
    <button
      key={p.id}
      className={`${styles.iconBtn} ${extra}`}
      data-part="icon"
      onClick={(e) => launch(p.id, e.currentTarget)}
    >
      <Icon name={p.icon} />
      <span className={styles.iconLabel} data-part="label" data-copy-id={`program.${p.id}.name`}>
        {programName(p.id, p.desktopLabel ?? p.name, skin)}
      </span>
    </button>
  )

  return (
    <nav
      className={`${styles.icons} ${styles.deskObject}`}
      aria-label="Programs"
      data-component="desktop-icons"
    >
      {doors.map((p) => iconBtn(p))}
      {dockedForMobile.map((p) => iconBtn(p, styles.dockedGrid))}
      {/* trash joins the grid on mobile only (see .trashGrid) — on desktop
          it rides the dock rail instead (Dock.tsx: RAIL_ORDER) */}
      {trash && iconBtn(trash, styles.trashGrid)}
    </nav>
  )
}
