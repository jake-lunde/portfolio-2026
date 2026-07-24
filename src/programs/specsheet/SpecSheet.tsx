'use client'

import { useEffect, useState } from 'react'
import { Stamp } from '@/components/primitives/Stamp'
import { CopyText as Copy } from '@/content/CopyText'
import styles from './specsheet.module.css'

/* SPEC.SHEET — a living design-system doc that documents LUNDE OS itself.
   Colors, contrast ratios and type read live from the real CSS custom
   properties via getComputedStyle, so the whole sheet re-derives when the
   theme flips. Motion values are quoted truthfully from
   src/components/shell/Window.tsx. GL design-system feed is stubbed. */

// ---- color math (real WCAG relative-luminance) ----

type RGB = [number, number, number]

function parseColor(input: string): RGB | null {
  // resolved computed colors come back as "rgb(r, g, b)" / "rgba(...)"
  const m = input.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()))
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null
  return [parts[0], parts[1], parts[2]]
}

function toHex([r, g, b]: RGB): string {
  const h = (n: number) =>
    Math.round(n).toString(16).padStart(2, '0').toUpperCase()
  return `#${h(r)}${h(g)}${h(b)}`
}

function channelLum(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function luminance([r, g, b]: RGB): number {
  return 0.2126 * channelLum(r) + 0.7152 * channelLum(g) + 0.0722 * channelLum(b)
}

function contrast(a: RGB, b: RGB): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

function grade(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA·LG'
  return 'FAIL'
}

// resolve a CSS var to a concrete rgb() by letting the browser compute it
function resolveVar(el: HTMLElement, name: string): RGB | null {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  probe.style.display = 'none'
  el.appendChild(probe)
  const computed = getComputedStyle(probe).color
  el.removeChild(probe)
  return parseColor(computed)
}

const COLOR_VARS: Array<{ name: string; label: string; against: 'paper' | 'ink' }> = [
  { name: '--surface', label: 'Paper', against: 'ink' },
  { name: '--surface-raised', label: 'Paper 2', against: 'ink' },
  { name: '--content', label: 'Ink', against: 'paper' },
  { name: '--content-muted', label: 'Ink Soft', against: 'paper' },
  { name: '--accent', label: 'Blue · system', against: 'paper' },
  { name: '--accent-expressive', label: 'Pink · expressive', against: 'ink' },
  { name: '--surface-inverse', label: 'Plate', against: 'paper' },
]

type Chip = {
  name: string
  label: string
  hex: string
  ratio: number
  againstLabel: string
}

// ---- motion values quoted from Window.tsx (keep in sync if the shell changes) ----
const MOTION: Array<[string, string]> = [
  ['Window open', 'spring · stiffness 480 · damping 34 · mass 0.7'],
  ['Window close', 'opacity + scale 0.97 · duration 0.14s'],
  ['Drag', 'momentum off · elastic 0.12'],
]

export default function SpecSheet() {
  const [chips, setChips] = useState<Chip[]>([])

  useEffect(() => {
    const root = document.documentElement

    const read = () => {
      const paper = resolveVar(document.body, '--surface')
      const ink = resolveVar(document.body, '--content')
      const next: Chip[] = []
      for (const cv of COLOR_VARS) {
        const rgb = resolveVar(document.body, cv.name)
        if (!rgb) continue
        const base = cv.against === 'paper' ? paper : ink
        const ratio = base ? contrast(rgb, base) : 0
        next.push({
          name: cv.name,
          label: cv.label,
          hex: toHex(rgb),
          ratio,
          againstLabel: cv.against === 'paper' ? 'on paper' : 'on ink',
        })
      }
      setChips(next)
    }

    read()
    // re-derive when the theme attribute flips
    const obs = new MutationObserver(read)
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  return (
    <div className={styles.spec}>
      <Copy k="spec-sheet.eyebrow" as="p" className={styles.eyebrow} />
      <div className={styles.banner}>
        <Stamp>
          <Copy k="spec-sheet.banner" as="span" />
        </Stamp>
      </div>

      {/* ---------- color ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>01 —</span>
        <Copy k="spec-sheet.section.color" as="span" className={styles.secLabel} />
      </div>
      <div className={styles.chips}>
        {chips.map((c) => {
          const pass = c.ratio >= 4.5
          return (
            <div key={c.name} className={styles.chip}>
              <span
                className={styles.swatch}
                style={{ background: `var(${c.name})` }}
                aria-hidden="true"
              />
              <span className={styles.chipMeta}>
                <span className={styles.chipName}>{c.label}</span>
                <span className={styles.chipVar}>{c.name}</span>
              </span>
              <span className={styles.chipHex}>{c.hex}</span>
              <span
                className={`${styles.chipRatio} ${pass ? styles.pass : styles.fail}`}
              >
                {c.ratio.toFixed(1)}:1 {grade(c.ratio)} {pass ? '✓' : '✗'}
                <span className={styles.chipAgainst}>{c.againstLabel}</span>
              </span>
            </div>
          )
        })}
      </div>

      {/* ---------- type ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>02 —</span>
        <Copy k="spec-sheet.section.type" as="span" className={styles.secLabel} />
      </div>
      <div className={styles.typeStack}>
        <div className={styles.specimen}>
          <span className={styles.specDisplay}>AaBb 0123</span>
          <span className={styles.specLine}>
            Display · Geist Pixel · 400 · tracking 0
          </span>
        </div>
        <div className={styles.specimen}>
          <span className={styles.specBody}>
            The quick brown fox jumps over the lazy dog.
          </span>
          <span className={styles.specLine}>
            Body · Geist · 17px · leading 1.6
          </span>
        </div>
        <div className={styles.specimen}>
          <span className={styles.specMono}>DOC-ID · FIG.01 · 920.12 FT</span>
          <span className={styles.specLine}>
            Mono · Geist Mono · labels · caps · tracking 0.14em
          </span>
        </div>
      </div>

      {/* ---------- motion ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>03 —</span>
        <Copy k="spec-sheet.section.motion" as="span" className={styles.secLabel} />
      </div>
      <div className={styles.motion}>
        {MOTION.map(([k, v]) => (
          <div key={k} className={styles.motionRow}>
            <span className={styles.motionK}>{k}</span>
            <span className={styles.motionV}>{v}</span>
          </div>
        ))}
      </div>

      {/* ---------- components ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>04 —</span>
        <Copy k="spec-sheet.section.components" as="span" className={styles.secLabel} />
      </div>
      <div className={styles.components}>
        <div className={styles.componentCell}>
          <div className={styles.componentStage}>
            <Stamp>Approved</Stamp>
          </div>
          <span className={styles.partNo}>CMP-01 · Stamp</span>
        </div>
        <div className={styles.componentCell}>
          <div className={styles.componentStage}>
            <button type="button" className={styles.demoBtn}>
              Open
            </button>
          </div>
          <span className={styles.partNo}>CMP-02 · Button · primary</span>
        </div>
      </div>

      <Copy k="spec-sheet.foot" as="p" className={styles.foot} />
    </div>
  )
}
