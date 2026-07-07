'use client'

import { useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import data from './ride-data.json'
import styles from './viz.module.css'

/* Latest ride (Strava GPX, baked to local meters — no geo coordinates).
   Three synced layers per the spec: geography, elevation, speed.
   Hover/drag anywhere to scrub the ride; every mile ticks. */

type Pt = { x: number; y: number; ele: number; mph: number; mi: number; s: number }

const MAP_W = 640
const MAP_H = 330
const STRIP_W = 640
const STRIP_H = 78
const PAD = 16

const fmtClock = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

export function RideViz() {
  const reduced = useReducedMotion()
  const [idx, setIdx] = useState<number | null>(null)
  const lastMile = useRef(-1)

  const pts: Pt[] = useMemo(
    () => (data.points as number[][]).map(([x, y, ele, mph, mi, s]) => ({ x, y, ele, mph, mi, s })),
    []
  )

  // project route into the map viewBox, preserving aspect
  const proj = useMemo(() => {
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const k = Math.min((MAP_W - PAD * 2) / (maxX - minX), (MAP_H - PAD * 2) / (maxY - minY))
    const ox = (MAP_W - (maxX - minX) * k) / 2
    const oy = (MAP_H - (maxY - minY) * k) / 2
    return pts.map((p) => [ox + (p.x - minX) * k, oy + (p.y - minY) * k] as const)
  }, [pts])

  const totalMi = pts[pts.length - 1].mi
  const eleMin = Math.min(...pts.map((p) => p.ele))
  const eleMax = Math.max(...pts.map((p) => p.ele))
  const mphMax = Math.max(...pts.map((p) => p.mph))

  const stripX = (p: Pt) => (p.mi / totalMi) * STRIP_W
  const eleY = (p: Pt) =>
    STRIP_H - 8 - ((p.ele - eleMin) / (eleMax - eleMin || 1)) * (STRIP_H - 24)
  const mphY = (p: Pt) => STRIP_H - 8 - (p.mph / (mphMax || 1)) * (STRIP_H - 24)

  const routePath = useMemo(
    () => 'M' + proj.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L'),
    [proj]
  )
  const elePath = useMemo(
    () =>
      'M' + pts.map((p) => `${stripX(p).toFixed(1)},${eleY(p).toFixed(1)}`).join('L'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pts]
  )
  const mphPath = useMemo(
    () =>
      'M' + pts.map((p) => `${stripX(p).toFixed(1)},${mphY(p).toFixed(1)}`).join('L'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pts]
  )

  const scrubTo = (i: number) => {
    const mile = Math.floor(pts[i].mi)
    if (mile !== lastMile.current) {
      lastMile.current = mile
      if (mile > 0) sfx.tap()
    }
    setIdx(i)
  }

  // strips scrub by distance fraction
  const scrubStrip = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const targetMi = frac * totalMi
    let lo = 0, hi = pts.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (pts[mid].mi < targetMi) lo = mid + 1
      else hi = mid
    }
    scrubTo(lo)
  }

  // map scrubs by nearest route point
  const scrubMap = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * MAP_W
    const py = ((e.clientY - rect.top) / rect.height) * MAP_H
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < proj.length; i++) {
      const dx = proj[i][0] - px
      const dy = proj[i][1] - py
      const d = dx * dx + dy * dy
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    scrubTo(best)
  }

  const clear = () => {
    setIdx(null)
    lastMile.current = -1
  }

  const cur = idx !== null ? pts[idx] : null
  const curXY = idx !== null ? proj[idx] : null

  return (
    <div>
      <div className={styles.rideHead}>
        <h3 className={styles.rideTitle}>“{data.name}”</h3>
        <span className={styles.rideSub}>
          {data.date} · {String(data.type).toUpperCase()} · STRAVA
        </span>
      </div>

      <div className={styles.hud} role="status" aria-label="Ride readout">
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'T+' : 'Moving'}</span>
          <span className={styles.hudV}>{cur ? fmtClock(cur.s) : fmtClock(data.stats.movingMin * 60)}</span>
        </div>
        <div className={styles.hudCell}>
          <span className={styles.hudK}>Dist</span>
          <span className={styles.hudV}>
            {cur ? cur.mi.toFixed(2) : data.stats.distanceMi} <em>mi</em>
          </span>
        </div>
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'Speed' : 'Avg speed'}</span>
          <span className={styles.hudV}>
            {cur ? cur.mph.toFixed(1) : data.stats.avgMph} <em>mph</em>
          </span>
        </div>
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'Elev' : 'Elev gain'}</span>
          <span className={styles.hudV}>
            {cur ? Math.round(cur.ele) : `+${data.stats.elevGainFt}`} <em>ft</em>
          </span>
        </div>
      </div>

      {/* geography */}
      <div className={styles.panel}>
        <span className={styles.panelLabel}>Layer 01 · Geography</span>
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          role="img"
          aria-label={`Route map of the ride, ${data.stats.distanceMi} miles. Drag to scrub.`}
          onPointerMove={scrubMap}
          onPointerLeave={clear}
        >
          <motion.path
            d={routePath}
            fill="none"
            stroke="var(--blue)"
            strokeWidth="1.8"
            strokeLinejoin="round"
            initial={reduced ? undefined : { pathLength: 0 }}
            whileInView={reduced ? undefined : { pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.2, ease: 'easeInOut' }}
          />
          <circle cx={proj[0][0]} cy={proj[0][1]} r="4" fill="none" stroke="#E7E1D2" strokeWidth="1.5" />
          <g stroke="#E7E1D2" strokeWidth="1.5">
            <line x1={proj.at(-1)![0] - 3.5} y1={proj.at(-1)![1] - 3.5} x2={proj.at(-1)![0] + 3.5} y2={proj.at(-1)![1] + 3.5} />
            <line x1={proj.at(-1)![0] - 3.5} y1={proj.at(-1)![1] + 3.5} x2={proj.at(-1)![0] + 3.5} y2={proj.at(-1)![1] - 3.5} />
          </g>
          {curXY && (
            <g>
              <circle cx={curXY[0]} cy={curXY[1]} r="6" fill="var(--pink)" />
              <circle cx={curXY[0]} cy={curXY[1]} r="11" fill="none" stroke="var(--pink)" strokeWidth="1" opacity="0.5" />
            </g>
          )}
        </svg>
      </div>

      {/* elevation */}
      <div className={styles.panel}>
        <span className={styles.panelLabel}>Layer 02 · Elevation</span>
        <svg
          viewBox={`0 0 ${STRIP_W} ${STRIP_H}`}
          preserveAspectRatio="none"
          style={{ height: 64 }}
          role="img"
          aria-label={`Elevation profile, ${eleMin.toFixed(0)} to ${eleMax.toFixed(0)} feet.`}
          onPointerMove={scrubStrip}
          onPointerLeave={clear}
        >
          <path d={`${elePath}L${STRIP_W},${STRIP_H}L0,${STRIP_H}Z`} fill="#E7E1D2" opacity="0.12" />
          <path d={elePath} fill="none" stroke="#E7E1D2" strokeWidth="1.3" opacity="0.85" />
          {cur && (
            <>
              <line x1={stripX(cur)} y1="0" x2={stripX(cur)} y2={STRIP_H} stroke="var(--pink)" strokeWidth="1.2" />
              <circle cx={stripX(cur)} cy={eleY(cur)} r="3.5" fill="var(--pink)" />
            </>
          )}
        </svg>
      </div>

      {/* speed */}
      <div className={styles.panel}>
        <span className={styles.panelLabel}>Layer 03 · Speed</span>
        <svg
          viewBox={`0 0 ${STRIP_W} ${STRIP_H}`}
          preserveAspectRatio="none"
          style={{ height: 64 }}
          role="img"
          aria-label={`Speed profile, up to ${mphMax.toFixed(0)} miles per hour.`}
          onPointerMove={scrubStrip}
          onPointerLeave={clear}
        >
          <path d={mphPath} fill="none" stroke="var(--pink)" strokeWidth="1.2" opacity="0.9" />
          {cur && (
            <>
              <line x1={stripX(cur)} y1="0" x2={stripX(cur)} y2={STRIP_H} stroke="var(--pink)" strokeWidth="1.2" />
              <circle cx={stripX(cur)} cy={mphY(cur)} r="3.5" fill="var(--pink)" />
            </>
          )}
        </svg>
      </div>

      <p className={styles.scrubHint}>Hover / drag any layer to scrub the ride — miles tick.</p>
    </div>
  )
}
