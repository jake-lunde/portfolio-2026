'use client'

import { useEffect, useRef, useState } from 'react'
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
import { Plate } from './CaseComponents'
import styles from './case.module.css'

/* "The old Invest": the screens Jake inherited, laid out as a contact
   sheet in the old flow's order. Each one sits in the site's phone
   shell (.phoneShell, scaled down to the cell) and clips its full-length
   screenshot to one phone screen, so the reader finds out how far each
   page ran by scrolling it.

   Two behaviors, same split as PitchDeck: with a fine pointer, cursor y
   over a frame scrubs its screen top to bottom (transform only) and
   leaving eases it back to the top; on touch each screen is a native
   scroll box. The row lays out by the article's width, not the pointer:
   wide, all frames share the row; narrow (phones), it becomes a snap
   carousel, one frame per swipe.

   Mat: the default dark plate, on purpose. The screenshots are white,
   but they never touch the plate: the bezel does. Rail law matches the
   mat to what meets it, and the avatar plate (family-hub) already seats
   a phone on the dark plate, so this one follows. */

const BASE = '/case/greenlight-invest/before'

/* every export is a 375pt iPhone frame at 2x, so one phone screen is
   812pt = 1624px tall and the width is always 750 */
const W = 750
const VIEW = 1624

/* old flow order. A new screen is one line: [file, height px, name, alt] */
const SCREENS: Array<[file: string, h: number, name: string, alt: string]> = [
  ['01-portfolio', 4708, 'Portfolio', 'The old Invest portfolio dashboard: the balance, cash to invest, each holding with its gain, recurring investments, ways to explore the market, a learning banner and account records, all on one long page'],
  ['02-search', 1624, 'Search', 'The old fund search: an Exchange Traded Funds page with a search field and a list of funds by theme, each with its ticker and a risk label'],
  ['03-detail', 5306, 'Fund detail', 'The old fund detail page: a performance graph, Morningstar and analyst ratings, the fund description, key holdings, additional details, historical performance and a long disclaimer'],
  ['04-amount', 1624, 'Amount', 'The old one-time investment picker: preset dollar amounts, the cash balance it draws from, and a review order button'],
  ['05-confirm', 1624, 'Confirm', 'The old place order screen: the amount and ticker being bought, the cash balance, the market price with quote notes, and a place order button'],
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
  i,
  fine,
  active,
  onActive,
  onArrow,
  setRef,
}: {
  file: string
  h: number
  name: string
  alt: string
  i: number
  fine: boolean
  active: boolean
  onActive: () => void
  onArrow: (d: number) => void
  setRef: (el: HTMLDivElement | null) => void
}) {
  const reduced = useReducedMotion()
  const screen = useRef<HTMLDivElement>(null)
  const run = useRef<AnimationPlaybackControls | null>(null)
  /* p is how far down the page we are, 0 (top) to 1 (last screen) */
  const p: MotionValue<number> = useMotionValue(0)
  /* translateY as a percent of the image's own height, so nothing needs
     measuring: the last screen sits flush when p = 1. Clamped at the top
     so a spring can never open a gap above the page. */
  const room = 1 - VIEW / h
  const y = useTransform(p, (v) => `${-Math.min(1, Math.max(0, v)) * room * 100}%`)

  const jump = (v: number) => {
    run.current?.stop()
    p.set(v)
  }
  const glide = (v: number) => {
    if (reduced) return jump(v)
    run.current?.stop()
    /* window: the most damped spring token, so the return settles
       instead of bouncing */
    run.current = animate(p, v, SPRINGS.window)
  }

  /* pointer type can flip (a tablet with a trackpad): park the scrub.
     y stays bound in both modes; on touch p rests at 0, so it is a no-op */
  useEffect(() => {
    run.current?.stop()
    p.set(0)
  }, [fine, p])

  const nudge = (d: number) => {
    if (room <= 0) return
    if (fine) {
      /* half a phone screen per press */
      const step = (VIEW / 2) / (h - VIEW)
      glide(Math.min(1, Math.max(0, p.get() + d * step)))
    } else {
      const el = screen.current
      if (el) el.scrollBy({ top: (d * el.clientHeight) / 2, behavior: reduced ? 'auto' : 'smooth' })
    }
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
        onBlur={() => fine && glide(0)}
        onMouseEnter={onActive}
        onMouseMove={
          fine
            ? (e) => {
                const r = e.currentTarget.getBoundingClientRect()
                jump((e.clientY - r.top) / r.height)
              }
            : undefined
        }
        onMouseLeave={fine ? () => glide(0) : undefined}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') (e.preventDefault(), onArrow(1))
          if (e.key === 'ArrowLeft') (e.preventDefault(), onArrow(-1))
          if (e.key === 'ArrowDown') (e.preventDefault(), nudge(1))
          if (e.key === 'ArrowUp') (e.preventDefault(), nudge(-1))
        }}
      >
        <div ref={screen} className={styles.beforeScreen}>
          <motion.img
            src={`${BASE}/${file}.webp`}
            width={W}
            height={h}
            alt={alt}
            loading={i === 0 ? undefined : 'lazy'}
            draggable={false}
            style={{ y }}
          />
        </div>
      </div>
    </div>
  )
}

export function BeforeSheet() {
  const [fine, setFine] = useState(false)
  const [on, setOn] = useState(0)
  const reduced = useReducedMotion()
  const frames = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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

  const [, h, name] = SCREENS[on]

  return (
    <Plate
      cap="The old Invest"
      readout={
        <>
          {name} · {screens(h)}
        </>
      }
    >
      <div
        className={styles.beforeRow}
        role="group"
        aria-label={`The old Invest flow, ${SCREENS.length} screens. Left and right arrows move between them, up and down scroll one.`}
        data-scroll={fine ? 'hover' : 'native'}
        onScroll={(e) => {
          /* carousel only: the frame snapped to the middle is the one
             the readout names */
          const el = e.currentTarget
          const cell = el.firstElementChild as HTMLElement | null
          if (!cell) return
          const stride = cell.offsetWidth + (parseFloat(getComputedStyle(el).columnGap) || 0)
          setOn(Math.min(SCREENS.length - 1, Math.max(0, Math.round(el.scrollLeft / stride))))
        }}
      >
        {SCREENS.map(([file, fh, fname, alt], i) => (
          <Frame
            key={file}
            file={file}
            h={fh}
            name={fname}
            alt={alt}
            i={i}
            fine={fine}
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
