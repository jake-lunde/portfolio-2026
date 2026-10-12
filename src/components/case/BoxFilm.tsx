'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { getCase } from '@/programs/projects/cases'
import styles from './case.module.css'

/* The box's film at the foot of the case: the same cover film the shelf
   plays (the case's `box.video`), run full width of the column between
   the last section's pull quote and the footer's stars, so the read ends
   on the box it started from. It reads its film and poster from the
   case's CASES entry, so it never carries a path of its own.

   It follows DemoReel: muted, looping, playsInline, preload="none"
   behind the poster (the box art), and an IntersectionObserver plays it
   at ~40% in view and pauses it on the way out. At the foot of a long
   page it is never on screen at load, so nothing downloads until the
   reader gets there. Reduced motion gets the poster as a still image
   and no film at all.

   aria-hidden: it is the same film the shelf shows, wordless, and the
   prose around it carries the words.

   The frame is the FILM's 16:9 (box-film.mp4 is 854×480), not the art's
   2.10:1: the art is the poster, and it gives up a sliver either side
   under object-fit cover, the same trade the shelf's 16:9 plate makes
   with it. A frame cut to the art would crop the film instead. */

const FILM_RATIO = '16 / 9'

export function BoxFilm({ slug }: { slug: string }) {
  const box = getCase(slug)?.box
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
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  if (!box?.video || !box.art) return null
  const { art, video } = box

  return (
    <div className={styles.boxFilm} style={{ aspectRatio: FILM_RATIO }} aria-hidden="true">
      {reduced ?
        <img src={art.src} alt="" width={art.w} height={art.h} loading="lazy" draggable={false} />
      : <video ref={ref} src={video} poster={art.src} muted loop playsInline preload="none" tabIndex={-1} />}
    </div>
  )
}
