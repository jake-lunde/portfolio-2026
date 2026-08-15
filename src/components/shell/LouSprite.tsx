'use client'

import { useEffect, useRef } from 'react'

/* Pixel Lou — Jake's toy poodle, hand-placed from the ref photos:
   round head poof, drooping ear, curled plume tail, dark button eye and
   nose, a hint of muzzle stain. Faces right; flip with CSS scaleX(-1).
   Rendered to a canvas, scaled crisp. Trots: three leg frames on one
   body, cycled contact → extend → contact → gather (diagonal pairs,
   like the real gait). Reduced motion holds the contact frame. */

const C = '#F3ECDA' // cream curls
const S = '#D9C7A4' // curl shading / far legs
const K = '#17150D' // eye / nose

// 28 wide — . transparent. Body is rows 0-14; legs are rows 15-20.
const BODY = [
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
]

// contact — all four planted
const LEGS_CONTACT = [
  '....ccs..ss...ccc.ss........',
  '....ccc..ss...ccc.ss........',
  '....ccc..ss...ccc.ss........',
  '....ccc.......ccc...........',
  '....cccc......cccc..........',
  '............................',
]
// extend — near back swings back, near front reaches; far pair tucks under
const LEGS_EXTEND = [
  '...ccs.....ss.sscccc........',
  '...ccc....ss..ss.ccc........',
  '..ccc.....ss..ss..ccc.......',
  '..ccc..............ccc......',
  '.ccc................ccc.....',
  '............................',
]
// gather — near pair pulls under, far pair splays
const LEGS_GATHER = [
  '.....ccs..ss.sccc..ss.......',
  '.....ccc.ss..sccc...ss......',
  '......cc.ss..scc....ss......',
  '......ccc....ccc............',
  '......ccc....ccc............',
  '............................',
]

const FRAMES = [LEGS_CONTACT, LEGS_EXTEND, LEGS_CONTACT, LEGS_GATHER].map(
  (legs) => [...BODY, ...legs]
)
const FRAME_MS = 110

const COLORS: Record<string, string> = { c: C, s: S, k: K, n: K }

export const LOU_W = 28
export const LOU_H = FRAMES[0].length // 21

function paint(g: CanvasRenderingContext2D, map: string[], px: number) {
  g.clearRect(0, 0, LOU_W * px, LOU_H * px)
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = COLORS[row[x]]
      if (!col) continue
      g.fillStyle = col
      g.fillRect(x * px, y * px, px, px)
    }
  })
}

export function LouSprite({ px = 5, walking = false }: { px?: number; walking?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const g = cv.getContext('2d')!
    paint(g, FRAMES[0], px)
    if (!walking) return
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % FRAMES.length
      paint(g, FRAMES[i], px)
    }, FRAME_MS)
    return () => clearInterval(id)
  }, [px, walking])

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
