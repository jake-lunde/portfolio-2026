'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { Plate } from './CaseComponents'
import { SheetShell } from './GlSheet'
import { DURATIONS, SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import caseStyles from './case.module.css'
import moatStyles from './moat.module.css'
import styles from './graph.module.css'
import { MOAT_COMPANIES } from './moatData'
import {
  AS_OF,
  DAILY_DATES,
  INTRADAY_MINUTES,
  PRICES,
  WEEKLY_DATES,
  type Ticker,
} from './graphData'

/* The performance graph: a rebuild of Greenlight's "Performance" card
   (Figma 201640:59035) and its fly-up (201641:59306), drawn from real
   closes (graphData.ts, as of Oct 9, 2026; SPY stands in for the S&P
   500). Same plate grammar as the bullseye: the card wears Greenlight's
   palette (graph.module.css), the company tabs under it stay on the
   site's tokens. Press and drag across the chart to scrub; every
   interval boundary ticks (sound, plus a vibration where the platform
   has one), the web telling of the shipped SwiftUI haptics. Tap a tile
   (the ticker's or the S&P 500's) to solo its series: that tile lifts,
   the other tile and the other line (and its scrub dot) fall back; tap
   it again and both come back. A company switch drops the solo.

   Graph logic, from Jake's Figma notes: both series start at 0% on the
   first point of the selected range and track percent change from
   there; the y-axis covers both series' highs and lows with a little
   headroom, labelled at the top, 0% and the bottom in clean numbers. */

const GRAPH_ASSET = '/case/greenlight-invest/graph/'
const MOAT_ASSET = '/case/greenlight-invest/moat/'
/* constant ids: case islands can't use useId (hydration, see memory) */
const STAGE_ID = 'graph-stage'
const INFO_TITLE_ID = 'graph-info-title'
const GRADIENT_ID = 'graph-area-fill'
const tabId = (t: string) => `graph-tab-${t}`

const COMPANIES = ['NVDA', 'AAPL', 'NKE', 'DIS'] as const
type Company = (typeof COMPANIES)[number]
const NAMES: Record<Company, string> = Object.fromEntries(
  COMPANIES.map((t) => [t, MOAT_COMPANIES.find((c) => c.ticker === t)?.name ?? t]),
) as Record<Company, string>

const RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const
type Range = (typeof RANGES)[number]
const RANGE_WORDS: Record<Range, string> = {
  '1D': 'day',
  '1W': 'week',
  '1M': 'month',
  '3M': '3 months',
  '1Y': 'year',
  '5Y': '5 years',
}

/* chart geometry, graph coordinates (card y 302): the lines run x 15–306,
   the labelled lines sit at y 0 (top) and 173 (bottom), the area fill
   reaches 181.8, the scrub line stops at 174 (spec §2, §4) */
const X0 = 15
const X1 = 306
const Y_TOP = 0
const Y_BOT = 173
const FILL_BOT = 181.8
const SCRUB_BOT = 174
const ZERO_CLEAR = 14 // the 0% text hides when closer than this to the top or bottom label

const DRAW = parseFloat(DURATIONS.slow) // 0.7s line draw
const FADE = parseFloat(DURATIONS.theme)

/* ---------- data ---------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ymd = (iso: string) => iso.split('-').map(Number) as [number, number, number]
const fmtDate = (iso: string) => {
  const [y, m, d] = ymd(iso)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}
const fmtTime = (min: number) => {
  const h = Math.floor(min / 60)
  const mm = String(min % 60).padStart(2, '0')
  return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? 'AM' : 'PM'}`
}
/* the as-of date shifted back by whole days or months, ISO */
const shift = (iso: string, { days = 0, months = 0 }) => {
  const [y, m, d] = ymd(iso)
  const t = new Date(Date.UTC(y, m - 1 - months, d - days))
  return t.toISOString().slice(0, 10)
}
const dayNo = (iso: string) => {
  const [y, m, d] = ymd(iso)
  return Date.UTC(y, m - 1, d) / 864e5
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const num2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (v: number) => `${num2.format(Math.abs(v))}%`

type Slice = { labels: string[]; buckets: (string | number)[]; stock: readonly number[]; spy: readonly number[] }

/* each range's points, and the interval each point falls in (a scrub
   ticks when it crosses into a new one): 1D hours, 1W days, 1M weeks,
   3M fortnights, 1Y months, 5Y quarters */
function sliceRange(range: Range, t: Company): Slice {
  const s = PRICES[t]
  const p = PRICES.SPY
  if (range === '1D') {
    return {
      labels: INTRADAY_MINUTES.map(fmtTime),
      buckets: INTRADAY_MINUTES.map((m) => Math.floor(m / 60)),
      stock: s.intraday,
      spy: p.intraday,
    }
  }
  if (range === '5Y') {
    return {
      labels: WEEKLY_DATES.map(fmtDate),
      buckets: WEEKLY_DATES.map((d) => `${d.slice(0, 4)}-${Math.floor((ymd(d)[1] - 1) / 3)}`),
      stock: s.weekly,
      spy: p.weekly,
    }
  }
  const from =
    range === '1W' ? shift(AS_OF, { days: 7 })
    : range === '1M' ? shift(AS_OF, { months: 1 })
    : range === '3M' ? shift(AS_OF, { months: 3 })
    : shift(AS_OF, { months: 12 })
  const i0 = Math.max(0, DAILY_DATES.findIndex((d) => d >= from))
  const dates = DAILY_DATES.slice(i0)
  const week = (d: string) => Math.floor((dayNo(d) + 3) / 7) // Monday-start weeks
  return {
    labels: dates.map(fmtDate),
    buckets: dates.map((d) =>
      range === '1W' ? d : range === '1M' ? week(d) : range === '3M' ? Math.floor(week(d) / 2) : d.slice(0, 7),
    ),
    stock: s.daily.slice(i0),
    spy: p.daily.slice(i0),
  }
}

/* round a positive bound up to a clean percent: two significant steps
   (1,008 → 1,100; 37 → 40; 4.3 → 4.5; 0.63 → 0.65) */
function niceUp(v: number) {
  const k = Math.floor(Math.log10(v))
  const lead = v / 10 ** k
  const unit = 10 ** (k - 1) * (lead < 2 ? 1 : 5)
  return Number((Math.ceil(v / unit - 1e-9) * unit).toPrecision(12))
}

/* y-axis: the top label is the real high of either series rounded up to
   a clean step, the bottom the real low rounded down (0 when nothing
   fell), linear between; 0% lands wherever that puts it */
function axis(min: number, max: number) {
  let top = max > 0 ? niceUp(max) : 0
  let bot = min < 0 ? -niceUp(-min) : 0
  if (top === bot) {
    top += 1
    bot -= 1
  }
  return { top, bot }
}

const fmtAxis = (v: number) => {
  const s = Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2 })
  return v > 0 ? `+${s}%` : v < 0 ? `–${s}%` : '0%'
}

/* soft corners: a monotone cubic through every point (never overshoots a
   real high or low, so a scrub dot at a point sits exactly on the line) */
function smoothPath(xs: number[], ys: number[]) {
  const n = xs.length
  if (n < 2) return `M${xs[0]},${ys[0]}`
  const dx: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i])
    m.push((ys[i + 1] - ys[i]) / dx[i])
  }
  const tan: number[] = [m[0]]
  for (let i = 1; i < n - 1; i++) {
    const a = m[i - 1]
    const b = m[i]
    tan.push(a * b <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / a + (dx[i] + 2 * dx[i - 1]) / b))
  }
  tan.push(m[n - 2])
  const f = (v: number) => Math.round(v * 100) / 100
  let d = `M${f(xs[0])},${f(ys[0])}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += `C${f(xs[i] + h)},${f(ys[i] + tan[i] * h)},${f(xs[i + 1] - h)},${f(ys[i + 1] - tan[i + 1] * h)},${f(xs[i + 1])},${f(ys[i + 1])}`
  }
  return d
}

function useView(ticker: Company, range: Range) {
  return useMemo(() => {
    const s = sliceRange(range, ticker)
    const n = s.stock.length
    const pct = (a: readonly number[]) => a.map((v) => (v / a[0] - 1) * 100)
    const stockPct = pct(s.stock)
    const spyPct = pct(s.spy)
    const all = [...stockPct, ...spyPct]
    const { top, bot } = axis(Math.min(...all), Math.max(...all))
    const y = (v: number) => Y_TOP + ((top - v) / (top - bot)) * (Y_BOT - Y_TOP)
    const xs = stockPct.map((_, i) => X0 + (i / (n - 1)) * (X1 - X0))
    const stockY = stockPct.map(y)
    const spyY = spyPct.map(y)
    const line = smoothPath(xs, stockY)
    const zeroY = y(0)
    return {
      ...s,
      n,
      zeroY,
      /* the 0% line always draws (inside the plot); its text only when it
         clears the top and bottom labels */
      zeroIn: zeroY >= Y_TOP && zeroY <= Y_BOT,
      zeroLabel: zeroY - Y_TOP >= ZERO_CLEAR && Y_BOT - zeroY >= ZERO_CLEAR,
      stockPct,
      spyPct,
      top,
      bot,
      xs,
      stockY,
      spyY,
      line,
      area: `${line}L${X1},${FILL_BOT}L${X0},${FILL_BOT}Z`,
      spyLine: smoothPath(xs, spyY),
    }
  }, [ticker, range])
}

/* ---------- plate ---------- */

export function GraphPlate() {
  const [ticker, setTicker] = useState<Company>('NVDA')
  const [range, setRange] = useState<Range>('5Y')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  /* a company switch keeps the range */
  const pickCompany = (k: number, focus = false) => {
    if (focus) tabRefs.current[k]?.focus()
    if (COMPANIES[k] === ticker) return
    sfx.tap()
    setTicker(COMPANIES[k])
  }

  return (
    <Plate
      cap="Performance graph"
      tag="haptic scrub"
    >
      <GraphCard ticker={ticker} range={range} setRange={setRange} />
      <div
        className={`${caseStyles.plateTabs} ${caseStyles.lapTabs}`}
        role="tablist"
        aria-label="Company"
        onKeyDown={(e) => {
          const k = COMPANIES.indexOf(ticker)
          const n = COMPANIES.length
          const to =
            e.key === 'ArrowRight' ? (k + 1) % n
            : e.key === 'ArrowLeft' ? (k - 1 + n) % n
            : e.key === 'Home' ? 0
            : e.key === 'End' ? n - 1
            : null
          if (to === null) return
          e.preventDefault()
          pickCompany(to, true)
        }}
      >
        {COMPANIES.map((t, k) => (
          <button
            key={t}
            ref={(el) => {
              tabRefs.current[k] = el
            }}
            id={tabId(t)}
            type="button"
            role="tab"
            className={caseStyles.plateTab}
            aria-selected={t === ticker}
            aria-controls={STAGE_ID}
            aria-label={NAMES[t] === t ? undefined : `${t}, ${NAMES[t]}`}
            tabIndex={t === ticker ? 0 : -1}
            onClick={() => pickCompany(k)}
          >
            {t}
          </button>
        ))}
      </div>
    </Plate>
  )
}

/* crossfade keys never repeat: switching back to a view whose old value
   is still fading out mounts a fresh element instead of reviving the
   exiting one (which can stall at opacity 0) */
function useFreshKey(base: string) {
  const gen = useRef({ base, n: 0 })
  if (gen.current.base !== base) gen.current = { base, n: gen.current.n + 1 }
  return `${base}-${gen.current.n}`
}

/* a value that crossfades on a company or range switch (k changes) and
   updates in place while scrubbing. Old and new share one grid cell, so
   the swap never pops layout. */
function Fade({
  k,
  swap,
  className,
  stackClass,
  children,
}: {
  k: string
  swap: object
  className?: string
  stackClass?: string
  children: React.ReactNode
}) {
  return (
    <span className={stackClass ? `${styles.stack} ${stackClass}` : styles.stack}>
      <AnimatePresence initial={false}>
        <motion.span
          key={k}
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={swap}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

type Series = 'stock' | 'spy'

/* chartLabel: dot, name, the price at the scrub, change since the range
   start. It is also the series' solo switch: a button, pressed while its
   series is the one on show; data-solo marks both tiles once either is
   pressed ("on" lifts, "off" falls back), and is absent with no solo. */
function Tile({
  series,
  solo,
  onToggle,
  label,
  dot,
  price,
  pct,
  k,
  swap,
}: {
  series: Series
  solo: Series | null
  onToggle: (s: Series) => void
  label: string
  dot: string
  price: number
  pct: number
  k: string
  swap: object
}) {
  const up = pct >= 0
  return (
    <button
      type="button"
      className={styles.tile}
      aria-pressed={solo === series}
      data-solo={solo === null ? undefined : solo === series ? 'on' : 'off'}
      onClick={() => onToggle(series)}
    >
      <span className={styles.tileLeft}>
        <span className={`${styles.dot} ${dot}`} aria-hidden="true" />
        <span className={styles.ticker}>{label}</span>
        <Fade k={k} swap={swap} className={styles.scrubbed}>
          {money.format(price)}
        </Fade>
      </span>
      <Fade k={k} swap={swap} className={`${styles.perf} ${up ? styles.up : styles.down}`}>
        <img
          src={`${GRAPH_ASSET}${up ? 'icon-arrow-up.svg' : 'icon-arrow-down-red.svg'}`}
          alt={up ? 'Up' : 'Down'}
          width={16}
          height={16}
        />
        {fmtPct(pct)}
      </Fade>
    </button>
  )
}

/* ---------- card ---------- */

function GraphCard({
  ticker,
  range,
  setRange,
}: {
  ticker: Company
  range: Range
  setRange: (r: Range) => void
}) {
  const reduced = useReducedMotion()
  const frameRef = useRef<HTMLDivElement>(null)
  /* first time ~40% of the card shows; never replays on scroll */
  const inView = useInView(frameRef, { once: true, amount: 0.4 })
  const play = !!reduced || inView
  /* reduced motion: after the first paint a switched-in chart mounts at
     rest (the first paint keeps the undrawn state so server and client
     agree; the CSS reduced-motion block holds it drawn meanwhile) */
  const hydrated = useRef(false)
  useEffect(() => {
    hydrated.current = true
  }, [])

  const v = useView(ticker, range)
  const [cursor, setCursor] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  /* the soloed series (named so it never reads as DOM focus): null is
     both lines at full */
  const [solo, setSolo] = useState<Series | null>(null)
  const restore = useRef(false)
  const infoRef = useRef<HTMLButtonElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)
  const pressed = useRef(false)
  const lastBucket = useRef<string | number | null>(null)
  const rangeRefs = useRef<(HTMLButtonElement | null)[]>([])

  /* a switch drops any scrub */
  const viewKey = `${ticker}-${range}`
  const fadeKey = useFreshKey(viewKey)
  const priceKey = useFreshKey(`${ticker}-${range === '1D' ? 'day' : 'close'}`)
  useEffect(() => {
    setCursor(null)
    lastBucket.current = null
  }, [viewKey])

  /* a company switch drops the solo too (a range switch keeps it: same
     two series, another span) */
  useEffect(() => {
    setSolo(null)
  }, [ticker])

  /* a tile press solos its series; pressing the soloed one clears it */
  const toggleSolo = (s: Series) => {
    sfx.tap()
    setSolo((cur) => (cur === s ? null : s))
  }
  const dimStock = solo === 'spy' || undefined
  const dimSpy = solo === 'stock' || undefined

  /* focus goes back to the "i" when the sheet closes */
  useEffect(() => {
    if (open || !restore.current) return
    restore.current = false
    infoRef.current?.focus({ preventScroll: true })
  }, [open])

  /* move the scrub to point i; crossing into a new interval ticks */
  const scrubTo = (i: number) => {
    const k = Math.max(0, Math.min(v.n - 1, i))
    const b = v.buckets[k]
    if (b !== lastBucket.current) {
      lastBucket.current = b
      sfx.tap()
      try {
        /* Chrome refuses (and logs) a vibrate before the first real tap */
        if (navigator.userActivation?.hasBeenActive ?? true) navigator.vibrate?.(8)
      } catch {}
    }
    setCursor(k)
  }

  const scrubAtX = (clientX: number) => {
    const r = plotRef.current?.getBoundingClientRect()
    if (!r || r.width === 0) return
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    scrubTo(Math.round(f * (v.n - 1)))
  }

  const release = () => {
    pressed.current = false
    lastBucket.current = null
    setCursor(null)
  }

  const pickRange = (k: number, focus = false) => {
    if (focus) rangeRefs.current[k]?.focus()
    if (RANGES[k] === range) return
    sfx.tap()
    setRange(RANGES[k])
  }

  const at = cursor ?? v.n - 1
  const stockPrice = v.stock[at]
  const spyPrice = v.spy[at]
  const stockPct = v.stockPct[at]
  const spyPct = v.spyPct[at]
  const date = cursor === null ? fmtDate(AS_OF) : v.labels[cursor]
  const sharePrice = v.stock[v.n - 1]
  const diff = v.stockPct[v.n - 1] - v.spyPct[v.n - 1]
  const better = diff >= 0
  const valueText = `${date}, ${money.format(stockPrice)}, ${stockPct >= 0 ? 'up' : 'down'} ${fmtPct(stockPct)}; S&P 500 ${money.format(spyPrice)}, ${spyPct >= 0 ? 'up' : 'down'} ${fmtPct(spyPct)}`

  const swap = reduced ? { duration: 0 } : SPRINGS.widget
  const still = reduced && hydrated.current
  const draw = reduced ? { duration: 0 } : { duration: DRAW, ease: 'easeOut' as const }
  const fillIn = reduced ? { duration: 0 } : { duration: FADE, delay: DRAW * 0.6 }

  return (
    <div id={STAGE_ID} className={styles.stage} role="tabpanel" aria-labelledby={tabId(ticker)}>
      <div ref={frameRef} className={styles.frame}>
        <div className={styles.card}>
          <div className={styles.content} inert={open}>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>Performance</h3>
              <button
                ref={infoRef}
                type="button"
                className={styles.info}
                aria-label="What this graph shows"
                aria-haspopup="dialog"
                onClick={() => {
                  sfx.tap()
                  setOpen(true)
                }}
              >
                <img src={`${GRAPH_ASSET}icon-info.svg`} alt="" width={24} height={24} />
              </button>
            </div>

            <Fade k={priceKey} swap={swap} stackClass={styles.price}>
              {money.format(sharePrice)}
            </Fade>

            <div className={styles.tiles}>
              <Tile
                series="stock"
                solo={solo}
                onToggle={toggleSolo}
                label={ticker}
                dot={styles.dotStock}
                price={stockPrice}
                pct={stockPct}
                k={fadeKey}
                swap={swap}
              />
              <Tile
                series="spy"
                solo={solo}
                onToggle={toggleSolo}
                label="S&P 500"
                dot={styles.dotSpy}
                price={spyPrice}
                pct={spyPct}
                k={fadeKey}
                swap={swap}
              />
            </div>

            <div className={styles.date}>{date}</div>

            <div className={styles.chart}>
              {(
                [
                  [Y_TOP, v.top, styles.rowSolid, true],
                  ...(v.zeroIn ? [[v.zeroY, 0, styles.rowDashed, v.zeroLabel] as const] : []),
                  [Y_BOT, v.bot, styles.rowSolid, true],
                ] as const
              ).map(([y, val, cls, label]) => (
                <div key={cls + val} className={`${styles.row} ${cls}`} style={{ top: y - 12 }} aria-hidden="true">
                  <span className={styles.rule} />
                  {label ? (
                    <span className={val === 0 && cls === styles.rowDashed ? `${styles.axisLabel} ${styles.axisZero}` : styles.axisLabel}>
                      {fmtAxis(val)}
                    </span>
                  ) : (
                    /* text hidden: the dotted line still stops where the pill would start */
                    <span className={`${styles.axisLabel} ${styles.axisZero} ${styles.axisHidden}`} />
                  )}
                </div>
              ))}

              <svg className={styles.svg} width={358} height={182} viewBox="0 0 358 182" aria-hidden="true">
                <defs>
                  {/* #838FFF 50% → 0%, starting 21.4px above the plot (spec §2b) */}
                  <linearGradient id={GRADIENT_ID} gradientUnits="userSpaceOnUse" x1="160" x2="160" y1="-21.4" y2={FILL_BOT}>
                    <stop offset="0" stopColor="var(--gl-chart-fill)" stopOpacity="0.5" />
                    <stop offset="1" stopColor="var(--gl-chart-fill)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* each series in its own group, so a solo dims the other
                    one with a single opacity (the group's, never the
                    paths', which Motion is drawing; the stock's area fill
                    rides with its line) */}
                <g className={styles.series} data-dim={dimSpy}>
                  <motion.path
                    key={`spy-${viewKey}`}
                    className={`${styles.line} ${styles.lineSpy}`}
                    d={v.spyLine}
                    initial={still ? false : { pathLength: 0 }}
                    animate={{ pathLength: play ? 1 : 0 }}
                    transition={draw}
                  />
                </g>
                <g className={styles.series} data-dim={dimStock}>
                  <motion.path
                    key={`area-${viewKey}`}
                    className={styles.area}
                    d={v.area}
                    fill={`url(#${GRADIENT_ID})`}
                    initial={still ? false : { opacity: 0 }}
                    animate={{ opacity: play ? 1 : 0 }}
                    transition={fillIn}
                  />
                  <motion.path
                    key={`stock-${viewKey}`}
                    className={`${styles.line} ${styles.lineStock}`}
                    d={v.line}
                    initial={still ? false : { pathLength: 0 }}
                    animate={{ pathLength: play ? 1 : 0 }}
                    transition={draw}
                  />
                </g>
                {cursor !== null && (
                  <g className={styles.scrub}>
                    <rect className={styles.scrubLine} x={v.xs[cursor] - 0.5} y={0} width={1} height={SCRUB_BOT} />
                    <g className={styles.series} data-dim={dimSpy}>
                      <circle className={styles.dotRing} cx={v.xs[cursor]} cy={v.spyY[cursor]} r={6} />
                      <circle className={styles.dotSpyFill} cx={v.xs[cursor]} cy={v.spyY[cursor]} r={4} />
                    </g>
                    <g className={styles.series} data-dim={dimStock}>
                      <circle className={styles.dotRing} cx={v.xs[cursor]} cy={v.stockY[cursor]} r={6} />
                      <circle
                        className={styles.dotStockFill}
                        data-dot="stock"
                        cx={v.xs[cursor]}
                        cy={v.stockY[cursor]}
                        r={4}
                      />
                    </g>
                  </g>
                )}
              </svg>

              <div
                ref={plotRef}
                className={styles.plot}
                role="slider"
                tabIndex={0}
                aria-label={`${ticker} against the S&P 500 over the past ${RANGE_WORDS[range]}${solo ? `, ${solo === 'stock' ? ticker : 'the S&P 500'} highlighted` : ''}. Drag, or use the arrow keys, to scrub.`}
                aria-valuemin={0}
                aria-valuemax={v.n - 1}
                aria-valuenow={at}
                aria-valuetext={valueText}
                onPointerDown={(e) => {
                  pressed.current = true
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId)
                  } catch {}
                  scrubAtX(e.clientX)
                }}
                onPointerMove={(e) => {
                  if (pressed.current) scrubAtX(e.clientX)
                }}
                onPointerUp={release}
                onPointerCancel={release}
                onLostPointerCapture={() => {
                  if (pressed.current) release()
                }}
                onBlur={() => {
                  if (!pressed.current) release()
                }}
                onKeyDown={(e) => {
                  const from = cursor ?? v.n - 1
                  const to =
                    e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? from - 1
                    : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? from + 1
                    : e.key === 'PageDown' ? from - 10
                    : e.key === 'PageUp' ? from + 10
                    : e.key === 'Home' ? 0
                    : e.key === 'End' ? v.n - 1
                    : null
                  if (e.key === 'Escape' && cursor !== null) {
                    /* a scrub's Escape is spent here, not on the window */
                    e.preventDefault()
                    e.stopPropagation()
                    release()
                    return
                  }
                  if (to === null) return
                  e.preventDefault()
                  scrubTo(to)
                }}
              />
            </div>

            <div className={styles.ranges} role="radiogroup" aria-label="Time range">
              {RANGES.map((r, k) => (
                <button
                  key={r}
                  ref={(el) => {
                    rangeRefs.current[k] = el
                  }}
                  type="button"
                  role="radio"
                  className={styles.range}
                  aria-checked={r === range}
                  aria-label={`Past ${RANGE_WORDS[r]}`}
                  tabIndex={r === range ? 0 : -1}
                  onClick={() => pickRange(k)}
                  onKeyDown={(e) => {
                    const n = RANGES.length
                    const to =
                      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (k + 1) % n
                      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (k - 1 + n) % n
                      : e.key === 'Home' ? 0
                      : e.key === 'End' ? n - 1
                      : null
                    if (to === null) return
                    e.preventDefault()
                    pickRange(to, true)
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className={better ? `${styles.insight} ${styles.insightUp}` : `${styles.insight} ${styles.insightDown}`}>
              <span className={styles.pictogram} aria-hidden="true">
                {/* ic_invest_down (icon-invest-down.svg); the "better" tile
                    flips it to point up, on the positive colours. Its
                    12px is held in the CSS: the plate's own svg rule
                    would otherwise stretch it to the tile's full 24 */}
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7 8.57143H9.42934L6.42696 5.28382L4.04586 7.26536L0 3.05665L1.01577 2L4.15248 5.26296L6.55977 3.25961L10.5714 7.65238V5L12 5.95238V10H7.95238L7 8.57143Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <Fade stackClass={styles.insightText} k={fadeKey} swap={swap}>
                Over the past {RANGE_WORDS[range]} {ticker} performed {fmtPct(diff)} {better ? 'better' : 'worse'} than
                the S&amp;P&nbsp;500
              </Fade>
            </div>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                key="scrim"
                className={moatStyles.scrim}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.2 }}
                onClick={() => {
                  restore.current = true
                  setOpen(false)
                }}
                aria-hidden="true"
              />
            )}
            {open && (
              <InfoSheet
                key="info"
                onClose={() => {
                  restore.current = true
                  setOpen(false)
                }}
                transition={reduced ? { duration: 0 } : SPRINGS.window}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* the fly-up behind the "i" (Figma 201641:59306): the file's two
   paragraphs verbatim; the link tile is drawn to match and does nothing
   (there is no article on this page) */
function InfoSheet({ onClose, transition }: { onClose: () => void; transition: object }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])
  return (
    <SheetShell
      titleId={INFO_TITLE_ID}
      title="Performance"
      onClose={onClose}
      transition={transition}
      className={moatStyles.infoSheet}
      closeRef={closeRef}
    >
      <div className={moatStyles.explain}>
        <p>
          This graph shows how the stock&rsquo;s price has changed compared to the S&amp;P 500, which represents
          the performance of many large companies.
        </p>
        <p>
          The graph starts both at 0% and then tracks percentage changes. This lets you see if the stock is doing
          better or worse than the overall market over time.
        </p>
      </div>
      <div className={moatStyles.prompt}>
        <img src={`${MOAT_ASSET}icon-assistant.svg`} alt="" width={40} height={40} />
        <span className={moatStyles.promptText}>
          What does it mean if a stock regularly outperforms the S&amp;P 500?
        </span>
        <img src={`${MOAT_ASSET}icon-chevron-right.svg`} alt="" width={24} height={24} />
      </div>
    </SheetShell>
  )
}
