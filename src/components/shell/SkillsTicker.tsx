'use client'

import { useReducedMotion } from 'motion/react'
import styles from './shell.module.css'

/* The skills ticker — a slow departure-board crawl under the menu bar.
   Jake's list, plus the ones the site itself proves. Decorative
   (aria-hidden); the real evidence is behind the icons below it. */

const SKILLS = [
  'INTERACTION DESIGN',
  'ANIMATION',
  'CODE GENERATION',
  'PROMPT ENGINEERING',
  'PLUGIN CREATION',
  'HARDWARE DESIGN',
  'SOUND DESIGN',
  'PRODUCT MANAGEMENT',
  'MENTAL MODELING',
  'DESIGN SYSTEMS',
  'FINTECH FOCUS',
  // observed in the wild, added by the machine:
  'AGENT ORCHESTRATION',
  'DATA VISUALIZATION',
  'RAPID PROTOTYPING',
  'MOTION SYSTEMS',
  'TYPOGRAPHY',
  'ACCESSIBILITY',
]

export function SkillsTicker() {
  const reduced = useReducedMotion()
  const line = SKILLS.join('  ✦  ')

  return (
    <div className={styles.ticker} aria-hidden="true">
      {reduced ? (
        <span className={styles.tickerStatic}>{line}</span>
      ) : (
        <div className={styles.tickerTrack}>
          <span>{line}&nbsp;&nbsp;✦&nbsp;&nbsp;</span>
          <span>{line}&nbsp;&nbsp;✦&nbsp;&nbsp;</span>
        </div>
      )}
    </div>
  )
}
