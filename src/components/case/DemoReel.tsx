'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import styles from './case.module.css'

/* A prototype recording inside a plate — the rail's old demo stages
   (s36), now living in FidelityFrame panes. Muted, chromeless and
   loop-rolling: a plate, not a player. preload="none" + the poster
   (the recording's own first frame) means nothing downloads until the
   reel is actually on screen; an IntersectionObserver starts and stops
   it, which also covers the hidden fidelity pane (display:none never
   intersects). Reduced motion gets the still frame and no roll. */

const DIR = '/case/family-hub/evo'

export function DemoReel({
  video,
  poster,
  alt,
  mat,
  frame,
}: {
  /** basename in evo/ — demo-poc, demo-hifi (mp4 + webm pairs) */
  video: string
  poster: string
  alt: string
  /** 'light' for recordings on paper-white — the surround matches the
      footage's corners (rail law); default stays the dark reels' #000 */
  mat?: 'light'
  /** 'phone' seats a portrait screen recording in a device-black
      bezel, centered on the plate (the avatar plate's picker) */
  frame?: 'phone'
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  const reel = (
    <video
      ref={ref}
      className={frame === 'phone' ? styles.demoReelPhone : styles.demoReel}
      style={mat === 'light' ? { background: '#fdfdfd' } : undefined}
      poster={`${DIR}/${poster}`}
      muted
      loop
      playsInline
      preload="none"
      aria-label={alt}
    >
      <source src={`${DIR}/${video}.mp4`} type="video/mp4" />
      <source src={`${DIR}/${video}.webm`} type="video/webm" />
    </video>
  )
  return frame === 'phone' ? <div className={styles.phoneShell}>{reel}</div> : reel
}
