'use client'

import { PROGRAMS } from '@/programs/registry'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { Icon } from './Icon'
import styles from './shell.module.css'

export function DesktopIcons() {
  const open = useWindows((s) => s.open)
  const desktopPrograms = PROGRAMS.filter((p) => p.onDesktop)
  // Trash rides alone in the bottom-left corner, not the icon grid
  const trash = desktopPrograms.find((p) => p.id === 'trash')
  const rest = desktopPrograms.filter((p) => p.id !== 'trash')

  const launch = (id: string) => {
    sfx.open()
    open(id)
  }

  return (
    <>
      <nav className={styles.icons} aria-label="Programs">
        {rest.map((p) => (
          <button key={p.id} className={styles.iconBtn} onClick={() => launch(p.id)}>
            <Icon name={p.icon} />
            <span className={styles.iconLabel}>{p.name}</span>
          </button>
        ))}
      </nav>
      {trash && (
        <button
          className={`${styles.iconBtn} ${styles.trashIcon}`}
          onClick={() => launch(trash.id)}
        >
          <Icon name={trash.icon} />
          <span className={styles.iconLabel}>{trash.name}</span>
        </button>
      )}
    </>
  )
}
