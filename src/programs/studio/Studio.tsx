'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useStudio, getAnalyser } from '@/lib/studioPlayer'
import { Stamp } from '@/components/primitives/Stamp'
import { sfx } from '@/lib/sound'
import styles from './studio.module.css'

/* Studio — Jake's own recordings through a Windows-Media-Player-style
   visualizer, re-skinned for LUNDE OS: cream/blue/pink on the CRT plate.
   Modes: BARS (spectrum), SCOPE (waveform), RINGS (radial spectrum).
   Playback persists when the window closes; the engine lives in
   lib/studioPlayer. */

type Mode = 'bars' | 'scope' | 'rings'

const fmt = (s: number) => {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function Studio() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>('bars')
  const modeRef = useRef<Mode>(mode)
  modeRef.current = mode
  const reduced = useReducedMotion()

  const tracks = useStudio((s) => s.tracks)
  const loaded = useStudio((s) => s.loaded)
  const index = useStudio((s) => s.index)
  const playing = useStudio((s) => s.playing)
  const time = useStudio((s) => s.time)
  const duration = useStudio((s) => s.duration)
  const volume = useStudio((s) => s.volume)
  const load = useStudio((s) => s.load)
  const play = useStudio((s) => s.play)
  const toggle = useStudio((s) => s.toggle)
  const next = useStudio((s) => s.next)
  const prev = useStudio((s) => s.prev)
  const setVolume = useStudio((s) => s.setVolume)

  // rotary knob: vertical drag turns it; -135°..135° maps 0..1
  const knobDrag = useRef<{ y: number; v: number } | null>(null)
  const onKnobDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    knobDrag.current = { y: e.clientY, v: volume }
  }
  const onKnobMove = (e: React.PointerEvent) => {
    if (!knobDrag.current) return
    setVolume(knobDrag.current.v + (knobDrag.current.y - e.clientY) / 140)
  }
  const onKnobUp = () => {
    if (knobDrag.current) sfx.tap()
    knobDrag.current = null
  }

  useEffect(() => {
    void load()
  }, [load])

  // visualizer draw loop
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
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)

      const an = getAnalyser()
      const cream = '#E7E1D2'
      const blue = '#5C7CFF'
      const pink = '#F2A6C2'

      if (!an) {
        g.fillStyle = 'rgba(231,225,210,0.4)'
        g.font = '10px monospace'
        g.textAlign = 'center'
        g.fillText('PRESS PLAY', w / 2, h / 2)
        return
      }

      const m = modeRef.current
      if (m === 'bars') {
        an.getByteFrequencyData(freq)
        const bars = 48
        const step = Math.floor((freq.length * 0.72) / bars)
        const bw = w / bars
        for (let i = 0; i < bars; i++) {
          let sum = 0
          for (let j = 0; j < step; j++) sum += freq[i * step + j]
          const v = sum / step / 255
          const bh = Math.max(2, v * (h - 18))
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
        g.arc(cx, cy, base - 6, 0, Math.PI * 2)
        g.strokeStyle = pink
        g.lineWidth = 1
        g.stroke()
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  if (loaded && tracks.length === 0) {
    return (
      <div className={styles.await}>
        <Stamp>Awaiting masters</Stamp>
        <p className={styles.awaitNote}>
          The player is wired — Jake&rsquo;s recordings are being transferred from the vault.
        </p>
      </div>
    )
  }

  const current = tracks[index]

  return (
    <div className={styles.studio}>
      <div className={styles.vizPanel}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div className={styles.modes} role="group" aria-label="Visualizer mode">
          {(['bars', 'scope', 'rings'] as Mode[]).map((m) => (
            <button
              key={m}
              className={styles.modeChip}
              aria-pressed={mode === m}
              onClick={() => {
                sfx.tap()
                setMode(m)
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.transport}>
        {current?.art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.art} alt="" className={styles.tArt} aria-hidden="true" />
        )}
        <button className={styles.tBtn} aria-label="Previous track" onClick={prev}>
          ⏮
        </button>
        <button className={styles.tBtn} aria-label={playing ? 'Pause' : 'Play'} onClick={toggle}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button className={styles.tBtn} aria-label="Next track" onClick={next}>
          ⏭
        </button>
        <span className={styles.tTitle}>{current?.title ?? '—'}</span>
        <span className={styles.tTime}>
          {fmt(time)} / {fmt(duration)}
        </span>
        <div className={styles.knobWrap}>
          <div
            className={styles.knob}
            role="slider"
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volume * 100)}
            tabIndex={0}
            style={{ transform: `rotate(${-135 + volume * 270}deg)` }}
            onPointerDown={onKnobDown}
            onPointerMove={onKnobMove}
            onPointerUp={onKnobUp}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setVolume(volume + 0.05)
              if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setVolume(volume - 0.05)
            }}
          >
            <span className={styles.knobTick} aria-hidden="true" />
          </div>
          <span className={styles.knobLabel}>VOL</span>
        </div>
      </div>

      <div className={styles.trackList} role="list" aria-label="Tracks">
        {tracks.map((t, i) => (
          <button
            key={t.file}
            role="listitem"
            className={styles.trackRow}
            data-active={i === index || undefined}
            onClick={() => play(i)}
          >
            <span className={styles.trackNo}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.trackName}>{t.title}</span>
            {i === index && playing && <span className={styles.trackLive}>▶ PLAYING</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
