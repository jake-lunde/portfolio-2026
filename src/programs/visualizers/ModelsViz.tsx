'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { sfx } from '@/lib/sound'
import flowers from './flowers-model.json'
import louie from './louie-model.json'
import styles from './viz.module.css'

/* The model shelf — low-poly captures of Jake's world, rendered by a
   hand-rolled canvas engine (rotate, project, painter-sort, flat-shade;
   no 3D library — the renderer is part of the exhibit).
   FLOWERS: photoscan of blooms his wife grew, decimated 50k→2k faces.
   LOUIE: no scan yet, so he's hand-modeled from overlapping low-res
   spheres — a 3D cousin of the pixel sprite. JAKE: scan pending. */

const CREAM = [231, 225, 210] as const

type Layer = 'solid' | 'mesh'
type ModelData = { name: string; verts: number[][]; faces: number[][] }

const MODELS: Array<{
  id: string
  chip: string
  title: string
  sub: string
  data: ModelData | null
}> = [
  {
    id: 'flowers',
    chip: 'FLOWERS',
    title: '“flowers, grown & scanned”',
    sub: `GROWN BY MY WIFE · ${flowers.faces.length} FACES · PHOTOSCAN`,
    data: flowers as ModelData,
  },
  {
    id: 'louie',
    chip: 'LOUIE',
    title: '“louie, from memory”',
    sub: `NO SCAN YET — HAND-MODELED · ${louie.faces.length} FACES`,
    data: louie as ModelData,
  },
  {
    id: 'jake',
    chip: 'JAKE',
    title: '“the operator”',
    sub: 'SCAN PENDING',
    data: null,
  },
]

export function ModelsViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [layer, setLayer] = useState<Layer>('solid')
  const [modelId, setModelId] = useState('flowers')
  const reduced = useReducedMotion()

  const rot = useRef({ yaw: 0.6, pitch: 0.25 })
  const dragging = useRef<{ x: number; y: number } | null>(null)
  const layerRef = useRef<Layer>(layer)
  layerRef.current = layer

  const model = MODELS.find((m) => m.id === modelId)!

  useEffect(() => {
    const canvas = canvasRef.current
    const data = model.data
    if (!canvas || !data) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const verts = data.verts as [number, number, number][]
    const faces = data.faces as [number, number, number][]
    const light = [0.4, -0.7, 0.6]
    const lightLen = Math.hypot(...light)

    let raf = 0
    let disposed = false

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const { yaw, pitch } = rot.current
      const cy = Math.cos(yaw), sy = Math.sin(yaw)
      const cp = Math.cos(pitch), sp = Math.sin(pitch)
      // coords are normalized to ±1 — 0.46·min keeps every pose inside
      // the frame (the old 0.62 clipped the bloom)
      const scale = Math.min(w, h) * 0.46
      const cx = w / 2
      const cz = h / 2

      const proj = new Array<[number, number, number]>(verts.length)
      for (let i = 0; i < verts.length; i++) {
        const [x, y, z] = verts[i]
        const x1 = x * cy + z * sy
        const z1 = -x * sy + z * cy
        const y2 = y * cp - z1 * sp
        const z2 = y * sp + z1 * cp
        proj[i] = [cx + x1 * scale, cz - y2 * scale, z2]
      }

      const order = faces
        .map((f, i) => [i, (proj[f[0]][2] + proj[f[1]][2] + proj[f[2]][2]) / 3] as const)
        .sort((a, b) => a[1] - b[1])

      const mesh = layerRef.current === 'mesh'
      ctx.lineJoin = 'round'

      for (const [fi] of order) {
        const [a, b, c] = faces[fi]
        const [ax, ay] = proj[a]
        const [bx, by, bz] = proj[b]
        const [cxp, cyp, czp] = proj[c]
        const az = proj[a][2]

        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.lineTo(cxp, cyp)
        ctx.closePath()

        if (mesh) {
          ctx.strokeStyle = `rgba(${CREAM[0]},${CREAM[1]},${CREAM[2]},0.28)`
          ctx.lineWidth = 0.5
          ctx.stroke()
        } else {
          const ux = bx - ax, uy = by - ay, uz = bz - az
          const vx = cxp - ax, vy = cyp - ay, vz = czp - az
          const nx = uy * vz - uz * vy
          const ny = uz * vx - ux * vz
          const nz = ux * vy - uy * vx
          const nLen = Math.hypot(nx, ny, nz) || 1
          const lam = Math.abs(
            (nx * light[0] + ny * light[1] + nz * light[2]) / (nLen * lightLen)
          )
          const lum = 0.12 + lam * 0.8
          ctx.fillStyle = `rgba(${CREAM[0]},${CREAM[1]},${CREAM[2]},${lum.toFixed(3)})`
          ctx.fill()
          ctx.strokeStyle = 'rgba(9,12,10,0.45)'
          ctx.lineWidth = 0.4
          ctx.stroke()
        }
      }
    }

    const tick = () => {
      if (disposed) return
      if (!dragging.current && !reduced) rot.current.yaw += 0.0035
      draw()
      raf = requestAnimationFrame(tick)
    }

    if (reduced) {
      draw()
    } else {
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      rot.current.yaw += (e.clientX - dragging.current.x) * 0.008
      rot.current.pitch = Math.max(
        -1.4,
        Math.min(1.4, rot.current.pitch + (e.clientY - dragging.current.y) * 0.006)
      )
      dragging.current = { x: e.clientX, y: e.clientY }
      if (reduced) draw()
    }
    const onUp = () => (dragging.current = null)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [reduced, modelId, model.data])

  return (
    <div>
      <div className={styles.rideHead}>
        <h3 className={styles.rideTitle}>{model.title}</h3>
        <span className={styles.rideSub}>{model.sub}</span>
      </div>

      <div className={styles.vizNav} role="group" aria-label="Model">
        {MODELS.map((m) => (
          <button
            key={m.id}
            className={styles.vizChip}
            aria-pressed={modelId === m.id}
            disabled={!m.data}
            onClick={() => {
              sfx.tap()
              setModelId(m.id)
            }}
          >
            {m.chip}
            {!m.data && ' · SOON'}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button
          className={styles.vizChip}
          aria-pressed={layer === 'solid'}
          onClick={() => setLayer('solid')}
        >
          SOLID
        </button>
        <button
          className={styles.vizChip}
          aria-pressed={layer === 'mesh'}
          onClick={() => setLayer('mesh')}
        >
          MESH
        </button>
      </div>

      <div className={styles.panel}>
        <span className={styles.panelLabel}>
          Model {String(MODELS.findIndex((m) => m.id === modelId) + 1).padStart(2, '0')} · drag to rotate
        </span>
        <canvas
          ref={canvasRef}
          className={styles.modelCanvas}
          role="img"
          aria-label={`Rotating low-poly model: ${model.chip.toLowerCase()}. Drag to rotate.`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            dragging.current = { x: e.clientX, y: e.clientY }
          }}
        />
      </div>
      <p className={styles.scrubHint}>
        Drag to rotate — solid for the body, mesh for the bones.
      </p>
    </div>
  )
}
