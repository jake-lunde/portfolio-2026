'use client'

import { useSettings } from '@/store/settings'

/* Tiny synthesized UI clicks — no assets, gated by the sound toggle. */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  return ctx
}

function blip(freq: number, dur = 0.045, gain = 0.04) {
  if (!useSettings.getState().sound) return
  const ac = audio()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur)
  osc.connect(g).connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + dur)
}

export const sfx = {
  open: () => blip(660, 0.05),
  close: () => blip(330, 0.045),
  tap: () => blip(880, 0.03, 0.025),
}
