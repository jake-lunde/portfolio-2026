'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWindows } from '@/store/windows'
import { resolveWindow } from '@/programs/resolve'
import { CREW_AVATARS, CREW_IDS, CREW_VERBS, agentForWindow } from './crew'
import { CREW_DIALOG, FLEE_LINES } from './crewDialog'
import styles from './shell.module.css'

/* The crew, off duty. WANDERER — one unit strolls the desktop's bottom
   edge, pauses to inspect, mutters campy shift-talk in a speech bubble,
   and BOLTS if your cursor gets too close (they are unionized about
   personal space). FLASHES — opening a window summons its responsible
   unit beside the titlebar for a beat. */

type Flash = { key: number; agent: string; x: number; y: number }

const WALK_SPEED = 26 // px/s
const FLEE_SPEED = 190
const SIZE = 34
const FLEE_RADIUS = 64

const line = (agent: string): string => {
  const pool = [...(CREW_DIALOG[agent] ?? []), ...(CREW_DIALOG.anybody ?? [])]
  return pool[Math.floor(Math.random() * pool.length)] ?? 'BRB.'
}

export function AmbientAgents() {
  const reduced = useReducedMotion()

  /* ---- wanderer ---- */
  const walkerRef = useRef<HTMLDivElement>(null)
  const [agentIdx, setAgentIdx] = useState(0)
  const [inspecting, setInspecting] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const [fleeing, setFleeing] = useState(false)
  const pos = useRef(40)
  const dir = useRef(1)
  const mouse = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (reduced) return
    const el = walkerRef.current
    if (!el) return
    let raf = 0
    let last = performance.now()
    let pauseUntil = 0
    let fleeUntil = 0
    let fleeCooldown = 0
    let nextPause = pos.current + 140 + Math.random() * 220

    const onMouse = (e: PointerEvent) => (mouse.current = { x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', onMouse, { passive: true })

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.06, (now - last) / 1000)
      last = now

      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2

      // cursor too close? flee. (once per few seconds, they have dignity)
      if (
        mouse.current &&
        now > fleeCooldown &&
        Math.hypot(mouse.current.x - cx, mouse.current.y - cy) < FLEE_RADIUS
      ) {
        dir.current = mouse.current.x > cx ? -1 : 1
        fleeUntil = now + 650
        fleeCooldown = now + 4000
        pauseUntil = 0
        setFleeing(true)
        setInspecting(false)
        setBubble(FLEE_LINES[Math.floor(Math.random() * FLEE_LINES.length)])
        setTimeout(() => setBubble(null), 1600)
      }

      const isFleeing = now < fleeUntil
      if (!isFleeing && fleeing) setFleeing(false)

      if (!isFleeing && now < pauseUntil) return
      if (!isFleeing && inspecting) setInspecting(false)

      const max = window.innerWidth - SIZE - 24
      pos.current += (isFleeing ? FLEE_SPEED : WALK_SPEED) * dt * dir.current

      if (pos.current > max || pos.current < 16) {
        // shift change: next unit walks the other way
        pos.current = Math.max(16, Math.min(max, pos.current))
        dir.current *= -1
        const next = (agentIdx + 1) % CREW_IDS.length
        setAgentIdx(next)
        setBubble(line(CREW_IDS[next]))
        setTimeout(() => setBubble(null), 2400)
        pauseUntil = now + 1400
      } else if (!isFleeing && Math.abs(pos.current - nextPause) < 2) {
        pauseUntil = now + 2200 + Math.random() * 2600
        nextPause = pos.current + dir.current * (150 + Math.random() * 240)
        setInspecting(true)
        if (Math.random() < 0.65) {
          setBubble(line(CREW_IDS[agentIdx]))
          setTimeout(() => setBubble(null), 2600)
        }
      }
      el.style.transform = `translateX(${pos.current}px)`
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMouse)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, agentIdx, fleeing, inspecting])

  /* ---- dispatch flashes ---- */
  const [flashes, setFlashes] = useState<Flash[]>([])
  const known = useRef<Set<string> | null>(null)
  const flashKey = useRef(0)

  useEffect(() => {
    const unsub = useWindows.subscribe((state) => {
      const ids = new Set(state.windows.map((w) => w.id))
      if (known.current === null) {
        known.current = ids
        return
      }
      for (const id of ids) {
        if (!known.current.has(id)) {
          const def = resolveWindow(id)
          if (def) {
            const key = flashKey.current++
            const agent = agentForWindow(id)
            setFlashes((cur) => [
              ...cur.slice(-2),
              { key, agent, x: def.pos.x + def.size.w - 56, y: Math.max(40, def.pos.y - 4) },
            ])
            setTimeout(() => setFlashes((cur) => cur.filter((f) => f.key !== key)), 1900)
          }
        }
      }
      known.current = ids
    })
    return unsub
  }, [])

  const walkerAgent = CREW_IDS[agentIdx]

  return (
    <>
      {!reduced && (
        <div ref={walkerRef} className={styles.wanderer} aria-hidden="true">
          <AnimatePresence>
            {bubble && (
              <motion.span
                className={styles.bubble}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {bubble}
              </motion.span>
            )}
          </AnimatePresence>
          <span
            className={styles.wandererAvatar}
            data-inspecting={inspecting || undefined}
            data-fleeing={fleeing || undefined}
            style={{
              transform: `scaleX(${dir.current})`,
              WebkitMaskImage: `url(${CREW_AVATARS[walkerAgent]})`,
              maskImage: `url(${CREW_AVATARS[walkerAgent]})`,
            }}
          />
        </div>
      )}

      <AnimatePresence>
        {flashes.map((f) => (
          <motion.div
            key={f.key}
            className={styles.dispatchFlash}
            style={{ left: f.x, top: f.y }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-hidden="true"
          >
            <span
              className={styles.flashAvatar}
              style={{
                WebkitMaskImage: `url(${CREW_AVATARS[f.agent]})`,
                maskImage: `url(${CREW_AVATARS[f.agent]})`,
              }}
            />
            <span className={styles.flashLabel}>
              {f.agent.toUpperCase()} · {CREW_VERBS[f.agent]}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  )
}
