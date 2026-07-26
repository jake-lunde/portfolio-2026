'use client'

import { CopyText as Copy } from '@/content/CopyText'
import shared from '../programs.module.css'
import styles from './feedback.module.css'

/* FEEDBACK — what colleagues and users actually said.
   Sources: Jake's Lattice peer reviews (2024–2025) + Invest user research.
   Every note is real and attributed; nothing here is written for effect.

   These four used to be loose décor on the desktop (fixed position, hand
   -placed coordinates, hidden under 900px). They now live in a window, so
   the placement data is gone: notes tile in a flow grid, tilt comes from
   nth-child in feedback.module.css, and the layout is indifferent to how
   many there are — one column under ~430px of board, two above.

   ADDING ONE: append to NOTES. That is the whole ritual. `tone: 'pink'`
   is the expressive-accent wash — marks only, used sparingly (one or two
   notes), never as the default. */

type Note = { quote: string; cite: string; tone: 'paper' | 'pink' }

const NOTES: Note[] = [
  {
    quote: '“…even jumping into the code himself — high-fidelity prototypes, smart AI integrations, smooth animations.”',
    cite: 'PEER REVIEW · 2025',
    tone: 'paper',
  },
  {
    quote: '“A true experience architect — prototypes with new technology to prove concepts before deep design cycles.”',
    cite: 'PEER REVIEW · 2025',
    tone: 'pink',
  },
  {
    quote: '“It encouraged conversation.”',
    cite: 'PARENT · INVEST RESEARCH',
    tone: 'paper',
  },
  {
    quote: '“The numbers meant nothing to me.”',
    cite: 'KID, 13 · THE NOTE THAT STARTED INVEST',
    tone: 'paper',
  },
]

export default function Feedback() {
  return (
    <div className={styles.feedback}>
      <div className={shared.projHead}>
        <Copy k="feedback.head" as="span" />
        <span>
          {NOTES.length} note{NOTES.length === 1 ? '' : 's'}
        </span>
      </div>
      <div
        className={styles.board}
        role="group"
        aria-label="Notes from colleagues and users"
      >
        {NOTES.map((n, i) => (
          <figure key={i} className={styles.sticky} data-tone={n.tone}>
            <span className={styles.stickyTape} aria-hidden="true" />
            <blockquote className={styles.stickyQuote}>{n.quote}</blockquote>
            <figcaption className={styles.stickyCite}>{n.cite}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
