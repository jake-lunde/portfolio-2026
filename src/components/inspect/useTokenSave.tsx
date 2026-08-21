'use client'

import { useState } from 'react'
import { useSettings } from '@/store/settings'
import { CopyText } from '@/content/CopyText'
import { clearEditKey, readEditKey } from '@/lib/editKey'
import { MAX_EDITS, themeFor } from '@/lib/tokenEdit'
import { pendingEdits } from '@/lib/tune'
import { count as stylerCount, pendingEdits as stylerPendingEdits } from '@/lib/stylerTune'
import styles from './inspectShell.module.css'

/* SAVE, ONCE, FOR BOTH PANELS.
 *
 * The inspector proposed token edits first and owned the whole flow: read the
 * theme file's sha, post the pending set, keep the key gate, say what
 * happened. Then the STYLER stage arrived as a second place a person can be
 * standing when they decide to send it, and a second copy of this would be a
 * second place for the AA refusal, the edit cap and the 409 retry to drift
 * apart. So it moved into a hook, unchanged, and both docks call it.
 *
 * WHAT STAYED PUT. The gate is still a FUNCTION returning markup rather than a
 * component: a component declared inside a render body is a new type on every
 * render and the password input would lose focus mid-key. The id it carries is
 * still a constant passed in by the caller, never useId — this tree reshapes
 * at the SSR handover and a generated id mismatches across it — and the two
 * callers pass two different constants, because both docks are mounted at
 * once even while only one is on screen.
 *
 * SAVE still goes ARIA-disabled rather than `disabled`, so the button keeps
 * its place in the tab order and the aria-describedby reason stays reachable.
 * The click handler enforces what the attribute advertises.
 */

export type Save =
  /** nothing sent yet — the SAVE button is showing */
  | { k: 'idle' }
  | { k: 'busy' }
  /** committed: the override is on a branch, awaiting review — NOT live */
  | { k: 'done'; number: number; url: string }
  /** terse and retryable; `msg` is a copy key */
  | { k: 'error'; msg: string }
  /** no EDIT_MODE_KEY or no commit token on this deployment */
  | { k: 'locked' }

/** The key prompt is one form for both proposals. `for` remembers which one
    asked, so a successful arming goes on and does it. */
export type Gate = { for: 'token' | 'copy'; fail?: 'badkey' | 'throttled' } | null

export type Verdict = true | 'badkey' | 'throttled' | 'unconfigured'

export function useTokenSave({
  keyId,
  noteId,
  authenticate,
  onCopyArmed,
}: {
  /** constant, unique on the page — never useId */
  keyId: string
  noteId: string
  /** the copy engine's arming call: it is the thing that has to LEARN the
      session is armed, and the token half needs nothing but the stored key */
  authenticate: (key: string) => Promise<Verdict>
  /** what to do when the gate was opened by the COPY block */
  onCopyArmed?: () => void
}) {
  const skin = useSettings((s) => s.skin)
  const theme = useSettings((s) => s.theme)
  const [save, setSave] = useState<Save>({ k: 'idle' })
  const [gate, setGate] = useState<Gate>(null)
  const [keyInput, setKeyInput] = useState('')

  /* Which token file the desktop on screen is actually reading. */
  const target = themeFor(skin, theme)
  const pending = pendingEdits()
  const stylerHeld = stylerCount()
  const anyLive = pending.length > 0 || stylerHeld > 0

  /* The three reasons SAVE is not offered. A failing pick still PREVIEWS —
     that is the driver's seat — but a PR that lands an AA failure is a PR CI
     will paint red, so it never leaves the panel. The cap is the route's and
     it is not lifted here: a POST over it comes back 400, so the panel says
     the number instead of spending a round trip to be told. */
  const blocked = !target
    ? 'inspect.save.notheme'
    : pending.some((e) => e.fails)
      ? 'inspect.save.aafail'
      : pending.length + stylerHeld > MAX_EDITS
        ? 'styler.save.overcap'
        : null

  /* ---- SAVE: read the file's sha, then post the re-binds as a PR ---- */
  const commit = async () => {
    if (!target || blocked) return
    /* Both tiers in one list. The route validates, then partitions by
       tierOfRole and writes tokens/semantic/<theme>.json and every touched
       tokens/component/<id>.json into ONE commit on the same branch — which
       is the right shape, because a visitor who re-cast a role and re-bound a
       button did one piece of work and should get one PR for it. `theme`
       rides along on a component-only save too: the route needs the theme
       file's sha to parent the commit either way, and the GET below already
       fetched it. */
    const edits = [
      ...pendingEdits().map((e) => ({ role: e.role, token: e.token })),
      ...stylerPendingEdits(),
    ]
    if (edits.length === 0) return
    setSave({ k: 'busy' })
    try {
      const head = await fetch(`/api/token-commit?theme=${target}`, {
        headers: { 'x-edit-key': readEditKey() },
        cache: 'no-store',
      })
      if (head.status === 501) return setSave({ k: 'locked' })
      if (head.status === 401) {
        // the cached key is no good — drop it and ask again
        clearEditKey()
        return setGate({ for: 'token', fail: 'badkey' })
      }
      if (!head.ok) return setSave({ k: 'error', msg: 'inspect.save.failed' })
      const { sha } = (await head.json()) as { sha: string }

      const post = (baseSha: string) =>
        fetch('/api/token-commit', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-edit-key': readEditKey() },
          body: JSON.stringify({ theme: target, baseSha, edits }),
        })

      let res = await post(sha)
      /* A 409 hands back the revision that moved under us. These edits are
         DECLARATIVE — "this role now aliases that primitive" — so replaying
         them onto the fresh content is exactly what the visitor meant, and
         the server re-applies rather than the client patching blind. One
         retry only: a second 409 means something is genuinely churning, and
         at that point the honest answer is to say so. */
      if (res.status === 409) {
        const fresh = (await res.json().catch(() => ({}))) as { sha?: string }
        if (fresh.sha) res = await post(fresh.sha)
      }
      if (res.status === 409) return setSave({ k: 'error', msg: 'inspect.save.conflict' })
      if (!res.ok) {
        // the one refusal worth naming: the token already says this
        const why = (await res.json().catch(() => ({}))) as { error?: string }
        return setSave({
          k: 'error',
          msg: why.error === 'no change' ? 'inspect.save.nochange' : 'inspect.save.failed',
        })
      }
      const j = (await res.json()) as { prNumber: number; prUrl: string }
      setSave({ k: 'done', number: j.prNumber, url: j.prUrl })
    } catch {
      setSave({ k: 'error', msg: 'inspect.save.failed' })
    }
  }

  const saveInert = save.k === 'busy' || !!blocked

  /* What SAVE does, named so Cmd+S can do exactly it rather than a second
     version of it. With nothing pending it is a no-op: the key should not
     summon a key prompt for a set that is empty. */
  const requestSave = () => {
    if (saveInert || !anyLive) return
    if (readEditKey()) void commit()
    else setGate({ for: 'token' })
  }

  /* ---- the gate. One form, whichever proposal opened it. ---- */
  const arm = async (e: React.FormEvent) => {
    e.preventDefault()
    const entered = keyInput
    const asked = gate?.for ?? 'token'
    setKeyInput('')
    const verdict = await authenticate(entered)
    if (verdict === 'unconfigured') {
      setGate(null)
      if (asked === 'token') setSave({ k: 'locked' })
      return
    }
    if (verdict !== true) return setGate({ for: asked, fail: verdict })
    setGate(null)
    if (asked === 'token') await commit()
    else onCopyArmed?.()
  }

  /* The status line under the banner — one at a time, terse. */
  const note: { key: string; fail?: boolean } | null =
    save.k === 'busy'
      ? { key: 'inspect.save.saving' }
      : save.k === 'locked'
        ? { key: 'inspect.save.locked' }
        : save.k === 'error'
          ? { key: save.msg, fail: true }
          : blocked
            ? { key: blocked, fail: true }
            : null

  /* A refused key answers HERE rather than up in the SAVE banner's status
     line, because the gate is the thing that was refused and the banner is
     not always on screen to carry the message. */
  const keyGate = () => (
    <div className={styles.gate}>
      <form className={styles.keyRow} onSubmit={arm}>
        <label className={styles.keyLabel} htmlFor={keyId}>
          <CopyText k="inspect.save.key" />
        </label>
        <input
          id={keyId}
          type="password"
          className={styles.keyInput}
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <button type="submit" className={styles.resetAll}>
          <CopyText k="inspect.save.arm" />
        </button>
      </form>
      {gate?.fail && (
        <p className={styles.saveNote} data-fail="" role="alert">
          <CopyText
            k={gate.fail === 'throttled' ? 'inspect.save.throttled' : 'inspect.save.badkey'}
          />
        </p>
      )}
    </div>
  )

  /* The live region is mounted for the whole life of the banner, empty or
     not: a role="status" node that appears at the same moment as its text is
     announced unreliably, because there was no region to observe when the
     text arrived. */
  const saveStatus = () => (
    <div className={styles.saveStatus} role="status">
      {save.k === 'done' ? (
        <p className={styles.saveNote} id={noteId}>
          <CopyText k="inspect.save.done" />{' '}
          <a className={styles.prLink} href={save.url} target="_blank" rel="noreferrer noopener">
            {/* fragment + number, the same composition `inspect.on` uses */}
            <CopyText k="inspect.save.pr" />
            {save.number}
          </a>
        </p>
      ) : note ? (
        <p className={styles.saveNote} id={noteId} data-fail={note.fail || undefined}>
          <CopyText k={note.key} />
        </p>
      ) : null}
    </div>
  )

  return {
    save,
    setSave,
    gate,
    setGate,
    target,
    blocked,
    note,
    noteId,
    anyLive,
    saveInert,
    requestSave,
    keyGate,
    saveStatus,
  }
}
