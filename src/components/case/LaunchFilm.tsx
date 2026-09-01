'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* "The launch film" — Greenlight's official Family Hub spot, playing on
   a television. s134-r3 built the set; s134-r4 fixed what was inside it.

   The inline face used to be the YouTube embed dressed in a CSS/SVG
   approximation of tape: a chroma-fringe filter on the iframe, the
   global .crt scanlines, a tracking band. All of it is gone, and the
   reason is the one CoverFilm.tsx already wrote down for the shelf
   (s52 → s75): the artifacts belong IN the file. box-film.mp4 is this
   same spot run through ntsc-rs (scripts/ntsc-bake.mjs) for the shelf's
   cover, so the dub already exists — the inline face is a native
   <video> pointing at it, one file serving two surfaces. Overlaying
   fake artifacts on a real dub would only double the medium.

   What stays is the television: the tube's falloff, the corner sheen,
   the channel badge. That is the set, not the tape.

   The face underneath is snow, and it is a real poster, not a loader.
   The film fades in over it on its first painted frame (data-clear,
   CoverFilm's gate) and the snow simply stays if autoplay is refused or
   motion is reduced — a failure never paints broken-media furniture.

   THE LIGHTBOX STAYS CLEAN. The whole set is the button now; pressing
   it portals the untreated YouTube embed with sound and controls to
   <body> (the OS window is a transformed ancestor, so a position:fixed
   overlay inside it would anchor to the window, not the viewport).
   That is where you actually watch the film, and dressing it as tape
   would be dressing the work. */

const YT = 'G-tWcCCMdGE'
const TITLE = 'Greenlight Family Hub — launch film'

/* the shelf's dub, reused whole — see cases.ts, which points the
   family-hub box at this same path */
const FILM = '/case/family-hub/box-film.mp4'

export function LaunchFilm() {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const [near, setNear] = useState(false)
  const [open, setOpen] = useState(false)
  /** the film has painted a frame — until then the snow is the face */
  const [clear, setClear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // the film starts only once the set is genuinely on screen —
    // not on approach (Jake's call: no silent playback out of view)
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), {
      threshold: 0.35,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const fullSrc = `https://www.youtube-nocookie.com/embed/${YT}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0`

  return (
    <div className={styles.set} ref={ref}>
      <button
        type="button"
        className={styles.setTube}
        aria-label="Play the launch film with sound"
        onClick={() => {
          sfx.open()
          setOpen(true)
        }}
      >
        <span className={styles.setScreen}>
          {/* the face: snow until the film paints, and permanently if it
              never does. A 4:3 tube on 16:9 footage — the picture is
              cropped to the glass, the way a set always did it. */}
          <span className={styles.setSnow} aria-hidden="true" />
          {near && !reduced && (
            <video
              className={styles.setSignal}
              data-clear={clear ? '' : undefined}
              src={FILM}
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
              disablePictureInPicture
              tabIndex={-1}
              aria-hidden="true"
              onPlaying={() => setClear(true)}
            />
          )}
          <span className={styles.setGlass} aria-hidden="true" />
          {/* the wink at the parallel 1992 — a channel badge burnt into
              the corner the way a set with no menu had to say it */}
          <span className={styles.setOsd} aria-hidden="true">
            CH 92
          </span>
        </span>
      </button>

      {/* the control strip: two knobs and a run of speaker slits, all of
          it moulding — the glass above is the only control that works */}
      <div className={styles.setStrip} aria-hidden="true">
        <span className={styles.setKnob} />
        <span className={styles.setKnob} data-small="" />
        <span className={styles.setVents} />
      </div>

      {open &&
        createPortal(
          <div
            className={styles.filmModal}
            role="dialog"
            aria-modal="true"
            aria-label={TITLE}
            onClick={() => setOpen(false)}
          >
            <div className={styles.filmFrame} onClick={(e) => e.stopPropagation()}>
              <iframe
                src={fullSrc}
                title={TITLE}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
            <button
              ref={closeRef}
              type="button"
              className={styles.filmClose}
              aria-label="Close the film"
              onClick={() => {
                sfx.close()
                setOpen(false)
              }}
            >
              ×
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
