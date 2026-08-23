'use client'

import { useWindows } from '@/store/windows'
import { useShelfMode } from '@/store/shelfMode'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

export function CaseFooter({ next }: { next: { name: string; live: boolean; slug?: string } }) {
  const open = useWindows((s) => s.open)
  const enterShelf = useShelfMode((s) => s.enter)

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
        onClick={(e) => {
          /* one door in: WORK, not the flat index (session 25) — and it
             is a mode of the desk now, so this brings the shelf up OVER
             the case the reader is standing in. Escape puts them back on
             the page they were reading. */
          enterShelf(e.currentTarget)
        }}
      >
        <span>Index</span>
        All work
      </button>
    </footer>
  )
}
