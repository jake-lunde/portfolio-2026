'use client'

import { useSettings } from '@/store/settings'

/* Tiny synthesized UI clicks, gated by the sound toggle. Classic is
   all synthesis; medieval's feature moments (open/close/enter-mode)
   play Jake's recorded samples from public/sfx (AAC'd from
   ref/assets-medieval/sounds), with the synth pluck kept for
   rapid-fire taps and melodic runs where a fixed sample would smear. */

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

/* Jake's medieval one-shots. Gains measured against the classic beep
   (peak 0.04): affirm/close ship at his mastered levels — they already
   sit in polite ratio — and the enter fanfare (peak 0.91 raw) is pulled
   to 0.4 so a mode switch is ceremony, not a jump scare. */
const SAMPLES = {
  affirm: '/sfx/medieval-affirm.m4a',
  close: '/sfx/medieval-close.m4a',
  enter: '/sfx/enter-medieval-mode.m4a',
} as const
const SAMPLE_GAIN: Record<keyof typeof SAMPLES, number> = {
  affirm: 1,
  close: 1,
  enter: 0.4,
}

const sampleCache = new Map<string, Promise<AudioBuffer | null>>()

function loadSample(name: keyof typeof SAMPLES): Promise<AudioBuffer | null> {
  const ac = audio()
  if (!ac) return Promise.resolve(null)
  let p = sampleCache.get(name)
  if (!p) {
    p = fetch(SAMPLES[name])
      .then((r) => r.arrayBuffer())
      .then((b) => ac.decodeAudioData(b))
      .catch(() => null)
    sampleCache.set(name, p)
  }
  return p
}

async function playSample(name: keyof typeof SAMPLES) {
  if (!useSettings.getState().sound) return
  const ac = audio()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume()
  const buf = await loadSample(name)
  if (!buf) return
  const src = ac.createBufferSource()
  src.buffer = buf
  const g = ac.createGain()
  g.gain.value = SAMPLE_GAIN[name]
  src.connect(g).connect(ac.destination)
  src.start()
}

const medieval = () => useSettings.getState().skin === 'medieval'

export const sfx = {
  open: () => (medieval() ? void playSample('affirm') : blip(660, 0.05)),
  close: () => (medieval() ? void playSample('close') : blip(330, 0.045)),
  // taps fire too often for a 2s sample — the pluck holds this chair
  tap: () => blip(880, 0.03, 0.025),
  /* the mode-switch ceremony — call on entering medieval, any skin.
     Also warms the open/close buffers so the first window is on time. */
  enterMedieval: () => {
    void playSample('enter')
    void loadSample('affirm')
    void loadSample('close')
  },
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
