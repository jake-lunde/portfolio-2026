'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { useInspect } from '@/store/inspect'
import { resolveWindow } from '@/programs/resolve'
import { CREW_BY_ID, CREW_IDS, CREW_VERBS, agentForWindow, avatarFor, isCrewId } from './crew'
import { CREW_DIALOG, CREW_INTRO, CREW_LAST_TASK, FLEE_LINES } from './crewDialog'
import styles from './shell.module.css'

/* The crew, off duty. THE DESK HAS HOLES — a hatch opens on a bare patch
   of desktop, one unit climbs halfway out of it, stands there a while,
   turns, mutters a line of shift-talk, and drops back through the same
   hole. Then the hole closes and the desk is a desk again. FLASHES —
   opening a window still summons its responsible unit beside the
   titlebar for a beat.

   They used to WALK the bottom edge, which meant they walked straight
   into the dock rail (Jake, 2026-08-16). Nobody commutes now: they
   surface where there is room and leave the way they came.

   WHERE THERE IS ROOM is measured, not guessed. A spot is bare when
   every corner of the unit's footprint — hatch, shoulders, head —
   answers `elementFromPoint` with the desk itself. Icons, widgets, the
   nameplate, the wall, the dock rail and every open window are their
   own elements, so they rule themselves out for free and keep doing it
   as the desk changes. A crowded desk simply gets no agents.

   FIRST CONTACT — the first time your cursor finds a given unit they do
   NOT bolt: they turn to face you and say who they are, what model they
   run on and what they last worked on. Nobody should have to guess what
   these things are. After the introduction that unit reverts to
   startle-then-bail (there is nowhere to run, so they drop down the
   hole), and the handshake is remembered across visits.

   All of it is decorative and aria-hidden — the same facts are spelled
   out, in text, inside COMMAND.CTR. */

type Flash = { key: number; agent: string; x: number; y: number }
/* opening → rising → up → exiting → ducking → closing → gone. The hatch
   is only up for the two transitions at either end; `up` is a unit
   standing on a desk with no hole under it at all. */
export type Phase = 'gone' | 'opening' | 'rising' | 'up' | 'exiting' | 'ducking' | 'closing'
export type Align = 'left' | 'center' | 'right'
/** desk-relative centre of the hatch, plus which way the unit faces */
export type Spot = { x: number; y: number; face: 1 | -1; align: Align }

/* PINNING A FRAME (s88 follow-ups, task 3). Chromatic needs one frame
   that looks the same every run; the live cycle is a chain of setTimeouts
   ending in a roll of the dice, and even a seeded rng can't promise WHICH
   millisecond a snapshot lands on inside that chain. `frame` skips the
   cycle entirely and renders exactly this state — no timers, no dice —
   which is a stronger guarantee than pinning the dice alone. Stories
   only; the real desk never passes it. */
type FrameOverride = {
  phase: Phase
  spot: Spot
  agent: string
  bubble?: string | null
  intro?: { id: string; align: Align } | null
}

type AmbientAgentsProps = {
  /** dice for findSpot/line/fleeLine and the dwell/gap rolls. Defaults to
      Math.random for the real desk; a story passes a seeded generator so
      a rare frame that DOES run the cycle rolls the same way every time. */
  rng?: () => number
  /** see PINNING A FRAME, above. */
  frame?: FrameOverride
}

const SIZE = 34
const HOLE_W = 52
const FLEE_RADIUS = 64
const INTRO_RADIUS = 84 // they notice you a little before they'd spook
const INTRO_MS = 5200
/* THE HATCH IS A DOOR, NOT A PLACE (Jake, s88). It exists for exactly two
   moments — the climb out and the drop back — and is shut the whole time
   the unit is standing on the desk, which is most of the visit. So it
   scales open, shuts behind them, and then opens again underneath them on
   the way out. The lead is enough to break the surface before a head
   comes through it. */
const HOLE_LEAD = 90 // hatch opens this far ahead of the body moving
const HOLE_SHUT = 150 // ... and shuts this far into the drop back
const RISE_SETTLE = 520 // the climb's spring is done about here
const DUCK_MS = 260 // dropping back in is quicker than climbing out
const DWELL_MIN = 5200
const DWELL_VAR = 3800
/* CLOSING THE GAP. A cursor visibly closing on a standing unit buys the
   dwell timer more time, in bounded increments, instead of letting the
   timer drop the unit mid-approach — half of what makes first contact
   reachable (the other half is findSpot hunting near the cursor while
   anybody is still unmet, below `isBare`). The cap means parking nearby
   and never arriving can't pin a unit up forever. */
const DWELL_EXTEND = 260
const DWELL_EXTEND_MAX = 3200
const GAP_MIN = 4200
const GAP_VAR = 4600
const MET_KEY = 'lunde-crew-met'
/* a desk that stays full (mobile's stacked windows, INSPECT's two docked
   panels widened) used to retry every 2.6s forever — up to 30 spots ×
   10 probes = 300 elementFromPoint calls a shot, for nothing. Doubling
   the gap on every consecutive miss, capped, keeps the earliest retries
   quick (the usual case is one window closing a moment later) without
   burning hit-tests on a desk that has been full for minutes. */
const FULL_RETRY_BASE = 2600
const FULL_RETRY_MAX = 30000

/* where a hatch may open: clear of the wings, low enough that the intro
   card has room above it, high enough to keep off the dock rail. The
   footprint probe below is the real test — these only keep the dice
   inside the room. */
const EDGE_PAD = 44
const TOP_PAD = 116
const BOTTOM_PAD = 34
const TRIES = 30

/* THE FOOTPRINT, IN POINTS — offsets from the hatch centre. Every one of
   them has to land on bare desk or the spot belongs to somebody else.
   The near rim (the +8 row) is not decoration: the hatch hangs 8px below
   its own centre, and without those three the crew opened hatches whose
   front lip bit into the top of the dock rail — the exact complaint this
   redesign answers. */
const PROBES: [number, number][] = [
  [0, 0],
  [-HOLE_W / 2, 0],
  [HOLE_W / 2, 0],
  [0, 8],
  [-14, 7],
  [14, 7],
  [0, -SIZE / 2],
  [0, -SIZE],
  [-SIZE / 2 + 2, -SIZE + 6],
  [SIZE / 2 - 2, -SIZE + 6],
]

const line = (agent: string, rng: () => number): string => {
  const pool = [...(CREW_DIALOG[agent] ?? []), ...(CREW_DIALOG.anybody ?? [])]
  return pool[Math.floor(rng() * pool.length)] ?? 'BRB.'
}

const fleeLine = (rng: () => number) => FLEE_LINES[Math.floor(rng() * FLEE_LINES.length)]

/** bare desk, or somebody's furniture? `elementFromPoint` answers with
    the topmost thing that takes a pointer — the wallpaper takes none, so
    an empty patch answers with the desk layer itself. */
function isBare(vx: number, vy: number): boolean {
  return PROBES.every(([dx, dy]) => {
    const el = document.elementFromPoint(vx + dx, vy + dy)
    return (
      !!el &&
      (el.hasAttribute('data-desk-layer') || el.hasAttribute('data-desktop-root'))
    )
  })
}

/* HUNTING. While anybody is still unmet, findSpot leans its roll toward
   the cursor's own neighbourhood instead of rolling blind across the
   whole desk — outside the jump-scare exclusion (the same ring findSpot
   already keeps clear below), inside a radius a visitor's eye can still
   cover without hunting for it. Once everyone has been introduced the
   roll goes back to uniform: familiar faces don't need to be chased
   down, and spreading out is the more interesting behaviour once first
   contact isn't the point any more. */
const CURSOR_BIAS_MIN = INTRO_RADIUS + 70 // == findSpot's own exclusion ring
const CURSOR_BIAS_MAX = 400

/** roll for an empty patch of desk; null means the desk is full today.
    `hunt` asks for the cursor-biased roll (see HUNTING above) — a
    visitor findSpot has never heard a cursor from still gets the
    uniform roll regardless of what `hunt` says. `rng` is the dice — see
    AmbientAgentsProps. */
function findSpot(
  mouse: { x: number; y: number } | null,
  hunt: boolean,
  rng: () => number
): Spot | null {
  const desk = document.querySelector('[data-desktop-root]')
  if (!desk) return null
  const r = desk.getBoundingClientRect()
  const w = r.width - EDGE_PAD * 2
  const h = r.height - TOP_PAD - BOTTOM_PAD
  if (w < 140 || h < 60) return null
  const hunting = hunt && !!mouse
  for (let i = 0; i < TRIES; i++) {
    let x: number
    let y: number
    if (hunting) {
      const angle = rng() * Math.PI * 2
      const radius = CURSOR_BIAS_MIN + rng() * (CURSOR_BIAS_MAX - CURSOR_BIAS_MIN)
      x = Math.min(EDGE_PAD + w, Math.max(EDGE_PAD, mouse!.x - r.left + Math.cos(angle) * radius))
      y = Math.min(TOP_PAD + h, Math.max(TOP_PAD, mouse!.y - r.top + Math.sin(angle) * radius))
    } else {
      x = EDGE_PAD + rng() * w
      y = TOP_PAD + rng() * h
    }
    const vx = r.left + x
    const vy = r.top + y
    // never surface under the cursor — that is a jump-scare, not a hello
    if (mouse && Math.hypot(mouse.x - vx, mouse.y - (vy - SIZE / 2)) < INTRO_RADIUS + 70)
      continue
    if (isBare(vx, vy))
      return {
        x,
        y,
        face: rng() < 0.5 ? 1 : -1,
        align: x < 150 ? 'left' : x > r.width - 150 ? 'right' : 'center',
      }
  }
  return null
}

/* who you've already been introduced to — a plain id list in
   localStorage, guarded because the read can throw in private mode */
function readMet(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(MET_KEY) ?? '[]')
    return new Set(Array.isArray(raw) ? raw.filter(isCrewId) : [])
  } catch {
    return new Set()
  }
}

/** the floor the desk has to clear before anybody surfaces — read from
    the stylesheet's own `--crew-desktop-min` (shell.module.css) rather
    than hand-copied, so the number lives in exactly one place. Still
    checked here rather than left to CSS alone: a hatch that is
    display:none still costs a probe every few seconds. Falls back to 900
    if the property is ever missing (a stylesheet that hasn't loaded). */
function desktopMin(): number {
  const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--crew-desktop-min'))
  return Number.isFinite(n) ? n : 900
}

export function AmbientAgents({ rng = Math.random, frame }: AmbientAgentsProps = {}) {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  // INSPECT.MODE compresses the desk between two docked panels and the
  // stylesheet hides the crew for the duration; stop probing as well
  const inspecting = useInspect((s) => s.on)

  /* ---- the unit on shift ---- */
  const [cycle, setCycle] = useState(0)
  const [agent, setAgent] = useState(CREW_IDS[0])
  const [spot, setSpot] = useState<Spot | null>(null)
  const [phase, setPhaseState] = useState<Phase>('gone')
  const [bubble, setBubble] = useState<string | null>(null)
  const [jumping, setJumping] = useState(false)
  const [bailing, setBailing] = useState(false)
  const [intro, setIntro] = useState<{ id: string; align: Align } | null>(null)

  const roster = useRef(-1)
  const fullRetries = useRef(0) // consecutive desk-full rolls — see the backoff below
  const mouse = useRef<{ x: number; y: number } | null>(null)
  const pointerWaited = useRef(false)
  const met = useRef<Set<string>>(new Set())
  const spotRef = useRef<Spot | null>(null) // desk coords, for the window watcher
  const atRef = useRef<{ x: number; y: number } | null>(null) // viewport coords, for the cursor
  const duckRef = useRef<((hold?: boolean) => void) | null>(null)
  // handlers fire between renders, so the phase they read has to be a ref
  const phaseRef = useRef<Phase>('gone')
  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])

  /* "The last task i took on" comes from CREW_LAST_TASK — recorded, real,
     and free. It used to read the live feed for a fresher answer; that cost
     a billed Blob operation on EVERY page load, for one line of flavour in
     a speech bubble most visitors never trigger. The deck is where live
     telemetry belongs. */
  const lastTask = CREW_LAST_TASK

  useEffect(() => {
    met.current = readMet()
  }, [])

  /* the cycle effect's own pointermove listener is not attached while the
     desk is full or before the first spawn, so mouse.current would
     otherwise sit null through both — and findSpot can only avoid a
     cursor it has heard from. Recorded at mount instead, once, for the
     life of the component. */
  useEffect(() => {
    const record = (e: PointerEvent) => (mouse.current = { x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', record, { passive: true })
    return () => window.removeEventListener('pointermove', record)
  }, [])

  /* THE DRAG BLIND SPOT. The window watcher below reacts to a new window
     id, so opening a window sends whoever is standing there down the
     hatch politely — but dragging or resizing an EXISTING window onto a
     standing unit fires no store event at all, and the window just slides
     over them at z-index 3. That contradicts the spot probe's own
     courtesy to the furniture, so while a unit is up this re-runs the
     same 10-point isBare footprint on a throttled interval and ducks the
     moment it stops answering with the desk. Ten elementFromPoint calls a
     second is nothing, and it catches icon drags for free — no subscribing
     to window positions required. Runs for the life of the component,
     same as the pointermove recorder above; it is a no-op read the rest
     of the time (phaseRef only reads 'up' once every so often). */
  useEffect(() => {
    const id = window.setInterval(() => {
      const at = atRef.current
      if (phaseRef.current !== 'up' || !at) return
      if (!isBare(at.x, at.y)) duckRef.current?.()
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  /* ONE APPEARANCE PER RUN. The effect is keyed on `cycle` and nothing
     else: it opens a hatch, plays the beats on timers, and schedules the
     next cycle on its way out. Every earlier version of this component
     re-entered its own loop whenever a piece of state changed; a chain of
     timers cannot be interrupted by a re-render, which is the whole
     reason the introduction used to need a ref to survive. */
  useEffect(() => {
    // a pinned frame (Chromatic stories) skips the cycle outright — see
    // PINNING A FRAME, above
    if (frame) return
    if (reduced || inspecting) return
    const min = desktopMin()
    if (window.innerWidth <= min) {
      // a phone gets no crew, and no hit-testing loop either
      const onWide = () => {
        if (window.innerWidth > min) setCycle((c) => c + 1)
      }
      window.addEventListener('resize', onWide)
      return () => window.removeEventListener('resize', onWide)
    }

    /* the first hatch waits for the cursor to declare itself, or eight
       seconds, whichever comes first — a pointer that has never moved is
       invisible to findSpot, and surfacing under it is a jump-scare, not
       a hello. */
    if (!mouse.current && !pointerWaited.current) {
      const kick = () => {
        pointerWaited.current = true
        setCycle((c) => c + 1)
      }
      window.addEventListener('pointermove', kick, { once: true, passive: true })
      const t = window.setTimeout(kick, 8000)
      return () => {
        clearTimeout(t)
        window.removeEventListener('pointermove', kick)
      }
    }

    let timers: number[] = []
    // the dwell countdown, tracked apart from `timers` above so an
    // approaching cursor can push it out without touching the turn/bubble
    // beats scheduled alongside it (see armDuck/extendDuck, below)
    let duckTimer: number | null = null
    let duckDeadline = 0
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms))
    }
    const clear = () => {
      timers.forEach(clearTimeout)
      timers = []
      if (duckTimer !== null) {
        clearTimeout(duckTimer)
        duckTimer = null
      }
    }
    const again = (gap: number) => at(gap, () => setCycle((c) => c + 1))

    // hunt near the cursor while anybody is still unmet (see HUNTING,
    // above findSpot) — once the whole crew has been introduced the roll
    // goes back to uniform
    const found = findSpot(mouse.current, met.current.size < CREW_IDS.length, rng)
    if (!found) {
      // desk full — retry, backing off geometrically per FULL_RETRY_BASE
      const backoff = Math.min(FULL_RETRY_BASE * 2 ** fullRetries.current, FULL_RETRY_MAX)
      fullRetries.current += 1
      again(backoff)
      return clear
    }
    fullRetries.current = 0

    const desk = document.querySelector('[data-desktop-root]')!.getBoundingClientRect()
    const id = CREW_IDS[(roster.current = (roster.current + 1) % CREW_IDS.length)]
    let scared = false
    let calmUntil = 0
    let lastDist: number | null = null // for CLOSING THE GAP, below
    let extended = 0

    spotRef.current = found
    atRef.current = { x: desk.left + found.x, y: desk.top + found.y }
    setAgent(id)
    setSpot(found)
    setBailing(false)
    setPhase('opening')

    const turn = (face: 1 | -1) => setSpot((s) => (s ? { ...s, face } : s))

    const duck = (hold = false) => {
      const p = phaseRef.current
      if (p !== 'up' && p !== 'rising' && p !== 'opening') return
      clear()
      setIntro(null)
      if (!hold) setBubble(null)
      // the hatch re-opens under them first, then they drop through it
      setPhase('exiting')
      at(HOLE_LEAD, () => setPhase('ducking'))
      at(HOLE_LEAD + HOLE_SHUT, () => {
        setPhase('closing')
        setBubble(null)
      })
      at(HOLE_LEAD + DUCK_MS + HOLE_SHUT, () => {
        setPhase('gone')
        setSpot(null)
        spotRef.current = null
        atRef.current = null
      })
      again(HOLE_LEAD + DUCK_MS + HOLE_SHUT + GAP_MIN + rng() * GAP_VAR)
    }
    duckRef.current = duck

    // arms (or re-arms) the dwell countdown against `duckDeadline` rather
    // than a bare `at()`, so extendDuck can push it out mid-flight
    const armDuck = (delay: number) => {
      if (duckTimer !== null) clearTimeout(duckTimer)
      duckDeadline = performance.now() + delay
      duckTimer = window.setTimeout(() => {
        duckTimer = null
        duck()
      }, delay)
    }
    // CLOSING THE GAP (see the const above) — adds time to whatever is
    // left on the clock rather than replacing it, and refuses once the
    // cap is spent or the countdown isn't armed (already fleeing, mid
    // intro, or already gone)
    const extendDuck = (bump: number) => {
      if (duckTimer === null || extended >= DWELL_EXTEND_MAX) return
      const add = Math.min(bump, DWELL_EXTEND_MAX - extended)
      extended += add
      armDuck(Math.max(0, duckDeadline - performance.now()) + add)
    }

    // out of the hatch, the hatch shuts behind them, a beat of standing,
    // then the turn and the line
    const standing = HOLE_LEAD + RISE_SETTLE
    const dwell = DWELL_MIN + rng() * DWELL_VAR
    at(HOLE_LEAD, () => setPhase('rising'))
    at(standing, () => {
      setPhase('up')
      // the dwell countdown starts here, armed rather than a fixed
      // `at()`, so a closing cursor can buy it more time (react, below)
      armDuck(dwell)
      // a cursor already parked beside the spot gets a reaction the
      // moment they stand up — react used to fire on movement only, so a
      // visitor who held still was never noticed
      if (mouse.current) react(mouse.current.x, mouse.current.y)
    })
    at(standing + 800, () => turn(-found.face as 1 | -1))
    at(standing + 1150, () => {
      setBubble(line(id, rng))
      at(2700, () => setBubble(null))
    })
    if (dwell > DWELL_MIN + 2400) {
      at(standing + 4900, () => {
        turn(found.face)
        setBubble(line(id, rng))
        at(2600, () => setBubble(null))
      })
    }

    // shared between the pointermove listener and the moment-of-standing
    // check below, so both a moving cursor and a parked one get read the
    // same way
    const react = (x: number, y: number) => {
      const p = atRef.current
      if (!p || phaseRef.current !== 'up') return
      const now = performance.now()
      const d = Math.hypot(x - p.x, y - (p.y - SIZE / 2))

      // closing the gap buys the dwell timer more time instead of
      // letting it drop the unit mid-approach — see DWELL_EXTEND, above
      if (lastDist !== null && d < lastDist - 1) extendDuck(DWELL_EXTEND)
      lastDist = d

      /* FIRST CONTACT. Before a unit has ever been met, the cursor
         getting close buys an introduction instead of a startle — they
         turn to face you and say what they are. Once each, remembered. */
      if (!met.current.has(id) && d < INTRO_RADIUS) {
        met.current.add(id)
        try {
          localStorage.setItem(MET_KEY, JSON.stringify([...met.current]))
        } catch {
          /* private mode — they'll re-introduce themselves next visit */
        }
        clear()
        setBubble(null)
        turn(x > p.x ? 1 : -1)
        setIntro({ id, align: found.align })
        calmUntil = now + INTRO_MS + 1400
        at(INTRO_MS, () => setIntro(null))
        at(INTRO_MS + 500, () => duck())
        return
      }

      if (d > FLEE_RADIUS || now < calmUntil) return
      if (!scared) {
        // first offense: a startled hop, held ground
        scared = true
        calmUntil = now + 1600
        setBubble(fleeLine(rng))
        setJumping(true)
        at(650, () => setJumping(false))
        at(1600, () => setBubble(null))
      } else {
        // second offense: down the hatch, mid-sentence
        setBubble(fleeLine(rng))
        setBailing(true)
        at(340, () => duck(true))
      }
    }

    const onMouse = (e: PointerEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      react(e.clientX, e.clientY)
    }

    // the desk moved under them — the spot they measured is not that spot
    const onResize = () => duck()

    window.addEventListener('pointermove', onMouse, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      clear()
      duckRef.current = null
      window.removeEventListener('pointermove', onMouse)
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, inspecting, cycle, frame, rng])

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
            const agentId = agentForWindow(id)
            setFlashes((cur) => [
              ...cur.slice(-2),
              { key, agent: agentId, x: def.pos.x + def.size.w - 56, y: Math.max(40, def.pos.y - 4) },
            ])
            setTimeout(() => setFlashes((cur) => cur.filter((f) => f.key !== key)), 1900)
            /* a window is about to land on top of whoever is standing
               there. They get out of the way rather than being papered
               over — same courtesy the spot probe pays the furniture. */
            const s = spotRef.current
            if (
              s &&
              s.x > def.pos.x - 20 &&
              s.x < def.pos.x + def.size.w + 20 &&
              s.y > def.pos.y - 20 &&
              s.y < def.pos.y + def.size.h + 20
            ) {
              duckRef.current?.()
            }
          }
        }
      }
      known.current = ids
    })
    return unsub
  }, [])

  // a pinned frame overrides the live state wholesale — see PINNING A
  // FRAME, above
  const activePhase = frame?.phase ?? phase
  const activeSpot = frame?.spot ?? spot
  const activeAgent = frame?.agent ?? agent
  const activeBubble = frame ? frame.bubble ?? null : bubble
  const activeIntro = frame ? frame.intro ?? null : intro

  // the door is up for the two transitions only; the body is up from the
  // moment it starts climbing until the moment it starts dropping
  const open =
    activePhase === 'opening' ||
    activePhase === 'rising' ||
    activePhase === 'exiting' ||
    activePhase === 'ducking'
  const risen = activePhase === 'rising' || activePhase === 'up' || activePhase === 'exiting'

  return (
    <>
      {(frame || !reduced) && activeSpot && (
        <div
          className={styles.burrow}
          style={{ left: activeSpot.x, top: activeSpot.y }}
          aria-hidden="true"
        >
          {/* the door is on `widget` and the body on `rise`: the climb
              is allowed its bounce, the hole is not (Jake, s88 — `rise`
              overshot the ellipse to 1.09 and read as rubber). A pinned
              frame skips the entrance too (`initial={false}`) — Chromatic
              gets the settled art directly rather than a snapshot of
              wherever the spring happened to be. */}
          <motion.span
            className={styles.hole}
            initial={frame ? false : { scale: 0 }}
            animate={{ scale: open ? 1 : 0 }}
            transition={SPRINGS.widget}
            data-spring="widget"
          />

          <span className={styles.riser}>
            {/* the climb is on this box and the idle bob is on the sprite
                inside it: one transform each, so neither clobbers the
                other (a CSS animation outranks an inline transform, which
                is how the old walker's turn quietly never happened).
                scaleX is cut to a hard flip, not sprung: a mirrored sprite
                turns on a frame, and on the shared rise spring the turn
                passed through zero width and overshot past ±1 — the same
                rubber the door was cured of. */}
            <motion.span
              className={styles.rider}
              initial={frame ? false : { y: SIZE + 8 }}
              animate={{ y: risen ? 0 : SIZE + 8, scaleX: activeSpot.face }}
              transition={{ ...SPRINGS.rise, scaleX: { duration: 0 } }}
              data-spring="rise"
            >
              <span
                className={styles.agentAvatar}
                data-talking={(risen && activeBubble && !bailing) || undefined}
                data-fleeing={bailing || undefined}
                data-jumping={jumping || undefined}
                style={{
                  WebkitMaskImage: `url(${avatarFor(activeAgent, skin)})`,
                  maskImage: `url(${avatarFor(activeAgent, skin)})`,
                }}
              />
            </motion.span>
          </span>

          <AnimatePresence>
            {activeIntro && (
              <motion.div
                className={styles.introCard}
                data-align={activeIntro.align}
                initial={frame ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRINGS.deck}
                data-spring="deck"
              >
                <span className={styles.introHi}>
                  HI — I&apos;M {CREW_BY_ID[activeIntro.id]?.name}. ONE OF JAKE&apos;S AGENTS.
                </span>
                <span className={styles.introJob}>
                  {CREW_BY_ID[activeIntro.id]?.model} · {CREW_INTRO[activeIntro.id]}
                </span>
                <span className={styles.introTask}>
                  LAST TASK — {lastTask[activeIntro.id]}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeBubble && !activeIntro && (
              <motion.span
                className={styles.bubble}
                data-align={activeSpot.align}
                initial={frame ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {activeBubble}
              </motion.span>
            )}
          </AnimatePresence>
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
                WebkitMaskImage: `url(${avatarFor(f.agent, skin)})`,
                maskImage: `url(${avatarFor(f.agent, skin)})`,
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
