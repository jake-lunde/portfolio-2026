'use client'

import { useEffect, useLayoutEffect } from 'react'
import { useSettings } from '@/store/settings'
import { toKnightSpeak } from './knightspeak'

/* The medieval voice, applied to text the copy layer never sees.

   copy.json covers labels and short strings; the prose does not live
   there — README paragraphs are JSX with inline links, case studies are
   MDX, and several programs carry no copy keys at all. Migrating that
   into keyed strings would flatten the markup and still leave every new
   paragraph untranslated by default. So this walks the rendered DOM
   instead: everything is translated unless it is explicitly exempt.

   The two paths never overlap. Nodes stamped `data-copy-id` are already
   resolved through SKIN_VOICE in copy.ts and are skipped here — critical,
   because EDIT.MODE commits `el.textContent`, so translating a keyed node
   in place would write knight-speak back into copy.json. */

/* Text under these is left alone: keyed copy (see above), code and
   sample text, editable regions (EDIT.MODE arms contenteditable), and
   `data-no-translate` as the author's escape hatch. */
const SKIP_TEXT =
  '[data-copy-id],[data-no-translate],[contenteditable],code,pre,kbd,samp,script,style,textarea'

/* Attributes are user-facing too (a placeholder is visible text, a label
   is what a screen reader says). Inputs are excluded from SKIP_TEXT's
   reasoning here: their attributes translate even though their value
   must not. */
const SKIP_ATTR = '[data-copy-id],[data-no-translate]'
const ATTRS = ['placeholder', 'aria-label', 'title'] as const

/* Originals are keyed off the live nodes so a switch back to classic
   restores exactly, and so repeat passes always translate from the
   source text rather than compounding on their own output. */
const originalText = new WeakMap<Text, string>()
const originalAttr = new WeakMap<Element, Map<string, string>>()
const touchedText = new Set<Text>()
const touchedAttr = new Set<Element>()

function translateText(node: Text) {
  const src = originalText.get(node) ?? node.nodeValue ?? ''
  if (!src.trim()) return
  const out = toKnightSpeak(src)
  if (out === src) return
  if (!originalText.has(node)) originalText.set(node, src)
  touchedText.add(node)
  if (node.nodeValue !== out) node.nodeValue = out
}

function translateAttrs(el: Element) {
  if (el.closest(SKIP_ATTR)) return
  for (const attr of ATTRS) {
    const stored = originalAttr.get(el)?.get(attr)
    const src = stored ?? el.getAttribute(attr)
    if (!src || !src.trim()) continue
    const out = toKnightSpeak(src)
    if (out === src) continue
    if (stored === undefined) {
      const map = originalAttr.get(el) ?? new Map<string, string>()
      map.set(attr, src)
      originalAttr.set(el, map)
      touchedAttr.add(el)
    }
    if (el.getAttribute(attr) !== out) el.setAttribute(attr, out)
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    const parent = (root as Text).parentElement
    if (parent && !parent.closest(SKIP_TEXT)) translateText(root as Text)
    return
  }
  if (!(root instanceof Element)) return

  if (!root.closest(SKIP_TEXT)) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const parent = n.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        return parent.closest(SKIP_TEXT)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT
      },
    })
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      translateText(n as Text)
    }
  }

  translateAttrs(root)
  for (const el of root.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(','))) {
    translateAttrs(el)
  }
}

function restoreAll() {
  for (const node of touchedText) {
    const src = originalText.get(node)
    if (src !== undefined && node.isConnected) node.nodeValue = src
  }
  touchedText.clear()
  for (const el of touchedAttr) {
    const map = originalAttr.get(el)
    if (!map || !el.isConnected) continue
    for (const [attr, src] of map) el.setAttribute(attr, src)
  }
  touchedAttr.clear()
}

/* Applied before paint so a medieval load doesn't flash English first.
   useLayoutEffect would warn during SSR, where it never runs anyway. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function KnightSpeakLayer() {
  const skin = useSettings((s) => s.skin)

  useIsomorphicLayoutEffect(() => {
    if (skin !== 'medieval') {
      restoreAll()
      return
    }

    let timer: ReturnType<typeof setTimeout> | 0 = 0
    const pending = new Set<Node>()

    const collect = (records: MutationRecord[]) => {
      for (const m of records) {
        if (m.type === 'characterData') {
          pending.add(m.target.parentElement ?? m.target)
        } else if (m.type === 'attributes') {
          pending.add(m.target)
        } else {
          for (const n of m.addedNodes) pending.add(n)
        }
      }
    }

    /* Programs are dynamic imports, so most text arrives after mount.
       Our own writes would re-trigger the observer, so a pass drains the
       queue and disconnects before writing, then reconnects — batched on
       a timer to stay off the critical path when a program animates text.
       Deliberately NOT requestAnimationFrame: rAF is frozen in a hidden
       tab, which would leave a backgrounded window untranslated until it
       was looked at (and makes the preview pane un-verifiable). */
    const observer = new MutationObserver((records) => {
      collect(records)
      if (!timer) timer = setTimeout(flush, 16)
    })

    const observe = () =>
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...ATTRS],
      })

    function flush() {
      timer = 0
      collect(observer.takeRecords())
      observer.disconnect()
      for (const root of pending) if (root.isConnected) walk(root)
      pending.clear()
      observe()
    }

    walk(document.body)
    observe()

    return () => {
      if (timer) clearTimeout(timer)
      observer.disconnect()
      restoreAll()
    }
  }, [skin])

  return null
}
