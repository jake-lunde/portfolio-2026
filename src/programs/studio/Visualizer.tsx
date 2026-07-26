'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { getAnalyser } from '@/lib/studioPlayer'
import { useSettings } from '@/store/settings'
import styles from './studio.module.css'

/* The spectrum canvas, lifted out of Studio unchanged in its DSP —
   BARS (spectrum) · SCOPE (waveform) · RINGS (radial spectrum).
   The one upgrade: the palette is no longer literal. It is read off the
   canvas element's own computed style for the semantic roles, so whatever
   --content / --accent / --accent-expressive resolve to in the active
   skin + theme is what draws. Re-read on skin/theme change only — never
   per frame (getComputedStyle forces style resolution). */

export type VizMode = 'bars' | 'scope' | 'rings'

export default function Visualizer({ mode }: { mode: VizMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modeRef = useRef<VizMode>(mode)
  modeRef.current = mode

  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const theme = useSettings((s) => s.theme)

  const palette = useRef({ content: '', accent: '', expressive: '' })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cs = getComputedStyle(canvas)
    const fallback = cs.color
    const role = (name: string) => cs.getPropertyValue(name).trim() || fallback
    palette.current = {
      content: role('--content'),
      accent: role('--accent'),
      expressive: role('--accent-expressive'),
    }
  }, [skin, theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const g = canvas.getContext('2d')
    if (!g) return

    let raf = 0
    let last = 0
    const freq = new Uint8Array(1024)
    const wave = new Uint8Array(2048)

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw)
      // reduced motion: throttle to ~6fps instead of 60
      if (reduced && ts - last < 160) return
      last = ts

      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)

      const an = getAnalyser()
      const { content: cream, accent: blue, expressive: pink } = palette.current

      if (!an) {
        g.fillStyle = cream
        g.globalAlpha = 0.4
        g.font = '10px monospace'
        g.textAlign = 'center'
        g.fillText('PRESS PLAY', w / 2, h / 2)
        g.globalAlpha = 1
        return
      }

      const m = modeRef.current
      if (m === 'bars') {
        an.getByteFrequencyData(freq)
        const bars = Math.max(20, Math.min(48, Math.floor(w / 6)))
        const step = Math.floor((freq.length * 0.72) / bars)
        const bw = w / bars
        for (let i = 0; i < bars; i++) {
          let sum = 0
          for (let j = 0; j < step; j++) sum += freq[i * step + j]
          const v = sum / step / 255
          const bh = Math.max(2, v * (h - 14))
          g.fillStyle = blue
          g.globalAlpha = 0.35 + v * 0.65
          g.fillRect(i * bw + 1.5, h - bh, bw - 3, bh)
          g.globalAlpha = 1
          g.fillStyle = pink
          g.fillRect(i * bw + 1.5, h - bh - 3, bw - 3, 2)
        }
      } else if (m === 'scope') {
        an.getByteTimeDomainData(wave)
        g.beginPath()
        for (let i = 0; i < wave.length; i += 4) {
          const x = (i / wave.length) * w
          const y = (wave[i] / 255) * h
          i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
        }
        g.strokeStyle = cream
        g.lineWidth = 1.4
        g.stroke()
        // pink echo, offset — the CRT ghost
        g.beginPath()
        for (let i = 0; i < wave.length; i += 8) {
          const x = (i / wave.length) * w
          const y = (wave[i] / 255) * h + 4
          i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
        }
        g.strokeStyle = pink
        g.globalAlpha = 0.5
        g.lineWidth = 1
        g.stroke()
        g.globalAlpha = 1
      } else {
        an.getByteFrequencyData(freq)
        const cx = w / 2
        const cy = h / 2
        const base = Math.min(w, h) * 0.18
        const spokes = 72
        g.strokeStyle = blue
        g.lineWidth = 1.6
        for (let i = 0; i < spokes; i++) {
          const v = freq[Math.floor((i / spokes) * freq.length * 0.6)] / 255
          const a = (i / spokes) * Math.PI * 2 - Math.PI / 2
          const r1 = base
          const r2 = base + v * Math.min(w, h) * 0.3
          g.globalAlpha = 0.3 + v * 0.7
          g.beginPath()
          g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
          g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2)
          g.stroke()
        }
        g.globalAlpha = 1
        g.beginPath()
        g.arc(cx, cy, Math.max(2, base - 6), 0, Math.PI * 2)
        g.strokeStyle = pink
        g.lineWidth = 1
        g.stroke()
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}
