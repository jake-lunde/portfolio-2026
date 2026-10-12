'use client'

import { useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Plate } from './CaseComponents'
import styles from './case.module.css'

/* "Greenlight Invest circa 2024": the screens Jake inherited, laid out as a contact
   sheet in the old flow's order. Each one sits in the site's phone
   shell (.phoneShell, scaled down to the cell) and clips its full-length
   screenshot to one phone screen, so the reader finds out how far each
   page ran by scrolling it.

   Each screen scrolls like a normal page for every pointer: wheel,
   trackpad and touch all scroll it, and up and down arrows nudge half a
   screen when its frame has focus (Jake ruled the old hover scrub felt
   buggy). Left and right arrows move between frames. The cap is static
   (Jake ruled out the readout); each frame's aria-label still
   names it and its length for screen readers. The row lays out by the article's
   width, not the pointer: wide, all frames share the row; narrow
   (phones), it becomes a snap carousel, one frame per swipe.

   Mat: the default dark plate, on purpose. The screenshots are white,
   but they never touch the plate: the bezel does. Rail law matches the
   mat to what meets it, and the avatar plate (family-hub) already seats
   a phone on the dark plate, so this one follows. */

const BASE = '/case/greenlight-invest/before'

/* every export is a 375pt iPhone frame at 2x, so one phone screen is
   812pt = 1624px tall and the width is always 750 */
const W = 750
const VIEW = 1624

/* old flow order. A new screen is one line: [file, height px, name, alt,
   badge?]. The badge is a quiet chip pinned to the frame's top right,
   outside the scroll box so it stays put while the page scrolls under
   it; aria-hidden, because the frame's own label already says it. */
const SCREENS: Array<[file: string, h: number, name: string, alt: string, badge?: string]> = [
  ['01-portfolio', 4708, 'Portfolio', 'The old Invest portfolio dashboard: the balance, cash to invest, each holding with its gain, recurring investments, ways to explore the market, a learning banner and account records, all on one long page'],
  ['02-search', 1624, 'Search', 'The old fund search: an Exchange Traded Funds page with a search field and a list of funds by theme, each with its ticker and a risk label'],
  ['03-detail', 5306, 'Fund detail', 'The old fund detail page: a performance graph, Morningstar and analyst ratings, the fund description, key holdings, additional details, historical performance and a long disclaimer'],
  ['04-amount', 1624, 'Amount', 'The old one-time investment picker: preset dollar amounts, the cash balance it draws from, and a review order button'],
  ['05-learn', 7568, 'Learn mode', 'The old Apple stock page with learn mode on: every stat, from ticker symbol, last price and market cap to the Morningstar rating, fair value and P/E ratios, gets a purple label and a lavender box defining it underneath, so the page runs nearly five screens', 'Learn mode active'],
]

/* "2.9 screens", "1 screen": the page's length in phone screens */
function screens(h: number) {
  const n = Math.round((h / VIEW) * 10) / 10
  return n === 1 ? '1 screen' : `${n.toFixed(1)} screens`
}

function Frame({
  file,
  h,
  name,
  alt,
  badge,
  i,
  active,
  onActive,
  onArrow,
  setRef,
}: {
  file: string
  h: number
  name: string
  alt: string
  badge?: string
  i: number
  active: boolean
  onActive: () => void
  onArrow: (d: number) => void
  setRef: (el: HTMLDivElement | null) => void
}) {
  const reduced = useReducedMotion()
  const screen = useRef<HTMLDivElement>(null)

  /* half a phone screen per press, smooth unless motion is reduced */
  const nudge = (d: number) => {
    const el = screen.current
    if (el) el.scrollBy({ top: (d * el.clientHeight) / 2, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <div className={styles.beforeCell}>
      <div
        ref={setRef}
        className={`${styles.phoneShell} ${styles.beforeShell}`}
        role="group"
        aria-label={`${name}, ${screens(h)} long`}
        tabIndex={active ? 0 : -1}
        onFocus={onActive}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') (e.preventDefault(), onArrow(1))
          if (e.key === 'ArrowLeft') (e.preventDefault(), onArrow(-1))
          if (e.key === 'ArrowDown') (e.preventDefault(), nudge(1))
          if (e.key === 'ArrowUp') (e.preventDefault(), nudge(-1))
        }}
      >
        {/* a plain scroll box; its first scroll makes this frame the
            roving-focus one (scroll events don't bubble to the row's
            carousel) */}
        <div ref={screen} className={styles.beforeScreen} onScroll={active ? undefined : onActive}>
          <img
            src={`${BASE}/${file}.webp`}
            width={W}
            height={h}
            alt={alt}
            loading={i === 0 ? undefined : 'lazy'}
            draggable={false}
          />
        </div>
        {badge && (
          <span className={styles.beforeBadge} aria-hidden="true">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

export function BeforeSheet() {
  const [on, setOn] = useState(0)
  const reduced = useReducedMotion()
  const frames = useRef<Array<HTMLDivElement | null>>([])

  /* left/right: roving focus along the row; in the carousel the frame
     is brought to centre without nudging the page vertically */
  const arrow = (d: number) => {
    const next = Math.min(SCREENS.length - 1, Math.max(0, on + d))
    const el = frames.current[next]
    if (!el) return
    setOn(next)
    el.focus({ preventScroll: true })
    el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <Plate cap="Greenlight Invest circa 2024">
      <div
        className={styles.beforeRow}
        role="group"
        aria-label={`The old Invest flow, ${SCREENS.length} screens. Left and right arrows move between them, up and down scroll one.`}
        onScroll={(e) => {
          /* carousel only: the frame snapped to the middle takes the
             roving focus */
          const el = e.currentTarget
          const cell = el.firstElementChild as HTMLElement | null
          if (!cell) return
          const stride = cell.offsetWidth + (parseFloat(getComputedStyle(el).columnGap) || 0)
          setOn(Math.min(SCREENS.length - 1, Math.max(0, Math.round(el.scrollLeft / stride))))
        }}
      >
        {SCREENS.map(([file, fh, fname, alt, badge], i) => (
          <Frame
            key={file}
            file={file}
            h={fh}
            name={fname}
            alt={alt}
            badge={badge}
            i={i}
            active={i === on}
            onActive={() => setOn(i)}
            onArrow={arrow}
            setRef={(el) => {
              frames.current[i] = el
            }}
          />
        ))}
      </div>
    </Plate>
  )
}
