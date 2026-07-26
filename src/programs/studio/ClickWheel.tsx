'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './studio.module.css'

/* The click wheel — the whole point of the device.
 *
 * Three input models share one surface, in this priority:
 *   1. Four real <button> zones (MENU / ⏮ / ⏭ / ▶❚❚) + a centre SELECT.
 *      These are the accessible baseline: tab-reachable, labelled, clickable.
 *   2. Rotational drag on the ring — pointer angle around the wheel centre,
 *      accumulated. A detent every TICK_DEG degrees fires sfx.tap(), so the
 *      wheel *clicks* like the real thing. A drag that travels far enough
 *      swallows the click it would otherwise land on a zone button.
 *   3. Keyboard on the region — arrows step, Esc/Backspace = MENU. Enter and
 *      Space are left alone so the focused <button> handles them natively.
 *
 * The parent decides what a turn MEANS (volume vs. list selection) via
 * `rotary`; the wheel only reports motion. */

const TICK_DEG = 24 // one detent — a click, and one list step
const TURN_DEG = 540 // 1.5 full turns sweeps a continuous control end to end
const DRAG_DEG = 5 // travel past this and the gesture is a scroll, not a tap

/* 8 spokes for the medieval wheel, on a 100×100 viewBox */
const HUB_R = 15
const RIM_R = 41
const SPOKES = Array.from({ length: 8 }, (_, i) => {
  const a = ((i * 45 - 90) * Math.PI) / 180
  return {
    x1: 50 + Math.cos(a) * HUB_R,
    y1: 50 + Math.sin(a) * HUB_R,
    x2: 50 + Math.cos(a) * RIM_R,
    y2: 50 + Math.sin(a) * RIM_R,
  }
})

type Props = {
  /** what a turn does: step through a list, or sweep a continuous control */
  rotary: 'detent' | 'continuous'
  /** one detent of travel (also what the arrow keys emit, in both modes) */
  onDetent: (dir: 1 | -1) => void
  /** continuous drag: `frac` is signed turn since the gesture started, 1 = full sweep */
  onTurn: (frac: number, phase: 'start' | 'move') => void
  onMenu: () => void
  onSelect: () => void
  onPrev: () => void
  onNext: () => void
  onPlayPause: () => void
  playing: boolean
}

export default function ClickWheel({
  rotary,
  onDetent,
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

  const drag = useRef<{ last: number; total: number; tick: number; detent: number } | null>(null)
  const moved = useRef(false)
  const spin = useRef(0)
  const teardown = useRef<(() => void) | null>(null)

  const reduced = useReducedMotion()

  // handlers change identity every render; the pointer loop reads them late
  const live = useRef({ rotary, onDetent, onTurn })
  live.current = { rotary, onDetent, onTurn }

  useEffect(() => () => teardown.current?.(), [])

  const polar = (cx: number, cy: number) => {
    const box = ringRef.current?.getBoundingClientRect()
    if (!box) return null
    const dx = cx - (box.left + box.width / 2)
    const dy = cy - (box.top + box.height / 2)
    return {
      deg: (Math.atan2(dy, dx) * 180) / Math.PI,
      r: Math.hypot(dx, dy) / (box.width / 2 || 1),
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const p = polar(e.clientX, e.clientY)
    // r is normalised so the rim is 1 and the SELECT disc (38% of the wheel)
    // ends at 0.38 — anything inside that, or outside the rim, isn't a turn
    if (!p || p.r < 0.42 || p.r > 1.04) return

    teardown.current?.() // a second pointer mid-gesture must not leak listeners
    moved.current = false
    drag.current = { last: p.deg, total: 0, tick: 0, detent: 0 }
    if (live.current.rotary === 'continuous') live.current.onTurn(0, 'start')

    const move = (ev: PointerEvent) => {
      const d = drag.current
      const q = polar(ev.clientX, ev.clientY)
      if (!d || !q) return
      let delta = q.deg - d.last
      if (delta > 180) delta -= 360
      else if (delta < -180) delta += 360
      d.last = q.deg
      d.total += delta
      d.tick += delta
      d.detent += delta
      if (Math.abs(d.total) > DRAG_DEG) moved.current = true

      // the click track — one blip per detent of travel, whatever the mode
      while (Math.abs(d.tick) >= TICK_DEG) {
        d.tick -= Math.sign(d.tick) * TICK_DEG
        sfx.tap()
      }

      // decorative only: the wooden wheel turns under your thumb
      spin.current += delta
      if (!reduced && spokeRef.current) {
        spokeRef.current.style.transform = `rotate(${spin.current}deg)`
      }

      if (live.current.rotary === 'continuous') {
        live.current.onTurn(d.total / TURN_DEG, 'move')
      } else {
        while (Math.abs(d.detent) >= TICK_DEG) {
          const dir: 1 | -1 = d.detent > 0 ? 1 : -1
          d.detent -= dir * TICK_DEG
          live.current.onDetent(dir)
        }
      }
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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      sfx.tap()
      onDetent(1)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      sfx.tap()
      onDetent(-1)
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault()
      sfx.tap()
      onMenu()
    }
  }

  const press = (fn: () => void) => () => {
    sfx.tap()
    fn()
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
        {/* medieval costume: a wooden spoke wheel. Hidden in every other skin
            by CSS, so no per-skin branch reaches the JS. */}
        <svg ref={spokeRef} className={styles.spokes} viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.spokeRim} cx="50" cy="50" r="46" />
          <circle className={styles.spokeRimInner} cx="50" cy="50" r="41" />
          {SPOKES.map((s, i) => (
            <line key={i} className={styles.spoke} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
          ))}
          <circle className={styles.spokeHub} cx="50" cy="50" r={HUB_R} />
          <circle className={styles.spokePin} cx="50" cy="50" r="4" />
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
