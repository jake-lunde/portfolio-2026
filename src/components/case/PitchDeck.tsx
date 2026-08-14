'use client'

import { useEffect, useRef, useState } from 'react'
import { Plate } from './CaseComponents'
import styles from './case.module.css'

/* Plate 01 — the pitch, one group at a time. Nine groups exported from
   the vision deck (Figma 201266-2467) with transparent grounds, so the
   wireframes sit directly on the plate. Each group's deck annotation is
   live text in the cap row, in line with the FIG marker; annotations
   wider than the row tick slowly across it, faded at each edge. The
   intro group keeps its text in the image, so its annotation is empty.

   Two behaviors (Jake's s55 spec): with a fine pointer the stage is a
   hover scrub, cursor x picks the group; on touch it is a snap
   carousel, one group per swipe. Arrow keys step the stage when it has
   focus. The deck footer is live text pinned below either mode, per
   the source frame. */

const BASE = '/case/family-hub/pitch'

const SLIDES: Array<[file: string, w: number, h: number, label: string, alt: string]> = [
  ['01-ingredients', 1819, 642, '', 'Deck intro: “Greenlight helps your family plan, stay organized, and connected,” with the family, their needs, and the feature list'],
  ['02-mobile', 608, 609, 'Mobile view can provide a helpful home tab widget with the ability to dive into a more detailed planning view', 'The mobile companion, a home-screen widget plus a detailed planning view, shown on two phones'],
  ['03-ambient', 1085, 609, 'Home display is in it’s morning state, providing just what the family needs at a glance to get their day started (optimize for distance viewing/glanceability)', 'The home display in its morning ambient state: just what the family needs at a glance to start the day'],
  ['04-day', 1085, 609, 'Happening Now / Day View', 'Happening Now, the day view'],
  ['05-week', 1085, 609, 'This Week', 'This Week, the week view'],
  ['06-month', 1085, 609, 'This Month', 'This Month, the full month view'],
  ['07-ask', 1085, 609, 'Ask GL assistant', 'Ask GL, the assistant, invoked from the hub'],
  ['08-thinking', 1085, 609, 'Thinking', 'The assistant thinking'],
  ['09-response', 1085, 609, 'GL assistant responds by creating a new component along with related prompts and next steps', 'The assistant responding: a new component with related prompts and next steps'],
]

/* the active group's annotation, clipped to one line; when it
   overflows, a slow tick walks it across, held at both ends */
function CapTicker({ text }: { text: string }) {
  const box = useRef<HTMLSpanElement>(null)
  const [over, setOver] = useState(0)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setOver(Math.max(0, el.scrollWidth - el.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  return (
    <span ref={box} className={styles.capTicker} data-fade={over > 0 || undefined}>
      <span
        key={text}
        className={styles.capTickerLine}
        style={
          over > 0
            ? ({ '--tick-shift': `${-over}px`, '--tick-dur': `${Math.max(6, over / 22)}s` } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </span>
  )
}

export function PitchDeck({ fig, caption }: { fig: string; caption: string }) {
  const [fine, setFine] = useState(false)
  const [on, setOn] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const step = (d: number) =>
    setOn((v) => Math.min(SLIDES.length - 1, Math.max(0, v + d)))

  return (
    <Plate fig={fig} caption={caption} cap={<CapTicker text={SLIDES[on][3]} />}>
      <div className={styles.deck}>
        {fine ? (
          <div
            className={styles.deckStage}
            tabIndex={0}
            role="group"
            aria-label={`Vision deck, ${on + 1} of ${SLIDES.length}. Move the cursor across it, or use the arrow keys.`}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setOn(
                Math.min(
                  SLIDES.length - 1,
                  Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * SLIDES.length)),
                ),
              )
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') (e.preventDefault(), step(1))
              if (e.key === 'ArrowLeft') (e.preventDefault(), step(-1))
            }}
          >
            {SLIDES.map(([file, w, h, , alt], i) => (
              <img
                key={file}
                src={`${BASE}/${file}.webp`}
                width={w}
                height={h}
                alt={alt}
                aria-hidden={i !== on}
                data-on={i === on || undefined}
                draggable={false}
              />
            ))}
          </div>
        ) : (
          <div
            className={styles.deckScroll}
            aria-label="Vision deck, swipe through the groups"
            onScroll={(e) => {
              const el = e.currentTarget
              setOn(
                Math.min(
                  SLIDES.length - 1,
                  Math.max(0, Math.round(el.scrollLeft / el.clientWidth)),
                ),
              )
            }}
          >
            {SLIDES.map(([file, w, h, , alt]) => (
              <div key={file} className={styles.deckSlide}>
                <img src={`${BASE}/${file}.webp`} width={w} height={h} alt={alt} loading="lazy" draggable={false} />
              </div>
            ))}
          </div>
        )}
        <div className={styles.deckFooter}>
          <span>GLX product design</span>
          <span>2025</span>
        </div>
      </div>
    </Plate>
  )
}
