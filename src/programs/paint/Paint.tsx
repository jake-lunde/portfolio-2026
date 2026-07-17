'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Stamp } from '@/components/primitives/Stamp'
import { Button } from '@/components/primitives/Button'
import { metric } from '@/lib/metrics'
import { sfx, gateSfx } from '@/lib/sound'
import { TATTOOS, type Tattoo } from './tattooPaths'
import styles from './paint.module.css'

/* TATTOO GUN — a WarioWare-Touched-style tracing game. Jake's actual
   tattoos, redrawn as pixel flash; you get one needle, 25 seconds, and
   a steadiness score. The cursor is the machine. Trace true. */

const W = 460
const H = 460
const SCALE = W / 100
const HIT_R = 6 * SCALE // forgiveness radius, canvas px
const ROUND_SECS = 25

// pixel tattoo gun cursor (hotspot at the needle tip, bottom-left)
const GUN =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26'><g fill='%2317150D'><rect x='4' y='16' width='3' height='7'/><rect x='6' y='12' width='8' height='6'/><rect x='12' y='8' width='5' height='8'/><rect x='15' y='4' width='8' height='7'/><rect x='19' y='11' width='3' height='3'/></g><rect x='2' y='22' width='3' height='3' fill='%23F2A6C2'/></svg>`
  ) +
  '") 3 24, crosshair'

type Phase = 'pick' | 'tracing' | 'scored'

const GRADES: Array<[number, string, string]> = [
  [85, 'SOLID INK', 'THE NEEDLE SANG. WALK-INS WELCOME.'],
  [70, 'CLEAN PASS', 'CRISP. THE CLIENT TIPS WELL.'],
  [50, 'SHAKY HAND', 'HEALED, IT MIGHT LOOK INTENTIONAL.'],
  [0, 'BLOWOUT', 'THE CLIENT IS CRYING. FREE TOUCH-UP.'],
]

const BEST_KEY = 'lunde-tattoo-best'

/* resample a stroke list into evenly spaced canvas-space points */
function samplePoints(t: Tattoo, gap = 3): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  for (const stroke of t.strokes) {
    for (let i = 0; i < stroke.length - 1; i++) {
      const [x1, y1] = stroke[i]
      const [x2, y2] = stroke[i + 1]
      const d = Math.hypot(x2 - x1, y2 - y1)
      const steps = Math.max(1, Math.round(d / gap))
      for (let s = 0; s <= steps; s++) {
        pts.push([(x1 + ((x2 - x1) * s) / steps) * SCALE, (y1 + ((y2 - y1) * s) / steps) * SCALE])
      }
    }
  }
  return pts
}

export default function Paint() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tattooIdx, setTattooIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('pick')
  const [secs, setSecs] = useState(ROUND_SECS)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState<Record<string, number>>({})
  const inked = useRef<Array<[number, number]>>([])
  const drawing = useRef(false)
  const target = useRef<Array<[number, number]>>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tattoo = TATTOOS[tattooIdx]

  useEffect(() => {
    try {
      setBest(JSON.parse(localStorage.getItem(BEST_KEY) ?? '{}'))
    } catch {}
  }, [])

  const drawGuide = (ghost: boolean) => {
    const g = canvasRef.current?.getContext('2d')
    if (!g) return
    g.clearRect(0, 0, W, H)
    // paper flash-card grid
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, W, H)
    g.strokeStyle = 'rgba(23,21,13,0.06)'
    g.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      g.beginPath(); g.moveTo(i * (W / 10), 0); g.lineTo(i * (W / 10), H); g.stroke()
      g.beginPath(); g.moveTo(0, i * (H / 10)); g.lineTo(W, i * (H / 10)); g.stroke()
    }
    // the stencil: chunky pixel dots
    g.fillStyle = ghost ? 'rgba(92,124,255,0.35)' : 'rgba(92,124,255,0.8)'
    for (const [x, y] of target.current) g.fillRect(x - 2, y - 2, 4, 4)
  }

  const redrawInk = () => {
    const g = canvasRef.current?.getContext('2d')
    if (!g) return
    g.fillStyle = '#17150D'
    for (const [x, y] of inked.current) g.fillRect(x - 2.5, y - 2.5, 5, 5)
  }

  const begin = (idx: number) => {
    setTattooIdx(idx)
    sfx.open()
    inked.current = []
    target.current = samplePoints(TATTOOS[idx])
    setSecs(ROUND_SECS)
    setPhase('tracing')
    setTimeout(() => drawGuide(false), 30)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          finish()
          return 0
        }
        if (s <= 6) sfx.tap()
        return s - 1
      })
    }, 1000)
  }

  const finish = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    drawing.current = false
    const t = target.current
    const ink = inked.current
    let covered = 0
    for (const [tx, ty] of t) {
      if (ink.some(([ix, iy]) => Math.hypot(ix - tx, iy - ty) < HIT_R)) covered++
    }
    let precise = 0
    for (const [ix, iy] of ink) {
      if (t.some(([tx, ty]) => Math.hypot(ix - tx, iy - ty) < HIT_R)) precise++
    }
    const coverage = t.length ? covered / t.length : 0
    const precision = ink.length ? precise / ink.length : 0
    const s = Math.round(100 * (coverage * 0.65 + precision * 0.35))
    setScore(s)
    setPhase('scored')
    if (s >= 70) gateSfx.success()
    else gateSfx.fail()
    metric('tattoo_trace', { tattoo: tattoo.id })
    setBest((cur) => {
      const next = { ...cur, [tattoo.id]: Math.max(cur[tattoo.id] ?? 0, s) }
      try {
        localStorage.setItem(BEST_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const pos = (e: React.PointerEvent): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H]
  }

  const onDown = (e: React.PointerEvent) => {
    if (phase !== 'tracing') return
    drawing.current = true
    canvasRef.current!.setPointerCapture(e.pointerId)
    inked.current.push(pos(e))
    redrawInk()
  }

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || phase !== 'tracing') return
    inked.current.push(pos(e))
    redrawInk()
  }

  const grade = GRADES.find(([min]) => score >= min)!

  return (
    <div className={styles.shop}>
      {phase === 'pick' && (
        <>
          <p className={styles.shopHead}>FLASH WALL — PICK YOUR PIECE</p>
          <div className={styles.flashWall}>
            {TATTOOS.map((t, i) => (
              <button key={t.id} className={styles.flashCard} onClick={() => begin(i)}>
                <FlashThumb tattoo={t} />
                <span className={styles.flashName}>{t.name.toUpperCase()}</span>
                <span className={styles.flashMeta}>
                  {'★'.repeat(t.difficulty)}
                  {best[t.id] !== undefined ? ` · BEST ${best[t.id]}%` : ''}
                </span>
              </button>
            ))}
          </div>
          <p className={styles.shopNote}>
            TRACE THE STENCIL WITH THE MACHINE · {ROUND_SECS}s ON THE CLOCK · STEADY HANDS
          </p>
        </>
      )}

      {phase !== 'pick' && (
        <>
          <div className={styles.traceBar}>
            <span className={styles.traceName}>
              {tattoo.name.toUpperCase()} · {tattoo.credit}
            </span>
            <span className={styles.traceClock} data-low={secs <= 5 || undefined}>
              {phase === 'tracing' ? `0:${String(secs).padStart(2, '0')}` : `${score}%`}
            </span>
            {phase === 'tracing' && (
              <Button size="sm" onClick={finish}>
                ✓ DONE
              </Button>
            )}
          </div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className={styles.skin}
            style={{ cursor: GUN }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={() => (drawing.current = false)}
            role="img"
            aria-label={`Trace the ${tattoo.name} stencil with the tattoo gun cursor`}
          />
          <AnimatePresence>
            {phase === 'scored' && (
              <motion.div
                className={styles.verdict}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Stamp tone={score >= 70 ? 'pink' : 'blue'}>{grade[1]}</Stamp>
                <span className={styles.verdictScore}>{score}%</span>
                <span className={styles.verdictLine}>{grade[2]}</span>
                <div className={styles.verdictRow}>
                  <Button size="sm" onClick={() => begin(tattooIdx)}>
                    ↻ AGAIN
                  </Button>
                  <Button size="sm" onClick={() => setPhase('pick')}>
                    ← FLASH WALL
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

/* tiny stencil preview on the flash wall */
function FlashThumb({ tattoo }: { tattoo: Tattoo }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g) return
    g.clearRect(0, 0, 100, 100)
    g.strokeStyle = '#17150D'
    g.lineWidth = 2
    g.lineJoin = 'round'
    for (const stroke of tattoo.strokes) {
      g.beginPath()
      stroke.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)))
      g.stroke()
    }
  }, [tattoo])
  return <canvas ref={ref} width={100} height={100} className={styles.thumb} aria-hidden="true" />
}
