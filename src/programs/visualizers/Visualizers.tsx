'use client'

import { VIZ } from './vizRegistry'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import styles from '../programs.module.css'

/* The Visualizers folder — a finder-style index; each visualizer opens
   in its own window. */

export default function Visualizers() {
  const open = useWindows((s) => s.open)

  return (
    <div className={styles.projects}>
      <div className={styles.projHead}>
        <span>Visualizers — data, played with</span>
        <span>{VIZ.filter((v) => v.status === 'live').length} live</span>
      </div>
      {VIZ.map((v) => (
        <button
          key={v.id}
          className={styles.projRow}
          disabled={v.status !== 'live'}
          onClick={() => {
            sfx.open()
            open(`viz:${v.id}`)
          }}
        >
          <span className={styles.projNo}>{v.no}</span>
          <span className={styles.projName}>{v.name}</span>
          {v.status === 'live' ? (
            <span className={styles.projOrg}>{v.source}</span>
          ) : (
            <span className={styles.projSoon}>Soon</span>
          )}
          <span className={styles.projYear}>{v.status === 'live' ? 'RUN ▸' : ''}</span>
        </button>
      ))}
    </div>
  )
}
