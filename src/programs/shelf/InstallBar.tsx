'use client'

import { motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import styles from './shelf.module.css'

/* The installer bar, carried whole from the old IN PROGRESS window
   (WIP-15). `striped` = the OS 9 installer fill; plain = a per-case meter.
   The fill layer is full-width and never scaled — what animates is an
   opaque shutter over the *unfilled* remainder, scaled from the right.
   Transform-only (no width animation, no CLS) and it keeps the diagonal
   stripes at their true width instead of squashing them.

   `seconds` swaps the spring for a tween: the install sequence steps the
   bar on a clock, and a clock is what an installer has. */

export function InstallBar({
  pct,
  striped = false,
  role,
  label,
  delay = 0,
  seconds,
}: {
  pct: number
  striped?: boolean
  role: 'progressbar' | 'meter'
  label: string
  delay?: number
  seconds?: number
}) {
  const reduced = useReducedMotion()
  const v = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <div
      className={striped ? `${styles.track} ${styles.trackLg}` : styles.track}
      role={role}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={label}
    >
      <span className={striped ? styles.stripes : styles.solid} aria-hidden="true" />
      <motion.span
        className={styles.shutter}
        aria-hidden="true"
        initial={{ scaleX: reduced ? 1 - v / 100 : 1 }}
        animate={{ scaleX: 1 - v / 100 }}
        transition={
          reduced
            ? { duration: 0 }
            : seconds
              ? { duration: seconds, ease: 'easeOut', delay }
              : { ...SPRINGS.rise, delay }
        }
      />
    </div>
  )
}
