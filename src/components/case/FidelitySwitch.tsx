'use client'

import { useFidelity } from './fidelity'
import { sfx } from '@/lib/sound'
import styles from './FidelitySwitch.module.css'

/* FIDELITY.SW — the case's one hardware switch, riding the window bar's
   right slot (s94b, Jake's call: in the titlebar, and it has to READ as
   a toggle). A classic rocker: two labels, a track, a knob that slides.
   Pressing anywhere flips the whole case between draft and shipped;
   every paired plate (FidelityFrame) and HubModes' panes follow. Colors
   are all currentColor so it wears whatever ink the titlebar has, per
   skin and focus state.

   The titlebar drags and double-click zooms — this control, like
   TitleAction, lets neither fire from inside it. */

export function FidelitySwitch() {
  const mode = useFidelity((s) => s.mode)
  const set = useFidelity((s) => s.set)
  const shipped = mode === 'shipped'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={shipped}
      aria-label="Fidelity: flip the whole case between draft and shipped"
      className={styles.sw}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={() => {
        sfx.tap()
        set(shipped ? 'draft' : 'shipped')
      }}
    >
      <span className={styles.side} data-on={!shipped ? 'true' : undefined}>
        Draft
      </span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
      <span className={styles.side} data-on={shipped ? 'true' : undefined}>
        Shipped
      </span>
    </button>
  )
}
