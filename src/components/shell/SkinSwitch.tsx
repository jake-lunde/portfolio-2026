'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Skin } from '@/store/settings'
import { useSettings } from '@/store/settings'
import { SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import styles from './shell.module.css'

/* Skin switch — a compact control trailing the wordmark that shows the
   active skin and flies out to reveal the rest. Each row wears its own
   skin: `data-skin` re-scopes the semantic tokens (surface/accent/mono)
   for that subtree, so the MEDIEVAL row is genuinely parchment + vermilion
   in its own display face — a live preview, not a mock. Underwater is a
   stub (no token scope yet) so it stays disabled + dimmed. */

const SKINS: Array<{ id: Skin; label: string; soon?: boolean }> = [
  { id: 'classic', label: 'CLASSIC' },
  { id: 'medieval', label: 'MEDIEVAL' },
  { id: 'underwater', label: 'UNDERWATER', soon: true },
]

export function SkinSwitch() {
  const skin = useSettings((s) => s.skin)
  const setSkin = useSettings((s) => s.setSkin)
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const current = SKINS.find((s) => s.id === skin) ?? SKINS[0]

  // close on outside pointer / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (sk: (typeof SKINS)[number]) => {
    if (sk.soon) return
    sfx.tap()
    if (sk.id !== skin) setSkin(sk.id)
    setOpen(false)
  }

  return (
    <div className={styles.skinSwitch} ref={ref}>
      <button
        className={styles.skinTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Skin: ${current.label}. Change skin`}
        onClick={() => {
          sfx.tap()
          setOpen((v) => !v)
        }}
      >
        <span className={styles.skinDotSm} aria-hidden="true" />
        <span className={styles.skinTriggerName}>{current.label}</span>
        <span className={styles.skinCaret} data-open={open} aria-hidden="true">
          ▾
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className={styles.skinMenu}
            role="menu"
            aria-label="Skin"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            transition={SPRINGS.deck}
            style={{ transformOrigin: 'top left' }}
          >
            {SKINS.map((sk) => (
              <li key={sk.id} role="none" data-skin={sk.id} className={styles.skinItemWrap}>
                <button
                  role="menuitemradio"
                  aria-checked={sk.id === skin}
                  className={styles.skinItem}
                  disabled={sk.soon}
                  onClick={() => choose(sk)}
                >
                  <span className={styles.skinDotSm} aria-hidden="true" />
                  <span className={styles.skinItemName}>{sk.label}</span>
                  {sk.soon ? (
                    <span className={styles.skinSoon}>SOON</span>
                  ) : sk.id === skin ? (
                    <span className={styles.skinCheck} aria-hidden="true">
                      ●
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
