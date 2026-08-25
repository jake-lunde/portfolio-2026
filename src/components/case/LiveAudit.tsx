'use client'

import { useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useFidelity } from './fidelity'
import styles from './case.module.css'

/* §06 live-audit centerpiece, the film cut. The scene started as an
   in-repo 128x64 ASCII pixel plate (the git history of PR #78 holds
   it); Jake fed that render and his refs to Midjourney and refined
   the result into a 5s ambient loop: rain on the window, steam off
   the mug, him shifting between the DevTools laptop and the hub.
   The film is decorative and aria-hidden; the mono readout under it
   carries the change, and the fidelity pair still flips it.
   Only the visible pane mounts the <video> (the store says which),
   so the hidden pane never decodes. Reduced motion and any autoplay
   refusal hold the poster frame instead (CoverFilm's pattern: the
   film fades in on its first painted frame, and a failure never
   paints broken-media furniture). */

const FILM = '/case/family-hub/live-audit.mp4'
const POSTER = '/case/family-hub/live-audit-poster.webp'

/* ⚠ placeholder-shaped values: the real ticket numbers are Jake's */
const READOUT = {
  build: 'EVENT.TOP · 84px · 84px · COLLIDES',
  fix: 'EVENT.TOP · var(--timeline-row) · STACKS',
}

export function LiveAudit({ mode }: { mode: 'build' | 'fix' }) {
  const current = useFidelity((s) => s.mode)
  const reduced = useReducedMotion()
  /** the film has painted a frame — until then the poster is the face */
  const [clear, setClear] = useState(false)
  const visible = (mode === 'build') === (current === 'draft')
  return (
    <div className={styles.audit}>
      <span className={styles.auditFilm} aria-hidden="true">
        <img src={POSTER} alt="" width={864} height={432} />
        {visible && !reduced && (
          <video
            data-clear={clear ? '' : undefined}
            src={FILM}
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            onPlaying={() => setClear(true)}
          />
        )}
      </span>
      <p className={styles.auditReadout}>
        <span className={styles.auditTick} aria-hidden="true">▸ </span>
        {READOUT[mode]}
      </p>
    </div>
  )
}
