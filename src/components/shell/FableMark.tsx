'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import { useWindows } from '@/store/windows'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import styles from './shell.module.css'

/* FABLE in the menu bar — the system slot for "ask the machine about
   Jake". The AI that built this site is a permanent resident of the OS,
   so it lives where a resident lives: the bar, not a desktop icon.

   Seat: FIRST in the right cluster, ahead of SND/LGT and the clock. It
   is not a setting, so it has no business sitting between two toggles;
   and the clock keeps the corner, which is where a clock has been since
   1984. Leading the cluster also gives the discovery bubble room to hang
   under the mark without leaving the frame on a 360px screen.

   It stays visible at every width. The bar sheds its DECORATION when it
   collapses (the version string, the clock) — never its controls, and
   this is a way into a program. */

const SEEN_KEY = 'fable-mark-seen'
/* Boot holds the screen for ~950ms. Two seconds lands the bubble on a
   desktop the visitor is already looking at, not on the boot plate. */
const BUBBLE_IN_MS = 2000
const BUBBLE_LIFE_MS = 8000

export function FableMark() {
  const skin = useSettings((s) => s.skin)
  const open = useWindows((s) => s.open)
  const reduced = useReducedMotion()
  const [bubble, setBubble] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  /* the flag is written on the way OUT of the bubble, whichever exit it
     takes, so the offer is made exactly once per browser */
  const seal = useCallback(() => {
    setBubble(false)
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* private mode — the bubble just gets one more chance */
    }
  }, [])

  // client-only, post-mount: localStorage and the timer never run on the
  // server, so there is nothing for hydration to disagree about
  useEffect(() => {
    let seen = true
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1'
    } catch {
      seen = false
    }
    if (seen) return
    const show = setTimeout(() => setBubble(true), BUBBLE_IN_MS)
    return () => clearTimeout(show)
  }, [])

  // every exit is the same exit: 8s, outside pointer, Escape, or a press
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

  const ask = () => {
    seal()
    sfx.open()
    open('ai-chat')
  }

  return (
    <div className={styles.fableMark} ref={ref}>
      <button
        type="button"
        className={styles.fableBtn}
        onClick={ask}
        aria-label={t('fablemark.label', skin)}
      >
        {/* the glyph is scenery — the button's aria-label carries the
            meaning, and a bare "?" read aloud says nothing */}
        <span aria-hidden="true">?</span>
      </button>

      <AnimatePresence>
        {bubble && (
          /* role=status, not a button: it announces itself and leaves
             focus wherever the visitor left it. The press is a mouse
             convenience — the keyboard path is the mark it hangs from,
             one tab stop away and carrying the same action. */
          <motion.div
            className={styles.fableBubble}
            role="status"
            onClick={ask}
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -3 }}
            transition={reduced ? { duration: 0 } : SPRINGS.deck}
            data-spring="deck"
            style={{ transformOrigin: 'top right' }}
          >
            <Copy k="fablemark.bubble" as="span" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
