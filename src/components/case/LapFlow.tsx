'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import { Plate } from './CaseComponents'
import styles from './case.module.css'

/* "Onboarding, two grades": the redesigned app at two levels, one
   phone in the site's phone shell (.phoneShell, scaled to its cell).
   The chip in the cap row picks the level, LEVEL 1 or LEVEL 2, named
   as in Figma (level 1 is the fourth grader, level 2 the eighth). Four
   pill tabs under the stage pick the screen; switching tab keeps the
   level.

   ONBOARDING walks the first lap: a fourth grader's flow (33 frames) or
   an eighth grader's (20). Switching grade keeps the proportional
   position, so halfway through one lap lands halfway through the other.
   The phone plays itself, one frame every 4.5s, while the stage is on
   screen, and rests on the last frame: the lap never loops (Jake, s143).
   Keyboard focus inside the stage pauses it; hover does not. Two
   invisible buttons cover the screen halves: the right one steps
   forward, the left one back, and both stop at the ends. The first press
   hands the reader the wheel: autoplay stops and stays off until the
   stage leaves the viewport and comes back (Jake, s143). Left and right
   arrows do the same, Home and End jump. Every change crossfades over
   300ms, opacity only: the new frame waits (invisible) until it has
   loaded, fades in over the old one, and the old one leaves the DOM
   when the fade ends. Reduced motion: no autoplay, no fade, instant
   swaps. The next two frames preload as it moves.

   STOCK DETAILS, SEARCH and DASHBOARD each show one long screenshot
   the way the real app does: its top and bottom chrome stay pinned to
   the frame and only the middle scrolls, a normal scroll box for every
   pointer (LongScreen below). Switching level there keeps the scroll
   fraction. */

const BASE = '/case/greenlight-invest/lap'

/* every frame is a 390pt iPhone 14 screen at 2x */
const W = 780
const H = 1688

/* one automatic step every 4.5s: Jake's pace, s143 (3.5 read as rushed) */
const TICK_MS = 4500

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
    label: 'Level 1',
    short: 'Level 1',
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
    label: 'Level 2',
    short: 'Level 2',
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

/* ---- the scroll tabs: one long screenshot per grade ---- */

const LONG_BASE = '/case/greenlight-invest/screens'

type LongTab = 'detail' | 'search' | 'dash'

/* One page per grade, level 1 then level 2, in 1x points of the 390pt
   phone (the files are 780 wide at 2x, so every number here is half the
   file's pixels). h is the whole page; top and bottom are the chrome
   bands that stay pinned to the frame (status bar, nav title, Search's
   field; tab bar, Stock details' sticky Buy). Written down so nothing
   measures at runtime. dash-l2's activity list runs under its tab bar
   in Figma; the bottom band covers it, which is right. */
/* top = the pinned header's height in pt; start = where the scrolling
   middle begins in the page's own file (defaults to top). cap borrows a
   status bar from another file: `pt` points of `file` from its top, then
   this page's own file from `from` up to `start`. The dashboard exports
   draw their clock 12pt lower than the other screens (a taller nav
   component in Figma), so without this the header jumped between tabs. */
type LongPage = {
  file: string
  h: number
  top: number
  bottom: number
  alt: string
  start?: number
  cap?: { file: string; h: number; pt: number; from: number }
}
const STATUS_CAP = { file: 'search-l1', h: 2281, pt: 44, from: 48 }

const LONG: Record<LongTab, [LongPage, LongPage]> = {
  detail: [
    { file: 'detail-l1', h: 2713, top: 97, bottom: 175, alt: 'Amazon’s stock page at level 1: a price graph, a plain company overview, analyst opinions, key stats, past performance and the ETFs that include it.' },
    { file: 'detail-l2', h: 2948, top: 97, bottom: 176, alt: 'Amazon’s stock page at level 2 covers the same ground with denser stats, adding more graph ranges, extra key stats and earnings targets above the ETFs that include it.' },
  ],
  search: [
    { file: 'search-l1', h: 2281, top: 158, bottom: 95, alt: 'Discover at level 1: top-rated companies, a lesson on how to pick stocks, and categories to browse by theme.' },
    { file: 'search-l2', h: 1878, top: 158, bottom: 95, alt: 'Discover at level 2 leads with categories and ETFs, adds picks based on the kid’s spending and a lesson on researching ETFs, and shows price moves on the top-rated companies.' },
  ],
  dash: [
    { file: 'dash-l1', h: 3230, top: 97, start: 101, bottom: 110, cap: STATUS_CAP, alt: 'The kid’s Invest home at level 1: their balance and graph, one holding, level 1 lessons, picks based on their spending and recent activity.' },
    { file: 'dash-l2', h: 3700, top: 97, start: 101, bottom: 95, cap: STATUS_CAP, alt: 'The kid’s Invest home at level 2 carries more sections and denser stats: stocks and ETFs split out, each holding with its cost and shares, level 2 lessons, recommendations by risk and a longer activity list.' },
  ],
}

/* the phone screen in points */
const PT_W = 390
const PT_H = 844

const TABS: Array<[id: 'onboarding' | LongTab, label: string]> = [
  ['onboarding', 'Onboarding'],
  ['detail', 'Stock details'],
  ['search', 'Search'],
  ['dash', 'Dashboard'],
]
type Tab = (typeof TABS)[number][0]

const longSrc = (file: string) => `${LONG_BASE}/${file}.webp`

/* "3.8 screens", "1 screen": the page's length in phone screens (pt) */
function screens(h: number) {
  const n = Math.round((h / PT_H) * 10) / 10
  return n <= 1 ? '1 screen' : `${n.toFixed(1)} screens`
}

/* One long screenshot in the phone screen, behaving like the real
   app: three clipped boxes stacked in the screen, each holding the same
   img (one fetch, served from cache). The top and bottom boxes show the
   page's own chrome, pinned to the frame; only the middle box scrolls.
   Band heights are aspect ratios of the 390pt width, so they track the
   phone's rendered size and the three always sum to the 390/844 screen.

   The middle box is a plain scroll container for every pointer, as on
   OverviewPage: wheel, trackpad and touch scroll it (Jake ruled the old
   hover scrub felt buggy). Up and down arrows nudge half of it when it
   has focus, smooth unless motion is reduced. Keyed by tab, so a level
   switch keeps the component, and the scroll fraction carries over. */
function LongScreen({ page, label }: { page: LongPage; label: string }) {
  const { file, h, top, bottom, alt } = page
  const reduced = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  /* how far down the page the reader is, 0 to 1, kept current by every
     scroll so it holds the value from just before a level switch */
  const frac = useRef(0)

  /* the middle slice of the page, [top, h - bottom] */
  const slice = h - top - bottom

  /* a level switch: put the new page at the same fraction */
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.scrollTop = frac.current * Math.max(0, el.scrollHeight - el.clientHeight)
  }, [h])

  const nudge = (d: number) => {
    const el = box.current
    if (el) el.scrollBy({ top: (d * el.clientHeight) / 2, behavior: reduced ? 'auto' : 'smooth' })
  }

  /* the same img in every box; translateY is a percent of the img's own
     height, so -(pt / h) lifts it to that point on the page */
  const shot = (at: number, text: string) => (
    <img
      src={longSrc(file)}
      width={W}
      height={h * 2}
      alt={text}
      aria-hidden={text ? undefined : 'true'}
      draggable={false}
      style={{ transform: `translateY(${(-at / h) * 100}%)` }}
    />
  )

  return (
    <div className={styles.lapScreen} data-kind="long">
      <div className={styles.lapBand} style={{ aspectRatio: `${PT_W} / ${top}` }}>
        {shot(0, '')}
      </div>
      <div
        ref={box}
        className={styles.lapMid}
        role="group"
        aria-label={`${label}, ${screens(h)} long. Up and down arrows scroll it.`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') (e.preventDefault(), nudge(1))
          if (e.key === 'ArrowUp') (e.preventDefault(), nudge(-1))
        }}
        onScroll={(e) => {
          const el = e.currentTarget
          const max = el.scrollHeight - el.clientHeight
          frac.current = max > 0 ? el.scrollTop / max : 0
        }}
      >
        <div className={styles.lapSlice} style={{ aspectRatio: `${PT_W} / ${slice}` }}>
          {shot(top, alt)}
        </div>
      </div>
      <div className={styles.lapBand} style={{ aspectRatio: `${PT_W} / ${bottom}` }}>
        {shot(h - bottom, '')}
      </div>
    </div>
  )
}

export function LapFlow() {
  const [tab, setTab] = useState<Tab>('onboarding')
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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const flow = FLOWS[g]
  const n = flow.n
  const onboarding = tab === 'onboarding'
  const long = onboarding ? null : LONG[tab][g]

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

  /* onboarding only: one step per interval; any change of frame or
     grade resets it */
  useEffect(() => {
    if (!onboarding || reduced || !inView || kbFocus || taken) return
    if (i >= n - 1) return
    const t = setTimeout(() => setI((v) => Math.min(n - 1, v + 1)), TICK_MS)
    return () => clearTimeout(t)
  }, [onboarding, reduced, inView, kbFocus, taken, i, g, n])

  /* onboarding: preload the next two frames (new Image() fetches into
     the HTTP cache, decode() readies the pixels for the next paint).
     Scroll tabs: fetch the other grade's page so the chip swaps clean. */
  useEffect(() => {
    if (!warm) return
    if (onboarding) {
      for (const d of [1, 2]) {
        const im = new Image()
        if (i + d > n - 1) break
        im.src = srcOf(flow, i + d)
        im.decode?.().catch(() => {})
      }
    } else {
      new Image().src = longSrc(LONG[tab][1 - g].file)
    }
  }, [warm, onboarding, tab, flow, i, n, g])

  /* clamped, never wrapped: back on the first screen and forward on
     the last are no-ops, though either still hands over the wheel */
  const go = (to: number) => {
    setI(Math.max(0, Math.min(n - 1, to)))
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

  const pickTab = (k: number, focus = false) => {
    const next = TABS[k][0]
    if (focus) tabRefs.current[k]?.focus()
    if (next === tab) return
    sfx.tap()
    setTab(next)
  }

  return (
    <Plate
      cap="The first lap"
      readout={
        <span className={styles.plateCount}>
          {long ? `${flow.short} · ${screens(long.h)}` : `${flow.short} ${pad(i + 1)}/${pad(n)}`}
        </span>
      }
      chip={
        <span className={styles.fidChip} role="group" aria-label="Level">
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
      caption="The same app at two levels. Tap to step the onboarding, scroll the other screens."
    >
      <div
        ref={stage}
        id="lap-panel"
        className={styles.lapStage}
        role="tabpanel"
        aria-labelledby={`lap-tab-${tab}`}
        /* only keyboard focus pauses: a mouse press on a step button can
           focus it too, and that must not stop the playback */
        onFocus={(e) => setKbFocus(e.target.matches(':focus-visible'))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKbFocus(false)
        }}
        onKeyDown={(e) => {
          if (!onboarding) return
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
            {long ? (
              <LongScreen
                key={tab}
                page={long}
                label={`${TABS.find(([id]) => id === tab)?.[1]}, ${flow.label}`}
              />
            ) : (
              <Screen src={srcOf(flow, i)} alt={altOf(flow, i)} fade={!reduced}>
                <button
                  type="button"
                  className={styles.lapHit}
                  data-side="prev"
                  aria-label="Previous screen"
                  aria-disabled={i === 0 || undefined}
                  onClick={() => go(i - 1)}
                />
                <button
                  type="button"
                  className={styles.lapHit}
                  data-side="next"
                  aria-label="Next screen"
                  aria-disabled={i === n - 1 || undefined}
                  onClick={() => go(i + 1)}
                />
              </Screen>
            )}
          </div>
        </div>
      </div>
      <div
        className={`${styles.plateTabs} ${styles.lapTabs}`}
        role="tablist"
        aria-label="Screens"
        onKeyDown={(e) => {
          const k = TABS.findIndex(([id]) => id === tab)
          const to =
            e.key === 'ArrowRight' ? (k + 1) % TABS.length
            : e.key === 'ArrowLeft' ? (k - 1 + TABS.length) % TABS.length
            : e.key === 'Home' ? 0
            : e.key === 'End' ? TABS.length - 1
            : null
          if (to === null) return
          e.preventDefault()
          pickTab(to, true)
        }}
      >
        {TABS.map(([id, label], k) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[k] = el
            }}
            id={`lap-tab-${id}`}
            type="button"
            role="tab"
            className={styles.plateTab}
            aria-selected={tab === id}
            aria-controls="lap-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => pickTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
    </Plate>
  )
}
