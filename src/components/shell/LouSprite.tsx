'use client'

import { useEffect, useRef } from 'react'

/* Pixel Lou — Jake's toy poodle, hand-placed from the ref photos:
   round head poof, drooping ear, curled plume tail, dark button eye and
   nose, a hint of muzzle stain. Faces right; flip with CSS scaleX(-1).
   Rendered once to a canvas, scaled crisp. */

const C = '#F3ECDA' // cream curls
const S = '#D9C7A4' // curl shading / far legs
const K = '#17150D' // eye / nose

// 28 × 21 — . transparent
const MAP = [
  '...................cccccc...',
  '.....ccc.........cccccccccc.',
  '....ccccc.......ccscccccccc.',
  '...ccc.cc.......csscccccccc.',
  '...cc..cc......ccssccccccccc',
  '....c.cc.......ccssccckccccc',
  '.....cc........ccssccccccsnn',
  '.....cc..ccccc..ccscccccssnn',
  '.....ccccccccccccccccccccc..',
  '....ccccccccccccccsscccc....',
  '...cccccccccccccccccss......',
  '...ccccccccccccccccs........',
  '...cccccsccccccccc..........',
  '...cccccccccccccccc.........',
  '....ccccccccccccccc.........',
  '....ccs..ss...ccc.ss........',
  '....ccc..ss...ccc.ss........',
  '....ccc..ss...ccc.ss........',
  '....ccc.......ccc...........',
  '....cccc......cccc..........',
  '............................',
]

const COLORS: Record<string, string> = { c: C, s: S, k: K, n: K }

export const LOU_W = 28
export const LOU_H = 21

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
