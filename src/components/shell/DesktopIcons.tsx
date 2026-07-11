'use client'

import { PROGRAMS } from '@/programs/registry'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { Icon } from './Icon'
import styles from './shell.module.css'

/* Desktop launcher. Explicit reading order: README · GUESTBOOK · ABOUT
   THIS MACHINE lead the top row; SETTINGS is always last. The grid flows
   by row so the top row is literal. Trash rides the bottom-left corner on
   desktop, but joins the scrolling grid on mobile. */

const ORDER = [
  'readme',
  'guestbook',
  'machine',
  'projects',
  'studio',
  'visualizers',
  'booth',
  'puzzle',
  'paint',
  'sequencer',
  'command',
  'field-notes',
  'spec-sheet',
]

const rank = (id: string) => {
  if (id === 'settings') return 9999 // always last
  const i = ORDER.indexOf(id)
  return i === -1 ? 5000 : i // unknowns land before settings
}

export function DesktopIcons() {
  const open = useWindows((s) => s.open)
  const desktopPrograms = PROGRAMS.filter((p) => p.onDesktop)
  const trash = desktopPrograms.find((p) => p.id === 'trash')
  const rest = desktopPrograms
    .filter((p) => p.id !== 'trash')
    .sort((a, b) => rank(a.id) - rank(b.id))

  const launch = (id: string) => {
    sfx.open()
    open(id)
  }

  const iconBtn = (p: (typeof desktopPrograms)[number], extra = '') => (
    <button key={p.id} className={`${styles.iconBtn} ${extra}`} onClick={() => launch(p.id)}>
      <Icon name={p.icon} />
      <span className={styles.iconLabel}>{p.desktopLabel ?? p.name}</span>
    </button>
  )

  return (
    <>
      <nav className={styles.icons} aria-label="Programs">
        {rest.map((p) => iconBtn(p))}
        {/* trash joins the grid on mobile only (see .trashGrid) */}
        {trash && iconBtn(trash, styles.trashGrid)}
      </nav>
      {/* trash in its bottom-left corner on desktop only (see .trashIcon) */}
      {trash && iconBtn(trash, styles.trashIcon)}
    </>
  )
}
