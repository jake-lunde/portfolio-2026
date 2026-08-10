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
  /** 0 = DESKTOP, 1 = a window, 2+ = its markup */
  depth: number
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
function meaningful(el: Element): boolean {
  if (!usable(el)) return false
  if (el.childElementCount > 0) return true
  const node = el as HTMLElement
  if (node.dataset?.copyId || node.dataset?.spring) return true
  return labelFor(node) !== el.tagName.toLowerCase()
}

/** Children worth showing, carrying their index in the parent so a key
    stays stable while siblings come and go around them. */
function kidsOf(el: HTMLElement): Array<{ i: number; el: HTMLElement }> {
  const out: Array<{ i: number; el: HTMLElement }> = []
  const kids = el.children
  for (let i = 0; i < kids.length && out.length < MAX_CHILDREN; i++) {
    if (meaningful(kids[i])) out.push({ i, el: kids[i] as HTMLElement })
  }
  return out
}

/** The key path from a window row down to `el`, so picking on the canvas
    can open the tree to it. Null when the element lives on the desktop
    itself rather than inside a window. */
function pathTo(el: HTMLElement): string[] | null {
  const win = el.closest<HTMLElement>('[data-window-id]')
  if (!win) return null
  const steps: number[] = []
  let node: Element = el
  while (node !== win) {
    const parent = node.parentElement
    if (!parent) return null
    steps.unshift(Array.prototype.indexOf.call(parent.children, node))
    node = parent
  }
  let acc = `win:${win.dataset.windowId}`
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

  useEffect(() => {
    const raf = requestAnimationFrame(() => setTick((n) => n + 1))
    return () => cancelAnimationFrame(raf)
  }, [windows])

  /* ---- reveal: a pick on the canvas opens the tree to it ---- */
  useEffect(() => {
    if (!picked) return
    const keys = pathTo(picked)
    if (!keys) return
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

    out.push({
      key: DESKTOP_KEY,
      el: desktop,
      label: t('inspect.desktop', skin),
      depth: 0,
      expandable: stack.length > 0,
      expanded: open && stack.length > 0,
      posinset: 1,
      setsize: 1,
    })
    if (!open) return out

    const walk = (el: HTMLElement, depth: number, prefix: string) => {
      const kids = kidsOf(el)
      kids.forEach(({ i, el: kid }, n) => {
        const key = `${prefix}>${i}`
        const canOpen = depth < MAX_DEPTH && kidsOf(kid).length > 0
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
        if (isOpen) walk(kid, depth + 1, key)
      })
    }

    stack.forEach((w, n) => {
      const el = document.querySelector<HTMLElement>(`[data-window-id="${CSS.escape(w.id)}"]`)
      if (!el) return
      const key = `win:${w.id}`
      const canOpen = kidsOf(el).length > 0
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
        setsize: stack.length,
      })
      if (isOpen) walk(el, 2, key)
    })

    return out
  }, [windows, expanded, skin, tick])

  // the roving tabindex must always land somewhere real
  useEffect(() => {
    if (!rows.some((r) => r.key === activeKey)) setActiveKey(rows[0]?.key ?? DESKTOP_KEY)
  }, [rows, activeKey])

  useEffect(() => {
    if (!wantFocus.current) return
    wantFocus.current = false
    treeRef.current
      ?.querySelector<HTMLElement>(`[data-row-key="${CSS.escape(activeKey)}"]`)
      ?.focus({ preventScroll: false })
  }, [activeKey, rows])

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
        <CopyText k="inspect.section.layers" />
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
            const isWindow = row.depth === 1
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
