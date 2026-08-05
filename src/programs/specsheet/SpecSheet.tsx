'use client'

import { useEffect, useState } from 'react'
import { Stamp } from '@/components/primitives/Stamp'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import { contrast, grade, resolveVar, toHex } from '@/lib/contrast'
import {
  clear as clearBuild,
  pick as pickAccent,
  readPicks,
  type Picks,
  type Role,
} from '@/lib/buildASkin'
/* gateSfx carries the shared refuse/undo blips (its descending pair is the
   system's "no"); the accept is the ordinary tap */
import { gateSfx, sfx } from '@/lib/sound'
import { useSettings, type Skin } from '@/store/settings'
import styles from './specsheet.module.css'

/* SPEC.SHEET — a living design-system doc that documents LUNDE OS itself.
   Colors, contrast ratios and type read live from the real CSS custom
   properties via getComputedStyle, so the whole sheet re-derives when the
   theme OR skin flips. Color names and typeface names can't be read from
   the DOM (next/font hashes family names), so those are quoted per skin
   below — keep them in sync with layout.tsx and the skin token sets.
   Motion values are quoted truthfully from src/components/shell/Window.tsx.
   Section 02 is playable: BUILD A SKIN hands the visitor the two accent
   roles and refuses any pick that fails AA (gates + overrides live in
   src/lib/buildASkin.ts; the WCAG math is shared via src/lib/contrast.ts). */

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

/* ---- BUILD A SKIN: the 12 candidates ----
   Every one is already a CORE token primitive (tokens/core/color.json) —
   the visitor is re-casting the roles, never inventing a color. The hexes
   are literal here because these are the values being CHOSEN FROM: they
   have to exist before they can become a var. Source path per entry. */
const PALETTE: Array<{ name: string; hex: string; token: string }> = [
  { name: 'NASA Cobalt', hex: '#2036C8', token: 'color/nasa/cobalt' },
  { name: 'NASA Glow', hex: '#5C7CFF', token: 'color/nasa/glow' },
  { name: 'Lapis', hex: '#2F4C7E', token: 'color/lapis/blue' },
  { name: 'Vermilion', hex: '#9E2B1E', token: 'color/rubric/vermilion' },
  { name: 'Blood', hex: '#A32B1F', token: 'color/blood/base' },
  { name: 'Blood Light', hex: '#F08A7E', token: 'color/blood/light' },
  { name: 'Doppler Pink', hex: '#F2A6C2', token: 'color/doppler/pink' },
  { name: 'Gilt Gold', hex: '#B8860B', token: 'color/gilt/gold' },
  { name: 'Amber Light', hex: '#E0B755', token: 'color/amber/light' },
  { name: 'Amber', hex: '#5F4A0E', token: 'color/amber/base' },
  { name: 'Report Green', hex: '#2E4A38', token: 'color/report/green' },
  { name: 'Verdigris Light', hex: '#5FA87A', token: 'color/verdigris/light' },
]

const ROLES: Array<{ id: Role; labelKey: string; hintKey: string }> = [
  {
    id: 'accent',
    labelKey: 'spec-sheet.build.roleSystem',
    hintKey: 'spec-sheet.build.roleSystemHint',
  },
  {
    id: 'expressive',
    labelKey: 'spec-sheet.build.roleExpressive',
    hintKey: 'spec-sheet.build.roleExpressiveHint',
  },
]

/* The last thing the machine did, reported in one line. Static words are
   copy keys; only the candidate name and the computed ratio are data. */
type Status =
  | { kind: 'reset' }
  | {
      kind: 'verdict'
      ok: boolean
      name: string
      ratio: number
      against: 'paper' | 'ink'
      reasonKey: string
    }
  | null

// ---- motion values quoted from Window.tsx (keep in sync if the shell changes) ----
const MOTION: Array<[string, string]> = [
  ['Window open', 'spring · stiffness 480 · damping 34 · mass 0.7'],
  ['Window close', 'opacity + scale 0.97 · duration 0.14s'],
  ['Drag', 'momentum off · elastic 0.12'],
]

export default function SpecSheet() {
  const [chips, setChips] = useState<Chip[]>([])
  const [picks, setPicks] = useState<Picks>({})
  const [status, setStatus] = useState<Status>(null)
  const skin = useSettings((s) => s.skin)
  const theme = useSettings((s) => s.theme)
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
    // 'style' catches BUILD A SKIN's inline overrides, including the ones
    // revalidate() drops when a flip invalidates them.
    const obs = new MutationObserver(read)
    obs.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-skin', 'style'],
    })
    return () => obs.disconnect()
  }, [])

  // a flip re-grounds every gate, so the last verdict no longer describes
  // anything true — clear the line rather than let it lie
  useEffect(() => {
    setStatus(null)
  }, [skin, theme])

  const choose = (role: Role, candidate: (typeof PALETTE)[number]) => {
    const v = pickAccent(role, candidate.hex)
    setPicks(readPicks())
    if (v.ok) sfx.tap()
    else gateSfx.fail()
    setStatus({
      kind: 'verdict',
      ok: v.ok,
      name: candidate.name,
      ratio: v.ratio,
      /* the gate quotes the ground it actually judged by — for a mark that
         is whichever of paper/ink it separates from further */
      against: v.against,
      reasonKey: !v.ok
        ? role === 'accent'
          ? 'spec-sheet.build.reason.system'
          : 'spec-sheet.build.reason.marks'
        : role === 'accent'
          ? 'spec-sheet.build.reason.systemLive'
          : v.textRights
            ? 'spec-sheet.build.reason.textRights'
            : 'spec-sheet.build.reason.demoted',
    })
  }

  const reset = () => {
    clearBuild()
    setPicks({})
    setStatus({ kind: 'reset' })
    gateSfx.remove()
  }

  return (
    <div className={styles.spec}>
      <Copy k="spec-sheet.eyebrow" as="p" className={styles.eyebrow} />

      {/* ---------- color ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>01 —</span>
        <Copy k="spec-sheet.section.color" as="span" className={styles.secLabel} />
      </div>
      <div className={styles.chips}>
        {chips.map((c) => {
          const pass = c.ratio >= 4.5
          /* the quoted per-skin accent name stops being true the moment a
             visitor re-casts the role in 02 — name the pick instead */
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

      {/* ---------- build a skin ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>02 —</span>
        <Copy k="spec-sheet.section.build" as="span" className={styles.secLabel} />
      </div>
      <Copy k="spec-sheet.build.intro" as="p" className={styles.buildIntro} />
      <div className={styles.build}>
        {ROLES.map((r) => (
          <div key={r.id} className={styles.buildRow}>
            <span className={styles.buildRole}>
              <Copy k={r.labelKey} as="span" className={styles.buildRoleName} />
              <Copy k={r.hintKey} as="span" className={styles.buildRoleHint} />
            </span>
            <div
              className={styles.buildSwatches}
              role="group"
              aria-label={t(r.labelKey, skin)}
            >
              {PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className={styles.buildSwatch}
                  /* the only hardcoded hexes in the sheet — see PALETTE */
                  style={{ background: c.hex }}
                  aria-pressed={picks[r.id] === c.hex}
                  aria-label={`${c.name} ${c.hex}`}
                  onClick={() => choose(r.id, c)}
                />
              ))}
            </div>
          </div>
        ))}
        <div className={styles.buildFoot}>
          <button
            type="button"
            className={styles.buildReset}
            onClick={reset}
            disabled={!picks.accent && !picks.expressive}
          >
            <Copy k="spec-sheet.build.reset" as="span" />
          </button>
          <p className={styles.buildStatus} aria-live="polite">
            {status === null ? (
              <Copy k="spec-sheet.build.idle" as="span" />
            ) : status.kind === 'reset' ? (
              <>
                <Copy
                  k="spec-sheet.build.reset"
                  as="span"
                  className={styles.verdictOk}
                />
                {' — '}
                <Copy k="spec-sheet.build.reason.reset" as="span" />
              </>
            ) : (
              <>
                <Copy
                  k={
                    status.ok
                      ? 'spec-sheet.build.applied'
                      : 'spec-sheet.build.refused'
                  }
                  as="span"
                  className={status.ok ? styles.verdictOk : styles.verdictNo}
                />
                {' — '}
                <span className={styles.statusName}>{status.name}</span>{' '}
                <span className={styles.statusRatio}>
                  {status.ratio.toFixed(1)}:1
                </span>{' '}
                <Copy
                  k={
                    status.against === 'paper'
                      ? 'spec-sheet.build.againstPaper'
                      : 'spec-sheet.build.againstInk'
                  }
                  as="span"
                />
                {' · '}
                <Copy k={status.reasonKey} as="span" />
              </>
            )}
          </p>
        </div>
      </div>

      {/* ---------- type ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>03 —</span>
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
        <span className={styles.secNo}>04 —</span>
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
        <span className={styles.secNo}>05 —</span>
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
