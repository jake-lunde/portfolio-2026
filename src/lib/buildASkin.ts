'use client'

import { contrast, hexToRgb, resolveVar, type RGB } from './contrast'

/* BUILD A SKIN — the visitor's own two accents, applied live.
 *
 * The law being demonstrated (CLAUDE.md §2): two accents per skin, a
 * system one and an expressive one, never a third — and the expressive
 * one is marks-only wherever it fails AA as text, enforced through the
 * --accent-expressive-text indirection.
 *
 * Mechanics: overrides are inline custom properties on <html>, so they
 * beat every stylesheet and every skin selector, and they are erased by
 * removing four properties. Downstream vars (--focus, --interactive-*,
 * --accent-expressive-mark) already reference these four, so they follow
 * on their own — never set them here.
 *
 * Persistence is sessionStorage, keyed per skin: visitor-local, never
 * server-side, gone when the tab closes. The gates re-run on every skin
 * or theme flip (revalidate, called from the settings store), because a
 * pick that clears AA on light paper can fail on the dark void — the law
 * always wins over the toy.
 */

export type Role = 'accent' | 'expressive'
export type Picks = { accent?: string; expressive?: string }

/* ---- the 12 candidates ----
   The table itself moved to lib/palette.ts (no 'use client', so the
   token-commit route can read the same twelve on the server). Re-exported
   here because SKIN BUILDER paints its swatches from this list and
   SPEC.SHEET reads it to name a chip after the pick that re-cast it —
   both already import it from this module. */
export { PALETTE } from './palette'

const STORE_KEY = 'lunde-build-a-skin'

/** WCAG 1.4.3 — normal text. The system accent IS text (links, labels). */
export const AA_TEXT = 4.5
/** WCAG 1.4.11 — non-text contrast. The expressive accent marks things,
    and it only has to clear this against ONE of the two grounds. */
export const AA_MARK = 3

/* The only four properties this module ever writes. */
const PROPS = [
  '--accent',
  '--accent-expressive',
  '--accent-expressive-text',
  '--on-accent-expressive',
] as const

export function currentSkin(): string {
  if (typeof document === 'undefined') return 'classic'
  return document.documentElement.dataset.skin || 'classic'
}

function probeHost(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.body ?? document.documentElement
}

/* The two grounds every gate measures against, read live from computed
   styles — never hardcoded hexes, so this stays correct in classic
   light, classic dark, medieval, and whatever skin lands next. */
function ground(): { paper: RGB | null; ink: RGB | null } {
  const host = probeHost()
  if (!host) return { paper: null, ink: null }
  return { paper: resolveVar(host, '--surface'), ink: resolveVar(host, '--content') }
}

export type Verdict = {
  role: Role
  hex: string
  /** did it clear its own gate? */
  ok: boolean
  /** the ratio the gate judged by — the one the status line quotes */
  ratio: number
  /** which ground `ratio` was measured against */
  against: 'paper' | 'ink'
  /** ratio against paper — decides whether an expressive pick earns text rights */
  textRatio: number
  textRights: boolean
}

/** Judge a candidate without applying it. */
export function judge(role: Role, hex: string): Verdict {
  const { paper, ink } = ground()
  const rgb = hexToRgb(hex)
  const vsPaper = rgb && paper ? contrast(rgb, paper) : 0
  const vsInk = rgb && ink ? contrast(rgb, ink) : 0
  const textRights = vsPaper >= AA_TEXT
  /* The system accent IS text on paper — one ground, one gate, 4.5:1. */
  if (role === 'accent') {
    return {
      role,
      hex,
      ok: textRights,
      ratio: vsPaper,
      against: 'paper',
      textRatio: vsPaper,
      textRights,
    }
  }
  /* The expressive accent is a MARK. A mark is legible if it separates
     from the ground it sits on — and it can sit on either: ink-side
     (rules, plates, fills behind ink) or paper-side (dots, bars, tabs on
     open paper). Gating on ink alone would refuse the shipped classic-dark
     pink, which is exactly the light-on-void mark that skin uses. So the
     gate takes the better of the two grounds: 3.0:1 against at least one. */
  const onInk = vsInk >= vsPaper
  const ratio = onInk ? vsInk : vsPaper
  return {
    role,
    hex,
    ok: ratio >= AA_MARK,
    ratio,
    against: onInk ? 'ink' : 'paper',
    textRatio: vsPaper,
    textRights,
  }
}

/* Write the overrides. Always clears first, so a partial pick (system
   only, expressive only) can never leave a stale property behind. */
function paint(picks: Picks): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const p of PROPS) root.style.removeProperty(p)
  if (picks.accent) root.style.setProperty('--accent', picks.accent)
  if (picks.expressive) {
    const v = judge('expressive', picks.expressive)
    root.style.setProperty('--accent-expressive', picks.expressive)
    /* the indirection that enforces the law: text rights are earned at
       4.5:1 on paper, otherwise the pick is demoted to marks and text
       falls back to ink — exactly how the shipped tokens behave */
    root.style.setProperty(
      '--accent-expressive-text',
      v.textRights ? picks.expressive : 'var(--content)',
    )
    /* whatever sits ON the expressive fill: whichever ground separates
       from it further — which is precisely the ground the gate judged by */
    root.style.setProperty(
      '--on-accent-expressive',
      v.against === 'ink' ? 'var(--content)' : 'var(--surface)',
    )
  }
  if (!root.getAttribute('style')) root.removeAttribute('style')
}

function readStore(): Record<string, Picks> {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, Picks>
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, Picks>): void {
  try {
    if (Object.keys(store).length === 0) sessionStorage.removeItem(STORE_KEY)
    else sessionStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    /* private mode, quota, no storage — the overrides still paint */
  }
}

/** The picks currently stored for a skin (defaults to the live one). */
export function readPicks(skin: string = currentSkin()): Picks {
  const p = readStore()[skin]
  return p ? { ...p } : {}
}

/** Store + paint a whole pick set for a skin. */
export function apply(picks: Picks, skin: string = currentSkin()): void {
  const store = readStore()
  if (picks.accent || picks.expressive) store[skin] = picks
  else delete store[skin]
  writeStore(store)
  paint(picks)
}

/** Judge one pick; on a pass, store + paint it. A refusal changes nothing. */
export function pick(role: Role, hex: string): Verdict {
  const v = judge(role, hex)
  if (!v.ok) return v
  apply({ ...readPicks(), [role]: hex })
  return v
}

/** Hand the skin its own tokens back. */
export function clear(skin: string = currentSkin()): void {
  const store = readStore()
  delete store[skin]
  writeStore(store)
  if (skin === currentSkin()) paint({})
}

/** Re-run the gates for the live skin/theme: keep what still passes,
    silently drop what no longer does. Called after every skin or theme
    flip, and at the end of hydrate() so a reload restores the picks. */
export function revalidate(): void {
  if (typeof document === 'undefined') return
  const skin = currentSkin()
  const stored = readPicks(skin)
  const kept: Picks = {}
  if (stored.accent && judge('accent', stored.accent).ok) kept.accent = stored.accent
  if (stored.expressive && judge('expressive', stored.expressive).ok) {
    kept.expressive = stored.expressive
  }
  apply(kept, skin)
}
