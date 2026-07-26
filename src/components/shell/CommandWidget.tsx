'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import styles from './commandWidget.module.css'

/* COMMAND.CTR, ambient form — the orchestration deck as a permanent
   desktop chip. There is no desktop icon for it any more; this chip and
   the /command deep link are the two ways in.

   Two states, and the difference is carried by TEXT, DOT SHAPE and
   ELEVATION before it is carried by colour or motion:

   LIVE  a real Claude session has reported to /api/cc-feed inside the
         last 15 minutes. The chip lifts onto --surface-raised behind a
         full-weight frame, fills its dot with --accent-expressive (with
         a pulse where motion is allowed), reads "LIVE", and expands the
         last few events underneath.
   IDLE  no session running. The chip sits flush on --surface behind a
         hairline with a hollow dot and reads "IDLE" — a dormant
         instrument, not a disabled control. It still offers the deck
         through a labelled "LAST SESSION" control, timestamped when the
         feed knows when that was.

   The feed only ever ages the chip *downwards*: if it is empty, stale or
   unreachable the chip still renders and still opens the deck. */

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
const FEED_ROWS = 4

/* `updated` is the feed's last write, so it outlives the session that
   wrote it. On an instrument this small "2H AGO" reads better than a
   date, and it is computed post-mount only (never during SSR) so there
   is nothing for hydration to disagree about. */
function ago(then: number) {
  const mins = Math.round((Date.now() - then) / 60_000)
  if (mins < 2) return 'JUST NOW'
  if (mins < 60) return `${mins}M AGO`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}H AGO`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}D AGO`
  const wks = Math.round(days / 7)
  return wks < 5 ? `${wks}W AGO` : `${Math.round(days / 30)}MO AGO`
}

export function CommandWidget() {
  const open = useWindows((s) => s.open)
  const windows = useWindows((s) => s.windows)
  const reduced = useReducedMotion()
  const [events, setEvents] = useState<Ev[]>([])
  const [updated, setUpdated] = useState(0)
  const [live, setLive] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let dead = false
    const poll = async () => {
      try {
        const res = await fetch('/api/cc-feed')
        const d: { updated: number; events: Ev[] } = await res.json()
        if (dead) return
        const evs = Array.isArray(d.events) ? d.events : []
        const stamp = typeof d.updated === 'number' ? d.updated : 0
        setUpdated(stamp)
        setEvents(evs.slice(-FEED_ROWS).reverse())
        setLive(stamp > 0 && Date.now() - stamp < LIVE_FRESH_MS && evs.length > 0)
      } catch {
        /* feed unreachable — stay idle, still offer the deck */
      }
    }
    void poll()
    const t = setInterval(() => void poll(), POLL_MS)
    return () => {
      dead = true
      clearInterval(t)
    }
  }, [])

  // a session that goes cold with the feed open shouldn't leave it open
  useEffect(() => {
    if (!live) setExpanded(false)
  }, [live])

  // the full program is open — the ambient chip stands down
  if (windows.some((w) => w.id === 'command')) return null

  const openDeck = () => {
    sfx.open()
    open('command')
  }

  const lastSeen = updated > 0 ? ago(updated) : null

  return (
    <div className={styles.ccWidget} data-state={live ? 'live' : 'idle'}>
      <motion.div
        className={styles.ccBar}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRINGS.widget, delay: 0.5 }}
      >
        {live ? (
          <button
            type="button"
            className={styles.ccPill}
            onClick={() => {
              sfx.tap()
              setExpanded((e) => !e)
            }}
            aria-expanded={expanded}
            aria-label={`Command Center is live — a session is orchestrating now. ${
              expanded ? 'Hide' : 'Show'
            } recent events.`}
          >
            <span className={styles.ccDot} aria-hidden="true" />
            <span className={styles.ccLabel}>COMMAND.CTR · LIVE</span>
            <span className={styles.ccChevron} aria-hidden="true">
              {expanded ? '▴' : '▾'}
            </span>
          </button>
        ) : (
          <>
            <span className={styles.ccPill}>
              <span className={styles.ccDot} aria-hidden="true" />
              <span className={styles.ccLabel}>COMMAND.CTR · IDLE</span>
            </span>
            <button
              type="button"
              className={styles.ccLast}
              onClick={openDeck}
              aria-label={`Command Center is idle. Open the deck to review the last orchestration session${
                lastSeen ? `, ${lastSeen.toLowerCase()}` : ''
              }.`}
            >
              LAST SESSION{lastSeen ? ` · ${lastSeen}` : ''}
              <span aria-hidden="true">&nbsp;→</span>
            </button>
          </>
        )}
      </motion.div>

      {/* only the liveness sentence lives here — never the timestamp, or
          every poll would re-announce as the relative time ticked over */}
      <span className={styles.ccSr} role="status">
        {live
          ? 'Command Center: a session is orchestrating live.'
          : 'Command Center: idle, no session running.'}
      </span>

      <AnimatePresence>
        {live && expanded && (
          <motion.div
            className={styles.ccFeed}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRINGS.deck}
          >
            {events.length === 0 ? (
              <span className={styles.ccRow}>NO TRAFFIC — CREW ASLEEP</span>
            ) : (
              events.map((e, i) => (
                <span key={`${e.t}-${i}`} className={styles.ccRow}>
                  <b>{e.agent.toUpperCase()}</b> · {e.action.toUpperCase()} ·{' '}
                  {e.redact ? (
                    <span
                      className={styles.ccRedact}
                      role="img"
                      aria-label="Redacted — classified until it ships"
                    />
                  ) : (
                    e.label
                  )}
                </span>
              ))
            )}
            <button type="button" className={styles.ccOpen} onClick={openDeck}>
              OPEN FULL DECK
              <span aria-hidden="true">&nbsp;→</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
