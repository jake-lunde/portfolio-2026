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

   s134-r2 makes that turn the fidelity switch. One instance, one
   video, never a visible seek: Build faces the left screen, Fix faces
   the laptop, and a flip is answered by letting the film run until it
   turns him — real footage every time. It treads water inside the
   matching stretch meanwhile, which keeps the rain and the steam
   alive without walking the pose off.

   The film is decorative and aria-hidden; the mono readout under it
   carries the change. Reduced motion and any autoplay refusal hold the
   poster frame instead (CoverFilm's pattern: the film fades in on its
   first painted frame, and a failure never paints broken-media
   furniture). */

const FILM = '/case/family-hub/live-audit.mp4'
const POSTER = '/case/family-hub/live-audit-poster.webp'

/* Where he is looking, read off the film frame by frame (ffmpeg, 24fps,
   5.04s — one turn out and one turn back per loop, not two). He faces
   LEFT from 3.82 through the wrap to 1.45, turns 1.45–1.62, faces RIGHT
   to 3.60, turns back 3.60–3.82.

   Per side: [tread start, tread end, last moment still facing this way].
   The tread pair sits a beat inside the real stretch so a coarse
   timeupdate (~4/s) can't sail past it; the third number is the turn's
   own start, and a seek is only ever allowed before it — so the jump is
   always from this side to this side, never a cut across the turn. The
   trailing LEFT stretch is left alone: he is already facing the screen
   there, and the loop's natural wrap carries him into the window. */
const FACING = {
  draft: [0.05, 1.15, 1.4],
  shipped: [1.7, 3.3, 3.55],
} as const

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

  /* mount on first sight, then run only while visible: the element
     survives scrolling away, so his pose does too */
  useEffect(() => {
    const el = box.current
    if (!el || reduced) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          film.current?.play().catch(() => {})
        } else film.current?.pause()
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

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
            autoPlay
            playsInline
            preload="auto"
            onPlaying={() => setClear(true)}
            onTimeUpdate={(e) => {
              const el = e.currentTarget
              const [from, to, until] = FACING[mode]
              /* past the tread window but still on this side: fall back
                 and hold. Anywhere else, let it run — the turn is the
                 only honest way across. */
              if (el.currentTime > to && el.currentTime < until) el.currentTime = from
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
