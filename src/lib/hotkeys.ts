'use client'

/* HOTKEYS — one listener, many scopes.
 *
 * The desktop had exactly one keyboard contract before this: INSPECT.MODE's
 * Escape ladder, hand-written in InspectShell, four rungs deep, and the
 * InfoTip's window-capture listener sitting above it to take Escape first
 * when a tip is open. That pattern is the whole design here. Capture runs
 * from the outside in, so a listener on `window` is reached before one on
 * `document`; a registry that binds there can own a key without a single
 * edit to the ladder underneath it, and anything it does not claim falls
 * through untouched.
 *
 * ONE listener for every scope, not one per registration. A panel with four
 * bindings should cost the document one listener, and the dispatch order has
 * to be knowable: scopes are tried MOST RECENT FIRST, so a palette opened on
 * top of a panel gets the arrow keys before the panel does.
 *
 * WHAT IT REFUSES. Cmd+W, Cmd+T, Cmd+N, Cmd+L, Cmd+Q, Cmd+R belong to the
 * browser. A site that eats them is a site people cannot leave, and a retro
 * desktop is still a web page. Registering one is a programming mistake, so
 * it is dropped with a warning in development rather than honoured quietly.
 *
 * WHAT IT DOES NOT OWN. Escape. The ladder is a sequence of conditions with
 * an order that matters, and expressing it as four predicates racing each
 * other would be a worse version of the switch it already is.
 *
 * `meta` means the platform's command modifier: ⌘ on a Mac, Ctrl elsewhere.
 * One flag rather than two, because a binding that means "save" means it on
 * both and nobody wants to declare that twice.
 */

/** The parts of a KeyboardEvent this registry reads. Narrow on purpose: the
    test suite runs in plain node and hands it plain objects. */
export type KeyLike = {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  preventDefault?: () => void
  stopPropagation?: () => void
}

export type Chord = {
  /** e.key, matched case-insensitively — Shift+x reports 'X' */
  key: string
  /** ⌘ on a Mac, Ctrl elsewhere */
  meta?: boolean
  shift?: boolean
  alt?: boolean
}

export type Binding = Chord & {
  /** the guard: false means this binding is not listening right now, and the
      key goes on to the next scope as if it were never declared */
  when?: (e: KeyLike) => boolean
  run: (e: KeyLike) => void
}

export type ScopeOptions = {
  /** armed or not, asked on every key — a panel that is mounted but not the
      one in front should not be answering for the keyboard */
  enabled?: () => boolean
}

type Scope = { id: string; bindings: readonly Binding[]; opts: ScopeOptions }

/** Registration order. Most recent LAST, dispatched first. */
const scopes: Scope[] = []

/** ⌘-combos the browser needs back. */
const RESERVED = new Set(['w', 't', 'n', 'l', 'q', 'r'])

export function isReserved(chord: Chord): boolean {
  return !!chord.meta && RESERVED.has(chord.key.toLowerCase())
}

/** Does this event say this chord? Modifiers are matched EXACTLY — an
    undeclared modifier must be absent, or Shift+ArrowUp would fire the plain
    ArrowUp binding on its way past and the ramp would step twice. */
export function matches(chord: Chord, e: KeyLike): boolean {
  if (chord.key.toLowerCase() !== e.key.toLowerCase()) return false
  const meta = !!e.metaKey || !!e.ctrlKey
  if (!!chord.meta !== meta) return false
  if (!!chord.shift !== !!e.shiftKey) return false
  if (!!chord.alt !== !!e.altKey) return false
  return true
}

/** The one handler. Exported so the tests can dispatch without a window;
    nothing else should call it. */
export function handleKey(e: KeyLike): boolean {
  for (let i = scopes.length - 1; i >= 0; i -= 1) {
    const scope = scopes[i]
    if (scope.opts.enabled && !scope.opts.enabled()) continue
    for (const binding of scope.bindings) {
      if (!matches(binding, e)) continue
      if (binding.when && !binding.when(e)) continue
      e.preventDefault?.()
      e.stopPropagation?.()
      binding.run(e)
      return true
    }
  }
  return false
}

let listening = false

function listen() {
  if (listening || typeof window === 'undefined') return
  window.addEventListener('keydown', handleKey as (e: KeyboardEvent) => void, true)
  listening = true
}

function stopListening() {
  if (!listening || typeof window === 'undefined') return
  window.removeEventListener('keydown', handleKey as (e: KeyboardEvent) => void, true)
  listening = false
}

/** Arm a set of bindings under an id. Returns the unregister — call it from
    the effect's cleanup, and the last one out takes the listener with it.

    Re-registering an id replaces it in place, which is what a component
    re-declaring its bindings on a render means. */
export function registerHotkeys(
  id: string,
  bindings: readonly Binding[],
  opts: ScopeOptions = {},
): () => void {
  const lawful = bindings.filter((binding) => {
    if (!isReserved(binding)) return true
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[hotkeys] refusing reserved chord in "${id}": meta+${binding.key}`)
    }
    return false
  })

  const existing = scopes.findIndex((scope) => scope.id === id)
  const scope: Scope = { id, bindings: lawful, opts }
  if (existing >= 0) scopes[existing] = scope
  else scopes.push(scope)
  listen()

  return () => {
    const at = scopes.indexOf(scope)
    if (at >= 0) scopes.splice(at, 1)
    if (scopes.length === 0) stopListening()
  }
}

/** The registered scope ids, oldest first. For tests and for nothing else. */
export function activeScopes(): string[] {
  return scopes.map((scope) => scope.id)
}
