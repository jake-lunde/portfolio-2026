'use client'

import { VIZ } from './vizRegistry'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { Icon } from '@/components/shell/Icon'
import styles from '../programs.module.css'

/* The Visualizers folder — Finder icon view. Each item opens its own
   viz:<id> window. */

export default function Visualizers() {
  const open = useWindows((s) => s.open)

  return (
    <div className={styles.vizFolder}>
      <div className={styles.projHead}>
        <span>Visualizers — data, played with</span>
        <span>{VIZ.filter((v) => v.status === 'live').length} items</span>
      </div>
      <div className={styles.vizGrid}>
        {VIZ.map((v) => (
          <button
            key={v.id}
            className={styles.vizIconBtn}
            disabled={v.status !== 'live'}
            onClick={() => {
              sfx.open()
              open(`viz:${v.id}`)
            }}
          >
            <Icon name={v.icon} />
            <span className={styles.vizIconLabel}>{v.name}</span>
            <span className={styles.vizIconMeta}>
              {v.status === 'live' ? v.source : 'SOON'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
