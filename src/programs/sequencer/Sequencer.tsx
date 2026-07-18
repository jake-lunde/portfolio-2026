'use client'

import { useEffect, useRef, useState } from 'react'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import styles from './sequencer.module.css'

/* SEQ-16 — a pocket step sequencer in the Teenage Engineering spirit,
   erring hard on the side of simplicity: 16 steps × N voices, all
   synthesized. Classic kit: kick = sine drop, snare = filtered noise,
   blip = square wave at a selectable note. Medieval kit swaps in
   CLAV/FLUTE/BELL/MONK (see playersFor below). BPM stepper, four local
   save slots. Tunes live in localStorage — your machine, your mixtape. */

const STEPS = 16
const CLASSIC_VOICES = ['KICK', 'SNARE', 'BLIP'] as const
const MEDIEVAL_VOICES = ['CLAV', 'FLUTE', 'BELL', 'MONK'] as const

function voicesFor(skin: string): readonly string[] {
  if (skin === 'medieval') return MEDIEVAL_VOICES
  return CLASSIC_VOICES
}

const NOTES = [
  { label: 'C4', hz: 261.63 },
  { label: 'E4', hz: 329.63 },
  { label: 'G4', hz: 392.0 },
  { label: 'A4', hz: 440.0 },
  { label: 'C5', hz: 523.25 },
] as const
const SLOTS = ['A', 'B', 'C', 'D'] as const
const STORE_KEY = 'lunde-seq-slots'

type Grid = boolean[][]
const emptyGrid = (voices: readonly string[]): Grid => voices.map(() => Array(STEPS).fill(false))

// save slots are shared across skins/kits; if a slot was saved under a
// different-sized voice pack, reshape it to the current kit rather than
// index out of bounds (a bare `grid[v]` on a missing row would crash)
const reshapeGrid = (g: Grid, count: number): Grid =>
  Array.from({ length: count }, (_, i) => g[i] ?? Array(STEPS).fill(false))

let ctx: AudioContext | null = null
const audio = () => {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function playKick(ac: AudioContext, t: number) {
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, t)
  osc.frequency.exponentialRampToValueAtTime(48, t + 0.16)
  g.gain.setValueAtTime(0.5, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
  osc.connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.3)
}

function playSnare(ac: AudioContext, t: number) {
  const len = 0.14
  const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = ac.createBufferSource()
  src.buffer = buf
  const f = ac.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 1400
  const g = ac.createGain()
  g.gain.setValueAtTime(0.32, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + len)
  src.connect(f).connect(g).connect(ac.destination)
  src.start(t)
}

function playBlip(ac: AudioContext, t: number, hz: number) {
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'square'
  osc.frequency.value = hz
  g.gain.setValueAtTime(0.11, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  osc.connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.14)
}

/* ---- medieval voice pack ---- */

// CLAV — plucked: two detuned squares through a lowpass sweeping down,
// instant attack, fast exponential decay
function playClav(ac: AudioContext, t: number, hz: number) {
  const dur = 0.15
  const filt = ac.createBiquadFilter()
  filt.type = 'lowpass'
  filt.frequency.setValueAtTime(3000, t)
  filt.frequency.exponentialRampToValueAtTime(800, t + dur)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.3, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  filt.connect(g).connect(ac.destination)
  ;[hz, hz * 1.005].forEach((f) => {
    const osc = ac.createOscillator()
    osc.type = 'square'
    osc.frequency.value = f
    osc.connect(filt)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  })
}

// FLUTE — sine + 5Hz vibrato (±6 cents via detune), soft attack/decay,
// plus a breathy bandpassed-noise layer
function playFlute(ac: AudioContext, t: number, hz: number) {
  const dur = 0.4
  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = hz
  const lfo = ac.createOscillator()
  lfo.frequency.value = 5
  const lfoGain = ac.createGain()
  lfoGain.gain.value = 6 // cents
  lfo.connect(lfoGain).connect(osc.detune)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.22, t + 0.04)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.04 + dur)
  osc.connect(g).connect(ac.destination)
  lfo.start(t)
  osc.start(t)
  lfo.stop(t + dur + 0.1)
  osc.stop(t + dur + 0.1)

  const len = dur + 0.05
  const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  const bp = ac.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = hz * 2
  bp.Q.value = 1.2
  const ng = ac.createGain()
  ng.gain.setValueAtTime(0.08, t)
  ng.gain.exponentialRampToValueAtTime(0.001, t + len)
  src.connect(bp).connect(ng).connect(ac.destination)
  src.start(t)
}

// BELL — 2-operator FM: modulator at f*2.76 with a decaying index (in Hz
// deviation, scaled ~f*4) driving the carrier's frequency
function playBell(ac: AudioContext, t: number, hz: number) {
  const dur = 1.2
  const carrier = ac.createOscillator()
  carrier.type = 'sine'
  carrier.frequency.value = hz
  const modulator = ac.createOscillator()
  modulator.type = 'sine'
  modulator.frequency.value = hz * 2.76
  const deviation = hz * 4
  const modGain = ac.createGain()
  modGain.gain.setValueAtTime(8 * deviation, t)
  modGain.gain.exponentialRampToValueAtTime(0.01 * deviation, t + 0.8)
  modulator.connect(modGain).connect(carrier.frequency)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.3, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  carrier.connect(g).connect(ac.destination)
  modulator.start(t)
  carrier.start(t)
  modulator.stop(t + dur + 0.05)
  carrier.stop(t + dur + 0.05)
}

// MONK — bass drone: sawtooth an octave down through two parallel "oo"
// bandpass formants, sustained for the step length then released
function playMonk(ac: AudioContext, t: number, hz: number, stepDur: number) {
  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = hz / 2
  const bp1 = ac.createBiquadFilter()
  bp1.type = 'bandpass'
  bp1.frequency.value = 500
  bp1.Q.value = 5
  const bp2 = ac.createBiquadFilter()
  bp2.type = 'bandpass'
  bp2.frequency.value = 800
  bp2.Q.value = 5
  const g1 = ac.createGain()
  g1.gain.value = 0.5
  const g2 = ac.createGain()
  g2.gain.value = 0.5
  const g = ac.createGain()
  const attackEnd = t + 0.1
  const sustainEnd = Math.max(attackEnd + 0.01, t + stepDur)
  const releaseEnd = sustainEnd + 0.5
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.22, attackEnd)
  g.gain.setValueAtTime(0.22, sustainEnd)
  g.gain.exponentialRampToValueAtTime(0.001, releaseEnd)
  osc.connect(bp1).connect(g1).connect(g)
  osc.connect(bp2).connect(g2).connect(g)
  g.connect(ac.destination)
  osc.start(t)
  osc.stop(releaseEnd + 0.05)
}

type VoicePlayer = (ac: AudioContext, t: number, hz: number, stepDur: number) => void

const CLASSIC_PLAYERS: VoicePlayer[] = [
  (ac, t) => playKick(ac, t),
  (ac, t) => playSnare(ac, t),
  (ac, t, hz) => playBlip(ac, t, hz),
]

const MEDIEVAL_PLAYERS: VoicePlayer[] = [
  (ac, t, hz) => playClav(ac, t, hz),
  (ac, t, hz) => playFlute(ac, t, hz),
  (ac, t, hz) => playBell(ac, t, hz),
  (ac, t, hz, stepDur) => playMonk(ac, t, hz, stepDur),
]

function playersFor(skin: string): VoicePlayer[] {
  if (skin === 'medieval') return MEDIEVAL_PLAYERS
  return CLASSIC_PLAYERS
}

const readSlots = (): Record<string, { bpm: number; grid: Grid; note: number }> => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export default function Sequencer() {
  const skin = useSettings((s) => s.skin)
  const voices = voicesFor(skin)
  const [grid, setGrid] = useState<Grid>(() => emptyGrid(voicesFor(skin)))
  const [bpm, setBpm] = useState(112)
  const [note, setNote] = useState(4)
  const [playing, setPlaying] = useState(false)
  const [step, setStep] = useState(-1)
  const [saveArmed, setSaveArmed] = useState(false)
  const [slots, setSlots] = useState<Record<string, unknown>>({})

  const gridRef = useRef(grid)
  gridRef.current = grid
  const noteRef = useRef(note)
  noteRef.current = note
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  const stepRef = useRef(0)
  const playersRef = useRef(playersFor(skin))
  playersRef.current = playersFor(skin)
  const prevSkin = useRef(skin)

  useEffect(() => setSlots(readSlots()), [])

  // switching skins swaps the whole kit (3 rows ↔ 4 rows) — clear the
  // pattern rather than orphan rows that no longer have a matching voice
  useEffect(() => {
    if (prevSkin.current !== skin) {
      prevSkin.current = skin
      setPlaying(false)
      setGrid(emptyGrid(voicesFor(skin)))
    }
  }, [skin])

  // the clock: one 16th per tick, scheduled slightly ahead
  useEffect(() => {
    if (!playing) {
      setStep(-1)
      return
    }
    const ac = audio()
    stepRef.current = 0
    let alive = true

    const tick = () => {
      if (!alive) return
      const s = stepRef.current % STEPS
      const t = ac.currentTime + 0.03
      const g = gridRef.current
      const hz = NOTES[noteRef.current].hz
      const stepDur = 60 / bpmRef.current / 4
      const players = playersRef.current
      players.forEach((play, v) => {
        if (g[v]?.[s]) play(ac, t, hz, stepDur)
      })
      setStep(s)
      stepRef.current++
      timer = setTimeout(tick, stepDur * 1000)
    }
    let timer = setTimeout(tick, 0)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [playing])

  const toggle = (v: number, s: number) => {
    setGrid((cur) => cur.map((row, i) => (i === v ? row.map((on, j) => (j === s ? !on : on)) : row)))
  }

  const slotClick = (slot: string) => {
    const all = readSlots()
    if (saveArmed) {
      all[slot] = { bpm, grid, note }
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(all))
      } catch {}
      setSlots(all)
      setSaveArmed(false)
      sfx.open()
      metric('seq_save')
    } else if (all[slot]) {
      setGrid(reshapeGrid(all[slot].grid, voices.length))
      setBpm(all[slot].bpm)
      setNote(all[slot].note ?? 4)
      sfx.tap()
    }
  }

  return (
    <div className={styles.seq}>
      <div className={styles.head}>
        <span className={styles.brand}>SEQ-16</span>
        <span className={styles.brandSub}>POCKET SEQUENCER · {voices.length} VOICES · {STEPS} STEPS</span>
      </div>

      <div className={styles.gridWrap}>
        {voices.map((name, v) => (
          <div key={name} className={styles.rowWrap}>
            <span className={styles.voice}>{name}</span>
            <div className={styles.row} role="group" aria-label={`${name} steps`}>
              {(grid[v] ?? []).map((on, s) => (
                <button
                  key={s}
                  className={styles.step}
                  aria-pressed={on}
                  aria-label={`${name} step ${s + 1}`}
                  data-beat={s % 4 === 0 || undefined}
                  data-head={s === step || undefined}
                  onClick={() => toggle(v, s)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.play}
          aria-pressed={playing}
          onClick={() => {
            setPlaying((p) => !p)
            if (!playing) metric('seq_play')
          }}
        >
          {playing ? '■ STOP' : '▶ PLAY'}
        </button>

        <div className={styles.bpm} role="group" aria-label="Tempo">
          <button className={styles.bpmBtn} onClick={() => setBpm((b) => Math.max(60, b - 4))} aria-label="Slower">
            −
          </button>
          <span className={styles.bpmVal}>{bpm} BPM</span>
          <button className={styles.bpmBtn} onClick={() => setBpm((b) => Math.min(180, b + 4))} aria-label="Faster">
            +
          </button>
        </div>

        <div className={styles.notes} role="group" aria-label="Blip note">
          {NOTES.map((n, i) => (
            <button
              key={n.label}
              className={styles.noteChip}
              aria-pressed={i === note}
              onClick={() => {
                setNote(i)
                playBlip(audio(), audio().currentTime + 0.02, n.hz)
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.slotRow}>
        <button className={styles.saveBtn} aria-pressed={saveArmed} onClick={() => setSaveArmed((v) => !v)}>
          {saveArmed ? 'PICK A SLOT…' : '⊕ SAVE'}
        </button>
        {SLOTS.map((slot) => (
          <button
            key={slot}
            className={styles.slot}
            data-full={slot in slots || undefined}
            data-armed={saveArmed || undefined}
            onClick={() => slotClick(slot)}
            aria-label={`Slot ${slot}${slot in slots ? ', saved tune' : ', empty'}`}
          >
            {slot}
            <span className={styles.slotDot} aria-hidden="true" />
          </button>
        ))}
        <button className={styles.clear} onClick={() => { setGrid(emptyGrid(voices)); sfx.close() }}>
          ✕ CLEAR
        </button>
      </div>

      <p className={styles.hint}>TUNES SAVE TO THIS MACHINE ONLY — FOUR SLOTS, NO CLOUD, VERY 1992</p>
    </div>
  )
}
