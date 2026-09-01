'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { GateSphere } from '@/components/gate/GateSphere'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import { metric } from '@/lib/metrics'
import { getCase } from '@/programs/projects/cases'
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
   window goes with it.

   AND THE WINDOW GROWS TO FIT IT (pass 11). Jake: "resize the gate window
   to fit when they get there." The shelf window is measured for one row of
   boxes — 760×459, of which the licence phase gets 426 of body — and the
   sphere stack wants a great deal more than that: `.gate` is 18/20 of
   padding around a header, a row of 42px slots, a sphere with a 300px
   FLOOR, a hint line and the type-it-instead row. It has `overflow: hidden`,
   so what it did with the shortfall was cut the letters off. A dialog that
   cannot fit its own contents is a bug in the dialog, not in the reader.

   THE SIZE IS MEASURED, NOT DECLARED. `fitToGate` reads the real stack —
   the bottom of the gate's lowest child against its own padding box — and
   asks the window store for exactly that much more. Written as a constant
   it would be a number that goes stale the first time the sphere's floor,
   the hint or the fallback row changes; measured, it is right by
   construction and right at the narrow breakpoint for free.

   IT GROWS DOWN AND RIGHT, TITLEBAR ANCHORED. That is what a 1992 dialog
   does: the frame you grabbed stays where you put it and the box gets
   bigger beneath it. Growing about the centre would slide the titlebar out
   from under the pointer for no reason.

   ⚠️ CLAMPED TO THE GLASS, the same duty `Window.tsx` discharges for `left`.
   The window opens at y=48 and can be dragged anywhere; unclamped, a 640px
   dialog on a 700px desktop would push the cancel button off the bottom of
   the screen, which is strictly worse than the clipping this fixes. So the
   grow stops at the viewport (less a 12px margin) and the overflow lands on
   the SPHERE — the one thing in the panel that is allowed to be cramped,
   because `.loadPanel` keeps the name, the status line and cancel outside
   the flexing row. Cancel is reachable at every size.

   IT IS INSTANT, and that is a ruling rather than an omission. Width and
   height are layout, not transform or opacity; a spring on them would
   reflow the sphere every frame and break the 60fps law this file works
   under. A machine that resizes a dialog the moment it needs the room is
   also simply more honest than one that eases into it.

   The restore is the store's job (`releaseSize`) and it restores the size
   the window ACTUALLY had — including a size the reader dragged the grip
   to — never the registry default. */

const STEPS = ['shelf.load.step1', 'shelf.load.step2', 'shelf.load.step3']
const STEP_MS = 460
/* the beat between "ready" and the window arriving — long enough to read
   the line, short enough that nobody waits on a machine */
const DONE_MS = 620

type Phase = 'loading' | 'license' | 'done'

/** breathing room between the grown window and the edge of the glass —
    the same 12 `Window.tsx` leaves on the right when it clamps `left` */
const GLASS_MARGIN = 12
/** below this the shell stacks windows full-bleed (`shell.module.css`,
    `max-width: 720px`, with `!important` on every box metric) — there is no
    size to borrow and nothing to give back */
const FULL_BLEED_MAX = 720

/* WHAT THE SPHERE STACK ACTUALLY NEEDS, measured off the live gate.

   `el` is `.gate` — a flex column with `overflow: hidden`, which is the
   reason this cannot simply read `scrollHeight` off the overlay: the gate
   clips its own overflow before any scroll container ever sees it. So the
   shortfall is taken from the children themselves — the furthest bottom and
   the furthest right of anything inside — plus the gate's own end padding,
   which no browser's scrollable-overflow rectangle can be relied on to
   include the same way twice.

   Returns the DEFICIT, never a target: the window is grown by what is
   missing, so a reader who has already dragged the frame bigger than the
   sphere needs is left alone. */
function deficit(el: HTMLElement) {
  const box = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  const padB = parseFloat(cs.paddingBottom) || 0
  const padR = parseFloat(cs.paddingRight) || 0
  let bottom = 0
  let right = 0
  for (const kid of Array.from(el.children)) {
    const r = kid.getBoundingClientRect()
    bottom = Math.max(bottom, r.bottom - box.top)
    right = Math.max(right, r.right - box.left)
  }
  return {
    h: Math.max(0, Math.ceil(bottom + padB - el.clientHeight)),
    w: Math.max(0, Math.ceil(right + padR - el.clientWidth)),
  }
}

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
  const requestSize = useWindows((s) => s.requestSize)
  const releaseSize = useWindows((s) => s.releaseSize)
  const setZoomed = useWindows((s) => s.setZoomed)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const panel = useRef<HTMLDivElement>(null)
  /** the licence phase's flex row — its one child is the gate */
  const sphereWrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    hydrate()
    metric('case_play', { slug })
    panel.current?.focus()
  }, [hydrate, slug])

  // the stepped write. Each tick prints one status line; the bar stalls at
  // 90% like every loader ever shipped, waiting on the licence. A case
  // that isn't gated (cases.ts `gated: false`) never stalls — the bar
  // runs straight through to done.
  useEffect(() => {
    if (phase !== 'loading') return
    if (step >= STEPS.length) {
      const gated = getCase(slug)?.gated ?? true
      setPhase(unlocked || !gated ? 'done' : 'license')
      return
    }
    const id = setTimeout(() => setStep((s) => s + 1), reduced ? 0 : STEP_MS)
    return () => clearTimeout(id)
  }, [phase, step, unlocked, reduced, slug])

  // the sphere unlocks itself; we only watch for clearance to land
  useEffect(() => {
    if (phase === 'license' && unlocked) setPhase('done')
  }, [phase, unlocked])

  /* THE WINDOW GROWS FOR THE LICENCE CHECK — see the ruling at the top.
     The cleanup is the whole restore path and it covers every way out of
     this phase, which is why there is no second effect for any of them:
     clearance granted (phase → done), cancel, Escape, the window closing
     under us. All four unmount this component or leave the phase, and both
     run the cleanup. */
  useEffect(() => {
    if (phase !== 'license') return
    if (window.innerWidth <= FULL_BLEED_MAX) return
    const gate = sphereWrap.current?.firstElementChild
    const frame = panel.current?.closest<HTMLElement>('[data-window-id]')
    if (!(gate instanceof HTMLElement) || !frame) return
    const id = frame.dataset.windowId
    if (!id) return

    const need = deficit(gate)
    if (!need.h && !need.w) return
    // offsetWidth/Height, not the bounding rect: the window is a motion
    // element and its open spring writes a scale — the rect would report
    // the animated size and we would restore the wrong one. Layout metrics
    // ignore transforms.
    const from = { w: frame.offsetWidth, h: frame.offsetHeight }
    const box = frame.getBoundingClientRect()
    requestSize(id, {
      w: Math.min(from.w + need.w, Math.max(from.w, window.innerWidth - box.left - GLASS_MARGIN)),
      h: Math.min(from.h + need.h, Math.max(from.h, window.innerHeight - box.top - GLASS_MARGIN)),
    })
    return () => releaseSize(id)
  }, [phase, requestSize, releaseSize])

  /* THE CASE ARRIVES FULL SCREEN (Jake). A case study is 1280×720 of
     window on a desk that may be 1280 wide, and the reader has just spent
     a loading bar and a licence check asking for it — so it opens
     maximised rather than opening at its registry size for them to zoom.
     `setZoomed` before `open` on purpose: the window mounts already
     maximised and there is no frame where it paints at its own size and
     snaps. The store forgets the flag when the window closes, so a case
     reopened from a deep link still arrives as itself. */
  useEffect(() => {
    if (phase !== 'done') return
    const id = setTimeout(
      () => {
        sfx.open()
        setZoomed(`case:${slug}`, true)
        open(`case:${slug}`)
        onDone()
      },
      reduced ? 0 : DONE_MS,
    )
    return () => clearTimeout(id)
  }, [phase, reduced, open, setZoomed, slug, onDone])

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
          <div className={styles.sphereWrap} ref={sphereWrap}>
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
