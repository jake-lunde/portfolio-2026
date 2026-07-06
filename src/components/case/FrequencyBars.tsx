'use client'

import { motion, useReducedMotion } from 'motion/react'

/* Invest's signature motif — vertical hairline bars, one pink peak
   ("920.12 FT" reference). Draws on view; instant under reduced motion. */

const BARS = [
  55, 70, 50, 80, 62, 90, 72, 100, 84, 110, 120, 98, 106, 88, 102, 80, 92, 68, 86, 60, 76, 52,
]

const PEAK_INDEX = 10
const W = 320
const H = 150

export function FrequencyBars() {
  const reduced = useReducedMotion()
  const step = 14

  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} role="img" aria-label="Adoption signal: a series of frequency bars with one pink peak marking the redesign's release.">
      <g fill="#E7E1D2">
        {BARS.map((h, i) => (
          <motion.rect
            key={i}
            x={i * step}
            y={H - h}
            width="6"
            height={h}
            fill={i === PEAK_INDEX ? 'var(--pink)' : undefined}
            opacity={i === PEAK_INDEX ? 1 : 0.3}
            style={{ originY: '100%', transformBox: 'fill-box' }}
            initial={reduced ? undefined : { scaleY: 0 }}
            whileInView={reduced ? undefined : { scaleY: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </g>
      <motion.g
        initial={reduced ? undefined : { opacity: 0 }}
        whileInView={reduced ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7 }}
      >
        <circle cx={PEAK_INDEX * step + 3} cy={H - BARS[PEAK_INDEX] - 8} r="5" fill="var(--pink)" />
        <text
          x={PEAK_INDEX * step + 3}
          y={H - BARS[PEAK_INDEX] - 18}
          textAnchor="middle"
          fill="var(--pink)"
          fontFamily="var(--mono)"
          fontSize="9"
        >
          PEAK
        </text>
      </motion.g>
    </svg>
  )
}
