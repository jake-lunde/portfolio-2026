'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import timeline from './cc-timeline.json'
import styles from './command.module.css'

/* COMMAND.CTR — the orchestration deck. A brutalist replay of the crew
   that built this OS (and still builds it): FABLE dispatching HERTZ,
   NYQUIST, FOURIER and DOPPLER across the real build history, recast as
   mission telemetry. On the site it's a recorded sequence; the format is
   the same one live sessions produce. Style refs: compliance labels,
   departure boards, routing diagrams, 1-bit specimen scans. */

type Ev = {
  t: number
  agent: string
  action: 'dispatch' | 'status' | 'return' | 'review' | 'merge'
  target?: string
  label: string
}

type AgentDef = { id: string; name: string; model: string; role: string }

const AGENTS = timeline.agents as AgentDef[]
const SEQUENCE = timeline.sequence as Ev[]

/* avatar assignments — shapes from the command-center set */
const AVATARS: Record<string, string> = {
  fable: '/cc/avatars/shape-101.svg',
  hertz: '/cc/avatars/shape-12.svg',
  nyquist: '/cc/avatars/shape-27.svg',
  fourier: '/cc/avatars/shape-46.svg',
  doppler: '/cc/avatars/shape-17.svg',
}

const ARROW: Record<Ev['action'], string> = {
  dispatch: '↗',
  status: '→',
  return: '↑',
  review: '⊙',
  merge: '▣',
}

const SPEED = 1.6 // sim seconds per real second
const FEED_MAX = 9

const clock = (t: number) =>
  `00.${String(Math.floor(t / 60)).padStart(2, '0')}.${String(Math.floor(t % 60)).padStart(2, '0')}`

type AgentState = { mode: 'idle' | 'busy' | 'flash'; label: string }

export default function CommandCenter() {
  const reduced = useReducedMotion()
  const [feed, setFeed] = useState<Array<Ev & { key: number }>>([])
  const [states, setStates] = useState<Record<string, AgentState>>(() =>
    Object.fromEntries(AGENTS.map((a) => [a.id, { mode: 'idle', label: 'STANDING BY' }]))
  )
  const [cycle, setCycle] = useState(0)
  const cursor = useRef(0)
  const simTime = useRef(0)

  useEffect(() => {
    if (reduced) return // static full transcript instead
    cursor.current = 0
    simTime.current = 0
    setFeed([])
    setStates(Object.fromEntries(AGENTS.map((a) => [a.id, { mode: 'idle', label: 'STANDING BY' }])))

    const iv = setInterval(() => {
      simTime.current += 0.25 * SPEED
      let advanced = false
      while (cursor.current < SEQUENCE.length && SEQUENCE[cursor.current].t <= simTime.current) {
        const ev = SEQUENCE[cursor.current]
        const key = cycle * 1000 + cursor.current
        setFeed((cur) => [{ ...ev, key }, ...cur].slice(0, FEED_MAX))
        setStates((cur) => {
          const next = { ...cur }
          if (ev.action === 'dispatch' && ev.target) {
            next[ev.agent] = { mode: 'flash', label: `DISPATCH → ${ev.target.toUpperCase()}` }
            next[ev.target] = { mode: 'busy', label: ev.label }
          } else if (ev.action === 'status') {
            next[ev.agent] = { mode: 'busy', label: ev.label }
          } else if (ev.action === 'return') {
            next[ev.agent] = { mode: 'flash', label: 'RETURNED · IDLE' }
          } else {
            next[ev.agent] = { mode: 'flash', label: ev.label }
          }
          return next
        })
        cursor.current++
        advanced = true
      }
      // settle flashes back to idle/busy
      if (!advanced) {
        setStates((cur) => {
          let changed = false
          const next = { ...cur }
          for (const id of Object.keys(next)) {
            if (next[id].mode === 'flash') {
              next[id] = { mode: 'idle', label: next[id].label.replace('DISPATCH → ', 'SENT → ') }
              changed = true
            }
          }
          return changed ? next : cur
        })
      }
      if (cursor.current >= SEQUENCE.length && simTime.current > 126) {
        setCycle((c) => c + 1) // loop the reel
      }
    }, 250)

    return () => clearInterval(iv)
  }, [reduced, cycle])

  return (
    <div className={styles.ctr}>
      {/* compliance header */}
      <header className={styles.head}>
        <div className={styles.headL}>
          <span className={styles.headMark} aria-hidden="true" />
          <div>
            <span className={styles.headTitle}>COMMAND.CTR</span>
            <span className={styles.headSub}>LUNDE OS ORCHESTRATION SUPPLY · LISTED I.T.E.</span>
          </div>
        </div>
        <div className={styles.headR}>
          <span className={styles.recChip}>
            <span className={styles.recDot} aria-hidden="true" />
            {reduced ? 'TRANSCRIPT' : 'REPLAY'} · {timeline.recorded}
          </span>
          <span className={styles.headClock}>{clock(Math.min(simTime.current, 126))}</span>
        </div>
      </header>

      {/* crew bay */}
      <div className={styles.bay} role="list" aria-label="Agent crew">
        <svg className={styles.bayLines} aria-hidden="true" viewBox="0 0 700 90" preserveAspectRatio="none">
          <path d="M70 78 L210 12 M210 78 L490 10 M350 80 L630 14 M70 12 L630 78 M490 78 L350 8" stroke="currentColor" strokeWidth="0.6" opacity="0.16" fill="none" />
        </svg>
        {AGENTS.map((a) => {
          const s = states[a.id]
          return (
            <div key={a.id} role="listitem" className={styles.unit} data-mode={s.mode}>
              <span className={styles.scanMark} aria-hidden="true" />
              <div
                className={styles.avatar}
                data-mode={s.mode}
                style={{
                  WebkitMaskImage: `url(${AVATARS[a.id]})`,
                  maskImage: `url(${AVATARS[a.id]})`,
                }}
                aria-hidden="true"
              />
              <span className={styles.unitName}>{a.name}</span>
              <span className={styles.unitModel}>{a.model}</span>
              <span className={styles.unitRole}>{a.role}</span>
              <span className={styles.unitStatus} data-mode={s.mode}>
                {reduced ? a.role : s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* feed — departure board */}
      <div className={styles.feed} aria-label="Orchestration feed" aria-live="off">
        <div className={styles.feedHead}>
          <span>T+</span>
          <span>SIG</span>
          <span>UNIT</span>
          <span>TRANSMISSION</span>
        </div>
        {reduced ? (
          <div className={styles.feedScroll}>
            {SEQUENCE.map((ev, i) => (
              <div key={i} className={styles.row}>
                <span className={styles.rowT}>{clock(ev.t)}</span>
                <span className={styles.rowArrow} data-action={ev.action}>
                  {ARROW[ev.action]}
                </span>
                <span className={styles.rowAgent}>{ev.agent.toUpperCase()}</span>
                <span className={styles.rowLabel}>
                  {ev.label}
                  {ev.target ? ` → ${ev.target.toUpperCase()}` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {feed.map((ev) => (
              <motion.div
                key={ev.key}
                className={styles.row}
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              >
                <span className={styles.rowT}>{clock(ev.t)}</span>
                <span className={styles.rowArrow} data-action={ev.action}>
                  {ARROW[ev.action]}
                </span>
                <span className={styles.rowAgent}>{ev.agent.toUpperCase()}</span>
                <span className={styles.rowLabel}>
                  {ev.label}
                  {ev.target ? ` → ${ev.target.toUpperCase()}` : ''}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* caution strip */}
      <footer className={styles.caution}>
        <span className={styles.cautionBar} aria-hidden="true" />
        RECORDED ORCHESTRATION · SAME CREW, REAL BUILD · NO HUMANS WERE DISPATCHED
        <span className={styles.cautionBar} aria-hidden="true" />
      </footer>
    </div>
  )
}
