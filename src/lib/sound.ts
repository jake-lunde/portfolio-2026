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

/* command-center telemetry — quieter than UI sfx, tuned per signal:
   dispatch rises (packet out), return falls (packet home), merge lands a
   soft low fifth (work absorbed). status/review stay silent by design. */
export const telemetry = {
  dispatch: () => {
    blip(523, 0.04, 0.016)
    setTimeout(() => blip(784, 0.05, 0.016), 55)
  },
  return: () => {
    blip(784, 0.04, 0.016)
    setTimeout(() => blip(523, 0.05, 0.016), 55)
  },
  merge: () => {
    blip(262, 0.09, 0.014)
    setTimeout(() => blip(392, 0.09, 0.012), 20)
  },
}
