'use client'

import { PROGRAMS } from '@/programs/registry'
import { VIZ } from '@/programs/visualizers/vizRegistry'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { Icon } from './Icon'
import styles from './shell.module.css'

/* Desktop icons: programs first, then the visualizers broken out as
   first-class desktop citizens (each opens its viz:<id> window directly). */

export function DesktopIcons() {
  const open = useWindows((s) => s.open)

  const items = [
    ...PROGRAMS.filter((p) => p.onDesktop).map((p) => ({
      key: p.id,
      windowId: p.id,
      name: p.name,
      icon: p.icon,
    })),
    ...VIZ.filter((v) => v.status === 'live').map((v) => ({
      key: `viz-${v.id}`,
      windowId: `viz:${v.id}`,
      name: v.name,
      icon: v.icon,
    })),
  ]

  return (
    <nav className={styles.icons} aria-label="Programs and visualizers">
      {items.map((it) => (
        <button
          key={it.key}
          className={styles.iconBtn}
          onClick={() => {
            sfx.open()
            open(it.windowId)
          }}
        >
          <Icon name={it.icon} />
          <span className={styles.iconLabel}>{it.name}</span>
        </button>
      ))}
    </nav>
  )
}
