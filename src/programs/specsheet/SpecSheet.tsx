'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/primitives/Button'
import { Stamp } from '@/components/primitives/Stamp'
import { CustomizeButton } from '@/components/primitives/CustomizeButton'
import { Bubble, Feed, IdentityHeader } from '@/components/chat/Chat'
import { Metrics, PullQuote, Stat } from '@/components/case/CaseComponents'
import { CaseFooter } from '@/components/case/CaseFooter'
import { avatarFor } from '@/components/shell/crew'
import { Icon, type IconName } from '@/components/shell/Icon'
import { Box3D, useFinePointer } from '@/programs/shelf/Box3D'
import { InstallBar } from '@/programs/shelf/InstallBar'
import shelf from '@/programs/shelf/shelf.module.css'
import { VizShell } from '@/programs/visualizers/VizShell'
import { CopyText as Copy } from '@/content/CopyText'
import { contrast, grade, resolveVar, toHex } from '@/lib/contrast'
import { PALETTE, readPicks, type Picks } from '@/lib/buildASkin'
import { DURATIONS, SPRINGS } from '@/lib/motion'
import { REPO_SLUG, REPO_URL } from '@/lib/repo'
import { useSettings, type Skin } from '@/store/settings'
import styles from './specsheet.module.css'

/* SPEC.SHEET — a living design-system doc that documents LUNDE OS itself.
   Colors, contrast ratios, type and the scales read live from the real CSS
   custom properties via getComputedStyle, so the whole sheet re-derives
   when the theme OR skin flips. Color names and typeface names can't be
   read from the DOM (next/font hashes family names), so those are quoted
   per skin below — keep them in sync with layout.tsx and the skin token
   sets. Motion reads from SPRINGS/DURATIONS, the same import the shell
   animates on, so no spring number is retyped here.
   The parts sections render the REAL components, the same ones the
   Storybook catalog carries. Nothing on this sheet is a picture of a
   component; if it is on the page it is the shipping code.
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

/* ---- the sheet's running order ----
   Section numbers derive from this list instead of being typed into the
   markup, so adding a section between two others renumbers the sheet
   rather than asking a future editor to renumber it by hand. Each id is
   also its copy key (`spec-sheet.section.<id>`). */
const SECTIONS = [
  'color',
  'type',
  'scale',
  'motion',
  'components',
  'icons',
  'shell',
  'chat',
  'shelf',
  'plate',
  'case',
  'build',
] as const

type SectionId = (typeof SECTIONS)[number]

function SectionHead({ id }: { id: SectionId }) {
  const no = String(SECTIONS.indexOf(id) + 1).padStart(2, '0')
  return (
    <div className={styles.sectionHead}>
      <span className={styles.secNo}>{no} —</span>
      <Copy k={`spec-sheet.section.${id}`} as="span" className={styles.secLabel} />
    </div>
  )
}

/* ---- the scales, read live ----
   The bars, tiles and rules below are drawn WITH the token (width:
   var(--space-4) and so on), and the number beside each one is what the
   browser resolved that token to. The picture and the figure can't drift
   apart, and a retune in tokens/ moves both. Semantic roles for radius and
   border width; space has no semantic layer over it, the step is the name. */
const SCALE_GROUPS: Array<{
  label: string
  kind: 'space' | 'radius' | 'border'
  vars: string[]
}> = [
  {
    label: 'Space',
    kind: 'space',
    vars: [
      '--space-1',
      '--space-2',
      '--space-3',
      '--space-4',
      '--space-5',
      '--space-6',
      '--space-8',
      '--space-12',
    ],
  },
  {
    label: 'Radius',
    kind: 'radius',
    vars: ['--radius-control', '--radius-pill', '--radius-thinking', '--radius-circle'],
  },
  {
    label: 'Border',
    kind: 'border',
    vars: ['--border-width-subtle', '--border-width-default', '--border-width-strong'],
  },
]

const shortVar = (name: string) => name.replace(/^--(space|radius|border-width)-/, '')

// ---- motion, derived from the token pipeline ----
/* These rows used to be hand-typed strings that stayed true only as long as
   somebody remembered to retype them. SPRINGS and DURATIONS come from
   tokens/core/motion.json through motion.generated.ts, the same import the
   shell animates on, so retuning a spring in Figma retunes this table too.
   Two values are still written out because they are arguments at the
   Window.tsx call site rather than tokens: the close tween and the drag. */
const springLine = (s: { stiffness: number; damping: number; mass?: number }) =>
  ['spring', `stiffness ${s.stiffness}`, `damping ${s.damping}`]
    .concat(s.mass ? [`mass ${s.mass}`] : [])
    .join(' · ')

const MOTION: Array<[string, string]> = [
  ['Window open', springLine(SPRINGS.window)],
  ['Window close', 'opacity + scale 0.97 · duration 0.14s'],
  ['Panel flip', springLine(SPRINGS.deck)],
  ['Drag', 'momentum off · elastic 0.12'],
  ['Theme swap', `duration ${DURATIONS.theme}`],
]

/* Every icon the shell draws, in the order Icon.tsx declares the union.
   `PATHS` is module-private in there, so there is no runtime list to map.
   This one is hand-kept, and typing it as IconName[] means a rename over
   there fails the build here rather than dropping a glyph quietly. */
const ICON_NAMES: IconName[] = [
  'doc',
  'printer',
  'resume',
  'folder',
  'note',
  'ipod',
  'music',
  'reel',
  'wave',
  'book',
  'sliders',
  'rings',
  'camera',
  'puzzle',
  'brush',
  'chip',
  'trash',
  'bike',
  'flower',
  'disc',
  'plane',
  'mountain',
  'star',
  'nodes',
  'steps',
  'clipboard',
  'swatch',
  'smiley',
  'bubble',
  'mystery',
  'suggest',
]

/* ---- the machine's own chrome ----
   Every part in this table is running around this window as the sheet is
   read: the strip along the top, the pattern behind it, the crew walking
   the bottom of the desk. They are the one group of components the sheet
   cannot stage, because a second menu bar inside a window is a second
   machine, with its own skin switch and its own clock, arguing with the
   real one. So this section names them and lets the reader look up.
   Same rail and same copy-layer shape as BUILD below. */
const SHELL: Array<[string, string]> = [
  ['MENU BAR', 'spec-sheet.shell.row.menubar'],
  ['SKIN SWITCH', 'spec-sheet.shell.row.skinswitch'],
  ['WALLPAPER', 'spec-sheet.shell.row.wallpaper'],
  ['DESKTOP', 'spec-sheet.shell.row.desktop'],
  ['COMMAND.CTR', 'spec-sheet.shell.row.command'],
  ['CREW', 'spec-sheet.shell.row.crew'],
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

/* The shelf box's two printed faces. Box3D's own doc comment is explicit
   that `front`/`back` must carry `.face` themselves — that class reads the
   board material off `.plinth`, which Box3D's root sets, so a placeholder
   gets the real cardboard for free. The back also needs `.backFace`, which
   is what turns it around and pushes it to the far side of the board; with
   `.face` alone both panels sit on +d/2 and the back paints over the front,
   which is a box with two fronts and no depth. */
function BoxFace({ label, back = false }: { label: string; back?: boolean }) {
  return (
    <div
      className={`${shelf.face} ${back ? shelf.backFace : ''} ${styles.boxFace}`}
    >
      <span>{label}</span>
    </div>
  )
}

export default function SpecSheet() {
  const [chips, setChips] = useState<Chip[]>([])
  const [scales, setScales] = useState<Record<string, string>>({})
  const [picks, setPicks] = useState<Picks>({})
  const [flipped, setFlipped] = useState(false)
  const skin = useSettings((s) => s.skin)
  // measured once, exactly as the shelf does it — Box3D takes the answer as
  // a prop rather than asking per box
  const fine = useFinePointer()
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
      // the scales come off the same computed style the colors do, so a skin
      // that retunes its spacing prints its own numbers here
      const cs = getComputedStyle(document.body)
      const sizes: Record<string, string> = {}
      for (const g of SCALE_GROUPS) {
        for (const v of g.vars) sizes[v] = cs.getPropertyValue(v).trim()
      }
      setScales(sizes)
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
        <SectionHead id="color" />
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
        <SectionHead id="type" />
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

        {/* ---------- scale ---------- */}
        <SectionHead id="scale" />
        <div className={styles.typeStack}>
          {SCALE_GROUPS.map((g) => (
            <div key={g.label} className={styles.specimen}>
              <div className={styles.scaleRow}>
                {g.vars.map((v) => (
                  <div key={v} className={styles.scaleItem}>
                    {g.kind === 'space' && (
                      <span
                        className={styles.scaleBar}
                        style={{ width: `var(${v})` }}
                        aria-hidden="true"
                      />
                    )}
                    {g.kind === 'radius' && (
                      <span
                        className={styles.scaleTile}
                        style={{ borderRadius: `var(${v})` }}
                        aria-hidden="true"
                      />
                    )}
                    {g.kind === 'border' && (
                      <span
                        className={styles.scaleRule}
                        style={{ borderTopWidth: `var(${v})` }}
                        aria-hidden="true"
                      />
                    )}
                    <span className={styles.scaleCap}>
                      {shortVar(v)} · {scales[v] || '—'}
                    </span>
                  </div>
                ))}
              </div>
              <span className={styles.specLine}>
                {g.label} · drawn with the token · resolved live
              </span>
            </div>
          ))}
        </div>

        {/* ---------- motion ---------- */}
        <SectionHead id="motion" />
        <div className={styles.motion}>
          {MOTION.map(([k, v]) => (
            <div key={k} className={styles.motionRow}>
              <span className={styles.motionK}>{k}</span>
              <span className={styles.motionV}>{v}</span>
            </div>
          ))}
        </div>

        {/* ---------- components ---------- */}
        <SectionHead id="components" />
        <div className={styles.components}>
          <div className={styles.componentCell}>
            <div className={styles.componentStage}>
              <Stamp>Approved</Stamp>
            </div>
            <span className={styles.partNo}>CMP-01 · Stamp</span>
          </div>
          <div className={styles.componentCell}>
            <div className={styles.componentStage}>
              <Button tone="system" size="md">
                Open file
              </Button>
            </div>
            <span className={styles.partNo}>CMP-02 · Button · system</span>
          </div>
          <div className={styles.componentCell}>
            <div className={styles.componentStage}>
              <Button tone="expressive" size="md">
                Retry
              </Button>
            </div>
            <span className={styles.partNo}>CMP-03 · Button · expressive</span>
          </div>
          <div className={styles.componentCell}>
            <div className={styles.componentStage}>
              <span className={styles.meterHolder}>
                <InstallBar pct={64} role="meter" label="Case study · 64 percent" />
              </span>
            </div>
            <span className={styles.partNo}>CMP-04 · InstallBar · meter</span>
          </div>
        </div>

        {/* ---------- icons ---------- */}
        <SectionHead id="icons" />
        <div className={styles.componentCell}>
          <div className={styles.iconGrid}>
            {ICON_NAMES.map((n) => (
              <span key={n} className={styles.iconCell} title={n}>
                <Icon name={n} size={32} />
              </span>
            ))}
          </div>
          <span className={styles.partNo}>
            ICO-01 · Icon · {ICON_NAMES.length} glyphs · 32×32 · currentColor ·
            medieval swaps a subset in CSS
          </span>
        </div>

        {/* ---------- shell ---------- */}
        <SectionHead id="shell" />
        <div className={styles.componentCell}>
          <div className={styles.motion}>
            {SHELL.map(([label, key]) => (
              <div key={key} className={styles.motionRow}>
                <span className={styles.motionK}>{label}</span>
                <Copy
                  k={key}
                  as="span"
                  className={`${styles.motionV} ${styles.buildV}`}
                />
              </div>
            ))}
          </div>
          <span className={styles.partNo}>
            SHL-01 · running around this window right now · staged in here it
            would be a second machine
          </span>
        </div>

        {/* ---------- chat ---------- */}
        {/* The real ASK MY AI parts wearing sample lines. Both windows built
            on them (ASK MY AI, SUGGESTION BOX) are this shape in different
            copy, so one specimen documents both. The mask follows the live
            skin through avatarFor(), the same call every program makes. */}
        <SectionHead id="chat" />
        <div className={styles.componentCell}>
          <div className={styles.chatStage}>
            <IdentityHeader
              name="Fable"
              avatar={avatarFor('fable', skin)}
              role="orchestrator · on duty"
            />
            <Feed>
              <Bubble tone="user">What does the SUGGESTION BOX score?</Bubble>
              <Bubble tone="assistant" delay={0.07}>
                Feasibility, fit, and whether it is already on the roadmap. Doppler
                reads all three before the number lands.
              </Bubble>
              <Bubble tone="system" machine delay={0.14}>
                FILED. DOPPLER WILL JUDGE THIS ON THE NEXT PASS
              </Bubble>
              <Bubble
                machine
                delay={0.21}
                thinking={{ mark: avatarFor('doppler', skin), label: 'JUDGING' }}
              />
            </Feed>
          </div>
          <span className={styles.partNo}>
            CHT-01 · IdentityHeader · Feed · Bubble · user / assistant / machine /
            thinking
          </span>
        </div>

        {/* ---------- shelf ---------- */}
        {/* Box3D is the one part on this sheet you can put your hands on:
            six faces in a single preserve-3d context, flipped on the deck
            spring, tilting toward a fine pointer. The camera has to sit on
            an ancestor, since perspective applies to an element's children —
            that is what .boxStage is for, at the shelf's own 980px. */}
        <SectionHead id="shelf" />
        <div className={styles.componentCell}>
          <div className={styles.boxStage}>
            <Box3D
              className={styles.boxMetrics}
              front={<BoxFace label="FRONT" />}
              back={<BoxFace label="BACK" back />}
              flipped={flipped}
              fine={fine}
            />
          </div>
          <div className={styles.shelfControls}>
            <Button
              tone="system"
              size="sm"
              onClick={() => setFlipped((f) => !f)}
              aria-pressed={flipped}
            >
              Turn it over
            </Button>
          </div>
          <span className={styles.partNo}>
            SHF-01 · Box3D · six faces · one 3D context · flip on the deck spring
          </span>
        </div>

        {/* ---------- plate ---------- */}
        {/* Every visualizer opens on this plate, and the plate is dark in
            both themes, so the ink on it is --content-inverse and the accent
            is pinned to its luminous variant (viz.module.css). The window
            supplies the ground in the app; here the stage does. */}
        <SectionHead id="plate" />
        <div className={styles.componentCell}>
          <div className={styles.plateStage}>
            <VizShell>
              <p className={styles.plateLine}>VIZ.01 · SIGNAL LOCKED · 920.12 FT</p>
            </VizShell>
          </div>
          <span className={styles.partNo}>
            CRT-01 · VizShell · always-dark plate · glow in dark theme only
          </span>
        </div>

        {/* ---------- case study ---------- */}
        {/* The long-form half of the system. Sample content, real parts. */}
        <SectionHead id="case" />
        <div className={styles.componentCell}>
          <div className={styles.caseStage}>
            {/* Specimen numbers, said out loud: this sheet sits next to real
                case studies, and a plausible-looking metric here would read as
                one of theirs. */}
            <PullQuote cite="specimen, not a real quote">
              One sentence at the reading width, with room around it.
            </PullQuote>
            <Metrics>
              <Stat big="00.0%" label="Specimen · the shape of a stat, not a number from a project" />
              <Stat big="0 taps" label="Specimen · the secondary size" secondary />
            </Metrics>
            {/* Wired, not staged: both doors go where they go on a real case,
                because this is the shipping component and the sheet is
                standing inside the same machine it opens windows in. */}
            <CaseFooter next={{ name: 'Family Hub', live: true, slug: 'family-hub' }} />
          </div>
          <span className={styles.partNo}>CSE-01 · PullQuote · Metrics · Stat</span>
          <span className={styles.partNo}>CSE-02 · CaseFooter · both doors live</span>
        </div>

        {/* ---------- build ---------- */}
        <SectionHead id="build" />
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
