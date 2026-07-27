'use client'

import { useEffect, useRef, useState } from 'react'
import { CASES } from '@/programs/projects/cases'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { metric } from '@/lib/metrics'
import { Stamp } from '@/components/primitives/Stamp'
import { CopyText as Copy } from '@/content/CopyText'
import { CaterpillarPeek, Leaf, PopIn, StageCritter, stageFor } from './critters'
import styles from './progress.module.css'

/* WIP-15 · In Progress — the leaf patch. Every case study is a leaf and a
   caterpillar is eating it: pct drives how many bites are missing, and the
   stage the row is at (0 egg · 1–99 caterpillar · 100 butterfly). The
   aggregate leaf up top is the mean of every case's progress.pct; each case
   gets its own leaf and a FEED button that writes a nudge blob (/api/nudge)
   and pings Jake. One nudge per case per browser session — the pressed set
   lives in sessionStorage so the button can't be mashed. */

const SENT_KEY = 'lunde-nudged'

const TRACKED = CASES.filter((c) => c.progress)

const readSent = (): string[] => {
  try {
    const raw = sessionStorage.getItem(SENT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

/** The meter is a leaf with bites taken out of it. Only the bite circles'
    opacity changes with pct — no width, no morph, no layout — so the
    machine-readable part (role + aria-value*) carries the real number. */
function LeafMeter({
  pct,
  role,
  label,
  large = false,
}: {
  pct: number
  role: 'progressbar' | 'meter'
  label: string
  large?: boolean
}) {
  const v = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <div
      className={large ? `${styles.leafTrack} ${styles.leafTrackLg}` : styles.leafTrack}
      role={role}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={label}
    >
      <Leaf pct={v} className={styles.leafSvg} />
    </div>
  )
}

export default function InProgress() {
  const open = useWindows((s) => s.open)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [durable, setDurable] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [sent, setSent] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hp = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSent(readSent())
    fetch('/api/nudge')
      .then((r) => r.json())
      .then((d) => {
        setCounts(d.counts ?? {})
        setDurable(Boolean(d.durable))
      })
      .catch(() => setDurable(false))
      .finally(() => setLoaded(true))
  }, [])

  const nudge = async (slug: string) => {
    if (busy || sent.includes(slug)) return
    setBusy(slug)
    setError(null)
    sfx.tap()
    // optimistic — the encouragement lands before the network does
    setCounts((c) => ({ ...c, [slug]: (c[slug] ?? 0) + 1 }))
    const nextSent = [...sent, slug]
    setSent(nextSent)
    try {
      sessionStorage.setItem(SENT_KEY, JSON.stringify(nextSent))
    } catch {}
    try {
      const res = await fetch('/api/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, website: hp.current?.value ?? '' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'The line went quiet.')
      if (typeof d.count === 'number') setCounts((c) => ({ ...c, [slug]: d.count }))
      metric('case_nudge', { slug })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The line went quiet.')
      setCounts((c) => ({ ...c, [slug]: Math.max(0, (c[slug] ?? 1) - 1) }))
      setSent((s) => s.filter((x) => x !== slug))
      try {
        sessionStorage.setItem(SENT_KEY, JSON.stringify(nextSent.filter((x) => x !== slug)))
      } catch {}
    } finally {
      setBusy(null)
    }
  }

  const mean = TRACKED.length
    ? Math.round(TRACKED.reduce((sum, c) => sum + (c.progress?.pct ?? 0), 0) / TRACKED.length)
    : 0

  if (!TRACKED.length) {
    return <Copy k="progress.empty" as="p" className={styles.empty} />
  }

  return (
    <div className={styles.wrap}>
      <input
        ref={hp}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className={styles.hp}
      />

      <header className={styles.head}>
        <Copy k="progress.eyebrow" as="p" className={styles.eyebrow} />
        <LeafMeter
          pct={mean}
          large
          role="progressbar"
          label={`Case studies overall: ${mean}% complete`}
        />
        <p className={styles.eta}>
          <Copy k="progress.etaLabel" as="span" />
          {': '}
          <Copy k="progress.eta" as="span" className={styles.etaValue} />
        </p>
        {/* one caterpillar comes up out of the header's rule on mount */}
        <div className={styles.peek} aria-hidden="true">
          <PopIn delay={0.18}>
            <CaterpillarPeek className={styles.peekSvg} />
          </PopIn>
        </div>
      </header>

      <ul className={styles.list}>
        {TRACKED.map((c, i) => {
          const pct = c.progress?.pct ?? 0
          const done = pct === 100
          const stage = stageFor(pct)
          const n = counts[c.slug] ?? 0
          const isSent = sent.includes(c.slug)
          return (
            <li key={c.slug} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.no}>{c.no}</span>
                <span className={styles.name}>{c.name}</span>
                <span className={styles.org}>{c.org}</span>
                <span className={styles.pct}>{pct}%</span>
              </div>
              <p className={styles.phase}>{c.progress?.phase}</p>
              <div className={styles.meterRow}>
                <span className={`${styles.critter} ${styles[stage]}`} aria-hidden="true">
                  <PopIn delay={0.05 * (i + 1)}>
                    <StageCritter stage={stage} className={styles.critterSvg} />
                  </PopIn>
                </span>
                <Copy k={`progress.stage.${stage}`} className={styles.sr} />
                <LeafMeter
                  pct={pct}
                  role="meter"
                  label={`${c.name}: ${pct}% — ${c.progress?.phase ?? ''}`}
                />
              </div>
              <div className={styles.actions}>
                {done ? (
                  <button
                    type="button"
                    className={styles.openBtn}
                    onClick={() => {
                      sfx.open()
                      open(`case:${c.slug}`)
                    }}
                  >
                    <Copy k="progress.readIt" as="span" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.nudgeBtn}
                      onClick={() => void nudge(c.slug)}
                      disabled={!durable || isSent || busy === c.slug}
                      aria-label={`Encourage Jake to work on ${c.name}`}
                    >
                      {isSent ? (
                        <Copy k="progress.nudged" as="span" />
                      ) : (
                        <Copy k="progress.nudge" as="span" />
                      )}
                    </button>
                    {n > 0 && (
                      <span className={styles.count} aria-label={`${n} nudges so far`}>
                        · {n}
                      </span>
                    )}
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <footer className={styles.foot} aria-live="polite">
        {loaded && !durable ? (
          <Stamp tone="pink">
            <Copy k="progress.offline" as="span" />
          </Stamp>
        ) : error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : (
          <Copy k="progress.nudgeHint" as="span" className={styles.hint} />
        )}
      </footer>
    </div>
  )
}
