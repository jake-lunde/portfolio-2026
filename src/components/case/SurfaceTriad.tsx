'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* The hub's whole interaction model in one dial: Ambient (bulletin board)
   → Active (dashboard) → Focused (task takeover). Modes per the
   interaction-models canvas (Figma team-library 453-342132). */

type Mode = 'ambient' | 'active' | 'focused'

const MODES: Array<{ id: Mode; label: string; blurb: string }> = [
  { id: 'ambient', label: 'Ambient', blurb: 'The bulletin board. Glanceable from across the kitchen — time, the next event, a photo, a savings goal. Asks nothing.' },
  { id: 'active', label: 'Active', blurb: 'The dashboard. Someone walked up: widgets per feature, laid out per family member. Private things stay behind a PIN.' },
  { id: 'focused', label: 'Focused', blurb: 'The takeover. One task, full screen, a clear start and end — add the chore, approve the request, get out.' },
]

const INK = '#E7E1D2'
const W = 560
const H = 300

function Ambient() {
  return (
    <g>
      <text x={40} y={128} fill={INK} fontSize="64" fontWeight="700" fontFamily="var(--mono)">
        7:42
      </text>
      <text x={42} y={156} fill={INK} fontSize="12" opacity="0.6" fontFamily="var(--mono)">
        THU · SOCCER 4:30 — OLIVIA
      </text>
      {/* photo frame */}
      <rect x={368} y={48} width={152} height={108} fill="none" stroke={INK} strokeWidth="1" opacity="0.5" />
      <circle cx={404} cy={84} r={12} fill={INK} opacity="0.35" />
      <path d="M376 140 L420 100 L448 122 L478 96 L512 128 L512 148 L376 148 Z" fill={INK} opacity="0.35" />
      <text x={368} y={172} fill={INK} fontSize="9" opacity="0.45" fontFamily="var(--mono)" letterSpacing="1">
        GRANDMA &amp; CHI CHI, 1974
      </text>
      {/* savings strip */}
      <rect x={40} y={216} width={480} height={36} fill="none" stroke={INK} strokeWidth="1" opacity="0.4" />
      <rect x={40} y={216} width={302} height={36} fill={INK} opacity="0.18" />
      <text x={52} y={238} fill={INK} fontSize="11" opacity="0.8" fontFamily="var(--mono)">
        CAMP FUND · 63%
      </text>
    </g>
  )
}

function Active() {
  const tiles = [
    ['CALENDAR', 40, 48], ['CHORES', 208, 48], ['SAFETY', 376, 48],
    ['LISTS', 40, 156], ['MONEY', 208, 156], ['PHOTOS', 376, 156],
  ] as const
  return (
    <g>
      {tiles.map(([label, x, y]) => (
        <g key={label}>
          <rect x={x} y={y} width={144} height={92} fill="none" stroke={INK} strokeWidth="1" opacity="0.5" />
          <text x={x + 12} y={y + 24} fill={INK} fontSize="10" opacity="0.8" fontFamily="var(--mono)" letterSpacing="1">
            {label}
          </text>
          <rect x={x + 12} y={y + 40} width={label === 'MONEY' ? 60 : 96} height={8} fill={INK} opacity="0.25" />
          <rect x={x + 12} y={y + 58} width={label === 'CHORES' ? 108 : 72} height={8} fill={INK} opacity="0.18" />
        </g>
      ))}
      {/* member chips — layout is per-person */}
      {['T', 'O', 'M'].map((m, i) => (
        <g key={m}>
          <circle cx={56 + i * 40} cy={272} r={13} fill={i === 1 ? 'var(--accent-expressive)' : INK} opacity={i === 1 ? 1 : 0.4} />
          <text x={56 + i * 40} y={276} textAnchor="middle" fill="#131811" fontSize="11" fontWeight="700" fontFamily="var(--mono)">
            {m}
          </text>
        </g>
      ))}
      <text x={132} y={276} fill={INK} fontSize="9" opacity="0.5" fontFamily="var(--mono)" letterSpacing="1">
        ← OLIVIA&rsquo;S VIEW
      </text>
    </g>
  )
}

function Focused() {
  return (
    <g>
      <text x={W / 2} y={96} textAnchor="middle" fill={INK} fontSize="22" fontFamily="var(--mono)">
        Add a chore
      </text>
      <rect x={140} y={124} width={280} height={44} fill="none" stroke={INK} strokeWidth="1" opacity="0.6" />
      <text x={156} y={151} fill={INK} fontSize="12" opacity="0.55" fontFamily="var(--mono)">
        Walk the dog · 5:00 PM
      </text>
      <rect x={140} y={184} width={280} height={48} fill="var(--accent-expressive)" />
      <text x={W / 2} y={213} textAnchor="middle" fill="#131811" fontSize="13" fontWeight="700" fontFamily="var(--mono)">
        DONE
      </text>
      <text x={W / 2} y={262} textAnchor="middle" fill={INK} fontSize="9" opacity="0.5" fontFamily="var(--mono)" letterSpacing="1">
        ONE BIG DUMB BUTTON. THAT&rsquo;S THE POINT.
      </text>
    </g>
  )
}

export function SurfaceTriad() {
  const [mode, setMode] = useState<Mode>('ambient')
  const reduced = useReducedMotion()
  const current = MODES.find((m) => m.id === mode)!

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, position: 'relative', zIndex: 1 }}>
        {MODES.map((m) => {
          const on = m.id === mode
          return (
            <button
              key={m.id}
              className={styles.moatNode}
              aria-pressed={on}
              onClick={() => {
                sfx.tap()
                setMode(m.id)
              }}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '6px 12px',
                background: on ? 'var(--accent-expressive)' : 'transparent',
                color: on ? '#131811' : '#E7E1D2',
                border: `1px solid ${on ? 'var(--accent-expressive)' : 'rgba(231,225,210,0.4)'}`,
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Hub surface, ${current.label} mode. ${current.blurb}`} fontFamily="var(--mono)">
        <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke={INK} strokeWidth="1.5" opacity="0.6" />
        {/* keyed remount, fade-in only — no exit animation to get stuck on */}
        <motion.g
          key={mode}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {mode === 'ambient' && <Ambient />}
          {mode === 'active' && <Active />}
          {mode === 'focused' && <Focused />}
        </motion.g>
      </svg>

      <div className={styles.moatWhy} aria-live="polite">
        <b>{current.label}</b> — {current.blurb}
      </div>
    </div>
  )
}
