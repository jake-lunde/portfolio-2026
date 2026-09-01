'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* "The launch film" — Greenlight's official Family Hub spot.
   Official YouTube embed (nocookie flavor): muted, chromeless and
   pointer-inert inline — a plate, not a player — with an expand
   control that opens a lightbox with sound and controls. The iframe
   mounts only once the plate nears the viewport. The lightbox portals
   to <body>: the OS window is a transformed ancestor, so a
   position:fixed overlay inside it would anchor to the window, not
   the viewport.

   s134-r3 takes it out of the plate and puts it in a television. The
   spot is the only footage on the page that was made to be broadcast,
   so it plays on a set from the same parallel 1992 as the rest of the
   OS: near-black chassis, curved tube, a strip of controls under the
   glass, and the expand button living on the body where a real one
   would be.

   The signal is presentation only, and it has to be: this is a
   cross-origin iframe, not a local file, so the ntsc-rs bake the shelf
   films get (scripts/ntsc-bake.mjs) is off the table — nothing here
   can touch the pixels. `filter` does apply to an iframe as a whole
   box, though, so the chroma fringe is an SVG filter on the frame and
   the rest is leaves laid over it: the global .crt scanlines, a
   tracking band, the tube's own falloff and sheen.

   THE LIGHTBOX STAYS CLEAN. Sound on, controls on, no treatment — it
   is where you actually watch the film, and dressing it as tape would
   be dressing the work. */

const YT = 'G-tWcCCMdGE'
const TITLE = 'Greenlight Family Hub — launch film'

/* constant, not useId: case components are dynamic imports inside a
   tree that reshapes at SSR handover, and a generated id mismatches */
const FRINGE = 'lf-fringe'

export function LaunchFilm() {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const [near, setNear] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // the film starts only once the plate is genuinely on screen —
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

  // reduced motion: no silent auto-roll — the poster frame waits for the gesture
  const inlineSrc = `https://www.youtube-nocookie.com/embed/${YT}?autoplay=${reduced ? 0 : 1}&mute=1&controls=0&loop=1&playlist=${YT}&playsinline=1&rel=0`
  const fullSrc = `https://www.youtube-nocookie.com/embed/${YT}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0`

  return (
    <div className={styles.set} ref={ref}>
      {/* the composite's colour-under smear: red pulled one way, blue the
          other, green held. Off-screen but never display:none — a hidden
          filter subtree stops resolving in some engines. */}
      <svg className={styles.setFilterDefs} aria-hidden="true" focusable="false">
        <filter id={FRINGE} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx="-1.1" result="rOff" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx="1.1" result="bOff" />
          <feBlend in="rOff" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="bOff" mode="screen" />
        </filter>
      </svg>

      <div className={styles.setTube}>
        <div className={`${styles.setScreen} crt`}>
          {near ? (
            <iframe
              className={styles.setSignal}
              src={inlineSrc}
              title={TITLE}
              allow="autoplay; encrypted-media; picture-in-picture"
              style={{ filter: `url(#${FRINGE}) saturate(0.88) contrast(1.06)` }}
            />
          ) : (
            <span className={styles.setSnow} aria-hidden="true" />
          )}
          <span className={styles.setRoll} aria-hidden="true" />
          <span className={styles.setGlass} aria-hidden="true" />
          {/* the wink at the parallel 1992 — a channel badge burnt into
              the corner the way a set with no menu had to say it */}
          <span className={styles.setOsd} aria-hidden="true">
            CH 92
          </span>
        </div>
      </div>

      {/* the control strip: a knob, a run of vents, and the one button
          that does something */}
      <div className={styles.setStrip}>
        <span className={styles.setKnob} aria-hidden="true" />
        <span className={styles.setVents} aria-hidden="true" />
        <button
          type="button"
          className={styles.filmExpand}
          onClick={() => {
            sfx.open()
            setOpen(true)
          }}
        >
          Expand · sound on
        </button>
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
