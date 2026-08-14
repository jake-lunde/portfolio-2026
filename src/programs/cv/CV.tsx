'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { t } from '@/content/copy'
import { SPRINGS } from '@/lib/motion'
import { cvSfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import { buildPasses } from './passes'
import styles from './cv.module.css'

/* RESUME.EXE — open it and the page prints itself.
 *
 * Jake's read on v3: nobody in 2026 wants to PRESS print on a resume; they
 * want to watch it arrive, then download it. So the ritual runs on open —
 * a System 7 job card (striped bar, thermometer, dot-matrix chatter) over
 * the sheet for ~2 seconds, then the document is just there with one
 * button: DOWNLOAD PDF.
 *
 * The page is a RENDER of src/content/resume.ts; the download is
 * public/jake-lunde-resume.pdf, built from the same file by
 * scripts/build-cv.mjs, so the two can't drift. Content is Jake's own
 * pruning pass — encourage more of those; he is the person.
 *
 * The download control itself lives in the titlebar now (registry.tsx's
 * `titleAction`, rendered by Window.tsx) — round 4 retired the in-body
 * toolbar button and its hidden-anchor apparatus as tacked-on; the paper
 * is the whole body again.
 *
 * The paper FEEDS: while the job runs, the sheet slides up from below the
 * tray one tick at a time, in lockstep with the thermometer (`--print-t`
 * is the same tick/TICKS the fill uses) — the page physically arrives
 * instead of fading in where it already sat.
 *
 * A11y invariants: the full resume is in the DOM from first paint (the
 * pre-print state moves it with transform only, which screen readers
 * ignore); reduced motion skips the theater entirely; reveal is CSS driven
 * by data-phase + a custom property, never Motion (rAF freezes in hidden
 * tabs). data-no-translate keeps knight-speak off the facts. No useId
 * (dynamic-import programs mismatch at SSR handover); constant ids only.
 */

const TICKS = 14
const TICK_MS = 150

type Phase = 'printing' | 'done'

export default function CV() {
  const skin = useSettings((s) => s.skin)
  const reduced = useReducedMotion()
  const passes = useMemo(buildPasses, [])

  const [phase, setPhase] = useState<Phase>('printing')
  const [tick, setTick] = useState(0)

  // reduced motion: the document simply arrives
  useEffect(() => {
    if (reduced) setPhase('done')
  }, [reduced])

  // the job: chatter per head pass, tear when the page is out
  useEffect(() => {
    if (phase !== 'printing' || reduced) return
    if (tick >= TICKS) {
      cvSfx.tear()
      setPhase('done')
      return
    }
    const id = setTimeout(() => {
      setTick((n) => n + 1)
      cvSfx.chatter()
    }, TICK_MS)
    return () => clearTimeout(id)
  }, [phase, tick, reduced])

  return (
    <div
      className={styles.cv}
      data-phase={phase}
      style={{ '--print-t': tick / TICKS } as CSSProperties}
    >
      <div className={styles.feed}>
        <div className={styles.paper} data-no-translate="">
          <span className={styles.sprocket} aria-hidden="true" />
          <div className={styles.sheet}>{passes}</div>
          <span className={styles.sprocket} aria-hidden="true" />
        </div>
      </div>

      {/* the job card: System 7 chrome over the arriving page */}
      <AnimatePresence>
        {phase === 'printing' ? (
          <motion.div
            className={styles.dialogWrap}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
          >
            <motion.div
              role="status"
              aria-label={t('cv.printTitle', skin)}
              className={styles.dialog}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={SPRINGS.deck}
              data-spring="deck"
            >
              <div className={styles.dialogBar}>
                <span className={styles.dialogStripes} aria-hidden="true" />
                <span className={styles.dialogTitle}>{t('cv.printTitle', skin)}</span>
                <span className={styles.dialogStripes} aria-hidden="true" />
              </div>
              <div className={styles.dialogBody}>
                <div className={styles.dProgressTrack} aria-hidden="true">
                  <span
                    className={styles.dProgressFill}
                    style={{ transform: `scaleX(${tick / TICKS})` }}
                  />
                </div>
                <p className={styles.dStatus} aria-live="polite">
                  {t('cv.printing', skin)}
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
