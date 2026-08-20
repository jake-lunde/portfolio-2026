'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import { HUB_MODE_LABELS, HUB_SHOTS, HUB_SHOT_DIR, HUB_SHOT_MS, type HubMode } from './hubShipped'
import { useHubLink } from './hubLink'
import styles from './case.module.css'

/* The shipped interaction model: Ambient (the heads-up screensaver) →
   Active (walk up, full dashboard, filter per member) → Authenticated
   (PIN gate before anything consequential). Two modes plus the auth
   layer — per Jake's s35 correction; no "focused" tier.

   s89: the old FIG. D plate (shipped surfaces, a placeholder) folded in
   here, then split across windows: the page argues, the viewer holds
   the evidence. Wherever PROGRESS.VWR rides the margin (container
   ≥640px, the rail's own threshold) the mode tabs here drive the
   shipped screens THERE, via the hubLink store, and this plate shows
   the lo-fi diagram only. Below that the rail doesn't exist, so the
   plate keeps its own Lo-fi/Shipped toggle and carries everything
   itself. The swap is pure CSS (container query) — both panes render,
   the container decides which one is real. */

type Mode = HubMode
type View = 'diagram' | 'shipped'

const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'diagram', label: 'Lo-fi' },
  { id: 'shipped', label: 'Shipped' },
]

const MODES: Array<{ id: Mode; label: string; blurb: string }> = [
  { id: 'ambient', label: HUB_MODE_LABELS.ambient, blurb: 'The screensaver with a job. From across the room you get the time, what’s next, who’s where, the photo stream. It asks nothing of you.' },
  { id: 'active', label: HUB_MODE_LABELS.active, blurb: 'Walk up and it’s a full dashboard. Drill into any feature, open modal views, filter the whole surface down to one family member.' },
  { id: 'auth', label: HUB_MODE_LABELS.auth, blurb: 'The gate. Adults manage, kids view. A PIN sits between glancing and doing: approvals, money, calendar edits.' },
]

const INK = '#E7E1D2'
const W = 560
/* 16:9-ish on purpose: the diagram and the shipped screens share one
   viewport, so their ratios have to match or the plate jumps on toggle */
const H = 315

function Ambient() {
  return (
    <g>
      <text x={40} y={128} fill={INK} fontSize="64" fontWeight="700" fontFamily="var(--mono)">
        7:42
      </text>
      <text x={42} y={156} fill={INK} fontSize="12" opacity="0.6" fontFamily="var(--mono)">
        THU · SOCCER 4:30 · OLIVIA
      </text>
      {/* photo memory */}
      <rect x={368} y={48} width={152} height={108} fill="none" stroke={INK} strokeWidth="1" opacity="0.5" />
      <circle cx={404} cy={84} r={12} fill={INK} opacity="0.35" />
      <path d="M376 140 L420 100 L448 122 L478 96 L512 128 L512 148 L376 148 Z" fill={INK} opacity="0.35" />
      <text x={368} y={172} fill={INK} fontSize="9" opacity="0.45" fontFamily="var(--mono)" letterSpacing="1">
        GRANDMA &amp; CHI CHI, 1974
      </text>
      {/* who's-where strip */}
      <rect x={40} y={216} width={480} height={36} fill="none" stroke={INK} strokeWidth="1" opacity="0.4" />
      <text x={52} y={238} fill={INK} fontSize="11" opacity="0.8" fontFamily="var(--mono)">
        EVERYONE BUT TANYA IS HOME · SHE&rsquo;S AT WORK
      </text>
    </g>
  )
}

function Active() {
  const tiles = [
    ['CALENDAR', 40, 48], ['CHORES', 208, 48], ['LOCATION', 376, 48],
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
      {/* member filter — the whole surface re-scopes per person */}
      {['T', 'O', 'M'].map((m, i) => (
        <g key={m}>
          <circle cx={56 + i * 40} cy={272} r={13} fill={i === 1 ? 'var(--accent-expressive)' : INK} opacity={i === 1 ? 1 : 0.4} />
          <text x={56 + i * 40} y={276} textAnchor="middle" fill="#131811" fontSize="11" fontWeight="700" fontFamily="var(--mono)">
            {m}
          </text>
        </g>
      ))}
      <text x={160} y={276} fill={INK} fontSize="9" opacity="0.5" fontFamily="var(--mono)" letterSpacing="1">
        ← FILTERED TO OLIVIA
      </text>
    </g>
  )
}

function Auth() {
  return (
    <g>
      {/* the dashboard, held behind the gate */}
      <g opacity="0.18">
        {[[40, 48], [208, 48], [376, 48], [40, 156], [208, 156], [376, 156]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={144} height={92} fill="none" stroke={INK} strokeWidth="1" />
        ))}
      </g>
      <rect x={165} y={78} width={230} height={140} fill="#131811" stroke={INK} strokeWidth="1" opacity="0.97" />
      <text x={W / 2} y={112} textAnchor="middle" fill={INK} fontSize="10" letterSpacing="1.5" fontFamily="var(--mono)">
        PARENT PIN
      </text>
      {[0, 1, 2, 3].map((d) => (
        <circle key={d} cx={238 + d * 28} cy={140} r={6} fill={d < 3 ? 'var(--accent-expressive)' : 'none'} stroke={INK} strokeWidth="1" opacity={d < 3 ? 1 : 0.5} />
      ))}
      <text x={W / 2} y={186} textAnchor="middle" fill={INK} fontSize="10" opacity="0.6" fontFamily="var(--mono)">
        Approve Olivia&rsquo;s chore · $5.00
      </text>
      <text x={W / 2} y={262} textAnchor="middle" fill={INK} fontSize="9" opacity="0.5" fontFamily="var(--mono)" letterSpacing="1">
        ADULTS MANAGE · KIDS VIEW · STRAIGHT FROM THE RESEARCH
      </text>
    </g>
  )
}

export function HubModes() {
  const [mode, setMode] = useState<Mode>('ambient')
  const [view, setView] = useState<View>('diagram')
  const [shot, setShot] = useState(0)
  const [held, setHeld] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.35 })
  const reduced = useReducedMotion()
  const setLink = useHubLink((s) => s.set)
  const current = MODES.find((m) => m.id === mode)!
  const shots = HUB_SHOTS[mode]
  const shipped = view === 'shipped'

  /* broadcast to the rail: which mode, and whether the plate is on
     screen enough to borrow the viewer */
  useEffect(() => {
    setLink({ mode })
  }, [mode, setLink])
  useEffect(() => {
    setLink({ live: inView })
    return () => setLink({ live: false })
  }, [inView, setLink])

  /* the plate's own cycle — only runs when its shipped pane is the one
     showing (narrow layouts), on screen, and nobody's pointing at it */
  useEffect(() => {
    if (!shipped || reduced || held || !inView || shots.length < 2) return
    const t = setInterval(() => setShot((i) => (i + 1) % shots.length), HUB_SHOT_MS)
    return () => clearInterval(t)
  }, [shipped, reduced, held, inView, shots.length])

  return (
    <div ref={rootRef}>
      <div className={styles.hubHead}>
        <div className={styles.hubViews} role="group" aria-label="View">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={styles.hubView}
              aria-pressed={v.id === view}
              onClick={() => {
                sfx.tap()
                setView(v.id)
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        {shipped && (
          <span className={styles.hubCount}>
            {String(shot + 1).padStart(2, '0')} / {String(shots.length).padStart(2, '0')}
          </span>
        )}
        {/* wide layouts only (CSS): where the screens went */}
        <span className={styles.hubHint} aria-hidden="true">
          shipped → progress.vwr
        </span>
      </div>

      <div className={styles.hubStage} data-view={view}>
        <div data-pane="diagram">
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
              {mode === 'auth' && <Auth />}
            </motion.g>
          </svg>
        </div>

        <button
          type="button"
          data-pane="shipped"
          className={styles.hubShip}
          aria-label={`${current.label} as shipped, screen ${shot + 1} of ${shots.length}. Next screen.`}
          onClick={() => {
            sfx.tap()
            setShot((i) => (i + 1) % shots.length)
          }}
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
        >
          {shots.map((s, i) => (
            <motion.img
              key={s.file}
              src={`${HUB_SHOT_DIR}/${s.file}.webp`}
              width={1086}
              height={610}
              alt={i === shot ? s.alt : ''}
              aria-hidden={i === shot ? undefined : true}
              loading="lazy"
              draggable={false}
              animate={{ opacity: i === shot ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 0.4, ease: 'easeOut' }}
            />
          ))}
        </button>
      </div>

      <div className={styles.hubTabs}>
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
                setShot(0)
              }}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '8px 12px',
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

      <div className={styles.moatWhy} aria-live="polite">
        {current.blurb}
      </div>
    </div>
  )
}
