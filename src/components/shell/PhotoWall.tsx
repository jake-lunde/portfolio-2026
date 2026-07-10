'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import styles from './shell.module.css'

/* The wall — the last 3 Photo Booth snaps the visitor pinned, taped to
   the right edge of the desktop. Stored in localStorage (per-browser,
   private — nobody's face touches a server). Newest first; a 4th pin
   pushes out the oldest. Photo Booth writes the key and fires
   'lunde:booth-wall'; this listens. */

export const WALL_KEY = 'lunde-booth-wall'
export const WALL_MAX = 3

/* Jake's own booth snap ships as the wall's founding pin — removable,
   and remembered if dismissed */
const DEFAULT_PHOTO = '/booth/jake-default.jpg'
const DISMISS_KEY = 'lunde-booth-default-dismissed'

function readWall(): string[] {
  try {
    const raw = localStorage.getItem(WALL_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.slice(0, WALL_MAX) : []
  } catch {
    return []
  }
}

export function PhotoWall() {
  const [photos, setPhotos] = useState<string[]>([])
  const reduced = useReducedMotion()

  useEffect(() => {
    setPhotos(readWall())
    const sync = () => setPhotos(readWall())
    window.addEventListener('lunde:booth-wall', sync)
    window.addEventListener('storage', sync) // other tabs
    return () => {
      window.removeEventListener('lunde:booth-wall', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const [defaultDismissed, setDefaultDismissed] = useState(true)
  useEffect(() => {
    try {
      setDefaultDismissed(localStorage.getItem(DISMISS_KEY) === '1')
    } catch {}
  }, [])

  const remove = (photo: string) => {
    if (photo === DEFAULT_PHOTO) {
      try {
        localStorage.setItem(DISMISS_KEY, '1')
      } catch {}
      setDefaultDismissed(true)
      return
    }
    const next = photos.filter((p) => p !== photo)
    try {
      localStorage.setItem(WALL_KEY, JSON.stringify(next))
    } catch {}
    setPhotos(next)
  }

  const display = defaultDismissed ? photos : [...photos, DEFAULT_PHOTO]

  if (display.length === 0) return null

  return (
    <div className={styles.photoWall} aria-label="Pinned photos">
      <AnimatePresence>
        {display.map((photo, i) => (
          <motion.div
            key={photo}
            className={styles.pinned}
            style={{ ['--tilt' as string]: `${(i % 2 === 0 ? 1 : -1) * (1.5 + i)}deg` }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            <span className={styles.pin} aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={`Pinned booth photo ${i + 1}`} className={styles.pinnedImg} />
            <button
              className={styles.pinRemove}
              aria-label={`Remove pinned photo ${i + 1}`}
              onClick={() => remove(photo)}
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* called by Photo Booth after capture */
export function pinPhoto(dataUrl: string) {
  try {
    const raw = localStorage.getItem(WALL_KEY)
    const arr: string[] = raw ? JSON.parse(raw) : []
    const next = [dataUrl, ...arr].slice(0, WALL_MAX)
    localStorage.setItem(WALL_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('lunde:booth-wall'))
    return true
  } catch {
    return false
  }
}
