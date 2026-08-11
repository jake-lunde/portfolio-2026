'use client'

import { contrast, hexToRgb, grade, type RGB } from './contrast'
import { PALETTE, type Candidate } from './palette'

/* LIVE NUDGE — INSPECT.MODE's one write. SYS-21.
 *
 * The bargain: a visitor points at an element, sees which semantic role
 * paints it, and re-casts that role to a different core primitive to watch
 * the whole system move at once. That is the argument the site is making —
 * one token source, everything downstream follows — and no screenshot
 * makes it the way moving it does.
 *
 * Mechanics are SKIN BUILDER's (buildASkin.ts), narrowed: inline custom
 * properties on <html> beat every stylesheet and every skin selector, and
 * they are erased by removing the properties again. The differences from
 * buildASkin, and the reasons:
 *
 * · buildASkin owns exactly four accent properties and gates them on AA.
 *   This module writes ANY semantic color role and gates nothing — it is
 *   the designer's driver's seat, so a failing pair previews and the row
 *   shows the failure instead of refusing the click.
 * · the PRIOR inline value is stashed per property, so resetting hands the
 *   property back to whoever held it — which matters precisely because
 *   buildASkin may be holding --accent at the same moment.
 *
 * TWO STATES, AND THE DIFFERENCE MATTERS:
 *
 * · PREVIEWING. The inline property, and nothing else. It is not stored
 *   anywhere, it does not survive the mode (InspectShell calls resetAll on
 *   the way out), it does not survive a reload, and the banner says so.
 * · COMMITTED. Jake, armed with the edit key, sends the pending set to
 *   /api/token-commit, which re-aliases the role in
 *   tokens/semantic/<theme>.json and opens a PULL REQUEST. Still not live —
 *   a token edit moves every skin downstream, so it gets reviewed, and CI's
 *   token doctor gets the last word. The preview on screen is unchanged
 *   either way; the panel relabels itself to say which state it is in.
 *
 * So the applied map carries the whole CANDIDATE, not just a hex: the hex
 * is what paints, but the TOKEN PATH is what a commit needs — a PR that
 * wrote `#2036C8` instead of `{color.nasa.cobalt}` would be inventing a
 * color, which house law does not allow. The AA verdict recorded at nudge
 * time rides along too, because SAVE refuses a set with a failing pick:
 * previewing a red instrument is the point, shipping one is not.
 *
 * Candidates are core primitives (lib/palette.ts — the same twelve SKIN
 * BUILDER paints from, tokens/core/color.json). They apply as hexes because
 * the core tier is flattened at build time: a core color has no custom
 * property of its own to alias to.
 */

export type { Candidate }

/** The twelve core color primitives a role can be re-cast to. */
export const CANDIDATES: readonly Candidate[] = PALETTE

/** What we wrote, and what we knew when we wrote it. */
type Held = { candidate: Candidate; would: Would }

/** One pending role change, in the shape the commit route consumes. */
export type PendingEdit = {
  varName: string
  /** the custom property without its dashes — the token key */
  role: string
  hex: string
  token: string
  /** did the pick fail AA on the pair it landed in? */
  fails: boolean
}

/** prop → the inline value it carried before we touched it ('' if none). */
const prior = new Map<string, string>()
/** prop → what we wrote. The live override set. */
const applied = new Map<string, Held>()

function root(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.documentElement
}

/** Tidy up after ourselves: an empty style attribute is litter. */
function sweep(el: HTMLElement) {
  if (!el.getAttribute('style')) el.removeAttribute('style')
}

/** Preview `candidate` on `prop`. Clears first, like paint() — a second
    nudge on the same role must never stack onto the first. `would` is the
    verdict the row was already showing when it was clicked; it is kept so
    SAVE can refuse a failing set without re-deriving a pair that has since
    been repainted by this very override. */
export function nudge(prop: string, candidate: Candidate, would: Would = null): void {
  const el = root()
  if (!el) return
  if (!prior.has(prop)) prior.set(prop, el.style.getPropertyValue(prop))
  el.style.removeProperty(prop)
  el.style.setProperty(prop, candidate.hex)
  applied.set(prop, { candidate, would })
}

/** Hand one role back to whoever held it before the nudge.

    The stash is only good while it is still OURS to give back. SKIN
    BUILDER writes the same four accent properties this can write, and it
    repaints on every skin or theme flip — so between a nudge and its
    reset, --accent may have been re-set by somebody with a better claim.
    Restoring the stash then would quietly revert the visitor's saved
    skin pick to whatever it was before we touched it. So: put the prior
    value back only if the property still reads as the value WE wrote.
    Otherwise the newer writer already owns it, and all we do is drop our
    bookkeeping and get out of the way. */
export function reset(prop: string): void {
  const el = root()
  if (!el) return
  const ours = applied.get(prop)
  const now = el.style.getPropertyValue(prop)
  const stillOurs = ours !== undefined && now === ours.candidate.hex
  if (stillOurs) {
    el.style.removeProperty(prop)
    const was = prior.get(prop)
    if (was) el.style.setProperty(prop, was)
  }
  prior.delete(prop)
  applied.delete(prop)
  sweep(el)
}

/** Hand everything back. Called on every exit from the mode. */
export function resetAll(): void {
  for (const prop of Array.from(applied.keys())) reset(prop)
}

/** The live override set as prop → hex, a plain snapshot (never the live
    Map). Kept in this shape because callers only ask "how many, and what
    colour" — pendingEdits() is the one that carries token paths. */
export function overrides(): Record<string, string> {
  return Object.fromEntries(Array.from(applied, ([prop, h]) => [prop, h.candidate.hex]))
}

/** The live override set as the commit route reads it: role + token path,
    plus the AA verdict the pick was made under. Insertion-ordered, so the
    PR ledger lists the roles in the order they were re-cast. */
export function pendingEdits(): PendingEdit[] {
  return Array.from(applied, ([prop, h]) => ({
    varName: prop,
    role: prop.replace(/^--/, ''),
    hex: h.candidate.hex,
    token: h.candidate.token,
    fails: h.would?.fails ?? false,
  }))
}

/** Is this role currently previewing something? */
export function isNudged(prop: string): boolean {
  return applied.has(prop)
}

/* ------------------------------------------------------------ the guard */

/* Which side of the pair does this declaration paint? A role dropped into
   `color` becomes the ink and is judged against the ground the element
   already stands on; anything else — background, border, fill — becomes
   the ground and is judged against the ink. Rough by design: it answers
   for the OBVIOUS pair, which is the one the CONTRAST section is quoting
   two rows further down, and the real reading re-runs the moment the
   override lands anyway. */
const INK_PROPS = /^(-webkit-text-fill-)?color$|^(caret|text-decoration|text-emphasis)-color$/

export type Would = { ratio: number; grade: string; fails: boolean } | null

/** What would this candidate grade at, on this declaration, for this
    element's current pair? Null when there is no pair to judge. */
export function wouldGrade(
  candidateHex: string,
  property: string,
  colors: { fg: RGB | null; bg: RGB | null },
): Would {
  const rgb = hexToRgb(candidateHex)
  if (!rgb) return null
  // the property may carry a pseudo-element suffix (see inspect.ts) —
  // judge on the property name itself
  const bare = property.split(' ')[0]
  const against = INK_PROPS.test(bare) ? colors.bg : colors.fg
  if (!against) return null
  const ratio = contrast(rgb, against)
  const mark = grade(ratio)
  return { ratio, grade: mark, fails: mark === 'FAIL' }
}
