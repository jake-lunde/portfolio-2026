'use client'

import { useFidelity } from './fidelity'
import styles from './case.module.css'

/* §01's three pitches. The grid is an island only so the case's one
   fidelity switch can reach the bet: flipped to shipped, the two
   pitches that lost dim and the one that won holds full (Jake, s134-r2
   — draft reads all three equal, the way the room saw them).

   The wrapper IS the grid, not a box around it: .move has to stay a
   direct child or the three-column track collapses. The mark is a data
   attribute, so the dimming is CSS (opacity only, transitioned) and
   Move itself stays static vocabulary in CaseComponents. Every case's
   moves come through here, so the CSS gates on a winner actually being
   named — a grid with no `won` card never dims, whatever the switch
   the reader last touched says. */

export function Moves({ children }: { children: React.ReactNode }) {
  const mode = useFidelity((s) => s.mode)
  return (
    <div className={styles.moves} data-fidelity={mode}>
      {children}
    </div>
  )
}
