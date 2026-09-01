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
   the viewport. */

const YT = 'G-tWcCCMdGE'
const TITLE = 'Greenlight Family Hub — launch film'

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
    <div className={styles.film} ref={ref}>
      {near && (
        <iframe
          src={inlineSrc}
          title={TITLE}
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      )}
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
