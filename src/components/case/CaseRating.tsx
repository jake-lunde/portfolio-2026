'use client'

import { useEffect, useState } from 'react'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* RATE THIS CASE — five stars at the foot of a case study, over
   /api/rating. One voter, one vote: the server keys on a hashed IP and a
   second press replaces the first, so nothing here has to police anybody.

   THE AGGREGATE STAYS SHUT until the reader has pressed a star. A number
   printed above an empty row of stars is an instruction, and the point of
   asking is to find out what the reader thinks, not what the last twelve
   people thought.

   Everything is instant. Hover fills up to the star under the cursor and
   leaving the row puts it back — no tween, the same rule the index rail
   works to (1992 menus didn't ease). Nothing animates, so reduced motion
   needs no branch. If the network is down the stars still press and the
   readout simply never appears. */

const STAR_ROWS: [y: number, x: number, w: number][] = [
  [0, 6, 1],
  [1, 5, 3],
  [2, 5, 3],
  [3, 4, 5],
  [4, 0, 13],
  [5, 1, 11],
  [6, 2, 9],
  [7, 3, 7],
  [8, 3, 7],
  [9, 2, 4],
  [9, 7, 4],
  [10, 2, 3],
  [10, 8, 3],
  [11, 1, 3],
  [11, 9, 3],
  [12, 1, 2],
  [12, 10, 2],
]

const STARS = [1, 2, 3, 4, 5]

/* Drawn on a 13×13 grid — odd, so the star has a centre column to point
   from — and printed at an exact 2× in CSS so every pixel stays whole.
   crispEdges keeps the renderer from feathering the steps. */
function Star({ lit }: { lit: boolean }) {
  return (
    <svg
      className={styles.ratingGlyph}
      data-lit={lit ? '1' : undefined}
      viewBox="0 0 13 13"
      aria-hidden="true"
      focusable="false"
    >
      {STAR_ROWS.map(([y, x, w]) => (
        <rect key={`${y}-${x}`} x={x} y={y} width={w} height={1} />
      ))}
    </svg>
  )
}

export function CaseRating({ slug }: { slug: string }) {
  const skin = useSettings((s) => s.skin)
  const [mine, setMine] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [agg, setAgg] = useState<{ avg: number; count: number } | null>(null)

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(`lunde-os:rating:${slug}`))
      if (Number.isInteger(saved) && saved >= 1 && saved <= 5) setMine(saved)
    } catch {
      /* private mode, blocked storage — the stars work without it */
    }
    let live = true
    fetch(`/api/rating?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live && d && typeof d.count === 'number') setAgg({ avg: d.avg, count: d.count })
      })
      .catch(() => {
        /* no readout, no complaint */
      })
    return () => {
      live = false
    }
  }, [slug])

  function vote(stars: number) {
    sfx.tap()
    setMine(stars)
    try {
      localStorage.setItem(`lunde-os:rating:${slug}`, String(stars))
    } catch {
      /* the vote still reaches the server */
    }
    fetch('/api/rating', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, stars }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.count === 'number') setAgg({ avg: d.avg, count: d.count })
      })
      .catch(() => {
        /* no readout, no complaint */
      })
  }

  const filled = hover ?? mine ?? 0
  const voted = mine !== null
  const readout =
    voted && agg && agg.count > 0
      ? `${agg.avg.toFixed(1)} · ${agg.count} ${t(agg.count === 1 ? 'case.rating.one' : 'case.rating.many', skin)}`
      : null

  return (
    <div className={styles.rating}>
      <span className={styles.ratingLabel} data-copy-id={voted ? 'case.rating.thanks' : 'case.rating.label'}>
        {t(voted ? 'case.rating.thanks' : 'case.rating.label', skin)}
      </span>
      <div
        className={styles.ratingStars}
        role="group"
        aria-label={t('case.rating.aria', skin)}
        onMouseLeave={() => setHover(null)}
      >
        {STARS.map((n) => (
          <button
            key={n}
            type="button"
            className={styles.ratingStar}
            aria-label={`${t('case.rating.rate', skin)} ${n} ${t('case.rating.star', skin)}`}
            aria-pressed={mine === n}
            onMouseEnter={() => setHover(n)}
            onClick={() => vote(n)}
          >
            <Star lit={n <= filled} />
          </button>
        ))}
      </div>
      {readout ? <span className={styles.ratingCount}>{readout}</span> : null}
    </div>
  )
}
