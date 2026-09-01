'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* "The launch film" — Greenlight's official Family Hub spot, playing on
   a television.

   s134-r5: the set stopped being drawn and became a photograph. The CSS
   chassis retires exactly the way the CSS tape did in r4 — a moulded
   shell, a recessed tube, dials, a speaker grille and feet, all of it
   approximating an object Jake could just photograph. tv.webp is his
   render, cut out with alpha, and it brings its own stand, its own
   grille, its own dead green tube. Nothing here paints a television any
   more; it positions one.

   Three layers in the glass:
     1. the photo's own dead screen, which is the idle face. The synthetic
        snow is gone with the chassis — a burnt phosphor tube is a better
        poster than generated noise, and it is what a reduced-motion
        reader keeps.
     2. the film, seated inside the measured glass rect and fading in on
        its first painted frame (data-clear, CoverFilm's gate). It is
        box-film.mp4 — the same spot already run through ntsc-rs for the
        shelf's cover (r4), so the artifacts stay in the footage.
     3. tv-glass.webp, the glass region of the photo cropped and laid back
        over the film on `screen`. The dark glass adds nothing under that
        blend and the window reflection and phosphor streaks ride over the
        picture, so the film reads as something behind glass rather than
        something pasted into a hole.

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
const TV_GLASS = '/case/family-hub/tv-glass.webp'

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
        {/* the set itself. Empty alt: the button above carries the
            semantics, and the photograph is furniture. */}
        <img
          className={styles.setBody}
          src={TV}
          alt=""
          width={1024}
          height={1024}
          draggable={false}
        />
        <span className={styles.setGlass}>
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
          {/* the glass put back on top. It rides in with the film and
              never before it: with no film under it this would only be
              screening the photo's reflection over itself. */}
          <img
            className={styles.setSheen}
            data-clear={clear ? '' : undefined}
            src={TV_GLASS}
            alt=""
            width={685}
            height={555}
            draggable={false}
            aria-hidden="true"
          />
          {/* the wink at the parallel 1992 — a channel badge burnt into
              the corner the way a set with no menu had to say it */}
          <span className={styles.setOsd} aria-hidden="true">
            CH 92
          </span>
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
