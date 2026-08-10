'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { DURATIONS, SPRINGS } from '@/lib/motion'
import { sfx, telemetry } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import {
  CREW,
  CREW_BY_ID,
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

   The deck is a PIPELINE, because the routing is the argument. An idea
   enters from OFF the frame, lands on the one human, and only then
   splits: Jake → two leads → four units. Work travels as capsules you
   can watch move; returns climb the same pipe in the system accent.

   At rest a node says its name and nothing else. Model, job and current
   telemetry live one hover (or one tab-stop) away, and every transient
   thing on this deck ends up in the log — that is the claim the count
   pulse is making when a toast expires.

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

/* The glyph is the instrument-panel voice; the word is what a screen
   reader actually needs. Both ship — one seen, one heard. */
const SIGNAL: Record<Action, string> = {
  prompt: 'ASKS',
  curate: 'PICKS',
  dispatch: 'DISPATCH',
  status: 'STATUS',
  return: 'RETURN',
  review: 'REVIEW',
  merge: 'MERGE',
}

const SPEED = 1.6
const LOG_MAX = 24
const LIVE_FRESH_MS = 15 * 60 * 1000
/* Slower than it feels like it should be, on purpose: each poll can cost a
   billed Blob operation and the deck can sit open for hours. 60s is well
   inside the 15-minute window that defines "live" anyway. */
const LIVE_POLL_MS = 60_000
/* a constant, not useId(): programs are dynamic imports into a tree that
   reshapes at the SSR handover, and useId disagrees with itself there */
const LOG_ID = 'cc-transmission-log'
const STATUS_ID = 'cc-unit-status'

/* Pacing. A real session reports in bursts; a burst drawn honestly is an
   unreadable smear. Events queue and leave the gate no faster than
   RELEASE_MS apart, and one hop is deliberately slower than the data
   needs — you are meant to be able to follow a single capsule. */
const RELEASE_MS = 800
const HOP_MIN = 1200
const HOP_MAX = 1800
const RETURN_STRETCH = 1.12
const TOAST_MS = 2600
/* the human's chip outlives the machine chatter — his words are the tell */
const SAID_MS = 6000
/* the node's arrival ring rides the motion scale, not a hand-picked ms */
const PULSE_S = parseFloat(DURATIONS.slow)
const PULSE_MS = PULSE_S * 1000
const HIGHLIGHT_MS = 900
/* hovering a pipe is a request to READ it, so the capsule inside drops to
   a fifth speed rather than stopping: still moving, still legible */
const SLOW_RATE = 0.2

const LEAD_IDS = LEADS.map((a) => a.id)
const DELEGATE_IDS = DELEGATES.map((a) => a.id)
/* the inlet is not a node — it is the edge of the frame, where ideas that
   did not come from this machine arrive */
const INLET = 'inlet'

type PipeDef = { id: string; from: string; to: string }

/* The whole routing table, and it is short on purpose: world → Jake,
   Jake → each lead, each lead → each unit. Nothing routes sideways and
   nothing skips the human. */
const PIPES: PipeDef[] = [
  { id: `${INLET}>${HUMAN.id}`, from: INLET, to: HUMAN.id },
  ...LEAD_IDS.map((id) => ({ id: `${HUMAN.id}>${id}`, from: HUMAN.id, to: id })),
  ...LEAD_IDS.flatMap((lead) =>
    DELEGATE_IDS.map((d) => ({ id: `${lead}>${d}`, from: lead, to: d }))
  ),
]

const PIPE_BY_ID = new Map(PIPES.map((p) => [p.id, p]))

const clock = (t: number) =>
  `00.${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}.${String(Math.floor(t % 60)).padStart(2, '0')}`

const isJakeSaying = (e: Ev) =>
  e.agent === HUMAN.id && (e.action === 'prompt' || e.action === 'curate')

/* ---- geometry ---- */
/* Pipes are measured, not drawn to a fixed viewBox: the stage reflows
   between the desktop schematic and the phone stack, and a hand-authored
   path would lie about where the nodes actually are. */

type Pt = { x: number; y: number }
type Anchor = { cx: number; top: number; bottom: number }
type Geom = { w: number; h: number; nodes: Record<string, Anchor> }

type Curve = {
  id: string
  from: string
  to: string
  d: string
  /** arc-length lookup: LUT[i] is the bezier t at i/(N-1) of the length */
  lut: number[]
  p: [Pt, Pt, Pt, Pt]
  len: number
  mid: Pt
}

const LUT_N = 17

function cubicAt(p: [Pt, Pt, Pt, Pt], t: number): Pt {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
    y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y,
  }
}

/* getPointAtLength would mean a live DOM path per pipe and a layout read
   inside the animation frame. The curves are cubics we authored, so we
   sample them once into an arc-length table and never touch the DOM. */
function buildCurve(id: string, from: string, to: string, p: [Pt, Pt, Pt, Pt]): Curve {
  const S = 48
  const pts: Pt[] = []
  const acc: number[] = [0]
  for (let i = 0; i <= S; i++) {
    const q = cubicAt(p, i / S)
    pts.push(q)
    if (i > 0) {
      const prev = pts[i - 1]
      acc.push(acc[i - 1] + Math.hypot(q.x - prev.x, q.y - prev.y))
    }
  }
  const len = acc[S] || 1
  const lut: number[] = []
  let j = 0
  for (let i = 0; i < LUT_N; i++) {
    const target = (i / (LUT_N - 1)) * len
    while (j < S && acc[j + 1] < target) j++
    const span = acc[j + 1] - acc[j] || 1
    const f = Math.min(1, Math.max(0, (target - acc[j]) / span))
    lut.push((j + f) / S)
  }
  return {
    id,
    from,
    to,
    d: `M${p[0].x} ${p[0].y} C${p[1].x} ${p[1].y} ${p[2].x} ${p[2].y} ${p[3].x} ${p[3].y}`,
    lut,
    p,
    len,
    mid: cubicAt(p, 0.5),
  }
}

/** point at arc-length fraction s (0..1) */
function pointAt(c: Curve, s: number): Pt {
  const x = Math.min(1, Math.max(0, s)) * (LUT_N - 1)
  const i = Math.min(LUT_N - 2, Math.floor(x))
  const f = x - i
  return cubicAt(c.p, c.lut[i] + (c.lut[i + 1] - c.lut[i]) * f)
}

/* The stage clips (that is what sells the inlet), so a card anchored to
   an outer node cannot simply centre itself. Near a wall it pins to the
   wall instead — same manners as the desktop crew's intro card. */
function place(cx: number, w: number, half: number) {
  if (cx < half) return { left: 2, align: 'left' as const }
  if (cx > w - half) return { left: w - 2, align: 'right' as const }
  return { left: cx, align: 'center' as const }
}

function hopMs(c: Curve, up: boolean) {
  const base = Math.min(HOP_MAX, Math.max(HOP_MIN, HOP_MIN + c.len * 1.6))
  return Math.min(HOP_MAX, up ? base * RETURN_STRETCH : base)
}

/* Fan the exits and entries a few pixels apart so eight pipes into four
   units read as a manifold instead of one fat line. */
function buildCurves(geom: Geom | null, tension: number): Record<string, Curve> {
  if (!geom) return {}
  const out: Record<string, Curve> = {}
  const jake = geom.nodes[HUMAN.id]
  if (!jake) return out

  for (const pipe of PIPES) {
    const to = geom.nodes[pipe.to]
    if (!to) continue

    if (pipe.from === INLET) {
      // starts ABOVE the frame — the idea did not originate in here
      const p0 = { x: jake.cx, y: -22 }
      const p3 = { x: jake.cx, y: jake.top }
      out[pipe.id] = buildCurve(pipe.id, pipe.from, pipe.to, [p0, p0, p3, p3])
      continue
    }

    const from = geom.nodes[pipe.from]
    if (!from) continue

    const leadIdx = LEAD_IDS.indexOf(pipe.from)
    const dIdx = DELEGATE_IDS.indexOf(pipe.to)
    const exitOff =
      leadIdx >= 0 && dIdx >= 0 ? (dIdx - (DELEGATE_IDS.length - 1) / 2) * 7 : 0
    const enterOff = leadIdx >= 0 && dIdx >= 0 ? (leadIdx - 0.5) * 10 : 0

    const p0 = { x: from.cx + exitOff, y: from.bottom }
    const p3 = { x: to.cx + enterOff, y: to.top }
    const dy = Math.max(18, p3.y - p0.y) * tension
    out[pipe.id] = buildCurve(pipe.id, pipe.from, pipe.to, [
      p0,
      { x: p0.x, y: p0.y + dy },
      { x: p3.x, y: p3.y - dy },
      p3,
    ])
  }
  return out
}

/* ---- unit state ---- */

const blip = (ev: Ev) => {
  if (ev.action === 'dispatch') telemetry.dispatch()
  else if (ev.action === 'return') telemetry.return()
  else if (ev.action === 'merge') telemetry.merge()
}

type AgentState = { mode: 'idle' | 'busy' | 'flash'; label: string }

/* At rest a unit's card says what it IS, not "STANDING BY" — the
   explainer lives in the state a visitor sees most of the time, and gets
   replaced by real telemetry the moment there is any. */
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
function Redacted({ seed, small }: { seed: string; small?: boolean }) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff
  const scale = small ? 0.62 : 1
  const widths = [22 + (h % 30), 14 + ((h >> 4) % 24), 18 + ((h >> 8) % 34)]
  return (
    /* role, because every bar inside is aria-hidden: without it the
       label has no host element and the row reads as empty */
    <span className={styles.redacted} role="img" aria-label="Redacted — classified until it ships">
      {widths.map((w, i) => (
        <span
          key={i}
          className={styles.redactBar}
          style={{ width: Math.round(w * scale) }}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/* ---- a node ---- */
/* Avatar and call sign, full stop. Everything else about this unit is one
   hover or one tab-stop away, which is the only reason the deck can hold
   seven of them without turning into a spec sheet. */

function Node({
  id,
  human,
  skin,
  state,
  hot,
  measure,
  onOpen,
  onClose,
  onToggle,
}: {
  id: string
  human?: boolean
  skin: 'classic' | 'medieval' | 'underwater'
  state: AgentState
  hot?: boolean
  measure: (id: string, el: HTMLElement | null) => void
  onOpen: (id: string) => void
  onClose: (id: string) => void
  onToggle: (id: string) => void
}) {
  const m = CREW_BY_ID[id]
  return (
    <button
      type="button"
      ref={(el) => {
        measure(id, el)
      }}
      className={human ? styles.nodeHuman : styles.node}
      data-mode={state.mode}
      data-hot={hot || undefined}
      /* The NAME is fixed — identity does not churn. Live telemetry is a
         DESCRIPTION, so a status arriving while this node holds focus
         does not make a screen reader announce the unit all over again. */
      aria-label={`${m.name} — ${m.model}, ${m.role}`}
      aria-describedby={`${STATUS_ID}-${id}`}
      /* a touch "enter" is really a tap: let the click toggle it instead,
         or the card opens and closes in the same gesture */
      onPointerEnter={(e) => {
        if (e.pointerType !== 'touch') onOpen(id)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'touch') onClose(id)
      }}
      onFocus={() => onOpen(id)}
      onBlur={() => onClose(id)}
      onClick={() => onToggle(id)}
    >
      <span className={styles.scanMark} aria-hidden="true" />
      {human ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.portrait} src={HUMAN_PORTRAIT} alt="" aria-hidden="true" />
      ) : (
        <span
          className={styles.avatar}
          data-mode={state.mode}
          style={{
            WebkitMaskImage: `url(${avatarFor(id, skin)})`,
            maskImage: `url(${avatarFor(id, skin)})`,
          }}
          aria-hidden="true"
        />
      )}
      <span className={styles.nodeName}>{m.name}</span>
      <span className={styles.srOnly} id={`${STATUS_ID}-${id}`}>
        {state.label}
      </span>
    </button>
  )
}

/* ---- deck ---- */

type Packet = { key: number; pipe: string; up: boolean; ev: Ev }
/* the flight record lives in a ref, never in state: the animation frame
   writes transforms and must not schedule a render 60 times a second */
type Run = Packet & { s: number; dur: number; el: HTMLElement | null }
type Row = Ev & { key: number }

export default function CommandCenter() {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const [mode, setMode] = useState<'replay' | 'live'>('replay')
  const [log, setLog] = useState<Row[]>([])
  const [states, setStates] = useState<Record<string, AgentState>>(idleStates)
  const [packets, setPackets] = useState<Packet[]>([])
  const [toasts, setToasts] = useState<Record<string, { key: number; ev: Ev }>>({})
  const [pulses, setPulses] = useState<Array<{ key: number; node: string }>>([])
  const [said, setSaid] = useState<{ key: number; ev: Ev } | null>(null)
  const [hotNodes, setHotNodes] = useState<Record<string, number>>({})
  const [cardNode, setCardNode] = useState<string | null>(null)
  const [hoverPipe, setHoverPipe] = useState<string | null>(null)
  const [logOpen, setLogOpen] = useState(false)
  const [counter, setCounter] = useState({ n: 0, pulse: 0 })
  const [freshKey, setFreshKey] = useState<number | null>(null)
  const [cycle, setCycle] = useState(0)
  const [geom, setGeom] = useState<Geom | null>(null)
  const [narrow, setNarrow] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const nodeEls = useRef<Record<string, HTMLElement | null>>({})
  const cursor = useRef(0)
  const simTime = useRef(0)
  const liveCount = useRef(0)
  const keyseq = useRef(0)
  const queue = useRef<Ev[]>([])
  const lastRelease = useRef(0)
  const run = useRef<Map<number, Run>>(new Map())
  const lastOnPipe = useRef<Record<string, Ev>>({})
  /* a return carries no target, so the deck remembers who briefed whom —
     otherwise a unit's work climbs a pipe it never came down */
  const briefedBy = useRef<Record<string, string>>({})
  /* and a PICK carries no source: Jake is choosing among the returns
     coming up from whichever lead is currently live */
  const activeLead = useRef<string>(LEAD_IDS[0])
  /* the poll's closure is created once and never re-made (it must not
     re-subscribe on every render), so anything it reads from render
     scope has to arrive by ref or it reads the first render forever */
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced
  const scheduleRef = useRef<() => void>(() => {})
  const rafRef = useRef(0)
  const lastFrame = useRef(0)

  /* Every chip, ring and log commit is a timeout. They outlive the
     window unless somebody holds the receipts. */
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const after = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(() => {
      timers.current.delete(t)
      fn()
    }, ms)
    timers.current.add(t)
    return t
  }, [])

  useEffect(() => {
    const held = timers.current
    return () => {
      for (const t of held) clearTimeout(t)
      held.clear()
    }
  }, [])

  /* ---- measure ---- */

  const measure = useCallback((id: string, el: HTMLElement | null) => {
    nodeEls.current[id] = el
  }, [])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let raf = 0

    /* offsetLeft/Top, NOT getBoundingClientRect: the window opens on a
       scale transform, and a rect read mid-animation reports scaled
       offsets that no ResizeObserver will ever correct (a transform is
       not a layout change). Offsets are layout values, so they are
       immune — and they are already in the padding-box coordinates the
       absolutely-positioned overlays use. */
    const anchor = (el: HTMLElement): Anchor => {
      let x = 0
      let y = 0
      let n: HTMLElement | null = el
      while (n && n !== stage) {
        x += n.offsetLeft
        y += n.offsetTop
        n = n.offsetParent as HTMLElement | null
      }
      return { cx: x + el.offsetWidth / 2, top: y, bottom: y + el.offsetHeight }
    }

    const read = () => {
      const w = stage.clientWidth
      if (!w) return
      const nodes: Record<string, Anchor> = {}
      for (const [id, el] of Object.entries(nodeEls.current)) {
        if (el) nodes[id] = anchor(el)
      }
      // matches the 519px container query that folds the fan-out 2×2
      setNarrow(w < 480)
      setGeom({ w, h: stage.clientHeight, nodes })
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(read)
    }

    schedule()
    scheduleRef.current = schedule
    const ro = new ResizeObserver(schedule)
    ro.observe(stage)
    // call signs are set in the display face; its arrival changes node widths
    let alive = true
    void document.fonts?.ready
      .then(() => {
        if (alive) schedule()
      })
      .catch(() => {})
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      scheduleRef.current = () => {}
      ro.disconnect()
    }
  }, [])

  /* A skin swap changes the display face, which changes how tall a call
     sign sits — the node boxes move but the stage box does not, so no
     ResizeObserver ever fires and the pipes would aim at stale anchors
     until the next drag. */
  useEffect(() => {
    scheduleRef.current()
  }, [skin])

  /* Straighter runs on a phone: the stack is short, and a deep curve on a
     90px drop reads as a squiggle rather than a route. */
  const curves = useMemo(() => buildCurves(geom, narrow ? 0.18 : 0.45), [geom, narrow])
  const curvesRef = useRef(curves)
  curvesRef.current = curves
  const hoverRef = useRef<string | null>(hoverPipe)
  hoverRef.current = hoverPipe

  /* ---- one event, drawn ---- */

  const commit = useCallback(
    (ev: Ev) => {
      const key = keyseq.current++
      setLog((cur) => [{ ...ev, key }, ...cur].slice(0, LOG_MAX))
      setCounter((c) => ({ n: c.n + 1, pulse: c.pulse + 1 }))
      setFreshKey(key)
      after(HIGHLIGHT_MS, () => setFreshKey((k) => (k === key ? null : k)))
    },
    [after]
  )

  /* A node reacting: a ring, a hot border, a chip that says what just
     happened — and, TOAST_MS later, the row in the log. The receipt is
     the point: nothing on this deck is ephemeral by the end. */
  const land = useCallback(
    (node: string, ev: Ev) => {
      const key = keyseq.current++
      setPulses((cur) => [...cur.slice(-4), { key, node }])
      after(PULSE_MS, () => setPulses((cur) => cur.filter((p) => p.key !== key)))
      setHotNodes((cur) => ({ ...cur, [node]: key }))
      after(PULSE_MS, () =>
        setHotNodes((cur) => (cur[node] === key ? { ...cur, [node]: 0 } : cur))
      )

      if (isJakeSaying(ev)) {
        setSaid({ key, ev })
        after(SAID_MS, () => setSaid((cur) => (cur?.key === key ? null : cur)))
      } else {
        // one chip per node, always the newest — a stack would be noise
        setToasts((cur) => ({ ...cur, [node]: { key, ev } }))
        after(TOAST_MS, () => {
          setToasts((cur) => {
            if (cur[node]?.key !== key) return cur
            const next = { ...cur }
            delete next[node]
            return next
          })
        })
      }
      after(TOAST_MS, () => commit(ev))
    },
    [after, commit]
  )

  /** which pipe (if any) this event travels, and in which direction */
  const routeFor = useCallback((ev: Ev): { pipe: string; up: boolean } | null => {
    // a lead goes live the moment it hands work out or hands work back
    if (LEAD_IDS.includes(ev.agent) && (ev.action === 'dispatch' || ev.action === 'return')) {
      activeLead.current = ev.agent
    }
    /* The human's two moves travel in OPPOSITE directions, and that is
       the whole distinction: an IDEA arrives from outside the frame, a
       PICK climbs back up from the lead whose returns he is judging.
       Jake does not send picks downhill — he answers work that arrived. */
    if (ev.agent === HUMAN.id) {
      if (ev.action === 'prompt') return { pipe: `${INLET}>${HUMAN.id}`, up: false }
      if (ev.action === 'curate') return { pipe: `${HUMAN.id}>${activeLead.current}`, up: true }
      return null
    }
    if (ev.action === 'dispatch' && ev.target) {
      const id = `${ev.agent}>${ev.target}`
      if (PIPE_BY_ID.has(id)) {
        briefedBy.current[ev.target] = ev.agent
        return { pipe: id, up: false }
      }
      return null
    }
    if (ev.action === 'return') {
      if (LEAD_IDS.includes(ev.agent)) return { pipe: `${HUMAN.id}>${ev.agent}`, up: true }
      /* No recorded dispatch means we do not know which lead this came
         back to. On a deck whose whole claim is "this is the real
         routing", drawing a guessed pipe is worse than drawing none —
         the unit just reacts in place. */
      const lead = briefedBy.current[ev.agent]
      const id = lead ? `${lead}>${ev.agent}` : ''
      if (PIPE_BY_ID.has(id)) return { pipe: id, up: true }
    }
    return null
  }, [])

  /* ---- packet flight ---- */
  /* One rAF for every capsule on the deck, writing transforms only. The
     loop never reads layout and never restarts on a resize — the curve
     table it samples is swapped under it by ref. It starts when the first
     capsule launches and PARKS when the last one lands: an idle deck,
     which is most decks most of the time, costs nothing. */

  const ensureFlight = useCallback(() => {
    if (rafRef.current) return
    lastFrame.current = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.25, (now - lastFrame.current) / 1000)
      lastFrame.current = now
      if (!run.current.size) {
        rafRef.current = 0
        return
      }
      rafRef.current = requestAnimationFrame(tick)

      const hovered = hoverRef.current
      const arrived: Run[] = []

      for (const r of run.current.values()) {
        const c = curvesRef.current[r.pipe]
        if (!c) continue
        const rate = hovered === r.pipe ? SLOW_RATE : 1
        r.s += (r.up ? -1 : 1) * (((dt * 1000) / r.dur) * rate)
        if (r.up ? r.s <= 0 : r.s >= 1) {
          r.s = r.up ? 0 : 1
          arrived.push(r)
        }
        if (r.el) {
          const pt = pointAt(c, r.s)
          r.el.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -50%)`
        }
      }

      if (!arrived.length) return
      const keys = new Set(arrived.map((r) => r.key))
      for (const r of arrived) run.current.delete(r.key)
      setPackets((cur) => cur.filter((p) => !keys.has(p.key)))
      for (const r of arrived) {
        const c = curvesRef.current[r.pipe]
        land(r.up ? (c?.from ?? r.ev.agent) : (c?.to ?? r.ev.agent), r.ev)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [land])

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    },
    []
  )

  const release = useCallback(
    (ev: Ev) => {
      setStates((cur) => applyEvent(cur, ev))
      blip(ev)
      const route = routeFor(ev)
      const c = route ? curvesRef.current[route.pipe] : null
      if (!route || !c) {
        // status / review / merge — nothing travels, the node just reacts
        land(ev.agent, ev)
        return
      }
      lastOnPipe.current[route.pipe] = ev
      const key = keyseq.current++
      const packet: Packet = { key, pipe: route.pipe, up: route.up, ev }
      run.current.set(key, { ...packet, s: route.up ? 1 : 0, dur: hopMs(c, route.up), el: null })
      setPackets((cur) => [...cur, packet])
      ensureFlight()
    },
    [ensureFlight, land, routeFor]
  )

  /* ---- the gate: one capsule at a time ---- */

  useEffect(() => {
    if (reduced) return
    const iv = setInterval(() => {
      if (!queue.current.length) return
      const now = performance.now()
      if (now - lastRelease.current < RELEASE_MS) return
      lastRelease.current = now
      const ev = queue.current.shift()
      if (ev) release(ev)
    }, 120)
    return () => clearInterval(iv)
  }, [reduced, release])

  /* ---- live-feed probe + poll ---- */

  useEffect(() => {
    let alive = true
    let iv: ReturnType<typeof setInterval> | null = null

    const pull = async (first: boolean) => {
      // a deck nobody is looking at doesn't get to spend operations
      if (!first && document.visibilityState !== 'visible') return
      try {
        const res = await fetch('/api/cc-feed')
        const d: { updated: number; events: Ev[] } = await res.json()
        if (!alive) return
        // a report with a bad call sign is dropped, not drawn: the deck
        // never invents a unit it can't name
        const events = (Array.isArray(d.events) ? d.events : []).filter((e) => isCrewId(e.agent))
        const fresh = d.updated > 0 && Date.now() - d.updated < LIVE_FRESH_MS && events.length > 0
        if (!fresh) {
          /* an updater, not a read: this closure is built once and never
             rebuilt, so `mode` in here is frozen at its first value and
             a stale feed would otherwise leave the deck saying LIVE for
             the rest of the session */
          setMode((m) => (m === 'live' ? 'replay' : m))
          return
        }
        setMode('live')
        /* liveCount is a high-water mark into ONE session's array. A
           shorter array means a different session started, so the mark is
           meaningless — re-seed rather than slicing past the end and
           silently dropping the whole new run. */
        if (events.length < liveCount.current) liveCount.current = 0
        const seeding = liveCount.current === 0
        const newOnes = events.slice(liveCount.current)
        liveCount.current = events.length
        for (const ev of events) {
          if (ev.action === 'dispatch' && ev.target) briefedBy.current[ev.target] = ev.agent
          if (LEAD_IDS.includes(ev.agent) && (ev.action === 'dispatch' || ev.action === 'return')) {
            activeLead.current = ev.agent
          }
        }
        if (seeding) {
          /* a session already in progress is HISTORY, not traffic — it
             goes straight onto the receipt rather than crawling the pipes
             for the two minutes it would take to animate a backlog */
          setStates(() => events.slice(-20).reduce(applyEvent, idleStates()))
          setLog(
            events
              .slice(-LOG_MAX)
              .reverse()
              .map((ev, i) => ({ ...ev, key: 900_000 + i }))
          )
          setCounter({ n: events.length, pulse: 0 })
        } else if (reducedRef.current) {
          /* no gate is running under reduced motion, so the queue would
             never drain and these events would be consumed and lost —
             they go straight onto the receipt instead */
          newOnes.forEach(commit)
          setStates(() => events.slice(-20).reduce(applyEvent, idleStates()))
        } else {
          /* NOT a state reset: the gate is still walking earlier capsules
             down the pipes, and re-deriving from the full list here would
             light a unit up before its own packet arrived. release()
             applies each event as it launches. */
          queue.current.push(...newOnes)
        }
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

  /* ---- replay reel (paused when live or reduced) ---- */

  useEffect(() => {
    if (reduced || mode === 'live') return
    cursor.current = 0
    simTime.current = 0
    queue.current = []
    briefedBy.current = {}
    activeLead.current = LEAD_IDS[0]
    // the reel starts from an empty wire, so nothing survives the loop —
    // a capsule still in flight would land on the next cycle's clock
    run.current.clear()
    setPackets([])
    setToasts({})
    setSaid(null)
    setLog([])
    setCounter({ n: 0, pulse: 0 })
    setStates(idleStates())

    const iv = setInterval(() => {
      simTime.current += 0.25 * SPEED
      while (cursor.current < SEQUENCE.length && SEQUENCE[cursor.current].t <= simTime.current) {
        queue.current.push(SEQUENCE[cursor.current])
        cursor.current++
      }
      if (cursor.current >= SEQUENCE.length && !queue.current.length && simTime.current > 132) {
        setCycle((c) => c + 1)
      }
    }, 250)

    return () => clearInterval(iv)
  }, [reduced, cycle, mode])

  /* ---- reading the wire ---- */

  const live = mode === 'live'
  const transcript = Boolean(reduced) && !live
  const rows: Row[] = transcript ? SEQUENCE.map((ev, i) => ({ ...ev, key: i })) : log
  const railOpen = transcript || logOpen

  /* The pipe is the hit target, never the capsule — you should not have to
     catch a moving thing to read it. Hovering shows whatever is in the
     pipe now, or the last thing that went through it. */
  const pipeEv = hoverPipe
    ? (packets.find((p) => p.pipe === hoverPipe)?.ev ?? lastOnPipe.current[hoverPipe])
    : null
  const pipeCurve = hoverPipe ? curves[hoverPipe] : null

  const cardMember = cardNode ? CREW_BY_ID[cardNode] : null
  const cardAnchor = cardNode && geom ? geom.nodes[cardNode] : null
  const anyCard = Boolean(cardNode || hoverPipe)
  /* click toggles rather than re-opens: on touch there is no hover to
     leave, so a tap has to be able to close what a tap opened */
  const toggleCard = (id: string) => setCardNode((cur) => (cur === id ? null : id))
  const dismiss = () => {
    setCardNode(null)
    setHoverPipe(null)
  }

  return (
    <div
      className={styles.ctr}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        /* An open card eats the first Escape and STOPS THERE — the window
           chrome's own Escape closes the program, and dismissing a
           tooltip should never take the whole deck down with it. When
           nothing is open the key belongs to the window. */
        if (!anyCard) return
        e.stopPropagation()
        dismiss()
      }}
    >
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
            {live
              ? 'LIVE · SESSION IN PROGRESS'
              : transcript
                ? 'TRANSCRIPT'
                : `REPLAY · ${timeline.recorded}`}
          </span>
        </div>
      </header>

      <div className={styles.body}>
        {/* ---- the schematic ---- */}
        <div className={styles.stage} ref={stageRef}>
          {/* A real backdrop, not a target check on the stage: .rows and
              the pipe layers cover the plate edge to edge, so "did you
              click the container itself" was never true and a card opened
              by tapping could not be put away again. */}
          <div className={styles.backdrop} onPointerDown={dismiss} aria-hidden="true" />

          {/* pipes, pushed back: lighter ink, behind every plate. The depth
              is layering and weight — nothing here is pretending to be 3D. */}
          <svg
            className={styles.pipes}
            viewBox={`0 0 ${geom?.w || 1} ${geom?.h || 1}`}
            aria-hidden="true"
            focusable="false"
          >
            {Object.values(curves).map((c) => (
              <path
                key={c.id}
                className={styles.pipe}
                d={c.d}
                data-hot={
                  hoverPipe === c.id || packets.some((p) => p.pipe === c.id) || undefined
                }
              />
            ))}
          </svg>

          {/* capsules ride above the pipe ink and below the plates, so a
              packet arriving reads as going INTO the unit */}
          <div className={styles.flight} aria-hidden="true">
            {packets.map((p) => {
              const c = curves[p.pipe]
              if (!c) return null
              const start = pointAt(c, run.current.get(p.key)?.s ?? (p.up ? 1 : 0))
              return (
                <span
                  key={p.key}
                  ref={(el) => {
                    const r = run.current.get(p.key)
                    if (r) r.el = el
                  }}
                  className={styles.packet}
                  data-up={p.up || undefined}
                  data-slow={hoverPipe === p.pipe || undefined}
                  style={{
                    transform: `translate3d(${start.x}px, ${start.y}px, 0) translate(-50%, -50%)`,
                  }}
                />
              )
            })}
          </div>

          {/* a fat invisible stroke over each pipe — the readable target */}
          <svg
            className={styles.hits}
            viewBox={`0 0 ${geom?.w || 1} ${geom?.h || 1}`}
            aria-hidden="true"
            focusable="false"
          >
            {Object.values(curves).map((c) => (
              <path
                key={c.id}
                className={styles.hit}
                d={c.d}
                /* Touch has no hover: the tap that opens the card also
                   ends it, so on touch the card LATCHES and is put away
                   by the next tap on the plate (or Escape). A pointer
                   still gets plain enter/leave. */
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'touch') setHoverPipe(c.id)
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType !== 'touch') {
                    setHoverPipe((cur) => (cur === c.id ? null : cur))
                  }
                }}
                onPointerDown={() => setHoverPipe(c.id)}
              />
            ))}
          </svg>

          <div className={styles.rows} role="group" aria-label="The crew, from the human down">

            <div className={styles.inlet}>
              <span className={styles.inletLabel}>IDEAS IN</span>
            </div>

            <div className={styles.rowHuman}>
              <Node
                id={HUMAN.id}
                human
                skin={skin}
                state={states[HUMAN.id]}
                hot={Boolean(hotNodes[HUMAN.id])}
                measure={measure}
                onOpen={setCardNode}
                onClose={(id) => setCardNode((cur) => (cur === id ? null : cur))}
                onToggle={toggleCard}
              />
            </div>

            <div className={styles.rowLeads}>
              {LEAD_IDS.map((id) => (
                <Node
                  key={id}
                  id={id}
                  skin={skin}
                  state={states[id]}
                  hot={Boolean(hotNodes[id])}
                  measure={measure}
                  onOpen={setCardNode}
                  onClose={(cid) => setCardNode((cur) => (cur === cid ? null : cur))}
                  onToggle={toggleCard}
                />
              ))}
            </div>

            <div className={styles.rowCrew}>
              {DELEGATE_IDS.map((id) => (
                <Node
                  key={id}
                  id={id}
                  skin={skin}
                  state={states[id]}
                  hot={Boolean(hotNodes[id])}
                  measure={measure}
                  onOpen={setCardNode}
                  onClose={(cid) => setCardNode((cur) => (cur === cid ? null : cur))}
                  onToggle={toggleCard}
                />
              ))}
            </div>
          </div>

          {/* ---- transient layer: pulses, chips, cards ---- */}
          {/* aria-hidden throughout. The log is the accessible record and
              the node buttons carry the identity — none of this is the
              only place a fact lives. */}
          <div className={styles.over} aria-hidden="true">
            <AnimatePresence>
              {pulses.map((p) => {
                const a = geom?.nodes[p.node]
                if (!a) return null
                return (
                  <motion.span
                    key={p.key}
                    className={styles.pulse}
                    style={{ left: a.cx, top: (a.top + a.bottom) / 2 }}
                    initial={{ opacity: 0.5, scale: 0.7 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: PULSE_S }}
                  />
                )
              })}
            </AnimatePresence>

            <AnimatePresence>
              {Object.entries(toasts).map(([node, toast]) => {
                const a = geom?.nodes[node]
                if (!toast || !a) return null
                const at = place(a.cx, geom!.w, narrow ? 78 : 96)
                return (
                  <motion.span
                    key={toast.key}
                    className={styles.toast}
                    data-kind={toast.ev.action}
                    data-align={at.align}
                    style={{ left: at.left, top: a.top - 6 }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={SPRINGS.deck}
                    data-spring="deck"
                  >
                    {toast.ev.redact ? (
                      <Redacted seed={toast.ev.label + toast.ev.t} small />
                    ) : (
                      toast.ev.label
                    )}
                  </motion.span>
                )
              })}
            </AnimatePresence>

            {/* the human's last input — one chip, and it lingers */}
            <AnimatePresence>
              {said && geom?.nodes[HUMAN.id] && (
                <motion.span
                  key={said.key}
                  className={styles.saidChip}
                  data-kind={said.ev.action}
                  data-align={place(geom.nodes[HUMAN.id].cx, geom.w, narrow ? 82 : 130).align}
                  style={{
                    left: place(geom.nodes[HUMAN.id].cx, geom.w, narrow ? 82 : 130).left,
                    top: geom.nodes[HUMAN.id].bottom + 5,
                  }}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={SPRINGS.human}
                  data-spring="human"
                >
                  <span className={styles.saidKind}>
                    {said.ev.action === 'curate' ? 'PICKS' : 'ASKS'}
                  </span>
                  <span className={styles.saidText}>
                    {said.ev.redact ? (
                      <Redacted seed={said.ev.label + said.ev.t} small />
                    ) : (
                      `“${said.ev.label}”`
                    )}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>

            {/* the spec sheet, on demand */}
            <AnimatePresence>
              {cardMember && cardAnchor && geom && (
                <motion.div
                  key={cardMember.id}
                  className={styles.card}
                  data-side={cardAnchor.top > geom.h / 2 ? 'above' : 'below'}
                  data-align={place(cardAnchor.cx, geom.w, 116).align}
                  style={{
                    left: place(cardAnchor.cx, geom.w, 116).left,
                    top: cardAnchor.top > geom.h / 2 ? cardAnchor.top : cardAnchor.bottom,
                  }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={SPRINGS.deck}
                  data-spring="deck"
                >
                  <span className={styles.cardName}>{cardMember.name}</span>
                  <span className={styles.cardJob}>
                    {cardMember.model} · {cardMember.role}
                  </span>
                  <span className={styles.cardStatus} data-mode={states[cardMember.id]?.mode}>
                    {states[cardMember.id]?.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* what is in this pipe */}
            <AnimatePresence>
              {pipeCurve && (
                <motion.div
                  key={pipeCurve.id}
                  className={styles.pipeCard}
                  /* held inside the plate: the inlet pipe's midpoint is
                     nearly off the top edge, and a clipped card is worse
                     than one that has moved a few pixels to be readable */
                  data-align={place(pipeCurve.mid.x, geom?.w ?? 0, 126).align}
                  style={{
                    left: place(pipeCurve.mid.x, geom?.w ?? 0, 126).left,
                    top: Math.max(pipeCurve.mid.y, 62),
                  }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={SPRINGS.deck}
                  data-spring="deck"
                >
                  {/* an empty pipe is a real answer — a route that exists
                      and has not been used yet, which is worth saying out
                      loud rather than opening nothing under the cursor */}
                  {pipeEv ? (
                    <>
                      <span className={styles.pipeCardHead}>
                        <span className={styles.pipeCardT}>{clock(pipeEv.t)}</span>
                        <span className={styles.pipeCardSig} data-action={pipeEv.action}>
                          {ARROW[pipeEv.action] ?? '→'}
                        </span>
                        <span className={styles.pipeCardUnit}>
                          {pipeEv.agent === HUMAN.id ? 'JAKE' : pipeEv.agent.toUpperCase()}
                          {pipeEv.target ? ` → ${pipeEv.target.toUpperCase()}` : ''}
                        </span>
                      </span>
                      <span className={styles.pipeCardLabel}>
                        {pipeEv.redact ? (
                          <Redacted seed={pipeEv.agent + pipeEv.t + pipeEv.label} small />
                        ) : isJakeSaying(pipeEv) ? (
                          `“${pipeEv.label}”`
                        ) : (
                          pipeEv.label
                        )}
                      </span>
                    </>
                  ) : (
                    <span className={styles.pipeCardLabel} data-idle="true">
                      NO TRAFFIC YET
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ---- the receipt ---- */}
        {/* Wide: a rail on the right, collapsed to a slim tab so the
            schematic is what you meet. Narrow: the old bottom drawer.
            Same markup, same rows — the container decides. */}
        <div className={styles.rail} data-open={railOpen || undefined}>
          <button
            type="button"
            className={styles.railTab}
            onClick={() => {
              sfx.tap()
              setLogOpen((v) => !v)
            }}
            aria-expanded={railOpen}
            aria-controls={LOG_ID}
            disabled={transcript}
          >
            <span className={styles.railChevron} aria-hidden="true">
              {railOpen ? '▾' : '▸'}
            </span>
            <span>LOG</span>
            <motion.span
              key={counter.pulse}
              className={styles.railCount}
              initial={counter.pulse && !reduced ? { opacity: 0.35, scale: 1.22 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRINGS.deck}
              data-spring="deck"
            >
              {transcript || counter.n <= rows.length
                ? rows.length
                : `${rows.length}/${counter.n}`}
            </motion.span>
          </button>

          {/* role, or the aria-label has no semantics to hang on and the
              rail announces as an unnamed group. Explicitly aria-live=off:
              the log is a record to go READ, not a thing that talks. */}
          {railOpen && (
            <div
              className={styles.railBody}
              id={LOG_ID}
              role="region"
              aria-label="Orchestration feed"
              aria-live="off"
            >
              <div className={styles.feedHead}>
                <span>T+</span>
                <span>SIG</span>
                <span>UNIT</span>
                <span>TRANSMISSION</span>
              </div>
              <div className={styles.feedScroll}>
                <AnimatePresence initial={false}>
                  {rows.map((ev) => (
                    <motion.div
                      key={ev.key}
                      className={styles.row}
                      data-human={ev.agent === HUMAN.id || undefined}
                      data-fresh={ev.key === freshKey || undefined}
                      initial={reduced ? false : { opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={SPRINGS.deck}
                      data-spring="deck"
                    >
                      <span className={styles.rowT}>{clock(ev.t)}</span>
                      <span className={styles.rowArrow} data-action={ev.action}>
                        <span aria-hidden="true">{ARROW[ev.action] ?? '→'}</span>
                        <span className={styles.srOnly}>{SIGNAL[ev.action] ?? ev.action}</span>
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
