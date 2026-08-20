'use client'

import { useFidelity, type Fidelity } from './fidelity'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* FIDELITY.SW — the case's one hardware switch. A small tab hanging
   under the read-o-meter's right end, sticky with it, so the control
   is in the same place at every width (the rail never renders below
   640px; this does — it IS the fidelity story on mobile). Two big
   dumb buttons, no third state. The generic v0.x/v1.0 labels are the
   switch's own; each paired plate restates the mode in its own
   version numbers via its chip. */

const SIDES: Array<{ id: Fidelity; v: string; label: string }> = [
  { id: 'draft', v: 'v0.x', label: 'Draft' },
  { id: 'shipped', v: 'v1.0', label: 'Shipped' },
]

export function FidelitySwitch() {
  const mode = useFidelity((s) => s.mode)
  const set = useFidelity((s) => s.set)
  return (
    <div className={styles.fidSlot}>
      <div
        className={styles.fidTab}
        role="group"
        aria-label="Fidelity switch: every paired plate in the case follows it"
      >
        {SIDES.map((side) => (
          <button
            key={side.id}
            className={styles.fidSeg}
            aria-pressed={mode === side.id}
            onClick={() => {
              if (mode === side.id) return
              sfx.tap()
              set(side.id)
            }}
          >
            <span className={styles.fidV}>{side.v}</span>
            {side.label}
          </button>
        ))}
      </div>
    </div>
  )
}
