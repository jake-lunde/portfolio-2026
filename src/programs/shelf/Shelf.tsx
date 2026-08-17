'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CopyText as Copy } from '@/content/CopyText'
import { SPRINGS } from '@/lib/motion'
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

   ALL FOUR BOXES ARE IN FRAME NOW, AND THAT OVERTURNS THE s39b RULING.
   This file used to say that the shelf was "deliberately never fully in
   frame: a box is always cut by the right edge, because a shelf you can
   see all of is a shelf with nothing else on it" — the cut third box was
   on purpose, a carousel promising more stock down the aisle. Jake struck
   it ("Hide Others"): the boxes are the signature object on this site, the
   760px window was cutting two whole ones plus 160px of a third, and a
   promise of more is worth less than the work itself. The shelf is not in
   a window any more. It is a MODE OF THE DESK (store/shelfMode.ts): the
   desk recedes on this row's own 980px camera, blurs, and the four boxes
   come up over it, all of them at once. The boxes earn the room now.

   AND THERE IS NO SHELF UNDER THEM EITHER. A painted board ran the width
   of the row for nine passes; at desk width it was a hairline the length
   of the screen, so Jake struck it — "lose the shelf, it doesn't read,
   and instead give the drop shadow a little more distance". The boxes
   float now, and how high is the shadow's job (shelf.module.css).

   The row is still a scroller and still cuts on MOBILE, where a finger
   drags the stock along — the carousel survives exactly where it is still
   the honest answer.

   A new case appears on this shelf by being in CASES — nothing here is
   registered twice. Optional `box` data (cases.ts) fills the back panel;
   without it the box still stands, just barer.

   PASS 12 TOOK THE NUDGE OFF THE SHELF (Jake's Figma pass) AND PASS 13 TOOK
   IT OUT OF THE REPO. An unshipped box used to carry a progress meter and a
   TELL HIM TO FINISH IT button on its back, which meant this window held a
   session-scoped pressed set, an optimistic count, a honeypot field and a
   per-box refusal — a whole apparatus so that a carton could ask to be
   encouraged. The panel prints COMING SOON now, and with the shelf as its
   only caller, `/api/nudge` and the `progress.nudge*` strings went with it
   (Jake's ruling): an endpoint nothing reaches is a blob store waiting to
   collect writes nobody reads. `progress` itself stays in cases.ts — it is
   what decides shipped from unshipped. */

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

/* THE BEAT BETWEEN TWO BOXES ARRIVING. 70ms: long enough that the four
   read as four separate arrivals, short enough that the last one is on
   the desk 210ms after the first and nobody is waiting on furniture.
   A literal rather than a token because the motion tokens describe how a
   thing moves (SPRINGS) and how long a fade takes (DURATIONS), and there
   is no stagger in the set — the day there is, this is its first
   caller. */
const STAGGER = 0.07

export default function Shelf({
  onLaunched,
}: {
  /** the case window is open and holds focus — the mode that mounted this
      shelf steps aside so the case lands on a restored desk */
  onLaunched?: () => void
} = {}) {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
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
  // the reader behind the window they just opened. The mode goes with it:
  // the case opens on the restored desk, never under the shelf.
  const finishPlay = useCallback(() => {
    setPlaying(null)
    onLaunched?.()
  }, [onLaunched])

  if (!CASES.length) {
    return <Copy k="progress.empty" as="p" className={styles.empty} />
  }

  const playingCase = playing ? getCase(playing) : undefined

  return (
    <div className={`${styles.wrap} ${styles.deckWrap}`}>
      {/* NO MASTHEAD, AND IT DOES NOT COME BACK. "SHIPPED.SW · parallel
          1992" stood here for three passes and Jake struck it in pass 4: a
          shelf of boxed software does not need a line of copy explaining
          that it is a shelf of boxed software. The store framing went with
          it — Family Hub is hardware as well as software, and an aisle
          overcommits to a metaphor the work outgrew. The 54px it used to
          occupy went to the row. The mode has no titlebar to carry the
          name either, and Jake ruled on that directly when the room
          arrived: pass 4 deleted it and it stays deleted. */}

      {/* one row, never two: a shelf is a line of boxes you walk along. The
          row is the 3D camera for every box on it (perspective lives here,
          in CSS).

          `data-shelf-stock` is how the mode tells a click on the shelf
          from a click on the bare desk (ShelfMode.tsx). It sits on the
          SLOTS, because with the board gone the row is an invisible band
          across the desk and the gap between two boxes has to mean what it
          looks like: bare desk. It stays on the row as well for the phone,
          where the row is a full-bleed scroller a finger drags. */}
      <ul className={`${styles.row} ${styles.deckRow}`} ref={row} data-shelf-stock="">
        {CASES.map((c, i) => (
          /* THEY COME IN ONE AT A TIME (Jake). Each box rises a little,
             grows the last 8% into place, and waits a beat longer than the
             one to its left — so the shelf is stocked left to right rather
             than switched on. Transform only: an opacity here would group
             the slot, and a grouping property above a face flattens the
             cuboid inside it (see ShelfBox's header). Under reduced motion
             there is nothing to protect — the solid is already a flat
             stack — so that path is the plain fade, still one at a time. */
          <motion.li
            key={c.slug}
            className={styles.slot}
            data-shelf-stock=""
            initial={reduced ? { opacity: 0 } : { y: 26, scale: 0.92 }}
            animate={reduced ? { opacity: 1 } : { y: 0, scale: 1 }}
            transition={
              reduced
                ? { duration: 0.16, delay: i * STAGGER }
                : { ...SPRINGS.rise, delay: i * STAGGER }
            }
          >
            <ShelfBox
              c={c}
              fine={fine}
              revealed={revealed === c.slug}
              // the launch layer covers the shelf, so every box under it
              // reads a pointerleave it must ignore — see ShelfBox's `leave`
              overlayOpen={playing !== null}
              onReveal={setRevealed}
              onPlay={startPlay}
              /* THE FLIP TAG IS OFF (Jake, "lose the flip buttons for
                 now"). One flag, so it comes back the day he wants it —
                 and with the chip gone the cover itself becomes the
                 announced control, which is what keeps PLAY (printed on
                 the back panel) reachable from a keyboard. */
              flipTag={false}
            />
          </motion.li>
        ))}
      </ul>

      {/* NO FOOTER (pass 7, Jake's ruling). A hint line — "sometimes you need
          a little push, you know?" — plus a pink stamp apologising that the
          encouragement line was not wired to storage yet: 40px of the window
          spent explaining a button that is on the back of two boxes and
          disables itself when it cannot work. Both are gone; the refusal it
          also carried moved onto the box that caused it (ShelfBox), which is
          the only place it was ever about anything. The 40px went back to the
          row — see the height derivation on `.row` in shelf.module.css. */}

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
