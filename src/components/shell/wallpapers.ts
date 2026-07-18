/* Desktop wallpaper patterns — classic Mac OS desktop patterns by way of
   the print refs (fisheries guilloché waves, De School grid, halftone
   specks). Each is a small SVG tile used as a CSS mask over var(--content),
   so patterns are theme-aware for free.
   Adding one: draw a tile, add an entry, done — it appears in Settings. */

import type { CSSProperties } from 'react'

export type Wallpaper = {
  id: string
  name: string
  /** SVG tile markup (black-on-transparent; used as a mask) */
  tile: string | null
  w: number
  h: number
}

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'waves',
    name: 'Waves',
    w: 28,
    h: 14,
    tile: svg(28, 14, '<path d="M0,7 Q7,1 14,7 T28,7" fill="none" stroke="#000" stroke-width="1"/>'),
  },
  {
    id: 'grid',
    name: 'Grid',
    w: 26,
    h: 26,
    tile: svg(26, 26, '<path d="M25.5,0V26M0,25.5H26" stroke="#000" stroke-width="1"/>'),
  },
  {
    id: 'dots',
    name: 'Dots',
    w: 14,
    h: 14,
    tile: svg(14, 14, '<circle cx="3.5" cy="3.5" r="1" fill="#000"/><circle cx="10.5" cy="10.5" r="1" fill="#000"/>'),
  },
  {
    id: 'crosses',
    name: 'Crosses',
    w: 20,
    h: 20,
    tile: svg(
      20,
      20,
      '<path d="M4,4l3,3M7,4l-3,3M14,13l3,3M17,13l-3,3" stroke="#000" stroke-width="0.8" fill="none"/>'
    ),
  },
  {
    id: 'dashes',
    name: 'Dashes',
    w: 26,
    h: 18,
    tile: svg(26, 18, '<path d="M2,4.5h9M15,13.5h9" stroke="#000" stroke-width="1.2"/>'),
  },
  {
    id: 'speckle',
    name: 'Speckle',
    w: 18,
    h: 18,
    tile: svg(
      18,
      18,
      '<path d="M2,3l2.4,1.6M12,1.5l2.4,1.6M7,8.5l2.4,1.6M14,12l2.4,1.6M3,14l2.4,1.6" stroke="#000" stroke-width="1.1" stroke-linecap="round"/>'
    ),
  },
  {
    id: 'diaper',
    name: 'Diaper',
    w: 28,
    h: 28,
    tile: svg(
      28,
      28,
      '<path d="M0,0L28,28M0,28L28,0" stroke="#000" stroke-width="1.2"/><rect x="12.5" y="12.5" width="3" height="3" transform="rotate(45 14 14)" fill="#000"/><rect x="-1.5" y="-1.5" width="3" height="3" transform="rotate(45 0 0)" fill="#000"/>'
    ),
  },
  { id: 'plain', name: 'Plain', tile: null, w: 0, h: 0 },
]

export function wallpaperMask(wp: Wallpaper): CSSProperties {
  if (!wp.tile) return {}
  const uri = `url("data:image/svg+xml,${encodeURIComponent(wp.tile)}")`
  return {
    backgroundColor: 'var(--content)',
    WebkitMaskImage: uri,
    maskImage: uri,
    WebkitMaskRepeat: 'repeat',
    maskRepeat: 'repeat',
    WebkitMaskSize: `${wp.w}px ${wp.h}px`,
    maskSize: `${wp.w}px ${wp.h}px`,
  }
}

export const getWallpaper = (id: string): Wallpaper =>
  WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]
