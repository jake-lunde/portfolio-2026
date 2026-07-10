'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import data from './scrobbles-data.json'
import styles from './viz.module.css'

/* Last.fm year in listening — weekly scrobble bars (the frequency-bar
   motif), ranked artists with genre tags, lofi album artwork on hover.
   The trailing zero-weeks are the APPLE ERA: last.fm scrobbling stopped
   and Apple's API has no timestamps (max ~50 recent plays, unordered) —
   so those weeks render as a hollow blue carrier band, magnitude
   honestly unknown, with the recent-plays snapshot noted below. */

type AppleEra = {
  baked: string
  gapFrom: number
  sampled: number
  artists: { name: string; plays: number }[]
}

const apple: AppleEra | null = (data as { apple?: AppleEra }).apple ?? null

const W = 640
const H = 120

const fmtWeek = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()

export function ScrobblesViz() {
  const reduced = useReducedMotion()
  const [week, setWeek] = useState<number | null>(null)
  const [artist, setArtist] = useState<string | null>(null)

  const weeks = data.weeks as { from: number; plays: number }[]
  const maxPlays = useMemo(() => Math.max(...weeks.map((w) => w.plays), 1), [weeks])
  const peakIdx = useMemo(() => weeks.findIndex((w) => w.plays === maxPlays), [weeks, maxPlays])
  const maxArtist = Math.max(...(data.artists as { plays: number }[]).map((a) => a.plays), 1)

  const art = artist
    ? (data.art as { artist: string; album: string; img: string }[]).find(
        (a) => a.artist.toLowerCase() === artist.toLowerCase() && a.img
      )
    : null

  const barW = W / weeks.length

  const scrub = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const i = Math.max(
      0,
      Math.min(weeks.length - 1, Math.floor(((e.clientX - rect.left) / rect.width) * weeks.length))
    )
    if (i !== week) {
      setWeek(i)
      sfx.tap()
    }
  }

  return (
    <div>
      <div className={styles.rideHead}>
        <h3 className={styles.rideTitle}>“a year of listening”</h3>
        <span className={styles.rideSub}>
          LAST.FM / {data.user.toUpperCase()} · {data.totalYear.toLocaleString()} SCROBBLES · BAKED {data.baked}
        </span>
      </div>

      <div className={styles.panel}>
        <span className={styles.panelLabel}>
          {week !== null
            ? apple && week >= apple.gapFrom
              ? `WEEK OF ${fmtWeek(weeks[week].from)} — APPLE ERA · UNCOUNTED`
              : `WEEK OF ${fmtWeek(weeks[week].from)} — ${weeks[week].plays} PLAYS`
            : 'Layer 01 · Scrobbles / week — hover to scrub'}
        </span>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ height: 110 }}
          role="img"
          aria-label={`Weekly scrobbles over the last year, peaking at ${maxPlays} plays.`}
          onPointerMove={scrub}
          onPointerLeave={() => setWeek(null)}
        >
          {weeks.map((w, i) => {
            const isAppleEra = apple !== null && i >= apple.gapFrom
            if (isAppleEra) {
              // carrier band: signal present, magnitude unknowable
              const bandH = (H - 26) * 0.32
              return (
                <motion.rect
                  key={w.from}
                  x={i * barW + 1.5}
                  y={H - 8 - bandH}
                  width={barW - 3}
                  height={bandH}
                  fill="none"
                  stroke="var(--blue)"
                  strokeWidth="1"
                  strokeDasharray="3 2"
                  opacity={i === week ? 1 : 0.55}
                  initial={reduced ? undefined : { opacity: 0 }}
                  whileInView={reduced ? undefined : { opacity: i === week ? 1 : 0.55 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.012 }}
                />
              )
            }
            const h = Math.max(2, (w.plays / maxPlays) * (H - 26))
            const hot = i === week || i === peakIdx
            return (
              <motion.rect
                key={w.from}
                x={i * barW + 1.5}
                y={H - 8 - h}
                width={barW - 3}
                height={h}
                fill={hot ? 'var(--pink)' : '#E7E1D2'}
                opacity={hot ? 1 : 0.3}
                style={{ originY: '100%', transformBox: 'fill-box' }}
                initial={reduced ? undefined : { scaleY: 0 }}
                whileInView={reduced ? undefined : { scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.012, ease: [0.16, 1, 0.3, 1] }}
              />
            )
          })}
        </svg>
      </div>

      {apple && (
        <p className={styles.appleEra}>
          <span aria-hidden="true">▥</span> LAST.FM SIGNAL ENDS{' '}
          {fmtWeek(weeks[apple.gapFrom]?.from ?? weeks[weeks.length - 1].from)} · APPLE ERA — LAST{' '}
          {apple.sampled} PLAYS: {apple.artists.slice(0, 3).map((a) => a.name.toUpperCase()).join(' · ')}{' '}
          (APPLE&rsquo;S API KEEPS NO DATES)
        </p>
      )}

      <div className={styles.scrobCols}>
        <div className={styles.artistList} role="list" aria-label="Top artists, past 12 months">
          {(data.artists as { name: string; plays: number; genre: string }[]).map((a, i) => (
            <div
              key={a.name}
              role="listitem"
              className={styles.artistRow}
              data-active={artist === a.name || undefined}
              onPointerEnter={() => setArtist(a.name)}
              onPointerLeave={() => setArtist(null)}
            >
              <span className={styles.artistRank}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.artistName}>{a.name}</span>
              <span className={styles.artistGenre}>{a.genre}</span>
              <span className={styles.artistBarWrap}>
                <span
                  className={styles.artistBar}
                  style={{ width: `${(a.plays / maxArtist) * 100}%` }}
                />
              </span>
              <span className={styles.artistPlays}>{a.plays}</span>
            </div>
          ))}
        </div>

        <div className={styles.artPanel} aria-hidden="true">
          {art ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art.img} alt="" className={styles.artImg} />
              <span className={styles.artCap}>
                {art.album} — {art.artist}
              </span>
            </>
          ) : (
            <span className={styles.artIdle}>HOVER AN ARTIST<br />FOR THE ARTWORK</span>
          )}
        </div>
      </div>
    </div>
  )
}
