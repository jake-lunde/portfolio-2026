'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { labelFor } from '@/lib/inspect'
import styles from './inspectShell.module.css'

/* LAYERS — the left dock. The desktop's object model, read live off the
   DOM rather than off a scene graph, because there is no scene graph:
   this OS is a document, and the tree IS the document.

   Three tiers, and the middle one is the point: DESKTOP holds the open
   windows in stacking order (z desc — the top of the list is the top of
   the pile, the way a layers panel is supposed to read), and a window
   expands into its own markup. So the tree tells the same story the z
   index does, and picking a row on it lights the element on the canvas.

   Under the windows sits the FURNITURE: the dock rail, the icon grid,
   the widgets, the wallpaper — everything else the desktop root holds.
   It reads as a quieter tier because it is one, but it walks the same
   way and reveals the same way, which is what makes a dock tile as
   inspectable as a paragraph inside a window.

   What counts as a layer: an element with an IDENTITY (a copy id, a named
   spring, a readable CSS-module class) or one with children. Everything
   else is a text-carrying wrapper and would only make the tree longer,
   not truer. Depth is capped: past six levels a window's internals stop
   being layers and start being implementation.

   Keyboard is the WAI-ARIA tree pattern in full — roving tabindex, Up/Down
   through the visible rows, Right to open, Left to close or climb, Enter
   to select. This panel is the one place the whole desktop is reachable
   without a pointer, which is the debt the window version left behind. */

const MAX_DEPTH = 6
const MAX_CHILDREN = 60
const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'LINK', 'DEFS', 'TITLE', 'BR'])

const DESKTOP_KEY = '__desktop'

type Row = {
  key: string
  el: HTMLElement | null
  label: string
  /** 0 = DESKTOP, 1 = a window or a piece of furniture, 2+ = its markup */
  depth: number
  /** a depth-1 row that is NOT a window — the quieter tier */
  furniture?: boolean
  expandable: boolean
  expanded: boolean
  posinset: number
  setsize: number
}

function usable(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName.toUpperCase())) return false
  if (el.hasAttribute('data-inspect-probe')) return false
  if (el.hasAttribute('data-inspect-self')) return false
  return true
}

/** Identity or issue — anything else is packaging. */
function meaningful(el: Element, picked: HTMLElement | null): boolean {
  if (!usable(el)) return false
  /* The pick is never a judgement call: the visitor selected it, so it
     gets a row whatever it is made of. Without this a picked leaf — a
     bare span carrying a line of text — reveals to nothing, and the tree
     quietly disagrees with the panel about what is selected. */
  if (el === picked) return true
  if (el.childElementCount > 0) return true
  const node = el as HTMLElement
  if (node.dataset?.copyId || node.dataset?.spring) return true
  return labelFor(node) !== el.tagName.toLowerCase()
}

type Kid = { i: number; el: HTMLElement }

/** Children worth showing, carrying their index in the parent so a key
    stays stable while siblings come and go around them. */
function kidsOf(el: HTMLElement, picked: HTMLElement | null): Kid[] {
  const out: Kid[] = []
  const kids = el.children
  for (let i = 0; i < kids.length && out.length < MAX_CHILDREN; i++) {
    if (meaningful(kids[i], picked)) out.push({ i, el: kids[i] as HTMLElement })
  }
  return out
}

/** The key path from the tree's root down to `el`, so picking on the
    canvas can open the tree to it.

    Two roots, because the canvas has two tiers. Inside a window the path
    starts at that window's row. Everywhere else it starts at DESKTOP —
    which is what makes a dock tile, a desktop icon or a widget reveal at
    all. It used to return null for anything outside a window, so half
    the desktop picked fine on the canvas and lit nothing in the tree.
    Null now means only what it should: not on the canvas. */
function pathTo(el: HTMLElement): string[] | null {
  const win = el.closest<HTMLElement>('[data-window-id]')
  const root = win ?? document.querySelector<HTMLElement>('[data-desktop-root]')
  if (!root || !root.contains(el)) return null
  const steps: number[] = []
  let node: Element = el
  while (node !== root) {
    const parent = node.parentElement
    if (!parent) return null
    steps.unshift(Array.prototype.indexOf.call(parent.children, node))
    node = parent
  }
  let acc = win ? `win:${win.dataset.windowId}` : DESKTOP_KEY
  const keys = [acc]
  for (const i of steps) {
    acc = `${acc}>${i}`
    keys.push(acc)
  }
  return keys
}

export function LayersPanel({
  picked,
  onPick,
  onHover,
}: {
  picked: HTMLElement | null
  onPick: (el: HTMLElement) => void
  onHover: (el: HTMLElement | null) => void
}) {
  const skin = useSettings((s) => s.skin)
  const windows = useWindows((s) => s.windows)
  const focused = useWindows((s) => s.focused)
  const focusWindow = useWindows((s) => s.focus)

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([DESKTOP_KEY]))
  const [activeKey, setActiveKey] = useState<string>(DESKTOP_KEY)
  /* The model is read from the LIVE DOM, which does not exist yet on the
     render that first learns about a window. One frame later it does —
     this counter is what re-reads it. */
  const [tick, setTick] = useState(0)
  const treeRef = useRef<HTMLDivElement>(null)
  const wantFocus = useRef(false)
  /** the row key a canvas pick is still waiting to be shown at */
  const wantReveal = useRef<string | null>(null)

  /* Keying the re-read on the windows array was too narrow by half: the
     tree is a view of the LIVE DOM, and the DOM churns constantly without
     a window opening or closing — a dynamic chunk resolving into a
     window's body, a program switching tabs, a widget ticking. The rows
     for whatever unmounted went on pointing at detached nodes, so
     clicking one silently cleared the selection instead of picking.

     So the canvas itself is the trigger. One observer on the desktop
     root, coalesced to at most one re-read per frame — the point is to
     stay current, not to re-render per mutation record. */
  useEffect(() => {
    const root = document.querySelector('[data-desktop-root]')
    if (!root) return
    let raf = 0
    const bump = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setTick((n) => n + 1)
      })
    }
    bump() // the first read happens a frame after mount, when windows exist
    const obs = new MutationObserver(bump)
    obs.observe(root, { childList: true, subtree: true })
    return () => {
      obs.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  /* ---- reveal: a pick on the canvas opens the tree to it ---- */
  useEffect(() => {
    if (!picked) return
    const keys = pathTo(picked)
    if (!keys) return
    wantReveal.current = keys[keys.length - 1]
    setExpanded((prev) => {
      // every ancestor opens; the row itself does not have to
      const next = new Set(prev)
      let grew = false
      next.add(DESKTOP_KEY)
      for (const k of keys.slice(0, -1)) {
        if (!next.has(k)) grew = true
        next.add(k)
      }
      return grew || !prev.has(DESKTOP_KEY) ? next : prev
    })
  }, [picked])

  const rows = useMemo<Row[]>(() => {
    void tick // the model is DOM-derived; this is what re-reads it
    const out: Row[] = []
    const desktop = document.querySelector<HTMLElement>('[data-desktop-root]')
    const open = expanded.has(DESKTOP_KEY)

    // z descending: the top of the list is the top of the pile
    const stack = windows.slice().sort((a, b) => b.z - a.z)

    /* The furniture tier: every other meaningful child of the desktop
       root. Windows are held out because they get the tier above; the
       tool's own docks are already held out by usable(). */
    const furniture = desktop
      ? kidsOf(desktop, picked).filter((k) => !k.el.hasAttribute('data-window-id'))
      : []

    // windows and furniture are siblings under DESKTOP, so ARIA counts them
    // as one set even though they read as two tiers
    const branches = stack.length + furniture.length

    out.push({
      key: DESKTOP_KEY,
      el: desktop,
      label: t('inspect.desktop', skin),
      depth: 0,
      expandable: branches > 0,
      expanded: open && branches > 0,
      posinset: 1,
      setsize: 1,
    })
    if (!open) return out

    /* `kids` is passed in, never re-derived: every node's children were
       already scanned to decide whether its own row is expandable, and
       scanning them a second time to walk them doubled the cost of the
       whole tree for nothing. */
    const walk = (kids: Kid[], depth: number, prefix: string) => {
      kids.forEach(({ i, el: kid }, n) => {
        const key = `${prefix}>${i}`
        /* Past MAX_DEPTH a window's internals stop being layers and start
           being implementation — except on the ONE branch holding what is
           actually selected. Cutting there doesn't tidy the tree, it
           amputates the path to the pick, and the reveal then has nothing
           to reveal. So the cap lifts along that branch and nowhere else. */
        const onPath = !!picked && kid !== picked && kid.contains(picked)
        const sub = depth < MAX_DEPTH || onPath ? kidsOf(kid, picked) : []
        const canOpen = sub.length > 0
        const isOpen = canOpen && expanded.has(key)
        out.push({
          key,
          el: kid,
          label: labelFor(kid),
          depth,
          expandable: canOpen,
          expanded: isOpen,
          posinset: n + 1,
          setsize: kids.length,
        })
        if (isOpen) walk(sub, depth + 1, key)
      })
    }

    stack.forEach((w, n) => {
      const el = document.querySelector<HTMLElement>(`[data-window-id="${CSS.escape(w.id)}"]`)
      if (!el) return
      const key = `win:${w.id}`
      const kids = kidsOf(el, picked)
      const canOpen = kids.length > 0
      const isOpen = canOpen && expanded.has(key)
      out.push({
        key,
        el,
        // the window announces itself by its live aria-label: the copy
        // layer and skinVocab already resolved it, so the tree reads in
        // the visitor's skin without this file knowing the registry exists
        label: el.getAttribute('aria-label') || w.id,
        depth: 1,
        expandable: canOpen,
        expanded: isOpen,
        posinset: n + 1,
        setsize: branches,
      })
      if (isOpen) walk(kids, 2, key)
    })

    /* Keyed off the desktop root the same way pathTo roots a desktop
       path, so a canvas pick on a dock tile reveals to exactly this row
       rather than to a key nobody wrote. */
    furniture.forEach(({ i, el }, n) => {
      const key = `${DESKTOP_KEY}>${i}`
      const kids = kidsOf(el, picked)
      const canOpen = kids.length > 0
      const isOpen = canOpen && expanded.has(key)
      out.push({
        key,
        el,
        label: labelFor(el),
        depth: 1,
        furniture: true,
        expandable: canOpen,
        expanded: isOpen,
        posinset: stack.length + n + 1,
        setsize: branches,
      })
      if (isOpen) walk(kids, 2, key)
    })

    return out
  }, [windows, expanded, skin, tick, picked])

  // the roving tabindex must always land somewhere real
  useEffect(() => {
    if (!rows.some((r) => r.key === activeKey)) setActiveKey(rows[0]?.key ?? DESKTOP_KEY)
  }, [rows, activeKey])

  /* The second half of the reveal. Opening the ancestors is not enough:
     the row can still be a screenful below the fold, and the roving
     tabindex is still parked wherever the last keyboard walk left it, so
     arrowing after a canvas pick jumped somewhere unrelated.

     It has to happen here rather than in the effect that expands, because
     the row does not exist until the tree has re-read the DOM and
     re-rendered — a frame later at best, later than that when the pick
     opened a window's markup. Until it exists the want is KEPT, and the
     next re-read tries again.

     Scrolled, never focused: the pointer is out on the canvas and pulling
     the caret into the dock mid-click is a jump, not a reveal. */
  useEffect(() => {
    const key = wantReveal.current
    if (!key) return
    const row = treeRef.current?.querySelector<HTMLElement>(
      `[data-row-key="${CSS.escape(key)}"]`,
    )
    if (!row) return
    wantReveal.current = null
    setActiveKey(key)
    row.scrollIntoView({ block: 'nearest' })
  }, [rows, picked])

  useEffect(() => {
    if (!wantFocus.current) return
    wantFocus.current = false
    treeRef.current
      ?.querySelector<HTMLElement>(`[data-row-key="${CSS.escape(activeKey)}"]`)
      ?.focus({ preventScroll: false })
  }, [activeKey, rows])

  /* Entering the tool puts the caret in the tool. The tree is the only
     root that reaches the whole desktop from the keyboard, so landing on
     it means a keyboard visitor can start working immediately instead of
     tabbing in from wherever the menubar left them. InspectShell captured
     the opener during its first render, so this does not cost them the
     way back. */
  useEffect(() => {
    treeRef.current?.querySelector<HTMLElement>('[role="treeitem"]')?.focus({ preventScroll: true })
  }, [])

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const select = useCallback(
    (row: Row) => {
      setActiveKey(row.key)
      if (row.el) onPick(row.el)
    },
    [onPick],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = rows.findIndex((r) => r.key === activeKey)
    if (at < 0) return
    const row = rows[at]
    const move = (to: number) => {
      const clamped = Math.max(0, Math.min(rows.length - 1, to))
      wantFocus.current = true
      setActiveKey(rows[clamped].key)
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        move(at + 1)
        return
      case 'ArrowUp':
        e.preventDefault()
        move(at - 1)
        return
      case 'Home':
        e.preventDefault()
        move(0)
        return
      case 'End':
        e.preventDefault()
        move(rows.length - 1)
        return
      case 'ArrowRight':
        e.preventDefault()
        if (row.expandable && !row.expanded) toggle(row.key)
        else move(at + 1)
        return
      case 'ArrowLeft': {
        e.preventDefault()
        if (row.expanded) {
          toggle(row.key)
          return
        }
        // climb: the nearest row above sitting one level shallower
        for (let i = at - 1; i >= 0; i--) {
          if (rows[i].depth < row.depth) {
            move(i)
            return
          }
        }
        return
      }
      case 'Enter':
      case ' ':
        e.preventDefault()
        select(row)
        return
      default:
    }
  }

  return (
    <>
      <h2 className={styles.panelHead}>
        <CopyText k="inspect.panel.layers" />
      </h2>
      <div className={styles.panelBody}>
        <div
          ref={treeRef}
          role="tree"
          aria-label={t('inspect.panel.layers', skin)}
          className={styles.tree}
          onKeyDown={onKeyDown}
          onPointerLeave={() => onHover(null)}
        >
          {rows.map((row) => {
            const isPicked = !!row.el && row.el === picked
            // furniture shares the depth but not the chrome: a dock rail is
            // not an artboard, so it gets no window affordances
            const isWindow = row.depth === 1 && !row.furniture
            return (
              <div
                key={row.key}
                data-row-key={row.key}
                role="treeitem"
                tabIndex={row.key === activeKey ? 0 : -1}
                aria-level={row.depth + 1}
                aria-posinset={row.posinset}
                aria-setsize={row.setsize}
                aria-selected={isPicked}
                aria-expanded={row.expandable ? row.expanded : undefined}
                className={styles.row}
                data-picked={isPicked || undefined}
                data-window={isWindow || undefined}
                data-furniture={row.furniture || undefined}
                data-focused={(isWindow && row.el?.dataset.windowId === focused) || undefined}
                style={{ paddingLeft: `calc(var(--spacing-component-xs) + ${row.depth * 12}px)` }}
                onPointerEnter={() => onHover(row.el)}
                onFocus={() => setActiveKey(row.key)}
                onClick={() => select(row)}
                onDoubleClick={() => {
                  // a window row's second click raises it, the way a layers
                  // panel focuses the artboard you keep pointing at
                  const id = row.el?.dataset.windowId
                  if (isWindow && id) focusWindow(id)
                  else if (row.expandable) toggle(row.key)
                }}
              >
                <span
                  className={styles.chevron}
                  aria-hidden="true"
                  data-empty={!row.expandable || undefined}
                  onClick={(e) => {
                    if (!row.expandable) return
                    e.stopPropagation()
                    toggle(row.key)
                  }}
                >
                  {row.expandable ? (row.expanded ? '▾' : '▸') : '·'}
                </span>
                <span className={styles.rowLabel}>{row.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
