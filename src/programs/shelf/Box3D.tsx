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

   AND IT ONLY ARRIVES IF EVERY ELEMENT BETWEEN THE TWO SAYS SO. `perspective`
   applies to an element's children; it reaches a grandchild only through an
   unbroken chain of `transform-style: preserve-3d`. Passes 2–3 set it on
   `.stage`/`.tilt`/`.cuboid` but not on `.slot`/`.boxSlot`/`.plinth`, so the
   chain broke three levels up and the whole shelf rendered ORTHOGRAPHIC:
   rotations sheared, translateZ did literally nothing, and no box ever
   foreshortened. Measured, pass 4: translateZ(200px) moved the face's
   rendered width by 0.00px. That is the bug behind "it still isn't reading
   as 3D" — those passes were turning flat parallelograms. The chain is now
   whole in shelf.module.css; do not break it again.

   With a real camera the resting turn became unnecessary: an off-centre box
   shows its own side face for free (that is what perspective IS), so pass 4
   drops the faked rotation and lets position in the row do the work.

   THREE nested transforms, deliberately never merged — one element cannot
   own two of these without them fighting over `transform`:

     .stage    reserved, static (held pass 2–3's scroll-linked parallax)
     .tilt     CURSOR PRESSURE rotateX/rotateY + the hover POP (springs)
     .cuboid   the FLIP rotateY (Motion)

   Reduced motion collapses the whole thing (`.flat`): the sides disappear,
   the cuboid stops rotating, the tilt layer is never a motion node at all,
   and the two faces crossfade — pass 1's behaviour, preserved as the
   fallback.

   THE SHADOW IS NOT IN THE BOX. It lives on `.plinth`, a flat wrapper
   OUTSIDE the 3D context, because it is drawn with `filter: blur()` and
   filter is a grouping property — inside the cuboid it would flatten every
   face beneath it. Grounding is what sells a solid: a box that turns but
   floats still reads as a card. */

/* Cursor pressure, Apple-TV style. The corner UNDER the cursor presses
   BACK — the tile pushes away from the finger, it does not lean into it —
   which fixes both signs against CSS's rotation matrices:

     rotateY(+θ): a point at +x maps to −z  → cursor RIGHT ⇒ rotateY POSITIVE
     rotateX(+θ): a point at +y maps to +z, and CSS +y is DOWN,
                  so the TOP recedes         → cursor TOP   ⇒ rotateX POSITIVE

   10deg, up from pass 3's 7. That cap was set against a resting turn of
   8–36deg the tilt had to avoid fighting; with the row square-on at rest the
   tilt is now the ONLY rotation on the box, and it has room. It is still
   deliberately small — this is pressure under a finger, not a spin.

   THE POP is what pass 4 added and what actually sells the solid: the box
   translates 38px toward the viewer. Against the row's 980px camera that is
   a scale of 980 / (980 − 38) = 1.040 — the box grows ~10px across as it
   comes off the shelf, and its own sides swing into view. 38 was chosen
   against neighbour clearance, not feel alone: the growth is applied about
   the row's vanishing point, so a box near the edge of the frame moves
   OUTWARD as well as forward, and the slot gap had to widen to 24px to keep
   two boxes from touching at full pop (measured — see shelf.module.css).

   The spring is `window`, not `deck`: at stiffness 480 / damping 34 / mass
   0.7 its damping ratio is 34 / (2·√(480·0.7)) ≈ 0.93 — near-critical, so
   the box tracks the cursor without wobbling behind it on every micro-move.
   `deck` (0.76) overshoots, which is right for a flip that lands and wrong
   for a surface that is meant to feel like it is under your finger. */
const TILT_CAP = 10
const POP = 38
const LIFT = 6

/* The shadow answers the pop, and it answers it by RETREATING.

   Pass 3 swelled it, which is the right physics for a card rising off a
   plane under a light directly above. This is not that: the box is leaving
   the shelf toward the CAMERA, and the ellipse on the shelf is a contact
   patch — the footprint of a board standing on it. Break the contact and
   the patch has nothing left to draw: it narrows toward the base that is no
   longer there, and the occlusion weakens because light now reaches under
   the box. So it shrinks and fades together, which reads as the box coming
   away from its own shadow rather than dragging it along. */
const SHADOW_SHRINK = 0.9
const SHADOW_FADE = 0.6

/** fine pointer only — a tilt that tracks a finger is a tilt that fights it.
    Called ONCE, in Shelf.tsx, and handed down: the answer is a property of
    the machine, not of a box, and one media-query listener per box was a
    debt flagged the moment a fifth case looked likely. */
export function useFinePointer() {
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
  fine,
  className,
}: {
  /** the front-face element — must carry `.face` styling itself */
  front: ReactNode
  back: ReactNode
  flipped: boolean
  /** measured once by the shelf: hover-capable, fine-pointer machine */
  fine: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  const tiltOn = !reduced && fine

  /* MotionValues, not state: pointermove sets a target and the spring loop
     chases it, so a pointer moving across a box writes no React renders and
     no per-move style of our own.

     ONE spring drives the whole hover — pop, lift and both shadow responses
     are transforms of the same 0→1 value, so they can never arrive out of
     step with each other. Only the two rotations are independent, because
     only they track the cursor. */
  const rx = useSpring(0, SPRINGS.window)
  const ry = useSpring(0, SPRINGS.window)
  const pop = useSpring(0, SPRINGS.window)
  const z = useTransform(pop, [0, 1], [0, POP])
  const lift = useTransform(pop, [0, 1], [0, -LIFT])
  const shadowScale = useTransform(pop, [0, 1], [1, SHADOW_SHRINK])
  const shadowFade = useTransform(pop, [0, 1], [1, SHADOW_FADE])

  /* THE MOVING SHEEN rides the same three springs — light and tilt sharing
     one source is what keeps them in step. The hotspot FOLLOWS the cursor
     (the light sits between the reader and the board, so the bright spot is
     under the finger pressing it), and it fades in with the pop: at rest the
     face keeps only the printed `--board-sheen`, and the live reflection is
     part of what "picked up" means.

     ±20% of the glare span, NOT the full face: the travel cap is one of the
     two throttles that keep the peak out of the type corners — the other is
     the gradient's own falloff. Both are documented at `.glareClip` in the
     CSS; move neither without re-measuring the corner contrast. */
  const glareX = useTransform(ry, [-TILT_CAP, TILT_CAP], ['-20%', '20%'])
  const glareY = useTransform(rx, [-TILT_CAP, TILT_CAP], ['20%', '-20%'])

  /* the box's own rect, read ONCE on enter. Reading it per pointermove is a
     forced layout on every mouse sample, which is exactly the cost this
     effect cannot afford. */
  const rect = useRef<DOMRect | null>(null)

  const enter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tiltOn || e.pointerType !== 'mouse') return
    rect.current = e.currentTarget.getBoundingClientRect()
    pop.set(1)
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
    pop.set(0)
  }

  return (
    <div
      className={`${styles.plinth} ${reduced ? styles.flat : ''} ${className ?? ''}`}
      onPointerEnter={enter}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {/* the box's contact with the shelf. Transform and opacity only, and
          it is the one node here that must NOT be in the 3D context — it is
          drawn with a blur, and filter is a grouping property. */}
      <motion.span
        className={styles.shadowWrap}
        aria-hidden="true"
        style={tiltOn ? { scale: shadowScale, opacity: shadowFade } : undefined}
        data-spring="window"
      >
        <span className={styles.shadow} />
      </motion.span>
      {/* reserved: passes 2–3 wrote a scroll-linked parallax rotateY here.
          Jake's pass-4 ruling killed the resting turn, so it is static — but
          it stays, because the flip and the tilt each need a layer of their
          own and merging the two would make them fight over `transform`. */}
      <div className={styles.stage} data-stage="">
        {tiltOn ? (
          <motion.div
            className={styles.tilt}
            data-tilt=""
            data-spring="window"
            style={{ rotateX: rx, rotateY: ry, y: lift, z }}
          >
            <Cuboid flipped={flipped} reduced={reduced}>
              {front}
              {back}
              {/* the moving sheen — tilt-machines only, so touch and
                  reduced motion never even mount the layer. Inside the
                  cuboid because a reflection must turn with the solid it
                  is on; the clip pins it to the front face's plane. */}
              <span className={styles.glareClip} aria-hidden="true">
                <motion.span
                  className={styles.glare}
                  data-spring="window"
                  style={{ x: glareX, y: glareY, opacity: pop }}
                />
              </span>
            </Cuboid>
          </motion.div>
        ) : (
          <div className={styles.tilt} data-tilt="">
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
      data-spring="deck"
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
