'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import { HUB_MODE_LABELS, HUB_SCREENS, HUB_SCREEN_DIR, HUB_SCREEN_MS, type HubMode } from './hubShipped'
import { useFidelity } from './fidelity'
import styles from './case.module.css'

/* The shipped interaction model: Ambient (the heads-up screensaver) →
   Active (walk up, full dashboard, filter per member) → Authenticated
   (PIN gate before anything consequential). Two modes plus the auth
   layer — per Jake's s35 correction; no "focused" tier.

   s132 retired the lo-fi SVG diagram: both faces of the fidelity
   switch are real screens now (the first hi-fi pass vs. launch), and
   they ride inside the hero's CSS device bezel so the hub reads as
   hardware on a wall, not a screenshot in a box. Each mode's set
   crossfades on a slow loop the way the hero's screen does; hover or
   focus holds the frame, a click steps it. The pair's chip restates
   the case's one fidelity switch in this pair's rungs and flips it
   globally, like every FidelityFrame chip. */

const MODES: Array<{ id: HubMode; label: string; blurb: string }> = [
  { id: 'ambient', label: HUB_MODE_LABELS.ambient, blurb: 'The screensaver with a job. From across the room you get the time, what’s next, who’s where, the photo stream. It asks nothing of you.' },
  { id: 'active', label: HUB_MODE_LABELS.active, blurb: 'Walk up and it’s a full dashboard. Drill into any feature, open modal views, filter the whole surface down to one family member.' },
  { id: 'auth', label: HUB_MODE_LABELS.auth, blurb: 'The gate. Adults manage, kids view. A PIN sits between glancing and doing: approvals, money, calendar edits.' },
]

export function HubModes() {
  const [mode, setMode] = useState<HubMode>('ambient')
  const fidelity = useFidelity((s) => s.mode)
  const setFidelity = useFidelity((s) => s.set)
  const face = fidelity === 'shipped' ? 'shipped' : 'draft'
  const [shot, setShot] = useState(0)
  const [held, setHeld] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.35 })
  const reduced = useReducedMotion()
  const current = MODES.find((m) => m.id === mode)!
  const shots = HUB_SCREENS[face][mode]

  /* the fidelity switch is global — any chip on the page can flip it,
     so the reset rides the face, not this plate's own click handler */
  useEffect(() => setShot(0), [face])

  /* the cycle — runs while the plate is on screen and nobody's
     pointing at it */
  useEffect(() => {
    if (reduced || held || !inView || shots.length < 2) return
    const t = setInterval(() => setShot((i) => (i + 1) % shots.length), HUB_SCREEN_MS)
    return () => clearInterval(t)
  }, [reduced, held, inView, shots.length])

  return (
    <div ref={rootRef}>
      <div className={styles.hubHead}>
        {/* the pair's chip: restates the case's one fidelity switch in
            this plate's rungs, flips it globally */}
        <div className={styles.hubViews} role="group" aria-label="Fidelity">
          {(
            [
              ['draft', 'v0.4'],
              ['shipped', 'v1.0'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={styles.fidChipSeg}
              aria-pressed={fidelity === id}
              onClick={() => {
                if (fidelity === id) return
                sfx.tap()
                setFidelity(id)
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={styles.hubCount}>
          {String(shot + 1).padStart(2, '0')} / {String(shots.length).padStart(2, '0')}
        </span>
      </div>

      <button
        type="button"
        className={styles.hubShip}
        aria-label={`The hub device showing ${current.label} mode${face === 'draft' ? "'s first pass" : ' as shipped'}, screen ${shot + 1} of ${shots.length}. Next screen.`}
        onClick={() => {
          sfx.tap()
          setShot((i) => (i + 1) % shots.length)
        }}
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
      >
        {/* the hero's bezel (case.module.css .hubDevice), reused whole:
            same hardware, smaller wall */}
        <div className={styles.hubDevice}>
          <div className={styles.hubGap}>
            <div className={styles.hubGlass}>
              <div className={styles.hubPanel}>
                {shots.map((s, i) => (
                  <motion.img
                    key={s.file}
                    src={`${HUB_SCREEN_DIR}/${s.file}.webp`}
                    width={1440}
                    height={810}
                    alt={i === shot ? s.alt : ''}
                    aria-hidden={i === shot ? undefined : true}
                    loading="lazy"
                    draggable={false}
                    initial={false}
                    animate={{ opacity: i === shot ? 1 : 0 }}
                    transition={{ duration: reduced ? 0 : 0.4, ease: 'easeOut' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </button>

      <div className={styles.hubTabs}>
        {MODES.map((m) => {
          const on = m.id === mode
          return (
            <button
              key={m.id}
              className={styles.moatNode}
              aria-pressed={on}
              onClick={() => {
                sfx.tap()
                setMode(m.id)
                setShot(0)
              }}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '8px 12px',
                background: on ? 'var(--accent-expressive)' : 'transparent',
                color: on ? '#131811' : '#E7E1D2',
                border: `1px solid ${on ? 'var(--accent-expressive)' : 'rgba(231,225,210,0.4)'}`,
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      <div className={styles.moatWhy} aria-live="polite">
        {current.blurb}
      </div>
    </div>
  )
}
