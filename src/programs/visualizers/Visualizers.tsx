'use client'

import { RideViz } from './RideViz'
import styles from './viz.module.css'

/* Registered visualizers — one live, the rest queued (see the ideas doc).
   Adding one: build the component, add a chip here. */

const QUEUE = [
  'Louie (low-poly)',
  'Scrobbles',
  'Flights',
  'Slopes',
  'Daily tracker',
]

export default function Visualizers() {
  return (
    <div className={`${styles.viz} crt-glow`}>
      <nav className={styles.vizNav} aria-label="Visualizers">
        <button className={styles.vizChip} aria-pressed="true">
          01 · Ride
        </button>
        {QUEUE.map((name, i) => (
          <button key={name} className={styles.vizChip} disabled>
            {String(i + 2).padStart(2, '0')} · {name}
          </button>
        ))}
      </nav>
      <RideViz />
    </div>
  )
}
