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
   Press WORK and the desk goes back; the four boxes come up over it, all
   of them, lifted off the desk on their own shadows. No titlebar and no
   close box and (since Jake struck the board) no shelf either: the boxes
   are the frame, and the way out is Escape, a click on the bare desk, or
   WORK again (the dock tile stays lit while the mode is on).

   TWO LAYERS, AND KEEPING THEM SEPARATE IS THE WHOLE TRICK. The desk
   recedes inside `.deskLayer` (shell.module.css) on one composited
   transform, dims, and blurs; the boxes stand HERE, in a layer above it.
   That is why the registry's `noRecede` escape hatch could be retired,
   and why the desk may take a `filter` at all: grouping flattens 3D, the
   boxes are real cuboids, and nothing groups them any more because they
   are not inside the thing that recedes. Their preserve-3d chain is
   untouched.

   THIS LAYER DOES NOT TAKE THE POINTER (desktop). It is `pointer-events:
   none` and hands `auto` back to the boxes and to the launch dialog only,
   so the dock rail underneath stays live — it is chrome, it never dims,
   and pressing WORK on it is one of the three ways out. The bare-desk
   click is caught by `.deskCatcher`, which Desktop.tsx mounts INSIDE the
   desktop between the receded desk and the rail (shell.module.css has the
   z-order). Below the mobile floor the layer is full-bleed and opaque, so
   it does take the pointer there, and a tap off the boxes leaves.

   ⚠️ The inset below tracks `.desktop`'s in shell.module.css. The mode
   covers the desk, not the machine: the menu bar and the ticker stay up. */

/** The row at rest: 4 × 246 boxes + 3 × 32 gaps + the row's two 40px
    gutters. Wider than this and the shelf stands at full size; narrower
    and every box metric scales by `--deck-scale` (shelf.module.css) —
    the row never scrolls on a desk, because seeing all four is the point
    (Jake's ruling). 1080 is that number less the gutters, which do not
    scale: they are the composition's own margin, not part of the stock. */
const DECK_FIT = 1080
const DECK_GUTTERS = 80

/** THE PHONE'S NUMBERS. The stack draws the desk's own 246px box and
    scales it whole to the column (shelf.module.css, the mobile block), so
    what it needs is the ratio between the screen less its two 16px
    gutters and that box. 16 is `--spacing-layout-sm`, named here because
    JS cannot read a token that CSS has not applied to anything yet. */
const BOX_BASE = 246
const STACK_GUTTERS = 32

export function ShelfMode() {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const leaveMode = useShelfMode((s) => s.leave)
  const region = useRef<HTMLDivElement>(null)
  /* Two scales, one measurement, and CSS picks: `deck` shrinks four boxes
     to fit one row across a desk, `stack` grows one box to the width of a
     phone. Neither breakpoint has to know the other exists. */
  const [scale, setScale] = useState({ deck: 1, stack: 1 })

  /* THE ROW SCALES, IT DOES NOT SCROLL — and on a phone the stack scales
     the other way, up. Measured rather than declared in a breakpoint: the
     desk is whatever width the glass is, and a shelf that shows three and
     a half boxes at 1100px would be the exact failure this mode was built
     to fix. Every box metric is a multiple of this number
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
      const round = (n: number) => Math.round(n * 1000) / 1000
      setScale({
        deck: Math.min(1, round((w - DECK_GUTTERS) / DECK_FIT)),
        stack: round((w - STACK_GUTTERS) / BOX_BASE),
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* FOCUS GOES INTO THE SHELF AND COMES BACK OUT. The desk is `inert`
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
      /* ESCAPE BELONGS TO THE DOOR IN FRONT OF THE VISITOR, and the mode
         is the room behind all of them. The menu bar stays live while the
         mode runs, so its skin flyout is open on top of the boxes often
         enough to matter, and a dialog can be up from before the mode was
         entered. Both listen for Escape on the window underneath this
         handler and neither swallows it, so without this test one press
         would close the thing in front AND put the desk back.

         Presence in the document is the test, not focus: these overlays
         are conditionally mounted and several of them never take focus at
         all (the zoomed print keeps the caret on the print). Same rule and
         same reasoning as INSPECT's own ladder — see the note in
         components/inspect/InspectShell.tsx. */
      if (document.querySelector('[role="dialog"], [role="menu"]')) return
      leave()
    }
    /* On `window`, so it fires wherever focus sits. The launch overlay
       eats the first Escape on the React tree (LaunchOverlay stops the
       native event at the root container) and the test above catches it
       even when focus has fallen off the button that opened it, which
       keeps the ladder reading overlay → mode. */
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave])

  /* A click on the bare desk leaves; a click on a box, or on the launch
     dialog standing over them, does not. Asked as a question about the
     target rather than by layering invisible boxes, because the stock
     moves with the glass and a hit-test rectangle would not. */
  const clickedOff = (target: EventTarget | null) =>
    !(target instanceof Element) || !target.closest('[data-shelf-stock], [role="dialog"]')

  return (
    <motion.div
      ref={region}
      className={styles.mode}
      style={{ ['--deck-scale' as string]: scale.deck, ['--stack-scale' as string]: scale.stack }}
      data-shelf-mode=""
      tabIndex={-1}
      role="region"
      aria-label={t('shelf.mode.label', skin)}
      onClick={(e) => {
        // desktop hands this layer no pointer at all (see the header) —
        // this is the mobile tap-off-the-boxes exit
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

      {/* THE ARRIVAL IS PER BOX, NOT PER DECK — they come in one at a
          time, left to right (Jake). That lives in Shelf.tsx, on the
          slots, because a stagger is a fact about four objects rather
          than about the tray they sit on. What is left here is the way
          OUT: short, and a tween rather than the spring, because the
          subject of a leave is the desk coming back and a spring settling
          here would hold the boxes on screen for twice as long as the
          desk takes to return.

          NOTHING ABOVE THE BOXES EVER TAKES AN OPACITY at full motion.
          Grouping properties — opacity, filter, mask — flatten 3D, so a
          fade on this element would collapse four cuboids into cardboard
          for its whole duration. Under reduced motion there is nothing to
          protect (ShelfBox has already flattened the solid), so that path
          fades. */}
      <motion.div
        className={styles.deck}
        initial={false}
        exit={reduced ? { opacity: 0 } : { y: 26, transition: { duration: 0.14 } }}
        transition={reduced ? { duration: 0.12 } : SPRINGS.rise}
      >
        <Shelf onLaunched={() => leaveMode({ restoreFocus: false })} />
      </motion.div>
    </motion.div>
  )
}

export default ShelfMode
