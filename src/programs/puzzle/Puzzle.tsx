'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Stamp } from '@/components/primitives/Stamp'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'
import { PUZZLES, IMG_W, IMG_H } from './puzzleImages'
import styles from './puzzle.module.css'

/* Jigsaw — procedurally die-cut pieces (complementary bezier tabs) over
   images generated from the site itself: the rings poster, the Louie
   model, the crew, the Moat, pixel Lou. Timer runs from first touch;
   best times keep a local leaderboard; solving earns confetti. */

const COLS = 4
const ROWS = 3
const PS = 120
const PAD = Math.round(PS * 0.28)
const BOARD_W = IMG_W + 120
const BOARD_H = IMG_H + 120
const TARGET_X = 60
const TARGET_Y = 44
const SNAP = 18

const TIMES_KEY = 'lunde-jigsaw-times'

type Piece = { id: number; r: number; c: number; x: number; y: number; z: number; locked: boolean }
type Score = { name: string; secs: number }

function side(p: Path2D, x0: number, y0: number, x1: number, y1: number, s: number) {
  if (s === 0) {
    p.lineTo(x1, y1)
    return
  }
  const dx = x1 - x0
  const dy = y1 - y0
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
  side(p, x0, y0, x1, y0, h[r][c])
  side(p, x1, y0, x1, y1, v[r][c + 1])
  side(p, x1, y1, x0, y1, -h[r + 1][c])
  side(p, x0, y1, x0, y0, -v[r][c])
  p.closePath()
  return p
}

const readTimes = (): Record<string, Score[]> => {
  try {
    return JSON.parse(localStorage.getItem(TIMES_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export default function Puzzle() {
  const reduced = useReducedMotion()
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [pieces, setPieces] = useState<Piece[] | null>(null)
  const [done, setDone] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [board, setBoard] = useState<Record<string, Score[]>>({})
  const zTop = useRef(20)
  const drag = useRef<{ id: number; ox: number; oy: number } | null>(null)
  const edges = useRef<{ h: number[][]; v: number[][] } | null>(null)
  const posterRef = useRef<HTMLCanvasElement | null>(null)
  const startedAt = useRef<number | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const puzzle = PUZZLES[puzzleIdx]

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

  const resetTimer = () => {
    startedAt.current = null
    setElapsed(0)
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
  }

  // (re)build the puzzle whenever the selection changes
  useEffect(() => {
    let cancelled = false
    const rnd = () => (Math.random() > 0.5 ? 1 : -1)
    const h: number[][] = Array.from({ length: ROWS + 1 }, (_, r) =>
      Array.from({ length: COLS }, () => (r === 0 || r === ROWS ? 0 : rnd()))
    )
    const v: number[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS + 1 }, (_, c) => (c === 0 || c === COLS ? 0 : rnd()))
    )
    edges.current = { h, v }

    const cv = document.createElement('canvas')
    cv.width = IMG_W
    cv.height = IMG_H
    const g = cv.getContext('2d')!
    Promise.resolve(puzzle.draw(g)).then(() => {
      if (cancelled) return
      posterRef.current = cv
      document.querySelectorAll('[id^="pz-"]').forEach((el) => delete (el as HTMLElement).dataset.painted)
      setDone(false)
      resetTimer()
      setPieces(scatter())
    })
    setBoard(readTimes())
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleIdx])

  // paint pieces
  useEffect(() => {
    if (!pieces || !edges.current || !posterRef.current) return
    for (const piece of pieces) {
      const cv = document.getElementById(`pz-${piece.id}`) as HTMLCanvasElement | null
      if (!cv || cv.dataset.painted) continue
      cv.dataset.painted = '1'
      const g = cv.getContext('2d')!
      g.clearRect(0, 0, cv.width, cv.height)
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

  useEffect(() => () => resetTimer(), [])

  const onDown = (e: React.PointerEvent, id: number) => {
    const p = pieces?.find((x) => x.id === id)
    if (!p || p.locked || done) return
    if (startedAt.current === null) {
      startedAt.current = Date.now()
      tickRef.current = setInterval(
        () => setElapsed((Date.now() - (startedAt.current ?? Date.now())) / 1000),
        500
      )
    }
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

  const finish = () => {
    const secs = startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0
    if (tickRef.current) clearInterval(tickRef.current)
    setElapsed(secs)
    sfx.open()
    metric('puzzle_solve', { puzzle: puzzle.id })
    let name = 'OPERATOR'
    try {
      name = (localStorage.getItem('lunde-guest-name') || 'OPERATOR').slice(0, 12).toUpperCase()
    } catch {}
    const times = readTimes()
    const list = [...(times[puzzle.id] ?? []), { name, secs: Math.round(secs * 10) / 10 }]
      .sort((a, b) => a.secs - b.secs)
      .slice(0, 5)
    times[puzzle.id] = list
    try {
      localStorage.setItem(TIMES_KEY, JSON.stringify(times))
    } catch {}
    setBoard(times)
    setDone(true)
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
      if (next.every((p) => p.locked)) finish()
      return next
    })
  }

  const reshuffle = () => {
    sfx.close()
    setDone(false)
    resetTimer()
    document.querySelectorAll('[id^="pz-"]').forEach((el) => delete (el as HTMLElement).dataset.painted)
    setPieces(scatter())
  }

  const placed = pieces?.filter((p) => p.locked).length ?? 0
  const scores = board[puzzle.id] ?? []

  return (
    <div className={styles.puzzle}>
      <div className={styles.pickRow} role="group" aria-label="Puzzle">
        {PUZZLES.map((p, i) => (
          <button
            key={p.id}
            className={styles.pick}
            aria-pressed={i === puzzleIdx}
            onClick={() => {
              sfx.tap()
              setPuzzleIdx(i)
            }}
          >
            {p.name.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={styles.head}>
        <span className={styles.headLabel}>
          JIG-{String(puzzleIdx + 1).padStart(2, '0')} · {placed}/{ROWS * COLS} PLACED · {puzzle.hint.toUpperCase()}
        </span>
        <span className={styles.timer} aria-label="Timer">
          ⏱ {fmtSecs(elapsed)}
        </span>
        <button className={styles.shuffle} onClick={reshuffle}>
          ↻ SHUFFLE
        </button>
      </div>

      <div
        className={styles.board}
        style={{ width: BOARD_W, height: BOARD_H }}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <div
          className={styles.tray}
          style={{ left: TARGET_X, top: TARGET_Y, width: IMG_W, height: IMG_H }}
          aria-hidden="true"
        />
        {pieces?.map((p) => (
          <canvas
            key={`${puzzle.id}-${p.id}`}
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
            {!reduced &&
              Array.from({ length: 26 }).map((_, i) => (
                <motion.span
                  key={i}
                  className={styles.confetti}
                  style={{
                    left: `${8 + ((i * 37) % 84)}%`,
                    background: i % 3 === 0 ? 'var(--pink)' : i % 3 === 1 ? 'var(--blue)' : 'var(--ink)',
                  }}
                  initial={{ y: -30, opacity: 1, rotate: 0 }}
                  animate={{ y: BOARD_H + 40, opacity: [1, 1, 0.6], rotate: 260 + ((i * 53) % 240) }}
                  transition={{ duration: 1.6 + (i % 5) * 0.22, ease: 'easeIn', delay: (i % 7) * 0.08 }}
                />
              ))}
            <div className={styles.doneCard}>
              <Stamp tone="pink">Assembled</Stamp>
              <span className={styles.doneTime}>{fmtSecs(elapsed)}</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.scores} aria-label="Best times">
        <span className={styles.scoresHead}>BEST — THIS MACHINE</span>
        {scores.length > 0 ? (
          scores.map((s, i) => (
            <span key={i} className={styles.scoreRow}>
              {String(i + 1).padStart(2, '0')} {s.name} — {fmtSecs(s.secs)}
            </span>
          ))
        ) : (
          <span className={styles.scoreRow}>NO TIMES YET — CLOCK&rsquo;S WAITING</span>
        )}
      </div>
      <p className={styles.hint}>Drag the pieces into the tray — the clock starts on first touch.</p>
    </div>
  )
}
