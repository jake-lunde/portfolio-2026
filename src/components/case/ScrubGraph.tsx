'use client'

import { useRef, useState } from 'react'
import { sfx } from '@/lib/sound'

/* Web analog of the shipped SwiftUI interaction: press and scrub across
   time; each interval boundary "ticks" (sound + vibration where the
   platform allows — the haptic story told in the medium it lives in). */

const POINTS = [
  [0, 170], [60, 150], [120, 160], [180, 120], [240, 135], [300, 90],
  [360, 110], [420, 60], [480, 80], [540, 40], [600, 55], [640, 30],
] as const

const LABELS = ['JAN 24', 'MAR 24', 'MAY 24', 'JUL 24', 'SEP 24', 'NOV 24', 'JAN 25', 'MAR 25', 'MAY 25', 'JUL 25', 'SEP 25', 'NOV 25']

const W = 640
const H = 220

function yAt(x: number): number {
  for (let i = 1; i < POINTS.length; i++) {
    const [x0, y0] = POINTS[i - 1]
    const [x1, y1] = POINTS[i]
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
  }
  return POINTS[POINTS.length - 1][1]
}

export function ScrubGraph() {
  const [cursor, setCursor] = useState<{ x: number; y: number; i: number } | null>(null)
  const lastTick = useRef(-1)
  const svgRef = useRef<SVGSVGElement>(null)

  const scrub = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(W, ((clientX - rect.left) / rect.width) * W))
    const i = Math.min(LABELS.length - 1, Math.round((x / W) * (LABELS.length - 1)))
    if (i !== lastTick.current) {
      lastTick.current = i
      sfx.tap()
      try {
        navigator.vibrate?.(8)
      } catch {}
    }
    setCursor({ x, y: yAt(x), i })
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ height: 200, touchAction: 'none', cursor: 'crosshair' }}
      preserveAspectRatio="none"
      role="img"
      aria-label="Interactive performance graph. Drag across it to scrub through time; each interval ticks."
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        scrub(e.clientX)
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0 || e.pointerType === 'mouse') scrub(e.clientX)
      }}
      onPointerLeave={() => {
        setCursor(null)
        lastTick.current = -1
      }}
    >
      <polyline
        points={POINTS.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="#E7E1D2"
        strokeWidth="1.6"
        opacity="0.85"
      />
      <g stroke="#E7E1D2" opacity="0.4">
        {[60, 180, 300, 420, 540].map((x) => (
          <line key={x} x1={x} y1={H - 15} x2={x} y2={H - 8} />
        ))}
      </g>
      {cursor && (
        <g>
          <line x1={cursor.x} y1="0" x2={cursor.x} y2={H} stroke="var(--accent-expressive)" strokeWidth="1.4" />
          <circle cx={cursor.x} cy={cursor.y} r="6" fill="var(--accent-expressive)" />
          <text
            x={Math.max(34, Math.min(W - 34, cursor.x))}
            y="18"
            textAnchor="middle"
            fill="var(--accent-expressive)"
            fontFamily="var(--mono)"
            fontSize="10"
            letterSpacing="1"
          >
            ▲ {LABELS[cursor.i]}
          </text>
        </g>
      )}
      {!cursor && (
        <text
          x={W / 2}
          y="18"
          textAnchor="middle"
          fill="#E7E1D2"
          opacity="0.5"
          fontFamily="var(--mono)"
          fontSize="10"
          letterSpacing="1"
        >
          PRESS + DRAG TO SCRUB
        </text>
      )}
    </svg>
  )
}
