'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { metric } from '@/lib/metrics'
import { sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText as Copy } from '@/content/CopyText'
import { avatarFor } from '@/components/shell/crew'
import { CARDS, type CardDef } from './answers'
import styles from './ai.module.css'

/* ASK MY AI — the window that replaced the WHAT MY AI THINKS essay.

   HYBRID by design, and the split is the whole idea. The five cards are
   ANSWERS, not prompts: authored prose that streams from answers.ts with
   a local typewriter and never touches the network — so the good stuff
   is free, instant, offline-proof, and says exactly what it should say.
   The composer underneath is a real wire to /api/ai-chat, capped at
   eight turns, and it carries the card Q&A along as history so a live
   follow-up knows what was already said.

   Register: the machine's own lines — greeting, errors, the cap — are
   MONO CAPS, because that is how this OS speaks. The answers are prose
   in the body face, because that is how a person reads an appraisal.
   (Same rule the retired essay ran on.)

   ANATOMY (session 43, Jake's re-cut). The window is a phone messages
   thread, not a panel: a contact header — FABLE's mask in a circle with
   the name under it — pinned at the top; the whole conversation scrolls
   beneath it, greeting included, as ordinary bubbles; the cards live in
   one horizontal carousel docked to the top of the composer, present
   from the first frame and staying there until each is spent. The old
   side-by-side header, the stacked empty state and the eyebrow-only
   chips are all gone: one place for identity, one place for the
   transcript, one place for the offers. */

const MAX_LEN = 500
const MAX_SENDS = 8 // matches the route's own count; the UI just gets there first
const CHARS_PER_FRAME = 3
const EMAIL = 'JAKELUNDE@ME.COM'
/* a spent card fades and slides before it leaves the rail. transitionend
   retires it; this is the belt-and-braces in case the transition never
   fires (a backgrounded tab freezes them) and the seat would stay empty. */
const EXIT_MS = 420

type Msg = {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** a machine line (error, the cap) rather than an answer — prints in
      mono caps and is kept OUT of the history sent to the model */
  system?: true
  /** which copy key a machine line came from, so EDIT.MODE can find it */
  copyKey?: string
  /** the fetch is out and nothing has come back — the bubble shows the
      turning mark instead of an empty box. Cleared by the first token. */
  pending?: true
}

/* The route answers a refusal with a SLUG, never a sentence — the copy
   layer owns the words, and the same slug has to read right in every
   skin. Anything unrecognised (and any body that isn't JSON) falls back
   to the generic dropped-wire line. */
const SLUG_COPY: Record<string, string> = {
  offline: 'aichat.offline', // no key, or Jake pulled AI_CHAT_OFF
  session: 'aichat.capped', // more than eight asks in this transcript
  budget: 'aichat.budget', // the day's ration is gone (per-IP or global)
  cooldown: 'aichat.error', // five seconds apart; "try again" covers it
}

/* An address printed on screen should be clickable. Splitting the line
   around it — rather than concatenating a link onto a shorter string —
   keeps the whole sentence ONE editable copy key, and degrades to flat
   text if a skin's voice ever rewrites the address away. */
function withMailto(line: string) {
  const at = line.indexOf(EMAIL)
  if (at === -1) return line
  return (
    <>
      {line.slice(0, at)}
      <a href={`mailto:${EMAIL.toLowerCase()}`}>{line.slice(at, at + EMAIL.length)}</a>
      {line.slice(at + EMAIL.length)}
    </>
  )
}

export default function AiChat() {
  const skin = useSettings((s) => s.skin)
  const reduced = useReducedMotion()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [used, setUsed] = useState<string[]>([])
  // spent but still on screen, playing its exit — kept out of `used` so
  // the seat holds its width until the fade finishes
  const [leaving, setLeaving] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [sends, setSends] = useState(0)
  const [busy, setBusy] = useState(false)
  // the day's budget is gone — the composer stays on screen but stops
  // taking questions, so nobody hammers a wire that is already spent
  const [spent, setSpent] = useState(false)
  const raf = useRef<number | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const hp = useRef<HTMLInputElement>(null)
  const seq = useRef(0)
  const exits = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const timers = exits.current
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
      timers.forEach(clearTimeout)
    }
  }, [])

  // follow the stream down. Behaviour is `auto`, not `smooth`: a smooth
  // scroll re-triggered every frame of the typewriter never arrives.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [msgs])

  const grow = (id: string, patch: (prev: Msg) => Msg) =>
    setMsgs((all) => all.map((m) => (m.id === id ? patch(m) : m)))

  /* the local typewriter — three characters a frame, which reads as
     "thinking out loud" at 60fps without ever being slow enough to
     annoy. Reduced motion gets the whole answer at once. */
  const typeOut = (id: string, full: string) => {
    if (reduced) {
      grow(id, (m) => ({ ...m, content: full }))
      setBusy(false)
      return
    }
    let i = 0
    const step = () => {
      i = Math.min(full.length, i + CHARS_PER_FRAME)
      const shown = full.slice(0, i)
      grow(id, (m) => ({ ...m, content: shown }))
      if (i < full.length) {
        raf.current = requestAnimationFrame(step)
      } else {
        raf.current = null
        setBusy(false)
      }
    }
    raf.current = requestAnimationFrame(step)
  }

  /* pull a spent card out of the rail for good. Idempotent, because both
     the transition and the fallback timer race to call it. */
  const retire = (id: string) => setUsed((u) => (u.includes(id) ? u : [...u, id]))

  const askCard = (card: CardDef) => {
    if (busy) return
    sfx.tap()
    if (reduced) {
      retire(card.id)
    } else {
      setLeaving((l) => (l.includes(card.id) ? l : [...l, card.id]))
      exits.current.push(setTimeout(() => retire(card.id), EXIT_MS))
    }
    const answerId = `a-${card.id}`
    setMsgs((all) => [
      ...all,
      { id: `u-${card.id}`, role: 'user', content: card.prompt },
      { id: answerId, role: 'assistant', content: '' },
    ])
    setBusy(true)
    // a card answer is already in the bundle — no wire, no wait, so no
    // thinking bubble; it goes straight to the typewriter
    typeOut(answerId, card.answer)
    metric('ai_chat_ask', { kind: 'card', card: card.id })
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const question = draft.trim()
    if (!question || busy || spent || sends >= MAX_SENDS) return

    // the model sees the card Q&A too — a follow-up like "say more about
    // the scrubbing thing" only works if the transcript came along
    const history = msgs
      .filter((m) => !m.system && m.content.length > 0)
      .map((m) => ({ role: m.role, content: m.content }))

    const n = ++seq.current
    const answerId = `live-a-${n}`
    setMsgs((all) => [
      ...all,
      { id: `live-u-${n}`, role: 'user', content: question },
      // PENDING: this is the wire, so there is a wait to show
      { id: answerId, role: 'assistant', content: '', pending: true },
    ])
    setDraft('')
    setSends((s) => s + 1)
    setBusy(true)
    sfx.tap()

    const fail = (key: string) =>
      grow(answerId, (m) => ({
        ...m,
        content: t(key, skin),
        system: true,
        copyKey: key,
        pending: undefined,
      }))

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: question }],
          website: hp.current?.value ?? '',
        }),
      })
      if (!res.ok || !res.body) {
        // the route names its refusal; the copy layer says it out loud
        let slug = ''
        try {
          const data: unknown = await res.json()
          const named = (data as { error?: unknown } | null)?.error
          if (typeof named === 'string') slug = named
        } catch {
          /* not JSON — the generic line is the honest answer */
        }
        if (slug === 'budget') setSpent(true)
        fail(SLUG_COPY[slug] ?? 'aichat.error')
      } else {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let got = 0
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          if (!chunk) continue
          got += chunk.length
          // the first token is what ends the thinking state — the mark
          // is replaced by the words it was waiting on
          grow(answerId, (m) => ({ ...m, content: m.content + chunk, pending: undefined }))
        }
        if (got === 0) fail('aichat.error')
      }
      metric('ai_chat_ask', { kind: 'live' })
    } catch {
      // the wire is allowed to drop; the cards still work, and saying so
      // in the machine's own voice beats a dead bubble
      fail('aichat.error')
    } finally {
      setBusy(false)
    }
  }

  const remaining = CARDS.filter((c) => !used.includes(c.id))
  const capped = sends >= MAX_SENDS
  const avatar = avatarFor('fable', skin)
  const mask = { WebkitMaskImage: `url(${avatar})`, maskImage: `url(${avatar})` }

  return (
    <div className={styles.chat}>
      {/* the contact header — who you are talking to, and nothing else.
          Borrowed wholesale from a phone thread: mask in a circle, name
          directly under it, both centred, both fixed above the scroll. */}
      <header className={styles.identity}>
        <span className={styles.avatar} aria-hidden="true" style={mask} />
        <p className={styles.name}>CLAUDE</p>
      </header>

      {/* polite, but BUSY while an answer streams: without that, a screen
          reader re-announces the bubble every frame of the typewriter.
          The finished answer announces once, when busy clears. */}
      <div className={styles.log} ref={logRef} aria-live="polite" aria-busy={busy}>
        {/* the greeting is a message, not chrome — first bubble in the
            thread, with the provenance line under it as an aside */}
        <Copy k="aichat.greeting" as="p" className={`${styles.said} ${styles.machine}`} />
        <Copy k="aichat.note" as="p" className={styles.note} />

        {msgs.map((m) => {
          if (m.role === 'user') {
            return (
              <p key={m.id} className={styles.ask}>
                {m.content}
              </p>
            )
          }
          if (m.pending) {
            return (
              <p key={m.id} className={`${styles.said} ${styles.thinking}`} role="status">
                <span className={styles.thinkMark} aria-hidden="true" style={mask} />
                <span className={styles.srOnly}>THINKING</span>
              </p>
            )
          }
          return (
            <p
              key={m.id}
              className={
                m.system ? `${styles.said} ${styles.machine} ${styles.saidSystem}` : styles.said
              }
              data-copy-id={m.copyKey}
            >
              {m.system ? withMailto(m.content) : m.content}
            </p>
          )
        })}
      </div>

      {/* the offers, docked to the composer. One rail, full cards, always
          on screen — an authored answer never has to be remembered from
          an empty state that scrolled away. */}
      {remaining.length > 0 && (
        <div className={styles.carousel}>
          {remaining.map((card) => (
            <button
              key={card.id}
              type="button"
              className={styles.card}
              disabled={busy}
              data-leaving={leaving.includes(card.id) ? '' : undefined}
              onClick={() => askCard(card)}
              onTransitionEnd={(e) => {
                if (e.propertyName === 'opacity' && leaving.includes(card.id)) retire(card.id)
              }}
            >
              <span className={styles.cardTop}>
                <span className={styles.cardEyebrow}>{card.eyebrow}</span>
                <span className={styles.cardArrow} aria-hidden="true">
                  →
                </span>
              </span>
              <span className={styles.cardPrompt}>{card.prompt}</span>
            </button>
          ))}
        </div>
      )}

      {capped ? (
        <p className={styles.capped} role="status" data-copy-id="aichat.capped">
          {withMailto(t('aichat.capped', skin))}
        </p>
      ) : (
        <form className={styles.composer} onSubmit={send}>
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
            type="text"
            className={styles.field}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LEN}
            disabled={busy || spent}
            aria-label={t('aichat.placeholder', skin)}
            placeholder={t('aichat.placeholder', skin)}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={busy || spent || !draft.trim()}
          >
            <Copy k="aichat.send" as="span" />
          </button>
        </form>
      )}
    </div>
  )
}
