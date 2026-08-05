'use client'

import { useEffect, useRef, useState } from 'react'
import { Stamp } from '@/components/primitives/Stamp'
import { metric } from '@/lib/metrics'
import { gateSfx, sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText as Copy } from '@/content/CopyText'
import { avatarFor } from '@/components/shell/crew'
import {
  AGAIN_LINE,
  GREETING,
  IDLE_LINE,
  METHODOLOGY,
  ROAST_RULES,
  WIPE_LINE,
  scoreIdea,
} from './roasts'
import styles from './suggest.module.css'

/* SUGGESTION BOX — 140 characters, one resident reviewer. DOPPLER (on
   loan from the deck) heckles the draft as it is typed and delivers a
   deterministic score on submit. Ideas post to /api/suggestions (write-
   only ledger — they go to Jake, not back on the wall). The roast keeps
   working even when storage is down; only the stamp changes. */

const MAX = 140
const IDLE_MS = 3500

type Result = { score: number; verdict: string; filed: boolean }

export default function SuggestBox() {
  const skin = useSettings((s) => s.skin)
  const [idea, setIdea] = useState('')
  const [line, setLine] = useState(GREETING)
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fired = useRef<Set<string>>(new Set())
  const peak = useRef(0) // longest the draft has been — for the wipe jab
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hp = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  const say = (next: string) => setLine(next)

  const onChange = (v: string) => {
    setIdea(v)
    setError(null)
    if (v.length === 0 && peak.current >= 20 && !fired.current.has('wipe')) {
      fired.current.add('wipe')
      say(WIPE_LINE)
      sfx.tap()
    }
    peak.current = Math.max(peak.current, v.length)
    for (const rule of ROAST_RULES) {
      if (fired.current.has(rule.id)) continue
      if (rule.test(v)) {
        fired.current.add(rule.id)
        say(rule.line)
        sfx.tap()
        break // one jab per keystroke — pacing is the joke's straight man
      }
    }
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (v.length >= 5 && v.length < MAX && !fired.current.has('idle')) {
      idleTimer.current = setTimeout(() => {
        fired.current.add('idle')
        say(IDLE_LINE)
      }, IDLE_MS)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy || !idea.trim()) return
    setBusy(true)
    setError(null)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    const { score, verdict } = scoreIdea(idea)
    let filed = false
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, score, verdict, website: hp.current?.value ?? '' }),
      })
      if (res.status === 429 || res.status === 400) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? t('suggest.error', skin))
        setBusy(false)
        return
      }
      filed = res.ok
    } catch {
      // storage down ≠ judgment down — score anyway, stamp honestly
      filed = false
    }
    setResult({ score, verdict, filed })
    say(verdict)
    if (score >= 90) gateSfx.success()
    else if (score < 35) gateSfx.fail()
    else sfx.open()
    metric('suggestion_score', { score, filed })
    setBusy(false)
  }

  const again = () => {
    setResult(null)
    setIdea('')
    setError(null)
    fired.current = new Set()
    peak.current = 0
    say(AGAIN_LINE)
  }

  return (
    <div className={styles.box}>
      <div className={styles.reviewer}>
        <span
          className={styles.avatar}
          aria-hidden="true"
          style={{
            WebkitMaskImage: `url(${avatarFor('doppler', skin)})`,
            maskImage: `url(${avatarFor('doppler', skin)})`,
          }}
        />
        <div className={styles.who}>
          <span className={styles.whoName}>DOPPLER</span>
          <Copy k="suggest.reviewerRole" as="span" className={styles.whoRole} />
        </div>
      </div>

      <p key={line} className={styles.bubble} aria-live="polite">
        {line}
      </p>

      {result === null ? (
        <form className={styles.form} onSubmit={submit}>
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
            <span>
              <Copy k="suggest.label" as="span" /> · {MAX - idea.length}
            </span>
            <textarea
              value={idea}
              onChange={(e) => onChange(e.target.value)}
              maxLength={MAX}
              required
              rows={3}
              placeholder={t('suggest.placeholder', skin)}
            />
          </label>
          <div className={styles.foot}>
            <button type="submit" className={styles.submitBtn} disabled={busy}>
              {busy ? <Copy k="suggest.judging" as="span" /> : <Copy k="suggest.submit" as="span" />}
            </button>
            {error && (
              <span className={styles.error} role="alert">
                {error}
              </span>
            )}
          </div>
        </form>
      ) : (
        <div className={styles.result} role="status">
          <div className={styles.scoreRow}>
            <span className={styles.scoreNum}>{result.score}</span>
            <span className={styles.scoreDen}>/100</span>
          </div>
          <p className={styles.method}>{METHODOLOGY}</p>
          <div className={styles.resultFoot}>
            <button type="button" className={styles.submitBtn} onClick={again}>
              <Copy k="suggest.again" as="span" />
            </button>
            {result.filed ? (
              <Stamp>
                <Copy k="suggest.filed" as="span" />
              </Stamp>
            ) : (
              <Stamp tone="pink">
                <Copy k="suggest.notFiled" as="span" />
              </Stamp>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
