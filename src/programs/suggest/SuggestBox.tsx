'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Stamp } from '@/components/primitives/Stamp'
import { metric } from '@/lib/metrics'
import { gateSfx, sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText as Copy } from '@/content/CopyText'
import { avatarFor } from '@/components/shell/crew'
import { Bubble, Feed, IdentityHeader, riseIn } from '@/components/chat/Chat'
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
   working even when storage is down; only the stamp changes.

   ANATOMY (session 44). Jake's framing: the agents live on the site, and
   clicking one pulls up a CHAT. So this is no longer a panel with a
   mascot and a form — it is the same chat ASK MY AI runs, with DOPPLER
   at the top of it. The whole exchange is a feed: his greeting is the
   first message, every jab he throws at your draft is another message,
   your idea is a message, and the judgment arrives as three of his,
   one after another, the way a person delivers bad news. The form is
   now a composer; the AGAIN affordance waits under the last bubble.
   Anatomy and motion come from `@/components/chat`; what is left here
   is DOPPLER's own: the roast table, the score plate, the ledger stamp. */

const MAX = 140
const IDLE_MS = 3500
/* the beat between the three lines of the judgment. He does not dump the
   verdict, the methodology and the receipt at once — he lets each land.
   Reduced motion collapses it to zero and posts all three together. */
const BEAT_MS = 420

type Line = {
  id: string
  who: 'doppler' | 'visitor' | 'system'
  text?: string
  /** the verdict bubble wears the number above the line */
  score?: number
  /** the ledger bubble wears a stamp instead of a sentence */
  filed?: boolean
  /** the wire is out; the bubble turns DOPPLER's mask until it isn't */
  pending?: true
  /** holds block children, so it renders as a div and STAYS one — the
      element type has to survive the pending→judged morph untouched */
  plate?: true
  /** which copy key a machine line came from, so EDIT.MODE can find it */
  copyId?: string
}

export default function SuggestBox() {
  const skin = useSettings((s) => s.skin)
  const reduced = !!useReducedMotion()
  const [lines, setLines] = useState<Line[]>([{ id: 'greet', who: 'doppler', text: GREETING }])
  const [idea, setIdea] = useState('')
  const [busy, setBusy] = useState(false)
  // the judgment has landed in full — the composer closes and AGAIN opens
  const [judged, setJudged] = useState(false)
  const fired = useRef<Set<string>>(new Set())
  const peak = useRef(0) // longest the draft has been — for the wipe jab
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const beats = useRef<ReturnType<typeof setTimeout>[]>([])
  const hp = useRef<HTMLInputElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const uid = useRef(0)

  useEffect(() => {
    const timers = beats.current
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      timers.forEach(clearTimeout)
    }
  }, [])

  const say = (text: string) =>
    setLines((l) => [...l, { id: `d-${++uid.current}`, who: 'doppler', text }])

  const patch = (id: string, next: (l: Line) => Line) =>
    setLines((all) => all.map((l) => (l.id === id ? next(l) : l)))

  const onChange = (v: string) => {
    setIdea(v)
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
    const text = idea.trim()
    if (busy || judged || !text) return
    if (idleTimer.current) clearTimeout(idleTimer.current)
    setBusy(true)

    // the idea goes up as the visitor's own message; DOPPLER's answer
    // opens as the turning mark and becomes the verdict in place
    const verdictId = `v-${++uid.current}`
    setLines((l) => [
      ...l,
      { id: `u-${uid.current}`, who: 'visitor', text },
      { id: verdictId, who: 'doppler', pending: true, plate: true },
    ])
    setIdea('')

    const { score, verdict } = scoreIdea(text)
    let filed = false
    let jam: string | null = null
    let jamKey: string | undefined
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: text, score, verdict, website: hp.current?.value ?? '' }),
      })
      if (res.status === 429 || res.status === 400) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        jam = d.error ?? t('suggest.error', skin)
        jamKey = d.error === undefined ? 'suggest.error' : undefined
      } else {
        filed = res.ok
      }
    } catch {
      // storage down ≠ judgment down — score anyway, stamp honestly
      filed = false
    }

    if (jam !== null) {
      // the box jammed before it judged. The pending bubble becomes the
      // complaint, the draft comes back, and nothing was scored.
      patch(verdictId, (l) => ({
        ...l,
        who: 'system',
        text: jam ?? undefined,
        copyId: jamKey,
        pending: undefined,
      }))
      setIdea(text)
      setBusy(false)
      return
    }

    patch(verdictId, (l) => ({ ...l, text: verdict, score, pending: undefined }))
    if (score >= 90) gateSfx.success()
    else if (score < 35) gateSfx.fail()
    else sfx.open()
    metric('suggestion_score', { score, filed })

    // …then the methodology, then the receipt, on the beat
    const beat = reduced ? 0 : BEAT_MS
    beats.current.push(
      setTimeout(() => {
        setLines((l) => [...l, { id: `m-${++uid.current}`, who: 'doppler', text: METHODOLOGY }])
      }, beat),
      setTimeout(() => {
        setLines((l) => [...l, { id: `f-${++uid.current}`, who: 'doppler', filed }])
        setBusy(false)
        setJudged(true)
      }, beat * 2),
    )
  }

  const again = () => {
    setJudged(false)
    setIdea('')
    fired.current = new Set()
    peak.current = 0
    say(AGAIN_LINE)
    // the AGAIN button is about to unmount out from under the focus that
    // pressed it — hand it to the composer, which is the next move anyway
    field.current?.focus()
  }

  const avatar = avatarFor('doppler', skin)

  return (
    <div className={styles.box}>
      <IdentityHeader
        name="DOPPLER"
        avatar={avatar}
        role={<Copy k="suggest.reviewerRole" as="span" />}
      />

      <Feed busy={busy}>
        {lines.map((l) => (
          <Bubble
            key={l.id}
            tone={l.who === 'visitor' ? 'user' : l.who === 'system' ? 'system' : 'assistant'}
            machine={l.who === 'doppler'}
            as={l.plate ? 'div' : 'p'}
            thinking={l.pending ? { mark: avatar, label: t('suggest.judging', skin) } : undefined}
            copyId={l.copyId}
            reduced={reduced}
          >
            {l.score !== undefined ? (
              <>
                <span className={styles.scoreRow}>
                  <span className={styles.scoreNum}>{l.score}</span>
                  <span className={styles.scoreDen}>/100</span>
                </span>
                <span className={styles.verdictLine}>{l.text}</span>
              </>
            ) : l.filed !== undefined ? (
              <Stamp tone={l.filed ? 'blue' : 'pink'}>
                <Copy k={l.filed ? 'suggest.filed' : 'suggest.notFiled'} as="span" />
              </Stamp>
            ) : (
              l.text
            )}
          </Bubble>
        ))}

        {/* the way back in, under the last thing he said — a message-sized
            affordance rather than a panel swapping out beneath the feed */}
        {judged && (
          <motion.div className={styles.againRow} {...riseIn(reduced)}>
            <button type="button" className={styles.againBtn} onClick={again}>
              <Copy k="suggest.again" as="span" />
            </button>
          </motion.div>
        )}
      </Feed>

      <form className={styles.composer} onSubmit={submit}>
        <input
          ref={hp}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className={styles.hp}
        />
        <input
          ref={field}
          type="text"
          className={styles.field}
          value={idea}
          onChange={(e) => onChange(e.target.value)}
          maxLength={MAX}
          disabled={busy || judged}
          aria-label={t('suggest.label', skin)}
          placeholder={t('suggest.placeholder', skin)}
        />
        <span className={styles.count}>
          <Copy k="suggest.label" as="span" /> · {MAX - idea.length}
        </span>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={busy || judged || !idea.trim()}
        >
          <Copy k="suggest.submit" as="span" />
        </button>
      </form>
    </div>
  )
}
