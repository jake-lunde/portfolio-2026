'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* The shipped onboarding, step by step: hub serves a QR, the phone does
   the heavy lifting, the hub reads progress back live. Two screens, one
   flow — the point is that BOTH sides move at every step. */

type Step = {
  hubTitle: string
  hubSub: string
  phoneTitle: string
  phoneSub: string
  note: string
}

const STEPS: Step[] = [
  {
    hubTitle: '[QR]',
    hubSub: 'SCAN TO SET ME UP',
    phoneTitle: 'Camera',
    phoneSub: 'one scan, that’s it',
    note: 'The hub asks for exactly one thing: a scan. Never the on-screen keyboard.',
  },
  {
    hubTitle: 'Waiting…',
    hubSub: 'PHONE CONNECTED ✓',
    phoneTitle: 'Sign in',
    phoneSub: 'Greenlight app · real keyboard',
    note: 'Typing happens on the good keyboard; computing on the good computer.',
  },
  {
    hubTitle: 'The Millers',
    hubSub: 'TANYA ✓ · OLIVIA ✓ · MATEO…',
    phoneTitle: 'Add family',
    phoneSub: 'members, roles, PINs',
    note: 'Each member added on the phone lands on the hub live — avatars animate in as the family assembles.',
  },
  {
    hubTitle: 'Calendars',
    hubSub: '2 OF 3 CONNECTED',
    phoneTitle: 'Sync calendars',
    phoneSub: 'Google · Apple · Outlook',
    note: 'Act on the phone, feel it on the hub. Feedback on both screens, the whole way.',
  },
  {
    hubTitle: '7:42',
    hubSub: 'SOCCER 4:30 — OLIVIA',
    phoneTitle: 'All set',
    phoneSub: 'it’s already working',
    note: 'The pattern stuck: QR deep-links still carry every complex action in the shipped product.',
  },
]

const INK = '#E7E1D2'

export function TandemSetup() {
  const [i, setI] = useState(0)
  const reduced = useReducedMotion()
  const step = STEPS[i]

  const go = (next: number) => {
    sfx.tap()
    setI(Math.max(0, Math.min(STEPS.length - 1, next)))
  }

  const fade = reduced
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } }

  return (
    <div>
      <svg
        viewBox="0 0 640 260"
        role="img"
        aria-label={`Paired onboarding, step ${i + 1} of ${STEPS.length}. Hub: ${step.hubTitle} ${step.hubSub}. Phone: ${step.phoneTitle}, ${step.phoneSub}.`}
        fontFamily="var(--mono)"
      >
        {/* hub — 15.6", landscape */}
        <rect x={20} y={30} width={360} height={210} fill="none" stroke={INK} strokeWidth="1.5" opacity="0.7" />
        <text x={20} y={20} fill={INK} fontSize="9" opacity="0.5" letterSpacing="1.5">
          FAMILY HUB · 15&Prime;
        </text>

        {/* phone — portrait, in a hand */}
        <rect x={478} y={30} width={118} height={210} rx={12} fill="none" stroke={INK} strokeWidth="1.5" opacity="0.7" />
        <text x={478} y={20} fill={INK} fontSize="9" opacity="0.5" letterSpacing="1.5">
          THE GOOD KEYBOARD
        </text>

        {/* the tether */}
        <line x1={380} y1={135} x2={478} y2={135} stroke="var(--accent-expressive)" strokeWidth="1.4" strokeDasharray="4 5" />
        <circle cx={429} cy={135} r={3.5} fill="var(--accent-expressive)" />

        {/* keyed remount, fade-in only — no exit animation to get stuck on */}
        <motion.g key={i} {...fade} transition={{ duration: 0.2, ease: 'easeOut' }}>
            <text x={200} y={125} textAnchor="middle" fill={INK} fontSize="26">
              {step.hubTitle}
            </text>
            <text x={200} y={156} textAnchor="middle" fill="var(--accent-expressive)" fontSize="10" letterSpacing="1.5">
              {step.hubSub}
            </text>
            <text x={537} y={125} textAnchor="middle" fill={INK} fontSize="13">
              {step.phoneTitle}
            </text>
            <text x={537} y={148} textAnchor="middle" fill={INK} fontSize="8.5" opacity="0.6">
              {step.phoneSub}
            </text>
        </motion.g>
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, position: 'relative', zIndex: 1 }}>
        <button
          className={styles.moatNode}
          aria-label="Previous step"
          disabled={i === 0}
          onClick={() => go(i - 1)}
          style={{
            fontFamily: 'var(--mono)', fontSize: 12, padding: '5px 12px', background: 'transparent',
            color: INK, border: '1px solid rgba(231,225,210,0.4)', opacity: i === 0 ? 0.3 : 1,
          }}
        >
          ←
        </button>
        <div style={{ display: 'flex', gap: 7 }} aria-hidden="true">
          {STEPS.map((_, d) => (
            <span
              key={d}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: d === i ? 'var(--accent-expressive)' : 'rgba(231,225,210,0.3)',
              }}
            />
          ))}
        </div>
        <button
          className={styles.moatNode}
          aria-label="Next step"
          disabled={i === STEPS.length - 1}
          onClick={() => go(i + 1)}
          style={{
            fontFamily: 'var(--mono)', fontSize: 12, padding: '5px 12px', background: 'transparent',
            color: INK, border: '1px solid rgba(231,225,210,0.4)', opacity: i === STEPS.length - 1 ? 0.3 : 1,
          }}
        >
          →
        </button>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(231,225,210,0.5)' }}>
          STEP {i + 1} / {STEPS.length}
        </span>
      </div>

      <div className={styles.moatWhy} aria-live="polite">
        {step.note}
      </div>
    </div>
  )
}
