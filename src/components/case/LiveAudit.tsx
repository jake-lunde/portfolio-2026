'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useFidelity } from './fidelity'
import styles from './case.module.css'

/* §06 live-audit centerpiece, the film cut. The scene started as an
   in-repo 128x64 ASCII pixel plate (the git history of PR #78 holds
   it); Jake fed that render and his refs to Midjourney and refined
   the result into a 5s ambient loop: rain on the window, steam off
   the mug, him turning between the screen on his left and the laptop
   on his right.

   s134-r3 makes the film a still that only moves to answer the switch.
   It parks frozen on a facing — Build looking at the screen, Fix
   looking at the laptop — and a flip plays it just far enough to turn
   him, then stops. s134-r2's treading is gone: holding a pose by
   looping a short stretch put a seam in the rain every lap, and Jake
   read the seam, not the pose ("the looping just isn't working").
   Frozen rain is a photograph; stuttering rain is a bug.

   The film is decorative and aria-hidden; the mono readout under it
   carries the change. Reduced motion and any autoplay refusal hold the
   poster frame instead (CoverFilm's pattern: the film fades in on its
   first painted frame, and a failure never paints broken-media
   furniture). The poster is a left-facing frame, so reduced motion
   reads as Build and simply never answers the switch. */

const FILM = '/case/family-hub/live-audit.mp4'
const POSTER = '/case/family-hub/live-audit-poster.webp'

/* Where he is looking, read off the film frame by frame (ffmpeg, 24fps,
   5.04s — one turn out and one turn back per loop, not two). He faces
   LEFT from 3.82 through the wrap to 1.45, turns 1.45–1.62, faces RIGHT
   to 3.60, turns back 3.60–3.82.

   The stretches below are those minus a safety margin at each turn.
   They are wide — LEFT is most of the loop, RIGHT is 1.85s — which is
   the whole reason the freeze model is steadier than the treading it
   replaced: a ~250ms timeupdate cadence could sail through r2's tight
   catch window, but it cannot miss a stop this size. LEFT is two
   ranges because the loop wraps inside it, and `loop` stays on for the
   same reason: a flip out of the late-left stretch crosses the wrap to
   reach the turn, and native looping is the only seamless way over. */
const FACES = {
  draft: (t: number) => t < 1.4 || t >= 3.85,
  shipped: (t: number) => t >= 1.7 && t <= 3.55,
}

/* where to sit when the pose has to be assumed rather than played —
   first paint, and any flip the reader wasn't watching */
const PARK = { draft: 0.4, shipped: 2.6 }

const READOUT = {
  draft: 'feat: add Assistant type tokens [WEB-3877]',
  shipped: 'feat: add avatar prop to CheckListItem [WEB-4121]',
}

export function LiveAudit() {
  const mode = useFidelity((s) => s.mode)
  const reduced = useReducedMotion()
  const box = useRef<HTMLSpanElement>(null)
  const film = useRef<HTMLVideoElement>(null)
  /** the plate has been on screen once — until then no video is mounted */
  const [near, setNear] = useState(false)
  /** the film has painted a frame — until then the poster is the face */
  const [clear, setClear] = useState(false)
  /** on screen right now: only a flip the reader can see gets played */
  const onScreen = useRef(false)
  /** metadata is in and the film is sitting on a facing */
  const parked = useRef(false)
  const modeRef = useRef(mode)
  modeRef.current = mode

  /* mount on first sight, then track visibility: the element survives
     scrolling away, so his pose does too. Nothing plays on re-entry —
     the film is a still until the switch asks it to move. */
  useEffect(() => {
    const el = box.current
    if (!el || reduced) return
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen.current = e.isIntersecting
        if (e.isIntersecting) return setNear(true)
        /* scrolled off mid-turn: stop and take the pose outright,
           nobody is watching the cut */
        const v = film.current
        if (!v) return
        v.pause()
        if (!FACES[modeRef.current](v.currentTime)) v.currentTime = PARK[modeRef.current]
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  /* the flip. On screen, he turns on real footage: play, and the
     timeupdate below stops him the moment he is facing the right way.
     Off screen, the pose is simply set — an invisible seek beats
     animating to an empty room. */
  useEffect(() => {
    const el = film.current
    if (!el || reduced || !parked.current) return
    if (FACES[mode](el.currentTime)) return
    if (onScreen.current) el.play().catch(() => {})
    else el.currentTime = PARK[mode]
  }, [mode, reduced, near])

  return (
    <div className={styles.audit}>
      <span className={styles.auditFilm} ref={box} aria-hidden="true">
        <img src={POSTER} alt="" width={864} height={432} />
        {near && !reduced && (
          <video
            data-clear={clear ? '' : undefined}
            ref={film}
            src={FILM}
            muted
            loop
            playsInline
            preload="auto"
            /* no autoPlay: the film arrives parked. A pose that predates
               the reader is assumed, never performed. */
            onLoadedMetadata={(e) => {
              const el = e.currentTarget
              if (!FACES[mode](el.currentTime)) el.currentTime = PARK[mode]
              parked.current = true
            }}
            /* paused video never fires onPlaying, so the reveal rides the
               first paintable frame instead */
            onLoadedData={() => setClear(true)}
            onTimeUpdate={(e) => {
              const el = e.currentTarget
              if (FACES[mode](el.currentTime)) el.pause()
            }}
          />
        )}
      </span>
      {/* keyed so the type-on replays on every flip — it used to restart
          because the fidelity panes swapped this whole subtree out */}
      <p className={styles.auditReadout} key={mode}>
        <span className={styles.auditTick} aria-hidden="true">▸ </span>
        {READOUT[mode]}
      </p>
    </div>
  )
}
