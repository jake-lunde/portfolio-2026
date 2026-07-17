'use client'

import { useMemo, useRef, useState } from 'react'
import { sfx } from '@/lib/sound'
import data from './slopes-data.json'
import styles from './viz.module.css'

/* One day at Sun Peaks (Slopes GPX) — trail map drawn from the actual
   track: runs solid, lifts dashed. Scrub any layer to ride the day. */

type Pt = { x: number; y: number; ele: number; mph: number; s: number }
type Seg = { type: 'run' | 'lift' | 'idle'; start: number; end: number }
type Run = { n: number; start: number; end: number; dropFt: number; maxMph: number; min: number }

const MAP_W = 640
const MAP_H = 300
const STRIP_W = 640
const STRIP_H = 78
const PAD = 14

const fmtClock = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

export function SlopesViz() {
  const [idx, setIdx] = useState<number | null>(null)
  const lastRun = useRef(-1)

  const pts: Pt[] = useMemo(
    () => (data.points as number[][]).map(([x, y, ele, mph, s]) => ({ x, y, ele, mph, s })),
    []
  )
  const segs = data.segs as Seg[]
  const runs = data.runs as Run[]

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

  const eleMin = Math.min(...pts.map((p) => p.ele))
  const eleMax = Math.max(...pts.map((p) => p.ele))
  const tMax = pts[pts.length - 1].s

  const stripX = (i: number) => (pts[i].s / tMax) * STRIP_W
  const eleY = (i: number) =>
    STRIP_H - 8 - ((pts[i].ele - eleMin) / (eleMax - eleMin || 1)) * (STRIP_H - 24)

  const segPath = (s: Seg, map: boolean) => {
    let d = ''
    for (let i = s.start; i <= s.end; i++) {
      const [x, y] = map ? proj[i] : [stripX(i), eleY(i)]
      d += (i === s.start ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)
    }
    return d
  }

  const scrub = (e: React.PointerEvent<SVGSVGElement>, map: boolean) => {
    const rect = e.currentTarget.getBoundingClientRect()
    let best = 0
    if (map) {
      const px = ((e.clientX - rect.left) / rect.width) * MAP_W
      const py = ((e.clientY - rect.top) / rect.height) * MAP_H
      let bd = Infinity
      for (let i = 0; i < proj.length; i++) {
        const dx = proj[i][0] - px, dy = proj[i][1] - py
        const d = dx * dx + dy * dy
        if (d < bd) { bd = d; best = i }
      }
    } else {
      const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const t = frac * tMax
      let lo = 0, hi = pts.length - 1
      while (lo < hi) { const mid = (lo + hi) >> 1; if (pts[mid].s < t) lo = mid + 1; else hi = mid }
      best = lo
    }
    const run = runs.findIndex((r) => best >= r.start && best <= r.end)
    if (run !== lastRun.current) { lastRun.current = run; if (run >= 0) sfx.tap() }
    setIdx(best)
  }

  const cur = idx !== null ? pts[idx] : null
  const curSeg = idx !== null ? segs.find((s) => idx >= s.start && idx <= s.end) : null
  const curRun = idx !== null ? runs.find((r) => idx >= r.start && idx <= r.end) : null

  return (
    <div>
      <div className={styles.rideHead}>
        <h3 className={styles.rideTitle}>“one day at sun peaks”</h3>
        <span className={styles.rideSub}>SLOPES · {data.date} · SUMMIT {data.stats.topFt.toLocaleString()} FT</span>
      </div>

      <div className={styles.hud} role="status" aria-label="Ski day readout">
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'T+' : 'Runs'}</span>
          <span className={styles.hudV}>{cur ? fmtClock(cur.s) : data.stats.runs}</span>
        </div>
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'Mode' : 'Vertical'}</span>
          <span className={styles.hudV}>
            {cur ? (
              curRun ? <em>RUN {String(curRun.n).padStart(2, '0')}</em> : curSeg?.type === 'lift' ? 'LIFT' : 'IDLE'
            ) : (
              <>{data.stats.verticalFt.toLocaleString()} <em>ft</em></>
            )}
          </span>
        </div>
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'Speed' : 'Max speed'}</span>
          <span className={styles.hudV}>{cur ? cur.mph.toFixed(1) : data.stats.maxMph} <em>mph</em></span>
        </div>
        <div className={styles.hudCell}>
          <span className={styles.hudK}>{cur ? 'Elev' : 'Distance'}</span>
          <span className={styles.hudV}>
            {cur ? <>{Math.round(cur.ele).toLocaleString()} <em>ft</em></> : <>{data.stats.distanceMi} <em>mi</em></>}
          </span>
        </div>
      </div>

      <div className={styles.panel}>
        <span className={styles.panelLabel}>Layer 01 · Mountain — runs solid · lifts dashed</span>
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          role="img"
          aria-label={`Track map of ${data.stats.runs} runs at Sun Peaks. Drag to scrub the day.`}
          onPointerMove={(e) => scrub(e, true)}
          onPointerLeave={() => setIdx(null)}
        >
          {segs.map((s, i) => (
            <path
              key={i}
              d={segPath(s, true)}
              fill="none"
              stroke={s.type === 'run' ? 'var(--accent)' : '#E7E1D2'}
              strokeWidth={s.type === 'run' ? 1.6 : 0.9}
              strokeDasharray={s.type === 'lift' ? '3 4' : undefined}
              opacity={s.type === 'run' ? 0.9 : s.type === 'lift' ? 0.45 : 0.2}
            />
          ))}
          {idx !== null && (
            <g>
              <circle cx={proj[idx][0]} cy={proj[idx][1]} r="6" fill="var(--accent-expressive)" />
              <circle cx={proj[idx][0]} cy={proj[idx][1]} r="11" fill="none" stroke="var(--accent-expressive)" strokeWidth="1" opacity="0.5" />
            </g>
          )}
        </svg>
      </div>

      <div className={styles.panel}>
        <span className={styles.panelLabel}>Layer 02 · Elevation over the day</span>
        <svg
          viewBox={`0 0 ${STRIP_W} ${STRIP_H}`}
          preserveAspectRatio="none"
          style={{ height: 64 }}
          role="img"
          aria-label="Elevation profile across the ski day."
          onPointerMove={(e) => scrub(e, false)}
          onPointerLeave={() => setIdx(null)}
        >
          {segs.map((s, i) => (
            <path
              key={i}
              d={segPath(s, false)}
              fill="none"
              stroke={s.type === 'run' ? 'var(--accent)' : '#E7E1D2'}
              strokeWidth={s.type === 'run' ? 1.5 : 0.8}
              strokeDasharray={s.type === 'lift' ? '2 3' : undefined}
              opacity={s.type === 'run' ? 0.95 : 0.4}
            />
          ))}
          {idx !== null && (
            <>
              <line x1={stripX(idx)} y1="0" x2={stripX(idx)} y2={STRIP_H} stroke="var(--accent-expressive)" strokeWidth="1.2" />
              <circle cx={stripX(idx)} cy={eleY(idx)} r="3.5" fill="var(--accent-expressive)" />
            </>
          )}
        </svg>
      </div>

      <div className={styles.runList}>
        {runs.map((r) => (
          <span key={r.n} className={styles.runChip} data-active={(curRun?.n === r.n) || undefined}>
            RUN {String(r.n).padStart(2, '0')} · −{r.dropFt.toLocaleString()} FT · {r.maxMph} MPH
          </span>
        ))}
      </div>
      <p className={styles.scrubHint}>Hover the mountain or the profile to ride the day — runs tick.</p>
    </div>
  )
}
