'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { useFidelity } from './fidelity'
import styles from './case.module.css'

/* THE LIVING SKETCH — Jake's concept collage, riding the case header
   where PROGRESS.VWR used to greet you (s94b: the rail retired; the
   page carries all the imagery now, and the sketch is the one piece
   that was always the rail's own). Cutouts on a virtual 1089×490
   canvas (coords straight from the Figma group), each adrift on its
   own slow loop, shying away from the cursor. Deltas are screen-px and
   small on purpose: ambient, not a parlor trick. Art exports from
   Figma "scroller viz" (201161-12); swappable like every image (§2).

   The sketch is the DRAFT face of this slot. The case-wide fidelity
   switch flips it to the shipped device (HubFinal below) — concept
   collage on one side, the machine that came out of it on the other.
   Instant swap, FidelityFrame's own law. */

const DIR = '/case/family-hub/evo'

const SK = { w: 1089, h: 490 }

type Bit = {
  f: string
  x: number
  y: number
  w: number
  /** natural export height — for the repel math's center points */
  h: number
  dx: number
  dy: number
  dr: number
  dur: number
  delay: number
}

const BITS: Bit[] = [
  { f: 'head', x: 0, y: 21, w: 351, h: 72, dx: 1, dy: 3, dr: 0, dur: 11, delay: -4 },
  { f: 'week', x: 182, y: 178, w: 105, h: 45, dx: -3, dy: 2, dr: -1, dur: 9, delay: -2 },
  { f: 'cal', x: 516, y: 92, w: 86, h: 87, dx: 2, dy: -4, dr: 1.5, dur: 8, delay: -6 },
  { f: 'house', x: 361, y: 153, w: 64, h: 64, dx: -2, dy: -3, dr: -1.5, dur: 10, delay: -1 },
  { f: 'bell', x: 709, y: 223, w: 37, h: 37, dx: 3, dy: -2, dr: 2, dur: 7, delay: -3 },
  { f: 'mom', x: 273, y: 255, w: 162, h: 163, dx: 3, dy: 4, dr: 0.8, dur: 12, delay: -7 },
  { f: 'dad', x: 456, y: 214, w: 92, h: 92, dx: -3, dy: 3, dr: -1, dur: 9.5, delay: -5 },
  { f: 'girl', x: 456, y: 336, w: 125, h: 125, dx: 2, dy: -3, dr: 1, dur: 11.5, delay: -9 },
  { f: 'boy', x: 587, y: 255, w: 100, h: 100, dx: -2, dy: -4, dr: -0.8, dur: 10.5, delay: -2 },
  { f: 'temp', x: 100, y: 316, w: 135, h: 44, dx: 3, dy: -2, dr: 1, dur: 9, delay: -8 },
  { f: 'checklist', x: 386, y: 432, w: 58, h: 58, dx: -3, dy: 2, dr: -2, dur: 8.5, delay: -4 },
  { f: 'pin', x: 602, y: 389, w: 49, h: 50, dx: 2, dy: 3, dr: 2, dur: 7.5, delay: -6 },
  { f: 'check', x: 726, y: 343, w: 70, h: 70, dx: -2, dy: -2, dr: -1.5, dur: 8, delay: -1 },
  { f: 'task', x: 826, y: 364, w: 263, h: 26, dx: 3, dy: 2, dr: 0.5, dur: 10, delay: -5 },
]

const NO_PUSH = BITS.map(() => ({ x: 0, y: 0 }))

/* the launch screens riding the shipped bezel, in section order
   (Figma 201592-38873). Order is the loop; the count is baked into
   .hubScreen's timing — see case.module.css before adding one. */
const SCREENS = [
  'calendar',
  'chores',
  'settings',
  'assistant',
  'calendar-alt',
  'safety',
  'home',
  'photos',
  'lists',
]

/* the shipped device — CSS bezel (case.module.css .hubDevice), the
   screen cycling the launch states on a slow crossfade loop. The whole
   device shies from the cursor the way the sketch's cutouts do (Jake,
   s131) — same radial-shove math, one object instead of fourteen, and
   fainter: hardware is heavier than paper. */
function HubFinal() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [shove, setShove] = useState({ x: 0, y: 0 })

  const onMove = (e: React.PointerEvent) => {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = r.left + r.width / 2 - e.clientX
    const dy = r.top + r.height / 2 - e.clientY
    const d = Math.hypot(dx, dy)
    const radius = r.width * 0.6
    const max = r.width * 0.015
    if (d >= radius || d === 0) return setShove({ x: 0, y: 0 })
    const f = ((radius - d) / radius) * max
    setShove({ x: (dx / d) * f, y: (dy / d) * f })
  }

  return (
    <div
      className={styles.heroArt}
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setShove({ x: 0, y: 0 })}
    >
      <motion.div
        className={styles.hubDevice}
        animate={{ x: shove.x, y: shove.y }}
        transition={SPRINGS.widget}
        data-spring="widget"
        role="img"
        aria-label="The shipped Family Hub device: its 15.6-inch screen cycling through the launch apps — calendar, chores, settings, assistant, safety, home, photos, lists."
      >
        <div className={styles.hubGap}>
          <div className={styles.hubGlass}>
            <div className={styles.hubScreen}>
              {SCREENS.map((f, i) => (
                <img
                  key={f}
                  src={`${DIR}/screens/${f}.webp`}
                  alt=""
                  decoding="async"
                  draggable={false}
                  style={{ ['--i' as string]: i }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function HeroSketch() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const mode = useFidelity((s) => s.mode)
  const [push, setPush] = useState(NO_PUSH)

  // cutouts shy away from the pointer: a gentle radial shove, spring-
  // settled, on top of (not instead of) their idle drift
  const onMove = (e: React.PointerEvent) => {
    if (reduced || !sceneRef.current) return
    const r = sceneRef.current.getBoundingClientRect()
    const cx = e.clientX - r.left
    const cy = e.clientY - r.top
    const radius = r.width * 0.2
    const shove = r.width * 0.045
    setPush(
      BITS.map((b) => {
        const bx = ((b.x + b.w / 2) / SK.w) * r.width
        const by = ((b.y + b.h / 2) / SK.h) * r.height
        const dx = bx - cx
        const dy = by - cy
        const d = Math.hypot(dx, dy)
        if (d >= radius || d === 0) return { x: 0, y: 0 }
        const f = ((radius - d) / radius) * shove
        return { x: (dx / d) * f, y: (dy / d) * f }
      }),
    )
  }

  if (mode === 'shipped') return <HubFinal />

  return (
    <div
      className={styles.heroArt}
      role="img"
      aria-label="Concept collage: a big pink clock, weather, calendar and home glyphs, family portrait avatars, one checked-off chore — all gently afloat."
    >
      <div
        className={styles.sketchScene}
        ref={sceneRef}
        onPointerMove={onMove}
        onPointerLeave={() => setPush(NO_PUSH)}
      >
        {BITS.map((b, i) => (
          <motion.div
            key={b.f}
            className={styles.sketchBitWrap}
            style={{
              left: `${(b.x / SK.w) * 100}%`,
              top: `${(b.y / SK.h) * 100}%`,
              width: `${(b.w / SK.w) * 100}%`,
            }}
            animate={{ x: push[i].x, y: push[i].y }}
            transition={SPRINGS.widget}
            data-spring="widget"
          >
            <img
              src={`${DIR}/sketch/${b.f}.webp`}
              alt=""
              draggable={false}
              className={styles.sketchBit}
              style={{
                ['--dx' as string]: `${b.dx}px`,
                ['--dy' as string]: `${b.dy}px`,
                ['--dr' as string]: `${b.dr}deg`,
                ['--dur' as string]: `${b.dur}s`,
                ['--delay' as string]: `${b.delay}s`,
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
