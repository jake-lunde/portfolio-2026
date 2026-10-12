'use client'

/* THE PINNED LAYOUT (s146). A case section read as two halves: the text
   on the left, the section's visual pinned on the right under the
   read-o-meter while the text scrolls past it. It came out of the s146
   prototype on branch proto/plate-windows (option A at half and half,
   every paragraph visible, wide visuals opening in their own window),
   and Jake ruled that one configuration in for Greenlight Invest.

   OPT-IN PER CASE. A case wraps its MDX in <PinnedCase shapeOf={...}>,
   and the shapeOf it passes is the one place that says which visuals pin
   tall and which pin wide (Invest's lives in CaseInvest.tsx). Section
   (CaseComponents.tsx) hands its body to SectionBody below. With no
   PinnedCase above it, SectionBody renders exactly the markup the case
   had before, so Family Hub (no PinnedCase) is untouched.

   ONE TREE, TWO LAYOUTS. Under a PinnedCase the section always renders
   the same elements in MDX order, the visual in a pin box; whether the
   article has room for two columns (PIN_MIN, measured on the article,
   never the screen) only flips a data-pinned attribute, and CSS does the
   rest (case.module.css, PINNED LAYOUT). So the visuals keep their
   identity across the switch: opening the case, a deep link, or a window
   dragged across 900px never tears a film or a phone down and rebuilds
   it. Stacked, the pin box is a plain block and the section reads as it
   always did; pinned, the section is a grid, the text in the left column
   row by row and the pin box sticky in the right one.

   TALL visuals (one phone, a phone-sized card) pin at their own size: the
   plate spans the column and its stage stays natural size, zoomed down
   only when the whole plate would pass FIT of the scroller's height.
   WIDE visuals (a contact sheet, a page with callouts, a film) pin small:
   laid out at the article's old MEASURE and zoomed to the column, with a
   chip under them that opens them full size in a floating window
   (PlateWindow.tsx). CSS zoom rather than a transform: the browser lays
   the visual out again at the new size, so type and hairlines stay crisp,
   and the visuals' own pointer maths (getBoundingClientRect ratios) still
   lines up.

   Every paragraph stays visible. The one nearest the scroller's midline
   carries full ink and the others the muted role, so the eye has a place
   to sit beside the pinned visual. PinnedCase runs one scroll listener
   for the whole case, measures only the sections on screen, and writes
   the live paragraph as a DOM attribute when it changes, never as React
   state, so scrolling never re-renders a visual. */

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactElement,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'motion/react'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { sfx } from '@/lib/sound'
import { PlateWindow } from './PlateWindow'
import styles from './case.module.css'
import moatStyles from './moat.module.css'
import graphStyles from './graph.module.css'

export type PlateShape = 'tall' | 'wide'

/* below this article width every section stacks: the container's width,
   never the screen's (the s140 breakpoint rule in case.module.css) */
const PIN_MIN = 900
/* a wide visual's natural width: the 780px of text the article had
   before it widened (the 840px wrap less its two 30px shoulders) */
const MEASURE = 780
/* the share of the scroller's height a pinned plate may take */
const FIT = 0.8
/* room between the meter and the pinned visual */
const PIN_GAP = 16
/* the least a stage shrinks to. 04 seats three questions under its phone,
   and fitting all of that into FIT on a laptop would leave a phone too
   small to read, so the phone stops here and the plate runs long. A
   plate taller than the scroller shows its foot as the section ends and
   the pin lets go; nothing is clipped. */
const MIN_STAGE = 0.7

/* A tall visual's STAGE: the phone or card inside its plate, the one
   part that shrinks when the plate is too tall for the scroller. The cap
   row, tabs and questions around it keep their size. One selector per
   kind: LapFlow's cell, DemoReel's phone, the bullseye's and the graph's
   card frames. */
const STAGES = [styles.lapCell, styles.phoneShell, moatStyles.frame, graphStyles.frame]
  .map((c) => `.${c}`)
  .join(', ')

type Ctx = {
  shapeOf: (el: ReactElement) => PlateShape | null
  pinned: boolean
  /* the section whose visual is open full size; one at a time */
  openNo: string | null
  setOpenNo: Dispatch<SetStateAction<string | null>>
}

const PinnedCtx = createContext<Ctx | null>(null)

function scrollParent(from: Element | null): HTMLElement | null {
  for (let el = from?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el
  }
  return null
}

/* a section's paragraphs: its markdown <p>s (not the number line) and
   its lead, the grid's direct children */
function beatsOf(section: Element): Element[] {
  return Array.from(section.children).filter(
    (el) =>
      (el.tagName === 'P' && !el.classList.contains(styles.secNo)) ||
      el.classList.contains(styles.lead),
  )
}

/* The case's wrap. Measures the article (the case's container), flags
   itself pinned when there is room for two columns, and keeps the live
   paragraph of every section on screen. */
export function PinnedCase({
  shapeOf,
  className,
  children,
}: {
  /** which visual pins, and how: null keeps a child in the text column */
  shapeOf: (el: ReactElement) => PlateShape | null
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(false)
  const [openNo, setOpenNo] = useState<string | null>(null)

  // layout effect: the first paint after mount is already the right form
  useLayoutEffect(() => {
    const article = ref.current?.closest('article')
    if (!article) return
    const read = () => {
      const on = article.clientWidth >= PIN_MIN
      setPinned(on)
      if (!on) setOpenNo(null)
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(article)
    return () => ro.disconnect()
  }, [])

  /* The live paragraph. One scroll listener for the case; an
     IntersectionObserver keeps the set of pinned sections on screen, and
     only those are measured. All reads first, then writes, and only where
     the answer changed. */
  useEffect(() => {
    const wrap = ref.current
    const scroller = scrollParent(wrap)
    if (!pinned || !wrap || !scroller) return
    const onScreen = new Set<Element>()
    let raf = 0
    const measure = () => {
      raf = 0
      const r = scroller.getBoundingClientRect()
      const line = (r.top + r.bottom) / 2
      const picks: Array<[Element[], Element | null]> = []
      for (const section of onScreen) {
        const beats = beatsOf(section)
        let best: Element | null = null
        let bestD = Infinity
        for (const b of beats) {
          const br = b.getBoundingClientRect()
          const d = Math.abs((br.top + br.bottom) / 2 - line)
          if (d < bestD) {
            bestD = d
            best = b
          }
        }
        picks.push([beats, best])
      }
      for (const [beats, best] of picks) {
        for (const b of beats) {
          const want = b === best ? 'live' : ''
          if (b.getAttribute('data-beat') !== want) b.setAttribute('data-beat', want)
        }
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onScreen.add(e.target)
          else onScreen.delete(e.target)
        }
        schedule()
      },
      { root: scroller },
    )
    wrap.querySelectorAll(`.${styles.pinned}`).forEach((s) => io.observe(s))
    scroller.addEventListener('scroll', schedule, { passive: true })
    const ro = new ResizeObserver(schedule)
    ro.observe(scroller)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      scroller.removeEventListener('scroll', schedule)
    }
  }, [pinned])

  const ctx = useMemo(() => ({ shapeOf, pinned, openNo, setOpenNo }), [shapeOf, pinned, openNo])

  return (
    <PinnedCtx.Provider value={ctx}>
      <div ref={ref} className={className} data-pinned={pinned ? '' : undefined}>
        {children}
      </div>
    </PinnedCtx.Provider>
  )
}

/* Section's body: the head and children as they always were, unless a
   PinnedCase is above it and the section has a visual to pin. */
export function SectionBody({
  no,
  label,
  head,
  children,
}: {
  no: string
  label: string
  /** the number line and the title, as a keyed list */
  head: ReactNode[]
  children: ReactNode
}) {
  const ctx = useContext(PinnedCtx)
  const plain = (
    <>
      {head}
      {children}
    </>
  )
  if (!ctx) return plain
  const items = Children.toArray(children)
  // one visual pins per section: the first one the case names
  const visual = items.find(
    (c): c is ReactElement => isValidElement(c) && ctx.shapeOf(c) !== null,
  )
  if (!visual) return plain
  return (
    <PinnedSection
      no={no}
      label={label}
      head={head}
      items={items}
      visual={visual}
      shape={ctx.shapeOf(visual)!}
    />
  )
}

function PinnedSection({
  no,
  label,
  head,
  items,
  visual,
  shape,
}: {
  no: string
  label: string
  head: ReactNode[]
  items: ReactNode[]
  visual: ReactElement
  shape: PlateShape
}) {
  const { pinned, openNo, setOpenNo } = useContext(PinnedCtx)!
  const skin = useSettings((s) => s.skin)
  const rootRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const scalerRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLButtonElement>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [cap, setCap] = useState('')
  const wide = shape === 'wide'
  const open = pinned && wide && openNo === no
  // constant, not useId (programs reshape at the SSR handover)
  const winId = `plate-window-${no}`

  /* the case window the floating window portals into (none on a bench or
     in a story, and then there is no chip either), and the plate's own
     name off its cap row, for the chip's label and the window's title */
  useEffect(() => {
    setHost(rootRef.current?.closest<HTMLElement>('[data-window-id]') ?? null)
    const name = scalerRef.current?.querySelector(`.${styles.plateCap} > span`)?.textContent
    setCap(name?.trim() ?? '')
  }, [])

  /* Size the pinned visual. Re-runs when the scroller changes height
     (the window resizes) or the column changes width; stacked, every
     inline size comes off again. */
  useLayoutEffect(() => {
    const root = rootRef.current
    const pin = pinRef.current
    const scaler = scalerRef.current
    const scroller = scrollParent(root)
    if (!root || !pin || !scaler || !scroller) return
    const stage = wide ? null : scaler.querySelector<HTMLElement>(STAGES)
    const clear = () => {
      scaler.style.width = ''
      scaler.style.zoom = ''
      if (stage) stage.style.zoom = ''
    }
    if (!pinned) {
      clear()
      return
    }
    const fit = () => {
      const sh = scroller.clientHeight
      const meter = root.closest('article')?.querySelector<HTMLElement>(`.${styles.meter}`)
      const pinTop = (meter?.offsetHeight ?? 25) + PIN_GAP
      root.style.setProperty('--pin-top', `${pinTop}px`)
      if (wide) {
        // laid out at the old measure, zoomed to the column's width
        scaler.style.width = `${MEASURE}px`
        scaler.style.zoom = String(pin.getBoundingClientRect().width / MEASURE)
        return
      }
      if (!stage) return
      // natural pass, then shrink the stage alone until the plate fits
      stage.style.zoom = ''
      const maxH = Math.min(sh * FIT, sh - pinTop - PIN_GAP)
      const plateH = scaler.getBoundingClientRect().height
      const stageH = stage.getBoundingClientRect().height
      const s = Math.min(1, (maxH - (plateH - stageH)) / stageH)
      if (s < 0.999) stage.style.zoom = String(Math.max(MIN_STAGE, s))
    }
    fit()
    // the section's width tracks the column's; its height doesn't move with the zoom
    const ro = new ResizeObserver(fit)
    ro.observe(scroller)
    ro.observe(root, { box: 'border-box' })
    let live = true
    document.fonts?.ready.then(() => live && fit())
    return () => {
      live = false
      ro.disconnect()
    }
  }, [wide, pinned])

  const close = useCallback(
    (returnFocus: boolean) => {
      const win = document.getElementById(winId)
      const focusInside = !!win && win.contains(document.activeElement)
      setOpenNo((n) => (n === no ? null : n))
      if (returnFocus || focusInside) chipRef.current?.focus({ preventScroll: true })
    },
    [no, winId, setOpenNo],
  )

  /* The window shuts when its section scrolls out of view: the pinned
     visual has gone up under the meter as the section ended, or the
     section has dropped out the bottom. */
  useEffect(() => {
    const root = rootRef.current
    const pin = pinRef.current
    const scroller = scrollParent(root)
    if (!open || !root || !pin || !scroller) return
    let raf = 0
    const check = () => {
      raf = 0
      const p = pin.getBoundingClientRect()
      const s = scroller.getBoundingClientRect()
      const pinTop = parseFloat(root.style.getPropertyValue('--pin-top')) || 0
      if (p.bottom < s.top + pinTop || p.top > s.bottom) close(false)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      scroller.removeEventListener('scroll', onScroll)
    }
  }, [open, close])

  /* One copy of a film at a time: while the window shows the full-size
     visual, the small one holds still. Its videos pause, and any play()
     its own visibility observer tries is undone on the spot. What was
     playing resumes on close. */
  useEffect(() => {
    const box = scalerRef.current
    if (!open || !box) return
    const playing = Array.from(box.querySelectorAll('video')).filter((v) => !v.paused)
    playing.forEach((v) => v.pause())
    const hold = (e: Event) => (e.target as HTMLVideoElement).pause()
    box.addEventListener('play', hold, true)
    return () => {
      box.removeEventListener('play', hold, true)
      playing.forEach((v) => v.play().catch(() => {}))
    }
  }, [open])

  const toggle = () => {
    if (open) {
      sfx.close()
      close(true)
      return
    }
    sfx.tap()
    setOpenNo(no)
  }

  const name = cap || label
  // the grid gives each head and text child a row, then a filler row the
  // pin box's spare height goes into (case.module.css)
  const rows = { '--pin-rows': head.length + items.length - 1 } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={styles.pinned}
      data-pinned={pinned ? '' : undefined}
      data-shape={shape}
      style={rows}
    >
      {head}
      {items.map((c) =>
        c !== visual ? (
          c
        ) : (
          <div key={`pin-${visual.key}`} ref={pinRef} className={styles.pin}>
            {/* inert while its full-size twin is open: one copy takes input */}
            <div ref={scalerRef} className={styles.pinScaler} inert={open || undefined}>
              {visual}
            </div>
            {wide && host && (
              <button
                ref={chipRef}
                type="button"
                className={styles.pinChip}
                aria-label={`${t('case.plate.openAria', skin)} ${name} ${t('case.plate.openAriaEnd', skin)}`}
                aria-expanded={open}
                aria-controls={open ? winId : undefined}
                onClick={toggle}
                onKeyDown={(e) => {
                  // the case window closes on Escape; this one only shuts its own
                  if (e.key === 'Escape' && open) {
                    e.stopPropagation()
                    close(true)
                  }
                }}
              >
                <CopyText k="case.plate.open" />
                <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        ),
      )}
      {wide &&
        host &&
        createPortal(
          <AnimatePresence>
            {open && (
              <PlateWindow
                key="plate-window"
                id={winId}
                host={host}
                title={name}
                label={t('case.plate.window', skin)}
                closeLabel={t('case.plate.close', skin)}
                onClose={() => {
                  sfx.close()
                  close(true)
                }}
              >
                {visual}
              </PlateWindow>
            )}
          </AnimatePresence>,
          host,
        )}
    </div>
  )
}
