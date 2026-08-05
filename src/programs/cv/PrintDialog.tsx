'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/primitives/Button'
import { t } from '@/content/copy'
import { SPRINGS } from '@/lib/motion'
import { cvSfx, sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import styles from './cv.module.css'

/* The System 7 print dialog — the ritual lives HERE now, not in a printer
 * object. In 1992 a document left the computer through this exact piece of
 * chrome, so the gag is accurate: striped title bar, Printer/Quality/Pages
 * rows, Cancel/Print, a progress bar, and then the PDF actually lands.
 *
 * Quality is a real toy, not a dead control: Draft runs the job fast with
 * sparse chatter; NLQ takes twice as long with a second head pass per tick,
 * like the genuine article.
 *
 * Progress is a CSS transform (scaleX), not Motion — rAF freezes in hidden
 * tabs and a print job must finish regardless (hidden-tab law). Escape is
 * a capture-phase listener that stops propagation so the host window's own
 * Escape-to-close never fires (EditMode precedent). */

type JobPhase = 'setup' | 'printing' | 'done'
type Quality = 'draft' | 'nlq'

const STATUS_ID = 'cv-print-status'

/* Draft: 10 ticks ≈ 1.6s. NLQ: 20 ticks ≈ 3.4s, chatter twice per tick. */
const JOB = {
  draft: { ticks: 10, ms: 160 },
  nlq: { ticks: 20, ms: 170 },
} as const

export function PrintDialog({
  open,
  onClose,
  onDeliver,
}: {
  open: boolean
  onClose: () => void
  /** fire the real download (the hidden anchor lives with the document) */
  onDeliver: () => void
}) {
  const skin = useSettings((s) => s.skin)
  const reduced = useReducedMotion()

  const [phase, setPhase] = useState<JobPhase>('setup')
  const [quality, setQuality] = useState<Quality>('nlq')
  const [tick, setTick] = useState(0)
  const delivered = useRef(false)

  // fresh job every time the dialog opens
  useEffect(() => {
    if (open) {
      setPhase('setup')
      setTick(0)
      delivered.current = false
    }
  }, [open])

  const close = useCallback(() => {
    sfx.close()
    onClose()
  }, [onClose])

  /* Escape closes the dialog, never the window. Capture phase so it wins
     the race against Window.tsx's own keydown handler; a job in flight is
     cancelled the way a real spooler cancels: immediately, no ceremony. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      if (phase !== 'done') close()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, phase, close])

  // the job: one timeout per tick, chatter per head pass
  useEffect(() => {
    if (!open || phase !== 'printing') return
    const { ticks, ms } = JOB[quality]
    if (tick >= ticks) {
      setPhase('done')
      return
    }
    const id = setTimeout(() => {
      setTick((n) => n + 1)
      cvSfx.chatter()
      if (quality === 'nlq') setTimeout(() => cvSfx.chatter(), 55)
    }, ms)
    return () => clearTimeout(id)
  }, [open, phase, tick, quality])

  // done: hand over the artifact once, then put the dialog away
  useEffect(() => {
    if (!open || phase !== 'done') return
    if (!delivered.current) {
      delivered.current = true
      onDeliver()
    }
    const id = setTimeout(onClose, 700)
    return () => clearTimeout(id)
  }, [open, phase, onDeliver, onClose])

  const onPrint = useCallback(() => {
    sfx.tap()
    if (reduced) {
      // no theater: the document just arrives
      setPhase('done')
      return
    }
    setTick(0)
    setPhase('printing')
  }, [reduced])

  const { ticks } = JOB[quality]
  const progress = phase === 'done' ? 1 : tick / ticks

  const status =
    phase === 'printing'
      ? t('cv.dialogPrinting', skin)
      : phase === 'done'
        ? reduced
          ? t('cv.dialogSent', skin)
          : t('cv.dialogDone', skin)
        : ''

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.dialogWrap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          onPointerDown={(e) => {
            // click the dim, dismiss the dialog (setup only — a running job
            // is cancelled deliberately, via Cancel or Escape)
            if (e.target === e.currentTarget && phase === 'setup') close()
          }}
        >
          <motion.div
            role="dialog"
            aria-label={t('cv.dialogTitle', skin)}
            className={styles.dialog}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            transition={SPRINGS.deck}
          >
            <div className={styles.dialogBar}>
              <span className={styles.dialogStripes} aria-hidden="true" />
              <span className={styles.dialogTitle}>{t('cv.dialogTitle', skin)}</span>
              <span className={styles.dialogStripes} aria-hidden="true" />
            </div>

            {phase === 'setup' ? (
              <div className={styles.dialogBody}>
                <div className={styles.dRow}>
                  <span className={styles.dLabel}>{t('cv.dialogPrinter', skin)}</span>
                  <span className={styles.dValue}>LUNDE 1200·D</span>
                </div>
                <div className={styles.dRow}>
                  <span className={styles.dLabel}>{t('cv.dialogQuality', skin)}</span>
                  <span className={styles.dSegmented} role="group" aria-label={t('cv.dialogQuality', skin)}>
                    <button
                      type="button"
                      className={styles.dSegBtn}
                      aria-pressed={quality === 'draft'}
                      onClick={() => {
                        sfx.tap()
                        setQuality('draft')
                      }}
                    >
                      {t('cv.dialogDraft', skin)}
                    </button>
                    <button
                      type="button"
                      className={styles.dSegBtn}
                      aria-pressed={quality === 'nlq'}
                      onClick={() => {
                        sfx.tap()
                        setQuality('nlq')
                      }}
                    >
                      {t('cv.dialogNlq', skin)}
                    </button>
                  </span>
                </div>
                <div className={styles.dRow}>
                  <span className={styles.dLabel}>{t('cv.dialogPages', skin)}</span>
                  <span className={styles.dValue}>1 of 1</span>
                </div>
                <div className={styles.dialogBtns}>
                  <Button size="md" tone="system" onClick={close}>
                    {t('cv.dialogCancel', skin)}
                  </Button>
                  <Button size="md" tone="expressive" onClick={onPrint} autoFocus>
                    {t('cv.dialogGo', skin)}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.dialogBody}>
                <div className={styles.dProgressTrack} aria-hidden="true">
                  <span
                    className={styles.dProgressFill}
                    style={{ transform: `scaleX(${progress})` }}
                  />
                </div>
                <p className={styles.dStatus} id={STATUS_ID} aria-live="polite">
                  {status}
                </p>
                {phase === 'printing' ? (
                  <div className={styles.dialogBtns}>
                    <Button size="md" tone="system" onClick={close}>
                      {t('cv.dialogCancel', skin)}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
