'use client'

import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

export function CaseFooter({ next }: { next: { name: string; live: boolean } }) {
  const open = useWindows((s) => s.open)

  return (
    <footer className={styles.caseFooter}>
      <button className={styles.nextlink} disabled={!next.live}>
        <span>Next project {next.live ? '→' : '· soon'}</span>
        {next.name}
      </button>
      <button
        className={styles.nextlink}
        style={{ textAlign: 'right' }}
        onClick={() => {
          sfx.open()
          open('projects')
        }}
      >
        <span>Index</span>
        All work
      </button>
    </footer>
  )
}
