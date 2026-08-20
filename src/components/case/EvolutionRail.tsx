'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import { HUB_MODE_LABELS, HUB_SHOTS, HUB_SHOT_DIR, HUB_SHOT_MS } from './hubShipped'
import { useHubLink } from './hubLink'
import { useFidelity } from './fidelity'
import styles from './case.module.css'

/* PROGRESS.VWR — a window into watching the Family Hub get built. A
   nested mini-window rides the case's right margin and climbs the
   fidelity ladder as the story scrolls: living sketch, real prototype
   recordings, and a break-out finale where the device hangs in a
   kitchen. The persuasion-ladder thesis made literal.

   s89, the hand-off: while §03's HubModes plate is on screen, this
   window is LENT to it — the ladder steps aside and the viewer becomes
   the plate's monitor, showing the shipped screens for whichever mode
   the plate's tabs pick (hubLink store; screens in hubShipped). One
   window controlling another is the point: the page argues, the viewer
   holds the evidence. Everywhere else the ladder runs at full strength.
   Below the 640px container threshold this rail doesn't render and the
   plate keeps its own toggle — nothing here to hand off to.

   Stage switching rides IntersectionObserver on the case's own beats
   (hero → sections → footer), never scroll-linked animation: safe in a
   hidden tab and under prefers-reduced-motion. The scroller is the
   WINDOW body, not the viewport — sticky anchors to it on its own.
   Stage art exports from Figma "scroller viz" (201161-12); labels are
   Jake's section names there; demos are his screen recordings
   (ref/assets-casestudies, transcoded); each slot swappable (§2 law).
   Every stage declares its exact asset ratio so the mat stays a
   uniform 10px on all sides. */

const DIR = '/case/family-hub/evo'

type Stage = {
  v: string
  label: string
  ratio: string
  alt: string
  /** stage image; the sketch stage renders the living scene instead */
  file?: string
  /** the last two beats break out of the artboard and hang in a room */
  scene?: 'wall' | 'kitchen'
  /** Jake's screen recording of the real prototype — plays while the
      stage is up, still frame (poster) under reduced motion */
  video?: string
}

const STAGES: Stage[] = [
  { v: 'v0.1', label: 'Sketch', ratio: '1089 / 490', alt: 'Concept collage: a big pink clock, weather, calendar and home glyphs, family portrait avatars, one checked-off chore — all gently afloat.' },
  { file: 'poster-poc.webp', video: 'demo-poc', v: 'v0.2', label: 'Proof of Concept', ratio: '16 / 9', alt: 'Screen recording of the first clickable prototype: clicking through the dark dashboard, the family agenda blocked in as bright color bars.' },
  { file: 'poster-poc.webp', video: 'demo-poc', v: 'v0.3', label: 'Proof of Concept', ratio: '16 / 9', alt: 'The proof-of-concept demo rolls on: into the month calendar, the whole household on one grid.' },
  { file: 'poster-wireframes.webp', video: 'demo-wireframes', v: 'v0.4', label: 'Lo-Fi Explorations', ratio: '1280 / 712', alt: 'Screen recording of the lo-fi build in Greenlight green: the morning brief and school-run map in motion.' },
  { file: 'poster-wireframes.webp', video: 'demo-wireframes', v: 'v0.5', label: 'Lo-Fi Explorations', ratio: '1280 / 712', alt: 'The lo-fi demo rolls on: the ambient morning screen, 8:32 AM.' },
  { file: 'poster-hifi.webp', video: 'demo-hifi', v: 'v0.6', label: 'Hi-Fi Prototype', ratio: '16 / 9', alt: 'Screen recording of the hi-fi prototype: driving the light dashboard as it takes its shipped shape.' },
  { file: 'stage-06.webp', v: 'v0.7', label: 'Color Explorations', ratio: '1440 / 800', alt: 'Color exploration: chats, chores and calendar as calm cards, color only where it means something.' },
  { file: 'stage-07.webp', v: 'v0.9', label: 'On-Device Testing', ratio: '10 / 7', scene: 'wall', alt: 'The launch build under test: the device hung on a plain wall.', },
  { file: 'stage-08.webp', v: 'v1.0', label: 'Ship', ratio: '10 / 7', scene: 'kitchen', alt: 'Family Hub live in situ: the device on a kitchen wall, plant on the counter.' },
  /* s94, Jake's rung past the ship: the ladder ends back at the
     drawing board. Same living collage as v0.1 — accounts, the home
     roll-up and new permissions start life the way everything here
     did, as a sketch. No file = the sketch scene renders. */
  { v: 'v1.1', label: 'Next', ratio: '1089 / 490', alt: 'The concept collage again, gently afloat: the next round of features back on the drawing board.' },
]

/* The story's beats don't map 1:1 onto the ladder — Jake's cut: the
   hi-fi prototype must arrive with §04 "the artifact" (the persuasion
   section IS the hi-fi build), which folds both lo-fi beats into §03.
   v0.5 stays reachable from the ticks; its demo spans v0.4 anyway.
   s94: on-device testing (v0.9) lands with §06 (the hub on the desk is
   that section's whole method), the kitchen ship with §07, and the
   footer walks back to the drawing board (v1.1).
   Index = [hero, §01..§07, footer] → stage. */
const BEAT_TO_STAGE = [0, 1, 2, 3, 5, 6, 7, 8, 9]

/* The living sketch — Jake's concept collage as cutouts on a virtual
   1089×490 canvas (coords straight from the Figma group), each adrift
   on its own slow loop, shying away from the cursor. Deltas are
   screen-px and small on purpose: ambient, not a parlor trick. */

const SK = { w: 1089, h: 490 }

type Bit = {
  f: string
  x: number
  y: number
  w: number
  /** natural export height — for the repel math's center points */
  h: number
  dx: number
  dy: number
  dr: number
  dur: number
  delay: number
}

const BITS: Bit[] = [
  { f: 'head', x: 0, y: 21, w: 351, h: 72, dx: 1, dy: 3, dr: 0, dur: 11, delay: -4 },
  { f: 'week', x: 182, y: 178, w: 105, h: 45, dx: -3, dy: 2, dr: -1, dur: 9, delay: -2 },
  { f: 'cal', x: 516, y: 92, w: 86, h: 87, dx: 2, dy: -4, dr: 1.5, dur: 8, delay: -6 },
  { f: 'house', x: 361, y: 153, w: 64, h: 64, dx: -2, dy: -3, dr: -1.5, dur: 10, delay: -1 },
  { f: 'bell', x: 709, y: 223, w: 37, h: 37, dx: 3, dy: -2, dr: 2, dur: 7, delay: -3 },
  { f: 'mom', x: 273, y: 255, w: 162, h: 163, dx: 3, dy: 4, dr: 0.8, dur: 12, delay: -7 },
  { f: 'dad', x: 456, y: 214, w: 92, h: 92, dx: -3, dy: 3, dr: -1, dur: 9.5, delay: -5 },
  { f: 'girl', x: 456, y: 336, w: 125, h: 125, dx: 2, dy: -3, dr: 1, dur: 11.5, delay: -9 },
  { f: 'boy', x: 587, y: 255, w: 100, h: 100, dx: -2, dy: -4, dr: -0.8, dur: 10.5, delay: -2 },
  { f: 'temp', x: 100, y: 316, w: 135, h: 44, dx: 3, dy: -2, dr: 1, dur: 9, delay: -8 },
  { f: 'checklist', x: 386, y: 432, w: 58, h: 58, dx: -3, dy: 2, dr: -2, dur: 8.5, delay: -4 },
  { f: 'pin', x: 602, y: 389, w: 49, h: 50, dx: 2, dy: 3, dr: 2, dur: 7.5, delay: -6 },
  { f: 'check', x: 726, y: 343, w: 70, h: 70, dx: -2, dy: -2, dr: -1.5, dur: 8, delay: -1 },
  { f: 'task', x: 826, y: 364, w: 263, h: 26, dx: 3, dy: 2, dr: 0.5, dur: 10, delay: -5 },
]

const NO_PUSH = BITS.map(() => ({ x: 0, y: 0 }))

function SketchScene({ on }: { on: boolean }) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [push, setPush] = useState(NO_PUSH)

  // cutouts shy away from the pointer: a gentle radial shove, spring-
  // settled, on top of (not instead of) their idle drift
  const onMove = (e: React.PointerEvent) => {
    if (!on || reduced || !sceneRef.current) return
    const r = sceneRef.current.getBoundingClientRect()
    const cx = e.clientX - r.left
    const cy = e.clientY - r.top
    const radius = r.width * 0.2
    const shove = r.width * 0.045
    setPush(
      BITS.map((b) => {
        const bx = ((b.x + b.w / 2) / SK.w) * r.width
        const by = ((b.y + b.h / 2) / SK.h) * r.height
        const dx = bx - cx
        const dy = by - cy
        const d = Math.hypot(dx, dy)
        if (d >= radius || d === 0) return { x: 0, y: 0 }
        const f = ((radius - d) / radius) * shove
        return { x: (dx / d) * f, y: (dy / d) * f }
      }),
    )
  }

  return (
    <div
      className={styles.railScene}
      data-on={on ? 'true' : undefined}
      aria-hidden="true"
      ref={sceneRef}
      onPointerMove={onMove}
      onPointerLeave={() => setPush(NO_PUSH)}
    >
      {BITS.map((b, i) => (
        <motion.div
          key={b.f}
          className={styles.railBitWrap}
          style={{
            left: `${(b.x / SK.w) * 100}%`,
            top: `${(b.y / SK.h) * 100}%`,
            width: `${(b.w / SK.w) * 100}%`,
          }}
          animate={{ x: push[i].x, y: push[i].y }}
          transition={SPRINGS.widget}
          data-spring="widget"
        >
          <img
            src={`${DIR}/sketch/${b.f}.webp`}
            alt=""
            draggable={false}
            className={styles.railBit}
            style={{
              ['--dx' as string]: `${b.dx}px`,
              ['--dy' as string]: `${b.dy}px`,
              ['--dr' as string]: `${b.dr}deg`,
              ['--dur' as string]: `${b.dur}s`,
              ['--delay' as string]: `${b.delay}s`,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

/* The break-out finale: the artwork leaves the artboard. Paper becomes a
   room — a plain wall for on-device testing, a kitchen for the ship —
   and the device hangs on it with a real shadow. Scene colors are
   hardcoded warm neutrals from the classic-skin family (like plate ink):
   the scene reads as a photograph, constant across themes. Swaps for
   Jake's launch photography when it lands (§2 law). */

function WallScene({
  kitchen,
  on,
  src,
}: {
  kitchen: boolean
  on: boolean
  src: string
}) {
  const p = kitchen ? 'k' : 'w'
  return (
    <div className={styles.railWallScene} data-on={on ? 'true' : undefined} aria-hidden="true">
      <svg viewBox="0 0 144 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-wall`} x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor={kitchen ? '#f7f0e1' : '#f2ede3'} />
            <stop offset="1" stopColor={kitchen ? '#e8ddc8' : '#e1dbcc'} />
          </linearGradient>
          <radialGradient id={`${p}-light`} cx="0.12" cy="0.05" r="0.9">
            <stop offset="0" stopColor="#fffaee" stopOpacity="0.6" />
            <stop offset="1" stopColor="#fffaee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="144" height="100" fill={`url(#${p}-wall)`} />
        <rect width="144" height="100" fill={`url(#${p}-light)`} />
        {kitchen && (
          <g>
            {/* counter */}
            <rect x="0" y="82" width="144" height="18" fill="#d9cdb6" />
            <rect x="0" y="82" width="144" height="1.4" fill="#c2b394" />
            {/* the counter plant — blob rules apply: no outlines, nothing mirrored */}
            <g>
              <path d="M124.5 83 L133.5 83 L132.2 74.5 L125.6 74.5 Z" fill="#c98d52" />
              <ellipse cx="126.2" cy="70" rx="4.2" ry="5.6" fill="#6b8a5c" transform="rotate(-14 126.2 70)" />
              <ellipse cx="131.8" cy="68.6" rx="3.4" ry="5.9" fill="#57744a" transform="rotate(11 131.8 68.6)" />
              <ellipse cx="128.7" cy="65.4" rx="2.7" ry="4.6" fill="#7d9a6c" transform="rotate(-3 128.7 65.4)" />
            </g>
          </g>
        )}
      </svg>
      <img className={styles.railDevice} src={src} alt="" draggable={false} />
    </div>
  )
}

export function EvolutionRail() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [stage, setStage] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const marksRef = useRef<Element[]>([])
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  /* the hand-off: §03's plate publishes mode + presence; while live
     (and this slot actually has width — below 640 it's display:none
     and there's nothing to lend) the viewer is its monitor */
  const hubMode = useHubLink((st) => st.mode)
  const hubLive = useHubLink((st) => st.live)
  /* s94: the loan waits for the reader — draft mode keeps the ladder
     running; flipping the case's fidelity switch to shipped is what
     hands the viewer over as §03's monitor */
  const fidelity = useFidelity((st) => st.mode)
  const [slotOn, setSlotOn] = useState(false)
  const [shipShot, setShipShot] = useState(0)
  /* Auto-zoom on the break-out is OFF for now (Jake: tune later) —
     the + control still zooms manually. */

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setSlotOn(el.offsetWidth > 0))
    ro.observe(el)
    setSlotOn(el.offsetWidth > 0)
    return () => ro.disconnect()
  }, [])

  const lent = hubLive && slotOn && !minimized && fidelity === 'shipped'

  useEffect(() => {
    setShipShot(0)
  }, [hubMode])

  /* the lent cycle — the viewer advances the shipped screens itself;
     the plate's own timer only ever runs where this rail doesn't exist */
  useEffect(() => {
    if (!lent || reduced) return
    const t = setInterval(
      () => setShipShot((i) => (i + 1) % HUB_SHOTS[hubMode].length),
      HUB_SHOT_MS,
    )
    return () => clearInterval(t)
  }, [lent, reduced, hubMode])

  // demos run only while their stage is up and the window is open;
  // reduced motion gets the poster still. preload="none" means nothing
  // downloads until here. While lent the ladder (and its videos) is
  // unmounted, so returning from a loan must re-kick the active demo.
  useEffect(() => {
    const active = STAGES[stage]?.video
    for (const [key, el] of Object.entries(videoRefs.current)) {
      if (!el) continue
      if (key === active && !reduced && !minimized) el.play().catch(() => {})
      else el.pause()
    }
  }, [stage, reduced, minimized, lent])

  useEffect(() => {
    const article = ref.current?.closest('article')
    if (!article) return
    const marks = Array.from(
      article.querySelectorAll(`.${styles.hero}, .${styles.section}, .${styles.caseFooter}`),
    )
    marksRef.current = marks
    if (marks.length < 2) return

    // the hand-tuned beat map when the case has its expected shape;
    // proportional fallback if a section is ever added or cut
    const toStage = (i: number) =>
      marks.length === BEAT_TO_STAGE.length
        ? BEAT_TO_STAGE[i]
        : Math.round((i / (marks.length - 1)) * (STAGES.length - 1))
    const live = new Set<number>()
    const onEntries = (entries: IntersectionObserverEntry[]) => {
      for (const e of entries) {
        const i = marks.indexOf(e.target)
        if (e.isIntersecting) live.add(i)
        else live.delete(i)
      }
      if (live.size) setStage(toStage(Math.max(...live)))
    }
    // tripline: a beat counts once it reaches the upper 45% of the view;
    // the lowest live beat drives the ladder
    const io = new IntersectionObserver(onEntries, { rootMargin: '0px 0px -55% 0px', threshold: 0 })
    // …except the last beat: the footer lives in the final pixels of
    // scroll and can never climb into that band, so v1.0 ships the
    // moment the footer is properly on screen at all
    const ioLast = new IntersectionObserver(onEntries, { rootMargin: '0px 0px -5% 0px', threshold: 0 })
    marks.forEach((m, i) => (i === marks.length - 1 ? ioLast : io).observe(m))
    return () => {
      io.disconnect()
      ioLast.disconnect()
    }
  }, [])

  const cur = STAGES[stage]

  const jumpTo = (i: number) => {
    const marks = marksRef.current
    if (!marks.length) return
    let beat: number
    if (marks.length === BEAT_TO_STAGE.length) {
      // first beat carrying this stage — or the nearest one after it
      // for a stage the scroll path skips (v0.5 rides v0.4's beat)
      beat = BEAT_TO_STAGE.indexOf(i)
      if (beat === -1) beat = BEAT_TO_STAGE.findIndex((s) => s >= i)
      if (beat === -1) beat = marks.length - 1
    } else {
      beat = Math.round((i / (STAGES.length - 1)) * (marks.length - 1))
    }
    sfx.tap()
    marks[beat]?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className={styles.railSlot} ref={ref} data-zoom={zoomed && !minimized ? 'true' : undefined}>
      <aside
        className={styles.rail}
        aria-label="Progress viewer: the Family Hub being built, stage by stage"
        data-min={minimized ? 'true' : undefined}
      >
        <div
          className={styles.railBar}
          onClick={() => {
            // window-shade: a click anywhere on the collapsed bar reopens
            if (minimized) {
              sfx.tap()
              setMinimized(false)
            }
          }}
        >
          <button
            className={styles.railCtrl}
            aria-label={minimized ? 'Restore the progress viewer' : 'Minimize the progress viewer'}
            aria-pressed={minimized}
            onClick={(e) => {
              e.stopPropagation()
              sfx.tap()
              setMinimized((m) => !m)
            }}
          >
            −
          </button>
          {!minimized && (
            <button
              className={styles.railCtrl}
              aria-label={zoomed ? 'Restore the progress viewer size' : 'Zoom the progress viewer'}
              aria-pressed={zoomed}
              onClick={() => {
                sfx.tap()
                setZoomed((z) => !z)
              }}
            >
              +
            </button>
          )}
          <span className={styles.railTitle}>Progress.Vwr</span>
          <span className={styles.railVer}>{lent ? 'v1.0' : cur.v}</span>
        </div>
        {!minimized && (
          <>
            {lent ? (
              <button
                type="button"
                className={styles.railShip}
                aria-label={`${HUB_MODE_LABELS[hubMode]} as shipped, screen ${shipShot + 1} of ${HUB_SHOTS[hubMode].length}. Next screen.`}
                onClick={() => {
                  sfx.tap()
                  setShipShot((i) => (i + 1) % HUB_SHOTS[hubMode].length)
                }}
              >
                <div className={styles.railStack} style={{ aspectRatio: '1086 / 610' }}>
                  {HUB_SHOTS[hubMode].map((sh, i) => (
                    <img
                      key={sh.file}
                      src={`${HUB_SHOT_DIR}/${sh.file}.webp`}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      draggable={false}
                      data-on={i === shipShot ? 'true' : undefined}
                    />
                  ))}
                </div>
              </button>
            ) : (
            <div
              className={styles.railView}
              role="img"
              aria-label={`${cur.v} · ${cur.label}. ${cur.alt}`}
              data-scene={cur.scene ? 'true' : undefined}
              data-video={cur.video ? 'true' : undefined}
              data-sketch={!cur.file ? 'true' : undefined}
            >
              <div className={styles.railStack} style={{ aspectRatio: cur.ratio }}>
                {/* fileless rungs are the sketch: v0.1, and v1.1's reprise */}
                <SketchScene on={!cur.file} />
                {STAGES.map(
                  (s, i) =>
                    s.file &&
                    !s.scene &&
                    !s.video && (
                      <img
                        key={s.file}
                        src={`${DIR}/${s.file}`}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        data-on={i === stage ? 'true' : undefined}
                      />
                    ),
                )}
                {/* one element per recording — a demo spanning several beats
                    (PoC covers v0.2 AND v0.3) keeps rolling across them */}
                {STAGES.filter(
                  (s, i, all) => s.video && all.findIndex((x) => x.video === s.video) === i,
                ).map((s) => (
                  <video
                    key={s.video}
                    ref={(el) => {
                      videoRefs.current[s.video!] = el
                    }}
                    poster={`${DIR}/${s.file}`}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-hidden="true"
                    data-on={STAGES[stage].video === s.video ? 'true' : undefined}
                  >
                    {/* h264 for the world, vp9 for open-codec builds */}
                    <source src={`${DIR}/${s.video}.mp4`} type="video/mp4" />
                    <source src={`${DIR}/${s.video}.webm`} type="video/webm" />
                  </video>
                ))}
                {STAGES.map(
                  (s, i) =>
                    s.file &&
                    s.scene && (
                      <WallScene
                        key={s.file}
                        kitchen={s.scene === 'kitchen'}
                        on={i === stage}
                        src={`${DIR}/${s.file}`}
                      />
                    ),
                )}
              </div>
            </div>
            )}
            <div className={styles.railFoot} data-lent={lent ? 'true' : undefined}>
              {STAGES.map((s, i) => (
                <button
                  key={s.v}
                  className={styles.railTick}
                  aria-label={`${s.v} · ${s.label}`}
                  aria-current={i === stage ? 'step' : undefined}
                  data-on={i === stage ? 'true' : undefined}
                  data-done={i < stage ? 'true' : undefined}
                  onClick={() => jumpTo(i)}
                />
              ))}
            </div>
            <div className={styles.railLabel} aria-hidden="true">
              {lent
                ? `shipped · ${HUB_MODE_LABELS[hubMode]} · ${String(shipShot + 1).padStart(2, '0')} / ${String(HUB_SHOTS[hubMode].length).padStart(2, '0')}`
                : `${cur.v} · ${cur.label}${cur.video && !reduced ? ' · demo' : ''}`}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
