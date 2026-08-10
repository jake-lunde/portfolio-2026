'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from '@/store/settings'
import { useInspect } from '@/store/inspect'
import { t } from '@/content/copy'
import { inspectElement, type Inspection } from '@/lib/inspect'
import { resetAll } from '@/lib/tune'
import { LayersPanel } from './LayersPanel'
import { InspectorPanel } from './InspectorPanel'
import styles from './inspectShell.module.css'

/* INSPECT.MODE — SYS-21, second draft. It used to be a window on the
   desktop that pointed at the rest of the desktop. Now it IS the desktop:
   a tool mode with a layers tree docked left, an inspector docked right,
   and the whole OS compressed between them as a live canvas.
   Nothing is a screenshot; the canvas is the running site.

   What changed, and why it changes the interaction law:

   · the mode is entered from the menubar, not by opening a program, so
     the panels are chrome rather than a document competing for the
     desktop with the thing they describe.
   · the old bargain was ALT+CLICK to inspect, plain click to use the
     site. In a tool mode that is backwards: while the tool is up, the
     site is an OBJECT — plain click selects it — and ALT is the key that
     reaches through and OPERATES it. Same modifier, inverted meaning,
     which is the Figma bargain and the reason it reads as a tool.
   · the desktop compresses by INSET, never by transform: scale(). A
     scaled ancestor traps position:fixed descendants (the photo zoom, the
     film modal) and desyncs Motion's drag coordinates. Every desktop
     child is absolute inside .desktop, so moving its left/right edges is
     a free reflow. See shell.module.css.

   The listener discipline is inherited wholesale from the window version,
   because it was proven against the shell's Escape handling and window
   churn: capture-phase delegation, our own UI exempt by data attribute,
   a MutationObserver re-read when the token ground moves, and a teardown
   that leaves the desktop without a single mark of ours.

   The engine is still src/lib/inspect.ts and it did not change. This file
   arms, listens and lays out; the panels render; nothing here computes a
   reading. */

/* Global affordances for nodes outside this module's scope — the whole
   desktop is the subject, so this cannot be a CSS module.

   Both the hover and the picked outline are gated on the armed body
   attribute now. The old bare [data-inspect-picked] selector existed
   because a pick had to SURVIVE disarming; a mode has no disarmed state,
   so the gate is uniform and unmount takes the sheet with it. */
const GLOBAL_CSS = `
  body[data-inspectmode="on"] *{
    cursor:crosshair !important;
  }
  body[data-inspectmode="on"] [data-inspect-self],
  body[data-inspectmode="on"] [data-inspect-self] *{
    cursor:auto !important;
  }
  body[data-inspectmode="on"] [data-inspect-hover]{
    outline:var(--border-width-strong) dashed var(--accent);
    outline-offset:2px;
  }
  body[data-inspectmode="on"] [data-inspect-picked]{
    outline:var(--border-width-strong) solid var(--accent);
    outline-offset:2px;
  }
`

/* Below this the desktop has already shed its widgets and a docked 548px
   of panels would leave no canvas at all. The menubar toggle hides here
   too (shell.module.css), so there is no way in and no way to be
   stranded. */
const FLOOR = '(max-width: 900px)'

/** A press that travelled is a drag, not a click — a window arranged by
    its titlebar must not also select it. Figma's own threshold. */
const DRAG_SLOP = 4

/** Strip every attribute this mode stamps on the desktop. */
function scrub(attr: string) {
  for (const n of document.querySelectorAll<HTMLElement>(`[${attr}]`)) n.removeAttribute(attr)
}

export default function InspectShell() {
  const skin = useSettings((s) => s.skin)
  const setOn = useInspect((s) => s.setOn)

  const [report, setReport] = useState<Inspection | null>(null)
  const [picked, setPicked] = useState<HTMLElement | null>(null)
  /** which TOKENS row has its candidate palette open — lifted here because
      Escape has to close it before it deselects (see the ladder below) */
  const [openVar, setOpenVar] = useState<string | null>(null)

  // the listeners bind once and read through refs, so they never go stale
  const pickRef = useRef<HTMLElement | null>(null)
  const openVarRef = useRef<string | null>(null)
  const downAt = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    openVarRef.current = openVar
  }, [openVar])

  /* ---- read the current pick (or drop it if the DOM moved on) ---- */
  const refresh = useCallback(() => {
    const el = pickRef.current
    if (!el || !document.contains(el)) {
      pickRef.current = null
      setPicked(null)
      setReport(null)
      return
    }
    setReport(inspectElement(el))
  }, [])

  const pick = useCallback((el: HTMLElement) => {
    scrub('data-inspect-picked')
    // a tree row outlives its node whenever the subject unmounts —
    // stamping a detached element reports a screenful of em-dashes
    if (!document.contains(el)) {
      pickRef.current = null
      setPicked(null)
      setReport(null)
      return
    }
    el.setAttribute('data-inspect-picked', '')
    pickRef.current = el
    setPicked(el)
    setReport(inspectElement(el))
  }, [])

  const deselect = useCallback(() => {
    scrub('data-inspect-picked')
    pickRef.current = null
    setPicked(null)
    setReport(null)
    setOpenVar(null)
  }, [])

  /** The tree drives the same halo the pointer does. */
  const hover = useCallback((el: HTMLElement | null) => {
    scrub('data-inspect-hover')
    if (el && document.contains(el)) el.setAttribute('data-inspect-hover', '')
  }, [])

  /* ---- the canvas: select on click, operate on ALT+click ---- */
  useEffect(() => {
    document.body.setAttribute('data-inspectmode', 'on')

    // our own chrome — panels and menubar — is never the subject. The
    // menubar is exempt on purpose: it holds the way OUT of the mode, and
    // a preventDefault there would strand the visitor in the tool.
    const exempt = (el: Element | null) => !el || !!el.closest('[data-inspect-self]')

    const onDown = (e: PointerEvent) => {
      downAt.current = { x: e.clientX, y: e.clientY }
    }

    const travelled = (e: MouseEvent) => {
      const from = downAt.current
      if (!from) return false
      return Math.abs(e.clientX - from.x) > DRAG_SLOP || Math.abs(e.clientY - from.y) > DRAG_SLOP
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target || exempt(target)) return
      if (e.altKey) return // ALT reaches through: the site works normally
      if (travelled(e)) return // that was a window being arranged
      // the link, button or icon underneath does NOT fire: the site is an
      // object while the tool is up
      e.preventDefault()
      e.stopPropagation()
      pick(target)
    }

    /* Drill: with an ancestor already selected, a double-click walks ONE
       level down the chain toward the click rather than jumping to the
       deepest node. That is what makes a window row in the tree a usable
       starting point. With no ancestor selected it is just a click. */
    const onDouble = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target || exempt(target)) return
      if (e.altKey) return
      e.preventDefault()
      e.stopPropagation()
      const current = pickRef.current
      if (current && current !== target && current.contains(target)) {
        let step: HTMLElement = target
        while (step.parentElement && step.parentElement !== current) step = step.parentElement
        pick(step)
        return
      }
      pick(target)
    }

    const onOver = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target || exempt(target)) return
      target.setAttribute('data-inspect-hover', '')
    }
    const onOut = (e: Event) => {
      ;(e.target as HTMLElement | null)?.removeAttribute?.('data-inspect-hover')
    }

    /* Escape is a ladder, shallowest first: a candidate palette, then the
       selection, then the tool. Capture + stopPropagation so the focused
       window's own Escape-to-close never fires underneath. */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      if (openVarRef.current) {
        setOpenVar(null)
        return
      }
      if (pickRef.current) {
        deselect()
        return
      }
      setOn(false)
    }

    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('dblclick', onDouble, true)
    document.addEventListener('pointerover', onOver, true)
    document.addEventListener('pointerout', onOut, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('dblclick', onDouble, true)
      document.removeEventListener('pointerover', onOver, true)
      document.removeEventListener('pointerout', onOut, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.removeAttribute('data-inspectmode')
      scrub('data-inspect-hover')
    }
  }, [pick, deselect, setOn])

  /* ---- EDIT.MODE (SYS-99) and this mode cannot both hold the desktop.
     The body flag is the contract; watching it settles both orders of
     arrival, and the editor is the one with unsaved work. ---- */
  useEffect(() => {
    const obs = new MutationObserver(() => {
      if (document.body.dataset.editmode) setOn(false)
    })
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-editmode'] })
    if (document.body.dataset.editmode) setOn(false)
    return () => obs.disconnect()
  }, [setOn])

  /* ---- a skin or theme flip swaps the whole token set, and both SKIN
     BUILDER's overrides and this panel's own nudges land on the root's
     style attribute: the current pick has to be re-READ, not just
     re-rendered. (Same observer SPEC.SHEET runs — one pattern.) ---- */
  useEffect(() => {
    const obs = new MutationObserver(refresh)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-skin', 'style'],
    })
    return () => obs.disconnect()
  }, [refresh])

  /* ---- the floor: no canvas left, so no tool ---- */
  useEffect(() => {
    const mq = window.matchMedia(FLOOR)
    const sync = () => {
      if (mq.matches) setOn(false)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [setOn])

  /* ---- teardown: the desktop must not carry a single mark of ours, and
     a preview must never outlive the tool that made it ---- */
  useEffect(
    () => () => {
      resetAll()
      document.body.removeAttribute('data-inspectmode')
      scrub('data-inspect-hover')
      scrub('data-inspect-picked')
      scrub('data-inspect-probe')
    },
    [],
  )

  return (
    <>
      {/* this sheet is live in the document, and the picked outline lands
          BEFORE a reading is taken — the engine skips it by this marker so
          the panel never reports its own instrumentation as the subject's */}
      {/* eslint-disable-next-line react/no-danger */}
      <style data-inspect-style="" dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <aside
        className={`${styles.panel} ${styles.left}`}
        data-inspect-self=""
        role="complementary"
        aria-label={t('inspect.panel.layers', skin)}
      >
        <LayersPanel picked={picked} onPick={pick} onHover={hover} />
      </aside>

      <aside
        className={`${styles.panel} ${styles.right}`}
        data-inspect-self=""
        role="complementary"
        aria-label={t('inspect.panel.inspector', skin)}
      >
        <InspectorPanel
          report={report}
          openVar={openVar}
          setOpenVar={setOpenVar}
          onRefresh={refresh}
        />
      </aside>
    </>
  )
}
