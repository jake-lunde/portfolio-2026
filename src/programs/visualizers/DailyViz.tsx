'use client'

import { useEffect, useState } from 'react'
import styles from './viz.module.css'

/* The daily systems tracker — two gauges that run all day, every day,
   on Jake's schedule (Pacific time):
   COFFEE.SYS  — 0→50% from 06:30–08:00, 50→100% from 14:00–14:30
   LOUIE.MEDS  — dose 01 at 06:00 (50%), dose 02 at 18:30 (100%) */

type Gauge = { id: string; label: string; pct: number; status: string }

function pacificMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const h = +(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24
  const m = +(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return h * 60 + m
}

const ramp = (t: number, a: number, b: number, from: number, to: number) =>
  t <= a ? from : t >= b ? to : from + ((t - a) / (b - a)) * (to - from)

const until = (t: number, target: number) => {
  const d = target - t
  const h = Math.floor(d / 60)
  const m = Math.round(d % 60)
  return h > 0 ? `${h}H ${String(m).padStart(2, '0')}M` : `${m}M`
}

function gauges(t: number): Gauge[] {
  // coffee
  let coffeePct: number
  let coffeeStatus: string
  if (t < 390) {
    coffeePct = 0
    coffeeStatus = `BREWING BEGINS IN ${until(t, 390)}`
  } else if (t < 480) {
    coffeePct = ramp(t, 390, 480, 0, 50)
    coffeeStatus = 'MORNING POUR IN PROGRESS'
  } else if (t < 840) {
    coffeePct = 50
    coffeeStatus = `HOLDING · SECOND WAVE IN ${until(t, 840)}`
  } else if (t < 870) {
    coffeePct = ramp(t, 840, 870, 50, 100)
    coffeeStatus = 'AFTERNOON DOSE IN PROGRESS'
  } else {
    coffeePct = 100
    coffeeStatus = 'FULLY CAFFEINATED · RESETS AT MIDNIGHT'
  }

  // louie's pills
  let pillPct: number
  let pillStatus: string
  if (t < 360) {
    pillPct = 0
    pillStatus = `DOSE 01 IN ${until(t, 360)}`
  } else if (t < 1110) {
    pillPct = 50
    pillStatus = `DOSE 01 GIVEN · DOSE 02 IN ${until(t, 1110)}`
  } else {
    pillPct = 100
    pillStatus = 'ALL DOSES GIVEN · GOOD BOY'
  }

  return [
    { id: 'coffee', label: 'COFFEE.SYS', pct: coffeePct, status: coffeeStatus },
    { id: 'pills', label: 'LOUIE.MEDS', pct: pillPct, status: pillStatus },
  ]
}

export function DailyViz() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  if (!now) {
    return <p className={styles.scrubHint}>SYNCING WITH THE DAY…</p>
  }

  const t = pacificMinutes(now)
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)

  return (
    <div>
      <div className={styles.rideHead}>
        <h3 className={styles.rideTitle}>“the daily systems”</h3>
        <span className={styles.rideSub}>LIVE · {clock} PACIFIC · RUNS EVERY DAY</span>
      </div>

      {gauges(t).map((g) => (
        <div key={g.id} className={styles.panel} style={{ padding: '26px 14px 14px' }}>
          <span className={styles.panelLabel}>{g.label}</span>
          <div className={styles.gaugeRow}>
            <div
              className={styles.gaugeTrack}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(g.pct)}
              aria-label={g.label}
            >
              <div className={styles.gaugeFill} style={{ width: `${g.pct}%` }} />
              {[25, 50, 75].map((tick) => (
                <span key={tick} className={styles.gaugeTick} style={{ left: `${tick}%` }} />
              ))}
            </div>
            <span className={styles.gaugePct}>{Math.round(g.pct)}%</span>
          </div>
          <p className={styles.gaugeStatus}>{g.status}</p>
        </div>
      ))}

      <p className={styles.scrubHint}>
        Coffee ramps 06:30–08:00 and 14:00–14:30 · Louie’s doses at 06:00 and 18:30
      </p>
    </div>
  )
}
