'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWindows } from '@/store/windows'
import { resolveWindow } from '@/programs/resolve'
import { CREW_AVATARS, CREW_IDS, CREW_VERBS, agentForWindow } from './crew'
import styles from './shell.module.css'

/* The crew, off duty — two ambient behaviors that make the OS feel
   inhabited:
   WANDERER — one unit at a time strolls the bottom edge of the desktop,
   pausing now and then to inspect. Reaching an edge, it clocks out and
   the next unit takes the shift.
   FLASHES — opening a window summons its responsible unit beside the
   titlebar for a moment ("NYQUIST · MOUNTING"). */

type Flash = { key: number; agent: string; x: number; y: number }

const WALK_SPEED = 26 // px/s
const SIZE = 22

export function AmbientAgents() {
  const reduced = useReducedMotion()

  /* ---- wanderer ---- */
  const walkerRef = useRef<HTMLDivElement>(null)
  const [agentIdx, setAgentIdx] = useState(0)
  const [inspecting, setInspecting] = useState(false)
  const pos = useRef(40)
  const dir = useRef(1)

  useEffect(() => {
    if (reduced) return
    const el = walkerRef.current
    if (!el) return
    let raf = 0
    let last = performance.now()
    let pauseUntil = 0
    let nextPause = pos.current + 140 + Math.random() * 220

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.06, (now - last) / 1000)
      last = now
      if (now < pauseUntil) return
      if (inspecting) setInspecting(false)

      const max = window.innerWidth - SIZE - 24
      pos.current += WALK_SPEED * dt * dir.current

      if (pos.current > max || pos.current < 16) {
        // shift change: next unit walks the other way
        pos.current = Math.max(16, Math.min(max, pos.current))
        dir.current *= -1
        setAgentIdx((i) => (i + 1) % CREW_IDS.length)
        pauseUntil = now + 1200
      } else if (Math.abs(pos.current - nextPause) < 2) {
        pauseUntil = now + 1800 + Math.random() * 2600
        nextPause = pos.current + dir.current * (140 + Math.random() * 240)
        setInspecting(true)
      }
      el.style.transform = `translateX(${pos.current}px) scaleX(${dir.current})`
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  /* ---- dispatch flashes ---- */
  const [flashes, setFlashes] = useState<Flash[]>([])
  const known = useRef<Set<string> | null>(null)
  const flashKey = useRef(0)

  useEffect(() => {
    const unsub = useWindows.subscribe((state) => {
      const ids = new Set(state.windows.map((w) => w.id))
      if (known.current === null) {
        known.current = ids // ignore the windows a deep link opened
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
            setTimeout(
              () => setFlashes((cur) => cur.filter((f) => f.key !== key)),
              1900
            )
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
        <div
          ref={walkerRef}
          className={styles.wanderer}
          data-inspecting={inspecting || undefined}
          aria-hidden="true"
        >
          <span
            className={styles.wandererAvatar}
            style={{
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
