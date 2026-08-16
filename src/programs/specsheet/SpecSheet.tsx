'use client'

import { useEffect, useState } from 'react'
import { Stamp } from '@/components/primitives/Stamp'
import { CustomizeButton } from '@/components/primitives/CustomizeButton'
import { CopyText as Copy } from '@/content/CopyText'
import { contrast, grade, resolveVar, toHex } from '@/lib/contrast'
import { PALETTE, readPicks, type Picks } from '@/lib/buildASkin'
import { REPO_SLUG, REPO_URL } from '@/lib/repo'
import { useSettings, type Skin } from '@/store/settings'
import styles from './specsheet.module.css'

/* SPEC.SHEET — a living design-system doc that documents LUNDE OS itself.
   Colors, contrast ratios and type read live from the real CSS custom
   properties via getComputedStyle, so the whole sheet re-derives when the
   theme OR skin flips. Color names and typeface names can't be read from
   the DOM (next/font hashes family names), so those are quoted per skin
   below — keep them in sync with layout.tsx and the skin token sets.
   Motion values are quoted truthfully from src/components/shell/Window.tsx.
   The playable half — SKIN BUILDER, where a visitor re-casts the two accent
   roles — is its own window (src/programs/skinbuilder/SkinBuilder.tsx),
   opened from this sheet's sticky title row. The sheet stays live while it
   is open: the observer below watches the <html> style attribute the
   builder's overrides are written to, so both windows agree on every tick. */

const COLOR_VARS: Array<{ name: string; label: string; against: 'paper' | 'ink' }> = [
  { name: '--surface', label: 'Paper', against: 'ink' },
  { name: '--surface-raised', label: 'Paper 2', against: 'ink' },
  { name: '--content', label: 'Ink', against: 'paper' },
  { name: '--content-muted', label: 'Ink Soft', against: 'paper' },
  { name: '--accent', label: 'Blue · system', against: 'paper' },
  { name: '--accent-expressive', label: 'Pink · expressive', against: 'ink' },
  { name: '--surface-inverse', label: 'Plate', against: 'paper' },
]

/* Per-skin quoted names — the two accents are the only chips whose NAME is
   skin-specific (the swatch + hex + ratio always read live regardless).
   Values from the active skin's token hexes: medieval accent #9E2B1E
   (vermilion) / expressive #B8860B (gold). Underwater has no tokens yet →
   classic names stand in, same fallback the gate uses. */
const ACCENT_NAMES: Record<Skin, { system: string; expressive: string }> = {
  classic: { system: 'Blue · system', expressive: 'Pink · expressive' },
  medieval: { system: 'Vermilion · system', expressive: 'Gold · expressive' },
  underwater: { system: 'Blue · system', expressive: 'Pink · expressive' },
}

/* Typeface names per skin, quoted from layout.tsx (next/font hashes the
   computed font-family, so it can't be read truthfully from the DOM). */
const TYPE_NAMES: Record<Skin, { display: string; body: string; mono: string }> = {
  classic: { display: 'Geist Pixel', body: 'Geist', mono: 'Geist Mono' },
  medieval: { display: 'MedievalSharp', body: 'Eagle Lake', mono: 'MedievalSharp' },
  underwater: { display: 'Geist Pixel', body: 'Geist', mono: 'Geist Mono' },
}

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

/* ---- how the system is actually made ----
   The sheet documents what LUNDE OS looks like; this section says what
   built it, and ends on the repo so the claim has an artifact behind it.
   Label plus copy key, rendered on the MOTION table's own rail (that
   label/value grid is the sheet's row shape, not a motion-only one).
   The prose lives in the copy layer so it can be rewritten from inside
   the machine; the labels are the machine's caps, like MOTION's. */
const BUILD: Array<[string, string]> = [
  ['TOKENS', 'spec-sheet.build.row.tokens'],
  ['FIGMA', 'spec-sheet.build.row.figma'],
  ['CATALOG', 'spec-sheet.build.row.catalog'],
  ['GATE', 'spec-sheet.build.row.gate'],
  ['PROGRAMS', 'spec-sheet.build.row.programs'],
]

export default function SpecSheet() {
  const [chips, setChips] = useState<Chip[]>([])
  const [picks, setPicks] = useState<Picks>({})
  const skin = useSettings((s) => s.skin)
  const accentNames = ACCENT_NAMES[skin] ?? ACCENT_NAMES.classic
  const typeNames = TYPE_NAMES[skin] ?? TYPE_NAMES.classic

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
      // the picker reads from the same source as the applied overrides, so
      // the swatch rings and the live tokens can never disagree
      setPicks(readPicks())
    }

    read()
    // re-derive when the theme OR skin attribute flips — a skin swaps the
    // entire token set, so the sheet must re-read, not just re-render.
    // 'style' catches SKIN BUILDER's inline overrides, including the ones
    // revalidate() drops when a flip invalidates them: with both windows
    // open side by side, a pick over there re-prints this table here.
    const obs = new MutationObserver(read)
    obs.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-skin', 'style'],
    })
    return () => obs.disconnect()
  }, [])

  return (
    <div className={styles.spec}>
      {/* The masthead stays put while the sheet scrolls under it: a spec
          sheet you can hand back to is one whose title is always on the
          page. Sticky against .windowBody (the window's scroll container),
          full-bleed so nothing ghosts through a side gutter, and opaque
          --surface so the rows pass BEHIND it. */}
      <div className={styles.titleRow}>
        <Copy k="spec-sheet.eyebrow" as="p" className={styles.eyebrow} />
      </div>

      <div className={styles.sheetBody}>
        {/* the sheet's one control, up top where a visitor meets it before
            any of the specimens below — same primitive Settings opens
            SKIN BUILDER from (src/components/primitives/CustomizeButton) */}
        <CustomizeButton />

        {/* ---------- color ---------- */}
        <div className={styles.sectionHead}>
          <span className={styles.secNo}>01 —</span>
          <Copy k="spec-sheet.section.color" as="span" className={styles.secLabel} />
        </div>
        <div className={styles.chips}>
          {chips.map((c) => {
            const pass = c.ratio >= 4.5
            /* the quoted per-skin accent name stops being true the moment a
               visitor re-casts the role in SKIN BUILDER — name the pick */
            const built =
              c.name === '--accent'
                ? picks.accent
                : c.name === '--accent-expressive'
                  ? picks.expressive
                  : undefined
            const builtName = built
              ? PALETTE.find((p) => p.hex === built)?.name
              : undefined
            const quoted =
              c.name === '--accent' ? accentNames.system : accentNames.expressive
            const label = builtName
              ? // keep the skin's own role word ("· system" / "· expressive"),
                // swap only the color name for the one the visitor picked
                `${builtName}${quoted.slice(quoted.indexOf(' · '))}`
              : c.name === '--accent'
                ? accentNames.system
                : c.name === '--accent-expressive'
                  ? accentNames.expressive
                  : c.label
            return (
              <div key={c.name} className={styles.chip}>
                <span
                  className={styles.swatch}
                  style={{ background: `var(${c.name})` }}
                  aria-hidden="true"
                />
                <span className={styles.chipMeta}>
                  <span className={styles.chipName}>{label}</span>
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
              Display · {typeNames.display} · 400 · tracking 0
            </span>
          </div>
          <div className={styles.specimen}>
            <span className={styles.specBody}>
              The quick brown fox jumps over the lazy dog.
            </span>
            <span className={styles.specLine}>
              Body · {typeNames.body} · 17px · leading 1.6
            </span>
          </div>
          <div className={styles.specimen}>
            <span className={styles.specMono}>DOC-ID · FIG.01 · 920.12 FT</span>
            <span className={styles.specLine}>
              Mono · {typeNames.mono} · labels · caps · tracking 0.14em
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

        {/* ---------- build ---------- */}
        <div className={styles.sectionHead}>
          <span className={styles.secNo}>05 —</span>
          <Copy k="spec-sheet.section.build" as="span" className={styles.secLabel} />
        </div>
        <div className={styles.motion}>
          {BUILD.map(([label, key]) => (
            <div key={key} className={styles.motionRow}>
              <span className={styles.motionK}>{label}</span>
              <Copy
                k={key}
                as="span"
                className={`${styles.motionV} ${styles.buildV}`}
              />
            </div>
          ))}
          {/* the artifact itself, last, so the section ends on the thing a
              visitor can go read rather than on a claim about it */}
          <div className={styles.motionRow}>
            <span className={styles.motionK}>SOURCE</span>
            <span className={`${styles.motionV} ${styles.buildV}`}>
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                {`github.com/${REPO_SLUG}`} ↗
              </a>
            </span>
          </div>
        </div>

        <Copy k="spec-sheet.foot" as="p" className={styles.foot} />
      </div>
    </div>
  )
}
