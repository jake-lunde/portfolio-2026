'use client'

import { useSettings } from '@/store/settings'
import { getWallpaper, wallpaperMask } from './wallpapers'
import styles from './shell.module.css'

/* The desktop pattern layer — ink through an SVG-tile mask, so it adapts
   to light/dark automatically. Selection lives in Settings. */

export function Wallpaper() {
  const id = useSettings((s) => s.wallpaper)
  const wp = getWallpaper(id)
  if (!wp.tile) return null
  return <div className={styles.wallpaper} style={wallpaperMask(wp)} aria-hidden="true" />
}
