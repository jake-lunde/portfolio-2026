'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* "Most essential features" — Family Hub Exploration Survey, Sept 2025,
   n=1,200 US parents (ref/famhub-pull-quotes.md, verified vs deck).
   Tap a bar for the honest ledger: what research said vs what shipped. */

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

const W = 640
const BAR_H = 22
const GAP = 14
const LABEL_W = 150
const MAX_PCT = 62

export function ResearchBars() {
  const [sel, setSel] = useState<Row | null>(null)
  const reduced = useReducedMotion()

  const pick = (r: Row) => {
    sfx.tap()
    setSel((cur) => (cur?.id === r.id ? null : r))
  }

  const chartW = W - LABEL_W - 56
  const H = ROWS.length * (BAR_H + GAP) - GAP

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H + 8}`}
        role="img"
        aria-label="Survey results, most essential features: calendar 58%, chores 48%, location 46%, grocery lists 44%, AI assistant 34%, photo album 15%. Tap a bar for what shipped."
        fontFamily="var(--mono)"
      >
        {ROWS.map((r, i) => {
          const y = i * (BAR_H + GAP)
          const active = sel?.id === r.id
          const honest = r.id === 'ai' || r.id === 'photos'
          const w = (r.pct / MAX_PCT) * chartW
          return (
            <g
              key={r.id}
              className={styles.moatNode}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={`${r.label}, ${r.pct} percent essential. ${r.verdict}. ${r.why}`}
              onClick={() => pick(r)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  pick(r)
                }
              }}
            >
              <text x={0} y={y + BAR_H - 6} fill="#E7E1D2" fontSize="11" opacity={active ? 1 : 0.75}>
                {r.label}
              </text>
              <motion.rect
                x={LABEL_W}
                y={y}
                width={w}
                height={BAR_H}
                fill={active ? 'var(--accent-expressive)' : '#E7E1D2'}
                opacity={active ? 1 : honest ? 0.28 : 0.55}
                strokeDasharray={honest ? '3 3' : undefined}
                stroke={honest ? '#E7E1D2' : undefined}
                strokeWidth={honest ? 1 : 0}
                style={{ originX: `${LABEL_W}px`, transformBox: 'view-box' }}
                initial={reduced ? undefined : { scaleX: 0 }}
                whileInView={reduced ? undefined : { scaleX: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              />
              <text
                x={LABEL_W + w + 8}
                y={y + BAR_H - 6}
                fill={active ? 'var(--accent-expressive)' : '#E7E1D2'}
                fontSize="11"
                opacity={active ? 1 : 0.6}
              >
                {r.pct}%
              </text>
            </g>
          )
        })}
      </svg>

      <div className={styles.moatWhy} aria-live="polite">
        {sel ? (
          <>
            <b>{sel.label}</b> · {sel.verdict.toLowerCase()}
            <br />
            {sel.why}
          </>
        ) : (
          <>Tap a bar. The dashed ones are where we overruled the research, on purpose.</>
        )}
      </div>
    </div>
  )
}
