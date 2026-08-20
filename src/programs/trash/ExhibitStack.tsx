'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import { useSettings } from '@/store/settings'
import { SPRINGS } from '@/lib/motion'
import styles from './trash.module.css'

/* The exhibits clipped to a disposal record — the presentation deck that
   sold the idea, kept as a pile of photos. The top one flicks off to the
   right and the pile promotes; ‹ › pulls it back. Only the top three are
   mounted: the pile look needs two peeking edges, no more.

   Slides come from the team-library Figma (section Trash-Grows-With-You,
   node 201370:9616), exported via REST /v1/images and baked to webp at
   1280w in public/trash/levels/. Deck order, title slide first. */

const DIR = '/trash/levels'
const VISIBLE = 3

const SLIDES = [
  { file: 'levels-01', alt: 'Title slide: Levels, over a photo of a teen and his grandfather.' },
  { file: 'levels-02', alt: 'Spec sheet: the app organized into levels of feature access, complexity, and styling, with beginner and intermediate home screens side by side.' },
  { file: 'levels-03', alt: 'Miguel, 16, beside his savings goal screen at 40%, titled Making progress.' },
  { file: 'levels-04', alt: 'The Savvy Saver milestone card: three tasks completed to earn it.' },
  { file: 'levels-05', alt: 'A dad smiling at his phone: Miguel hit the Savvy Saver milestone, and a parent savings boost unlocked.' },
  { file: 'levels-06', alt: 'Levels of Readiness: skills stacked from savings goals at Level 1 up to taxes at Level 3.' },
  { file: 'levels-07', alt: 'Investing milestones: badges running from first investment to a free custom card.' },
  { file: 'levels-08', alt: 'The level-up moment: you are now a Level 2 Investor, with new tools unlocked.' },
]

/* the under-cards sit a little askew; the surfacing card straightens */
const TILT = [
  { rotate: 0, x: 0, y: 0 },
  { rotate: 1.6, x: 3, y: 5 },
  { rotate: -1.4, x: -4, y: 9 },
]

export default function ExhibitStack() {
  const [index, setIndex] = useState(0)
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const n = SLIDES.length

  const go = (d: number) => setIndex((i) => (i + d + n) % n)

  const flick = reduced
    ? { opacity: 0 }
    : { x: 170, rotate: 8, opacity: 0 }

  return (
    <figure className={styles.exhibits}>
      <div className={styles.pile}>
        <AnimatePresence initial={false}>
          {SLIDES.map((s, i) => {
            const depth = (i - index + n) % n
            if (depth >= VISIBLE) return null
            return (
              <motion.div
                key={s.file}
                className={styles.card}
                style={{ zIndex: VISIBLE - depth }}
                initial={flick}
                animate={{ ...TILT[depth], opacity: 1 }}
                exit={flick}
                transition={reduced ? { duration: 0.15 } : SPRINGS.human}
                aria-hidden={depth > 0 || undefined}
                onClick={depth === 0 ? () => go(1) : undefined}
                data-top={depth === 0 ? 'true' : undefined}
              >
                <img
                  src={`${DIR}/${s.file}.webp`}
                  alt={depth === 0 ? s.alt : ''}
                  loading={depth === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      <figcaption className={styles.exhibitFoot}>
        <button
          type="button"
          className={styles.exhibitBtn}
          onClick={() => go(-1)}
          aria-label={t('trash.exhibit.prev', skin)}
        >
          ‹
        </button>
        <span className={styles.exhibitCount}>
          <Copy k="trash.exhibit" as="span" /> {String(index + 1).padStart(2, '0')} /{' '}
          {String(n).padStart(2, '0')}
        </span>
        <button
          type="button"
          className={styles.exhibitBtn}
          onClick={() => go(1)}
          aria-label={t('trash.exhibit.next', skin)}
        >
          ›
        </button>
      </figcaption>
    </figure>
  )
}
