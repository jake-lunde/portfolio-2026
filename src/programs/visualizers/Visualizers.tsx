'use client'

import { useState } from 'react'
import { RideViz } from './RideViz'
import { FlowerViz } from './FlowerViz'
import { ScrobblesViz } from './ScrobblesViz'
import { FlightsViz } from './FlightsViz'
import { SlopesViz } from './SlopesViz'
import { sfx } from '@/lib/sound'
import styles from './viz.module.css'

/* Registered visualizers — add a component and a LIVE entry; queued ideas
   stay as disabled chips (see the ideas doc). */

const LIVE = [
  { id: 'ride', label: 'Ride', component: RideViz },
  { id: 'flowers', label: 'Flowers', component: FlowerViz },
  { id: 'scrobbles', label: 'Scrobbles', component: ScrobblesViz },
  { id: 'flights', label: 'Flights', component: FlightsViz },
  { id: 'slopes', label: 'Slopes', component: SlopesViz },
] as const

const QUEUE = ['Louie', 'Daily tracker']

export default function Visualizers() {
  const [active, setActive] = useState<(typeof LIVE)[number]['id']>('ride')
  const Active = LIVE.find((v) => v.id === active)!.component

  return (
    <div className={`${styles.viz} crt-glow`}>
      <nav className={styles.vizNav} aria-label="Visualizers">
        {LIVE.map((v, i) => (
          <button
            key={v.id}
            className={styles.vizChip}
            aria-pressed={active === v.id}
            onClick={() => {
              sfx.tap()
              setActive(v.id)
            }}
          >
            {String(i + 1).padStart(2, '0')} · {v.label}
          </button>
        ))}
        {QUEUE.map((name, i) => (
          <button key={name} className={styles.vizChip} disabled>
            {String(LIVE.length + i + 1).padStart(2, '0')} · {name}
          </button>
        ))}
      </nav>
      <Active />
    </div>
  )
}
