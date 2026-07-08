'use client'

import { useEffect, useRef } from 'react'

/* Pixel Lou — Jake's toy poodle, hand-placed from the ref photos:
   cream curls, dark eyes/nose, a hint of tongue. Faces right; flip with
   CSS scaleX(-1). Rendered once to a canvas, scaled crisp. */

const C = '#F3ECDA' // cream curls
const S = '#D9C7A4' // curl shading
const K = '#17150D' // eye / nose
const P = '#F2A6C2' // tongue

// 26 × 20 — . transparent
const MAP = [
  '.................ccccc....',
  '................ccccccc...',
  '...............scccccccc..',
  '...............ccccccccc..',
  '.....ccc.......cccccccccc.',
  '....ccccc......cckccccnnn.',
  '.....ccc.......sccccccnnn.',
  '......c...cccccssccccccp..',
  '.........ccccccccsscccc...',
  '......ccccccccccccsscc....',
  '.....cccccccccccccccc.....',
  '....scccccccccccccccc.....',
  '....ccccccccccccccccc.....',
  '....cccccccccccccccc......',
  '.....ccs..ccs...ccs.......',
  '.....ccc..ccc...ccc.......',
  '.....ccc..ccc...ccc.......',
  '.....ccc..ccc...ccc.......',
  '....sccc..sccc..sccc......',
  '..........................',
]

const COLORS: Record<string, string> = { c: C, s: S, k: K, n: K, p: P }

export const LOU_W = 26
export const LOU_H = 20

export function LouSprite({ px = 5 }: { px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const g = cv.getContext('2d')!
    g.clearRect(0, 0, cv.width, cv.height)
    MAP.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = COLORS[row[x]]
        if (!col) continue
        g.fillStyle = col
        g.fillRect(x * px, y * px, px, px)
      }
    })
  }, [px])

  return (
    <canvas
      ref={ref}
      width={LOU_W * px}
      height={LOU_H * px}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      aria-hidden="true"
    />
  )
}
