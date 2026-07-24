'use client'

import { useEffect, useRef, useState } from 'react'
import { Stamp } from '@/components/primitives/Stamp'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText as Copy } from '@/content/CopyText'
import styles from './guestbook.module.css'

type Entry = { name: string; note: string; ts: number }

const fmt = (ts: number) =>
  new Date(ts)
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    .toUpperCase()

export default function Guestbook() {
  const skin = useSettings((s) => s.skin)
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [durable, setDurable] = useState(true)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signed, setSigned] = useState(false)
  const hp = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      setName(localStorage.getItem('lunde-guest-name') ?? '')
    } catch {}
    fetch('/api/guestbook')
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries ?? [])
        setDurable(Boolean(d.durable))
      })
      .catch(() => {
        setEntries([])
        setDurable(false)
      })
  }, [])

  const sign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, note, website: hp.current?.value ?? '' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? t('guestbook.error', skin))
      sfx.open()
      metric('guestbook_sign')
      setEntries((cur) => [d.entry, ...(cur ?? [])])
      setNote('')
      setSigned(true)
      try {
        localStorage.setItem('lunde-guest-name', name.trim())
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : t('guestbook.error', skin))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.book}>
      <form className={styles.form} onSubmit={sign}>
        <Copy k="guestbook.formHead" as="div" className={styles.formHead} />
        <input
          ref={hp}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className={styles.hp}
        />
        <label className={styles.field}>
          <Copy k="guestbook.nameLabel" as="span" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
            placeholder={t('guestbook.namePlaceholder', skin)}
          />
        </label>
        <label className={styles.field}>
          <span>
            <Copy k="guestbook.noteLabel" as="span" /> · {280 - note.length}
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
            required
            rows={3}
            placeholder={t('guestbook.notePlaceholder', skin)}
          />
        </label>
        <div className={styles.formFoot}>
          <button type="submit" className={styles.signBtn} disabled={busy || !durable}>
            {busy ? (
              <Copy k="guestbook.recording" as="span" />
            ) : signed ? (
              <Copy k="guestbook.signAgain" as="span" />
            ) : (
              <Copy k="guestbook.sign" as="span" />
            )}
          </button>
          {!durable && entries !== null && (
            <Stamp tone="pink">
              <Copy k="guestbook.storagePending" as="span" />
            </Stamp>
          )}
          {error && (
            <span className={styles.error} role="alert">
              {error}
            </span>
          )}
        </div>
      </form>

      <div className={styles.ledger} aria-live="polite">
        {entries === null ? (
          <Copy k="guestbook.readingLedger" as="p" className={styles.empty} />
        ) : entries.length === 0 ? (
          <Copy k="guestbook.empty" as="p" className={styles.empty} />
        ) : (
          entries.map((e) => (
            <article key={e.ts + e.name} className={styles.entry}>
              <div className={styles.entryMeta}>
                <span className={styles.entryName}>{e.name}</span>
                <time className={styles.entryTime} dateTime={new Date(e.ts).toISOString()}>
                  {fmt(e.ts)}
                </time>
              </div>
              <p className={styles.entryNote}>{e.note}</p>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
