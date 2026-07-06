'use client'

import { CASES } from './cases'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import styles from '../programs.module.css'

export default function Projects() {
  const open = useWindows((s) => s.open)

  return (
    <div className={styles.projects}>
      <div className={styles.projHead}>
        <span>Index — Selected work</span>
        <span>{CASES.length} items</span>
      </div>
      {CASES.map((c) => (
        <button
          key={c.slug}
          className={styles.projRow}
          disabled={c.status !== 'live'}
          onClick={() => {
            sfx.open()
            open(`case:${c.slug}`)
          }}
        >
          <span className={styles.projNo}>{c.no}</span>
          <span className={styles.projName}>{c.name}</span>
          {c.status === 'live' ? (
            <span className={styles.projOrg}>{c.org}</span>
          ) : (
            <span className={styles.projSoon}>Soon</span>
          )}
          <span className={styles.projYear}>{c.year}</span>
        </button>
      ))}
    </div>
  )
}
