'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
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
  const [shared, setShared] = useState<string[]>([])
  const [zoomed, setZoomed] = useState<string | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    setPhotos(readWall())
    const sync = () => setPhotos(readWall())
    window.addEventListener('lunde:booth-wall', sync)
    window.addEventListener('storage', sync) // other tabs
    // the moderated public wall — everyone sees what Jake approved
    fetch('/api/wall')
      .then((r) => r.json())
      .then((d) => Array.isArray(d.photos) && setShared(d.photos.slice(0, WALL_MAX)))
      .catch(() => {})
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

  // close the zoom on Escape
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoomed(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomed])

  // your own pins ride on top (instant, awaiting review), the approved
  // public wall beneath; Jake's founding polaroid holds the fort until
  // anything is approved
  const own = photos.slice(0, 2)
  const approved = shared.filter((s) => !own.includes(s)).slice(0, WALL_MAX)
  const display = [...own, ...approved].slice(0, 4)
  if (display.length === 0 && !defaultDismissed) display.push(DEFAULT_PHOTO)

  if (display.length === 0) return null

  const spring = reduced
    ? { duration: 0 }
    : SPRINGS.zoom

  return (
    <>
      <div className={styles.photoWall} aria-label="Pinned photos">
        <AnimatePresence>
          {display.map(
            (photo, i) =>
              zoomed !== photo && (
                // the polaroid IS the shared element: layoutId hands it to
                // the zoomed twin and back, so the print itself flies
                <motion.button
                  key={photo}
                  layoutId={photo}
                  layout
                  type="button"
                  className={styles.pinned}
                  style={{ ['--tilt' as string]: `${(i % 2 === 0 ? 1 : -1) * (1.5 + i)}deg` }}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: -16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 16 }}
                  transition={spring}
                  onClick={() => setZoomed(photo)}
                  aria-label={`View pinned booth photo ${i + 1} closely`}
                >
                  <span className={styles.pin} aria-hidden="true" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`Pinned booth photo ${i + 1}`} className={styles.pinnedImg} />
                </motion.button>
              )
          )}
        </AnimatePresence>
      </div>

      {/* zoomed: the same print, up close — click anywhere (or Esc) to put it back */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            className={styles.photoZoom}
            onClick={() => setZoomed(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            role="dialog"
            aria-label="Photo up close — click anywhere to put it back"
          >
            <motion.div
              layoutId={zoomed}
              className={`${styles.pinned} ${styles.pinnedZoomed}`}
              transition={spring}
            >
              <span className={styles.pin} aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zoomed} alt="Booth photo up close" className={styles.pinnedImg} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
