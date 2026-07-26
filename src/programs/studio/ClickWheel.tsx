'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import { haptic } from '@/lib/haptics'
import styles from './studio.module.css'

/* The click wheel — the whole point of the device.
 *
 * Three input models share one surface, in this priority:
 *   1. Four real <button> zones (MENU / ⏮ / ⏭ / ▶❚❚) + a centre SELECT.
 *      These are the accessible baseline: tab-reachable, labelled, clickable.
 *   2. Rotational drag on the ring — see the contract below.
 *   3. Keyboard on the region — arrows emit one detent, Esc/Backspace = MENU.
 *      Enter and Space are left alone so the focused <button> handles them.
 *
 * THE ROTATION CONTRACT (one callback, and the wheel stays dumb about
 * meaning). The wheel reports *incremental* travel — "you just turned me
 * +7.4°" — and `onTurn` returns how many of those degrees the parent
 * actually CONSUMED. Everything else falls out of that:
 *
 *   · Relative by construction. There is no anchor and no absolute total,
 *     so a grab never jumps the value to the thumb's position.
 *   · No slack, ever. Degrees the parent didn't use are DISCARDED at the
 *     source, so a control pinned at 0 or 1 banks nothing: reverse and it
 *     moves immediately, instead of unwinding the travel you overshot by.
 *     (This was the volume bug: the old model accumulated a signed total
 *     and clamped only the output.)
 *   · The click track is honest. sfx.tap() + haptic.tick() fire once per
 *     TICK_DEG of *consumed* travel, so a pinned control is silent.
 *   · The keyboard is the same path: one arrow = one detent of degrees.
 *
 * The parent decides what a turn MEANS (volume on Now Playing, list
 * selection on Songs); the wheel only reports motion. */

/** one detent — a click, one list step, one arrow-key press */
export const TICK_DEG = 24
/** travel past this and the gesture is a turn, not a tap on a zone button */
const DRAG_DEG = 6

/* 8 spokes for the medieval wheel, on a 100×100 viewBox.
 *
 * The wooden look is split across two layers on purpose, because only one of
 * them should turn:
 *   · the LIGHTING lives in CSS on `.ring` (see studio.module.css) — a fixed
 *     specular highlight up-left and a darkening toward the felloe. Light
 *     doesn't travel with the wheel, so it must not rotate.
 *   · the GRAIN, spokes and hub live in this SVG, which does rotate under
 *     your thumb. Wood grain turning with the wheel is the whole illusion.
 *
 * Each spoke is drawn as a carved groove: a dark shadow stroke with a lit
 * stroke offset perpendicular to it, which is what gives the flat disc
 * depth. `off` below is that perpendicular. */
const HUB_R = 15
const RIM_R = 41

/* A CONSTANT id, not useId(). useId looked like the careful choice and caused
   a hydration mismatch: Studio is a `next/dynamic` import inside a tree whose
   shape changes right after hydration (Desktop renders the SSR `initialWindows`
   and then hands over to the store — and on mobile it clears them), so the
   useId sequence differs between server and client and the <pattern id> came
   back different. A literal is safe here because the store allows exactly one
   window per program id, so two wheels can never coexist — the same reasoning
   as the shell's single `lunde-roughen` filter def. */
const GRAIN_ID = 'lunde-wheel-grain'
const SPOKES = Array.from({ length: 8 }, (_, i) => {
  const a = ((i * 45 - 90) * Math.PI) / 180
  const off = 0.85 // perpendicular offset for the lit edge of the groove
  const px = Math.cos(a + Math.PI / 2) * off
  const py = Math.sin(a + Math.PI / 2) * off
  const x1 = 50 + Math.cos(a) * HUB_R
  const y1 = 50 + Math.sin(a) * HUB_R
  const x2 = 50 + Math.cos(a) * RIM_R
  const y2 = 50 + Math.sin(a) * RIM_R
  return { x1, y1, x2, y2, lx1: x1 + px, ly1: y1 + py, lx2: x2 + px, ly2: y2 + py }
})

type Props = {
  /** Signed degrees just travelled (+ = clockwise). Return how many of them
   *  were consumed — less (or 0) when whatever this drives is pinned. */
  onTurn: (deg: number) => number
  onMenu: () => void
  onSelect: () => void
  onPrev: () => void
  onNext: () => void
  onPlayPause: () => void
  playing: boolean
}

export default function ClickWheel({
  onTurn,
  onMenu,
  onSelect,
  onPrev,
  onNext,
  onPlayPause,
  playing,
}: Props) {
  const ringRef = useRef<HTMLDivElement>(null)
  const spokeRef = useRef<SVGSVGElement>(null)

  /** live gesture: last pointer angle + raw travel (for the tap/turn verdict) */
  const drag = useRef<{ last: number; raw: number } | null>(null)
  /** consumed degrees not yet spent on a detent click — always < TICK_DEG */
  const tick = useRef(0)
  const moved = useRef(false)
  const spin = useRef(0)
  const teardown = useRef<(() => void) | null>(null)

  const reduced = useReducedMotion()

  // onTurn changes identity every render; the pointer loop reads it late
  const live = useRef(onTurn)
  live.current = onTurn

  useEffect(() => () => teardown.current?.(), [])

  /** hand `deg` to the parent, then click for every detent it kept */
  const turn = (deg: number) => {
    if (!deg) return
    const used = live.current(deg)
    if (!used) return
    tick.current += used
    while (Math.abs(tick.current) >= TICK_DEG) {
      tick.current -= Math.sign(tick.current) * TICK_DEG
      sfx.tap()
      haptic.tick()
    }
  }

  const polar = (cx: number, cy: number) => {
    const box = ringRef.current?.getBoundingClientRect()
    if (!box || box.width === 0) return null
    const dx = cx - (box.left + box.width / 2)
    const dy = cy - (box.top + box.height / 2)
    return {
      deg: (Math.atan2(dy, dx) * 180) / Math.PI,
      r: Math.hypot(dx, dy) / (box.width / 2),
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // cleared before the hit test: a rejected press (on SELECT, say) must not
    // leave a stale verdict behind that swallows its own click
    moved.current = false
    const p = polar(e.clientX, e.clientY)
    // r is normalised so the rim is 1 and the SELECT disc (38% of the wheel)
    // ends at 0.38 — anything inside that, or well outside the rim, isn't a turn
    if (!p || p.r < 0.4 || p.r > 1.08) return

    teardown.current?.() // a second pointer mid-gesture must not leak listeners
    drag.current = { last: p.deg, raw: 0 }
    tick.current = 0 // each grab starts on a crisp detent boundary

    const move = (ev: PointerEvent) => {
      const d = drag.current
      const q = polar(ev.clientX, ev.clientY)
      if (!d || !q) return
      let delta = q.deg - d.last
      if (delta > 180) delta -= 360
      else if (delta < -180) delta += 360
      d.last = q.deg
      d.raw += Math.abs(delta)
      if (d.raw > DRAG_DEG) moved.current = true

      // decorative only: the wooden wheel turns under your thumb whether or
      // not the value it drives has anywhere left to go
      spin.current += delta
      if (!reduced && spokeRef.current) {
        spokeRef.current.style.transform = `rotate(${spin.current}deg)`
      }

      turn(delta)
    }

    const end = () => teardown.current?.()
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    teardown.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      drag.current = null
      teardown.current = null
    }
  }

  /* a turn that ended on a zone button must not also press it */
  const onClickCapture = (e: React.MouseEvent) => {
    if (!moved.current) return
    moved.current = false
    e.preventDefault()
    e.stopPropagation()
  }

  const press = (fn: () => void) => () => {
    sfx.tap()
    haptic.bump()
    fn()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      turn(TICK_DEG)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      turn(-TICK_DEG)
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      // MENU is the device's back button. The shell closes a window on
      // Escape, so while the wheel holds focus we keep that key for
      // "back one screen" — otherwise the two fire at once.
      e.preventDefault()
      e.stopPropagation()
      press(onMenu)()
    }
  }

  return (
    <div className={styles.wheel}>
      <div
        ref={ringRef}
        className={styles.ring}
        role="group"
        aria-label="Click wheel"
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        {/* medieval costume: a turned-wood spoke wheel. Hidden in every other
            skin by CSS, so no per-skin branch reaches the JS. Colours all
            live in studio.module.css (stop-color/fill/stroke are CSS
            properties), so the wood stays derived from the skin's tokens. */}
        <svg ref={spokeRef} className={styles.spokes} viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            {/* quarter-sawn grain, off-axis so it never lines up with a spoke */}
            <pattern
              id={GRAIN_ID}
              width="100"
              height="3.4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-9 50 50)"
            >
              <path className={styles.grainLine} d="M0 0.5 H100" />
              <path className={styles.grainLineFaint} d="M0 2.1 H100" />
            </pattern>
          </defs>

          {/* felloe: the outer rim band, and the iron tyre banding it */}
          <circle className={styles.spokeRim} cx="50" cy="50" r="46" />
          <circle className={styles.grainFill} cx="50" cy="50" r="45" fill={`url(#${GRAIN_ID})`} />
          <circle className={styles.spokeTyre} cx="50" cy="50" r="48.2" />
          <circle className={styles.spokeRimInner} cx="50" cy="50" r={RIM_R} />

          {SPOKES.map((s, i) => (
            <g key={i}>
              <line className={styles.spoke} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
              <line
                className={styles.spokeLit}
                x1={s.lx1}
                y1={s.ly1}
                x2={s.lx2}
                y2={s.ly2}
              />
            </g>
          ))}

          <circle className={styles.spokeHub} cx="50" cy="50" r={HUB_R} />
          <circle
            className={styles.grainFill}
            cx="50"
            cy="50"
            r={HUB_R - 1}
            fill={`url(#${GRAIN_ID})`}
          />
          <circle className={styles.spokeHubLip} cx="50" cy="50" r={HUB_R - 3.2} />
          <circle className={styles.spokePin} cx="50" cy="50" r="3.4" />
        </svg>

        <button
          type="button"
          className={`${styles.zone} ${styles.zoneMenu}`}
          onClick={press(onMenu)}
        >
          Menu
        </button>
        <button
          type="button"
          className={`${styles.zone} ${styles.zonePrev}`}
          aria-label="Previous track"
          onClick={press(onPrev)}
        >
          <span aria-hidden="true">⏮</span>
        </button>
        <button
          type="button"
          className={`${styles.zone} ${styles.zoneNext}`}
          aria-label="Next track"
          onClick={press(onNext)}
        >
          <span aria-hidden="true">⏭</span>
        </button>
        <button
          type="button"
          className={`${styles.zone} ${styles.zonePlay}`}
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={press(onPlayPause)}
        >
          <span aria-hidden="true">▶❚❚</span>
        </button>

        <button
          type="button"
          className={styles.select}
          aria-label="Select"
          onClick={press(onSelect)}
        />
      </div>
    </div>
  )
}
