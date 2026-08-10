'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import styles from './chat.module.css'

/* The chat anatomy, shared — the parts every window in LUNDE OS that
   holds a CONVERSATION is built from.

   The idea is Jake's (session 44): the agents live on the site, and
   clicking one pulls up a chat. So a chat is not a feature of ASK MY AI
   any more, it is a form the OS knows how to make: a centred identity
   header naming the unit, a feed that scrolls and follows itself down,
   and bubbles that ARRIVE — every one on the same spring rise, in the
   same two registers (the machine's mono caps for its own voice, body
   prose for anything it is quoting or explaining).

   What stays in a program is what only that program has: ASK MY AI's
   card rail and live wire, the SUGGESTION BOX's score plate and roast
   table. */

/** the gap between staggered siblings — the smallest beat that still
    reads as one-after-another rather than all-at-once */
export const FEED_STAGGER = 0.07

/* the one entrance in a chat window: opacity and a short rise on the
   WINDOW spring — the same spring the shell opens a window with, which
   is the right answer twice over, because a new message arriving is the
   same event at a smaller scale. `initial: false` is how reduced motion
   opts out: the node renders landed and no animation ever runs. */
export function riseIn(reduced: boolean, delay = 0) {
  return {
    initial: reduced ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: reduced ? { duration: 0 } : { ...SPRINGS.window, delay },
  }
}

/** Who you are talking to. Borrowed wholesale from a phone thread: mask
    in a circle, name directly under it, both centred and both fixed
    above the scroll. `role` is the optional second line. */
export function IdentityHeader({
  name,
  avatar,
  role,
}: {
  name: string
  avatar: string
  /** a node, not a string, so the caller can render it through the copy
      layer and keep its data-copy-id */
  role?: ReactNode
}) {
  return (
    <header className={styles.identity}>
      <span
        className={styles.avatar}
        aria-hidden="true"
        style={{ WebkitMaskImage: `url(${avatar})`, maskImage: `url(${avatar})` }}
      />
      <p className={styles.name}>{name}</p>
      {role !== undefined && <span className={styles.role}>{role}</span>}
    </header>
  )
}

/** The transcript. Polite, but BUSY while an answer is being written:
    without that, a screen reader re-announces the bubble on every frame
    of a typewriter. The finished answer announces once, when busy
    clears. Scroll follows the stream on `auto`, never `smooth` — a
    smooth scroll re-triggered every frame never arrives. */
export function Feed({ busy, children }: { busy?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  })
  return (
    <div className={styles.feed} ref={ref} aria-live="polite" aria-busy={busy}>
      {children}
    </div>
  )
}

export type BubbleTone = 'assistant' | 'user' | 'system'

/** One message. The `thinking` mark is a STATE of this component rather
    than a component of its own on purpose: the wait and the answer it
    turns into are the same message, and a separate component type would
    remount under the same key and replay the entrance — the one thing a
    chat feed must never do. */
export function Bubble({
  tone = 'assistant',
  machine = false,
  thinking,
  as = 'p',
  reduced = false,
  delay = 0,
  className,
  copyId,
  children,
}: {
  tone?: BubbleTone
  /** the machine's own voice — mono caps. `system` implies it. */
  machine?: boolean
  /** the wait: the unit's mask turning, and a label for the ear */
  thinking?: { mark: string; label: string }
  /** `div` for a bubble that holds block children of its own */
  as?: 'p' | 'div'
  reduced?: boolean
  delay?: number
  className?: string
  /** so EDIT.MODE can find a machine line that came from copy.json */
  copyId?: string
  children?: ReactNode
}) {
  const Tag = as === 'div' ? motion.div : motion.p
  const cls = [
    tone === 'user' ? styles.ask : styles.said,
    tone === 'system' || machine ? styles.machine : '',
    tone === 'system' ? styles.saidSystem : '',
    thinking ? styles.thinking : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag
      className={cls}
      role={thinking ? 'status' : undefined}
      data-copy-id={copyId}
      {...riseIn(reduced, delay)}
    >
      {thinking ? (
        <>
          <span
            className={styles.thinkMark}
            aria-hidden="true"
            style={{ WebkitMaskImage: `url(${thinking.mark})`, maskImage: `url(${thinking.mark})` }}
          />
          <span className={styles.srOnly}>{thinking.label}</span>
        </>
      ) : (
        children
      )}
    </Tag>
  )
}
