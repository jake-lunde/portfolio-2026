'use client'

import { useEffect, useRef, useState } from 'react'
import { sfx } from '@/lib/sound'
import { PAGES } from './pages'
import styles from './paint.module.css'

/* Coloring book — MS Paint by way of the print archive. A scanline flood
   fill that respects the line art as barriers, a brush, an undo stack,
   and a limited archival palette. Pages are Jake's tattoos, redrawn as
   flash-style line art (see pages.ts — each credits the artist). */

const W = 460
const H = 480

const PALETTE = [
  { name: 'blue', hex: '#2036C8' },
  { name: 'pink', hex: '#F2A6C2' },
  { name: 'green', hex: '#2E4A38' },
  { name: 'ink', hex: '#17150D' },
  { name: 'cream', hex: '#E7E1D2' },
  { name: 'white', hex: '#FFFFFF' },
]

const hexRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

const isLine = (d: Uint8ClampedArray, i: number) => d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 90

function floodFill(g: CanvasRenderingContext2D, sx: number, sy: number, hex: string) {
  const img = g.getImageData(0, 0, W, H)
  const d = img.data
  const at = (x: number, y: number) => (y * W + x) * 4
  const start = at(sx, sy)
  if (isLine(d, start)) return // clicked the outline itself
  const [tr, tg, tb] = [d[start], d[start + 1], d[start + 2]]
  const [fr, fg, fb] = hexRgb(hex)
  if (Math.abs(tr - fr) + Math.abs(tg - fg) + Math.abs(tb - fb) < 12) return
  const match = (i: number) =>
    !isLine(d, i) &&
    Math.abs(d[i] - tr) < 42 &&
    Math.abs(d[i + 1] - tg) < 42 &&
    Math.abs(d[i + 2] - tb) < 42
  const paint = (i: number) => {
    d[i] = fr
    d[i + 1] = fg
    d[i + 2] = fb
    d[i + 3] = 255
  }
  // scanline fill
  const stack: Array<[number, number]> = [[sx, sy]]
  while (stack.length) {
    const [x0, y] = stack.pop()!
    let x = x0
    while (x >= 0 && match(at(x, y))) x--
    x++
    let above = false
    let below = false
    while (x < W && match(at(x, y))) {
      paint(at(x, y))
      if (y > 0) {
        const m = match(at(x, y - 1))
        if (m && !above) {
          stack.push([x, y - 1])
          above = true
        } else if (!m) above = false
      }
      if (y < H - 1) {
        const m = match(at(x, y + 1))
        if (m && !below) {
          stack.push([x, y + 1])
          below = true
        } else if (!m) below = false
      }
      x++
    }
  }
  g.putImageData(img, 0, 0)
}

type Tool = 'fill' | 'brush'

export default function Paint() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const undoRef = useRef<ImageData[]>([])
  const drawing = useRef(false)
  const [tool, setTool] = useState<Tool>('fill')
  const [color, setColor] = useState(PALETTE[0].hex)
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState(0)

  const loadArt = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const g = canvas.getContext('2d', { willReadFrequently: true })!
    const img = new Image()
    img.onload = () => {
      g.fillStyle = '#FFFFFF'
      g.fillRect(0, 0, W, H)
      g.drawImage(img, 0, 0)
      undoRef.current = []
      setReady(true)
    }
    img.src = `data:image/svg+xml,${encodeURIComponent(PAGES[page].svg)}`
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadArt, [page])

  const pushUndo = () => {
    const g = canvasRef.current!.getContext('2d', { willReadFrequently: true })!
    undoRef.current.push(g.getImageData(0, 0, W, H))
    if (undoRef.current.length > 12) undoRef.current.shift()
  }

  const pos = (e: React.PointerEvent): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [
      Math.floor(((e.clientX - rect.left) / rect.width) * W),
      Math.floor(((e.clientY - rect.top) / rect.height) * H),
    ]
  }

  const onDown = (e: React.PointerEvent) => {
    if (!ready) return
    const g = canvasRef.current!.getContext('2d', { willReadFrequently: true })!
    const [x, y] = pos(e)
    pushUndo()
    if (tool === 'fill') {
      floodFill(g, x, y, color)
      sfx.tap()
    } else {
      drawing.current = true
      canvasRef.current!.setPointerCapture(e.pointerId)
      g.fillStyle = color
      g.beginPath()
      g.arc(x, y, 5, 0, Math.PI * 2)
      g.fill()
    }
  }

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const g = canvasRef.current!.getContext('2d')!
    const [x, y] = pos(e)
    g.fillStyle = color
    g.beginPath()
    g.arc(x, y, 5, 0, Math.PI * 2)
    g.fill()
  }

  const onUp = () => (drawing.current = false)

  const undo = () => {
    const prev = undoRef.current.pop()
    if (!prev) return
    canvasRef.current!.getContext('2d')!.putImageData(prev, 0, 0)
    sfx.close()
  }

  const save = () => {
    const a = document.createElement('a')
    a.href = canvasRef.current!.toDataURL('image/png')
    a.download = `lunde-coloring-${Date.now()}.png`
    a.click()
    sfx.open()
  }

  return (
    <div className={styles.paint}>
      <div className={styles.toolbar}>
        <div className={styles.tools} role="group" aria-label="Tool">
          <button className={styles.toolBtn} aria-pressed={tool === 'fill'} onClick={() => setTool('fill')}>
            ◍ FILL
          </button>
          <button className={styles.toolBtn} aria-pressed={tool === 'brush'} onClick={() => setTool('brush')}>
            ✎ BRUSH
          </button>
        </div>
        <div className={styles.actions}>
          <button className={styles.toolBtn} onClick={undo}>
            ↶ UNDO
          </button>
          <button className={styles.toolBtn} onClick={loadArt}>
            ✕ CLEAR
          </button>
          <button className={styles.toolBtn} onClick={save}>
            ↓ SAVE
          </button>
        </div>
      </div>

      <div className={styles.pages} role="group" aria-label="Coloring page">
        {PAGES.map((p, i) => (
          <button
            key={p.id}
            className={styles.pageChip}
            aria-pressed={page === i}
            onClick={() => {
              sfx.tap()
              setPage(i)
            }}
          >
            {p.title.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={styles.palette} role="group" aria-label="Color">
        {PALETTE.map((c) => (
          <button
            key={c.name}
            className={styles.chip}
            aria-pressed={color === c.hex}
            aria-label={`${c.name} paint`}
            style={{ background: c.hex }}
            onClick={() => {
              sfx.tap()
              setColor(c.hex)
            }}
          />
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className={styles.page}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        role="img"
        aria-label={`Coloring page: ${PAGES[page].title} tattoo line art. Click a region to fill it with the selected color.`}
      />
      <p className={styles.note}>PAGE {String(page + 1).padStart(2, '0')} · {PAGES[page].credit} · FROM JAKE'S ACTUAL ARM</p>
    </div>
  )
}
