'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from '@/store/settings'
import { useInspect } from '@/store/inspect'
import { t } from '@/content/copy'
import { inspectElement, type Inspection } from '@/lib/inspect'
import { resetAll } from '@/lib/tune'
import { resetAll as stylerResetAll } from '@/lib/stylerTune'
import { LayersPanel } from './LayersPanel'
import { InspectorPanel } from './InspectorPanel'
import { useCopyEditing } from './useCopyEditing'
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
   · that bargain is now a NAMED PAIR rather than a hidden modifier.
     SELECT and OPERATE are the pair, one of them is always in the
     hand, the header says which — and ALT borrows the other one for the
     length of a click, in both directions. DevTools' picker toggle, and
     the reason a visitor who never finds the ALT key can still use the
     site with the tool up. There were three for a while: EDIT.MODE came
     in from its own program and stood as a third segment. Jake struck it.
     Rewriting a line is something you do to a PICK, so it lives in the
     inspector's COPY block and the switch is a pair again (see
     useCopyEditing.ts). The store holds the state (store/inspect.ts);
     everything here reads it through a ref so the listeners never restage.
   · the tool wears the crown. The OS menubar and the skills ticker stand
     down while the mode runs (shell.module.css) and this file draws an
     accent-flooded header across the canvas between the docks. Nothing
     of the shell sits above the tool in the hierarchy any more: the two
     panels and the header ARE the root frame, and the site is what is
     mounted inside them.
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
   so the gate is uniform and unmount takes the sheet with it.

   The crosshair is scoped to the CANVAS rather than sprayed across the
   document with !important. "Everything here is a specimen" stopped being
   true the moment the panels and the menubar became things you operate —
   and an !important cursor on every node in the document also lands on
   overlays this tool does not own. Descendant-of-canvas out-specifies the
   components' own cursor rules without the hammer. Dialogs opt out with
   the rest of the tool's chrome: a modal is a door, not a specimen.

   And the crosshair belongs to SELECT alone. In OPERATE the canvas is
   just the site: the pointer has to say so, which means the site's own
   cursors — the grab hand on a titlebar, the pointer on a link — come
   back untouched. ALT does not repaint it; a cursor that flickered on a
   modifier would be noise on every keystroke, and the header already
   holds the answer to "which tool am I holding".

   The HALO is deliberately NOT gated here, though the canvas stops
   raising one in OPERATE (see onOver). The tree still highlights the row
   under the pointer in either tool — that panel is the tool's own
   instrument, not the canvas, and it works the same in both hands. */
const GLOBAL_CSS = `
  body[data-inspectmode="on"][data-inspecttool="select"] [data-desktop-root],
  body[data-inspectmode="on"][data-inspecttool="select"] [data-desktop-root] *{
    cursor:crosshair;
  }
  body[data-inspectmode="on"] [data-inspect-self],
  body[data-inspectmode="on"] [data-inspect-self] *,
  body[data-inspectmode="on"] [role="dialog"],
  body[data-inspectmode="on"] [role="dialog"] *{
    cursor:auto;
  }
  body[data-inspectmode="on"] [data-inspect-hover]{
    outline:var(--border-width-strong) dashed var(--accent);
    outline-offset:2px;
  }
  body[data-inspectmode="on"] [data-inspect-picked]{
    outline:var(--border-width-strong) solid var(--accent);
    outline-offset:2px;
  }

  /* COPY EDITING (SYS-99). Same reason this sheet cannot be a CSS module:
     the subject is a [data-copy-id] node anywhere on the desktop.

     Two rules, and they are both about a STATE the visitor is in rather
     than a mode they picked up. Every copy node used to wear a dashed
     outline the moment the third tool came out — mode chrome, promising a
     caret on hundreds of nodes at once. What is left says only "the caret
     is HERE" and "this line is rewritten and not saved yet", and the
     second one has to survive the pick moving on, or a pending rewrite
     goes invisible the moment you look at the next thing.

     The caret rule out-specifies the SELECT crosshair above by coming
     later at equal weight, which is what keeps the pointer honest inside
     the one node you are typing in. */
  body[data-inspectmode="on"] [data-copy-id][contenteditable]{
    cursor:text;
    outline:var(--border-width-strong) solid var(--accent);
    outline-offset:2px;
    transition:none;
  }
  body[data-inspectmode="on"] [data-copy-id][data-edit-dirty]{
    background:color-mix(in srgb, var(--accent) 14%, transparent);
    box-shadow:inset 0 -2px 0 var(--accent);
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
  const tool = useInspect((s) => s.tool)
  const setTool = useInspect((s) => s.setTool)

  /* LIVE COPY EDITING, running for as long as the tool is up. It was a
     program at /edit that took the whole desktop, then a third segment in
     the switch above; it is an affordance on a pick now, and the inspector
     drives it one node at a time. The engine sits here rather than in the
     panel so the pending rewrites outlive any single pick — the whole
     point of one hand (useCopyEditing.ts). */
  const copyEdit = useCopyEditing()

  const [report, setReport] = useState<Inspection | null>(null)
  const [picked, setPicked] = useState<HTMLElement | null>(null)
  /** which TOKENS row has its candidate palette open — lifted here because
      Escape has to close it before it deselects (see the ladder below) */
  const [openVar, setOpenVar] = useState<string | null>(null)

  /* Who to hand focus back to. Captured during the FIRST RENDER, not in
     an effect: React runs child effects before the parent's, so by the
     time a mount effect here could look, LayersPanel has already moved
     focus into the tree and the opener is gone. Every exit path — the
     toggle, Escape and the 900px floor — ends in the same teardown, so
     restoring there covers all three. */
  const [opener] = useState<HTMLElement | null>(() =>
    typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null),
  )

  // the listeners bind once and read through refs, so they never go stale
  const pickRef = useRef<HTMLElement | null>(null)
  const openVarRef = useRef<string | null>(null)
  const toolRef = useRef(tool)
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

  /** The one element currently wearing the halo. Held in a ref so moving
      the pointer costs an attribute swap on two known nodes instead of a
      document-wide query per pointerenter. */
  const haloed = useRef<HTMLElement | null>(null)

  const hover = useCallback((el: HTMLElement | null) => {
    const was = haloed.current
    if (was === el) return
    was?.removeAttribute('data-inspect-hover')
    haloed.current = null
    if (el && document.contains(el)) {
      el.setAttribute('data-inspect-hover', '')
      haloed.current = el
    }
  }, [])

  /* ---- which tool is in the hand ----
     Three jobs, one effect, because they must never disagree: the ref the
     capture listeners read, the body attribute the crosshair rule reads,
     and dropping any halo the canvas raised on the way out of SELECT (an
     outline left hanging over a site you are now clicking through reads
     as a stuck selection). The attribute is written here rather than in
     the listener effect so switching tools costs an attribute, not a full
     unbind/rebind of six document listeners. */
  useEffect(() => {
    toolRef.current = tool
    document.body.setAttribute('data-inspecttool', tool)
    if (tool !== 'select') hover(null)
  }, [tool, hover])

  /** True when this pointer event is asking to PICK: the resting tool,
      inverted while ALT is down. One rule, both directions — which is
      what lets the hint say "alt is always the other tool" and be exact. */
  const picking = useCallback(
    (e: MouseEvent) => (toolRef.current === 'select' ? !e.altKey : e.altKey),
    [],
  )

  /* ---- the canvas: pick or operate, per the tool and the ALT key ---- */
  useEffect(() => {
    document.body.setAttribute('data-inspectmode', 'on')

    /* Never the subject:
       · our own chrome (panels, menubar) — the menubar holds the way OUT
         of the mode, and a preventDefault there strands the visitor;
       · anything inside a DIALOG. A fixed, inset:0 overlay (the zoomed
         print, the film modal, the shelf's launch overlay) covers the
         docks and the menubar both — it is painted above everything by
         design. Swallowing its dismiss click and eating its Escape left
         the visitor sealed in with no way back to the tool OR the site.
         A modal is a door; doors stay operable;
       · the ONE node holding the caret. Picking is picking now, so a click
         on the canvas takes what is under it — except inside the line the
         visitor is mid-rewrite, where a click means "put the caret here"
         and swallowing it would re-pick the node they are already in. */
    const exempt = (el: Element | null) =>
      !el ||
      !!el.closest('[data-inspect-self], [role="dialog"], [data-copy-id][contenteditable]')

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
      /* A keyboard activation (Enter/Space on a button) arrives as a click
         with detail 0 and clientX/Y of 0, which the drag test reads as a
         travelled pointer at the top-left corner — so it fell through to
         a pick, or didn't, depending on where the last real press landed.
         Keyboard always OPERATES: there is no pointer to have travelled,
         and picking by keyboard is the tree's job. */
      if (e.detail === 0) {
        downAt.current = null
        return
      }
      if (!target || exempt(target)) {
        downAt.current = null
        return
      }
      if (!picking(e)) {
        downAt.current = null
        // OPERATE (or SELECT with ALT held): the site works normally —
        // nothing is prevented, nothing is stopped, the click lands where
        // it would with no tool up at all
        return
      }
      const dragged = travelled(e)
      // one press, one decision — a stale origin must never judge the
      // next click (a drag that ended off-target leaves no click at all)
      downAt.current = null
      if (dragged) return // that was a window being arranged
      // the link, button or icon underneath does NOT fire: the site is an
      // object while the tool is up
      e.preventDefault()
      e.stopPropagation()
      pick(target)
    }

    /* Drill: with an ancestor already selected, a double-click walks ONE
       level down the chain toward the click rather than jumping to the
       deepest node. That is what makes a window row in the tree a usable
       starting point. With no ancestor selected it is just a click.

       Gated on the same one rule as the single click, which is what keeps
       the desktop's own double-click-to-open alive in OPERATE. */
    const onDouble = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target || exempt(target)) return
      if (!picking(e)) return
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

    /* The halo is SELECT's instrument: it answers "what would this click
       take?", and in OPERATE that question has no answer worth drawing —
       the click is going to the site. ALT is not consulted, for the same
       reason the cursor isn't: a halo that blinked on and off with a
       modifier is a flicker, not a reading. */
    const onOver = (e: Event) => {
      if (toolRef.current !== 'select') return
      const target = e.target as HTMLElement | null
      if (!target || exempt(target)) return
      hover(target)
    }
    const onOut = (e: Event) => {
      if ((e.target as HTMLElement | null) === haloed.current) hover(null)
    }

    /* Escape is a ladder, shallowest first: a candidate palette, then the
       selection, then the tool.

       Only the first two rungs swallow the key. The document has a dozen
       other Escape consumers — the skin flyout, the shelf overlay, the
       film, COMMAND.CTR, the click wheel, the zoomed print — and a
       capture-phase stopPropagation on EVERY Escape silently broke all of
       them for as long as the tool was up. So: while the tool has
       something of its own to close, it closes that and keeps the key;
       once it doesn't, the key is not its to take.

       And while a DIALOG is open the tool takes no rung at all. That
       Escape belongs to the door standing in front of the visitor — the
       zoomed print, the film, the shelf overlay — and every one of those
       listens for it on the window, in the bubble phase, underneath us.

       The test is whether a dialog is on screen, NOT whether focus is
       inside one. These overlays never take focus: the zoom is opened by
       clicking a print and the print keeps the caret, so an
       activeElement test reads "no dialog here" and confidently eats the
       key that was the only way out. Every dialog in this shell is
       conditionally mounted, so its presence in the document IS its
       open state. */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('[role="dialog"]')) return
      /* And a copy node holding the caret takes the rung above all three:
         there Escape puts the LINE back (useCopyEditing). Both handlers
         sit on `document` in the capture phase, where stopPropagation
         cannot separate them, so the ladder checks for the caret itself
         rather than hoping to be second. */
      if ((e.target as HTMLElement | null)?.closest?.('[data-copy-id][contenteditable]')) return
      if (openVarRef.current) {
        e.preventDefault()
        e.stopPropagation()
        setOpenVar(null)
        return
      }
      if (pickRef.current) {
        e.preventDefault()
        e.stopPropagation()
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
      document.body.removeAttribute('data-inspecttool')
      scrub('data-inspect-hover')
      haloed.current = null
    }
  }, [pick, deselect, setOn, hover, picking])

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

  /* ---- teardown: the desktop must not carry a single mark of ours, a
     preview must never outlive the tool that made it, and focus goes back
     where it came from. Dropping focus to <body> on the way out means the
     next Tab restarts at the top of the document — for a keyboard visitor
     that is the whole shell to walk again, every time they put the tool
     down. The menubar toggle is the fallback: it is where the mode lives,
     so it is never a wrong answer.

     ORDER MATTERS now that the menubar hides while the tool is up. A
     display:none element cannot take focus, so the flag has to be gone
     before the call. It is: the listener effect above is declared FIRST
     and React runs cleanups in declaration order, so `data-inspectmode`
     comes off the body — and the bar comes back into the layout — a
     statement before this one asks for the focus. Keep this effect last
     in the file.

     And <body> does not count as an opener. It is what activeElement
     reports when nothing is focused at all — the mode entered by deep
     link, or by a click the browser did not move focus for — and it
     passes document.contains() happily, so "restore the opener" was
     quietly restoring NOTHING on exactly the paths that most need a
     landing. Body means no opener; the toggle takes it. ---- */
  useEffect(
    () => () => {
      resetAll()
      // both tiers preview on the same root, and neither may outlive the
      // tool that wrote it (lib/stylerTune.ts)
      stylerResetAll()
      document.body.removeAttribute('data-inspectmode')
      document.body.removeAttribute('data-inspecttool')
      scrub('data-inspect-hover')
      scrub('data-inspect-picked')
      scrub('data-inspect-probe')
      const kept = opener && opener !== document.body && document.contains(opener) ? opener : null
      const home = kept ?? document.querySelector<HTMLElement>('[data-inspect-toggle]')
      home?.focus?.({ preventScroll: true })
    },
    [opener],
  )

  return (
    <>
      {/* this sheet is live in the document, and the picked outline lands
          BEFORE a reading is taken — the engine skips it by this marker so
          the panel never reports its own instrumentation as the subject's */}
      {/* eslint-disable-next-line react/no-danger */}
      <style data-inspect-style="" dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* THE CROWN. The OS bar and the ticker are hidden while this runs
          (shell.module.css), so this row is the top of the hierarchy and
          it belongs to the tool. `data-inspect-self` does double duty as
          ever: exempt from picking, exempt from the crosshair. */}
      <header className={styles.crown} data-inspect-head="" data-inspect-self="">
        <span className={styles.crownTitle}>{t('inspect.title', skin)}</span>
        <span className={styles.crownActive}>{t('inspect.active', skin)}</span>

        <div className={styles.tools} role="group" aria-label={t('inspect.tool.group', skin)}>
          <button
            type="button"
            className={styles.tool}
            data-inspect-tool="select"
            aria-pressed={tool === 'select'}
            onClick={() => setTool('select')}
          >
            {t('inspect.tool.select', skin)}
          </button>
          <button
            type="button"
            className={styles.tool}
            data-inspect-tool="operate"
            aria-pressed={tool === 'operate'}
            onClick={() => setTool('operate')}
          >
            {t('inspect.tool.operate', skin)}
          </button>
        </div>

        {/* A theme switch stood here, on the argument that flipping mid-nudge
            is the AA-judging workflow. Jake's call: the tool inspects the
            desktop it was opened on, and a second light switch inside the
            crown was one control too many for a bar that only has to say
            which tool is in the hand and how to put it down. The menubar's
            switch is still the switch. */}
        <button
          type="button"
          className={styles.crownBtn}
          data-inspect-exit=""
          onClick={() => setOn(false)}
          aria-label={t('inspect.exit', skin)}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

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
          picked={picked}
          copy={copyEdit}
          openVar={openVar}
          setOpenVar={setOpenVar}
          onRefresh={refresh}
          onPick={pick}
        />
      </aside>
    </>
  )
}
