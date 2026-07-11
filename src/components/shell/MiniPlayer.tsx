'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useStudio } from '@/lib/studioPlayer'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import styles from './shell.module.css'

/* Compact transport for the desktop — Studio's audio engine (lib/studio
   Player) keeps humming after the window closes; this is its face when
   there's no window to show it in. Appears once a track has started
   (playing, or paused mid-track) and the Studio window isn't open;
   opening Studio hides it, closing Studio again brings it back. */

export function MiniPlayer() {
  const tracks = useStudio((s) => s.tracks)
  const index = useStudio((s) => s.index)
  const playing = useStudio((s) => s.playing)
  const time = useStudio((s) => s.time)
  const pause = useStudio((s) => s.pause)
  const toggle = useStudio((s) => s.toggle)
  const next = useStudio((s) => s.next)
  const prev = useStudio((s) => s.prev)

  const studioOpen = useWindows((s) => s.windows.some((w) => w.id === 'studio'))
  const reduced = useReducedMotion()

  // "closed" is a local dismissal, independent of playback state, so ×
  // sticks until a new track starts or the Studio window round-trips
  const [dismissed, setDismissed] = useState(false)
  const lastIndex = useRef(index)
  const wasStudioOpen = useRef(studioOpen)

  useEffect(() => {
    if (index !== lastIndex.current) {
      lastIndex.current = index
      setDismissed(false)
    }
  }, [index])

  useEffect(() => {
    if (wasStudioOpen.current && !studioOpen) setDismissed(false)
    wasStudioOpen.current = studioOpen
  }, [studioOpen])

  const current = tracks[index]
  const started = playing || time > 0
  const visible = Boolean(current) && started && !studioOpen && !dismissed

  const onClose = () => {
    pause()
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.aside
          className={styles.miniPlayer}
          aria-label="Studio mini player"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        >
          {current.art && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.art} alt="" className={styles.miniArt} aria-hidden="true" />
          )}
          <span className={styles.miniTitle}>{current.title}</span>
          <div className={styles.miniControls}>
            <button
              className={styles.miniBtn}
              aria-label="Previous track"
              onClick={() => {
                sfx.tap()
                prev()
              }}
            >
              ◁
            </button>
            <button
              className={styles.miniBtn}
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={() => {
                sfx.tap()
                toggle()
              }}
            >
              {playing ? '❚❚' : '▷'}
            </button>
            <button
              className={styles.miniBtn}
              aria-label="Next track"
              onClick={() => {
                sfx.tap()
                next()
              }}
            >
              ▷|
            </button>
            <button className={styles.miniBtn} aria-label="Close mini player" onClick={onClose}>
              ×
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
