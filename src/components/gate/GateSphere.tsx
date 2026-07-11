'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useGate } from '@/store/gate'
import { gateSfx } from '@/lib/sound'
import styles from './gate.module.css'

/* THE GATE — macrodata-refinement clearance for the Projects wing.
   A sphere of letters: drag to rotate (it drifts on its own otherwise),
   letters swell toward the cursor, click one and it flies into a slot.
   Fill the word, the letters rise, the sphere recedes, and a very
   classic dialog delivers the verdict. The work is mysterious and
   important. Passcode: the good boy. */

const CODE = 'LOUIE'
const HINT = 'CLEARANCE HINT: THE GOOD BOY, FIVE LETTERS'
const N = 92
const PERSPECTIVE = 2.6

type Letter = { char: string; x: number; y: number; z: number }
type Flight = { key: number; char: string; fromX: number; fromY: number; slot: number }
type Phase = 'input' | 'rising' | 'verdict'

function buildLetters(): Letter[] {
  const chars: string[] = []
  // guarantee the code's letters appear generously, fill with alphabet
  for (let r = 0; r < 3; r++) for (const c of CODE) chars.push(c)
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let i = 0
  while (chars.length < N) {
    chars.push(alpha[i % 26])
    i += 7 // scatter, don't cluster alphabetically
  }
  // fibonacci sphere
  const golden = Math.PI * (3 - Math.sqrt(5))
  return chars.map((char, idx) => {
    const y = 1 - (2 * (idx + 0.5)) / N
    const r = Math.sqrt(1 - y * y)
    const phi = idx * golden
    return { char, x: r * Math.cos(phi), y, z: r * Math.sin(phi) }
  })
}

export function GateSphere() {
  const unlock = useGate((s) => s.unlock)
  const hydrate = useGate((s) => s.hydrate)
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const letterEls = useRef<(HTMLButtonElement | null)[]>([])
  const letters = useRef<Letter[]>([])
  const rot = useRef({ yaw: 0, pitch: 0.1 })
  const dragging = useRef<{ x: number; y: number } | null>(null)
  const cursor = useRef<{ x: number; y: number } | null>(null)

  const [slots, setSlots] = useState<(string | null)[]>(Array(CODE.length).fill(null))
  const [flights, setFlights] = useState<Flight[]>([])
  const [phase, setPhase] = useState<Phase>('input')
  const [verdict, setVerdict] = useState<'granted' | 'denied' | null>(null)
  const [typing, setTyping] = useState(false)
  const flightKey = useRef(0)

  useEffect(() => hydrate(), [hydrate])
  if (letters.current.length === 0) letters.current = buildLetters()

  // the sphere lives in a rAF loop, DOM transforms only
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!dragging.current && !reduced && phase === 'input') {
        rot.current.yaw += dt * 0.22
        rot.current.pitch = 0.1 + Math.sin(now / 4200) * 0.12
      }
      const { yaw, pitch } = rot.current
      const cy = Math.cos(yaw), sy = Math.sin(yaw)
      const cp = Math.cos(pitch), sp = Math.sin(pitch)
      const rect = wrap.getBoundingClientRect()
      const R = Math.min(rect.width, rect.height) * 0.36
      const cx = rect.width / 2
      const cz = rect.height / 2

      letters.current.forEach((l, i) => {
        const el = letterEls.current[i]
        if (!el) return
        const x1 = l.x * cy + l.z * sy
        const z1 = -l.x * sy + l.z * cy
        const y2 = l.y * cp - z1 * sp
        const z2 = l.y * sp + z1 * cp
        const s = PERSPECTIVE / (PERSPECTIVE - z2)
        const px = cx + x1 * R * s
        const py = cz - y2 * R * s
        let scale = s * 0.9
        // cursor gravity: letters near the pointer come forward
        if (cursor.current && z2 > -0.2) {
          const d = Math.hypot(px - cursor.current.x, py - cursor.current.y)
          if (d < 110) scale *= 1 + (1 - d / 110) * 0.9
        }
        el.style.transform = `translate(${px}px, ${py}px) translate(-50%,-50%) scale(${scale})`
        el.style.opacity = String(0.25 + ((z2 + 1) / 2) * 0.75)
        el.style.zIndex = String(Math.round((z2 + 1) * 50))
        el.dataset.front = z2 > 0.05 ? '1' : undefined as unknown as string
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, phase])

  const pick = (i: number, e: React.MouseEvent) => {
    if (phase !== 'input') return
    const slot = slots.findIndex((s) => s === null)
    if (slot === -1) return
    const el = letterEls.current[i]
    const wrap = wrapRef.current
    if (!el || !wrap) return
    const wr = wrap.getBoundingClientRect()
    const lr = el.getBoundingClientRect()
    gateSfx.pick(slot)
    const key = flightKey.current++
    setFlights((cur) => [
      ...cur,
      {
        key,
        char: letters.current[i].char,
        fromX: lr.left - wr.left + lr.width / 2,
        fromY: lr.top - wr.top + lr.height / 2,
        slot,
      },
    ])
    // reserve the slot immediately so double-clicks land in order
    setSlots((cur) => cur.map((s, j) => (j === slot ? '·' : s)))
    e.preventDefault()
  }

  const landFlight = (f: Flight) => {
    setSlots((cur) => cur.map((s, j) => (j === f.slot ? f.char : s)))
    setFlights((cur) => cur.filter((x) => x.key !== f.key))
  }

  const removeAt = (i: number) => {
    if (phase !== 'input') return
    gateSfx.remove()
    setSlots((cur) => cur.map((s, j) => (j === i ? null : s)))
  }

  // all slots filled (and no flights in the air) → begin the ritual
  useEffect(() => {
    if (phase !== 'input') return
    if (flights.length > 0) return
    if (slots.some((s) => s === null || s === '·')) return
    setPhase('rising')
  }, [slots, flights, phase])

  // the rising → verdict beat (its own effect so it isn't cancelled when
  // setting phase re-runs the trigger effect above)
  useEffect(() => {
    if (phase !== 'rising') return
    const word = slots.join('')
    const t = setTimeout(() => {
      const ok = word === CODE
      setVerdict(ok ? 'granted' : 'denied')
      setPhase('verdict')
      if (ok) gateSfx.success()
      else gateSfx.fail()
    }, reduced ? 150 : 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const dismissVerdict = () => {
    if (verdict === 'granted') {
      unlock()
    } else {
      setSlots(Array(CODE.length).fill(null))
      setVerdict(null)
      setPhase('input')
    }
  }

  const typed = (v: string) => {
    const clean = v.toUpperCase().replace(/[^A-Z]/g, '').slice(0, CODE.length)
    setSlots(Array.from({ length: CODE.length }, (_, i) => clean[i] ?? null))
  }

  const slotW = 44

  return (
    <div className={styles.gate}>
      <p className={styles.gateHead}>
        RESTRICTED WING · REFINE THE MACRODATA TO ENTER
      </p>

      {/* slots */}
      <div className={styles.slots} role="group" aria-label="Passcode letters">
        {slots.map((s, i) => (
          <span key={i} className={styles.slotCol}>
            <motion.span
              className={styles.slotBox}
              data-filled={(s && s !== '·') || undefined}
              animate={
                phase === 'rising' && !reduced
                  ? { scale: 1.5, y: 26, transition: { delay: i * 0.07, type: 'spring', stiffness: 300, damping: 20 } }
                  : { scale: 1, y: 0 }
              }
            >
              {s && s !== '·' ? s : ''}
            </motion.span>
            {s && s !== '·' && phase === 'input' && (
              <button className={styles.slotX} aria-label={`Remove letter ${i + 1}`} onClick={() => removeAt(i)}>
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {/* the sphere */}
      <div
        ref={wrapRef}
        className={styles.sphere}
        data-receding={phase !== 'input' || undefined}
        onPointerDown={(e) => {
          dragging.current = { x: e.clientX, y: e.clientY }
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          cursor.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
          if (dragging.current) {
            rot.current.yaw += (e.clientX - dragging.current.x) * 0.006
            rot.current.pitch = Math.max(
              -1.2,
              Math.min(1.2, rot.current.pitch + (e.clientY - dragging.current.y) * 0.005)
            )
            dragging.current = { x: e.clientX, y: e.clientY }
          }
        }}
        onPointerUp={() => (dragging.current = null)}
        onPointerLeave={() => {
          cursor.current = null
          dragging.current = null
        }}
      >
        {letters.current.map((l, i) => (
          <button
            key={i}
            ref={(el) => {
              letterEls.current[i] = el
            }}
            className={styles.letter}
            onClick={(e) => pick(i, e)}
            tabIndex={-1}
            aria-hidden="true"
          >
            {l.char}
          </button>
        ))}

        {/* letters in flight */}
        <AnimatePresence>
          {flights.map((f) => (
            <motion.span
              key={f.key}
              className={styles.flying}
              initial={{ left: f.fromX, top: f.fromY, scale: 1.6 }}
              animate={{
                left: `calc(50% + ${(f.slot - (CODE.length - 1) / 2) * slotW}px)`,
                top: -34,
                scale: 1,
              }}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 26 }}
              onAnimationComplete={() => landFlight(f)}
            >
              {f.char}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <p className={styles.hintLine}>{HINT}</p>

      {/* accessible / mobile fallback */}
      <div className={styles.typeRow}>
        {typing ? (
          <input
            className={styles.typeInput}
            autoFocus
            maxLength={CODE.length}
            aria-label="Type the passcode"
            onChange={(e) => typed(e.target.value)}
          />
        ) : (
          <button className={styles.typeToggle} onClick={() => setTyping(true)}>
            PREFER TO TYPE? [ KEYBOARD ENTRY ]
          </button>
        )}
      </div>

      {/* classic-Mac verdict */}
      <AnimatePresence>
        {phase === 'verdict' && (
          <motion.div
            className={styles.dialogWrap}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.dialog}
              initial={reduced ? {} : { scale: 0.85, y: 8 }}
              animate={
                verdict === 'denied' && !reduced
                  ? { scale: 1, y: 0, x: [0, -7, 7, -4, 4, 0], transition: { x: { duration: 0.4 } } }
                  : { scale: 1, y: 0 }
              }
              role="alertdialog"
              aria-label={verdict === 'granted' ? 'Access granted' : 'Access denied'}
            >
              <div className={styles.dialogBar}>
                <span className={styles.dialogStripes} aria-hidden="true" />
                <span className={styles.dialogTitle}>SECURITY</span>
                <span className={styles.dialogStripes} aria-hidden="true" />
              </div>
              <div className={styles.dialogBody}>
                <span className={styles.dialogIcon} aria-hidden="true">
                  {verdict === 'granted' ? '✓' : '☓'}
                </span>
                <p className={styles.dialogText}>
                  {verdict === 'granted'
                    ? 'ACCESS GRANTED. WELCOME TO THE PROJECTS WING, REFINER.'
                    : 'ACCESS DENIED. THE DATA WAS NOT REFINED. THE BOARD IS NOT PLEASED.'}
                </p>
                <button className={styles.dialogOk} onClick={dismissVerdict} autoFocus>
                  {verdict === 'granted' ? 'ENTER' : 'RETRY'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
