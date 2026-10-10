'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import { Plate } from './CaseComponents'
import styles from './case.module.css'

/* "The Nike page": one phone holding Nike's whole stock page, the AI
   overview video playing in its header, and six numbered callouts
   outside the phone, each one pointing at the part of the page it talks
   about.

   The page scrolls like LapFlow's scroll tabs: fine pointers scrub it
   with cursor y over the screen (transform only), touch gets the native
   scroll box, up and down arrows nudge it. Two things differ. Only the
   floating nav buttons (nav.png, transparent) and the bottom band
   (Analyze, Buy, the tab bar) stay pinned; the status bar scrolls with
   the page, as it does in the app. And nothing eases back on its own
   when the pointer leaves: the callouts need the page to stay put.

   Wide, the callouts sit in two columns either side of the phone and an
   SVG over the stage draws a leader from each number to its target. The
   target's place on the screen is its page y minus the scroll, so every
   leader end is a useTransform of the one motion value (s, points
   scrolled) that the scrub writes and the native scroll writes too. A
   target outside the visible middle (under the nav or the bottom band)
   dims its callout and drops its leader. Clicking a callout springs the
   page so the target sits mid-window and switches the hover scrub off
   until the pointer leaves the stage and comes back.

   Narrow, the phone stacks over a plain numbered list, and small
   numbered dots ride on the page at each target instead of leaders.

   The video follows DemoReel: muted, looping, preload none, and an
   IntersectionObserver plays it while the phone is on screen. Reduced
   motion gets the poster and never autoplays; a tap on the video, or
   SOUND, still plays it. SOUND restarts it from 0 so the narration
   starts at the top. */

const BASE = '/case/greenlight-invest/nike'

/* The page in 1x points of the 390pt phone. page.webp is 796 x 8495:
   the 780px page at 2x plus an 8px drop shadow either side, so the img
   is drawn 796/780 of the screen wide and pulled left 8/780. */
const PT_W = 390
const PT_H = 844
const PAGE_H = 4247
const IMG_W = 796
const IMG_H = 8495
const IMG_PT = IMG_H / 2 /* the img's own height in points */
const W2 = PT_W * 2 /* the overlays are 780 wide: 390pt at 2x, no shadow */

const NAV = 100 /* the pinned nav buttons cover screen y 0..100 */
const BOTTOM = 159 /* the pinned bottom band, page y 4088..4247 */
const SLICE = PAGE_H - BOTTOM /* the scrolling part of the page, 0..4088 */
const VIEW = PT_H - BOTTOM /* the scroll window on screen, 0..685 */
const MAX = SLICE - VIEW /* the furthest the page scrolls, in points */
const MID = (NAV + VIEW) / 2 /* where a clicked target lands */
const HERO = 500 /* the video covers page y 0..500 */
/* the overview card's top edge. In Figma the card sits over the hero;
   here the hero's video and controls sit over the export, so both stop
   at this line or they smear grey across the card's top */
const CARD = 464

/* "5.0 screens": the page's length in phone screens */
const SCREENS = `${(Math.round((PAGE_H / PT_H) * 10) / 10).toFixed(1)} screens`

type Callout = {
  n: number
  label: string
  line: string
  /* target points on the page; the leader goes to the first one on
     screen, so bulls carries it and bears takes it when bulls is gone */
  at: Array<[x: number, y: number]>
}

const CALLOUTS: Callout[] = [
  { n: 1, label: 'Overview video', line: 'A minute on what Nike makes and how it earns, built from the filings.', at: [[195, 250]] },
  { n: 2, label: 'How they make money', line: 'Plain words under the company name, before any number.', at: [[195, 1099]] },
  { n: 3, label: 'Revenue, explained', line: 'The chart says four bars. The line under it says 37% in four years.', at: [[195, 1743]] },
  { n: 4, label: 'Better than expected', line: 'Earnings per share, with the so what attached.', at: [[165, 2069]] },
  { n: 5, label: 'Bulls and bears', line: 'Both sides of the argument, one sentence each.', at: [[169, 2675], [169, 3034]] },
  { n: 6, label: 'Is it a fair price', line: 'Undervalued by $39.42, and by how much in percent.', at: [[193, 3572]] },
]

const clamp = (v: number) => Math.min(MAX, Math.max(0, v))
/* on screen and clear of the pinned chrome, for a page y at scroll v */
const seen = (y: number, v: number) => y - v >= NAV && y - v <= VIEW
const lit = (c: Callout, v: number) => c.at.some(([, y]) => seen(y, v))

/* where things sit in the stage, in px: the scroll box's top left, px
   per point, and each callout's number circle */
type Geo = { ox: number; oy: number; k: number; a: Array<[number, number]> }

function Leader({ c, i, s, geo }: { c: Callout; i: number; s: MotionValue<number>; geo: Geo }) {
  const pick = (v: number) => c.at.find(([, y]) => seen(y, v)) ?? c.at[0]
  const x2 = useTransform(s, (v) => geo.ox + pick(v)[0] * geo.k)
  const y2 = useTransform(s, (v) => geo.oy + (pick(v)[1] - v) * geo.k)
  const opacity = useTransform(s, (v) => (lit(c, v) ? 1 : 0))
  const [x1, y1] = geo.a[i] ?? [0, 0]
  return (
    <motion.g style={{ opacity }}>
      <motion.line x1={x1} y1={y1} x2={x2} y2={y2} />
    </motion.g>
  )
}

function Mark({ x, y, s, geo }: { x: number; y: number; s: MotionValue<number>; geo: Geo }) {
  const cy = useTransform(s, (v) => geo.oy + (y - v) * geo.k)
  const opacity = useTransform(s, (v) => (seen(y, v) ? 1 : 0))
  return <motion.circle cx={geo.ox + x * geo.k} cy={cy} r={2} style={{ opacity }} />
}

function CalloutButton({
  c,
  s,
  onGo,
  setRef,
}: {
  c: Callout
  s: MotionValue<number>
  onGo: () => void
  setRef: (el: HTMLButtonElement | null) => void
}) {
  const opacity = useTransform(s, (v) => (lit(c, v) ? 1 : 0.45))
  return (
    <motion.button
      ref={setRef}
      type="button"
      className={styles.ovpCallout}
      data-side={c.n % 2 ? 'left' : 'right'}
      data-row={Math.ceil(c.n / 2)}
      style={{ opacity }}
      onClick={onGo}
    >
      <span className={styles.ovpNum}>{c.n}</span>
      <span className={styles.ovpLabel}>{c.label}</span>
      <span className={styles.ovpText}>{c.line}</span>
    </motion.button>
  )
}

export function OverviewPage() {
  const reduced = useReducedMotion()
  const [fine, setFine] = useState(false)
  const [sound, setSound] = useState(false)
  const [geo, setGeo] = useState<Geo | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const vid = useRef<HTMLVideoElement>(null)
  const calls = useRef<Array<HTMLButtonElement | null>>([])
  const run = useRef<AnimationPlaybackControls | null>(null)
  /* set by a callout; the hover scrub waits for the pointer to come back */
  const taken = useRef(false)
  /* the reader asked for playback (a tap, or SOUND), so it plays even
     under reduced motion, and resumes when the phone comes back */
  const wanted = useRef(false)

  /* s: points scrolled, 0 to MAX. The scrub writes it on fine pointers,
     the native scroll writes it on touch; the slice and every leader
     read it. */
  const s = useMotionValue(0)
  const y = useTransform(s, (v) => `${(-clamp(v) / SLICE) * 100}%`)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* pointer type can flip (a tablet with a trackpad): back to the top */
  useEffect(() => {
    run.current?.stop()
    s.set(0)
    if (box.current) box.current.scrollTop = 0
  }, [fine, s])

  /* measured, never assumed: the stage reflows with the article, and
     rects are divided by the stage's own scale so a window mid-zoom
     still measures in the stage's px */
  useLayoutEffect(() => {
    const st = stage.current
    const bx = box.current
    if (!st || !bx) return
    const measure = () => {
      const sr = st.getBoundingClientRect()
      const sc = sr.width / (st.offsetWidth || 1) || 1
      const br = bx.getBoundingClientRect()
      const a = calls.current.map((el): [number, number] => {
        const num = el?.firstElementChild
        if (!num) return [0, 0]
        const r = num.getBoundingClientRect()
        return [(r.left + r.width / 2 - sr.left) / sc, (r.top + r.height / 2 - sr.top) / sc]
      })
      setGeo({ ox: (br.left - sr.left) / sc, oy: (br.top - sr.top) / sc, k: br.width / sc / PT_W, a })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(st)
    ro.observe(bx)
    for (const el of calls.current) if (el) ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* DemoReel's observer, on the phone rather than the video: scrolling
     the page inside the phone must not pause the narration */
  useEffect(() => {
    const el = vid.current
    const ph = screen.current
    if (!el || !ph) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!reduced || wanted.current) el.play().catch(() => {})
        } else el.pause()
      },
      { threshold: 0.35 },
    )
    io.observe(ph)
    return () => io.disconnect()
  }, [reduced])

  const jump = (v: number) => {
    run.current?.stop()
    s.set(clamp(v))
  }

  /* fine: spring s itself. Touch: spring the native scrollTop, and the
     scroll event carries it into s. Reduced motion jumps either way. */
  const glide = (v: number) => {
    const to = clamp(v)
    run.current?.stop()
    if (fine) {
      if (reduced) return jump(to)
      run.current = animate(s, to, SPRINGS.window)
      return
    }
    const el = box.current
    if (!el) return
    const px = (to * el.clientWidth) / PT_W
    if (reduced) {
      el.scrollTop = px
      return
    }
    run.current = animate(el.scrollTop, px, {
      ...SPRINGS.window,
      onUpdate: (p) => {
        el.scrollTop = p
      },
    })
  }

  const go = (c: Callout) => {
    sfx.tap()
    taken.current = true
    glide(c.at[0][1] - MID)
  }

  /* half the visible middle per press */
  const nudge = (d: number) => glide(s.get() + (d * (VIEW - NAV)) / 2)

  const pickSound = (on: boolean) => {
    if (on === sound) return
    sfx.tap()
    setSound(on)
    const el = vid.current
    if (!el) return
    el.muted = !on
    if (on) {
      wanted.current = true
      el.currentTime = 0
      el.play().catch(() => {})
    }
  }

  return (
    <Plate
      cap="The Nike page"
      readout={<span className={styles.plateCount}>{`NKE · ${SCREENS}`}</span>}
      tag="NKE"
      chip={
        <span className={styles.fidChip} role="group" aria-label="Video sound">
          {(['Muted', 'Sound'] as const).map((label, k) => (
            <button
              key={label}
              type="button"
              className={styles.fidChipSeg}
              aria-pressed={sound === (k === 1)}
              onClick={() => pickSound(k === 1)}
            >
              {label}
            </button>
          ))}
        </span>
      }
      caption="The overview plays in the header, and every number gets a line a kid can repeat. Tap a callout to go there."
    >
      <div
        ref={stage}
        className={styles.ovpStage}
        onMouseEnter={() => {
          taken.current = false
        }}
      >
        <div className={styles.ovpCell}>
          <div className={`${styles.phoneShell} ${styles.ovpShell}`}>
            <div
              ref={screen}
              className={styles.ovpScreen}
              role="group"
              aria-label={`The Nike page, ${SCREENS} long. Up and down arrows scroll it.`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') (e.preventDefault(), nudge(1))
                if (e.key === 'ArrowUp') (e.preventDefault(), nudge(-1))
              }}
            >
              <div
                ref={box}
                className={styles.ovpMid}
                data-scroll={fine ? 'hover' : 'native'}
                onMouseMove={
                  fine
                    ? (e) => {
                        if (taken.current) return
                        const r = e.currentTarget.getBoundingClientRect()
                        jump(((e.clientY - r.top) / r.height) * MAX)
                      }
                    : undefined
                }
                onScroll={(e) => {
                  if (fine) return
                  const el = e.currentTarget
                  s.set((el.scrollTop * PT_W) / (el.clientWidth || 1))
                }}
                onTouchStart={() => run.current?.stop()}
                onWheel={() => !fine && run.current?.stop()}
              >
                <motion.div
                  className={styles.ovpSlice}
                  style={{ aspectRatio: `${PT_W} / ${SLICE}`, y: fine ? y : 0 }}
                >
                  <img
                    className={styles.ovpPage}
                    src={`${BASE}/page.webp`}
                    width={IMG_W}
                    height={IMG_H}
                    alt="Nike's stock page in the Greenlight app: the overview video on top, then what Nike does, how it makes money, growth and profit, earnings, what bulls and bears say, and whether the price is fair, each with a one-line AI insight."
                    draggable={false}
                  />
                  <video
                    ref={vid}
                    className={styles.ovpVideo}
                    style={{ height: `${(HERO / SLICE) * 100}%` }}
                    poster={`${BASE}/poster.webp`}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-label="Nike overview video: what Nike makes and how it earns money, about a minute long, with narration."
                    onClick={() => {
                      const el = vid.current
                      if (!el?.paused) return
                      wanted.current = true
                      el.play().catch(() => {})
                    }}
                  >
                    <source src={`${BASE}/overview.mp4`} type="video/mp4" />
                    <source src={`${BASE}/overview.webm`} type="video/webm" />
                  </video>
                  {/* the header's own chrome, riding over the video and
                      scrolling with the page: scrim, then the progress
                      bars, then the status bar */}
                  {([
                    ['skrim-top', 0, 228],
                    ['controls', 352, 356],
                    ['status', 0, 106],
                  ] as const).map(([file, top, h]) => {
                    /* points of this overlay that run past the card's top */
                    const over = Math.max(0, top + h / 2 - CARD)
                    return (
                      <img
                        key={file}
                        className={styles.ovpOver}
                        src={`${BASE}/${file}.png`}
                        width={W2}
                        height={h}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        style={{
                          top: `${(top / SLICE) * 100}%`,
                          clipPath: over ? `inset(0 0 ${(over / (h / 2)) * 100}% 0)` : undefined,
                        }}
                      />
                    )
                  })}
                  {CALLOUTS.flatMap((c) =>
                    c.at.map(([x, ty], j) => (
                      <span
                        key={`${c.n}-${j}`}
                        className={styles.ovpDot}
                        aria-hidden="true"
                        style={{ left: `${(x / PT_W) * 100}%`, top: `${(ty / SLICE) * 100}%` }}
                      >
                        {c.n}
                      </span>
                    )),
                  )}
                </motion.div>
              </div>
              <div className={styles.ovpBand} style={{ aspectRatio: `${PT_W} / ${BOTTOM}` }}>
                <img
                  className={styles.ovpPage}
                  src={`${BASE}/page.webp`}
                  width={IMG_W}
                  height={IMG_H}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  style={{ transform: `translateY(${(-SLICE / IMG_PT) * 100}%)` }}
                />
              </div>
              {/* back, assistant and bookmark: pinned to the glass */}
              <img
                className={styles.ovpNav}
                src={`${BASE}/nav.png`}
                width={W2}
                height={200}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
            </div>
          </div>
        </div>
        {CALLOUTS.map((c, i) => (
          <CalloutButton
            key={c.n}
            c={c}
            s={s}
            onGo={() => go(c)}
            setRef={(el) => {
              calls.current[i] = el
            }}
          />
        ))}
        {geo && (
          <svg className={styles.ovpLines} aria-hidden="true">
            {CALLOUTS.map((c, i) => (
              <Leader key={c.n} c={c} i={i} s={s} geo={geo} />
            ))}
            {CALLOUTS.flatMap((c) =>
              c.at.map(([x, ty], j) => <Mark key={`${c.n}-${j}`} x={x} y={ty} s={s} geo={geo} />),
            )}
          </svg>
        )}
      </div>
    </Plate>
  )
}
