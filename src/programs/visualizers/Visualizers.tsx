'use client'

import { VIZ_LISTED } from './vizRegistry'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { Icon } from '@/components/shell/Icon'
import styles from '../programs.module.css'

/* The Visualizers folder — Finder icon view. Each item opens its own
   viz:<id> window. Lists VIZ_LISTED, not VIZ: a viz rehomed into another
   drawer (scrobbles → MUSIC / HISTORY) is marked hidden and drops out of
   both the grid and the count, while staying resolvable by id. */

export default function Visualizers() {
  const open = useWindows((s) => s.open)

  return (
    <div className={styles.vizFolder}>
      <div className={styles.projHead}>
        <span>Visualizers — data, played with</span>
        <span>{VIZ_LISTED.filter((v) => v.status === 'live').length} items</span>
      </div>
      <div className={styles.vizGrid}>
        {VIZ_LISTED.map((v) => (
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
