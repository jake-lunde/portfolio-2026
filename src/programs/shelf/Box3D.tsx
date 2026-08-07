'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import styles from './shelf.module.css'

/* A cuboid, built by hand. No library: six absolutely-positioned faces
   sharing ONE 3D context (`transform-style: preserve-3d`), so the flip is a
   single rotateY on the box rather than two faces each faking their own
   perspective (pass 1's compromise).

   Geometry — all of it derives from two CSS custom properties declared on
   `.stage` (--box-w / --box-d) so the maths stays in one place:

     front    translateZ(+d/2)
     back     rotateY(180deg) translateZ(+d/2)      → lands at -d/2, facing away
     spine    translateZ(-d/2) rotateY(-90deg)      origin: left center
     edge     translateZ(-d/2) rotateY( 90deg)      origin: right center
     top      translateZ(-d/2) rotateX( 90deg)      origin: center top
     bottom   translateZ(-d/2) rotateX(-90deg)      origin: center bottom

   Each side strip is `d` thick and pinned to its own edge; rotating about
   that edge swings it to span z 0→+d, and the leading translateZ (applied
   in PARENT space, after the rotation) re-centres it on -d/2→+d/2.

   PERSPECTIVE IS NOT HERE. It belongs on the carousel (`.row`), so every
   box on the shelf shares one vanishing point — per-box perspective gives
   each box its own camera, which is what makes CSS 3D look like stickers.

   THREE nested transforms, deliberately never merged — one element cannot
   own two of these without them fighting over `transform`:

     .stage    PARALLAX rotateY, written by the carousel's scroll loop
     .tilt     CURSOR PRESSURE rotateX/rotateY + the hover lift (springs)
     .cuboid   the FLIP rotateY (Motion)

   Reduced motion collapses the whole thing (`.flat`): the sides disappear,
   the cuboid stops rotating, the tilt layer is never a motion node at all,
   and the two faces crossfade — pass 1's behaviour, preserved as the
   fallback.

   THE SHADOW IS NOT IN THE BOX. It lives on `.plinth`, a flat wrapper
   OUTSIDE the 3D context, because it is drawn with `filter: blur()` and
   filter is a grouping property — inside the cuboid it would flatten every
   face beneath it. Grounding is what sells a solid: a box that turns but
   floats still reads as a card. It is two nested nodes for the same reason
   the box is: the scroll loop owns the inner one's footprint transform, the
   hover spring owns the outer one's swell. */

/* Cursor pressure, Apple-TV style. The corner UNDER the cursor presses
   BACK — the tile pushes away from the finger, it does not lean into it —
   which fixes both signs against CSS's rotation matrices:

     rotateY(+θ): a point at +x maps to −z  → cursor RIGHT ⇒ rotateY POSITIVE
     rotateX(+θ): a point at +y maps to +z, and CSS +y is DOWN,
                  so the TOP recedes         → cursor TOP   ⇒ rotateX POSITIVE

   7deg is the ceiling. The row already turns each box 8–36deg of parallax
   and the tilt composes on top of that; past ~7 the pressure stops reading
   as a nudge and starts fighting the shelf's own perspective.

   The spring is `window`, not `deck`: at stiffness 480 / damping 34 / mass
   0.7 its damping ratio is 34 / (2·√(480·0.7)) ≈ 0.93 — near-critical, so
   the box tracks the cursor without wobbling behind it on every micro-move.
   `deck` (0.76) overshoots, which is right for a flip that lands and wrong
   for a surface that is meant to feel like it is under your finger. */
const TILT_CAP = 7
const LIFT = 6
/* the shadow answers the lift, derived rather than dialled: a box 6px off a
   shelf throws a footprint a shade wider and a shade weaker. */
const SHADOW_SWELL = 1.08
const SHADOW_FADE = 0.74

/** fine pointer only — a tilt that tracks a finger is a tilt that fights it */
function useFinePointer() {
  const [fine, setFine] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const read = () => setFine(mq.matches)
    read()
    mq.addEventListener('change', read)
    return () => mq.removeEventListener('change', read)
  }, [])
  return fine
}

export function Box3D({
  front,
  back,
  flipped,
  className,
}: {
  /** the front-face element — must carry `.face` styling itself */
  front: ReactNode
  back: ReactNode
  flipped: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const tiltOn = !reduced && fine

  /* MotionValues, not state: pointermove sets a target and the spring loop
     chases it, so a pointer moving across a box writes no React renders and
     no per-move style of our own. */
  const rx = useSpring(0, SPRINGS.window)
  const ry = useSpring(0, SPRINGS.window)
  const lift = useSpring(0, SPRINGS.window)
  const shadowScale = useTransform(lift, [0, -LIFT], [1, SHADOW_SWELL])
  const shadowFade = useTransform(lift, [0, -LIFT], [1, SHADOW_FADE])

  /* the box's own rect, read ONCE on enter. Reading it per pointermove is a
     forced layout on every mouse sample, which is exactly the cost this
     effect cannot afford. */
  const rect = useRef<DOMRect | null>(null)

  const enter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tiltOn || e.pointerType !== 'mouse') return
    rect.current = e.currentTarget.getBoundingClientRect()
    lift.set(-LIFT)
  }

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tiltOn || e.pointerType !== 'mouse') return
    const r = rect.current
    if (!r || !r.width || !r.height) return
    // −1 … +1 across the face, clamped for the pointer-capture edges
    const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2))
    const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2))
    ry.set(nx * TILT_CAP)
    rx.set(-ny * TILT_CAP)
  }

  const leave = () => {
    rect.current = null
    rx.set(0)
    ry.set(0)
    lift.set(0)
  }

  return (
    <div
      className={`${styles.plinth} ${reduced ? styles.flat : ''} ${className ?? ''}`}
      onPointerEnter={enter}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {/* the box's contact with the shelf. The inner span is written by the
          same scroll loop that turns the box: as the face swings away its
          footprint narrows and slides, and the shadow goes with it. The
          wrapper carries the hover swell. Transform and opacity only. */}
      <motion.span
        className={styles.shadowWrap}
        aria-hidden="true"
        style={tiltOn ? { scale: shadowScale, opacity: shadowFade } : undefined}
      >
        <span className={styles.shadow} data-shadow="" />
      </motion.span>
      <div
        // data-stage: the carousel's scroll loop finds its boxes by this and
        // writes the parallax rotateY here. Nothing else may set transform.
        data-stage=""
        className={styles.stage}
      >
        {tiltOn ? (
          <motion.div className={styles.tilt} style={{ rotateX: rx, rotateY: ry, y: lift }}>
            <Cuboid flipped={flipped} reduced={reduced}>
              {front}
              {back}
            </Cuboid>
          </motion.div>
        ) : (
          <div className={styles.tilt}>
            <Cuboid flipped={flipped} reduced={reduced}>
              {front}
              {back}
            </Cuboid>
          </div>
        )}
      </div>
    </div>
  )
}

function Cuboid({
  flipped,
  reduced,
  children,
}: {
  flipped: boolean
  reduced: boolean | null
  children: ReactNode
}) {
  return (
    <motion.div
      className={styles.cuboid}
      // `initial` as well as `animate` so Motion writes the resting
      // transform into the SSR markup — without it the first paint is an
      // untransformed stack and the back shows through until hydration.
      initial={reduced ? undefined : { rotateY: 0 }}
      animate={reduced ? undefined : { rotateY: flipped ? 180 : 0 }}
      transition={reduced ? { duration: 0 } : SPRINGS.deck}
    >
      {children}
      {/* cardboard thickness. Token-only: the face ground darkened by a
          fixed mix, so every skin gets its own shade of board for free. */}
      <span className={`${styles.side} ${styles.spine}`} aria-hidden="true" />
      <span className={`${styles.side} ${styles.edge}`} aria-hidden="true" />
      <span className={`${styles.side} ${styles.top}`} aria-hidden="true" />
      <span className={`${styles.side} ${styles.bottom}`} aria-hidden="true" />
    </motion.div>
  )
}
