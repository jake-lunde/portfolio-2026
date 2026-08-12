import { useEffect, useReducer } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

/* TYPE RAMP — the bench where type rulings get made.
 *
 * The token ledger holds ~70 "snap candidates": UI text (mostly mono) sitting
 * one size or tracking step off its nearest --type-* role. Each one is a
 * ten-second call IF the roles are on the same screen at true size. That is the
 * only job this board has.
 *
 * Everything is read LIVE — no value is transcribed. Each role is measured by
 * appending a probe <span> styled with that role's own custom properties and
 * reading getComputedStyle off it (same idiom as TokensBoard). The primitive
 * registries (--font-size-*, --leading-*, --weight-*, --tracking-*) are SCANNED
 * out of the loaded stylesheets rather than listed here, so a token added by the
 * build appears without touching this file. When a role's value matches no
 * primitive, the board says OFF-SCALE instead of guessing.
 */

/* ── the eleven roles ─────────────────────────────────────────────────────── */

const ROLES = [
  { key: 'display', ui: 'LUNDE OS' },
  { key: 'heading-1', ui: 'The site is the work' },
  { key: 'heading-2', ui: 'Three moves' },
  { key: 'heading-3', ui: 'What it did' },
  { key: 'body-lg', ui: 'A smaller promise, kept more often.' },
  { key: 'body', ui: 'The number moved; the meaning did not. So we designed the beat, not the chart.' },
  { key: 'body-sm', ui: 'Figures are indicative. The ledger is the source of truth.' },
  { key: 'label', ui: 'FILE   EDIT   VIEW   SPECIAL' },
  { key: 'caption', ui: 'PLATE 03 · ONBOARDING FLOW' },
  { key: 'micro', ui: 'REV 4 · 1992' },
  { key: 'mono', ui: '> npm run tokens:build' },
] as const

type Role = (typeof ROLES)[number]

/* One string for every role, so size is compared honestly and not through the
   length of the sample. Caps, lowercase, digits, and the system's middot. */
const SAMPLE = 'LUNDE OS · Handset 1992'

/* The mono-family roles — where every ledger candidate actually lands. */
const BENCH = ['label', 'caption', 'micro', 'mono'] as const

/* ── live reads ───────────────────────────────────────────────────────────── */

function raw(name: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Every custom property declared in the loaded stylesheets matching `match`.
    Scanned, not hardcoded, so the board follows the token build. */
function scanTokens(match: RegExp): string[] {
  const found = new Set<string>()
  if (typeof document === 'undefined') return []
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested)
      const style = (rule as CSSStyleRule).style
      if (!style) continue
      for (let i = 0; i < style.length; i++) {
        const prop = style.item(i)
        if (prop.startsWith('--') && match.test(prop)) found.add(prop)
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules)
    } catch {
      /* cross-origin sheet — nothing of ours lives there */
    }
  }
  return Array.from(found)
}

type Prim = { name: string; value: string; num: number }

/** Primitive registry for one axis, sorted small → large. `skip` drops the
    semantic aliases that share the same prefix (they live in the other tier). */
function prims(match: RegExp, skip?: RegExp): Prim[] {
  return scanTokens(match)
    .filter((name) => !skip?.test(name))
    .map((name) => ({ name, value: raw(name), num: parseFloat(raw(name)) }))
    .filter((p) => p.value !== '' && !Number.isNaN(p.num))
    .sort((a, b) => a.num - b.num)
}

const SIZE_PRIMS = () => prims(/^--font-size-/)
const LEAD_PRIMS = () => prims(/^--leading-/, /^--leading-body$/)
const WEIGHT_PRIMS = () => prims(/^--weight-/)
const TRACK_PRIMS = () => prims(/^--tracking-/)

const near = (a: number, b: number, eps: number) => Math.abs(a - b) <= eps

function nameForNum(list: Prim[], num: number, unit: string, eps: number): string | null {
  const hit = list.find(
    (p) => near(p.num, num, eps) && (unit === '' ? !/[a-z%]/i.test(p.value) : p.value.endsWith(unit)),
  )
  return hit ? hit.name : null
}

/** Which family alias a role points at, whether or not the engine has already
    substituted the var() chain. */
const FAMILY_ALIASES = ['--display', '--sans', '--mono', '--cjk']
function familyToken(key: string): string | null {
  const declared = raw(`--type-${key}-family`)
  const ref = declared.match(/^var\(\s*(--[\w-]+)\s*\)$/)
  if (ref) return ref[1]
  return FAMILY_ALIASES.find((alias) => raw(alias) === declared) ?? null
}

const firstFamily = (stack: string) => stack.split(',')[0].replace(/["']/g, '').trim()

/* ── measurement ──────────────────────────────────────────────────────────── */

type Metrics = {
  key: string
  familyName: string
  familyToken: string | null
  sizePx: number
  sizeToken: string | null
  sizeFluid: boolean
  weight: number
  weightToken: string | null
  hasTracking: boolean
  trackEm: number
  trackToken: string | null
  leadPx: number
  leadRatio: number
  leadToken: string | null
}

/** var() for one axis of one role. Assembled from the name, not written
    inline — tokens:doctor greps source for var-plus-prefix literals (code
    AND comments) and would read a template's prefix as a truncated token. */
const typeVar = (key: string, axis: string) => `var(${`--type-${key}-${axis}`})`

/** Style object built from a role's own vars — what the specimen renders with
    and what the probe measures, so the caption can never drift from the sample. */
function roleStyle(key: string): CSSProperties {
  const s: CSSProperties = {
    fontFamily: typeVar(key, 'family'),
    fontSize: typeVar(key, 'size'),
    fontWeight: typeVar(key, 'weight') as CSSProperties['fontWeight'],
    lineHeight: typeVar(key, 'leading'),
  }
  /* Six roles declare no tracking token; setting the var anyway would be
     invalid-at-computed-value-time. Left unset, and reported as NO TOKEN. */
  if (raw(`--type-${key}-tracking`)) s.letterSpacing = typeVar(key, 'tracking')
  return s
}

/* The same four axes, applied to a probe node in CSS property form. */
const PROBE_AXES: Array<[string, string]> = [
  ['font-family', 'family'],
  ['font-size', 'size'],
  ['font-weight', 'weight'],
  ['line-height', 'leading'],
]

function measure(key: string): Metrics {
  const empty: Metrics = {
    key,
    familyName: '—',
    familyToken: null,
    sizePx: NaN,
    sizeToken: null,
    sizeFluid: false,
    weight: NaN,
    weightToken: null,
    hasTracking: false,
    trackEm: 0,
    trackToken: null,
    leadPx: NaN,
    leadRatio: NaN,
    leadToken: null,
  }
  if (typeof document === 'undefined') return empty

  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.textContent = 'M'
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;white-space:pre'
  for (const [prop, axis] of PROBE_AXES) probe.style.setProperty(prop, typeVar(key, axis))
  if (raw(`--type-${key}-tracking`)) {
    probe.style.setProperty('letter-spacing', typeVar(key, 'tracking'))
  }
  document.body.appendChild(probe)
  const cs = getComputedStyle(probe)
  const sizePx = parseFloat(cs.fontSize)
  const weight = parseFloat(cs.fontWeight)
  const leadPx = cs.lineHeight === 'normal' ? NaN : parseFloat(cs.lineHeight)
  const trackPx = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing)
  const familyName = firstFamily(cs.fontFamily)
  probe.remove()

  const declaredTrack = raw(`--type-${key}-tracking`)
  const declaredEm = declaredTrack.endsWith('em') ? parseFloat(declaredTrack) : NaN
  const trackEm = Number.isNaN(declaredEm) ? (sizePx ? trackPx / sizePx : 0) : declaredEm
  const leadRatio = leadPx / sizePx

  return {
    key,
    familyName,
    familyToken: familyToken(key),
    sizePx,
    sizeToken: nameForNum(SIZE_PRIMS(), sizePx, 'px', 0.01),
    sizeFluid: raw(`--type-${key}-size`).includes('clamp('),
    weight,
    weightToken: nameForNum(WEIGHT_PRIMS(), weight, '', 0.5),
    hasTracking: declaredTrack !== '',
    trackEm,
    trackToken: trackEm === 0 ? null : nameForNum(TRACK_PRIMS(), trackEm, 'em', 0.002),
    leadPx,
    leadRatio,
    leadToken: nameForNum(LEAD_PRIMS(), leadRatio, '', 0.005),
  }
}

/* ── re-render on skin / mode change (same wiring as TokensBoard) ──────────── */

function useTokenTick() {
  const [, force] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const rerender = () => force()
    const obs = new MutationObserver(rerender)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-skin', 'data-theme'],
    })
    let channel: { on: (e: string, cb: () => void) => void; off: (e: string, cb: () => void) => void } | null =
      null
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { addons } = require('@storybook/preview-api')
      channel = addons.getChannel()
      channel?.on('globalsUpdated', rerender)
      channel?.on('storyRendered', rerender)
    } catch {
      /* not running inside Storybook — ignore */
    }
    /* Fluid roles (clamp + vw) change with the viewport, so the readout must
       follow the frame, not just the theme. */
    window.addEventListener('resize', rerender)
    return () => {
      obs.disconnect()
      channel?.off('globalsUpdated', rerender)
      channel?.off('storyRendered', rerender)
      window.removeEventListener('resize', rerender)
    }
  }, [])
}

/* ── board chrome ─────────────────────────────────────────────────────────── */
/* Chrome reads primitives directly — the one place that is correct, since the
   board exists to show them. Product CSS still uses semantic roles only. */

const mono = 'var(--mono)'
const ink = 'var(--content)'
const inkSoft = 'var(--content-muted)'
const hair = 'var(--border-width-subtle) solid var(--border)'

const machine: CSSProperties = {
  fontFamily: mono,
  fontSize: 'var(--font-size-2xs)',
  letterSpacing: 'var(--tracking-16)',
  textTransform: 'uppercase',
  color: inkSoft,
}

const readout: CSSProperties = {
  fontFamily: mono,
  fontSize: 'var(--font-size-xs)',
  color: ink,
  whiteSpace: 'nowrap',
}

const card: CSSProperties = {
  border: hair,
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-4)',
  background: 'var(--surface)',
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: mono,
        fontSize: 'var(--font-size-base)',
        letterSpacing: 'var(--tracking-16)',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        margin: '0 0 var(--space-3)',
      }}
    >
      {children}
    </h3>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontFamily: mono, fontSize: 'var(--font-size-xs)', lineHeight: 1.6, color: inkSoft, margin: '0 0 var(--space-6)', maxWidth: 620 }}>
      {children}
    </p>
  )
}

/** A flagged value: the board marks what it cannot account for. */
function Flag({ children }: { children: ReactNode }) {
  return <span style={{ color: 'var(--accent)' }}>{children}</span>
}

const px = (n: number) => (Number.isNaN(n) ? '—' : `${Math.round(n * 100) / 100}px`)
const em = (n: number) => `${Math.round(n * 1000) / 1000}em`
const sign = (n: number) => (n > 0 ? `+${Math.round(n * 1000) / 1000}` : `${Math.round(n * 1000) / 1000}`)

function Cell({ label, value, token }: { label: string; value: ReactNode; token: ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={machine}>{label}</div>
      <div style={{ ...readout, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ ...readout, color: inkSoft, overflow: 'hidden', textOverflow: 'ellipsis' }}>{token}</div>
    </div>
  )
}

/** The five-axis readout under every specimen — measured off the live DOM. */
function MetricRow({ m }: { m: Metrics }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-3)',
        paddingTop: 'var(--space-3)',
        borderTop: hair,
      }}
    >
      <Cell label="Family" value={m.familyName} token={m.familyToken ?? <Flag>UNMAPPED</Flag>} />
      <Cell
        label="Size"
        value={px(m.sizePx)}
        token={m.sizeFluid ? 'FLUID · CLAMP' : (m.sizeToken ?? <Flag>OFF-SCALE</Flag>)}
      />
      <Cell label="Weight" value={String(m.weight)} token={m.weightToken ?? <Flag>OFF-SCALE</Flag>} />
      <Cell
        label="Tracking"
        value={m.hasTracking ? em(m.trackEm) : '—'}
        token={m.hasTracking ? (m.trackToken ?? (m.trackEm === 0 ? 'ZERO' : <Flag>OFF-SCALE</Flag>)) : <Flag>NO TOKEN</Flag>}
      />
      <Cell
        label="Leading"
        value={`${px(m.leadPx)} · ×${Math.round(m.leadRatio * 100) / 100}`}
        token={m.leadToken ?? <Flag>OFF-SCALE</Flag>}
      />
    </div>
  )
}

/* ── boards ───────────────────────────────────────────────────────────────── */

function RoleCard({ role, n }: { role: Role; n: number }) {
  const m = measure(role.key)
  const style = roleStyle(role.key)
  return (
    <section style={{ ...card, padding: 'var(--space-4) var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div style={{ ...machine, color: ink }}>--type-{role.key}</div>
        <div style={machine}>
          {String(n).padStart(2, '0')} / {ROLES.length}
        </div>
      </div>
      <div
        style={{
          ...style,
          color: ink,
          marginTop: 'var(--space-3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {SAMPLE}
      </div>
      <div style={{ ...style, color: inkSoft, marginTop: 'var(--space-2)' }}>{role.ui}</div>
      <MetricRow m={m} />
    </section>
  )
}

function TypeRampBoard() {
  useTokenTick()
  return (
    <div style={{ color: ink }}>
      <Heading>Type ramp · eleven roles</Heading>
      <Note>
        Row one is the same string in every role, so size compares honestly. Row two is text each
        role actually carries. Every figure below the rule is measured off the rendered specimen at
        this instant — flip the Theme toolbar or resize and it re-reads. Anything the board cannot
        trace back to a primitive is marked.
      </Note>
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {ROLES.map((role, i) => (
          <RoleCard key={role.key} role={role} n={i + 1} />
        ))}
      </div>
    </div>
  )
}

/* The four mono roles, tight, on one screen — the actual judging surface. */
function MonoBenchBoard() {
  useTokenTick()
  const metrics = BENCH.map((key) => measure(key))
  const pairs: Array<[Metrics, Metrics]> = []
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) pairs.push([metrics[i], metrics[j]])
  }
  return (
    <div style={{ color: ink }}>
      <Heading>Mono bench · the four judging roles</Heading>
      <Note>
        Ledger candidates are mono UI text, so they land here. Same string, real size, no gap
        between them — the point is to see whether two roles are actually distinguishable before a
        snap is ruled. Deltas below are measured, not declared.
      </Note>
      <section style={{ ...card, display: 'grid', gap: 'var(--space-4)' }}>
        {metrics.map((m) => (
          <div key={m.key} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)' }}>
            <div style={{ ...machine, width: 96, flex: '0 0 auto' }}>{m.key}</div>
            <div style={{ ...roleStyle(m.key), color: ink, textTransform: 'uppercase' }}>
              FILE · EDIT · VIEW · 1992
            </div>
            <div style={{ ...readout, color: inkSoft, marginLeft: 'auto' }}>
              {px(m.sizePx)} / {m.hasTracking ? em(m.trackEm) : '—'} / {m.weight}
            </div>
          </div>
        ))}
      </section>

      <div style={{ ...machine, margin: 'var(--space-6) 0 var(--space-2)' }}>Pairwise deltas</div>
      <section style={{ ...card, display: 'grid', gap: 'var(--space-2)' }}>
        {pairs.map(([a, b]) => {
          const dSize = b.sizePx - a.sizePx
          const dTrack = b.trackEm - a.trackEm
          const sameSize = near(a.sizePx, b.sizePx, 0.01)
          const sameTrack = near(a.trackEm, b.trackEm, 0.002)
          return (
            <div
              key={`${a.key}-${b.key}`}
              style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'baseline', flexWrap: 'wrap' }}
            >
              <div style={{ ...readout, width: 200, flex: '0 0 auto' }}>
                {a.key} → {b.key}
              </div>
              <div style={{ ...readout, color: sameSize ? undefined : inkSoft, width: 120 }}>
                SIZE {sign(dSize)}px
              </div>
              <div style={{ ...readout, color: sameTrack ? undefined : inkSoft, width: 140 }}>
                TRACK {sign(dTrack)}em
              </div>
              <div style={{ ...machine, color: 'var(--accent)' }}>
                {sameSize && sameTrack ? 'Indistinguishable' : sameSize ? 'Tracking only' : sameTrack ? 'Size only' : ''}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

/* ── snap finder ──────────────────────────────────────────────────────────── */

type CandidateArgs = {
  text: string
  size: number
  tracking: number
  weight: number
  family: string
  uppercase: boolean
}

function SnapFinderBoard({ text, size, tracking, weight, family, uppercase }: CandidateArgs) {
  useTokenTick()
  const rows = ROLES.map((role) => measure(role.key)).sort(
    (a, b) => Number(b.familyToken === '--mono') - Number(a.familyToken === '--mono'),
  )
  return (
    <div style={{ color: ink }}>
      <Heading>Snap finder · one candidate, eleven roles</Heading>
      <Note>
        Why: the token-debt ledger (PR #6) holds ~70 pieces of mono UI text sitting one literal step
        off a named role — each needs a ruling: snap it to the role, or decide the difference is
        deliberate and name it. Eyeballing that across eleven roles is guesswork; this measures it.
      </Note>
      <Note>
        How: open the Controls panel and type one candidate&apos;s literal spec — the text itself,
        its px size, em tracking, weight, family (all readable off the ledger row, or INSPECT on the
        live site). Every role&apos;s measured distance appears below, per axis. Δ 0 on both axes is
        a free snap; a small Δ on one axis is the actual question — rule whether that step carries
        meaning. No score, no weighting: the call stays yours.
      </Note>

      <section style={{ ...card, background: 'var(--surface-raised)' }}>
        <div style={machine}>Candidate</div>
        <div
          style={{
            fontFamily: `var(${family})`,
            fontSize: `${size}px`,
            letterSpacing: `${tracking}em`,
            fontWeight: weight,
            textTransform: uppercase ? 'uppercase' : 'none',
            color: ink,
            marginTop: 'var(--space-2)',
          }}
        >
          {text}
        </div>
        <div style={{ ...readout, color: inkSoft, marginTop: 'var(--space-2)' }}>
          {family} · {size}px · {tracking}em · {weight}
        </div>
      </section>

      <div style={{ display: 'grid', gap: 'var(--space-1)', marginTop: 'var(--space-4)' }}>
        {rows.map((m) => {
          const dSize = m.sizePx - size
          const dTrack = m.trackEm - tracking
          const sizeHit = near(m.sizePx, size, 0.01)
          const trackHit = m.hasTracking && near(m.trackEm, tracking, 0.002)
          const exact = sizeHit && trackHit
          return (
            <div
              key={m.key}
              style={{
                ...card,
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--surface)',
                borderColor: exact ? 'var(--accent)' : 'var(--border)',
                display: 'flex',
                gap: 'var(--space-4)',
                alignItems: 'baseline',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ ...readout, width: 168, flex: '0 0 auto' }}>--type-{m.key}</div>
              <div style={{ ...readout, color: sizeHit ? undefined : inkSoft, width: 150 }}>
                {px(m.sizePx)} · Δ {sign(dSize)}px
              </div>
              <div style={{ ...readout, color: trackHit ? undefined : inkSoft, width: 175 }}>
                {m.hasTracking ? `${em(m.trackEm)} · Δ ${sign(dTrack)}em` : 'no tracking token'}
              </div>
              <div style={{ ...readout, color: inkSoft, width: 60 }}>{m.weight}</div>
              <div style={{ ...machine, color: exact ? 'var(--accent)' : inkSoft, marginLeft: 'auto' }}>
                {exact ? 'Exact' : sizeHit ? 'Size match' : trackHit ? 'Tracking match' : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── stories ──────────────────────────────────────────────────────────────── */

const meta = {
  title: 'Design System/Type ramp',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta

export const Ramp: StoryObj = {
  name: 'The eleven roles',
  render: () => <TypeRampBoard />,
}

export const MonoBench: StoryObj = {
  name: 'Mono bench',
  render: () => <MonoBenchBoard />,
}

export const SnapFinder: StoryObj<CandidateArgs> = {
  name: 'Snap finder',
  args: {
    text: 'FILE   EDIT   VIEW   SPECIAL',
    size: 10,
    tracking: 0.12,
    weight: 400,
    family: '--mono',
    uppercase: true,
  },
  argTypes: {
    text: { control: 'text', description: 'The candidate string, verbatim from the call site' },
    size: { control: { type: 'range', min: 7, max: 24, step: 0.5 }, description: 'Literal px at the call site' },
    tracking: { control: { type: 'range', min: 0, max: 0.24, step: 0.01 }, description: 'Literal em at the call site' },
    weight: { control: { type: 'select' }, options: [400, 500, 600, 700, 800] },
    family: { control: { type: 'inline-radio' }, options: ['--mono', '--sans', '--display'] },
    uppercase: { control: 'boolean' },
  },
  render: (args) => <SnapFinderBoard {...args} />,
}
