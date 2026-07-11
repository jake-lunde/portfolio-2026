'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import styles from './shell.module.css'

/* Desktop widget: what Jake's playing (Apple Music recent-played), sized
   like a pinned polaroid. Click it and the card itself flies up close —
   same shared-element move as the photo wall; click anywhere to put it
   back. Renders nothing until the Apple Music env vars are configured. */

type Track = {
  hasTrack: boolean
  title?: string
  artist?: string
  album?: string
  artworkUrl?: string
}

export function NowPlayingWidget() {
  const [track, setTrack] = useState<Track | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const reduced = useReducedMotion()

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

  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoomed(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomed])

  if (!track?.hasTrack) return null

  const spring = reduced
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 28 }

  const card = (big: boolean) => (
    <>
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
        <span className={styles.npArtist} title={track.artist}>
          {track.artist}
        </span>
      </div>
    </>
  )

  return (
    <>
      {!zoomed && (
        <motion.button
          layoutId="np-card"
          type="button"
          className={styles.npWidget}
          onClick={() => setZoomed(true)}
          transition={spring}
          aria-label={`Now playing: ${track.title} by ${track.artist}. View closely.`}
        >
          {card(false)}
        </motion.button>
      )}

      <AnimatePresence>
        {zoomed && (
          <motion.div
            className={styles.photoZoom}
            onClick={() => setZoomed(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            role="dialog"
            aria-label="Now playing up close — click anywhere to put it back"
          >
            <motion.div
              layoutId="np-card"
              className={`${styles.npWidget} ${styles.npZoomed}`}
              transition={spring}
            >
              {card(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
