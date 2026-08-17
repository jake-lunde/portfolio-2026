'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import { SPRINGS } from '@/lib/motion'
import { useSettings } from '@/store/settings'
import { returnFocus, useShelfMode } from '@/store/shelfMode'
import Shelf from './Shelf'
import styles from './shelf.module.css'

/* SHELF.MODE — the shelf as a mode of the desk (Jake, "Hide Others").
   Press WORK and the desk goes back; the four boxes come up on a plank
   that spans the screen. No titlebar and no close box: the plank is the
   frame, and the way out is Escape, a click on the bare desk, or WORK
   again (the dock tile stays lit while the mode is on).

   TWO LAYERS, AND KEEPING THEM SEPARATE IS THE WHOLE TRICK. The desk
   recedes inside `.deskLayer` (shell.module.css) on one composited
   transform; the boxes stand HERE, in a layer above it. That is why the
   registry's old `noRecede` escape hatch is gone: the shell's recede is a
   `filter`/`opacity` group, grouping flattens 3D, and the boxes are real
   cuboids — but nothing groups them any more, because they are not inside
   the thing that recedes. Their preserve-3d chain is untouched.

   THIS LAYER DOES NOT TAKE THE POINTER (desktop). It is `pointer-events:
   none` and hands `auto` back to the plank and to the launch dialog only,
   so the dock rail underneath stays live — it is chrome, it never dims,
   and pressing WORK on it is one of the three ways out. The bare-desk
   click is caught by `.deskCatcher`, which Desktop.tsx mounts INSIDE the
   desktop between the receded desk and the rail (shell.module.css has the
   z-order). Below the mobile floor the layer is full-bleed and opaque, so
   it does take the pointer there, and a tap off the plank leaves.

   ⚠️ The inset below tracks `.desktop`'s in shell.module.css. The mode
   covers the desk, not the machine: the menu bar and the ticker stay up. */

/** The row at rest: 4 × 246 boxes + 3 × 32 gaps + the row's two 40px
    gutters. Wider than this and the shelf stands at full size; narrower
    and every box metric scales by `--deck-scale` (shelf.module.css) —
    the row never scrolls on a desk, because seeing all four is the point
    (Jake's ruling). 1080 is that number less the gutters, which do not
    scale: they are the plank's own margin, not part of the stock. */
const DECK_FIT = 1080
const DECK_GUTTERS = 80

export function ShelfMode() {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const leaveMode = useShelfMode((s) => s.leave)
  const region = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  /* THE ROW SCALES, IT DOES NOT SCROLL. Measured rather than declared in a
     breakpoint: the desk is whatever width the glass is, and a shelf that
     shows three and a half boxes at 1100px would be the exact failure this
     mode was built to fix. Every box metric is a multiple of this number
     (shelf.module.css, `.deckRow .plinth`), and the cover type is already a
     multiple of `--box-w`, so the artwork shrinks with the board for free.
     Layout effect: the first paint is at the right size, never a resize the
     reader watches happen. */
  useLayoutEffect(() => {
    const el = region.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      if (!w) return
      setScale(Math.min(1, Math.round(((w - DECK_GUTTERS) / DECK_FIT) * 1000) / 1000))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* FOCUS GOES INTO THE PLANK AND COMES BACK OUT. The desk is `inert`
     while the mode runs (Desktop.tsx), so focus has to land somewhere on
     this side of it: the region itself, from which Tab reaches the first
     box. On the way out it goes back to whatever summoned the mode — the
     dock tile, the desktop icon, the case footer's link — unless PLAY has
     already handed it to a case window (store/shelfMode.ts). */
  useEffect(() => {
    region.current?.focus({ preventScroll: true })
    return returnFocus
  }, [])

  const leave = useCallback(() => leaveMode(), [leaveMode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      leave()
    }
    /* On `window`, so it fires wherever focus sits. The launch overlay
       eats the first Escape on the React tree (LaunchOverlay stops the
       native event at the root container), which keeps the ladder
       reading overlay → mode. */
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave])

  /* A click on the bare desk leaves; a click on the plank, on a box, or on
     the launch dialog standing over them does not. Asked as a question
     about the target rather than by layering invisible boxes, because the
     plank moves with the glass and a hit-test rectangle would not. */
  const clickedOff = (target: EventTarget | null) =>
    !(target instanceof Element) || !target.closest('[data-shelf-plank], [role="dialog"]')

  return (
    <motion.div
      ref={region}
      className={styles.mode}
      style={{ ['--deck-scale' as string]: scale }}
      data-shelf-mode=""
      tabIndex={-1}
      role="region"
      aria-label={t('shelf.mode.label', skin)}
      onClick={(e) => {
        // desktop hands this layer no pointer at all (see the header) —
        // this is the mobile tap-off-the-plank exit
        if (clickedOff(e.target)) leave()
      }}
    >
      {/* THE ONE CONTROL, AND IT IS MOBILE-ONLY. On a desk the ways out are
          Escape, the bare desk and the WORK tile, all three of them
          present — a close box would be the titlebar Jake struck. On a
          phone the mode is full-bleed, the dock rail does not render and
          there is no bare desk to click, so the way back has to be
          visible. First in the DOM because a way back belongs at the top
          of the screen and at the front of the tab order. */}
      <button type="button" className={styles.modeExit} onClick={leave}>
        <Copy k="shelf.mode.exit" as="span" />
      </button>

      {/* THE BOXES RISE, AND NOTHING ABOVE THEM EVER TAKES AN OPACITY.
          Grouping properties — opacity, filter, mask — flatten 3D, which
          is the whole reason the shelf carried `noRecede` in the registry
          for as long as it lived in a window. So the full-motion entrance
          is a transform and only a transform: fading this element in
          would collapse four cuboids into cardboard for the length of the
          fade and pop them back at the end. Under reduced motion there is
          nothing to protect — ShelfBox has already flattened the solid to
          a stack of faces — so that path is the crossfade Jake asked for,
          with no scale and no travel. */}
      <motion.div
        className={styles.deck}
        initial={reduced ? { opacity: 0 } : { y: 28 }}
        animate={reduced ? { opacity: 1 } : { y: 0 }}
        /* the way out is short and it is a tween, not the spring: the
           subject of the leave is the desk coming back, and a spring
           settling here would hold the plank on screen for twice as long
           as the desk takes to return */
        exit={reduced ? { opacity: 0 } : { y: 26, transition: { duration: 0.14 } }}
        transition={reduced ? { duration: 0.12 } : SPRINGS.rise}
      >
        <Shelf onLaunched={() => leaveMode({ restoreFocus: false })} />
      </motion.div>
    </motion.div>
  )
}

export default ShelfMode
