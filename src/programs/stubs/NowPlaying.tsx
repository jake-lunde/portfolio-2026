'use client'

import { useEffect, useState } from 'react'
import { UnderConstruction } from '@/components/primitives/UnderConstruction'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText as Copy } from '@/content/CopyText'
import styles from '../programs.module.css'

/* Now Playing — the last track played on Apple Music (recent-played API;
   Apple exposes history, not live state). Falls back to the construction
   plate until the Apple Music env vars are configured. */

type Track = {
  hasTrack: boolean
  title?: string
  artist?: string
  album?: string
  artworkUrl?: string
  appleMusicUrl?: string
}

export default function NowPlaying() {
  const [track, setTrack] = useState<Track | null | 'loading'>('loading')
  const skin = useSettings((s) => s.skin)

  useEffect(() => {
    fetch('/api/now-playing')
      .then((r) => r.json())
      .then(setTrack)
      .catch(() => setTrack(null))
  }, [])

  if (track === 'loading') {
    return <Copy k="now-playing.loading" as="p" className={styles.npLoading} />
  }

  if (!track?.hasTrack) {
    return <UnderConstruction note={t('now-playing.underConstruction', skin)} />
  }

  return (
    <div className={styles.npWindow}>
      {track.artworkUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.artworkUrl}
          alt={`Album artwork: ${track.album ?? track.title}`}
          className={styles.npWindowArt}
        />
      )}
      <Copy k="now-playing.lastPlayed" as="p" className={styles.npWindowLabel} />
      <h2 className={styles.npWindowTitle}>{track.title}</h2>
      <p className={styles.npWindowArtist}>
        {track.artist} — {track.album}
      </p>
      {track.appleMusicUrl && (
        <a href={track.appleMusicUrl} target="_blank" rel="noreferrer" className={styles.npWindowLink}>
          <Copy k="now-playing.openLink" as="span" />
        </a>
      )}
    </div>
  )
}
