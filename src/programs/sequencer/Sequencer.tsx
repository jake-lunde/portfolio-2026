'use client'

import { useEffect, useRef, useState } from 'react'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'
import styles from './sequencer.module.css'

/* SEQ-16 — a pocket step sequencer in the Teenage Engineering spirit,
   erring hard on the side of simplicity: 16 steps × 3 voices, all
   synthesized (kick = sine drop, snare = filtered noise, blip = square
   wave at a selectable note), BPM stepper, four local save slots.
   Tunes live in localStorage — your machine, your mixtape. */

const STEPS = 16
const VOICES = ['KICK', 'SNARE', 'BLIP'] as const
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
const emptyGrid = (): Grid => VOICES.map(() => Array(STEPS).fill(false))

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

const readSlots = (): Record<string, { bpm: number; grid: Grid; note: number }> => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export default function Sequencer() {
  const [grid, setGrid] = useState<Grid>(emptyGrid)
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

  useEffect(() => setSlots(readSlots()), [])

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
      if (g[0][s]) playKick(ac, t)
      if (g[1][s]) playSnare(ac, t)
      if (g[2][s]) playBlip(ac, t, NOTES[noteRef.current].hz)
      setStep(s)
      stepRef.current++
      timer = setTimeout(tick, (60 / bpmRef.current / 4) * 1000)
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
      setGrid(all[slot].grid)
      setBpm(all[slot].bpm)
      setNote(all[slot].note ?? 4)
      sfx.tap()
    }
  }

  return (
    <div className={styles.seq}>
      <div className={styles.head}>
        <span className={styles.brand}>SEQ-16</span>
        <span className={styles.brandSub}>POCKET SEQUENCER · 3 VOICES · {STEPS} STEPS</span>
      </div>

      <div className={styles.gridWrap}>
        {VOICES.map((name, v) => (
          <div key={name} className={styles.rowWrap}>
            <span className={styles.voice}>{name}</span>
            <div className={styles.row} role="group" aria-label={`${name} steps`}>
              {grid[v].map((on, s) => (
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
        <button className={styles.clear} onClick={() => { setGrid(emptyGrid()); sfx.close() }}>
          ✕ CLEAR
        </button>
      </div>

      <p className={styles.hint}>TUNES SAVE TO THIS MACHINE ONLY — FOUR SLOTS, NO CLOUD, VERY 1992</p>
    </div>
  )
}
