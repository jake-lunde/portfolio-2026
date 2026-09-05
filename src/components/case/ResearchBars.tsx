'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* "Most essential features" — Family Hub Exploration Survey, Sept 2025,
   n=1,200 US parents (ref/famhub-pull-quotes.md, verified vs deck).
   Tap a bar for the honest ledger: what research said vs what shipped.

   Laid out in real pixels (s140), not one SVG picture scaled to fit —
   see .survey in case.module.css for the rest state, the reveal and the
   readout's reserved height. */

type Row = {
  id: string
  label: string
  pct: number
  verdict: string
  why: string
}

const ROWS: Row[] = [
  { id: 'cal', label: 'Calendar', pct: 58, verdict: 'SHIPPED · CORE', why: 'The #1 ask, and the feature I owned end to end. Month, week, day, and the syncing that makes it real.' },
  { id: 'chores', label: 'Chores', pct: 48, verdict: 'SHIPPED · CORE', why: 'Chores wired straight into allowance. That is the fintech DNA the category can’t copy.' },
  { id: 'loc', label: 'Location', pct: 46, verdict: 'SHIPPED · CORE', why: '“Everyone but Tanya is at home. She’s at work.” Glanceable, not creepy.' },
  { id: 'lists', label: 'Grocery lists', pct: 44, verdict: 'SHIPPED · CORE', why: 'The humble one. Nobody demos lists; everybody uses them.' },
  { id: 'ai', label: 'AI assistant', pct: 34, verdict: 'THE PAID BET', why: 'Mid-pack in the research, and it became the paid tier anyway. A strategic bet, not a research-led one. I’m telling you because you’d notice.' },
  { id: 'photos', label: 'Photo album', pct: 15, verdict: 'SHIPPED ANYWAY', why: 'Dead last with parents, table stakes in the category. Sometimes the market outvotes the survey.' },
]

/* the track's full width is 62% — the scale the chart has always drawn
   on, a breath above the top bar so 58% doesn't touch the edge */
const MAX_PCT = 62

export function ResearchBars() {
  const [sel, setSel] = useState<Row | null>(null)
  const [hov, setHov] = useState<Row | null>(null)
  const reduced = useReducedMotion()
  const chartRef = useRef<HTMLDivElement>(null)

  /* the reveal is switched ON, never waited for: the bars rest full, and
     this flips the attribute that makes them grow in the first time the
     chart is seen. No observer, no animation, full chart. */
  useEffect(() => {
    const el = chartRef.current
    if (!el || reduced) return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        el.setAttribute('data-reveal', '')
        io.disconnect()
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  const pick = (r: Row) => {
    sfx.tap()
    setSel((cur) => (cur?.id === r.id ? null : r))
  }

  /* hover previews, tap commits — mouse only, so a touch tap's synthetic
     enter can't pin a row the finger already left */
  const shown = hov ?? sel

  return (
    <div>
      <div
        className={styles.survey}
        ref={chartRef}
        role="group"
        aria-label="Survey results, most essential features. Pick a bar for what shipped."
      >
        {ROWS.map((r, i) => {
          const active = shown?.id === r.id
          const honest = r.id === 'ai' || r.id === 'photos'
          return (
            <div
              key={r.id}
              className={`${styles.moatNode} ${styles.surveyRow}`}
              data-active={active ? '' : undefined}
              role="button"
              tabIndex={0}
              aria-pressed={sel?.id === r.id}
              aria-label={`${r.label}, ${r.pct} percent essential. ${r.verdict}. ${r.why}`}
              onClick={() => pick(r)}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') setHov(r)
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === 'mouse') setHov((cur) => (cur?.id === r.id ? null : cur))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  pick(r)
                }
              }}
            >
              <span className={styles.surveyLabel} aria-hidden="true">
                {r.label}
              </span>
              <span className={styles.surveyTrack}>
                <span
                  className={styles.surveyBar}
                  data-honest={honest ? '' : undefined}
                  style={{
                    ['--pct' as string]: `${r.pct / MAX_PCT}`,
                    ['--i' as string]: i,
                  }}
                />
              </span>
              <span className={styles.surveyPct} aria-hidden="true">
                {r.pct}%
              </span>
            </div>
          )
        })}
      </div>

      {/* every entry stacked in one cell, so the plate's height is the
          tallest of them and a tap never moves the prose below */}
      <div className={`${styles.moatWhy} ${styles.surveyWhy}`} aria-live="polite">
        <p data-on={shown ? undefined : ''} aria-hidden={shown ? true : undefined}>
          Tap a bar. The dashed ones are where we overruled the research, on purpose.
        </p>
        {ROWS.map((r) => {
          const on = shown?.id === r.id
          return (
            <p key={r.id} data-on={on ? '' : undefined} aria-hidden={on ? undefined : true}>
              <b>{r.label}</b> · {r.verdict.toLowerCase()}
              <br />
              {r.why}
            </p>
          )
        })}
      </div>
    </div>
  )
}
