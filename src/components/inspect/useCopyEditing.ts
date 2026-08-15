'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from '@/store/settings'
import { resolveCopy, type CopySlot } from '@/content/copy'
import { clearEditKey, readEditKey, verifyEditKey } from '@/lib/editKey'

/* THE COPY EDITOR'S ENGINE — SYS-99, and no longer a mode of its own.
 *
 * It was a window that took the whole desktop, then it was INSPECT's third
 * tool. Jake's call, and it is the right one: there is ONE tool mode, you
 * pick a thing, and if that thing is copy you rewrite it where it stands.
 * So this hook holds no mode. It runs for as long as INSPECT is up, and
 * the inspector's COPY block drives it one pick at a time: beginEdit puts
 * the caret in THAT node, endEdit takes it back, and the dirty map
 * accumulates across every pick until Jake commits it.
 *
 * The secret key is verified server-side (timing-safe) and only ever held
 * in sessionStorage on the client: never rendered, never logged. The
 * storage slot lives in lib/editKey.ts because the token SAVE in the
 * inspector arms against the same secret, and one arming covers both —
 * one gate, one key, two kinds of proposal.
 *
 * ENDING AN EDIT IS NOT DROPPING IT. endEdit, a blur, a click on the next
 * thing: the node stops being editable and the rewrite STAYS, marked on
 * the canvas and listed in PENDING. Reading the contrast on a line you
 * just rewrote is the reason the two live in one panel at all, and losing
 * the rewrite for it would be a punishment for using the tool.
 *
 * UNMOUNT is the one thing that puts the words back. The mode is down, so
 * every touched node reverts to the text it had and the desktop carries no
 * mark of ours.
 */

export type CopyEdit = { key: string; slot: CopySlot; oldValue: string; newValue: string }
export type CopyPhase = 'checking' | 'locked' | 'armed' | 'unconfigured'
/** A terse line under the diff. `key` is a copy key; `count` fills the one
    message that quotes a number. */
export type CopyStatus = { key: string; count?: number } | null

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

/** The caret lands at the END of the line. The click that started this
    landed on a button in the dock, not on the word the visitor means to
    fix, so there is no point to place it at — and a caret at offset 0
    reads as "type in front of everything", which is rarely the intent. */
function caretToEnd(el: HTMLElement) {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

const nodesFor = (key: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-copy-id="${CSS.escape(key)}"]`))

/** The tool's own chrome is made of CopyText too, so the docks are full of
    [data-copy-id] nodes. Editing the COMMIT button's own label mid-commit
    is not a feature — the panels are instruments, not specimens, and they
    say so with the same attribute the picker exempts them by. */
const editable = (el: HTMLElement | null | undefined): el is HTMLElement =>
  !!el && !el.closest('[data-inspect-self]')

/** Give a node back: strip the editing affordance, keep what it knows. */
function uncapture(n: HTMLElement) {
  n.removeAttribute('contenteditable')
  n.removeAttribute('spellcheck')
}

export function useCopyEditing() {
  const skin = useSettings((s) => s.skin)

  const [phase, setPhase] = useState<CopyPhase>('checking')
  const [edits, setEdits] = useState<Record<string, CopyEdit>>({})
  const [editing, setEditing] = useState<HTMLElement | null>(null)
  const [baseSha, setBaseSha] = useState<string | null>(null)
  const [committing, setCommitting] = useState(false)
  const [status, setStatus] = useState<CopyStatus>(null)
  const [conflict, setConflict] = useState(false)
  const [tokenMissing, setTokenMissing] = useState(false)

  // the handlers bind per edit and read through refs
  const skinRef = useRef(skin)
  useEffect(() => {
    skinRef.current = skin
  }, [skin])
  /** the node holding the caret, readable synchronously — a blur has to
      hand the same node back that beginEdit took, and state is a frame late */
  const editingRef = useRef<HTMLElement | null>(null)

  /* ---- fetch the current sha/content; report where the UI should land ---- */
  const loadBase = useCallback(async (): Promise<CopyPhase> => {
    const res = await fetch('/api/copy-commit', {
      headers: { 'x-edit-key': readEditKey() },
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
      setStatus({ key: 'inspect.edit.readfailed' })
      return 'armed'
    }
    const j = (await res.json()) as { sha: string }
    setBaseSha(j.sha)
    return 'armed'
  }, [])

  /* ---- entering the mode: reuse a cached key if there is one ---- */
  useEffect(() => {
    if (phase !== 'checking') return
    let alive = true
    ;(async () => {
      if (!readEditKey()) {
        setPhase('locked')
        return
      }
      const outcome = await loadBase()
      if (!alive) return
      if (outcome === 'locked') clearEditKey()
      setPhase(outcome)
    })()
    return () => {
      alive = false
    }
  }, [phase, loadBase])

  /* ---- key prompt submit. Every outcome is named, because the gate is
     shared with the token SAVE and that side has its own thing to do with
     each of them (see InspectorPanel). ---- */
  const authenticate = useCallback(
    async (entered: string): Promise<true | 'badkey' | 'throttled' | 'unconfigured'> => {
      const verdict = await verifyEditKey(entered)
      if (verdict === 'unconfigured') {
        setPhase('unconfigured')
        return 'unconfigured'
      }
      if (verdict !== true) return verdict
      setPhase(await loadBase())
      return true
    },
    [loadBase],
  )

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
    /* Keep duplicate nodes of the same key visually in sync — one key can
       render in two places at once (a program's name is on its desktop
       icon AND on its dock tile). Each of them records its OWN old text
       before it takes the new one, or the teardown below has nothing to
       put back and the rewrite outlives the mode on every node except the
       one that was typed in. */
    for (const n of nodesFor(key)) {
      if (n === el || n.textContent === newValue) continue
      if (n.dataset.editOld === undefined) n.dataset.editOld = n.textContent ?? ''
      n.textContent = newValue
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

  /* ---- the caret: one node at a time, and only the picked one ---- */

  const endEdit = useCallback(() => {
    const el = editingRef.current
    if (el) uncapture(el)
    editingRef.current = null
    setEditing(null)
  }, [])

  const beginEdit = useCallback(
    (el: HTMLElement) => {
      if (!editable(el) || !el.dataset.copyId) return
      if (editingRef.current && editingRef.current !== el) endEdit()
      el.setAttribute('contenteditable', 'plaintext-only')
      el.spellcheck = false
      if (el.dataset.editOld === undefined) el.dataset.editOld = el.textContent ?? ''
      editingRef.current = el
      setEditing(el)
      el.focus()
      caretToEnd(el)
    },
    [endEdit],
  )

  /* The listeners live for the length of ONE edit and two of them sit on
     the node itself: `input` bubbles, and a handler bound to the node
     cannot fire for anything else on the desktop.

     KEYDOWN is the exception and it stays on the document in the CAPTURE
     phase, because it has to beat the shell. Escape belongs to a dozen
     other consumers down there — the host Window's close, INSPECT's own
     ladder, the skin flyout — and the only way to put the LINE back
     instead of closing the window around it is to take the key before any
     of them see it. INSPECT's ladder checks for the caret itself rather
     than hoping to be second (InspectShell), since two capture listeners
     on the same node cannot be ordered by stopPropagation. */
  useEffect(() => {
    const el = editing
    if (!el) return

    const onInput = () => commitEdit(el)
    const onBlur = () => endEdit()

    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.target as HTMLElement | null)?.closest?.('[data-copy-id][contenteditable]')) return
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        el.textContent = el.dataset.editOld ?? ''
        commitEdit(el)
        el.blur()
      } else if (e.key === 'Enter' && !e.shiftKey) {
        // plaintext-only still takes a newline, and a copy string has no
        // second line to give — the key ends the edit instead
        e.preventDefault()
        e.stopPropagation()
        el.blur()
      }
    }

    el.addEventListener('input', onInput)
    el.addEventListener('blur', onBlur)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      el.removeEventListener('input', onInput)
      el.removeEventListener('blur', onBlur)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [editing, commitEdit, endEdit])

  /* ---- skin switch: re-rendered nodes get new text, so a stale editOld
     from the previous skin would corrupt old-values and Esc-revert. Drop
     capture state on clean nodes (they take it again on the next edit);
     dirty rows keep the slot recorded at edit time. ---- */
  useEffect(() => {
    for (const n of document.querySelectorAll<HTMLElement>('[data-copy-id]')) {
      if (n.dataset.editOld !== undefined && !n.getAttribute('data-edit-dirty')) {
        delete n.dataset.editOld
        uncapture(n)
      }
    }
  }, [skin])

  /* ---- the mode is down: the desktop gets its words back ---- */
  useEffect(
    () => () => {
      for (const n of document.querySelectorAll<HTMLElement>('[data-copy-id]')) {
        if (n.dataset.editOld !== undefined) {
          if (n.getAttribute('data-edit-dirty')) n.textContent = n.dataset.editOld
          delete n.dataset.editOld
          n.removeAttribute('data-edit-dirty')
          uncapture(n)
        }
      }
    },
    [],
  )

  /* ---- revert a single row ---- */
  const revert = useCallback(
    (key: string) => {
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
    },
    [edits],
  )

  /* ---- put every pending line back. The key stays armed: undoing a
     session's rewrites is not the same act as handing the key in. ---- */
  const revertAll = useCallback(() => {
    for (const n of document.querySelectorAll<HTMLElement>('[data-copy-id][data-edit-dirty]')) {
      /* editOld stays and stays TRUE: the node may still hold the caret,
         and Escape reads that attribute to put the line back. Same rule
         revert() follows for one key. */
      if (n.dataset.editOld !== undefined) n.textContent = n.dataset.editOld
      n.removeAttribute('data-edit-dirty')
    }
    setEdits({})
    setConflict(false)
    setStatus(null)
  }, [])

  /* ---- commit ---- */
  const commit = useCallback(async () => {
    const list = Object.values(edits)
    if (list.length === 0 || !baseSha) return
    setCommitting(true)
    setStatus(null)
    try {
      const res = await fetch('/api/copy-commit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-edit-key': readEditKey() },
        body: JSON.stringify({
          baseSha,
          edits: list.map(({ key, slot, newValue }) => ({ key, slot, value: newValue })),
        }),
      })

      if (res.status === 409) {
        // upstream changed — rebase the diff onto fresh content, re-present
        const j = (await res.json()) as { sha: string; content: string }
        setBaseSha(j.sha)
        setEdits((prev) => {
          const next: Record<string, CopyEdit> = {}
          for (const e of Object.values(prev)) {
            next[e.key] = { ...e, oldValue: resolveFromContent(j.content, e.key, e.slot) }
          }
          return next
        })
        setConflict(true)
        setStatus({ key: 'inspect.edit.conflict' })
        return
      }
      if (res.status === 501) {
        setTokenMissing(true)
        setStatus({ key: 'inspect.edit.notoken' })
        return
      }
      if (!res.ok) {
        setStatus({ key: 'inspect.edit.failed' })
        return
      }

      const j = (await res.json()) as { sha: string | null; keys: number }
      if (j.sha) setBaseSha(j.sha)
      // committed values are now truth: bake them into the nodes, clear dirty
      for (const e of list) {
        for (const n of nodesFor(e.key)) {
          if (n.dataset.editOld !== undefined) n.dataset.editOld = e.newValue
        }
        markDirty(e.key, false)
      }
      setEdits({})
      setConflict(false)
      setStatus({ key: 'inspect.edit.done', count: j.keys })
    } catch {
      setStatus({ key: 'inspect.edit.netfailed' })
    } finally {
      setCommitting(false)
    }
  }, [edits, baseSha])

  return {
    phase,
    edits: Object.values(edits),
    /** the node holding the caret right now, or null */
    editing,
    committing,
    status,
    conflict,
    tokenMissing,
    canCommit: !!baseSha && !tokenMissing,
    authenticate,
    beginEdit,
    endEdit,
    revert,
    revertAll,
    commit,
  }
}
