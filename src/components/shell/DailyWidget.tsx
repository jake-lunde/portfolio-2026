'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { dailyGauges, pacificMinutes, pacificClock } from '@/lib/dailySystems'
import styles from './shell.module.css'

/* Ambient desktop widget — Jake's daily systems, always running in the
   bottom-left corner. Coffee + Lou's meds, computed live from Pacific
   time. Updates every 30s. Not in the Visualizers folder anymore. */

export function DailyWidget() {
  const [now, setNow] = useState<Date | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  if (!now) return null

  const t = pacificMinutes(now)

  return (
    <motion.aside
      className={styles.dailyWidget}
      aria-label="Daily systems — live"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRINGS.widget, delay: 0.4 }}
    >
      <div className={styles.dailyHead}>
        <span>DAILY.SYS</span>
        <span aria-hidden="true">{pacificClock(now)} PT</span>
      </div>
      {dailyGauges(t).map((g) => (
        <div key={g.id} className={styles.dailyRow}>
          <div className={styles.dailyLabel}>
            <span>{g.label}</span>
            <span className={styles.dailyPct}>{Math.round(g.pct)}%</span>
          </div>
          <div
            className={styles.dailyTrack}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(g.pct)}
            aria-label={`${g.label}: ${g.status}`}
          >
            <div className={styles.dailyFill} style={{ width: `${g.pct}%` }} />
          </div>
          <span className={styles.dailyStatus}>{g.status}</span>
        </div>
      ))}
    </motion.aside>
  )
}
