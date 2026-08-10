'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
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
   transcript, one place for the offers.

   CHOREOGRAPHY (session 44, Jake's ruling: "the movement should feel
   like a chat feed"). Nothing in here is chrome that was always there —
   every part arrives the way a message arrives. On open the greeting
   bubble rises in alone, and only once it has landed does the rail lazy
   in behind it, card by card. While an answer is being written the rail
   LEAVES — it slides down and unmounts, so the offers are not sitting
   there competing with the sentence you asked for — and comes back on
   the same stagger, minus whatever you spent, the moment the answer
   finishes. Every appended bubble rides the same rise. The one thing
   that must NOT re-enter is the thinking bubble turning into its answer:
   same key, same element type, so it morphs where it stands. */

const MAX_LEN = 500
const MAX_SENDS = 8 // matches the route's own count; the UI just gets there first
const CHARS_PER_FRAME = 3
const EMAIL = 'JAKELUNDE@ME.COM'
/* the feed's beats. The greeting gets a head start so the rail reads as
   arriving BEHIND it rather than with it; 70ms between cards is the
   smallest gap that still reads left-to-right instead of all-at-once. */
const GREETING_BEAT = 0.14
const CARD_STAGGER = 0.07

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

/* the one entrance in this window: opacity and a short rise on the
   WINDOW spring — the same spring the shell opens a window with, which
   is the right answer twice over, because a new message arriving is the
   same event at a smaller scale. `initial: false` is how reduced motion
   opts out: the node renders landed and no animation ever runs. */
function riseIn(reduced: boolean, delay = 0) {
  return {
    initial: reduced ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: reduced ? { duration: 0 } : { ...SPRINGS.window, delay },
  }
}

export default function AiChat() {
  const skin = useSettings((s) => s.skin)
  const reduced = !!useReducedMotion()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [used, setUsed] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [sends, setSends] = useState(0)
  const [busy, setBusy] = useState(false)
  // the day's budget is gone — the composer stays on screen but stops
  // taking questions, so nobody hammers a wire that is already spent
  const [spent, setSpent] = useState(false)
  const raf = useRef<number | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const hp = useRef<HTMLInputElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const seq = useRef(0)
  // a card press unmounts the rail out from under the button that was
  // pressed, which drops focus on <body> and restarts the tab order
  const stole = useRef(false)

  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
  }, [])

  // …so when the answer is finished, hand focus to the composer — the
  // honest next step. Guarded on <body> so we only ever take back the
  // focus we dropped, never focus somebody else is using.
  useEffect(() => {
    if (busy || !stole.current) return
    stole.current = false
    if (document.activeElement === document.body) field.current?.focus()
  }, [busy])

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

  const askCard = (card: CardDef) => {
    if (busy) return
    sfx.tap()
    /* spent immediately — no per-card exit to run any more. The whole
       rail is about to leave (busy), and AnimatePresence plays out the
       frame it was removed on, so the card the visitor just pressed is
       still on screen for the fade and simply is not there when the
       rail comes back. */
    setUsed((u) => (u.includes(card.id) ? u : [...u, card.id]))
    stole.current = true
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
        {/* the greeting is a message, not chrome — ONE bubble, the hello
            in the machine's caps and the provenance line under it as a
            smaller aside. Two copy keys, one speech act: nothing in this
            feed is naked system text sitting outside a bubble. */}
        <motion.div
          className={`${styles.said} ${styles.machine}`}
          {...riseIn(reduced)}
        >
          <Copy k="aichat.greeting" as="p" className={styles.greetLine} />
          <Copy k="aichat.note" as="p" className={styles.note} />
        </motion.div>

        {msgs.map((m) => {
          if (m.role === 'user') {
            return (
              <motion.p key={m.id} className={styles.ask} {...riseIn(reduced)}>
                {m.content}
              </motion.p>
            )
          }
          /* pending and answered are the SAME element type under the same
             key on purpose: the thinking mark is replaced by the words in
             place, and the entrance — which only runs on mount — never
             gets a second chance to play. */
          return (
            <motion.p
              key={m.id}
              className={
                m.pending
                  ? `${styles.said} ${styles.thinking}`
                  : m.system
                    ? `${styles.said} ${styles.machine} ${styles.saidSystem}`
                    : styles.said
              }
              role={m.pending ? 'status' : undefined}
              data-copy-id={m.pending ? undefined : m.copyKey}
              {...riseIn(reduced)}
            >
              {m.pending ? (
                <>
                  <span className={styles.thinkMark} aria-hidden="true" style={mask} />
                  <span className={styles.srOnly}>THINKING</span>
                </>
              ) : m.system ? (
                withMailto(m.content)
              ) : (
                m.content
              )}
            </motion.p>
          )
        })}
      </div>

      {/* the offers, docked to the composer — and they come and go with
          the conversation. While an answer is being written the rail is
          gone; the fade covers its own reflow, so nothing under it jumps.
          The stagger is the same on the way back in, which is what makes
          the return read as "here are your remaining options" rather than
          as a panel blinking. */}
      <AnimatePresence>
        {remaining.length > 0 && !busy && (
          <motion.div
            key="rail"
            className={styles.carousel}
            /* the rail itself never plays an entrance — the CARDS do,
               one after another. It only owns the exit, where a single
               fading layer is what hides the reflow underneath it. */
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10, pointerEvents: 'none' }}
            transition={reduced ? { duration: 0 } : SPRINGS.window}
          >
            {remaining.map((card, i) => (
              <motion.div
                key={card.id}
                className={styles.seat}
                {...riseIn(reduced, (msgs.length === 0 ? GREETING_BEAT : 0) + i * CARD_STAGGER)}
              >
                <button type="button" className={styles.card} onClick={() => askCard(card)}>
                  <span className={styles.cardTop}>
                    <span className={styles.cardEyebrow}>{card.eyebrow}</span>
                    <span className={styles.cardArrow} aria-hidden="true">
                      →
                    </span>
                  </span>
                  <span className={styles.cardPrompt}>{card.prompt}</span>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
            ref={field}
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
