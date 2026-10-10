'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import { Plate } from './CaseComponents'
import styles from './case.module.css'

/* "Onboarding, two grades": the redesigned first lap, walked twice. A
   fourth grader's flow on the left, an eighth grader's on the right,
   each in the site's phone shell (.phoneShell, scaled to its cell).
   Both read one shared progress value, so they step in lockstep and
   land on their last frames together even though the flows differ in
   length (33 frames against 20).

   Progress lives as a step k on the longer flow's grid, 0 to 32, so
   p = k / 32 and each flow shows frame round(p * (n - 1)) of its own n.

   Two modes while Jake picks (the chip in the cap row):
   LOCKED (default) is driven by hand. Fine pointer: cursor x across the
   stage picks the step, as PitchDeck does, and leaving holds it. Touch:
   a horizontal drag scrubs (touch-action: pan-y keeps vertical page
   scroll). Keys: left and right step, Home and End jump.
   FADE plays itself: one step every 1.4s, looping, each change
   crossfading over 300ms. Hovering holds it rather than scrubbing, so
   the reader can stop on a frame; drag and keys still step. It pauses
   while hovered, focused, dragged or out of view. Reduced motion turns
   FADE back into LOCKED with instant swaps.

   Rendering keeps two imgs per phone: the frame on show and the one it
   replaced, underneath, so a frame still decoding never flashes the
   bezel. The next two frames per flow preload as the step moves. */

const BASE = '/case/greenlight-invest/lap'

/* every frame is a 390pt iPhone 14 screen at 2x */
const W = 780
const H = 1688

/* the longer flow sets the grid: one step per fourth-grade frame */
const STEPS = 32

/* Jake's spec: one step every 1.4s in FADE */
const TICK_MS = 1400

type Flow = {
  id: 'g4' | 'g8'
  label: string
  short: string
  n: number
  /* regions in flow order: [first frame, 1-based; alt text]. A frame
     takes the alt of the last region that starts at or before it. */
  regions: Array<[from: number, alt: string]>
}

const FLOWS: [Flow, Flow] = [
  {
    id: 'g4',
    label: '4th grade',
    short: '4th',
    n: 33,
    regions: [
      [1, 'The fourth grader starts on the Greenlight home screen, where the Invest card offers to get started.'],
      [2, 'On the welcome screen, they pick how much they already know about investing, from nothing at all to having made a trade.'],
      [3, 'They watch an Investing 101 video for the basics before anything else.'],
      [4, 'They search from a list of top-rated companies they already know, like Apple, Disney, Netflix and Target.'],
      [5, 'Amazon’s stock page, with pop-up tips that teach the performance graph through quick questions about what they would have gained or lost.'],
      [12, 'Pop-up tips on Amazon’s page explain what analysts think, bulls and bears, then ask if the tips helped.'],
      [18, 'Amazon’s stock page with the Buy button ready.'],
      [20, 'The parent turns investing on, and the kid gets a notification and a celebration screen saying they can start.'],
      [23, 'The kid asks to buy Amazon, and the parent reviews the order and approves it.'],
      [28, 'They get a celebration screen for their first investment, a slice of Amazon.'],
      [29, 'The investments dashboard, with pop-up tips that explain the total, the graph and the math behind gains.'],
    ],
  },
  {
    id: 'g8',
    label: '8th grade',
    short: '8th',
    n: 20,
    regions: [
      [1, 'The eighth grader starts on the Greenlight home screen, where the Invest card offers to get started.'],
      [2, 'On the welcome screen, they pick how much they already know about investing, from nothing at all to having made a trade.'],
      [3, 'They watch an Investing 101 video for the basics, then answer a quick check on whether it made sense.'],
      [5, 'They search from a list of top-rated companies they already know, like Apple, Disney, Netflix and Target.'],
      [6, 'Amazon’s stock page, with a pop-up tip asking if they know how to read the screen.'],
      [9, 'They send their dad a request to start investing, then wait on his approval.'],
      [12, 'They find a new category, ETFs, which are groups of companies bought at once, and browse the list.'],
      [14, 'An ETF’s detail page, with pop-up tips on what the fund holds and a quick check on whether it is safer than one stock.'],
      [20, 'The ETF’s detail page, waiting on the parent’s approval to buy.'],
    ],
  },
]

const frameOf = (f: Flow, k: number) => Math.round((k / STEPS) * (f.n - 1))
const srcOf = (f: Flow, i: number) => `${BASE}/${f.id}-${String(i + 1).padStart(2, '0')}.webp`
const altOf = (f: Flow, i: number) => {
  let alt = f.regions[0][1]
  for (const [from, a] of f.regions) if (from <= i + 1) alt = a
  return alt
}
const pad = (v: number) => String(v).padStart(2, '0')
const clampStep = (v: number) => Math.min(STEPS, Math.max(0, v))

function Phone({
  flow,
  i,
  fading,
  wrap,
  warm,
}: {
  flow: Flow
  i: number
  fading: boolean
  wrap: boolean
  warm: boolean
}) {
  /* the frame on show and the one it replaced (React's derived-state
     pattern: set during render when the index moves) */
  const [pair, setPair] = useState({ cur: i, prev: i })
  if (pair.cur !== i) setPair({ cur: i, prev: pair.cur })

  /* preload the next two frames once the plate has been on screen.
     new Image() fetches into the HTTP cache; decode() readies the
     pixels so the swap lands on the next paint. */
  useEffect(() => {
    if (!warm) return
    for (const d of [1, 2]) {
      const j = wrap ? (i + d) % flow.n : i + d
      if (j >= flow.n) continue
      const im = new Image()
      im.src = srcOf(flow, j)
      im.decode?.().catch(() => {})
    }
  }, [flow, i, wrap, warm])

  /* same keys for the same frame, so the outgoing img keeps its DOM
     node (already decoded) as it drops underneath */
  return (
    <div className={styles.lapCell}>
      <span className={styles.lapLabel}>{flow.label}</span>
      <div className={`${styles.phoneShell} ${styles.lapShell}`}>
        <div className={styles.lapScreen}>
          {pair.prev !== pair.cur && (
            <img
              key={`f${pair.prev}`}
              src={srcOf(flow, pair.prev)}
              width={W}
              height={H}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          )}
          <img
            key={`f${pair.cur}`}
            src={srcOf(flow, pair.cur)}
            width={W}
            height={H}
            alt={altOf(flow, pair.cur)}
            loading="lazy"
            draggable={false}
            data-fade={(fading && pair.prev !== pair.cur) || undefined}
          />
        </div>
      </div>
    </div>
  )
}

export function LapFlow() {
  const [fine, setFine] = useState(false)
  const [k, setK] = useState(0)
  /* TEMPORARY: the LOCKED / FADE chip stays until Jake picks one; the
     loser and the chip come out together. LOCKED is his default. */
  const [mode, setMode] = useState<'locked' | 'fade'>('locked')
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [drag, setDrag] = useState(false)
  const [inView, setInView] = useState(false)
  const [warm, setWarm] = useState(false)
  const reduced = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const grab = useRef<{ id: number; x: number; k: number } | null>(null)

  const fading = mode === 'fade' && !reduced

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* in view: FADE only runs on screen, and preloading waits for the
     first sighting so an unread plate costs two images, not six */
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting)
      if (e.isIntersecting) setWarm(true)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const held = hover || focus || drag
  useEffect(() => {
    if (!fading || !inView || held) return
    const t = setInterval(() => setK((v) => (v + 1) % (STEPS + 1)), TICK_MS)
    return () => clearInterval(t)
  }, [fading, inView, held])

  const [g4, g8] = FLOWS
  const i4 = frameOf(g4, k)
  const i8 = frameOf(g8, k)

  return (
    <Plate
      cap="Onboarding, two grades"
      readout={
        <span className={styles.plateCount}>
          {g4.short} {pad(i4 + 1)}/{pad(g4.n)} · {g8.short} {pad(i8 + 1)}/{pad(g8.n)}
        </span>
      }
      chip={
        <span className={styles.fidChip} role="group" aria-label="Playback">
          {(['locked', 'fade'] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={styles.fidChipSeg}
              aria-pressed={mode === id}
              onClick={() => {
                if (mode === id) return
                sfx.tap()
                setMode(id)
              }}
            >
              {id}
            </button>
          ))}
        </span>
      }
      caption="A fourth grader and an eighth grader walk the same first lap. Scrub across to step both."
    >
      <div
        ref={stage}
        className={styles.lapStage}
        tabIndex={0}
        role="group"
        aria-label={`The same first lap for a fourth grader and an eighth grader, side by side. Fourth grade screen ${i4 + 1} of ${g4.n}, eighth grade screen ${i8 + 1} of ${g8.n}. Move the cursor across, drag, or use the arrow keys to step both.`}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const g = grab.current
          if (g && g.id === e.pointerId) {
            /* drag: relative, a full stage width walks the whole lap */
            setK(clampStep(g.k + Math.round(((e.clientX - g.x) / r.width) * STEPS)))
            return
          }
          /* hover scrub, LOCKED only: equal bins across the width,
             leaving holds the step (no reset) */
          if (e.pointerType === 'mouse' && fine && !fading) {
            setK(clampStep(Math.floor(((e.clientX - r.left) / r.width) * (STEPS + 1))))
          }
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return
          grab.current = { id: e.pointerId, x: e.clientX, k }
          setDrag(true)
        }}
        onPointerUp={(e) => {
          if (grab.current?.id !== e.pointerId) return
          grab.current = null
          setDrag(false)
        }}
        onPointerCancel={() => {
          /* the browser took the gesture for a vertical page scroll */
          grab.current = null
          setDrag(false)
        }}
        onKeyDown={(e) => {
          const to =
            e.key === 'ArrowRight' ? k + 1
            : e.key === 'ArrowLeft' ? k - 1
            : e.key === 'Home' ? 0
            : e.key === 'End' ? STEPS
            : null
          if (to === null) return
          e.preventDefault()
          setK(clampStep(to))
        }}
      >
        <Phone flow={g4} i={i4} fading={fading} wrap={fading} warm={warm} />
        <Phone flow={g8} i={i8} fading={fading} wrap={fading} warm={warm} />
      </div>
    </Plate>
  )
}
