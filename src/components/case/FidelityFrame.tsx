'use client'

import { useFidelity } from './fidelity'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* A paired plate surface: one frame, two states, following the case's
   single fidelity switch (s94 — pairs used to sit side by side; Jake's
   call was one visual at a time). The chip names this pair's actual
   rungs in the rail's version language and restates the global mode;
   pressing a side flips the whole case, never just this plate. Panes
   swap instantly (1992 machines don't crossfade), and the off pane is
   display:none so nothing hidden stays in the tab order. */

export function FidelityFrame({
  vDraft,
  vShipped,
  draft,
  shipped,
}: {
  /** this pair's rung labels — rail versions (v0.4) or a pair's own words (BUILD/FIX) */
  vDraft: string
  vShipped: string
  draft: React.ReactNode
  shipped: React.ReactNode
}) {
  const mode = useFidelity((s) => s.mode)
  const set = useFidelity((s) => s.set)
  const sides = [
    ['draft', vDraft],
    ['shipped', vShipped],
  ] as const
  return (
    <div className={styles.fidFrame}>
      <div className={styles.fidChip} role="group" aria-label="Fidelity">
        {sides.map(([id, label]) => (
          <button
            key={id}
            className={styles.fidChipSeg}
            aria-pressed={mode === id}
            onClick={() => {
              if (mode === id) return
              sfx.tap()
              set(id)
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.fidStage} data-mode={mode}>
        <div data-pane="draft">{draft}</div>
        <div data-pane="shipped">{shipped}</div>
      </div>
    </div>
  )
}
