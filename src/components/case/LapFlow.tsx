'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import { Plate } from './CaseComponents'
import styles from './case.module.css'

/* "Onboarding, two grades": the redesigned first lap, one grade at a
   time in the site's phone shell (.phoneShell, scaled to its cell).
   Jake ruled two phones at once too busy, so the chip in the cap row
   picks the grade instead: a fourth grader's flow (33 frames) or an
   eighth grader's (20). Switching keeps the proportional position, so
   halfway through one lap lands halfway through the other.

   The phone plays itself, one frame every 4.5s, looping, while the
   stage is on screen. Keyboard focus inside the stage pauses it; hover
   does not. Two invisible buttons cover the screen halves: the right
   one steps forward, the left one back, both wrapping. The first press
   hands the reader the wheel: autoplay stops and stays off until the
   stage leaves the viewport and comes back (Jake, s143). Left and right
   arrows do the same, Home and End jump.

   Every change crossfades over 300ms, opacity only: the new frame
   waits (invisible) until it has loaded, fades in over the old one,
   and the old one leaves the DOM when the fade ends, so two frames are
   never left stacked. Reduced motion: no autoplay, no fade, instant
   swaps. The next two frames of the active flow preload as it moves. */

const BASE = '/case/greenlight-invest/lap'

/* every frame is a 390pt iPhone 14 screen at 2x */
const W = 780
const H = 1688

/* Jake's spec: one automatic step every 3.5s */
const TICK_MS = 4500 /* Jake's pace, s143: 3.5 read as rushed */

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

const srcOf = (f: Flow, i: number) => `${BASE}/${f.id}-${String(i + 1).padStart(2, '0')}.webp`
const altOf = (f: Flow, i: number) => {
  let alt = f.regions[0][1]
  for (const [from, a] of f.regions) if (from <= i + 1) alt = a
  return alt
}
const pad = (v: number) => String(v).padStart(2, '0')

/* the screen: the frame on show over the one it replaced, until the
   new one has loaded and faded in */
function Screen({
  src,
  alt,
  fade,
  children,
}: {
  src: string
  alt: string
  fade: boolean
  children: React.ReactNode
}) {
  const [loaded, setLoaded] = useState('')
  /* React's derived-state pattern: set during render when src moves.
     The frame underneath is the last one that actually painted, so a
     quick double press never leaves an unloaded frame as the backdrop. */
  const [pair, setPair] = useState({ cur: src, prev: '' })
  if (pair.cur !== src) {
    setPair({ cur: src, prev: loaded === pair.cur ? pair.cur : pair.prev })
  }
  const img = useRef<HTMLImageElement>(null)

  /* a cached frame can finish before the load listener matters */
  useLayoutEffect(() => {
    const el = img.current
    if (el?.complete && el.naturalWidth > 0) setLoaded(pair.cur)
  }, [pair.cur])

  const ready = loaded === pair.cur
  const drop = () => setPair((v) => (v.prev ? { cur: v.cur, prev: '' } : v))

  /* no fade (reduced motion, or nothing underneath): the old frame
     goes the moment the new one can paint */
  useEffect(() => {
    if (ready && (!fade || !pair.prev)) drop()
  }, [ready, fade, pair.prev])

  return (
    <div className={styles.lapScreen}>
      {pair.prev && (
        <img
          key={pair.prev}
          src={pair.prev}
          width={W}
          height={H}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}
      <img
        key={pair.cur}
        ref={img}
        src={pair.cur}
        width={W}
        height={H}
        alt={alt}
        draggable={false}
        data-state={!ready ? 'wait' : fade && pair.prev ? 'fade' : undefined}
        onLoad={() => setLoaded(pair.cur)}
        onAnimationEnd={drop}
      />
      {children}
    </div>
  )
}

export function LapFlow() {
  const [g, setG] = useState(0)
  const [i, setI] = useState(0)
  /* set by the first press; autoplay stays off until the stage leaves
     the viewport, so a reader who took over is never stepped on */
  const [taken, setTaken] = useState(false)
  const [kbFocus, setKbFocus] = useState(false)
  const [inView, setInView] = useState(false)
  const [warm, setWarm] = useState(false)
  const reduced = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)

  const flow = FLOWS[g]
  const n = flow.n

  /* in view: autoplay only runs on screen, and preloading waits for the
     first sighting */
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting)
      if (e.isIntersecting) setWarm(true)
      else setTaken(false)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* one step per interval; any change of frame or grade resets it */
  useEffect(() => {
    if (reduced || !inView || kbFocus || taken) return
    const t = setTimeout(() => setI((v) => (v + 1) % n), TICK_MS)
    return () => clearTimeout(t)
  }, [reduced, inView, kbFocus, taken, i, g, n])

  /* preload the next two frames: new Image() fetches into the HTTP
     cache, decode() readies the pixels for the next paint */
  useEffect(() => {
    if (!warm) return
    for (const d of [1, 2]) {
      const im = new Image()
      im.src = srcOf(flow, (i + d) % n)
      im.decode?.().catch(() => {})
    }
  }, [warm, flow, i, n])

  const go = (to: number) => {
    setI(((to % n) + n) % n)
    setTaken(true)
  }

  const pick = (next: number) => {
    if (next === g) return
    sfx.tap()
    /* keep the proportional position across grades */
    const p = i / (n - 1)
    setI(Math.round(p * (FLOWS[next].n - 1)))
    setG(next)
  }

  return (
    <Plate
      cap="Onboarding, two grades"
      readout={
        <span className={styles.plateCount}>
          {flow.short} {pad(i + 1)}/{pad(n)}
        </span>
      }
      chip={
        <span className={styles.fidChip} role="group" aria-label="Grade">
          {FLOWS.map((f, k) => (
            <button
              key={f.id}
              type="button"
              className={styles.fidChipSeg}
              aria-pressed={g === k}
              aria-label={f.label}
              onClick={() => pick(k)}
            >
              {f.short}
            </button>
          ))}
        </span>
      }
      caption="A fourth grader and an eighth grader walk the same first lap. Tap the right side to step forward, the left to go back."
    >
      <div
        ref={stage}
        className={styles.lapStage}
        role="group"
        aria-label={`The first lap, ${flow.label}, screen ${i + 1} of ${n}. Left and right arrows step through it.`}
        /* only keyboard focus pauses: a mouse press on a step button can
           focus it too, and that must not stop the playback */
        onFocus={(e) => setKbFocus(e.target.matches(':focus-visible'))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKbFocus(false)
        }}
        onKeyDown={(e) => {
          const to =
            e.key === 'ArrowRight' ? i + 1
            : e.key === 'ArrowLeft' ? i - 1
            : e.key === 'Home' ? 0
            : e.key === 'End' ? n - 1
            : null
          if (to === null) return
          e.preventDefault()
          go(to)
        }}
      >
        <div className={styles.lapCell}>
          <div className={`${styles.phoneShell} ${styles.lapShell}`}>
            <Screen src={srcOf(flow, i)} alt={altOf(flow, i)} fade={!reduced}>
              <button
                type="button"
                className={styles.lapHit}
                data-side="prev"
                aria-label="Previous screen"
                onClick={() => go(i - 1)}
              />
              <button
                type="button"
                className={styles.lapHit}
                data-side="next"
                aria-label="Next screen"
                onClick={() => go(i + 1)}
              />
            </Screen>
          </div>
        </div>
      </div>
    </Plate>
  )
}
