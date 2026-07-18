'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { telemetry } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import { avatarFor } from '@/components/shell/crew'
import timeline from './cc-timeline.json'
import styles from './command.module.css'

/* COMMAND.CTR — the orchestration deck. Two modes:
   LIVE — a real Claude session is reporting events to /api/cc-feed
   (fresh within 15 min); the deck streams them, redactions and all.
   REPLAY — the recorded reel of the crew's build history (cc-timeline).
   Style refs: compliance labels, departure boards, routing diagrams,
   specimen scans. Blips: dispatch rises, return falls, merge lands. */

type Ev = {
  t: number
  agent: string
  action: 'dispatch' | 'status' | 'return' | 'review' | 'merge'
  target?: string
  label: string
  redact?: boolean
}

type AgentDef = { id: string; name: string; model: string; role: string }

const AGENTS = timeline.agents as AgentDef[]
const SEQUENCE = timeline.sequence as Ev[]

const ARROW: Record<Ev['action'], string> = {
  dispatch: '↗',
  status: '→',
  return: '↑',
  review: '⊙',
  merge: '▣',
}

const SPEED = 1.6
const FEED_MAX = 9
const LIVE_FRESH_MS = 15 * 60 * 1000
const LIVE_POLL_MS = 20_000

const clock = (t: number) =>
  `00.${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}.${String(Math.floor(t % 60)).padStart(2, '0')}`

type AgentState = { mode: 'idle' | 'busy' | 'flash'; label: string }

const idleStates = (): Record<string, AgentState> =>
  Object.fromEntries(AGENTS.map((a) => [a.id, { mode: 'idle', label: 'STANDING BY' }]))

function applyEvent(states: Record<string, AgentState>, ev: Ev): Record<string, AgentState> {
  const next = { ...states }
  if (!next[ev.agent]) return next
  if (ev.action === 'dispatch' && ev.target && next[ev.target]) {
    next[ev.agent] = { mode: 'flash', label: `DISPATCH → ${ev.target.toUpperCase()}` }
    next[ev.target] = { mode: 'busy', label: ev.redact ? '████████' : ev.label }
  } else if (ev.action === 'status') {
    next[ev.agent] = { mode: 'busy', label: ev.redact ? '████████' : ev.label }
  } else if (ev.action === 'return') {
    next[ev.agent] = { mode: 'flash', label: 'RETURNED · IDLE' }
  } else {
    next[ev.agent] = { mode: 'flash', label: ev.redact ? '████████' : ev.label }
  }
  return next
}

/* marker blackouts — deterministic bar widths from the label so the
   redaction is stable across renders */
function Redacted({ seed }: { seed: string }) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff
  const widths = [22 + (h % 30), 14 + ((h >> 4) % 24), 18 + ((h >> 8) % 34)]
  return (
    <span className={styles.redacted} aria-label="Redacted — classified until it ships">
      {widths.map((w, i) => (
        <span key={i} className={styles.redactBar} style={{ width: w }} aria-hidden="true" />
      ))}
    </span>
  )
}

export default function CommandCenter() {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const [mode, setMode] = useState<'replay' | 'live'>('replay')
  const [feed, setFeed] = useState<Array<Ev & { key: number }>>([])
  const [states, setStates] = useState<Record<string, AgentState>>(idleStates)
  const [cycle, setCycle] = useState(0)
  const cursor = useRef(0)
  const simTime = useRef(0)
  const liveCount = useRef(0)
  const keyseq = useRef(0)

  const blip = (ev: Ev) => {
    if (ev.action === 'dispatch') telemetry.dispatch()
    else if (ev.action === 'return') telemetry.return()
    else if (ev.action === 'merge') telemetry.merge()
  }

  // live-feed probe + poll
  useEffect(() => {
    let alive = true
    let iv: ReturnType<typeof setInterval> | null = null

    const pull = async (first: boolean) => {
      try {
        const res = await fetch('/api/cc-feed')
        const d: { updated: number; events: Ev[] } = await res.json()
        if (!alive) return
        const fresh = d.updated > 0 && Date.now() - d.updated < LIVE_FRESH_MS && d.events.length > 0
        if (!fresh) {
          if (mode === 'live') setMode('replay')
          return
        }
        setMode('live')
        const fresh_events = d.events
        const newOnes = fresh_events.slice(liveCount.current)
        liveCount.current = fresh_events.length
        setFeed(
          fresh_events
            .slice(-FEED_MAX)
            .reverse()
            .map((ev, i) => ({ ...ev, key: 100000 + liveCount.current * 100 + i }))
        )
        setStates(() => fresh_events.slice(-20).reduce(applyEvent, idleStates()))
        if (!first && !reduced) newOnes.forEach((ev) => blip(ev))
      } catch {
        /* feed unreachable → stay in replay */
      }
    }

    void pull(true)
    iv = setInterval(() => void pull(false), LIVE_POLL_MS)
    return () => {
      alive = false
      if (iv) clearInterval(iv)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // replay reel (paused when live or reduced)
  useEffect(() => {
    if (reduced || mode === 'live') return
    cursor.current = 0
    simTime.current = 0
    setFeed([])
    setStates(idleStates())

    const iv = setInterval(() => {
      simTime.current += 0.25 * SPEED
      let advanced = false
      while (cursor.current < SEQUENCE.length && SEQUENCE[cursor.current].t <= simTime.current) {
        const ev = SEQUENCE[cursor.current]
        const key = keyseq.current++
        setFeed((cur) => [{ ...ev, key }, ...cur].slice(0, FEED_MAX))
        setStates((cur) => applyEvent(cur, ev))
        blip(ev)
        cursor.current++
        advanced = true
      }
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
        setCycle((c) => c + 1)
      }
    }, 250)

    return () => clearInterval(iv)
  }, [reduced, cycle, mode])

  const live = mode === 'live'
  const rows: Array<Ev & { key: number }> = reduced && !live
    ? SEQUENCE.map((ev, i) => ({ ...ev, key: i }))
    : feed

  return (
    <div className={styles.ctr}>
      <header className={styles.head}>
        <div className={styles.headL}>
          <span className={styles.headMark} aria-hidden="true" />
          <div>
            <span className={styles.headTitle}>COMMAND.CTR</span>
            <span className={styles.headSub}>LUNDE OS ORCHESTRATION SUPPLY · LISTED I.T.E.</span>
          </div>
        </div>
        <div className={styles.headR}>
          <span className={styles.recChip} data-live={live || undefined}>
            <span className={styles.recDot} aria-hidden="true" />
            {live ? 'LIVE · SESSION IN PROGRESS' : reduced ? 'TRANSCRIPT' : `REPLAY · ${timeline.recorded}`}
          </span>
        </div>
      </header>

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
                  WebkitMaskImage: `url(${avatarFor(a.id, skin)})`,
                  maskImage: `url(${avatarFor(a.id, skin)})`,
                }}
                aria-hidden="true"
              />
              <span className={styles.unitName}>{a.name}</span>
              <span className={styles.unitModel}>{a.model}</span>
              <span className={styles.unitRole}>{a.role}</span>
              <span className={styles.unitStatus} data-mode={s.mode}>
                {reduced && !live ? a.role : s.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className={styles.feed} aria-label="Orchestration feed" aria-live="off">
        <div className={styles.feedHead}>
          <span>T+</span>
          <span>SIG</span>
          <span>UNIT</span>
          <span>TRANSMISSION</span>
        </div>
        <div className={reduced && !live ? styles.feedScroll : undefined}>
          <AnimatePresence initial={false}>
            {rows.map((ev) => (
              <motion.div
                key={ev.key}
                className={styles.row}
                initial={reduced ? false : { opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRINGS.deck}
              >
                <span className={styles.rowT}>{clock(ev.t)}</span>
                <span className={styles.rowArrow} data-action={ev.action}>
                  {ARROW[ev.action]}
                </span>
                <span className={styles.rowAgent}>{ev.agent.toUpperCase()}</span>
                <span className={styles.rowLabel}>
                  {ev.redact ? (
                    <Redacted seed={ev.agent + ev.t + ev.label} />
                  ) : (
                    <>
                      {ev.label}
                      {ev.target ? ` → ${ev.target.toUpperCase()}` : ''}
                    </>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <footer className={styles.caution}>
        <span className={styles.cautionBar} aria-hidden="true" />
        {live
          ? 'LIVE ORCHESTRATION · REDACTIONS PROTECT UNRELEASED WORK'
          : 'RECORDED ORCHESTRATION · SAME CREW, REAL BUILD · NO HUMANS WERE DISPATCHED'}
        <span className={styles.cautionBar} aria-hidden="true" />
      </footer>
    </div>
  )
}
