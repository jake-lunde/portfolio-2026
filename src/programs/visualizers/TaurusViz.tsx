'use client'

import { useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './viz.module.css'

/* Taurus — the constellation as a chart plate. Real star positions
   (RA/Dec, equirectangular), magnitudes sized honestly, and the mouse is
   the light source: stars glow brightest where you are. Cross from star
   to star to read each one — two of them carry known exoplanets. */

type Star = {
  id: string
  name: string
  bayer: string
  ra: number // hours
  dec: number // degrees
  mag: number
  spectral: string
  ly: number
  planets?: string
  note?: string
}

const STARS: Star[] = [
  { id: 'aldebaran', name: 'Aldebaran', bayer: 'α Tau', ra: 4.598, dec: 16.51, mag: 0.85, spectral: 'K5 III', ly: 65, planets: 'Aldebaran b — super-Jupiter, long disputed', note: 'the bull’s eye' },
  { id: 'elnath', name: 'Elnath', bayer: 'β Tau', ra: 5.438, dec: 28.61, mag: 1.65, spectral: 'B7 III', ly: 134, note: 'tip of the northern horn' },
  { id: 'alcyone', name: 'Alcyone', bayer: 'η Tau', ra: 3.791, dec: 24.11, mag: 2.87, spectral: 'B7 III', ly: 440, note: 'brightest of the Pleiades' },
  { id: 'zeta', name: 'Tianguan', bayer: 'ζ Tau', ra: 5.627, dec: 21.14, mag: 3.0, spectral: 'B2 III', ly: 440, note: 'tip of the southern horn' },
  { id: 'theta2', name: 'Chamukuy', bayer: 'θ² Tau', ra: 4.478, dec: 15.87, mag: 3.4, spectral: 'A7 III', ly: 150, note: 'Hyades cluster' },
  { id: 'ain', name: 'Ain', bayer: 'ε Tau', ra: 4.477, dec: 19.18, mag: 3.53, spectral: 'K0 III', ly: 147, planets: 'Ain b — first exoplanet found in an open cluster (2007)', note: 'the bull’s other eye' },
  { id: 'gamma', name: 'Prima Hyadum', bayer: 'γ Tau', ra: 4.33, dec: 15.63, mag: 3.65, spectral: 'K0 III', ly: 154, note: 'Hyades cluster' },
  { id: 'delta', name: 'Secunda Hyadum', bayer: 'δ Tau', ra: 4.382, dec: 17.54, mag: 3.77, spectral: 'K1 III', ly: 156, note: 'Hyades cluster' },
  { id: 'lambda', name: 'λ Tau', bayer: 'λ Tau', ra: 4.011, dec: 12.49, mag: 3.41, spectral: 'B3 V', ly: 480, note: 'eclipsing binary — dims every 3.95 days' },
  { id: 'xi', name: 'ξ Tau', bayer: 'ξ Tau', ra: 3.453, dec: 9.73, mag: 3.74, spectral: 'B9 V', ly: 210, note: 'triple star system' },
  { id: 'omicron', name: 'ο Tau', bayer: 'ο Tau', ra: 3.413, dec: 9.03, mag: 3.61, spectral: 'G8 III', ly: 290 },
  { id: 'nu', name: 'ν Tau', bayer: 'ν Tau', ra: 4.052, dec: 5.99, mag: 3.91, spectral: 'A1 V', ly: 117 },
]

/* stick figure: horns to the V, V through the Hyades, body to the legs */
const LINES: Array<[string, string]> = [
  ['elnath', 'ain'],
  ['zeta', 'aldebaran'],
  ['aldebaran', 'theta2'],
  ['theta2', 'gamma'],
  ['ain', 'delta'],
  ['delta', 'gamma'],
  ['gamma', 'lambda'],
  ['lambda', 'xi'],
  ['xi', 'omicron'],
  ['lambda', 'nu'],
]

const W = 640
const H = 420
const PAD = 44

export function TaurusViz() {
  const reduced = useReducedMotion()
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  const [sel, setSel] = useState<Star | null>(null)
  const lastSel = useRef<string | null>(null)

  // equirect projection: x = -RA (sky flips east/west), y = -Dec
  const pos = useMemo(() => {
    const ras = STARS.map((s) => s.ra)
    const decs = STARS.map((s) => s.dec)
    const minRa = Math.min(...ras), maxRa = Math.max(...ras)
    const minDec = Math.min(...decs), maxDec = Math.max(...decs)
    const map: Record<string, [number, number]> = {}
    for (const s of STARS) {
      map[s.id] = [
        PAD + ((maxRa - s.ra) / (maxRa - minRa)) * (W - PAD * 2),
        PAD + ((maxDec - s.dec) / (maxDec - minDec)) * (H - PAD * 2),
      ]
    }
    return map
  }, [])

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const y = ((e.clientY - rect.top) / rect.height) * H
    setMouse({ x, y })
    // nearest star within reach becomes the reading
    let best: Star | null = null
    let bd = Infinity
    for (const s of STARS) {
      const [sx, sy] = pos[s.id]
      const d = (sx - x) ** 2 + (sy - y) ** 2
      if (d < bd) {
        bd = d
        best = s
      }
    }
    const chosen = bd < 65 ** 2 ? best : null
    if (chosen?.id !== lastSel.current) {
      lastSel.current = chosen?.id ?? null
      if (chosen) sfx.tap()
      setSel(chosen)
    }
  }

  const glow = (id: string): number => {
    if (!mouse) return 0
    const [sx, sy] = pos[id]
    const d = Math.hypot(sx - mouse.x, sy - mouse.y)
    return Math.max(0, 1 - d / 210)
  }

  return (
    <div>
      <div className={styles.rideHead}>
        <h3 className={styles.rideTitle}>“taurus”</h3>
        <span className={styles.rideSub}>THE BULL · {STARS.length} STARS · EPOCH J2000</span>
      </div>

      <div className={styles.panel}>
        <span className={styles.panelLabel}>Chart 01 · your cursor is the light</span>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Star chart of Taurus. Move across it to light the stars; the readout describes each one."
          onPointerMove={move}
          onPointerLeave={() => {
            setMouse(null)
            setSel(null)
            lastSel.current = null
          }}
        >
          <defs>
            <radialGradient id="starGlow">
              <stop offset="0%" stopColor="#E7E1D2" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#F2A6C2" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F2A6C2" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* constellation lines */}
          {LINES.map(([a, b], i) => {
            const [x1, y1] = pos[a]
            const [x2, y2] = pos[b]
            const lit = Math.max(glow(a), glow(b))
            return (
              <motion.line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--accent)"
                strokeWidth={1}
                opacity={0.22 + lit * 0.5}
                initial={reduced ? undefined : { pathLength: 0 }}
                whileInView={reduced ? undefined : { pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.12 }}
              />
            )
          })}

          {/* stars */}
          {STARS.map((s) => {
            const [x, y] = pos[s.id]
            const g = glow(s.id)
            const base = 6.2 - s.mag // magnitude → size (brighter = bigger)
            const r = Math.max(1.6, base * 1.1)
            const active = sel?.id === s.id
            return (
              <g key={s.id}>
                {g > 0.02 && (
                  <circle cx={x} cy={y} r={r + 4 + g * 26} fill="url(#starGlow)" opacity={g} />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={r + g * 1.6}
                  fill={active ? 'var(--accent-expressive)' : '#E7E1D2'}
                  opacity={0.55 + g * 0.45}
                />
                {s.planets && (
                  <circle
                    cx={x}
                    cy={y}
                    r={r + 6}
                    fill="none"
                    stroke="var(--accent-expressive)"
                    strokeWidth="0.7"
                    strokeDasharray="2 3"
                    opacity={0.35 + g * 0.65}
                  />
                )}
                <text
                  x={x + r + 6}
                  y={y + 3}
                  fontFamily="var(--mono)"
                  fontSize="8.5"
                  letterSpacing="0.8"
                  fill={active ? 'var(--accent-expressive)' : '#E7E1D2'}
                  opacity={0.35 + g * 0.65}
                >
                  {s.name.toUpperCase()}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className={styles.moatWhy} aria-live="polite" style={{ borderTop: 'none', marginTop: 0 }}>
        {sel ? (
          <>
            <b>{sel.name}</b> · {sel.bayer} — mag {sel.mag} · {sel.spectral} · {sel.ly} ly
            {sel.note ? ` · ${sel.note}` : ''}
            <br />
            {sel.planets ? <>PLANETS: {sel.planets}</> : 'PLANETS: none known'}
          </>
        ) : (
          <>Sweep the chart — the sky answers where you shine.</>
        )}
      </div>
    </div>
  )
}
