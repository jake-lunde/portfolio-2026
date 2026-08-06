'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { GateSphere } from '@/components/gate/GateSphere'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'
import { useGate } from '@/store/gate'
import { useSettings } from '@/store/settings'
import { useWindows } from '@/store/windows'
import { InstallBar } from './InstallBar'
import styles from './shelf.module.css'

/* INSTALL — the old joke inverted. The installer that never finished now
   finishes, because the work shipped. It is a layer inside the shelf, not
   a window: an install belongs to the thing being installed.

   The clearance gate is ABSORBED here rather than met at the case window.
   `useGate` unlocks globally per session, so a license check inside the
   install satisfies the case window's own `gated` flag on arrival — the
   sphere is unchanged, only the framing around it is new. Deep links
   (/projects/<slug>) still meet the sphere in the case window itself. */

const STEPS = ['shelf.install.step1', 'shelf.install.step2', 'shelf.install.step3']
const STEP_MS = 460
/* the beat between "complete" and the window arriving — long enough to
   read the line, short enough that nobody waits on a machine */
const DONE_MS = 620

type Phase = 'installing' | 'license' | 'done'

export function InstallOverlay({
  slug,
  name,
  onCancel,
  onDone,
}: {
  slug: string
  name: string
  /** dismissed before the case opened — focus goes back to the box */
  onCancel: () => void
  /** the case window has it now — do NOT pull focus back to the shelf */
  onDone: () => void
}) {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const unlocked = useGate((s) => s.unlocked)
  const hydrate = useGate((s) => s.hydrate)
  const open = useWindows((s) => s.open)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('installing')
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    hydrate()
    metric('case_install', { slug })
    panel.current?.focus()
  }, [hydrate, slug])

  // the stepped write. Each tick prints one status line; the bar stalls at
  // 90% like every installer ever shipped, waiting on the license.
  useEffect(() => {
    if (phase !== 'installing') return
    if (step >= STEPS.length) {
      setPhase(unlocked ? 'done' : 'license')
      return
    }
    const id = setTimeout(() => setStep((s) => s + 1), reduced ? 0 : STEP_MS)
    return () => clearTimeout(id)
  }, [phase, step, unlocked, reduced])

  // the sphere unlocks itself; we only watch for clearance to land
  useEffect(() => {
    if (phase === 'license' && unlocked) setPhase('done')
  }, [phase, unlocked])

  useEffect(() => {
    if (phase !== 'done') return
    const id = setTimeout(() => {
      sfx.open()
      open(`case:${slug}`)
      onDone()
    }, reduced ? 0 : DONE_MS)
    return () => clearTimeout(id)
  }, [phase, reduced, open, slug, onDone])

  const pct = phase === 'done' ? 100 : Math.round((Math.min(step, STEPS.length) / STEPS.length) * 90)
  const statusKey =
    phase === 'done'
      ? 'shelf.install.done'
      : phase === 'license'
        ? 'shelf.install.license'
        : STEPS[Math.min(step, STEPS.length - 1)]

  return (
    <motion.div
      ref={panel}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${t('shelf.installing', skin)} ${name}`}
      tabIndex={-1}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.14 }}
      // Window.tsx closes the window on Escape — the overlay eats the
      // first one so the ladder reads overlay → box → window
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        e.stopPropagation()
        onCancel()
      }}
    >
      <div className={styles.installPanel}>
        <p className={styles.installName}>{name}</p>
        {/* the bar yields its rows to the sphere during the license check —
            a 600px window fits one or the other, not both */}
        {phase !== 'license' && (
          <InstallBar
            pct={pct}
            striped
            role="progressbar"
            label={`${t('shelf.installing', skin)} ${name}`}
            seconds={0.42}
          />
        )}
        <p className={styles.installStep} aria-live="polite">
          <Copy k={statusKey} as="span" />
        </p>

        {phase === 'license' && (
          <div className={styles.sphereWrap}>
            <GateSphere />
          </div>
        )}

        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          <Copy k="shelf.install.cancel" as="span" />
        </button>
      </div>
    </motion.div>
  )
}
