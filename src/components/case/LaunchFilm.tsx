'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* "The launch film" — Greenlight's official Family Hub spot, playing on
   a television.

   s134-r6: Jake swapped the set. It is now a product photograph with
   the tube already cut — the screen is a transparent hole in the
   alpha — and that inverts everything r5 built. The film goes BEHIND
   the glass instead of on top of it, and the bezel crops it for free.
   No mask, no radius on the video, no reflection: tv-glass.webp and the
   `screen` blend it rode in on are retired with r5, because there is no
   longer a photographed pane to lay back over the picture.

   Four layers, stacked instead of composited:
     1. the dead tube, painted, filling the hole. It is the idle and
        reduced-motion face — an off television — and without it the
        page shows straight through the cutout. r5's photograph carried
        a lit tube of its own; this one carries nothing.
     2. the film, seated in the hole with a hair of bleed past every
        edge so no page pixel can peek between it and the bezel. Still
        box-film.mp4 — the spot already run through ntsc-rs for the
        shelf's cover (r4), so the artifacts stay in the footage — and
        still fading in on its first painted frame (data-clear,
        CoverFilm's gate).
     3. the photograph, over both. Its alpha is the mask.
     4. a static sheen inside the glass, and the channel badge, over the
        photograph so nothing eats them.

   The whole set is the button (r4's interaction, unchanged): zoom-in on
   the way in, zoom-out on the lightbox, and the lightbox itself stays
   the clean YouTube embed with sound and controls. That is where you
   actually watch the film. */

const YT = 'G-tWcCCMdGE'
const TITLE = 'Greenlight Family Hub — launch film'

/* the shelf's dub, reused whole — see cases.ts, which points the
   family-hub box at this same path */
const FILM = '/case/family-hub/box-film.mp4'
const TV = '/case/family-hub/tv.webp'

export function LaunchFilm() {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const [near, setNear] = useState(false)
  const [open, setOpen] = useState(false)
  /** the film has painted a frame — until then the dead tube is the face */
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
        className={styles.setBtn}
        aria-label="Play the launch film with sound"
        onClick={() => {
          sfx.open()
          setOpen(true)
        }}
      >
        {/* the dead tube, backing the cutout. First in the stack and
            never conditional: it is what the hole shows when the film
            is not running, and reduced motion keeps it for good. */}
        <span className={styles.setTube} aria-hidden="true" />
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
        {/* the set itself, over the film — the alpha does the cropping.
            Empty alt: the button above carries the semantics, and the
            photograph is furniture. */}
        <img
          className={styles.setBody}
          src={TV}
          alt=""
          width={1100}
          height={1039}
          draggable={false}
        />
        {/* the glass, drawn rather than photographed this time: one
            diagonal, faint, always on. It is the only thing left saying
            there is a pane in front of the picture. */}
        <span className={styles.setSheen} aria-hidden="true" />
        {/* the wink at the parallel 1992 — a channel badge burnt into
            the corner the way a set with no menu had to say it */}
        <span className={styles.setOsd} aria-hidden="true">
          CH 92
        </span>
      </button>

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
