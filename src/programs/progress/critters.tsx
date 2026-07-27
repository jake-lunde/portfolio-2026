'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'

/* WIP-15 · The leaf patch — hand-drawn cast for the Case Studies program.
   One-ink chunky riso language: solid ink blobs (var(--content)), segment
   seams and googly-eye whites punched in the page color (var(--surface)),
   the leaf itself filled with the system accent so it still reads as the
   progress meter it replaced.

   Rules honored here:
   · NO useId — programs are dynamic imports and the tree reshapes at SSR
     handover, so a generated id desyncs. These drawings therefore use no
     ids at all (no masks, no gradients, no clip paths).
   · Every drawing is decorative: aria-hidden + focusable={false}. Meaning
     is carried by the meter's aria-* and a visually-hidden stage string.
   · Colors are token vars only; nothing hardcoded.
   · Motion: springs come from SPRINGS, transform/opacity only, and
     useReducedMotion collapses the entrance to a static appear. */

export type Stage = 'egg' | 'caterpillar' | 'butterfly'

/** pct is the only input: 0 = egg, 1–99 = eating, 100 = flown. */
export function stageFor(pct: number): Stage {
  if (pct >= 100) return 'butterfly'
  if (pct <= 0) return 'egg'
  return 'caterpillar'
}

const INK = 'var(--content)'
const PAGE = 'var(--surface)'

type SvgProps = { className?: string }

const deco = {
  'aria-hidden': true as const,
  focusable: 'false' as const,
  xmlns: 'http://www.w3.org/2000/svg',
}

/* ---------------- egg ---------------- */

export function Egg({ className }: SvgProps) {
  return (
    <svg {...deco} viewBox="0 0 24 26" className={className}>
      <path
        d="M12 3.5C16.6 3.5 19 9 19 13.8C19 18.4 15.9 22.5 12 22.5C8.1 22.5 5 18.4 5 13.8C5 9 7.4 3.5 12 3.5Z"
        fill={INK}
      />
      <circle cx="9.6" cy="12.5" r="1.7" fill={PAGE} />
      <circle cx="14" cy="17" r="1.2" fill={PAGE} />
      <circle cx="13.5" cy="9" r="1" fill={PAGE} />
    </svg>
  )
}

/* ---------------- caterpillar (side view) ---------------- */

export function Caterpillar({ className }: SvgProps) {
  return (
    <svg {...deco} viewBox="0 0 48 26" className={className}>
      {/* legs first so the segments sit on top of them */}
      <g fill={INK}>
        <rect x="10.8" y="17" width="2.4" height="6.4" rx="1.2" />
        <rect x="19.8" y="17" width="2.4" height="6.4" rx="1.2" />
        <rect x="28.8" y="17" width="2.4" height="6.4" rx="1.2" />
      </g>
      {/* antennae, behind the head */}
      <g stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M37 9C36 6 35 5 34 3.5" />
        <path d="M41.5 9.2C42.5 6.5 43.5 5.5 44.5 4" />
      </g>
      {/* segmented humps, tail → head; the page-colored stroke is the seam */}
      <g fill={INK} stroke={PAGE} strokeWidth="1.2">
        <circle cx="6" cy="15" r="4.2" />
        <circle cx="13.5" cy="14" r="5" />
        <circle cx="21.5" cy="13.5" r="5.4" />
        <circle cx="30" cy="14" r="5.6" />
        <circle cx="39" cy="14.5" r="6.4" />
      </g>
      {/* googly eye */}
      <circle cx="41.5" cy="13" r="2.4" fill={PAGE} />
      <circle cx="42.2" cy="13.3" r="1.2" fill={INK} />
    </svg>
  )
}

/* ---------------- caterpillar, front-on, rising ---------------- */

export function CaterpillarPeek({ className }: SvgProps) {
  return (
    <svg {...deco} viewBox="0 0 40 48" className={className}>
      <g stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M15.5 8.2C13.5 4.5 11.5 3 9.5 1.6" />
        <path d="M24.5 8.2C26.5 4.5 28.5 3 30.5 1.6" />
      </g>
      {/* body runs off the bottom edge — the slot clips it, so it reads as
          a caterpillar coming up out of the header's rule */}
      <g fill={INK} stroke={PAGE} strokeWidth="1.4">
        <circle cx="21" cy="45" r="9" />
        <circle cx="17.5" cy="31" r="8" />
        <circle cx="20" cy="15.5" r="9.5" />
      </g>
      <circle cx="16" cy="14.5" r="3.2" fill={PAGE} />
      <circle cx="16.7" cy="15" r="1.6" fill={INK} />
      <circle cx="24" cy="14.5" r="3.2" fill={PAGE} />
      <circle cx="24.7" cy="15" r="1.6" fill={INK} />
    </svg>
  )
}

/* ---------------- butterfly ---------------- */

export function Butterfly({ className }: SvgProps) {
  return (
    <svg {...deco} viewBox="0 0 40 32" className={className}>
      <g stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M18 3.6C16.5 1.5 15 0.9 13.6 0.6" />
        <path d="M22 3.6C23.5 1.5 25 0.9 26.4 0.6" />
      </g>
      <g fill={INK} stroke={PAGE} strokeWidth="1">
        <path d="M19 13C14 3.5 4 2 2.5 9C1.2 15.5 8.5 17.5 18 16.5Z" />
        <path d="M21 13C26 3.5 36 2 37.5 9C38.8 15.5 31.5 17.5 22 16.5Z" />
        <path d="M19 18C13 19 5.5 21 6.5 26.5C7.5 31 15 28.5 19 23.5Z" />
        <path d="M21 18C27 19 34.5 21 33.5 26.5C32.5 31 25 28.5 21 23.5Z" />
      </g>
      {/* riso dots punched out of the wings */}
      <g fill={PAGE}>
        <circle cx="9" cy="9" r="2.3" />
        <circle cx="31" cy="9" r="2.3" />
        <circle cx="11" cy="24" r="1.5" />
        <circle cx="29" cy="24" r="1.5" />
      </g>
      <rect x="17.4" y="6" width="5.2" height="21" rx="2.6" fill={INK} />
      <circle cx="20" cy="6.5" r="4" fill={INK} />
      <circle cx="21.5" cy="6" r="1.7" fill={PAGE} />
      <circle cx="21.9" cy="6.2" r="0.85" fill={INK} />
    </svg>
  )
}

/* ---------------- the leaf, which is also the meter ---------------- */

/** Nine pre-authored leaf silhouettes, 0–8 bites, chewed tip → stem. All
    nine ship in the markup; exactly one is visible, switched by
    `opacity: 0 | 1` on its group. Nothing morphs, nothing is masked, no
    ids, no layout changes — the footprint is the same 64×32 at every state.

    Each state carries four parts:
      blade  — the remaining leaf, ink-outlined *including* the bitten edge,
               so a chomp reads as a proper gnawed scallop rather than a
               colour-fill notch (this is the fix the first pass lacked).
      rib    — the exposed skeleton: bare ink midrib where the blade is gone.
               Drawn under the blade, so the overlap is hidden.
      midrib — the page-coloured rib *on* whatever blade survives.
      veins  — only the pairs that still sit on the blade.

    Geometry was solved once against the blade's Béziers (the frontier x per
    state, de Casteljau split, mirrored for the underside) — see
    scratchpad/gen-leaf-states.mjs for the derivation. */
type LeafState = {
  blade: string
  rib: readonly [number, number] | null
  midrib: readonly [number, number] | null
  veins: readonly string[]
}

const LEAF_STATES: readonly LeafState[] = [
  {
    // 0/8 — blade chewed back to x 2
    blade:
      'M2 16C13 6 22 2.5 34 2.5C48 2.5 57.5 8.5 57.5 16C57.5 23.5 48 29.5 34 29.5C22 29.5 13 26 2 16Z',
    rib: null,
    midrib: [6, 53],
    veins: ['M30 16L22 8.5', 'M30 16L22 23.5', 'M44 16L36 9', 'M44 16L36 23'],
  },
  {
    // 1/8 — blade chewed back to x 9
    blade:
      'M9 10.33C17.09 4.63 24.63 2.5 34 2.5C48 2.5 57.5 8.5 57.5 16C57.5 23.5 48 29.5 34 29.5C24.63 29.5 17.09 27.37 9 21.67A2.86 2.86 0 0 0 9 16A2.86 2.86 0 0 0 9 10.33Z',
    rib: [4, 13.5],
    midrib: [13, 53],
    veins: ['M30 16L22 8.5', 'M30 16L22 23.5', 'M44 16L36 9', 'M44 16L36 23'],
  },
  {
    // 2/8 — blade chewed back to x 15
    blade:
      'M15 6.7C20.97 3.7 26.97 2.5 34 2.5C48 2.5 57.5 8.5 57.5 16C57.5 23.5 48 29.5 34 29.5C26.97 29.5 20.97 28.3 15 25.3A4.69 4.69 0 0 0 15 16A4.69 4.69 0 0 0 15 6.7Z',
    rib: [4, 21],
    midrib: [20.5, 53],
    veins: ['M30 16L22 8.5', 'M30 16L22 23.5', 'M44 16L36 9', 'M44 16L36 23'],
  },
  {
    // 3/8 — blade chewed back to x 22
    blade:
      'M22 3.99C25.77 2.95 29.69 2.5 34 2.5C48 2.5 57.5 8.5 57.5 16C57.5 23.5 48 29.5 34 29.5C29.69 29.5 25.77 29.05 22 28.01A4.04 4.04 0 0 0 22 20A4.04 4.04 0 0 0 22 12A4.04 4.04 0 0 0 22 3.99Z',
    rib: [4, 27.5],
    midrib: [27, 53],
    veins: ['M44 16L36 9', 'M44 16L36 23'],
  },
  {
    // 4/8 — blade chewed back to x 29
    blade:
      'M29 2.73C30.61 2.57 32.28 2.5 34 2.5C48 2.5 57.5 8.5 57.5 16C57.5 23.5 48 29.5 34 29.5C32.28 29.5 30.61 29.43 29 29.27A4.47 4.47 0 0 0 29 20.42A4.47 4.47 0 0 0 29 11.58A4.47 4.47 0 0 0 29 2.73Z',
    rib: [4, 34.8],
    midrib: [34.3, 53],
    veins: ['M44 16L36 9', 'M44 16L36 23'],
  },
  {
    // 5/8 — blade chewed back to x 35
    blade:
      'M35 2.51C48.45 2.79 57.5 8.68 57.5 16C57.5 23.32 48.45 29.21 35 29.49A4.54 4.54 0 0 0 35 20.5A4.54 4.54 0 0 0 35 11.5A4.54 4.54 0 0 0 35 2.51Z',
    rib: [4, 40.9],
    midrib: [40.4, 53],
    veins: [],
  },
  {
    // 6/8 — blade chewed back to x 40.5
    blade:
      'M40.5 2.96C50.86 4.51 57.5 9.73 57.5 16C57.5 22.27 50.86 27.49 40.5 29.04A4.39 4.39 0 0 0 40.5 20.35A4.39 4.39 0 0 0 40.5 11.65A4.39 4.39 0 0 0 40.5 2.96Z',
    rib: [4, 46.3],
    midrib: [45.8, 53],
    veins: [],
  },
  {
    // 7/8 — blade chewed back to x 45.5
    blade:
      'M45.5 4.07C52.95 6.33 57.5 10.81 57.5 16C57.5 21.19 52.95 25.67 45.5 27.93A4.02 4.02 0 0 0 45.5 19.98A4.02 4.02 0 0 0 45.5 12.02A4.02 4.02 0 0 0 45.5 4.07Z',
    rib: [4, 51],
    midrib: [50.5, 53],
    veins: [],
  },
  {
    // 8/8 — blade chewed back to x 50
    blade:
      'M50 5.88C54.74 8.35 57.5 11.96 57.5 16C57.5 20.04 54.74 23.65 50 26.12A5.11 5.11 0 0 0 50 16A5.11 5.11 0 0 0 50 5.88Z',
    rib: [4, 55],
    midrib: null,
    veins: [],
  },
]

export function Leaf({ pct, className }: SvgProps & { pct: number }) {
  const eaten = Math.max(0, Math.min(8, Math.round((pct / 100) * 8)))
  return (
    <svg {...deco} viewBox="0 0 64 32" className={className} preserveAspectRatio="xMidYMid meet">
      {/* the stem survives everything */}
      <path d="M55 16H62.5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {LEAF_STATES.map((s, i) => (
        <g key={s.blade} opacity={i === eaten ? 1 : 0}>
          {s.rib && (
            <path
              d={`M${s.rib[0]} 16H${s.rib[1]}`}
              stroke={INK}
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          )}
          <path
            d={s.blade}
            fill="var(--accent)"
            stroke={INK}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <g stroke={PAGE} strokeLinecap="round" fill="none">
            {s.midrib && <path d={`M${s.midrib[0]} 16H${s.midrib[1]}`} strokeWidth="2" />}
            {s.veins.map((v) => (
              <path key={v} d={v} strokeWidth="1.6" />
            ))}
          </g>
        </g>
      ))}
    </svg>
  )
}

/* ---------------- entrance ---------------- */

/** Pops its child up from below, out of whatever edge the parent slot
    clips against (see `.peek` / `.critter` — both are overflow: hidden).
    SPRINGS.rise is the loosest spring in the set (damping 20), so it
    overshoots a touch: the critter arrives with a bounce, then settles. */
export function PopIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ y: '62%', opacity: 0, rotate: -9 }}
      animate={{ y: '0%', opacity: 1, rotate: 0 }}
      transition={{ ...SPRINGS.rise, delay }}
    >
      {children}
    </motion.div>
  )
}

/** The row's stage portrait. Decorative — the stage is announced by a
    visually-hidden string next to it, not by this. */
export function StageCritter({ stage, className }: SvgProps & { stage: Stage }) {
  if (stage === 'butterfly') return <Butterfly className={className} />
  if (stage === 'egg') return <Egg className={className} />
  return <Caterpillar className={className} />
}
