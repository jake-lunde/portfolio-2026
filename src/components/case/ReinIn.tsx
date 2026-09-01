'use client'

import { useState } from 'react'
import { sfx } from '@/lib/sound'
import { FidelityFrame } from './FidelityFrame'
import styles from './case.module.css'

/* "The rein-in" — three shipped surfaces, each carrying its loud early
   pass behind the case's one fidelity switch: the surface tabs are the
   plate's own, the draft/shipped flip is global, so a flip always
   compares the same surface. Both panes hold every shot stacked
   (opacity, not display) so a tab press swaps instantly with nothing
   left to load. Exports from the Figma "Plate 9" section (201451-5027),
   1086-wide WebP like the shipped screens.

   s134: the fidelity chip rides the plate's cap row from the MDX, so
   this only brings the stage and its what-control pills. */

const DIR = '/case/family-hub/reinin'

const SURFACES = [
  {
    id: 'chores',
    label: 'Chores',
    draft: {
      file: 'chores-draft',
      alt: 'The loud chores pass: a column per family member, every card its own saturated color — purple, teal, pink, oxblood — with photos and emoji riding along.',
    },
    shipped: {
      file: 'chores-shipped',
      alt: 'The shipped chores board: a white surface, quiet rows per family member, color pulled back to small teal progress marks.',
    },
  },
  {
    id: 'calendar',
    label: 'Calendar',
    draft: {
      file: 'calendar-draft',
      alt: 'The loud calendar pass: a week view with every event painted as a full block of saturated color, edge to edge.',
    },
    shipped: {
      file: 'calendar-shipped',
      alt: 'The shipped calendar: a white month grid, events as quiet cards with a thin color strip and the family’s avatars.',
    },
  },
  {
    id: 'saver',
    label: 'Screen saver',
    draft: {
      file: 'saver-draft',
      alt: 'The loud screensaver pass: a wall of colored tiles — clock, events, chores — crowding the family photo to one side.',
    },
    shipped: {
      file: 'saver-shipped',
      alt: 'The shipped screensaver: the family photo runs full-bleed, the clock and three up-next cards resting quietly on top.',
    },
  },
] as const

function Shots({ side, idx }: { side: 'draft' | 'shipped'; idx: number }) {
  return (
    <div className={styles.reinShot}>
      {SURFACES.map((s, i) => {
        const shot = s[side]
        return (
          <img
            key={shot.file}
            src={`${DIR}/${shot.file}.webp`}
            width={1086}
            height={611}
            alt={i === idx ? shot.alt : ''}
            aria-hidden={i === idx ? undefined : true}
            data-on={i === idx ? 'true' : undefined}
            loading="lazy"
            draggable={false}
          />
        )
      })}
    </div>
  )
}

export function ReinIn() {
  const [idx, setIdx] = useState(0)
  return (
    <div>
      <FidelityFrame
        draft={<Shots side="draft" idx={idx} />}
        shipped={<Shots side="shipped" idx={idx} />}
      />
      <div className={styles.plateTabs}>
        {SURFACES.map((s, i) => {
          const on = i === idx
          return (
            <button
              key={s.id}
              className={styles.plateTab}
              aria-pressed={on}
              onClick={() => {
                if (on) return
                sfx.tap()
                setIdx(i)
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
