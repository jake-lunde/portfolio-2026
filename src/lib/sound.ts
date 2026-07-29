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

/* the gate — macrodata-refinement ritual sounds */
const PENTA = [392, 440, 523, 587, 659, 784]
/* CV.EXE's dot-matrix printer. A real one is a row of pins hammering a
   ribbon, so the chatter is deliberately noisy and low: one short square
   burst per printed pass, jittered in pitch so a run of them never sounds
   like a melody. Gated by the SND toggle like everything else (blip bails
   on its own), and the caller skips it entirely under reduced motion. */
export const cvSfx = {
  chatter: () => blip(150 + Math.random() * 70, 0.018, 0.022),
  // tearing paper: a fast descending pair, more rip than tone
  tear: () => {
    blip(420, 0.05, 0.03)
    setTimeout(() => blip(210, 0.07, 0.025), 45)
  },
}

export const gateSfx = {
  pick: (slot: number) => blip(PENTA[slot % PENTA.length], 0.06, 0.03),
  remove: () => blip(294, 0.05, 0.025),
  success: () => {
    blip(523, 0.08, 0.03)
    setTimeout(() => blip(659, 0.08, 0.03), 110)
    setTimeout(() => blip(784, 0.14, 0.035), 220)
  },
  fail: () => {
    blip(311, 0.09, 0.03)
    setTimeout(() => blip(233, 0.16, 0.03), 130)
  },
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
