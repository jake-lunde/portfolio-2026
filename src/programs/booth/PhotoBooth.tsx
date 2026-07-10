'use client'

import { useEffect, useRef, useState } from 'react'
import { Stamp } from '@/components/primitives/Stamp'
import { pinPhoto } from '@/components/shell/PhotoWall'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'
import styles from './booth.module.css'

/* Photo Booth — the webcam through a parallel-1992 signal chain.
   Every frame runs a real pixel pipeline (no CSS-filter shortcuts):
   VHS (channel shift + noise + scanlines), DITHER (4×4 Bayer, ink on
   paper), DUOTONE (plate → pink), CRT (scanline + vignette), CLEAN.
   Snap = 3-2-1 countdown → polaroid card → download. Camera stops the
   moment the window closes. */

type Filter = 'vhs' | 'dither' | 'duotone' | 'crt' | 'clean'
type Phase = 'off' | 'starting' | 'live' | 'denied' | 'shot'

const W = 480
const H = 360

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

// palette (paper/ink/pink/plate) as rgb
const PAPER = [231, 225, 210]
const INK = [23, 21, 13]
const PINK = [242, 166, 194]
const PLATE = [19, 24, 17]

function processFrame(src: ImageData, mode: Filter, t: number): ImageData {
  const d = src.data
  const out = new ImageData(W, H)
  const o = out.data

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      let r = d[i], g = d[i + 1], b = d[i + 2]

      if (mode === 'vhs') {
        const shift = 3
        const ri = (y * W + Math.min(W - 1, x + shift)) * 4
        const bi = (y * W + Math.max(0, x - shift)) * 4
        r = d[ri]
        b = d[bi + 2]
        // rolling noise band + speckle
        const band = Math.abs(((y + t * 90) % H) - H / 2) < 6 ? 24 : 0
        const noise = (Math.random() - 0.5) * 26 + band
        r += noise; g += noise; b += noise
        if (y % 3 === 0) { r *= 0.82; g *= 0.82; b *= 0.82 }
      } else if (mode === 'dither') {
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
        const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16
        const c = lum > threshold ? PAPER : INK
        r = c[0]; g = c[1]; b = c[2]
      } else if (mode === 'duotone') {
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
        r = PLATE[0] + (PINK[0] - PLATE[0]) * lum
        g = PLATE[1] + (PINK[1] - PLATE[1]) * lum
        b = PLATE[2] + (PINK[2] - PLATE[2]) * lum
      } else if (mode === 'crt') {
        if (y % 2 === 0) { r *= 0.72; g *= 0.72; b *= 0.72 }
        // vignette
        const dx = (x - W / 2) / (W / 2)
        const dy = (y - H / 2) / (H / 2)
        const v = 1 - (dx * dx + dy * dy) * 0.35
        r *= v; g *= v * 1.02; b *= v * 0.95
      }

      o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = 255
    }
  }
  return out
}

const FILTERS: Filter[] = ['vhs', 'dither', 'duotone', 'crt', 'clean']

export default function PhotoBooth() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const filterRef = useRef<Filter>('vhs')
  const [phase, setPhase] = useState<Phase>('off')
  const [filter, setFilter] = useState<Filter>('vhs')
  const [count, setCount] = useState<number | null>(null)
  const [shotUrl, setShotUrl] = useState<string | null>(null)
  const [pinUrl, setPinUrl] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)
  filterRef.current = filter

  // draw loop
  useEffect(() => {
    if (phase !== 'live') return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const g = canvas.getContext('2d')!
    if (!workRef.current) {
      workRef.current = document.createElement('canvas')
      workRef.current.width = W
      workRef.current.height = H
    }
    const wg = workRef.current.getContext('2d', { willReadFrequently: true })!
    let raf = 0
    const t0 = performance.now()

    const draw = () => {
      raf = requestAnimationFrame(draw)
      if (video.readyState < 2) return
      // mirror into the work canvas
      wg.save()
      wg.translate(W, 0)
      wg.scale(-1, 1)
      wg.drawImage(video, 0, 0, W, H)
      wg.restore()
      const mode = filterRef.current
      if (mode === 'clean') {
        g.drawImage(workRef.current!, 0, 0)
      } else {
        const frame = wg.getImageData(0, 0, W, H)
        g.putImageData(processFrame(frame, mode, (performance.now() - t0) / 1000), 0, 0)
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // stop the camera when the window unmounts
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    },
    []
  )

  const powerOn = async () => {
    setPhase('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      const v = videoRef.current!
      v.srcObject = stream
      await v.play()
      sfx.open()
      setPhase('live')
    } catch {
      setPhase('denied')
    }
  }

  const snap = () => {
    if (count !== null) return
    let n = 3
    setCount(n)
    sfx.tap()
    const tick = setInterval(() => {
      n -= 1
      if (n > 0) {
        setCount(n)
        sfx.tap()
      } else {
        clearInterval(tick)
        setCount(null)
        capture()
      }
    }, 700)
  }

  const capture = () => {
    const frame = canvasRef.current
    if (!frame) return
    sfx.open()
    // polaroid composite
    const card = document.createElement('canvas')
    card.width = W + 48
    card.height = H + 110
    const g = card.getContext('2d')!
    g.fillStyle = '#E7E1D2'
    g.fillRect(0, 0, card.width, card.height)
    g.strokeStyle = '#17150D'
    g.lineWidth = 3
    g.strokeRect(1.5, 1.5, card.width - 3, card.height - 3)
    g.drawImage(frame, 24, 24)
    g.strokeStyle = '#17150D'
    g.lineWidth = 2
    g.strokeRect(24, 24, W, H)
    g.fillStyle = '#17150D'
    g.font = '13px monospace'
    const date = new Date().toISOString().slice(0, 10)
    g.fillText(`LUNDE BOOTH · ${date} · ${filterRef.current.toUpperCase()}`, 24, H + 70)
    g.fillStyle = '#F2A6C2'
    g.fillText('■', W - 4, H + 70)
    metric('booth_snap')
    setShotUrl(card.toDataURL('image/png'))
    setPinUrl(card.toDataURL('image/jpeg', 0.82)) // compact copy for the wall
    setPinned(false)
    setPhase('shot')
  }

  const pin = () => {
    if (!pinUrl || pinned) return
    if (pinPhoto(pinUrl)) {
      sfx.tap()
      metric('booth_pin')
      setPinned(true)
    }
  }

  const back = () => {
    setShotUrl(null)
    setPinUrl(null)
    setPinned(false)
    setPhase('live')
  }

  return (
    <div className={styles.booth}>
      {/* hidden source video */}
      <video ref={videoRef} playsInline muted className={styles.hiddenVideo} />

      {phase === 'off' && (
        <div className={styles.idle}>
          <Stamp>Coin not required</Stamp>
          <p className={styles.idleNote}>
            A photo booth from the wrong decade. Your camera feed never leaves
            this machine — snaps exist only if you download them.
          </p>
          <button className={styles.bigBtn} onClick={powerOn}>
            ⏻ POWER ON CAMERA
          </button>
        </div>
      )}

      {phase === 'starting' && <p className={styles.status}>WARMING UP THE TUBE…</p>}

      {phase === 'denied' && (
        <div className={styles.idle}>
          <Stamp tone="pink">No signal</Stamp>
          <p className={styles.idleNote}>
            Camera permission was declined. The booth respects that — enable it
            in your browser&rsquo;s site settings if you change your mind.
          </p>
        </div>
      )}

      {(phase === 'live' || phase === 'shot') && (
        <>
          <div className={styles.stage}>
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className={styles.feed}
              style={{ display: phase === 'live' ? 'block' : 'none' }}
              aria-label="Live camera preview with the selected filter"
            />
            {phase === 'shot' && shotUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shotUrl} alt="Your captured photo, framed as a polaroid" className={styles.shot} />
            )}
            {count !== null && <span className={styles.count}>{count}</span>}
          </div>

          {phase === 'live' && (
            <>
              <div className={styles.filters} role="group" aria-label="Filter">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    className={styles.filterChip}
                    aria-pressed={filter === f}
                    onClick={() => {
                      sfx.tap()
                      setFilter(f)
                    }}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <button className={styles.bigBtn} onClick={snap} disabled={count !== null}>
                ◉ SNAP
              </button>
            </>
          )}

          {phase === 'shot' && shotUrl && (
            <div className={styles.shotRow}>
              <button className={styles.bigBtn} onClick={pin} disabled={pinned}>
                {pinned ? '✓ PINNED' : '📌 PIN TO WALL'}
              </button>
              <a className={styles.bigBtn} href={shotUrl} download={`lunde-booth-${Date.now()}.png`}>
                ↓ DOWNLOAD
              </a>
              <button className={styles.bigBtn} onClick={back}>
                ← RESHOOT
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
