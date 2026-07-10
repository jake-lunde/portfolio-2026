'use client'

import { PROGRAMS } from '@/programs/registry'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { Icon } from './Icon'
import styles from './shell.module.css'

export function DesktopIcons() {
  const open = useWindows((s) => s.open)

  return (
    <nav className={styles.icons} aria-label="Programs">
      {PROGRAMS.filter((p) => p.onDesktop).map((p) => (
        <button
          key={p.id}
          className={styles.iconBtn}
          onClick={() => {
            sfx.open()
            open(p.id)
          }}
        >
          <Icon name={p.icon} />
          <span className={styles.iconLabel}>{p.name}</span>
        </button>
      ))}
    </nav>
  )
}
