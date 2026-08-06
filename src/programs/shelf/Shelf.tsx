'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Stamp } from '@/components/primitives/Stamp'
import { CopyText as Copy } from '@/content/CopyText'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'
import { CASES, getCase } from '@/programs/projects/cases'
import { InstallOverlay } from './InstallOverlay'
import { ShelfBox } from './ShelfBox'
import styles from './shelf.module.css'

/* SHIPPED.SW · IDX-16 — the case studies as boxed retail software from a
   parallel 1992. Replaces IN PROGRESS (WIP-15), the installer dialog that
   never finished: two flagship cases have shipped, so the door sells what
   is here instead of apologizing for what isn't. Boxes that HAVE shipped
   install (and the install completes); boxes that haven't stay
   shrink-wrapped and keep the nudge wiring, verbatim, from the old window.

   A new case appears on this shelf by being in CASES — nothing here is
   registered twice. Optional `box` data (cases.ts) fills the back panel;
   without it the box still stands, just barer.

   Nudges: one per case per browser session. The pressed set lives in
   sessionStorage so the button can't be mashed, and the count is
   optimistic — the encouragement lands before the network does. */

const SENT_KEY = 'lunde-nudged'

const readSent = (): string[] => {
  try {
    const raw = sessionStorage.getItem(SENT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

export default function Shelf() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [durable, setDurable] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [sent, setSent] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [installing, setInstalling] = useState<string | null>(null)
  const hp = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLElement | null>(null)

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

  const startInstall = (slug: string, from: HTMLElement) => {
    trigger.current = from
    sfx.tap()
    setInstalling(slug)
  }

  // cancelled: focus goes back to the button that opened the layer
  const cancelInstall = useCallback(() => {
    setInstalling(null)
    trigger.current?.focus()
  }, [])

  // finished: the case window has focus now — taking it back would drop
  // the reader behind the window they just opened
  const finishInstall = useCallback(() => setInstalling(null), [])

  if (!CASES.length) {
    return <Copy k="progress.empty" as="p" className={styles.empty} />
  }

  const installingCase = installing ? getCase(installing) : undefined

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
        <Copy k="shelf.eyebrow" as="p" className={styles.eyebrow} />
      </header>

      <ul className={styles.grid}>
        {CASES.map((c, i) => (
          <li key={c.slug}>
            <ShelfBox
              c={c}
              index={i}
              count={counts[c.slug] ?? 0}
              sent={sent.includes(c.slug)}
              busy={busy === c.slug}
              durable={durable}
              onNudge={(slug) => void nudge(slug)}
              onInstall={startInstall}
            />
          </li>
        ))}
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

      <AnimatePresence>
        {installingCase && (
          <InstallOverlay
            key={installingCase.slug}
            slug={installingCase.slug}
            name={installingCase.name}
            onCancel={cancelInstall}
            onDone={finishInstall}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
