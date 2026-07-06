'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* Economic Moat — concentric rings, company at center, rivals outward.
   Tap a node for why it's ranked there. (CLAUDE.md §6; facts per
   portfolio-tracker.md: Peacock = Comcast, CMCSA.) */

type Node = {
  id: string
  label: string
  ring: 1 | 2 | 3
  x: number
  y: number
  why: string
}

const CX = 225
const CY = 160
const RINGS = [50, 95, 136]

const NODES: Node[] = [
  { id: 'dis', label: 'Disney', ring: 1, x: 225, y: 108, why: 'Closest rival — the deepest kids catalog and the strongest brand pull in the ring.' },
  { id: 'amzn', label: 'Amazon', ring: 1, x: 277, y: 160, why: 'Prime bundles video in "for free" — a rival by distribution, not devotion.' },
  { id: 'aapl', label: 'Apple', ring: 2, x: 152, y: 212, why: 'Bottomless budget, smaller catalog. Dangerous, but not yet adjacent.' },
  { id: 'goog', label: 'Google', ring: 3, x: 158, y: 47, why: 'YouTube owns attention, not subscriptions — a different orbit, for now.' },
  { id: 'cmcsa', label: 'Comcast', ring: 3, x: 330, y: 250, why: 'Owns Peacock (CMCSA) — a cost advantage from the NBC library it already holds.' },
]

const RING_NAMES = ['', 'Closest rivals', 'Competitors', 'Distant threats']

export function MoatDiagram() {
  const [sel, setSel] = useState<Node | null>(null)
  const reduced = useReducedMotion()

  const pick = (n: Node) => {
    sfx.tap()
    setSel((cur) => (cur?.id === n.id ? null : n))
  }

  return (
    <div>
      <svg
        viewBox="0 0 640 320"
        role="img"
        aria-label="Economic Moat diagram: Netflix at center, Disney and Amazon in the closest-rivals ring, Apple in the competitors ring, Google and Comcast in the distant-threats ring."
        fontFamily="var(--mono)"
      >
        {RINGS.map((r, i) => (
          <motion.circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke="#E7E1D2"
            strokeWidth="1"
            opacity={0.35 - i * 0.06}
            strokeDasharray={i > 0 ? '2 4' : undefined}
            initial={reduced ? undefined : { pathLength: 0 }}
            whileInView={reduced ? undefined : { pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.15, ease: 'easeOut' }}
          />
        ))}

        {/* center company — the one pink thing on screen */}
        <circle cx={CX} cy={CY} r="29" fill="var(--pink)" />
        <text x={CX} y={CY + 4} textAnchor="middle" fill="#131811" fontSize="13" fontWeight="700">
          NFLX
        </text>

        {NODES.map((n) => {
          const active = sel?.id === n.id
          const dim = 1 - (n.ring - 1) * 0.2
          return (
            <g
              key={n.id}
              className={styles.moatNode}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={`${n.label}, ring ${n.ring}: ${RING_NAMES[n.ring]}. ${n.why}`}
              onClick={() => pick(n)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  pick(n)
                }
              }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={active ? 6 : 4}
                fill={active ? 'var(--pink)' : '#E7E1D2'}
                opacity={active ? 1 : dim}
              />
              <text
                x={n.x}
                y={n.y - 11}
                textAnchor="middle"
                fill={active ? 'var(--pink)' : '#E7E1D2'}
                fontSize="11"
                opacity={active ? 1 : dim}
              >
                {n.label}
              </text>
            </g>
          )
        })}

        <g fontSize="9" fill="#E7E1D2" opacity="0.5" letterSpacing="1">
          <text x={468} y={120}>— CLOSEST RIVALS</text>
          <text x={468} y={150}>— COMPETITORS</text>
          <text x={468} y={180}>— DISTANT THREATS</text>
        </g>
      </svg>

      <div className={styles.moatWhy} aria-live="polite">
        {sel ? (
          <>
            <b>{sel.label}</b> · ring {sel.ring} — {RING_NAMES[sel.ring].toLowerCase()}
            <br />
            {sel.why}
          </>
        ) : (
          <>Tap a company to see why it sits where it does.</>
        )}
      </div>
    </div>
  )
}
