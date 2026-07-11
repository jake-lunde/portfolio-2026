'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import styles from './shell.module.css'

/* COMMAND.CTR, ambient form — a deck chip on the desktop that says
   whether a real Claude session is orchestrating RIGHT NOW. Collapsed:
   status pill with a pulsing pink dot when live. Expanded: the last few
   feed events + a button into the full program. */

type Ev = {
  t: number
  agent: string
  action: 'dispatch' | 'status' | 'return' | 'review' | 'merge'
  target?: string
  label: string
  redact?: boolean
}

const LIVE_FRESH_MS = 15 * 60_000
const POLL_MS = 45_000

export function CommandWidget() {
  const open = useWindows((s) => s.open)
  const windows = useWindows((s) => s.windows)
  const reduced = useReducedMotion()
  const [events, setEvents] = useState<Ev[]>([])
  const [live, setLive] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let dead = false
    const poll = async () => {
      try {
        const res = await fetch('/api/cc-feed')
        const d: { updated: number; events: Ev[] } = await res.json()
        if (dead) return
        setEvents(d.events.slice(-4).reverse())
        setLive(d.updated > 0 && Date.now() - d.updated < LIVE_FRESH_MS && d.events.length > 0)
      } catch {}
    }
    poll()
    const t = setInterval(poll, POLL_MS)
    return () => {
      dead = true
      clearInterval(t)
    }
  }, [])

  // the full program is open — the widget stands down
  if (windows.some((w) => w.id === 'command')) return null
  // only surface when a real session is orchestrating; silent when idle
  if (!live) return null

  return (
    <div className={styles.ccWidget} data-live>
      <button
        className={styles.ccPill}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={`Command Center: live session in progress. ${expanded ? 'Collapse' : 'Expand'} feed.`}
      >
        <span className={styles.ccDot} aria-hidden="true" />
        COMMAND.CTR · LIVE
        <span className={styles.ccChevron} aria-hidden="true">
          {expanded ? '▴' : '▾'}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.ccFeed}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {events.length === 0 && <span className={styles.ccRow}>NO TRAFFIC — CREW ASLEEP</span>}
            {events.map((e, i) => (
              <span key={`${e.t}-${i}`} className={styles.ccRow}>
                <b>{e.agent.toUpperCase()}</b> · {e.action.toUpperCase()} ·{' '}
                {e.redact ? <span className={styles.ccRedact} aria-label="redacted" /> : e.label}
              </span>
            ))}
            <button
              className={styles.ccOpen}
              onClick={() => {
                sfx.open()
                open('command')
              }}
            >
              OPEN FULL DECK →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
