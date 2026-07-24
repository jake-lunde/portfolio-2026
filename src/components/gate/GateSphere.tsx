'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useGate } from '@/store/gate'
import { useSettings } from '@/store/settings'
import { Button } from '@/components/primitives/Button'
import { SPRINGS } from '@/lib/motion'
import { gateSfx } from '@/lib/sound'
import { GATE } from './gateConfig'
import { CopyText as Copy } from '@/content/CopyText'
import styles from './gate.module.css'

/* THE GATE — macrodata-refinement clearance for the Projects wing.
   A sphere of letters: drag to rotate (it drifts on its own otherwise),
   letters swell toward the cursor, click one and it flies into a slot.
   Fill the word, the letters rise, the sphere recedes, and a very
   classic dialog delivers the verdict. The work is mysterious and
   important. Passcode: the good boy. */

const N = 92
const PERSPECTIVE = 2.6

type Letter = { char: string; x: number; y: number; z: number }
type Flight = { key: number; char: string; fromX: number; fromY: number; slot: number }
type Phase = 'input' | 'rising' | 'verdict'

function buildLetters(code: string): Letter[] {
  const chars: string[] = []
  // guarantee the code's letters appear generously, fill with alphabet
  for (let r = 0; r < 3; r++) for (const c of code) chars.push(c)
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
  const skin = useSettings((s) => s.skin)
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const letterEls = useRef<(HTMLButtonElement | null)[]>([])
  const letters = useRef<Letter[]>([])
  const builtForCode = useRef<string>('')
  const rot = useRef({ yaw: 0, pitch: 0.1 })
  const dragging = useRef<{ x: number; y: number; t: number } | null>(null)
  const dragDist = useRef(0)
  const vel = useRef({ yaw: 0, pitch: 0 })
  const cursor = useRef<{ x: number; y: number } | null>(null)

  const config = GATE[skin] ?? GATE.classic
  const CODE = config.code

  const [slots, setSlots] = useState<(string | null)[]>(() => Array(CODE.length).fill(null))
  const [flights, setFlights] = useState<Flight[]>([])
  const [phase, setPhase] = useState<Phase>('input')
  const [verdict, setVerdict] = useState<'granted' | 'denied' | null>(null)
  const [typing, setTyping] = useState(false)
  const flightKey = useRef(0)
  const prevCodeRef = useRef(CODE)

  useEffect(() => hydrate(), [hydrate])
  if (letters.current.length === 0 || builtForCode.current !== CODE) {
    letters.current = buildLetters(CODE)
    builtForCode.current = CODE
  }

  // the sphere rebuilds its letters (above) whenever the skin's code
  // changes; here we reset the in-progress attempt to match the new code
  useEffect(() => {
    if (prevCodeRef.current === CODE) return
    prevCodeRef.current = CODE
    setSlots(Array(CODE.length).fill(null))
    setFlights([])
    setPhase('input')
    setVerdict(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CODE])

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
        // inertia from the last drag, decaying…
        rot.current.yaw += vel.current.yaw * dt
        rot.current.pitch = Math.max(-1.2, Math.min(1.2, rot.current.pitch + vel.current.pitch * dt))
        const decay = Math.exp(-2.6 * dt)
        vel.current.yaw *= decay
        vel.current.pitch *= decay
        // …blending back into the ambient drift as it settles
        const settled = 1 - Math.min(1, Math.abs(vel.current.yaw) / 0.6)
        rot.current.yaw += dt * 0.22 * settled
        rot.current.pitch += (0.1 + Math.sin(now / 4200) * 0.12 - rot.current.pitch) * dt * 0.6 * settled
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
        if (z2 > 0.05) el.dataset.front = '1'
        else delete el.dataset.front
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, phase])

  const pick = (i: number, e: React.MouseEvent) => {
    if (phase !== 'input') return
    if (dragDist.current > 6) return // that was a drag, not a pick
    const slot = slots.findIndex((s) => s === null)
    if (slot === -1) return
    const el = letterEls.current[i]
    const wrap = wrapRef.current
    if (!el || !wrap) return
    const wr = wrap.getBoundingClientRect()
    const lr = el.getBoundingClientRect()
    gateSfx.pick(slot)
    const key = flightKey.current++
    const flight: Flight = {
      key,
      char: letters.current[i].char,
      fromX: lr.left - wr.left + lr.width / 2,
      fromY: lr.top - wr.top + lr.height / 2,
      slot,
    }
    setFlights((cur) => [...cur, flight])
    // reserve the slot immediately so double-clicks land in order
    setSlots((cur) => cur.map((s, j) => (j === slot ? '·' : s)))
    // safety net: if the spring never reports completion (hidden tab,
    // interrupted animation), the letter still lands
    setTimeout(() => landFlight(flight), reduced ? 250 : 1100)
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
      <p className={styles.gateHead}>{config.header}</p>

      {/* slots */}
      <div className={styles.slots} role="group" aria-label="Passcode letters">
        {slots.map((s, i) => (
          <span key={i} className={styles.slotCol}>
            <motion.span
              className={styles.slotBox}
              data-filled={(s && s !== '·') || undefined}
              animate={
                phase === 'rising' && !reduced
                  ? { scale: 1.5, y: 26, transition: { delay: i * 0.07, ...SPRINGS.rise } }
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
          // NOTE: no pointer capture here — capturing on the wrapper retargets
          // the click away from the letter buttons and picking silently dies
          dragging.current = { x: e.clientX, y: e.clientY, t: performance.now() }
          dragDist.current = 0
          vel.current = { yaw: 0, pitch: 0 }
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          cursor.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
          if (dragging.current) {
            const dx = e.clientX - dragging.current.x
            const dy = e.clientY - dragging.current.y
            const now = performance.now()
            const dt = Math.max(8, now - dragging.current.t) / 1000
            dragDist.current += Math.abs(dx) + Math.abs(dy)
            rot.current.yaw += dx * 0.006
            rot.current.pitch = Math.max(-1.2, Math.min(1.2, rot.current.pitch + dy * 0.005))
            // remember release velocity for inertia (clamped so a flick spins, not warps)
            vel.current.yaw = Math.max(-3, Math.min(3, (dx * 0.006) / dt))
            vel.current.pitch = Math.max(-2, Math.min(2, (dy * 0.005) / dt))
            dragging.current = { x: e.clientX, y: e.clientY, t: now }
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
              transition={reduced ? { duration: 0 } : SPRINGS.flight}
              onAnimationComplete={() => landFlight(f)}
            >
              {f.char}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <p className={styles.hintLine}>{config.hint}</p>

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
            <Copy k="gate.typeToggle" as="span" />
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
                <Copy k="gate.securityTitle" as="span" className={styles.dialogTitle} />
                <span className={styles.dialogStripes} aria-hidden="true" />
              </div>
              <div className={styles.dialogBody}>
                <span className={styles.dialogIcon} aria-hidden="true">
                  {verdict === 'granted' ? '✓' : '☓'}
                </span>
                <p className={styles.dialogText}>
                  {verdict === 'granted' ? config.granted : config.denied}
                </p>
                <Button
                  tone="expressive"
                  size="md"
                  className={styles.dialogOk}
                  onClick={dismissVerdict}
                  autoFocus
                >
                  {verdict === 'granted' ? (
                    <Copy k="gate.enter" as="span" />
                  ) : (
                    <Copy k="gate.retry" as="span" />
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
