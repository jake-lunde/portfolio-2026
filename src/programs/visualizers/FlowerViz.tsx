'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import model from './flowers-model.json'
import styles from './viz.module.css'

/* Low-poly scan of flowers Jake's wife grew — rendered by hand (rotate,
   project, painter-sort, flat-shade) on a canvas. No 3D library; the
   renderer itself is part of the exhibit. Layers: solid / mesh. */

const CREAM = [231, 225, 210] as const

type Layer = 'solid' | 'mesh'

export function FlowerViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [layer, setLayer] = useState<Layer>('solid')
  const reduced = useReducedMotion()

  const rot = useRef({ yaw: 0.6, pitch: 0.25 })
  const dragging = useRef<{ x: number; y: number } | null>(null)
  const layerRef = useRef<Layer>(layer)
  layerRef.current = layer

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const verts = model.verts as [number, number, number][]
    const faces = model.faces as [number, number, number][]
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
      const scale = Math.min(w, h) * 0.62
      const cx = w / 2
      const cz = h / 2 + h * 0.04

      // rotate Y then X; orthographic
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
        const [ax, ay, az] = proj[a]
        const [bx, by, bz] = proj[b]
        const [cxp, cyp, czp] = proj[c]

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
          // flat normal in view space
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
      // static render; still re-renders on drag via pointer handlers
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
  }, [reduced])

  return (
    <div>
      <div className={styles.rideHead}>
        <h3 className={styles.rideTitle}>“flowers, grown &amp; scanned”</h3>
        <span className={styles.rideSub}>
          GROWN BY MY WIFE · {model.faces.length} FACES · OBJ
        </span>
      </div>

      <div className={styles.vizNav} role="group" aria-label="Render layer">
        <button
          className={styles.vizChip}
          aria-pressed={layer === 'solid'}
          onClick={() => setLayer('solid')}
        >
          Layer · Solid
        </button>
        <button
          className={styles.vizChip}
          aria-pressed={layer === 'mesh'}
          onClick={() => setLayer('mesh')}
        >
          Layer · Mesh
        </button>
      </div>

      <div className={styles.panel}>
        <span className={styles.panelLabel}>Model 01 · drag to rotate</span>
        <canvas
          ref={canvasRef}
          className={styles.modelCanvas}
          role="img"
          aria-label="Rotating low-poly 3D scan of garden flowers. Drag to rotate."
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            dragging.current = { x: e.clientX, y: e.clientY }
          }}
        />
      </div>
      <p className={styles.scrubHint}>Drag to rotate — solid for the bloom, mesh for the bones.</p>
    </div>
  )
}
