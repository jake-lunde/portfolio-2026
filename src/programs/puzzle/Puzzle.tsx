'use client'

import { useEffect, useRef, useState } from 'react'
import { Stamp } from '@/components/primitives/Stamp'
import { sfx } from '@/lib/sound'
import styles from './puzzle.module.css'

/* Jigsaw — 12 procedurally die-cut pieces. Tabs are cubic-bezier bulbs;
   a shared edge is drawn by both neighbors with the walk direction
   reversed and the sign flipped, so the world-space curve coincides and
   the cut is exact. Image is generated on-device (no assets yet — Jake's
   photos slot in later). */

const COLS = 4
const ROWS = 3
const PS = 120 // piece size
const PAD = Math.round(PS * 0.28)
const IMG_W = COLS * PS
const IMG_H = ROWS * PS
const BOARD_W = IMG_W + 120
const BOARD_H = IMG_H + 120
const TARGET_X = 60
const TARGET_Y = 44
const SNAP = 18

type Piece = {
  id: number
  r: number
  c: number
  x: number
  y: number
  z: number
  locked: boolean
}

/* one jigsaw side from (x0,y0)→(x1,y1); s=0 straight, ±1 tab direction */
function side(p: Path2D, x0: number, y0: number, x1: number, y1: number, s: number) {
  if (s === 0) {
    p.lineTo(x1, y1)
    return
  }
  const dx = x1 - x0
  const dy = y1 - y0
  // perpendicular (left of travel); world bump = s * perp * depth
  const px = dy === 0 ? 0 : dy > 0 ? 1 : -1
  const py = dx === 0 ? 0 : dx > 0 ? -1 : 1
  const u = (t: number) => [x0 + dx * t, y0 + dy * t] as const
  const b = (t: number, d: number) => {
    const [x, y] = u(t)
    return [x + px * s * d * PS, y + py * s * d * PS] as const
  }
  const [a1x, a1y] = u(0.34)
  p.lineTo(a1x, a1y)
  {
    const [c1x, c1y] = u(0.44)
    const [c2x, c2y] = b(0.3, 0.24)
    const [ex, ey] = b(0.5, 0.24)
    p.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey)
  }
  {
    const [c1x, c1y] = b(0.7, 0.24)
    const [c2x, c2y] = u(0.56)
    const [ex, ey] = u(0.66)
    p.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey)
  }
  p.lineTo(x1, y1)
}

function piecePath(r: number, c: number, h: number[][], v: number[][]): Path2D {
  const p = new Path2D()
  const x0 = PAD
  const y0 = PAD
  const x1 = PAD + PS
  const y1 = PAD + PS
  p.moveTo(x0, y0)
  side(p, x0, y0, x1, y0, h[r][c]) // top L→R
  side(p, x1, y0, x1, y1, v[r][c + 1]) // right T→B
  side(p, x1, y1, x0, y1, -h[r + 1][c]) // bottom R→L (sign flip = complement)
  side(p, x0, y1, x0, y0, -v[r][c]) // left B→T
  p.closePath()
  return p
}

/* on-device poster until Jake supplies photos */
function makePoster(): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = IMG_W
  cv.height = IMG_H
  const g = cv.getContext('2d')!
  g.fillStyle = '#131811'
  g.fillRect(0, 0, IMG_W, IMG_H)
  // doppler rings
  g.strokeStyle = '#F2A6C2'
  for (let r = 8; r < 300; r += 14) {
    g.lineWidth = 3 + r * 0.02
    g.beginPath()
    g.arc(140, IMG_H / 2 + 20, r, 0, Math.PI * 2)
    g.stroke()
  }
  // blue field + wordmark
  g.fillStyle = 'rgba(19,24,17,0.55)'
  g.fillRect(0, 0, IMG_W, IMG_H)
  g.fillStyle = '#E7E1D2'
  g.font = 'bold 54px monospace'
  g.fillText('LUNDE', 250, 150)
  g.fillText('OS', 250, 208)
  g.fillStyle = '#5C7CFF'
  g.font = '16px monospace'
  g.fillText('JIG-01 · 1992', 250, 250)
  g.fillStyle = '#F2A6C2'
  g.fillRect(250, 264, 96, 8)
  return cv
}

export default function Puzzle() {
  const boardRef = useRef<HTMLDivElement>(null)
  const [pieces, setPieces] = useState<Piece[] | null>(null)
  const [done, setDone] = useState(false)
  const zTop = useRef(20)
  const drag = useRef<{ id: number; ox: number; oy: number } | null>(null)
  const edges = useRef<{ h: number[][]; v: number[][] } | null>(null)
  const posterRef = useRef<HTMLCanvasElement | null>(null)

  const scatter = (): Piece[] => {
    let id = 0
    const out: Piece[] = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        out.push({
          id: id++,
          r,
          c,
          x: Math.random() * (BOARD_W - PS - PAD * 2),
          y: Math.random() * (BOARD_H - PS - PAD * 2),
          z: 10 + id,
          locked: false,
        })
      }
    }
    return out
  }

  // init on mount (client-only randomness)
  useEffect(() => {
    const rnd = () => (Math.random() > 0.5 ? 1 : -1)
    const h: number[][] = Array.from({ length: ROWS + 1 }, (_, r) =>
      Array.from({ length: COLS }, () => (r === 0 || r === ROWS ? 0 : rnd()))
    )
    const v: number[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS + 1 }, (_, c) => (c === 0 || c === COLS ? 0 : rnd()))
    )
    edges.current = { h, v }
    posterRef.current = makePoster()
    setPieces(scatter())
  }, [])

  // paint each piece canvas once pieces exist
  useEffect(() => {
    if (!pieces || !edges.current || !posterRef.current) return
    for (const piece of pieces) {
      const cv = document.getElementById(`pz-${piece.id}`) as HTMLCanvasElement | null
      if (!cv || cv.dataset.painted) continue
      cv.dataset.painted = '1'
      const g = cv.getContext('2d')!
      const path = piecePath(piece.r, piece.c, edges.current.h, edges.current.v)
      g.save()
      g.clip(path)
      g.drawImage(posterRef.current, PAD - piece.c * PS, PAD - piece.r * PS)
      g.restore()
      g.strokeStyle = 'rgba(23,21,13,0.9)'
      g.lineWidth = 1.5
      g.stroke(path)
    }
  }, [pieces])

  const onDown = (e: React.PointerEvent, id: number) => {
    const p = pieces?.find((x) => x.id === id)
    if (!p || p.locked) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { id, ox: e.clientX - p.x, oy: e.clientY - p.y }
    zTop.current += 1
    setPieces((cur) => cur!.map((x) => (x.id === id ? { ...x, z: zTop.current } : x)))
  }

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const { id, ox, oy } = drag.current
    const x = e.clientX - ox
    const y = e.clientY - oy
    setPieces((cur) => cur!.map((p) => (p.id === id ? { ...p, x, y } : p)))
  }

  const onUp = () => {
    if (!drag.current || !pieces) return
    const { id } = drag.current
    drag.current = null
    setPieces((cur) => {
      const next = cur!.map((p) => {
        if (p.id !== id) return p
        const tx = TARGET_X + p.c * PS - PAD
        const ty = TARGET_Y + p.r * PS - PAD
        if (Math.abs(p.x - tx) < SNAP && Math.abs(p.y - ty) < SNAP) {
          sfx.tap()
          return { ...p, x: tx, y: ty, locked: true, z: 5 }
        }
        return p
      })
      if (next.every((p) => p.locked)) {
        sfx.open()
        setDone(true)
      }
      return next
    })
  }

  const reshuffle = () => {
    sfx.close()
    setDone(false)
    document.querySelectorAll('[id^="pz-"]').forEach((el) => delete (el as HTMLElement).dataset.painted)
    setPieces(scatter())
  }

  const placed = pieces?.filter((p) => p.locked).length ?? 0

  return (
    <div className={styles.puzzle}>
      <div className={styles.head}>
        <span className={styles.headLabel}>
          JIG-01 · {placed}/{ROWS * COLS} PLACED
        </span>
        <button className={styles.shuffle} onClick={reshuffle}>
          ↻ SHUFFLE
        </button>
      </div>

      <div
        ref={boardRef}
        className={styles.board}
        style={{ width: BOARD_W, height: BOARD_H }}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        {/* target tray */}
        <div
          className={styles.tray}
          style={{ left: TARGET_X, top: TARGET_Y, width: IMG_W, height: IMG_H }}
          aria-hidden="true"
        />
        {pieces?.map((p) => (
          <canvas
            key={p.id}
            id={`pz-${p.id}`}
            width={PS + PAD * 2}
            height={PS + PAD * 2}
            className={styles.piece}
            data-locked={p.locked || undefined}
            style={{ left: p.x, top: p.y, zIndex: p.z }}
            onPointerDown={(e) => onDown(e, p.id)}
            role="button"
            aria-label={`Puzzle piece row ${p.r + 1}, column ${p.c + 1}${p.locked ? ', placed' : ''}`}
          />
        ))}
        {done && (
          <div className={styles.doneOverlay}>
            <Stamp tone="pink">Assembled</Stamp>
          </div>
        )}
      </div>
      <p className={styles.hint}>Drag the pieces into the tray — they snap when close.</p>
    </div>
  )
}
