'use client'

import { create } from 'zustand'
import { metric } from '@/lib/metrics'

/* Studio's audio engine — a module-level singleton so playback persists
   when the window closes (the OS keeps humming). Tracks are self-hosted
   under /audio (the WebAudio analyser needs same-origin media; streaming
   services don't allow it). Manifest: public/audio/manifest.json */

export type StudioTrack = { title: string; file: string }

let audio: HTMLAudioElement | null = null
let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null

function ensureGraph(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'metadata'
    audio.addEventListener('ended', () => useStudio.getState().next())
    audio.addEventListener('timeupdate', () => {
      useStudio.setState({ time: audio!.currentTime, duration: audio!.duration || 0 })
    })
  }
  if (!ctx) {
    try {
      ctx = new AudioContext()
      analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.82
      const src = ctx.createMediaElementSource(audio)
      src.connect(analyser)
      analyser.connect(ctx.destination)
    } catch {
      /* no WebAudio → plain playback, visualizer idles */
    }
  }
  return audio
}

export const getAnalyser = () => analyser

type StudioState = {
  tracks: StudioTrack[]
  loaded: boolean
  index: number
  playing: boolean
  time: number
  duration: number
  load: () => Promise<void>
  play: (i?: number) => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
}

export const useStudio = create<StudioState>((set, get) => ({
  tracks: [],
  loaded: false,
  index: 0,
  playing: false,
  time: 0,
  duration: 0,

  load: async () => {
    if (get().loaded) return
    try {
      const res = await fetch('/audio/manifest.json', { cache: 'no-store' })
      const d = await res.json()
      set({ tracks: Array.isArray(d.tracks) ? d.tracks : [], loaded: true })
    } catch {
      set({ tracks: [], loaded: true })
    }
  },

  play: (i) => {
    const { tracks, index } = get()
    if (!tracks.length) return
    const target = i ?? index
    const el = ensureGraph()
    void ctx?.resume()
    const want = tracks[target].file
    if (!el.src.endsWith(want)) el.src = want
    void el.play()
    metric('studio_play')
    set({ index: target, playing: true })
  },

  pause: () => {
    audio?.pause()
    set({ playing: false })
  },

  toggle: () => (get().playing ? get().pause() : get().play()),

  next: () => {
    const { tracks, index } = get()
    if (tracks.length) get().play((index + 1) % tracks.length)
  },

  prev: () => {
    const { tracks, index } = get()
    if (tracks.length) get().play((index - 1 + tracks.length) % tracks.length)
  },
}))
