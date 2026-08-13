'use client'

import { useEffect, useState } from 'react'
import styles from './case.module.css'

/* Plate 01 — the pitch, one group at a time. Nine groups exported from
   the vision deck (Figma 201266-2467), each padded onto the same 825px
   canvas so every group renders at the same scale in the stage.

   Two behaviors (Jake's s55 spec): with a fine pointer the stage is a
   hover scrub, cursor x picks the group; on touch it is a snap
   carousel, one group per swipe. Arrow keys step the stage when it has
   focus. The deck footer is live text pinned below either mode, per
   the source frame. Background #000 is the slide fill sampled from
   that frame, a GL artifact rather than LUNDE OS chrome, so it stays a
   hardcode (guardrail §5). */

const BASE = '/case/family-hub/pitch'

const SLIDES: Array<[file: string, w: number, alt: string]> = [
  ['01-ingredients', 1821, 'Deck intro: “Greenlight helps your family plan, stay organized, and connected,” with the family, their needs, and the feature list'],
  ['02-mobile', 732, 'The mobile companion, a home-screen widget plus a detailed planning view, shown on two phones'],
  ['03-ambient', 1085, 'The home display in its morning ambient state: just what the family needs at a glance to start the day'],
  ['04-day', 1085, 'Happening Now, the day view'],
  ['05-week', 1085, 'This Week, the week view'],
  ['06-month', 1085, 'This Month, the full month view'],
  ['07-ask', 1085, 'Ask GL, the assistant, invoked from the hub'],
  ['08-thinking', 1085, 'The assistant thinking'],
  ['09-response', 1085, 'The assistant responding: a new component with related prompts and next steps'],
]

export function PitchDeck() {
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
          {SLIDES.map(([file, w, alt], i) => (
            <img
              key={file}
              src={`${BASE}/${file}.webp`}
              width={w}
              height={825}
              alt={alt}
              aria-hidden={i !== on}
              data-on={i === on || undefined}
              draggable={false}
            />
          ))}
        </div>
      ) : (
        <div className={styles.deckScroll} aria-label="Vision deck, swipe through the groups">
          {SLIDES.map(([file, w, alt]) => (
            <div key={file} className={styles.deckSlide}>
              <img src={`${BASE}/${file}.webp`} width={w} height={825} alt={alt} loading="lazy" draggable={false} />
            </div>
          ))}
        </div>
      )}
      <div className={styles.deckFooter}>
        <span>GLX product design</span>
        <span>2025</span>
      </div>
    </div>
  )
}
