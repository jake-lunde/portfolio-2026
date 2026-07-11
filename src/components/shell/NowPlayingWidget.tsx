'use client'

import { useEffect, useState } from 'react'
import styles from './shell.module.css'

/* Desktop widget: the last track Jake played (Apple Music recent-played).
   Renders nothing until the Apple Music env vars are configured. */

type Track = {
  hasTrack: boolean
  title?: string
  artist?: string
  album?: string
  artworkUrl?: string
}

export function NowPlayingWidget() {
  const [track, setTrack] = useState<Track | null>(null)

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/now-playing')
        .then((r) => r.json())
        .then((d) => alive && setTrack(d))
        .catch(() => alive && setTrack(null))
    load()
    const t = setInterval(load, 90_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  if (!track?.hasTrack) return null

  return (
    <aside className={styles.npWidget} aria-label="Now playing">
      {track.artworkUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.artworkUrl}
          alt={`Album artwork: ${track.album ?? track.title}`}
          className={styles.npArt}
        />
      )}
      <div className={styles.npMeta}>
        <span className={styles.npLabel}>Now playing ♪</span>
        <span className={styles.npTitle}>{track.title}</span>
        <span className={styles.npArtist}>{track.artist}</span>
      </div>
    </aside>
  )
}
