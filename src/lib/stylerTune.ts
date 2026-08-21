'use client'

import { familyOf, type StyleCandidate } from './styleCandidates'
import { COMPOSITE_MEMBERS } from './stylerBlocks'

/* STYLER's live preview — the component tier's answer to tune.ts.
 *
 * The semantic nudge writes a HEX: a core primitive is flattened at build
 * time, so there is no custom property to point at. A component rebind is the
 * opposite in every way that matters. It writes a REFERENCE —
 * `--button-radius: var(--radius-pill)` — because the whole claim of the
 * component tier is that it names a semantic role and lets each skin resolve
 * it. Preview a hex here and a medieval desktop would show classic's radius
 * sitting inside medieval's chrome, which is precisely the lie the tier
 * exists to prevent.
 *
 * :ROOT IS THE RIGHT PLACE, and it is a ruling rather than a shortcut.
 * Restyling the button restyles every button (Jake, s99) — the component sets
 * emit once under :root, so an inline property there reaches every instance
 * on the desktop at once. Scoping the write to the picked node would preview
 * an instance override, which is a thing the token system does not have.
 *
 * ONE EDIT, FIVE WRITES. A text element binds a whole typography composite,
 * and the build expands that one binding into five CSS members. So does this:
 * choosing Label for --stamp-text sets font-family, font-size, font-weight,
 * line-height and letter-spacing together, and the group resets together.
 * Anything else would let a preview assemble a treatment the token files
 * cannot express — the exact thing the type-role row was minted to stop.
 *
 * The family member is the one place the preview and the build differ on
 * their way to the same value. The build swaps the composite's Figma face
 * name for the skin's stack and emits `var(--mono)`; this writes
 * `var(--type-badge-family)`, which IS `var(--mono)` one hop further up and
 * is per-skin for the same reason. Pointing at the role rather than at the
 * face it currently resolves to is what keeps a preview honest when the role
 * changes face.
 *
 * Kept apart from tune.ts rather than folded into it. The two share a
 * five-line stash-and-restore and disagree about everything else: what a
 * write is (hex vs. reference), how many properties one edit touches (one vs.
 * five), and whether there is a verdict to carry (AA vs. none). One module
 * with two modes would need a flag on every function, and the flag would have
 * a wrong way round.
 */

/** One pending rebind, in the shape /api/token-commit consumes — the same
    { role, token } the semantic path posts, which is why both tiers ride one
    POST and the route partitions them by tier. */
export type StylerEdit = { role: string; token: string }

/** What we wrote for a role, and every property it landed on. */
type Held = { candidate: StyleCandidate; props: string[] }

/** role -> what it is previewing */
const applied = new Map<string, Held>()
/** prop -> the inline value it carried before we touched it ('' if none) */
const prior = new Map<string, string>()

function root(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.documentElement
}

/** 'typography/badge' -> 'badge'. The composite candidates are the only ones
    whose token path is not the property they set. */
function typeRoleOf(token: string): string | null {
  return token.startsWith('typography/') ? token.slice('typography/'.length) : null
}

/** Every property one edit writes, and the reference it writes there. Pure —
    this is the half the test suite reads, because the five-way expansion is
    where a silent mistake would hide: four members moving and one left
    behind still LOOKS right on screen. */
export function writesFor(role: string, candidate: StyleCandidate): Array<[string, string]> {
  if (familyOf(role) === 'type-role') {
    const typeRole = typeRoleOf(candidate.token)
    if (!typeRole) return []
    return COMPOSITE_MEMBERS.map(
      ([member, part]) =>
        [`--${role}-${member}`, `var(--type-${typeRole}-${part})`] as [string, string],
    )
  }
  return [[`--${role}`, `var(${candidate.varName})`]]
}

/** Preview `candidate` on `role`. Clears the role's previous writes first, so
    a second choice never stacks onto the first — and clears by ROLE rather
    than by property, because a composite's five members are one decision. */
export function rebind(role: string, candidate: StyleCandidate): void {
  const el = root()
  if (!el) return
  const writes = writesFor(role, candidate)
  if (writes.length === 0) return
  resetRole(role)
  for (const [prop, value] of writes) {
    if (!prior.has(prop)) prior.set(prop, el.style.getPropertyValue(prop))
    el.style.setProperty(prop, value)
  }
  applied.set(role, { candidate, props: writes.map(([prop]) => prop) })
}

/** Hand one role back to whoever held it before the rebind.

    Same guard tune.ts takes, for a narrower reason: nobody else writes these
    properties inline today, but SKIN BUILDER writes semantic ones and the
    honest rule is "put the stash back only while the property still reads as
    the value WE wrote". A property somebody else has since claimed is theirs;
    we drop our bookkeeping and get out of the way. */
export function resetRole(role: string): void {
  const el = root()
  if (!el) return
  const held = applied.get(role)
  if (!held) return
  const writes = writesFor(role, held.candidate)
  for (const [prop, value] of writes) {
    if (el.style.getPropertyValue(prop) === value) {
      el.style.removeProperty(prop)
      const was = prior.get(prop)
      if (was) el.style.setProperty(prop, was)
    }
    prior.delete(prop)
  }
  applied.delete(role)
  // an empty style attribute is litter
  if (!el.getAttribute('style')) el.removeAttribute('style')
}

/** Hand everything back. Called on every exit from the mode, beside tune's. */
export function resetAll(): void {
  for (const role of Array.from(applied.keys())) resetRole(role)
}

/** What this role is previewing, as a token path — or null when it is still
    showing what the file says. The panel overlays it on TOKEN_REFS so a row
    reports the binding it is ABOUT to have, not the one it had. */
export function heldToken(role: string): string | null {
  return applied.get(role)?.candidate.token ?? null
}

export function isRebound(role: string): boolean {
  return applied.has(role)
}

/** The pending set, insertion-ordered, in the commit route's shape. No AA
    verdict rides along: a component rebind names a semantic role, and what
    that role grades at against the ink beside it is the SEMANTIC tier's
    question, asked and answered per theme by the token doctor in CI. */
export function pendingEdits(): StylerEdit[] {
  return Array.from(applied, ([role, held]) => ({ role, token: held.candidate.token }))
}

export function count(): number {
  return applied.size
}

/** What a custom property resolves to on this desktop right now. The panel
    prints it for the rows that have no swatch — a radius, a gap, a locked
    dimension — because a token name with no measure beside it tells a
    designer half of what they came for. */
export function readValue(prop: string): string {
  const el = root()
  if (!el) return ''
  return getComputedStyle(el).getPropertyValue(prop).trim()
}
