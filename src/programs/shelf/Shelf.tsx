'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { CopyText as Copy } from '@/content/CopyText'
import { sfx } from '@/lib/sound'
import { CASES, getCase } from '@/programs/projects/cases'
import { useFinePointer } from './Box3D'
import { LaunchOverlay } from './LaunchOverlay'
import { ShelfBox } from './ShelfBox'
import styles from './shelf.module.css'

/* SHIPPED.SW · IDX-16 — the case studies as boxed retail software from a
   parallel 1992. Replaces IN PROGRESS (WIP-15), the installer dialog that
   never finished: two flagship cases have shipped, so the door sells what
   is here instead of apologizing for what isn't. Boxes that HAVE shipped
   PLAY (nobody installs a case study — they play it, and the loading
   screen is the 1992 beat before it opens); boxes that haven't stay
   shrink-wrapped and print COMING SOON at the foot of their panel.

   The shelf is a horizontal carousel, one row deep, and it is deliberately
   never fully in frame: a box is always cut by the right edge, because a
   shelf you can see all of is a shelf with nothing else on it.

   A new case appears on this shelf by being in CASES — nothing here is
   registered twice. Optional `box` data (cases.ts) fills the back panel;
   without it the box still stands, just barer.

   PASS 12 TOOK THE NUDGE OFF THE SHELF (Jake's Figma pass). An unshipped box
   used to carry a progress meter and a TELL HIM TO FINISH IT button on its
   back, which meant this window held a session-scoped pressed set, an
   optimistic count, a honeypot field and a per-box refusal — a whole
   apparatus so that a carton could ask to be encouraged. The panel prints
   COMING SOON now. /api/nudge and the IN PROGRESS window are untouched: the
   mechanism still exists, this window just no longer reaches for it. */

/* THE RESTING TURN IS GONE (pass 4, Jake's ruling: head-on at rest).

   Passes 2–3 held every box at 22deg and swept it ±14 with scroll, on the
   theory that a cuboid square-on to the camera is a flat rectangle. That
   theory was only true because the shelf had no camera: the row's 980px
   perspective never reached the boxes (the preserve-3d chain broke at
   `.slot` — see Box3D.tsx), so the faked turn was shearing flat artwork and
   the shelf read as exactly what it was.

   With the chain repaired, position in the row does the work the constants
   used to fake: a box left of the vanishing point shows its right side, a
   box right of it shows its spine, and the box you are looking at faces you.
   So the loop that wrote those rotations — and the shadow-footprint maths
   that existed only to match them (squash and slide both resolve to identity
   at 0deg) — is deleted rather than zeroed. The shadow now answers the
   hover, and only the hover, from Box3D. */

export default function Shelf() {
  const fine = useFinePointer()
  const [playing, setPlaying] = useState<string | null>(null)
  /* WHICH BOX IS SHOWING ITS TAG. One string for the whole shelf, because
     the rule is a shelf-level rule and not a box-level one: a tag comes out
     when you reach for its box and STAYS out — it is a handle you pulled,
     not a tooltip — until you reach for a different box, which pulls that
     one out and pushes this one back. Two independent booleans could show
     two tags at once, which is the state this deliberately cannot reach. */
  const [revealed, setRevealed] = useState<string | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const row = useRef<HTMLUListElement>(null)

  /* A shelf runs left-to-right but a mouse wheel only knows up-and-down, so
     vertical wheel over the row becomes horizontal scroll. Attached by hand
     because preventDefault needs a non-passive listener, which React's
     synthetic onWheel cannot give.

     It yields at the ends: once the row is against either stop the event is
     left alone so the page (or a scrolling parent) takes it. A horizontal
     gesture — trackpad, tilt wheel — is already correct and passes through
     untouched. */
  useEffect(() => {
    const el = row.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return
      const next = el.scrollLeft + e.deltaY
      if (next <= 0 && el.scrollLeft <= 0) return
      if (next >= max && el.scrollLeft >= max) return
      e.preventDefault()
      el.scrollLeft = Math.max(0, Math.min(max, next))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  /* THE SHELF OPENS AT ITS OWN BEGINNING. Belt to ShelfBox's braces (the
     focus guard there is the actual fix for pass 7's "it starts in the
     middle"): whatever else has run by first paint, the row is at box one
     before the reader ever sees it. Layout effect, so it lands before the
     browser paints and no frame is ever drawn scrolled — a `useEffect` here
     would be a visible jump and, on a scroll-snap container, a fight. */
  useLayoutEffect(() => {
    if (row.current) row.current.scrollLeft = 0
  }, [])

  const startPlay = (slug: string, from: HTMLElement) => {
    trigger.current = from
    sfx.tap()
    setPlaying(slug)
  }

  // cancelled: focus goes back to the button that opened the layer
  const cancelPlay = useCallback(() => {
    setPlaying(null)
    trigger.current?.focus()
  }, [])

  // finished: the case window has focus now — taking it back would drop
  // the reader behind the window they just opened
  const finishPlay = useCallback(() => setPlaying(null), [])

  if (!CASES.length) {
    return <Copy k="progress.empty" as="p" className={styles.empty} />
  }

  const playingCase = playing ? getCase(playing) : undefined

  return (
    <div className={styles.wrap}>
      {/* NO MASTHEAD. "SHIPPED.SW · parallel 1992" stood here for three
          passes and Jake struck it in pass 4: the window is already titled
          Case Studies, and a shelf of boxed software does not need a line of
          copy explaining that it is a shelf of boxed software. The store
          framing went with it — Family Hub is hardware as well as software,
          and an aisle overcommits to a metaphor the work outgrew. The 54px
          it used to occupy went to the row. */}

      {/* one row, never two: a shelf is a line of boxes you walk along. The
          row is the 3D camera for every box on it (perspective lives here,
          in CSS) and it draws the plank they stand on. */}
      <ul className={styles.row} ref={row}>
        {CASES.map((c) => (
          <li key={c.slug} className={styles.slot}>
            <ShelfBox
              c={c}
              fine={fine}
              revealed={revealed === c.slug}
              // the launch layer covers the shelf, so every box under it
              // reads a pointerleave it must ignore — see ShelfBox's `leave`
              overlayOpen={playing !== null}
              onReveal={setRevealed}
              onPlay={startPlay}
            />
          </li>
        ))}
      </ul>

      {/* NO FOOTER (pass 7, Jake's ruling). A hint line — "sometimes you need
          a little push, you know?" — plus a pink stamp apologising that the
          encouragement line was not wired to storage yet: 40px of the window
          spent explaining a button that is on the back of two boxes and
          disables itself when it cannot work. Both are gone; the refusal it
          also carried moved onto the box that caused it (ShelfBox), which is
          the only place it was ever about anything. The 40px went back to the
          window — see the height derivation in programs/registry.tsx. */}

      <AnimatePresence>
        {playingCase && (
          <LaunchOverlay
            key={playingCase.slug}
            slug={playingCase.slug}
            name={playingCase.name}
            onCancel={cancelPlay}
            onDone={finishPlay}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
