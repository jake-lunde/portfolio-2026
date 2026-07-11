'use client'

import styles from './shell.module.css'

/* Sticky notes on the desktop — what colleagues and users actually said.
   Sources: Jake's Lattice peer reviews (2024–2025) + Invest user research.
   Décor layer: z under windows, hidden on small screens, aria label on the
   group; each note is real, attributed, and lightly rotated like it was
   slapped on the CRT housing. */

type Note = { quote: string; cite: string; tone: 'paper' | 'pink'; x: string; y: string; r: number }

const NOTES: Note[] = [
  {
    quote: '“…even jumping into the code himself — high-fidelity prototypes, smart AI integrations, smooth animations.”',
    cite: 'PEER REVIEW · 2025',
    tone: 'paper',
    x: 'right: 296px',
    y: 'top: 64px',
    r: -2.2,
  },
  {
    quote: '“A true experience architect — prototypes with new technology to prove concepts before deep design cycles.”',
    cite: 'PEER REVIEW · 2025',
    tone: 'pink',
    x: 'right: 168px',
    y: 'top: 176px',
    r: 1.6,
  },
  {
    quote: '“It encouraged conversation.”',
    cite: 'PARENT · INVEST RESEARCH',
    tone: 'paper',
    x: 'right: 356px',
    y: 'top: 212px',
    r: -1,
  },
  {
    quote: '“The numbers meant nothing to me.”',
    cite: 'KID, 13 · THE NOTE THAT STARTED INVEST',
    tone: 'paper',
    x: 'left: 44%',
    y: 'bottom: 84px',
    r: 2,
  },
]

const css = (n: Note): React.CSSProperties => {
  const [xk, xv] = n.x.split(': ')
  const [yk, yv] = n.y.split(': ')
  return { [xk]: xv, [yk]: yv, transform: `rotate(${n.r}deg)` } as React.CSSProperties
}

export function StickyNotes() {
  return (
    <div aria-label="Notes from colleagues and users" role="group">
      {NOTES.map((n, i) => (
        <figure key={i} className={styles.sticky} data-tone={n.tone} style={css(n)}>
          <span className={styles.stickyTape} aria-hidden="true" />
          <blockquote className={styles.stickyQuote}>{n.quote}</blockquote>
          <figcaption className={styles.stickyCite}>{n.cite}</figcaption>
        </figure>
      ))}
    </div>
  )
}
