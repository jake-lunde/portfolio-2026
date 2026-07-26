'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { sfx, telemetry } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import { CopyText as Copy } from '@/content/CopyText'
import {
  CREW,
  DELEGATES,
  HUMAN,
  HUMAN_PORTRAIT,
  LEADS,
  avatarFor,
  isCrewId,
} from '@/components/shell/crew'
import timeline from './cc-timeline.json'
import styles from './command.module.css'

/* COMMAND.CTR — the orchestration deck. Two modes:
   LIVE — a real Claude session is reporting events to /api/cc-feed
   (fresh within 15 min); the deck streams them, redactions and all.
   REPLAY — the recorded reel of the crew's build history (cc-timeline).

   The deck is a PYRAMID, because the shape is the argument: Jake on top
   (prompts, curation, taste), FABLE in the middle (splits the brief),
   four units at the base (the fan-out). Work descends as briefs and
   climbs back as returns that Jake picks over. A visitor who reads
   nothing else should still come away knowing which layer is the human.

   Style refs: compliance labels, departure boards, routing diagrams,
   specimen scans. Blips: dispatch rises, return falls, merge lands. */

type Action = 'dispatch' | 'status' | 'return' | 'review' | 'merge' | 'prompt' | 'curate'

type Ev = {
  t: number
  agent: string
  action: Action
  target?: string
  label: string
  redact?: boolean
}

const SEQUENCE = (timeline.sequence as Ev[]).filter((e) => isCrewId(e.agent))

const ARROW: Record<Action, string> = {
  prompt: '✎',
  curate: '✓',
  dispatch: '↗',
  status: '→',
  return: '↑',
  review: '⊙',
  merge: '▣',
}

const SPEED = 1.6
const FEED_MAX = 7
const PROMPT_MAX = 3
const LIVE_FRESH_MS = 15 * 60 * 1000
const LIVE_POLL_MS = 20_000
/* a constant, not useId(): programs are dynamic imports into a tree that
   reshapes at the SSR handover, and useId disagrees with itself there */
const LOG_ID = 'cc-transmission-log'

const clock = (t: number) =>
  `00.${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}.${String(Math.floor(t % 60)).padStart(2, '0')}`

const isJakeSaying = (e: Ev) =>
  e.agent === HUMAN.id && (e.action === 'prompt' || e.action === 'curate')

type AgentState = { mode: 'idle' | 'busy' | 'flash'; label: string }

/* At rest a unit says what it IS, not "STANDING BY" — the explainer
   lives in the state a visitor sees most of the time, and gets replaced
   by real telemetry the moment there is any. */
const idleStates = (): Record<string, AgentState> =>
  Object.fromEntries([HUMAN, ...CREW].map((a) => [a.id, { mode: 'idle', label: a.blurb }]))

function applyEvent(states: Record<string, AgentState>, ev: Ev): Record<string, AgentState> {
  const next = { ...states }
  if (!next[ev.agent]) return next
  if (ev.action === 'prompt' || ev.action === 'curate') {
    next[ev.agent] = { mode: 'flash', label: ev.redact ? '████████' : ev.label }
  } else if (ev.action === 'dispatch' && ev.target && next[ev.target]) {
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

/* one machine in the bay — avatar, call sign, model, job, live status */
function Unit({
  id,
  name,
  model,
  role,
  blurb,
  state,
  skin,
  showBlurb,
  wide,
}: {
  id: string
  name: string
  model: string
  role: string
  blurb: string
  state: AgentState
  skin: 'classic' | 'medieval' | 'underwater'
  showBlurb: boolean
  wide?: boolean
}) {
  return (
    <div role="listitem" className={styles.unit} data-mode={state.mode} data-wide={wide || undefined}>
      <span className={styles.scanMark} aria-hidden="true" />
      <div
        className={styles.avatar}
        data-mode={state.mode}
        style={{
          WebkitMaskImage: `url(${avatarFor(id, skin)})`,
          maskImage: `url(${avatarFor(id, skin)})`,
        }}
        aria-hidden="true"
      />
      <span className={styles.unitName}>{name}</span>
      <span className={styles.unitModel}>{model}</span>
      <span className={styles.unitRole}>{role}</span>
      <span className={styles.unitStatus} data-mode={state.mode}>
        {showBlurb ? blurb : state.label}
      </span>
    </div>
  )
}

export default function CommandCenter() {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const [mode, setMode] = useState<'replay' | 'live'>('replay')
  const [feed, setFeed] = useState<Array<Ev & { key: number }>>([])
  /* Jake's inputs are kept on their own rail, not read off the feed:
     the ticker only holds seven rows and the human speaks far less
     often than the machines — his last words would scroll away in
     seconds and leave the top of the pyramid mute. */
  const [prompts, setPrompts] = useState<Ev[]>([])
  const [states, setStates] = useState<Record<string, AgentState>>(idleStates)
  const [cycle, setCycle] = useState(0)
  const [logOpen, setLogOpen] = useState(false)
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
        // a report with a bad call sign is dropped, not drawn: the deck
        // never invents a unit it can't name
        const events = (Array.isArray(d.events) ? d.events : []).filter((e) => isCrewId(e.agent))
        const fresh = d.updated > 0 && Date.now() - d.updated < LIVE_FRESH_MS && events.length > 0
        if (!fresh) {
          if (mode === 'live') setMode('replay')
          return
        }
        setMode('live')
        const newOnes = events.slice(liveCount.current)
        liveCount.current = events.length
        setFeed(
          events
            .slice(-FEED_MAX)
            .reverse()
            .map((ev, i) => ({ ...ev, key: 100000 + liveCount.current * 100 + i }))
        )
        setStates(() => events.slice(-20).reduce(applyEvent, idleStates()))
        setPrompts(events.filter(isJakeSaying).slice(-PROMPT_MAX).reverse())
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
    setPrompts([])
    setStates(idleStates())

    const iv = setInterval(() => {
      simTime.current += 0.25 * SPEED
      let advanced = false
      while (cursor.current < SEQUENCE.length && SEQUENCE[cursor.current].t <= simTime.current) {
        const ev = SEQUENCE[cursor.current]
        const key = keyseq.current++
        setFeed((cur) => [{ ...ev, key }, ...cur].slice(0, FEED_MAX))
        if (isJakeSaying(ev)) setPrompts((cur) => [ev, ...cur].slice(0, PROMPT_MAX))
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
  const transcript = Boolean(reduced) && !live
  const rows: Array<Ev & { key: number }> = transcript
    ? SEQUENCE.map((ev, i) => ({ ...ev, key: i }))
    : feed

  /* Jake's side of the wire, broken into pieces — you can't show a whole
     prompt on a departure board, and you shouldn't: the fragments are
     the tell that a human is steering. Newest first. */
  const said = transcript
    ? [...SEQUENCE].reverse().filter(isJakeSaying).slice(0, PROMPT_MAX)
    : prompts

  return (
    <div className={styles.ctr} data-log={logOpen ? 'open' : 'closed'}>
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
            {live ? 'LIVE · SESSION IN PROGRESS' : transcript ? 'TRANSCRIPT' : `REPLAY · ${timeline.recorded}`}
          </span>
        </div>
      </header>

      {/* No thesis band here any more — "what am I looking at" is a
          window-chrome affordance now (WHAT IS THIS in the titlebar), so
          the deck spends its height on telemetry instead of a paragraph. */}

      <div className={styles.pyramid} role="list" aria-label="The crew, top to bottom">
        {/* ---- tier 1: the human ---- */}
        <div className={styles.tier} data-tier="human">
          <div role="listitem" className={styles.human} data-mode={states[HUMAN.id]?.mode}>
            <span className={styles.scanMark} aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.portrait} src={HUMAN_PORTRAIT} alt="" aria-hidden="true" />
            <div className={styles.humanId}>
              <span className={styles.unitName}>{HUMAN.name}</span>
              <span className={styles.humanModel}>
                {HUMAN.model} · {HUMAN.role}
              </span>
              <span className={styles.humanBlurb}>{HUMAN.blurb}</span>
            </div>
          </div>

          {/* The rail holds a fixed number of slots and `popLayout` takes
              a leaving chip out of flow the instant it starts to go, so
              the arriving one never stacks on top of it — the box used to
              grow for a beat and then settle. SPRINGS.human, not .deck:
              the machines move digitally, the human is allowed to
              overshoot and settle. */}
          <div className={styles.prompts} aria-label="Jake's last inputs">
            <AnimatePresence initial={false} mode="popLayout">
              {said.length === 0 ? (
                <span className={styles.promptChip} data-kind="empty">
                  AWAITING THE HUMAN
                </span>
              ) : (
                said.map((p) => (
                  <motion.span
                    key={`${p.t}-${p.label}`}
                    layout={reduced ? false : 'position'}
                    className={styles.promptChip}
                    data-kind={p.action}
                    initial={reduced ? false : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    transition={SPRINGS.human}
                  >
                    <span className={styles.promptKind} aria-hidden="true">
                      {p.action === 'curate' ? 'PICKS' : 'ASKS'}
                    </span>
                    {p.redact ? <Redacted seed={p.label + p.t} /> : `“${p.label}”`}
                  </motion.span>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* The loop, labelled — and each label sits over the column it
            describes, so the alignment does the explaining: BRIEF lands on
            FABLE, RETURNS lands on SHANNON. Same 2-up grid as the tier. */}
        <div className={styles.edge} data-over="lead" aria-hidden="true">
          <span className={styles.edgeCell}>
            <span className={styles.edgeRule} />
            <span className={styles.edgeDown}>↓ BRIEF</span>
            <span className={styles.edgeRule} />
          </span>
          <span className={styles.edgeCell}>
            <span className={styles.edgeRule} />
            <span className={styles.edgeUp}>RETURNS ↑ JAKE CURATES</span>
            <span className={styles.edgeRule} />
          </span>
        </div>

        {/* ---- tier 2: the two units Jake briefs directly ---- */}
        <div className={styles.tier} data-tier="lead">
          {LEADS.map((a) => (
            <Unit
              key={a.id}
              id={a.id}
              name={a.name}
              model={a.model}
              role={a.role}
              blurb={a.blurb}
              state={states[a.id]}
              skin={skin}
              showBlurb={transcript}
              wide
            />
          ))}
        </div>

        <div className={styles.edge} data-over="crew" aria-hidden="true">
          <span className={styles.edgeCell}>
            <span className={styles.edgeRule} />
            <span className={styles.edgeDown}>↓ DISPATCH · ONE WHOLE TASK EACH</span>
            <span className={styles.edgeRule} />
          </span>
        </div>

        {/* ---- tier 3: the fan-out ---- */}
        <div className={styles.tier} data-tier="crew">
          <svg
            className={styles.tierLines}
            aria-hidden="true"
            viewBox="0 0 700 24"
            preserveAspectRatio="none"
          >
            <path
              d="M175 0 L88 24 M175 0 L262 24 M175 0 L438 24 M175 0 L612 24 M525 0 L88 24 M525 0 L262 24 M525 0 L438 24 M525 0 L612 24"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.22"
              fill="none"
            />
          </svg>
          {DELEGATES.map((a) => (
            <Unit
              key={a.id}
              id={a.id}
              name={a.name}
              model={a.model}
              role={a.role}
              blurb={a.blurb}
              state={states[a.id]}
              skin={skin}
              showBlurb={transcript}
            />
          ))}
        </div>
      </div>

      {/* The log is the RECEIPT, not the headline — collapsed by default so
          the pyramid is what you meet first. The toggle keeps carrying the
          live count, so a closed log still tells you traffic is moving. */}
      <div className={styles.feed} data-open={logOpen || undefined}>
        <button
          type="button"
          className={styles.feedToggle}
          onClick={() => {
            sfx.tap()
            setLogOpen((v) => !v)
          }}
          aria-expanded={logOpen}
          aria-controls={LOG_ID}
        >
          <span className={styles.feedChevron} aria-hidden="true">
            {logOpen ? '▾' : '▸'}
          </span>
          <span>TRANSMISSION LOG</span>
          <span className={styles.feedCount}>
            {rows.length} {live ? 'LIVE' : transcript ? 'RECORDED' : 'ON THE WIRE'}
          </span>
        </button>

        {logOpen && (
          <div id={LOG_ID} aria-label="Orchestration feed" aria-live="off">
            <div className={styles.feedHead}>
              <span>T+</span>
              <span>SIG</span>
              <span>UNIT</span>
              <span>TRANSMISSION</span>
            </div>
            <div className={transcript ? styles.feedScroll : undefined}>
              <AnimatePresence initial={false}>
                {rows.map((ev) => (
                  <motion.div
                    key={ev.key}
                    className={styles.row}
                    data-human={ev.agent === HUMAN.id || undefined}
                    initial={reduced ? false : { opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={SPRINGS.deck}
                  >
                    <span className={styles.rowT}>{clock(ev.t)}</span>
                    <span className={styles.rowArrow} data-action={ev.action}>
                      {ARROW[ev.action] ?? '→'}
                    </span>
                    <span className={styles.rowAgent}>
                      {ev.agent === HUMAN.id ? 'JAKE' : ev.agent.toUpperCase()}
                    </span>
                    <span className={styles.rowLabel}>
                      {ev.redact ? (
                        <Redacted seed={ev.agent + ev.t + ev.label} />
                      ) : (
                        <>
                          {isJakeSaying(ev) ? `“${ev.label}”` : ev.label}
                          {ev.target ? ` → ${ev.target.toUpperCase()}` : ''}
                        </>
                      )}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <footer className={styles.caution}>
        <span className={styles.cautionBar} aria-hidden="true" />
        {live
          ? 'LIVE ORCHESTRATION · REDACTIONS PROTECT UNRELEASED WORK'
          : 'RECORDED ORCHESTRATION · SAME CREW, REAL BUILD · ONE HUMAN ON THE KEYS'}
        <span className={styles.cautionBar} aria-hidden="true" />
      </footer>
    </div>
  )
}
