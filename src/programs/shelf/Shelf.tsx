'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import { Stamp } from '@/components/primitives/Stamp'
import { CopyText as Copy } from '@/content/CopyText'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'
import { CASES, getCase } from '@/programs/projects/cases'
import { LaunchOverlay } from './LaunchOverlay'
import { ShelfBox } from './ShelfBox'
import styles from './shelf.module.css'

/* SHIPPED.SW · IDX-16 — the case studies as boxed retail software from a
   parallel 1992. Replaces IN PROGRESS (WIP-15), the installer dialog that
   never finished: two flagship cases have shipped, so the door sells what
   is here instead of apologizing for what isn't. Boxes that HAVE shipped
   PLAY (nobody installs a case study — they play it, and the loading
   screen is the 1992 beat before it opens); boxes that haven't stay
   shrink-wrapped and keep the nudge wiring, verbatim, from the old window.

   The shelf is a horizontal carousel, one row deep, and it is deliberately
   never fully in frame: a box is always cut by the right edge, because a
   shelf you can see all of is a shelf with nothing else on it.

   A new case appears on this shelf by being in CASES — nothing here is
   registered twice. Optional `box` data (cases.ts) fills the back panel;
   without it the box still stands, just barer.

   Nudges: one per case per browser session. The pressed set lives in
   sessionStorage so the button can't be mashed, and the count is
   optimistic — the encouragement lands before the network does. */

const SENT_KEY = 'lunde-nudged'

/* The carousel's turn, in two parts.

   REST is the standing angle every box holds, centred or not: a cuboid
   square-on to the camera IS a flat rectangle, so nothing on this shelf is
   ever allowed to face you dead-on. It is the angle stock sits at on a
   store endcap — turned just enough that the spine is a permanent surface.

   SWEEP modulates it by position. Sign matters: positive rotateY brings a
   box's LEFT edge toward the viewer, which is the spine, so the angle must
   stay positive across the row.

   The numbers are picked against the row's 980px perspective, which itself
   turns a box by roughly atan(offset / 980) — a box 300px right of the
   vanishing point already reads as 17deg turned. So the two compose:

     box position      actual rotateY   + perspective   = apparent turn
     far left (t=-1)        36deg          -20deg          ~16deg
     centre   (t= 0)        22deg            0deg          ~22deg
     far right(t=+1)         8deg          +30deg          ~38deg

   which is the point — every box on the shelf is turned, and the ones
   receding to the right are turned hardest, so the row reads as depth
   rather than as a filmstrip. Nothing approaches the 90deg where the back
   face would begin to show. */
const REST = 22
const SWEEP = 14

const readSent = (): string[] => {
  try {
    const raw = sessionStorage.getItem(SENT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

/* Scroll-linked depth, transform-only.

   Geometry (offsetLeft/offsetWidth — layout values, so a box's own rotation
   never feeds back into its measurement) is taken ONCE per resize and
   cached; the per-frame loop reads a single scrollLeft and writes N
   transforms. No rect reads in the loop, no layout thrash.

   The listener is passive and coalesced into one rAF: several scroll events
   inside a frame collapse to one write pass. OFF under reduced motion —
   there the boxes stay square-on and the row is a plain scroller. */
function useCarouselDepth(
  row: React.RefObject<HTMLUListElement | null>,
  enabled: boolean,
  count: number,
) {
  useEffect(() => {
    const el = row.current
    if (!el || !enabled) return

    let raf = 0
    let stages: {
      node: HTMLElement
      shadow: HTMLElement | null
      centre: number
      width: number
      depth: number
    }[] = []

    const paint = () => {
      raf = 0
      const half = el.clientWidth / 2
      if (!half) return
      const mid = el.scrollLeft + half
      for (const s of stages) {
        const t = Math.max(-1, Math.min(1, (s.centre - mid) / half))
        const deg = REST - SWEEP * t
        s.node.style.transform = `rotateY(${deg.toFixed(2)}deg)`
        if (!s.shadow) continue
        /* the footprint the box actually casts: a face of width w turned by
           `deg` covers w·cos(deg) plus d·sin(deg) of its own board, and its
           centre of mass slides toward the near edge. Both derived, not
           dialled in — the shadow is the box's own geometry, flattened. */
        const rad = (deg * Math.PI) / 180
        const squash = (s.width * Math.cos(rad) + s.depth * Math.abs(Math.sin(rad))) / s.width
        const slide = -Math.sin(rad) * (s.depth / 2)
        s.shadow.style.transform = `translateX(${slide.toFixed(1)}px) scaleX(${squash.toFixed(3)})`
      }
    }

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }

    const measure = () => {
      stages = Array.from(el.querySelectorAll<HTMLElement>('[data-stage]')).map((node) => {
        /* measured on the PLINTH, not the stage: the stage is absolutely
           positioned inside it, so its own offsetLeft is always 0. And
           offsetLeft is a LAYOUT value — a box's rotation can never feed
           back into the measurement that drives it. */
        const plinth = node.parentElement as HTMLElement
        return {
          node,
          shadow: plinth.querySelector<HTMLElement>('[data-shadow]'),
          centre: plinth.offsetLeft + plinth.offsetWidth / 2,
          width: plinth.offsetWidth || 1,
          depth: parseFloat(getComputedStyle(plinth).getPropertyValue('--box-d')) || 0,
        }
      })
      schedule()
    }

    el.addEventListener('scroll', schedule, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()

    return () => {
      el.removeEventListener('scroll', schedule)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
      for (const s of stages) {
        s.node.style.transform = ''
        if (s.shadow) s.shadow.style.transform = ''
      }
    }
  }, [row, enabled, count])
}

export default function Shelf() {
  const reduced = useReducedMotion()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [durable, setDurable] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [sent, setSent] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const hp = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const row = useRef<HTMLUListElement>(null)

  useCarouselDepth(row, !reduced, CASES.length)

  /* A shelf runs left-to-right but a mouse wheel only knows up-and-down, so
     vertical wheel over the row becomes horizontal scroll. Attached by hand
     because preventDefault needs a non-passive listener, which React's
     synthetic onWheel cannot give.

     It yields at the ends: once the row is against either stop the event is
     left alone so the page (or a scrolling parent) takes it. A horizontal
     gesture — trackpad, tilt wheel — is already correct and passes through
     untouched. */
  useEffect(() => {
    const el = row.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return
      const next = el.scrollLeft + e.deltaY
      if (next <= 0 && el.scrollLeft <= 0) return
      if (next >= max && el.scrollLeft >= max) return
      e.preventDefault()
      el.scrollLeft = Math.max(0, Math.min(max, next))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    setSent(readSent())
    fetch('/api/nudge')
      .then((r) => r.json())
      .then((d) => {
        setCounts(d.counts ?? {})
        setDurable(Boolean(d.durable))
      })
      .catch(() => setDurable(false))
      .finally(() => setLoaded(true))
  }, [])

  const nudge = async (slug: string) => {
    if (busy || sent.includes(slug)) return
    setBusy(slug)
    setError(null)
    sfx.tap()
    // optimistic — the encouragement lands before the network does
    setCounts((c) => ({ ...c, [slug]: (c[slug] ?? 0) + 1 }))
    const nextSent = [...sent, slug]
    setSent(nextSent)
    try {
      sessionStorage.setItem(SENT_KEY, JSON.stringify(nextSent))
    } catch {}
    try {
      const res = await fetch('/api/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, website: hp.current?.value ?? '' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'The line went quiet.')
      if (typeof d.count === 'number') setCounts((c) => ({ ...c, [slug]: d.count }))
      metric('case_nudge', { slug })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The line went quiet.')
      setCounts((c) => ({ ...c, [slug]: Math.max(0, (c[slug] ?? 1) - 1) }))
      setSent((s) => s.filter((x) => x !== slug))
      try {
        sessionStorage.setItem(SENT_KEY, JSON.stringify(nextSent.filter((x) => x !== slug)))
      } catch {}
    } finally {
      setBusy(null)
    }
  }

  const startPlay = (slug: string, from: HTMLElement) => {
    trigger.current = from
    sfx.tap()
    setPlaying(slug)
  }

  // cancelled: focus goes back to the button that opened the layer
  const cancelPlay = useCallback(() => {
    setPlaying(null)
    trigger.current?.focus()
  }, [])

  // finished: the case window has focus now — taking it back would drop
  // the reader behind the window they just opened
  const finishPlay = useCallback(() => setPlaying(null), [])

  if (!CASES.length) {
    return <Copy k="progress.empty" as="p" className={styles.empty} />
  }

  const playingCase = playing ? getCase(playing) : undefined

  return (
    <div className={styles.wrap}>
      <input
        ref={hp}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className={styles.hp}
      />

      <header className={styles.head}>
        <Copy k="shelf.eyebrow" as="p" className={styles.eyebrow} />
      </header>

      {/* one row, never two: a shelf is a line of boxes you walk along. The
          row is the 3D camera for every box on it (perspective lives here,
          in CSS) and the scroll surface the depth loop listens to. */}
      <ul className={styles.row} ref={row}>
        {CASES.map((c, i) => (
          <li key={c.slug} className={styles.slot}>
            <ShelfBox
              c={c}
              index={i}
              count={counts[c.slug] ?? 0}
              sent={sent.includes(c.slug)}
              busy={busy === c.slug}
              durable={durable}
              onNudge={(slug) => void nudge(slug)}
              onPlay={startPlay}
            />
          </li>
        ))}
      </ul>

      <footer className={styles.foot} aria-live="polite">
        {loaded && !durable ? (
          <Stamp tone="pink">
            <Copy k="progress.offline" as="span" />
          </Stamp>
        ) : error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : (
          <Copy k="progress.nudgeHint" as="span" className={styles.hint} />
        )}
      </footer>

      <AnimatePresence>
        {playingCase && (
          <LaunchOverlay
            key={playingCase.slug}
            slug={playingCase.slug}
            name={playingCase.name}
            onCancel={cancelPlay}
            onDone={finishPlay}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
