'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* The avatar-token thread, replayable: my spec said `weakest`; my
   engineering partner's eye said otherwise. Try the three tokens we
   tried. (Contrast tiers abstracted as ink opacities — swap for the
   real Slack screenshots when Jake saves them.) */

type Tier = {
  id: 'weakest' | 'weak' | 'strongest'
  fill: number
  line: string
  who: string
}

const TIERS: Tier[] = [
  { id: 'weakest', fill: 0.14, line: '“Doesn’t look as good on our background color. Weakest blends too much, IMO.”', who: 'the engineer, unprompted — my spec' },
  { id: 'weak', fill: 0.3, line: '“Try weak?” …Still not it.', who: 'me, wrong again' },
  { id: 'strongest', fill: 0.95, line: '“Yes. So much better. I love it. You legend.”', who: 'me — his call shipped' },
]

const INK = '#E7E1D2'

export function TokenThread() {
  const [tier, setTier] = useState<Tier>(TIERS[0])
  const reduced = useReducedMotion()

  return (
    <div>
      <svg
        viewBox="0 0 640 220"
        role="img"
        aria-label={`Avatar container on the hub background using the ${tier.id} token. ${tier.line}`}
        fontFamily="var(--mono)"
      >
        <text x={20} y={26} fill={INK} fontSize="9" opacity="0.5" letterSpacing="1.5">
          HUB SURFACE · AVATAR CONTAINER TOKEN: {tier.id.toUpperCase()}
        </text>

        {/* the avatar row, as on the hub */}
        {[0, 1, 2].map((n) => (
          <g key={n}>
            <motion.circle
              cx={200 + n * 120}
              cy={120}
              r={44}
              fill={INK}
              animate={{ opacity: tier.fill }}
              initial={false}
              transition={reduced ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
            />
            {/* placeholder character — the real ones are 10 illustrated critters × 9 colors */}
            <circle cx={200 + n * 120 - 12} cy={112} r={4} fill="#131811" opacity={0.35 + tier.fill * 0.6} />
            <circle cx={200 + n * 120 + 12} cy={112} r={4} fill="#131811" opacity={0.35 + tier.fill * 0.6} />
            <path
              d={`M ${200 + n * 120 - 12} 134 Q ${200 + n * 120} 144 ${200 + n * 120 + 12} 134`}
              fill="none"
              stroke="#131811"
              strokeWidth="3"
              strokeLinecap="round"
              opacity={0.35 + tier.fill * 0.6}
            />
          </g>
        ))}
      </svg>

      <div style={{ display: 'flex', gap: 8, marginTop: 4, position: 'relative', zIndex: 1 }}>
        {TIERS.map((t) => {
          const on = t.id === tier.id
          return (
            <button
              key={t.id}
              className={styles.moatNode}
              aria-pressed={on}
              onClick={() => {
                sfx.tap()
                setTier(t)
              }}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '6px 12px',
                background: on ? 'var(--accent-expressive)' : 'transparent',
                color: on ? '#131811' : INK,
                border: `1px solid ${on ? 'var(--accent-expressive)' : 'rgba(231,225,210,0.4)'}`,
              }}
            >
              {t.id}
            </button>
          )
        })}
      </div>

      <div className={styles.moatWhy} aria-live="polite">
        <b>{tier.id}</b> — {tier.line}
        <br />
        <span style={{ opacity: 0.6 }}>{tier.who}</span>
      </div>
    </div>
  )
}
