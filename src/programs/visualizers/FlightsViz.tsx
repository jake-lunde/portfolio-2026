'use client'

import { useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import data from './flights-data.json'
import styles from './viz.module.css'

/* Flight log (Flighty export) — every flight as an arc over a line-art
   America, played in order. International airports pin to the frame edge.
   Scrub the timeline to replay the log date by date. */

const W = 640
const H = (data as { viewH: number }).viewH

type Flight = { date: string; airline: string; no: string; from: string; to: string; aircraft: string }

const AIRPORTS = data.airports as Record<string, number[]>
const FLIGHTS = data.flights as Flight[]

function arcPath(from: number[], to: number[]): string {
  const [x1, y1] = from
  const [x2, y2] = to
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const d = Math.hypot(dx, dy) || 1
  // perpendicular lift, always bowing upward
  let nx = -dy / d
  let ny = dx / d
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  const lift = Math.min(40, d * 0.22)
  return `M${x1},${y1}Q${mx + nx * lift},${my + ny * lift} ${x2},${y2}`
}

const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase()

export function FlightsViz() {
  const reduced = useReducedMotion()
  const [idx, setIdx] = useState<number | null>(null)
  const [replay, setReplay] = useState(0)
  const lastIdx = useRef(-1)

  const t0 = useMemo(() => +new Date(FLIGHTS[0].date), [])
  const t1 = useMemo(() => +new Date(FLIGHTS[FLIGHTS.length - 1].date), [])

  const cur = idx !== null ? FLIGHTS[idx] : null
  const visibleCount = idx !== null ? idx + 1 : FLIGHTS.length

  const scrub = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const t = t0 + frac * (t1 - t0)
    let i = 0
    while (i < FLIGHTS.length - 1 && +new Date(FLIGHTS[i + 1].date) <= t) i++
    if (i !== lastIdx.current) {
      lastIdx.current = i
      sfx.tap()
      setIdx(i)
    }
  }

  const thisYear = FLIGHTS.filter((f) => f.date.startsWith('2026')).length

  return (
    <div>
      <div className={styles.rideHead}>
        <h3 className={styles.rideTitle}>“flight log”</h3>
        <span className={styles.rideSub}>
          FLIGHTY · {FLIGHTS[0].date.slice(0, 4)}–{FLIGHTS[FLIGHTS.length - 1].date.slice(2, 4)} · BAKED {data.baked}
        </span>
      </div>

      <div className={styles.hud} role="status" aria-label="Flight readout">
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'Date' : 'Flights'}</span>
          <span className={styles.hudV}>{cur ? fmtDate(cur.date) : FLIGHTS.length}</span>
        </div>
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'Route' : 'Airports'}</span>
          <span className={styles.hudV}>
            {cur ? (
              <>
                {cur.from}<em>→</em>{cur.to}
              </>
            ) : (
              Object.keys(AIRPORTS).length
            )}
          </span>
        </div>
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'Flight' : 'This year'}</span>
          <span className={styles.hudV}>{cur ? `${cur.airline} ${cur.no}` : thisYear}</span>
        </div>
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'Aircraft' : 'Airlines'}</span>
          <span className={styles.hudV} style={{ fontSize: cur ? 12 : undefined }}>
            {cur ? cur.aircraft || '—' : new Set(FLIGHTS.map((f) => f.airline)).size}
          </span>
        </div>
      </div>

      <div className={styles.panel}>
        <span className={styles.panelLabel}>
          {cur ? `LOG ${String(idx! + 1).padStart(2, '0')}/${FLIGHTS.length}` : 'Layer 01 · Route map — scrub the timeline'}
        </span>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Map of ${FLIGHTS.length} flights across ${Object.keys(AIRPORTS).length} airports, arcs drawn in order.`}
        >
          <g fill="none" stroke="#E7E1D2" strokeWidth="0.6" opacity="0.22">
            {(data.states as string[]).map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          <g key={replay}>
            {FLIGHTS.slice(0, visibleCount).map((f, i) => {
              const hot = idx !== null && i === idx
              return (
                <motion.path
                  key={f.date + f.no + i}
                  d={arcPath(AIRPORTS[f.from], AIRPORTS[f.to])}
                  fill="none"
                  stroke={hot ? 'var(--pink)' : 'var(--blue)'}
                  strokeWidth={hot ? 1.8 : 1}
                  opacity={hot ? 1 : 0.55}
                  initial={reduced ? undefined : { pathLength: 0 }}
                  animate={reduced ? undefined : { pathLength: 1 }}
                  transition={{ duration: 0.5, delay: idx === null ? i * 0.09 : 0, ease: 'easeOut' }}
                />
              )
            })}
          </g>

          <g fontFamily="var(--mono)" fontSize="7.5" letterSpacing="0.6">
            {Object.entries(AIRPORTS).map(([code, pos]) => {
              const off = pos.length > 2
              const active = cur && (cur.from === code || cur.to === code)
              return (
                <g key={code} opacity={active ? 1 : 0.6}>
                  <circle
                    cx={pos[0]}
                    cy={pos[1]}
                    r={off ? 4 : 2.2}
                    fill={active ? 'var(--pink)' : '#E7E1D2'}
                    strokeDasharray={off ? '2 2' : undefined}
                    stroke={off ? '#E7E1D2' : undefined}
                    fillOpacity={off ? 0 : 1}
                  />
                  <text x={pos[0] + 5} y={pos[1] + 3} fill={active ? 'var(--pink)' : '#E7E1D2'}>
                    {code}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      <div className={styles.panel}>
        <span className={styles.panelLabel}>Layer 02 · Timeline</span>
        <svg
          viewBox={`0 0 ${W} 44`}
          preserveAspectRatio="none"
          style={{ height: 40 }}
          role="img"
          aria-label="Flight timeline. Drag to scrub through the log."
          onPointerMove={scrub}
          onPointerLeave={() => {
            setIdx(null)
            lastIdx.current = -1
          }}
        >
          <line x1="0" y1="22" x2={W} y2="22" stroke="#E7E1D2" opacity="0.25" />
          {FLIGHTS.map((f, i) => {
            const x = ((+new Date(f.date) - t0) / (t1 - t0 || 1)) * (W - 8) + 4
            const hot = idx !== null && i === idx
            return (
              <line
                key={f.date + i}
                x1={x}
                y1={hot ? 8 : 14}
                x2={x}
                y2={hot ? 36 : 30}
                stroke={hot ? 'var(--pink)' : '#E7E1D2'}
                strokeWidth={hot ? 2 : 1}
                opacity={idx === null || i <= idx ? 0.9 : 0.3}
              />
            )
          })}
        </svg>
      </div>

      <div className={styles.vizNav}>
        <button
          className={styles.vizChip}
          onClick={() => {
            sfx.open()
            setIdx(null)
            setReplay((r) => r + 1)
          }}
        >
          ↻ Replay the log
        </button>
      </div>
    </div>
  )
}
