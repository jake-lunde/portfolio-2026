'use client'

import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

export function CaseFooter({ next }: { next: { name: string; live: boolean; slug?: string } }) {
  const open = useWindows((s) => s.open)

  return (
    <footer className={styles.caseFooter}>
      <button
        className={styles.nextlink}
        disabled={!next.live || !next.slug}
        onClick={() => {
          if (!next.slug) return
          sfx.open()
          open(`case:${next.slug}`)
        }}
      >
        <span>Next project {next.live ? '→' : '· soon'}</span>
        {next.name}
      </button>
      <button
        className={styles.nextlink}
        style={{ textAlign: 'right' }}
        onClick={() => {
          sfx.open()
          // one door in: CASE STUDIES, not the flat index (session 25)
          open('progress')
        }}
      >
        <span>Index</span>
        All work
      </button>
    </footer>
  )
}
