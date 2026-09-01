'use client'

import { useFidelity } from './fidelity'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* A paired plate surface: one frame, two states, following the case's
   single fidelity switch (s94 — pairs used to sit side by side; Jake's
   call was one visual at a time). Panes swap instantly (1992 machines
   don't crossfade), and the off pane is display:none so nothing hidden
   stays in the tab order.

   s134 split the control off the stage: the chip is the plate's
   "change when" control and rides the cap row (Plate's `chip` slot), so
   every plate wears its fidelity switch in the same corner. The frame
   is the stage alone. */

/* the chip names this pair's actual rungs in the rail's version
   language and restates the global mode; pressing a side flips the
   whole case, never just this plate */
export function FidelityChip({
  vDraft,
  vShipped,
}: {
  /** this pair's rung labels — rail versions (v0.4) or a pair's own words (BUILD/FIX) */
  vDraft: string
  vShipped: string
}) {
  const mode = useFidelity((s) => s.mode)
  const set = useFidelity((s) => s.set)
  const sides = [
    ['draft', vDraft],
    ['shipped', vShipped],
  ] as const
  return (
    <span className={styles.fidChip} role="group" aria-label="Fidelity">
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
    </span>
  )
}

export function FidelityFrame({
  draft,
  shipped,
}: {
  draft: React.ReactNode
  shipped: React.ReactNode
}) {
  const mode = useFidelity((s) => s.mode)
  return (
    <div className={styles.fidStage} data-mode={mode}>
      <div data-pane="draft">{draft}</div>
      <div data-pane="shipped">{shipped}</div>
    </div>
  )
}
