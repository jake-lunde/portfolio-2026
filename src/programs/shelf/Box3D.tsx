'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
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

   Two nested transforms, deliberately never merged: the PARALLAX rotation
   is written to `.stage` by the carousel's scroll loop, the FLIP rotation
   is Motion's on `.cuboid`. One element cannot own both without them
   fighting over `transform`.

   Reduced motion collapses the whole thing (`.flat`): the sides disappear,
   the cuboid stops rotating, and the two faces crossfade — pass 1's
   behaviour, preserved as the fallback.

   THE SHADOW IS NOT IN THE BOX. It lives on `.plinth`, a flat wrapper
   OUTSIDE the 3D context, because it is drawn with `filter: blur()` and
   filter is a grouping property — inside the cuboid it would flatten every
   face beneath it. Grounding is what sells a solid: a box that turns but
   floats still reads as a card. */

export function Box3D({
  front,
  back,
  flipped,
  className,
  onKeyDown,
}: {
  /** the front-face element — must carry `.face` styling itself */
  front: ReactNode
  back: ReactNode
  flipped: boolean
  className?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  const reduced = useReducedMotion()

  return (
    <div
      className={`${styles.plinth} ${reduced ? styles.flat : ''} ${className ?? ''}`}
      onKeyDown={onKeyDown}
    >
      {/* the box's contact with the shelf. Written by the same scroll loop
          that turns the box: as the face swings away its footprint narrows
          and slides, and the shadow goes with it. Transform only. */}
      <span className={styles.shadow} data-shadow="" aria-hidden="true" />
      <div
        // data-stage: the carousel's scroll loop finds its boxes by this and
        // writes the parallax rotateY here. Nothing else may set transform.
        data-stage=""
        className={styles.stage}
      >
        <motion.div
          className={styles.cuboid}
          // `initial` as well as `animate` so Motion writes the resting
          // transform into the SSR markup — without it the first paint is an
          // untransformed stack and the back shows through until hydration.
          initial={reduced ? undefined : { rotateY: 0 }}
          animate={reduced ? undefined : { rotateY: flipped ? 180 : 0 }}
          transition={reduced ? { duration: 0 } : SPRINGS.deck}
        >
          {front}
          {back}
          {/* cardboard thickness. Token-only: the face ground darkened by a
              fixed mix, so every skin gets its own shade of board for free. */}
          <span className={`${styles.side} ${styles.spine}`} aria-hidden="true" />
          <span className={`${styles.side} ${styles.edge}`} aria-hidden="true" />
          <span className={`${styles.side} ${styles.top}`} aria-hidden="true" />
          <span className={`${styles.side} ${styles.bottom}`} aria-hidden="true" />
        </motion.div>
      </div>
    </div>
  )
}
