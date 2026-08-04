'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* The rail IS the Family Hub: a nested mini-window riding the case's
   right margin, climbing the fidelity ladder as the story scrolls —
   sketch, clickable proto, the board build, the color rein-in, the
   shipped device. The persuasion-ladder thesis made literal.

   Stage switching rides IntersectionObserver on the case's own beats
   (hero → sections → footer), never scroll-linked animation: safe in a
   hidden tab and under prefers-reduced-motion. The scroller is the
   WINDOW body, not the viewport — sticky anchors to it on its own.
   Assets export from Figma "scroller viz" (201161-12); labels are
   Jake's own section names there; each slot is swappable when he
   revises (§2 law). Every stage declares its exact export ratio so the
   frame hugs the artwork with the same 10px of paper on all sides. */

const DIR = '/case/family-hub/evo'

type Stage = {
  v: string
  label: string
  ratio: string
  alt: string
  /** stage image; the sketch stage renders the living scene instead */
  file?: string
}

const STAGES: Stage[] = [
  { v: 'v0.1', label: 'Sketch', ratio: '1089 / 490', alt: 'Concept collage: a big pink clock, weather, calendar and home glyphs, family portrait avatars, one checked-off chore — all gently afloat.' },
  { file: 'stage-01.webp', v: 'v0.2', label: 'Proof of Concept', ratio: '1420 / 789', alt: 'First clickable dashboard: dark shell, the family agenda blocked in as bright color bars.' },
  { file: 'stage-02.webp', v: 'v0.3', label: 'Proof of Concept', ratio: '1420 / 789', alt: 'Proof-of-concept month calendar: the whole household on one grid.' },
  { file: 'stage-03.webp', v: 'v0.4', label: 'Wireframes', ratio: '1440 / 808', alt: 'Wireframe pass in Greenlight green: the morning brief with a school-run map.' },
  { file: 'stage-04.webp', v: 'v0.5', label: 'Wireframes', ratio: '1420 / 789', alt: 'Wireframe ambient screen: good morning, 8:32 AM.' },
  { file: 'stage-05.webp', v: 'v0.6', label: 'Hi-Fi Prototype', ratio: '1420 / 789', alt: 'Hi-fi prototype: the light dashboard taking its shipped shape.' },
  { file: 'stage-06.webp', v: 'v0.7', label: 'Color Explorations', ratio: '1280 / 800', alt: 'Color exploration: chats, chores and calendar as calm cards, color only where it means something.' },
  { file: 'stage-07.webp', v: 'v0.9', label: 'On-Device Testing', ratio: '1164 / 705', alt: 'The launch UI under test on the 15.6-inch device frame.' },
  { file: 'stage-08.webp', v: 'v1.0', label: 'Ship', ratio: '1164 / 705', alt: 'Family Hub as shipped: the today view on the physical device.' },
]

/* The living sketch — Jake's concept collage as cutouts on a virtual
   1089×490 canvas (coords straight from the Figma group), each adrift
   on its own slow loop. Deltas are screen-px and small on purpose:
   ambient, not a parlor trick. */

const SK = { w: 1089, h: 490 }

type Bit = {
  f: string
  x: number
  y: number
  w: number
  dx: number
  dy: number
  dr: number
  dur: number
  delay: number
}

const BITS: Bit[] = [
  { f: 'head', x: 0, y: 21, w: 351, dx: 1, dy: 3, dr: 0, dur: 11, delay: -4 },
  { f: 'week', x: 182, y: 178, w: 105, dx: -3, dy: 2, dr: -1, dur: 9, delay: -2 },
  { f: 'cal', x: 516, y: 92, w: 86, dx: 2, dy: -4, dr: 1.5, dur: 8, delay: -6 },
  { f: 'house', x: 361, y: 153, w: 64, dx: -2, dy: -3, dr: -1.5, dur: 10, delay: -1 },
  { f: 'bell', x: 709, y: 223, w: 37, dx: 3, dy: -2, dr: 2, dur: 7, delay: -3 },
  { f: 'mom', x: 273, y: 255, w: 162, dx: 3, dy: 4, dr: 0.8, dur: 12, delay: -7 },
  { f: 'dad', x: 456, y: 214, w: 92, dx: -3, dy: 3, dr: -1, dur: 9.5, delay: -5 },
  { f: 'girl', x: 456, y: 336, w: 125, dx: 2, dy: -3, dr: 1, dur: 11.5, delay: -9 },
  { f: 'boy', x: 587, y: 255, w: 100, dx: -2, dy: -4, dr: -0.8, dur: 10.5, delay: -2 },
  { f: 'temp', x: 100, y: 316, w: 135, dx: 3, dy: -2, dr: 1, dur: 9, delay: -8 },
  { f: 'checklist', x: 386, y: 432, w: 58, dx: -3, dy: 2, dr: -2, dur: 8.5, delay: -4 },
  { f: 'pin', x: 602, y: 389, w: 49, dx: 2, dy: 3, dr: 2, dur: 7.5, delay: -6 },
  { f: 'check', x: 726, y: 343, w: 70, dx: -2, dy: -2, dr: -1.5, dur: 8, delay: -1 },
  { f: 'task', x: 826, y: 364, w: 263, dx: 3, dy: 2, dr: 0.5, dur: 10, delay: -5 },
]

function SketchScene({ on }: { on: boolean }) {
  return (
    <div className={styles.railScene} data-on={on ? 'true' : undefined} aria-hidden="true">
      {BITS.map((b) => (
        <img
          key={b.f}
          src={`${DIR}/sketch/${b.f}.webp`}
          alt=""
          draggable={false}
          className={styles.railBit}
          style={{
            left: `${(b.x / SK.w) * 100}%`,
            top: `${(b.y / SK.h) * 100}%`,
            width: `${(b.w / SK.w) * 100}%`,
            ['--dx' as string]: `${b.dx}px`,
            ['--dy' as string]: `${b.dy}px`,
            ['--dr' as string]: `${b.dr}deg`,
            ['--dur' as string]: `${b.dur}s`,
            ['--delay' as string]: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export function EvolutionRail() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [stage, setStage] = useState(0)
  const [closed, setClosed] = useState(false)
  const marksRef = useRef<Element[]>([])

  useEffect(() => {
    if (closed) return
    const article = ref.current?.closest('article')
    if (!article) return
    const marks = Array.from(
      article.querySelectorAll(`.${styles.hero}, .${styles.section}, .${styles.caseFooter}`),
    )
    marksRef.current = marks
    if (marks.length < 2) return

    // beats map onto stages proportionally, so an added or cut section
    // reflows the ladder instead of orphaning the tail
    const toStage = (i: number) => Math.round((i / (marks.length - 1)) * (STAGES.length - 1))
    const live = new Set<number>()
    const onEntries = (entries: IntersectionObserverEntry[]) => {
      for (const e of entries) {
        const i = marks.indexOf(e.target)
        if (e.isIntersecting) live.add(i)
        else live.delete(i)
      }
      if (live.size) setStage(toStage(Math.max(...live)))
    }
    // tripline: a beat counts once it reaches the upper 45% of the view;
    // the lowest live beat drives the ladder
    const io = new IntersectionObserver(onEntries, { rootMargin: '0px 0px -55% 0px', threshold: 0 })
    // …except the last beat: the footer lives in the final pixels of
    // scroll and can never climb into that band, so v1.0 ships the
    // moment the footer is properly on screen at all
    const ioLast = new IntersectionObserver(onEntries, { rootMargin: '0px 0px -5% 0px', threshold: 0 })
    marks.forEach((m, i) => (i === marks.length - 1 ? ioLast : io).observe(m))
    return () => {
      io.disconnect()
      ioLast.disconnect()
    }
  }, [closed])

  if (closed) return null
  const cur = STAGES[stage]

  const jumpTo = (i: number) => {
    const marks = marksRef.current
    if (!marks.length) return
    const mark = marks[Math.round((i / (STAGES.length - 1)) * (marks.length - 1))]
    sfx.tap()
    mark?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className={styles.railSlot} ref={ref}>
      <aside className={styles.rail} aria-label="Family Hub, evolving alongside the story">
        <div className={styles.railBar}>
          <button
            className={styles.railCtrl}
            aria-label="Close the Family Hub mini-window"
            onClick={() => {
              sfx.close()
              setClosed(true)
            }}
          >
            ×
          </button>
          <span className={styles.railTitle}>Family.Hub</span>
          <span className={styles.railVer}>{cur.v}</span>
        </div>
        <div className={styles.railView} role="img" aria-label={`${cur.v} · ${cur.label}. ${cur.alt}`}>
          <div className={styles.railStack} style={{ aspectRatio: cur.ratio }}>
            <SketchScene on={stage === 0} />
            {STAGES.map(
              (s, i) =>
                s.file && (
                  <img
                    key={s.file}
                    src={`${DIR}/${s.file}`}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    data-on={i === stage ? 'true' : undefined}
                  />
                ),
            )}
          </div>
        </div>
        <div className={styles.railFoot}>
          {STAGES.map((s, i) => (
            <button
              key={s.v}
              className={styles.railTick}
              aria-label={`${s.v} · ${s.label}`}
              aria-current={i === stage ? 'step' : undefined}
              data-on={i === stage ? 'true' : undefined}
              data-done={i < stage ? 'true' : undefined}
              onClick={() => jumpTo(i)}
            />
          ))}
        </div>
        <div className={styles.railLabel} aria-hidden="true">
          {cur.v} · {cur.label}
        </div>
      </aside>
    </div>
  )
}
