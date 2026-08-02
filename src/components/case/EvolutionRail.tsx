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
   Assets export from Figma "scroller viz" (201161-12); each slot is
   swappable when Jake revises (§2 law). */

const DIR = '/case/family-hub/evo'

const STAGES = [
  { file: 'stage-00.webp', v: 'v0.1', label: 'Sketch', alt: 'Concept collage: a big pink clock, weather, calendar and home glyphs, family portrait avatars, one checked-off chore.' },
  { file: 'stage-01.webp', v: 'v0.2', label: 'Proto', alt: 'First clickable dashboard: dark shell, the family agenda blocked in as bright color bars.' },
  { file: 'stage-02.webp', v: 'v0.3', label: 'Proto', alt: 'Prototype month calendar: the whole household on one grid.' },
  { file: 'stage-03.webp', v: 'v0.4', label: 'Hi-fi', alt: 'Hi-fi build in Greenlight green: the morning brief with a school-run map.' },
  { file: 'stage-04.webp', v: 'v0.5', label: 'Board build', alt: 'The hi-fi ambient screen that went to the board: good morning, 8:32 AM.' },
  { file: 'stage-05.webp', v: 'v0.6', label: 'Rein-in', alt: 'The color pullback: a light dashboard that spends color only where it means something.' },
  { file: 'stage-06.webp', v: 'v0.7', label: 'Shipped UI', alt: 'Near-launch dashboard: chats, chores and calendar as calm cards.' },
  { file: 'stage-07.webp', v: 'v0.9', label: 'On device', alt: 'The launch UI rendered on the 15.6-inch device frame.' },
  { file: 'stage-08.webp', v: 'v1.0', label: 'Ship', alt: 'Family Hub as shipped: the today view on the physical device.' },
]

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
          {STAGES.map((s, i) => (
            <img
              key={s.file}
              src={`${DIR}/${s.file}`}
              alt=""
              aria-hidden="true"
              draggable={false}
              data-on={i === stage ? 'true' : undefined}
            />
          ))}
        </div>
        <div className={styles.railFoot}>
          {STAGES.map((s, i) => (
            <button
              key={s.file}
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
