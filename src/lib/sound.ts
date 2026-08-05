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
  if (useSettings.getState().skin === 'medieval') pluck(ac, freq, dur, gain)
  else beep(ac, freq, dur, gain)
}

/* classic — the original chip beep. Square wave, hard stop. */
function beep(ac: AudioContext, freq: number, dur: number, gain: number) {
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

/* medieval — same tunes, different instrument: a lute-course pluck.
   Two saws a hair detuned (lute courses are doubled strings, never quite
   in tune), dropped an octave for wood, through a lowpass that sweeps
   shut like a damped string. Q lends the faint clav "wah". Rings a bit
   past the classic dur — strings do — but attack stays instant so the
   UI rhythm is untouched. */
function pluck(ac: AudioContext, freq: number, dur: number, gain: number) {
  const t = ac.currentTime
  const f = freq * 0.5
  const ring = Math.max(dur * 2.5, 0.09)
  const g = ac.createGain()
  // 0.75 level-matches the beep by RMS (two saws sum hotter than one
  // square; measured offline, not guessed)
  g.gain.setValueAtTime(gain * 0.75, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + ring)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.Q.value = 1.5
  lp.frequency.setValueAtTime(f * 6, t)
  lp.frequency.exponentialRampToValueAtTime(f * 1.25, t + ring)
  for (const detune of [1, 1.006]) {
    const osc = ac.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = f * detune
    osc.connect(lp)
    osc.start(t)
    osc.stop(t + ring)
  }
  lp.connect(g).connect(ac.destination)
}

export const sfx = {
  open: () => blip(660, 0.05),
  close: () => blip(330, 0.045),
  tap: () => blip(880, 0.03, 0.025),
}

/* the gate — macrodata-refinement ritual sounds */
const PENTA = [392, 440, 523, 587, 659, 784]
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
