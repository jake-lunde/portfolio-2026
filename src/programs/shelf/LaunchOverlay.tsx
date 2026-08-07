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

/* PLAY — the beat between pressing the button and the case arriving.

   Not an install: nobody installs a case study, they play it. What a 1992
   machine did in that gap was print status lines and creep a bar, and that
   is exactly the theatre kept here — the bar mechanics are unchanged
   (steps to 90, stall for the licence, 100 on clearance), only the framing
   moved from "installing software" to "loading a program".

   The clearance gate is ABSORBED here rather than met at the case window.
   `useGate` unlocks globally per session, so a licence check inside the
   load satisfies the case window's own `gated` flag on arrival — the
   sphere is unchanged, only the framing around it is new. Deep links
   (/projects/<slug>) still meet the sphere in the case window itself.

   The licence phase takes the WHOLE frame dark (`.overlayDark`, the same
   inverse-ground idiom as `.windowBody.crt`). The sphere's own panel is
   dark; on a light overlay it read as a hole punched in the window, so the
   window goes with it. */

const STEPS = ['shelf.load.step1', 'shelf.load.step2', 'shelf.load.step3']
const STEP_MS = 460
/* the beat between "ready" and the window arriving — long enough to read
   the line, short enough that nobody waits on a machine */
const DONE_MS = 620

type Phase = 'loading' | 'license' | 'done'

export function LaunchOverlay({
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
  const [phase, setPhase] = useState<Phase>('loading')
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    hydrate()
    metric('case_play', { slug })
    panel.current?.focus()
  }, [hydrate, slug])

  // the stepped write. Each tick prints one status line; the bar stalls at
  // 90% like every loader ever shipped, waiting on the licence.
  useEffect(() => {
    if (phase !== 'loading') return
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
    const id = setTimeout(
      () => {
        sfx.open()
        open(`case:${slug}`)
        onDone()
      },
      reduced ? 0 : DONE_MS,
    )
    return () => clearTimeout(id)
  }, [phase, reduced, open, slug, onDone])

  const dark = phase === 'license'
  const pct = phase === 'done' ? 100 : Math.round((Math.min(step, STEPS.length) / STEPS.length) * 90)
  const statusKey =
    phase === 'done'
      ? 'shelf.play.done'
      : phase === 'license'
        ? 'shelf.play.license'
        : STEPS[Math.min(step, STEPS.length - 1)]

  return (
    <motion.div
      ref={panel}
      className={`${styles.overlay} ${dark ? styles.overlayDark : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${t('shelf.loading', skin)} ${name}`}
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
      <div className={styles.loadPanel}>
        <p className={styles.loadName}>{name}</p>
        {/* the bar yields its rows to the sphere during the licence check —
            a 600px window fits one or the other, not both */}
        {!dark && (
          <InstallBar
            pct={pct}
            striped
            role="progressbar"
            label={`${t('shelf.loading', skin)} ${name}`}
            seconds={0.42}
          />
        )}
        <p className={styles.loadStep} aria-live="polite">
          <Copy k={statusKey} as="span" />
        </p>

        {dark && (
          <div className={styles.sphereWrap}>
            <GateSphere />
          </div>
        )}

        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          <Copy k="shelf.play.cancel" as="span" />
        </button>
      </div>
    </motion.div>
  )
}
