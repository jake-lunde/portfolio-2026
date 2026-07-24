'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { useSettings } from '@/store/settings'
import { resolveCopy, type CopySlot } from '@/content/copy'
import styles from './editmode.module.css'

/* EDIT.MODE — SYS-99. Jake's in-place copy editor. Arm it with the shared
   key, then every [data-copy-id] node on the desktop becomes editable in
   place; dirty edits collect in the floating SAVE.CHANGES panel and commit
   straight to copy.json on main via /api/copy-commit.

   The secret key is verified server-side (timing-safe) and only ever held
   in sessionStorage on the client — it is never rendered, never logged. */

const KEY_STORE = 'lunde-edit-key'

type Edit = { key: string; slot: CopySlot; oldValue: string; newValue: string }
type Phase = 'checking' | 'locked' | 'armed' | 'unconfigured'

/** Resolve a slot's value from a raw copy.json string (used to recompute
    the "old" side of the diff after an upstream-change conflict). */
function resolveFromContent(content: string, key: string, slot: CopySlot): string {
  try {
    const o = JSON.parse(content) as Record<string, unknown>
    const e = o[key]
    if (slot === 'base') {
      if (typeof e === 'string') return e
      if (e && typeof e === 'object') return String((e as Record<string, unknown>).base ?? '')
      return ''
    }
    if (e && typeof e === 'object') return String((e as Record<string, unknown>)[slot] ?? '')
    return ''
  } catch {
    return ''
  }
}

/** Place the caret at the clicked point when we make a node editable. */
function caretToPoint(x: number, y: number) {
  const sel = window.getSelection()
  if (!sel) return
  type WithCaretRange = Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null }
  type WithCaretPos = Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  const range =
    (document as WithCaretRange).caretRangeFromPoint?.(x, y) ??
    (() => {
      const p = (document as WithCaretPos).caretPositionFromPoint?.(x, y)
      if (!p) return null
      const r = document.createRange()
      r.setStart(p.offsetNode, p.offset)
      r.collapse(true)
      return r
    })()
  if (range) {
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

const nodesFor = (key: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-copy-id="${CSS.escape(key)}"]`))

export default function EditMode() {
  const skin = useSettings((s) => s.skin)
  const reduced = useReducedMotion()

  const [phase, setPhase] = useState<Phase>('checking')
  const [keyInput, setKeyInput] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const [baseSha, setBaseSha] = useState<string | null>(null)
  const [committing, setCommitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [tokenMissing, setTokenMissing] = useState(false)

  // refs the document-level handlers read (they are bound once while armed)
  const armedRef = useRef(false)
  const skinRef = useRef(skin)
  const baseContentRef = useRef<string>('')
  useEffect(() => {
    skinRef.current = skin
  }, [skin])

  const authKey = () => {
    try {
      return sessionStorage.getItem(KEY_STORE) ?? ''
    } catch {
      return ''
    }
  }

  /* ---- fetch the current sha/content; report where the UI should land ---- */
  const loadBase = useCallback(async (): Promise<'armed' | 'locked' | 'unconfigured'> => {
    const res = await fetch('/api/copy-commit', {
      headers: { 'x-edit-key': authKey() },
      cache: 'no-store',
    })
    if (res.status === 501) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (j.error === 'commit token not configured') {
        // key is fine; editing works, only committing is blocked
        setTokenMissing(true)
        return 'armed'
      }
      return 'unconfigured'
    }
    if (res.status === 401) return 'locked'
    if (!res.ok) {
      setStatus('Could not read copy.json from GitHub.')
      return 'armed'
    }
    const j = (await res.json()) as { sha: string; content: string }
    setBaseSha(j.sha)
    baseContentRef.current = j.content
    return 'armed'
  }, [])

  /* ---- on mount: reuse a cached key if present ---- */
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!authKey()) {
        setPhase('locked')
        return
      }
      const outcome = await loadBase()
      if (!alive) return
      if (outcome === 'locked') {
        try {
          sessionStorage.removeItem(KEY_STORE)
        } catch {}
      }
      setPhase(outcome)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- key prompt submit ---- */
  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    const entered = keyInput
    const res = await fetch('/api/copy-commit/verify', {
      method: 'POST',
      headers: { 'x-edit-key': entered },
    })
    if (res.status === 501) {
      setPhase('unconfigured')
      return
    }
    if (!res.ok) {
      setAuthError('Key rejected.')
      return
    }
    try {
      sessionStorage.setItem(KEY_STORE, entered)
    } catch {}
    setKeyInput('')
    const outcome = await loadBase()
    setPhase(outcome)
  }

  /* ---- dirty-node bookkeeping ---- */
  const markDirty = (key: string, on: boolean) => {
    for (const n of nodesFor(key)) {
      if (on) n.setAttribute('data-edit-dirty', '1')
      else n.removeAttribute('data-edit-dirty')
    }
  }

  const commitEdit = useCallback((el: HTMLElement) => {
    const key = el.dataset.copyId
    if (!key) return
    const oldValue = el.dataset.editOld ?? ''
    const newValue = el.textContent ?? ''
    const slot = resolveCopy(key, skinRef.current)?.slot ?? 'base'
    // keep duplicate nodes of the same key visually in sync
    for (const n of nodesFor(key)) {
      if (n !== el && n.textContent !== newValue) n.textContent = newValue
    }
    setEdits((prev) => {
      const next = { ...prev }
      if (newValue === oldValue) {
        delete next[key]
        markDirty(key, false)
      } else {
        next[key] = { key, slot, oldValue, newValue }
        markDirty(key, true)
      }
      return next
    })
  }, [])

  /* ---- arm / disarm: document-level delegation ---- */
  useEffect(() => {
    if (phase !== 'armed') return
    armedRef.current = true
    document.body.setAttribute('data-editmode', 'on')

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      const el = t?.closest<HTMLElement>('[data-copy-id]')
      if (!el) return
      // don't follow links / trigger buttons while editing
      e.preventDefault()
      e.stopPropagation()
      if (el.getAttribute('contenteditable') !== 'plaintext-only') {
        el.setAttribute('contenteditable', 'plaintext-only')
        el.spellcheck = false
        if (el.dataset.editOld === undefined) el.dataset.editOld = el.textContent ?? ''
      }
      el.focus()
      caretToPoint(e.clientX, e.clientY)
    }

    const onInput = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-copy-id]')
      if (el) commitEdit(el)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-copy-id]')
      if (!el || el.getAttribute('contenteditable') !== 'plaintext-only') return
      if (e.key === 'Escape') {
        // stop the host Window's Escape-to-close from also firing
        e.preventDefault()
        e.stopPropagation()
        el.textContent = el.dataset.editOld ?? ''
        commitEdit(el)
        el.blur()
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        el.blur()
      }
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('input', onInput, true)
    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      armedRef.current = false
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.removeAttribute('data-editmode')
      // revert every touched node to its original text and strip editing attrs
      for (const n of document.querySelectorAll<HTMLElement>('[data-copy-id]')) {
        if (n.dataset.editOld !== undefined) {
          if (n.getAttribute('data-edit-dirty')) n.textContent = n.dataset.editOld
          delete n.dataset.editOld
          n.removeAttribute('data-edit-dirty')
          n.removeAttribute('contenteditable')
        }
      }
    }
  }, [phase, commitEdit])

  /* ---- skin switch: re-rendered nodes get new text, so a stale
     editOld from the previous skin would corrupt old-values and
     Esc-revert. Drop capture state on clean nodes (they re-capture on
     next click); dirty rows keep the slot recorded at edit time. ---- */
  useEffect(() => {
    if (phase !== 'armed') return
    for (const n of document.querySelectorAll<HTMLElement>('[data-copy-id]')) {
      if (n.dataset.editOld !== undefined && !n.getAttribute('data-edit-dirty')) {
        delete n.dataset.editOld
        n.removeAttribute('contenteditable')
      }
    }
  }, [skin, phase])

  /* ---- revert a single row ---- */
  const revert = (key: string) => {
    const edit = edits[key]
    if (!edit) return
    for (const n of nodesFor(key)) {
      n.textContent = edit.oldValue
      if (n.dataset.editOld !== undefined) n.dataset.editOld = edit.oldValue
    }
    markDirty(key, false)
    setEdits((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const disarm = () => {
    setEdits({})
    setConflict(false)
    setStatus(null)
    setPhase('locked')
    try {
      sessionStorage.removeItem(KEY_STORE)
    } catch {}
  }

  /* ---- commit ---- */
  const commit = async () => {
    const list = Object.values(edits)
    if (list.length === 0 || !baseSha) return
    setCommitting(true)
    setStatus(null)
    try {
      const res = await fetch('/api/copy-commit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-edit-key': authKey() },
        body: JSON.stringify({
          baseSha,
          edits: list.map(({ key, slot, newValue }) => ({ key, slot, value: newValue })),
        }),
      })

      if (res.status === 409) {
        // upstream changed — rebase the diff onto fresh content, re-present
        const j = (await res.json()) as { sha: string; content: string }
        setBaseSha(j.sha)
        baseContentRef.current = j.content
        setEdits((prev) => {
          const next: Record<string, Edit> = {}
          for (const e of Object.values(prev)) {
            next[e.key] = { ...e, oldValue: resolveFromContent(j.content, e.key, e.slot) }
          }
          return next
        })
        setConflict(true)
        setStatus('copy.json changed upstream — review the refreshed diff and commit again.')
        return
      }
      if (res.status === 501) {
        setTokenMissing(true)
        setStatus('Commit token is not configured on the server.')
        return
      }
      if (!res.ok) {
        setStatus('Commit failed.')
        return
      }

      const j = (await res.json()) as { sha: string | null; keys: number }
      if (j.sha) setBaseSha(j.sha)
      baseContentRef.current = ''
      // committed values are now truth: bake them into the nodes, clear dirty
      for (const e of list) {
        for (const n of nodesFor(e.key)) {
          if (n.dataset.editOld !== undefined) n.dataset.editOld = e.newValue
        }
        markDirty(e.key, false)
      }
      setEdits({})
      setConflict(false)
      setStatus(`Committed ${j.keys} key${j.keys === 1 ? '' : 's'} to main.`)
    } catch {
      setStatus('Commit failed — network error.')
    } finally {
      setCommitting(false)
    }
  }

  const editList = Object.values(edits)

  /* ---------------- render ---------------- */
  return (
    <div className={styles.root}>
      <p className={styles.eyebrow}>EDIT.MODE · in-place copy editor</p>

      {phase === 'checking' && <p className={styles.dim}>Checking session…</p>}

      {phase === 'unconfigured' && (
        <p className={styles.notice}>
          EDIT_MODE_KEY is not set on the server. This tool is inert until the environment
          variable is configured.
        </p>
      )}

      {phase === 'locked' && (
        <form className={styles.gate} onSubmit={authenticate}>
          <label className={styles.label} htmlFor="edit-key">
            Editor key
          </label>
          <input
            id="edit-key"
            className={styles.input}
            type="password"
            autoComplete="off"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="••••••••"
          />
          <button className={styles.primary} type="submit">
            AUTHENTICATE
          </button>
          {authError && (
            <p className={styles.error} role="alert">
              {authError}
            </p>
          )}
        </form>
      )}

      {phase === 'armed' && (
        // global affordances for nodes outside this module's scope (they live
        // across the desktop). Tokens only — the one system accent.
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              body[data-editmode="on"] [data-copy-id]{
                cursor:text;
                outline:1px dashed color-mix(in srgb, var(--accent) 45%, transparent);
                outline-offset:2px;
                transition:none;
              }
              body[data-editmode="on"] [data-copy-id]:hover{
                outline-style:solid;
              }
              body[data-editmode="on"] [data-copy-id][contenteditable]{
                outline:2px solid var(--accent);
              }
              body[data-editmode="on"] [data-copy-id][data-edit-dirty]{
                background:color-mix(in srgb, var(--accent) 14%, transparent);
                box-shadow:inset 0 -2px 0 var(--accent);
              }
            `,
          }}
        />
      )}

      {phase === 'armed' && (
        <div className={styles.armed}>
          <p className={styles.armedLine}>
            <span className={styles.dot} aria-hidden="true" />
            ARMED — click any text on the desktop to edit it.
          </p>
          <p className={styles.dim}>
            Writing to the <b>{skin}</b> view · Esc reverts the focused node ·
            Enter commits the line.
          </p>
          {tokenMissing && (
            <p className={styles.notice}>
              Commit token not configured — you can edit live, but SAVE is disabled until
              GITHUB_COPY_TOKEN is set.
            </p>
          )}
          <button className={styles.secondary} type="button" onClick={disarm}>
            DISARM
          </button>
        </div>
      )}

      {phase === 'armed' &&
        typeof document !== 'undefined' &&
        createPortal(
          <motion.aside
            className={styles.panel}
            role="dialog"
            aria-label="SAVE.CHANGES — pending copy edits"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={SPRINGS.deck}
          >
            <header className={styles.panelHead}>
              <span className={styles.panelTitle}>SAVE.CHANGES</span>
              <span className={styles.panelMeta} aria-hidden="true">
                {editList.length} PENDING
              </span>
            </header>

            {conflict && (
              <p className={styles.conflict} role="alert">
                Upstream changed — diff refreshed against the latest copy.json.
              </p>
            )}

            {editList.length === 0 ? (
              <p className={styles.empty}>No edits yet. Click text on the desktop.</p>
            ) : (
              <ul className={styles.rows}>
                {editList.map((e) => (
                  <li key={e.key} className={styles.row}>
                    <div className={styles.rowHead}>
                      <span className={styles.rowKey} title={e.key}>
                        {e.key}
                      </span>
                      <span className={styles.rowSlot}>{e.slot}</span>
                      <button
                        className={styles.revert}
                        type="button"
                        onClick={() => revert(e.key)}
                        aria-label={`Revert ${e.key}`}
                      >
                        ↺
                      </button>
                    </div>
                    <div className={styles.diff}>
                      <span className={styles.old}>{e.oldValue || '∅'}</span>
                      <span className={styles.arrow} aria-hidden="true">
                        →
                      </span>
                      <span className={styles.new}>{e.newValue || '∅'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {status && (
              <p className={styles.status} role="status">
                {status}
              </p>
            )}

            <button
              className={styles.commit}
              type="button"
              onClick={commit}
              disabled={committing || editList.length === 0 || tokenMissing || !baseSha}
            >
              {committing ? 'COMMITTING…' : `COMMIT ${editList.length || ''}`.trim()}
            </button>
          </motion.aside>,
          document.body,
        )}
    </div>
  )
}
