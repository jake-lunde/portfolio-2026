'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import { Plate } from './CaseComponents'
import styles from './case.module.css'

/* "The Nike page": one phone holding Nike's whole stock page, the AI
   overview video playing in its header, and six numbered callouts
   outside the phone, each one naming a part of the page.

   The middle of the screen is a plain scroll box for every pointer:
   wheel, trackpad and touch scroll it, and up and down arrows nudge it
   when it has focus. Only the floating nav buttons (nav.png,
   transparent) and the bottom band (Analyze, Buy, the tab bar) stay
   pinned; the status bar scrolls with the page, as it does in the app.

   Each target carries a numbered pink dot inside the page, just left of
   its tile, so the dot scrolls with the content. Wide, the callouts sit
   in two columns either side of the phone; narrow, the phone stacks
   over a numbered list. The box's scroll event tells which targets sit
   in the visible middle (clear of the nav and the bottom band); a
   callout whose target is off it dims. Clicking a callout scrolls the
   box so its target sits mid-window, and that callout's dot goes to
   full strength.

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
const MID = (NAV + VIEW) / 2 /* where a clicked target lands */
const HERO = 500 /* the video covers page y 0..500 */
/* the overview card's top edge. In Figma the card sits over the hero;
   here the hero's video and controls sit over the export, so both stop
   at this line or they smear grey across the card's top */
const CARD = 464
const DOT_X = 24 /* the dots' centre: just left of the tiles, and over the hero's left edge */

/* "5.0 screens": the page's length in phone screens */
const SCREENS = `${(Math.round((PAGE_H / PT_H) * 10) / 10).toFixed(1)} screens`

type Callout = {
  n: number
  label: string
  line: string
  /* page y of each target; a click goes to the first, and the callout
     stays lit while any of them is in view (bulls, then bears) */
  at: number[]
}

const CALLOUTS: Callout[] = [
  { n: 1, label: 'Overview video', line: 'A minute on what Nike makes and how it earns, built from the filings.', at: [250] },
  { n: 2, label: 'How they make money', line: 'Plain words under the company name, before any number.', at: [1099] },
  { n: 3, label: 'Revenue, explained', line: 'The chart says four bars. The line under it says 37% in four years.', at: [1743] },
  { n: 4, label: 'Better than expected', line: 'Earnings per share, with the so what attached.', at: [2069] },
  { n: 5, label: 'Bulls and bears', line: 'Both sides of the argument, one sentence each.', at: [2675, 3034] },
  { n: 6, label: 'Is it a fair price', line: 'Undervalued by $39.42, and by how much in percent.', at: [3572] },
]

/* one bit per callout: is any of its targets in the visible middle at
   scroll v (points)? Kept as a number so a scroll only re-renders when
   a callout actually changes state. */
const litMask = (v: number) =>
  CALLOUTS.reduce((m, c, i) => (c.at.some((y) => y - v >= NAV && y - v <= VIEW) ? m | (1 << i) : m), 0)

export function OverviewPage() {
  const reduced = useReducedMotion()
  const [sound, setSound] = useState(false)
  const [lit, setLit] = useState(() => litMask(0))
  const [active, setActive] = useState<number | null>(null)
  const screen = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const vid = useRef<HTMLVideoElement>(null)
  /* the reader asked for playback (a tap, or SOUND), so it plays even
     under reduced motion, and resumes when the phone comes back */
  const wanted = useRef(false)

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

  const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth'
  /* px per point: the box is the screen's full 390pt width */
  const ppt = (el: HTMLElement) => el.clientWidth / PT_W

  const go = (c: Callout) => {
    sfx.tap()
    setActive(c.n)
    const el = box.current
    if (el) el.scrollTo({ top: (c.at[0] - MID) * ppt(el), behavior })
  }

  /* half the visible middle per press */
  const nudge = (d: number) => {
    const el = box.current
    if (el) el.scrollBy({ top: (d * (VIEW - NAV) * ppt(el)) / 2, behavior })
  }

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
      <div className={styles.ovpStage}>
        <div className={styles.ovpCell}>
          <div className={`${styles.phoneShell} ${styles.ovpShell}`}>
            <div ref={screen} className={styles.ovpScreen}>
              <div
                ref={box}
                className={styles.ovpMid}
                role="group"
                aria-label={`The Nike page, ${SCREENS} long. Up and down arrows scroll it.`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') (e.preventDefault(), nudge(1))
                  if (e.key === 'ArrowUp') (e.preventDefault(), nudge(-1))
                }}
                onScroll={(e) => {
                  const el = e.currentTarget
                  const m = litMask(el.scrollTop / (ppt(el) || 1))
                  if (m !== lit) setLit(m)
                }}
              >
                <div className={styles.ovpSlice} style={{ aspectRatio: `${PT_W} / ${SLICE}` }}>
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
                    c.at.map((y, j) => (
                      <span
                        key={`${c.n}-${j}`}
                        className={styles.ovpDot}
                        data-on={active === c.n || undefined}
                        aria-hidden="true"
                        style={{ left: `${(DOT_X / PT_W) * 100}%`, top: `${(y / SLICE) * 100}%` }}
                      >
                        {c.n}
                      </span>
                    )),
                  )}
                </div>
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
          <button
            key={c.n}
            type="button"
            className={styles.ovpCallout}
            data-side={c.n % 2 ? 'left' : 'right'}
            data-row={Math.ceil(c.n / 2)}
            data-lit={(lit >> i) & 1 ? 'true' : 'false'}
            onClick={() => go(c)}
          >
            <span className={styles.ovpNum}>{c.n}</span>
            <span className={styles.ovpLabel}>{c.label}</span>
            <span className={styles.ovpText}>{c.line}</span>
          </button>
        ))}
      </div>
    </Plate>
  )
}
