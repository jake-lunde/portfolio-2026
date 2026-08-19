import { useEffect, useReducer } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { raw, resolvedLength, scanTokens } from './tokenProbe'

/* SCALE BOARDS — spacing, border width, radius, drawn at true size.
 *
 * Sibling of TokensBoard: same live-read discipline, same chrome. Every ramp is
 * drawn with the token itself (width: var(--spacing-layout-lg)), so the picture
 * cannot disagree with the value beside it. Two tiers are always shown together
 * and always labelled — SEMANTIC is what product CSS may use; PRIMITIVE is what
 * the semantic resolves to, shown so a ruling can name the step it snaps to.
 *
 * The spacing bars sit on a 4px grid backdrop drawn from --space-1, so an
 * off-grid value shows itself without being told.
 */

/* ── live reads ───────────────────────────────────────────────────────────── */

/* raw / resolvedLength / scanTokens live in tokenProbe.ts — TypeRamp had the
   same two functions letter for letter, which is the drift these boards are
   built to catch, one level up. */

/** Scanned names, falling back to the known set if stylesheet access is blocked. */
function namesOr(match: RegExp, fallback: string[], skip?: RegExp): string[] {
  const hits = scanTokens(match).filter((n) => !skip?.test(n))
  return (hits.length ? hits : fallback).filter((n) => raw(n) !== '')
}

const byValue = (a: string, b: string) => parseFloat(resolvedLength(a)) - parseFloat(resolvedLength(b))

/** The primitive a semantic token points at: the var() ref if the engine left
    one, otherwise the primitive holding the identical literal. Null = untraceable. */
function refOf(name: string, registry: string[]): string | null {
  const declared = raw(name)
  const ref = declared.match(/^var\(\s*(--[\w-]+)\s*\)$/)
  if (ref) return ref[1]
  return registry.find((p) => p !== name && raw(p) === declared) ?? null
}

/* ── tiers ────────────────────────────────────────────────────────────────── */

const SPACE_PRIMS = () =>
  namesOr(/^--space-\d+$/, ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-8', '--space-12']).sort(byValue)

const RADIUS_PRIMS = () =>
  namesOr(
    /^--radius-/,
    ['--radius-none', '--radius-xs', '--radius-sm', '--radius-md', '--radius-lg', '--radius-full'],
    /^--radius-(control|pill|circle|thinking)$/,
  ).sort(byValue)

const BORDER_PRIMS = () =>
  namesOr(
    /^--border-width-/,
    ['--border-width-hairline', '--border-width-thin', '--border-width-thick'],
    /^--border-width-(subtle|default|strong)$/,
  ).sort(byValue)

/** Semantic spacing, grouped by its own tier segment (component / layout) and
    ordered by value — so a new tier or step appears without editing this file. */
function spacingRamps(): Array<{ tier: string; tokens: string[] }> {
  const names = namesOr(/^--spacing-[a-z]+-[a-z0-9]+$/, [
    '--spacing-component-xs',
    '--spacing-component-sm',
    '--spacing-component-md',
    '--spacing-component-lg',
    '--spacing-component-xl',
    '--spacing-layout-sm',
    '--spacing-layout-md',
    '--spacing-layout-lg',
    '--spacing-layout-xl',
  ])
  const tiers = new Map<string, string[]>()
  for (const name of names) {
    const tier = name.match(/^--spacing-([a-z]+)-/)?.[1] ?? 'other'
    tiers.set(tier, [...(tiers.get(tier) ?? []), name])
  }
  return Array.from(tiers, ([tier, tokens]) => ({ tier, tokens: tokens.sort(byValue) })).sort((a, b) =>
    a.tier.localeCompare(b.tier),
  )
}

/* The tier this board exists to defend: named shapes, in order. `thinking`
   is the build-153 addition — the chat bubble's capsule while the machine
   works (999px literal; the core full radius is 50%, an ellipse on rects). */
const BORDER_SEMANTIC = ['--border-width-subtle', '--border-width-default', '--border-width-strong']
const RADIUS_SEMANTIC = ['--radius-control', '--radius-pill', '--radius-thinking', '--radius-circle']

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
    return () => {
      obs.disconnect()
      channel?.off('globalsUpdated', rerender)
      channel?.off('storyRendered', rerender)
    }
  }, [])
}

/* ── board chrome ─────────────────────────────────────────────────────────── */
/* Chrome reads primitives directly — correct here, since the board exists to
   show them. Product CSS still uses the semantic tier only. */

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

/* A 4px rule drawn from the grid's own base step. Off-grid values fall between
   the lines and say so without a caption. */
const grid = `repeating-linear-gradient(90deg, var(--border) 0 1px, transparent 1px var(--space-1))`

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
    <p
      style={{
        fontFamily: mono,
        fontSize: 'var(--font-size-xs)',
        lineHeight: 1.6,
        color: inkSoft,
        margin: '0 0 var(--space-4)',
        maxWidth: 620,
      }}
    >
      {children}
    </p>
  )
}

function TierLabel({ children }: { children: ReactNode }) {
  return <div style={{ ...machine, margin: 'var(--space-5) 0 var(--space-2)' }}>{children}</div>
}

function Flag({ children }: { children: ReactNode }) {
  return <span style={{ color: 'var(--accent)' }}>{children}</span>
}

/* ── spacing ──────────────────────────────────────────────────────────────── */

function SpacingRow({ token, registry }: { token: string; registry: string[] }) {
  const ref = refOf(token, registry)
  const value = resolvedLength(token)
  const base = parseFloat(resolvedLength('--space-1')) || 4
  const onGrid = value === '' || Math.abs(parseFloat(value) % base) < 0.01
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ ...readout, width: 210, flex: '0 0 auto' }}>{token}</div>
      <div
        aria-hidden
        style={{
          flex: '0 0 auto',
          width: 'var(--space-12)',
          maxWidth: 'none',
          height: 'var(--space-4)',
          background: grid,
          borderLeft: hair,
        }}
      >
        <div style={{ width: `var(${token})`, height: '100%', background: 'var(--content)' }} />
      </div>
      <div style={{ ...readout, color: inkSoft }}>
        {ref ?? <Flag>UNTRACED</Flag>} · {value || <Flag>MISSING</Flag>}
        {onGrid ? '' : <Flag> · OFF-GRID</Flag>}
      </div>
    </div>
  )
}

function SpacingBoard() {
  const primitives = SPACE_PRIMS()
  const ramps = spacingRamps()
  return (
    <div>
      <Heading>Spacing</Heading>
      <Note>
        Bars are drawn with the token itself, on a backdrop ruled at --space-1. The two semantic
        tiers overlap in size on purpose — the tier says what a number is FOR (inside a component,
        or between them), not how big it is. Pick by intent, then check the step.
      </Note>
      {ramps.map(({ tier, tokens }) => (
        <div key={tier}>
          <TierLabel>Semantic · {tier}</TierLabel>
          <section style={{ ...card, display: 'grid', gap: 'var(--space-2)' }}>
            {tokens.map((token) => (
              <SpacingRow key={token} token={token} registry={primitives} />
            ))}
          </section>
        </div>
      ))}
      <TierLabel>Primitive · not for product CSS</TierLabel>
      <section style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        {primitives.map((token) => (
          <div key={token} style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <div
              aria-hidden
              style={{ width: `var(${token})`, height: 'var(--space-6)', background: 'var(--content-muted)' }}
            />
            <div style={{ ...readout, color: inkSoft, fontSize: 'var(--font-size-2xs)' }}>
              {token.replace('--space-', '')} · {resolvedLength(token)}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

/* ── border width ─────────────────────────────────────────────────────────── */

function BorderBoard() {
  const primitives = BORDER_PRIMS()
  return (
    <div>
      <Heading>Border width</Heading>
      <Note>
        Three steps, a half-pixel apart at the bottom — which is exactly why they need to be judged
        adjacent rather than remembered. Rules first (thickness alone), boxes second (thickness as a
        component reads it).
      </Note>
      <TierLabel>Semantic</TierLabel>
      <section style={{ ...card, display: 'grid', gap: 'var(--space-4)' }}>
        {BORDER_SEMANTIC.map((token) => {
          const value = resolvedLength(token)
          return (
            <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ ...readout, width: 210, flex: '0 0 auto' }}>{token}</div>
              <div style={{ flex: '1 1 120px', minWidth: 80 }}>
                <div
                  aria-hidden
                  style={{ height: `var(${token})`, background: 'var(--content)', width: '100%' }}
                />
              </div>
              <div
                aria-hidden
                style={{
                  width: 'var(--space-12)',
                  height: 'var(--space-8)',
                  border: `var(${token}) solid var(--content)`,
                  borderRadius: 'var(--radius-control)',
                  flex: '0 0 auto',
                }}
              />
              <div style={{ ...readout, color: inkSoft, width: 230 }}>
                {refOf(token, primitives) ?? <Flag>UNTRACED</Flag>} · {value || <Flag>MISSING</Flag>}
              </div>
            </div>
          )
        })}
      </section>
      <TierLabel>Primitive · not for product CSS</TierLabel>
      <section style={{ ...card, display: 'grid', gap: 'var(--space-3)' }}>
        {primitives.map((token) => (
          <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ ...readout, color: inkSoft, width: 210, flex: '0 0 auto' }}>{token}</div>
            <div aria-hidden style={{ height: `var(${token})`, background: 'var(--content-muted)', flex: 1 }} />
            <div style={{ ...readout, color: inkSoft, width: 60 }}>{resolvedLength(token)}</div>
          </div>
        ))}
      </section>
    </div>
  )
}

/* ── radius ───────────────────────────────────────────────────────────────── */

const TILE = 'calc(var(--space-12) + var(--space-6))'

function RadiusBoard() {
  const primitives = RADIUS_PRIMS()
  return (
    <div>
      <Heading>Radius</Heading>
      <Note>
        Four shapes, four jobs: control, pill, thinking, circle. A radius ruling is a shape ruling —
        if two tiles below read as the same object, the system has one name too many. Thinking is
        judged on a rectangle: it is the chat bubble&apos;s capsule while the machine works, and on a
        square it would counterfeit circle.
      </Note>
      <TierLabel>Semantic</TierLabel>
      <section
        style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', alignItems: 'end' }}
      >
        {RADIUS_SEMANTIC.map((token) => (
          <div key={token} style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div
              aria-hidden
              style={{
                width: TILE,
                /* thinking only exists on a rectangle — capsule vs circle's
                   50% ellipse is the whole distinction the tile must show */
                height: token === '--radius-thinking' ? 'var(--space-8)' : TILE,
                background: 'var(--surface-raised)',
                border: `var(--border-width-strong) solid var(--content)`,
                borderRadius: `var(${token})`,
              }}
            />
            <div style={readout}>{token.replace('--radius-', '')}</div>
            <div style={{ ...readout, color: inkSoft, fontSize: 'var(--font-size-2xs)' }}>
              {refOf(token, primitives) ?? <Flag>UNTRACED</Flag>}
            </div>
            <div style={{ ...readout, color: inkSoft, fontSize: 'var(--font-size-2xs)' }}>
              {raw(token) || <Flag>MISSING</Flag>}
            </div>
          </div>
        ))}
      </section>
      <TierLabel>Primitive · not for product CSS</TierLabel>
      <section style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        {primitives.map((token) => (
          <div key={token} style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <div
              aria-hidden
              style={{
                width: 'var(--space-8)',
                height: 'var(--space-8)',
                background: 'var(--surface-raised)',
                border: hair,
                borderRadius: `var(${token})`,
              }}
            />
            <div style={{ ...readout, color: inkSoft, fontSize: 'var(--font-size-2xs)' }}>
              {token.replace('--radius-', '')} · {raw(token)}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

/* ── stories ──────────────────────────────────────────────────────────────── */

function ScalesBoard({ show }: { show: 'all' | 'spacing' | 'border' | 'radius' }) {
  useTokenTick()
  return (
    <div style={{ color: ink, display: 'grid', gap: 'var(--space-12)' }}>
      {(show === 'all' || show === 'spacing') && <SpacingBoard />}
      {(show === 'all' || show === 'border') && <BorderBoard />}
      {(show === 'all' || show === 'radius') && <RadiusBoard />}
    </div>
  )
}

const meta = {
  title: 'Design System/Scales',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta

export const Board: StoryObj = {
  name: 'All scales',
  render: () => <ScalesBoard show="all" />,
}

export const Spacing: StoryObj = {
  name: 'Spacing',
  render: () => <ScalesBoard show="spacing" />,
}

export const BorderWidth: StoryObj = {
  name: 'Border width',
  render: () => <ScalesBoard show="border" />,
}

export const Radius: StoryObj = {
  name: 'Radius',
  render: () => <ScalesBoard show="radius" />,
}
