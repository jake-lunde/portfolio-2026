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
 *
 * IT ALSO REMEMBERS. Every rebind, reset and revert takes a snapshot of the
 * pending map first, so ⌘Z on the stage steps back through them and ⌘⇧Z steps
 * forward again. The reasoning for a stack of states rather than a stack of
 * inverses is in "UNDO" below, next to the code it is about.
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

/* ---- THE EXTRA ROOTS, and the CSS finding that forced them ----

   The stage shows the same component in three skins at once, each inside a
   nested `data-skin` wrapper, which is how the desktop has always drawn a
   live skin preview (SkinSwitch). That works for semantic tokens and it does
   NOT work for these. Read tokens.generated.css: the first block is
   `:root, [data-skin='classic']` and it carries EVERY tier — core, semantic
   and component — while the `[data-theme='dark']` and `[data-skin='medieval']`
   blocks that follow carry semantic overrides only.

   So a nested `[data-skin='classic']` wrapper re-declares all 116 component
   properties on itself, and an inline write on <html> never reaches inside
   it: the cascade beats inheritance every time. A medieval or dark wrapper
   re-declares none of them and inherits ours happily. Verified against the
   generated file (--button-radius, --stamp-fg and --window-fill each appear
   exactly once, inside the first block), not assumed.

   One inline write per root fixes it in every direction, because an inline
   style outranks any selector. The stage registers its wrappers; every rebind
   and reset lands on all of them plus the document root.

   These roots are OURS — the stage mints them and nothing else writes their
   style attribute — so there is no prior value to stash and none to hand
   back. That asymmetry is deliberate; the document root keeps its stash. */
const roots = new Set<HTMLElement>()

function root(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.documentElement
}

/** Every element a write has to land on: the document, then the stage's. */
function targets(): HTMLElement[] {
  const el = root()
  return el ? [el, ...roots] : [...roots]
}

/** Mirror the live set onto a stage wrapper and keep it mirrored. Applying
    what is already pending is the point: the stage can open onto a set of
    rebinds that were made from the inspector five minutes ago. */
export function addRoot(el: HTMLElement): void {
  roots.add(el)
  for (const [role, held] of applied) {
    for (const [prop, value] of writesFor(role, held.candidate)) el.style.setProperty(prop, value)
  }
}

/** Drop a wrapper on its way out. Its inline properties go with the element
    itself, so there is nothing to clean up on it. */
export function removeRoot(el: HTMLElement): void {
  roots.delete(el)
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

/** Preview `candidate` on `role`, without telling the history about it. The
    exported half below is the one that records; this one is what UNDO replays
    through, and a replay that wrote its own history entry would be a room you
    could never get out of. */
function write(role: string, candidate: StyleCandidate): void {
  const el = root()
  const writes = writesFor(role, candidate)
  if (writes.length === 0) return
  clear(role)
  for (const [prop, value] of writes) {
    if (el && !prior.has(prop)) prior.set(prop, el.style.getPropertyValue(prop))
    for (const target of targets()) target.style.setProperty(prop, value)
  }
  applied.set(role, { candidate, props: writes.map(([prop]) => prop) })
}

/** Hand one role back to whoever held it before the rebind. Silent, same as
    `write`.

    Same guard tune.ts takes, for a narrower reason: nobody else writes these
    properties inline today, but SKIN BUILDER writes semantic ones and the
    honest rule is "put the stash back only while the property still reads as
    the value WE wrote". A property somebody else has since claimed is theirs;
    we drop our bookkeeping and get out of the way. */
function clear(role: string): void {
  const held = applied.get(role)
  if (!held) return
  const el = root()
  const writes = writesFor(role, held.candidate)
  for (const [prop, value] of writes) {
    if (el && el.style.getPropertyValue(prop) === value) {
      el.style.removeProperty(prop)
      const was = prior.get(prop)
      if (was) el.style.setProperty(prop, was)
    }
    // the stage's roots carry nothing but ours, so they just lose the line
    for (const stage of roots) stage.style.removeProperty(prop)
    prior.delete(prop)
  }
  applied.delete(role)
  // an empty style attribute is litter
  if (el && !el.getAttribute('style')) el.removeAttribute('style')
}

/* ---- UNDO, and why it is a stack of STATES rather than of moves ----

   Jake asked for Figma's keys on the bench, and ⌘Z is the one every other
   key in that grammar assumes. The tempting shape is a list of moves to play
   backwards — "this role was Surface, put it back" — and it is the shape that
   goes wrong here, because one move is not always one property. A type-role
   rebind writes five, a reset restores whatever was stashed under all five,
   and REVERT drops the whole set at once. Three kinds of inverse to keep
   correct, and each of them a place for a fifth member to be left behind.

   A snapshot of the pending map is one kind of thing, and putting it back is
   one operation: drop the roles the snapshot does not have, write the ones it
   does. The map is at most twelve entries (the commit route's cap), so the
   copy costs nothing worth measuring, and the DOM writes are the same writes
   a click would have made.

   Bounded at fifty, oldest dropped. A session that made fifty rebinds and
   wants the first one back is a session that wants REVERT.

   THE FUTURE IS CLEARED BY ANY NEW MOVE, which is every undo stack there has
   ever been: a redo after a fresh edit would be replaying a branch the
   visitor left. Cleared in `record`, so nothing else has to remember. */

/** One pending set, flattened to what it takes to rebuild: role -> what it
    is previewing. The props list in `Held` is derived from the candidate, so
    there is nothing else to carry. */
type Snapshot = Map<string, StyleCandidate>

const HISTORY_MAX = 50
const past: Snapshot[] = []
const future: Snapshot[] = []

function snapshot(): Snapshot {
  return new Map(Array.from(applied, ([role, held]) => [role, held.candidate]))
}

/** Take a snapshot before a move. Called only by the three exported writers,
    and only when they are genuinely about to change something: a no-op that
    pushed a state would make ⌘Z do nothing and look broken. */
function record(): void {
  past.push(snapshot())
  if (past.length > HISTORY_MAX) past.shift()
  future.length = 0
}

/** Make the live set look like `snap`, in the two passes the difference has:
    what has to go, then what has to arrive. Roles already holding the right
    candidate are left alone, so an undo across one rebind touches one role. */
function restore(snap: Snapshot): void {
  for (const role of Array.from(applied.keys())) {
    if (!snap.has(role)) clear(role)
  }
  for (const [role, candidate] of snap) {
    if (applied.get(role)?.candidate.token === candidate.token) continue
    write(role, candidate)
  }
}

export function canUndo(): boolean {
  return past.length > 0
}

export function canRedo(): boolean {
  return future.length > 0
}

/** Step back one move. Returns false when there is nothing behind, so the
    hotkey can fall through rather than swallow a key that did nothing. */
export function undo(): boolean {
  const snap = past.pop()
  if (!snap) return false
  future.push(snapshot())
  restore(snap)
  return true
}

export function redo(): boolean {
  const snap = future.pop()
  if (!snap) return false
  past.push(snapshot())
  restore(snap)
  return true
}

/** Forget every move. The stage calls this as it opens: this module outlives
    the room, so without it ⌘Z in a fresh room would undo its way back into
    the set somebody dropped on the way out of the last one. */
export function clearHistory(): void {
  past.length = 0
  future.length = 0
}

/** Preview `candidate` on `role`. Clears the role's previous writes first, so
    a second choice never stacks onto the first — and clears by ROLE rather
    than by property, because a composite's five members are one decision. */
export function rebind(role: string, candidate: StyleCandidate): void {
  if (writesFor(role, candidate).length === 0) return
  record()
  write(role, candidate)
}

/** Hand one role back to whoever held it before the rebind. */
export function resetRole(role: string): void {
  if (!applied.has(role)) return
  record()
  clear(role)
}

/** Hand everything back. Called on every exit from the mode, beside tune's. */
export function resetAll(): void {
  if (applied.size === 0) return
  record()
  for (const role of Array.from(applied.keys())) clear(role)
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
