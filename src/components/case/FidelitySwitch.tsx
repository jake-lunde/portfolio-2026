'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useFidelity } from './fidelity'
import { CopyText as Copy } from '@/content/CopyText'
import { SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import styles from './FidelitySwitch.module.css'

/* FIDELITY.SW — the case's one hardware switch, riding the window bar's
   right slot (s94b, Jake's call: in the titlebar, and it has to READ as
   a toggle). A classic rocker: two labels, a track, a knob that slides.
   Pressing anywhere flips the whole case between draft and shipped;
   every paired plate (FidelityFrame) and HubModes' panes follow. Colors
   are all currentColor so it wears whatever ink the titlebar has, per
   skin and focus state.

   The titlebar drags and double-click zooms — this control, like
   TitleAction, lets neither fire from inside it. */

const SEEN_KEY = 'fidelity-callout-seen'
const BUBBLE_LIFE_MS = 8000

export function FidelitySwitch() {
  const mode = useFidelity((s) => s.mode)
  const set = useFidelity((s) => s.set)
  const reduced = useReducedMotion()
  const [bubble, setBubble] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const shipped = mode === 'shipped'

  /* THE CALLOUT — a one-time bubble under the switch, the FableMark
     idiom (shell/FableMark.tsx): the rocker is the case's one control
     and a first reader has no reason to look at the titlebar for it.
     The flag is written on the way OUT, whichever exit it takes, so the
     offer is made exactly once per browser. */
  const seal = useCallback(() => {
    setBubble(false)
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* private mode — the bubble just gets one more chance */
    }
  }, [])

  /* The bubble arrives when READING begins, not on a timer (Jake, s135b):
     the first real scroll anywhere in this window trips it. Scroll events
     don't bubble but they do capture, so one document-level capture
     listener hears the window body's scroller without knowing which
     element that is — and the same listener hears the page itself on the
     mobile full-bleed stack, where the document does the scrolling. It
     unhooks the moment it trips, or on the first scroll after another
     exit already sealed the offer.

     Client-only, post-mount: localStorage and the listener never run on
     the server, so there is nothing for hydration to disagree about. */
  useEffect(() => {
    let seen = true
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1'
    } catch {
      seen = false
    }
    if (seen) return
    const frame = ref.current?.closest('[data-window-id]')
    const unhook = () =>
      document.removeEventListener('scroll', onScroll, { capture: true })
    const onScroll = (e: Event) => {
      try {
        if (localStorage.getItem(SEEN_KEY) === '1') {
          unhook()
          return
        }
      } catch {}
      const t = e.target
      const scroller =
        t === document ? document.scrollingElement : t instanceof HTMLElement ? t : null
      if (!scroller || scroller.scrollTop <= 0) return
      // a scroll in some OTHER window's body is not this reader reading
      if (t !== document && frame && t instanceof Node && !frame.contains(t)) return
      unhook()
      setBubble(true)
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return unhook
  }, [])

  // every exit is the same exit: 8s, outside pointer, Escape, or a flip
  useEffect(() => {
    if (!bubble) return
    const life = setTimeout(() => seal(), BUBBLE_LIFE_MS)
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) seal()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') seal()
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(life)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [bubble, seal])

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        role="switch"
        aria-checked={shipped}
        aria-label="Fidelity: flip the whole case between draft and shipped"
        className={styles.sw}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onClick={() => {
          seal()
          sfx.tap()
          set(shipped ? 'draft' : 'shipped')
        }}
      >
        <span className={styles.side} data-on={!shipped ? 'true' : undefined}>
          Draft
        </span>
        <span className={styles.track} aria-hidden="true">
          <span className={styles.knob} />
        </span>
        <span className={styles.side} data-on={shipped ? 'true' : undefined}>
          Shipped
        </span>
      </button>

      <AnimatePresence>
        {bubble && (
          /* role=status, not a button: it announces itself and leaves
             focus wherever the reader left it. A press dismisses it —
             the switch it points at is one tab stop away. */
          <motion.div
            className={styles.bubble}
            role="status"
            onClick={seal}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -3 }}
            transition={reduced ? { duration: 0 } : SPRINGS.deck}
            data-spring="deck"
            style={{ transformOrigin: 'top right' }}
          >
            <Copy k="case.fidelity.callout" as="span" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
