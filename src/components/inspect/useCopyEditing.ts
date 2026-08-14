'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from '@/store/settings'
import { resolveCopy, type CopySlot } from '@/content/copy'
import { clearEditKey, readEditKey, verifyEditKey } from '@/lib/editKey'

/* THE COPY EDITOR'S ENGINE — SYS-99, lifted out of the EDIT.MODE program.
 *
 * It used to be a window that took the whole desktop and refused to share
 * it with INSPECT.MODE. It is INSPECT's third tool now, so the machinery
 * had to leave the component: this hook owns the phase machine, the
 * document-level capture delegation over every [data-copy-id] node, the
 * dirty map, and the commit to copy.json on main. The panel that renders
 * it is EditPanel.tsx and it renders nothing on its own.
 *
 * The secret key is verified server-side (timing-safe) and only ever held
 * in sessionStorage on the client: never rendered, never logged. The
 * storage slot lives in lib/editKey.ts because the token SAVE in the
 * inspector arms against the same secret, and one arming covers both.
 *
 * TWO KINDS OF "OFF", and they are not the same:
 *
 * · `active` false — the visitor picked up SELECT or OPERATE. The capture
 *   listeners come off and every node gives back its contenteditable, so
 *   the site is a site again. Pending edits STAY: switching to SELECT to
 *   read the contrast on a line you just rewrote is the reason the three
 *   tools share a hand at all, and losing the rewrite for it would be a
 *   punishment for using the tool.
 * · unmount — the mode itself is down. Every touched node reverts to the
 *   text it had, and the desktop carries no mark of ours.
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

/** The tool's own chrome is made of CopyText too, so the docks are full of
    [data-copy-id] nodes. Editing the SAVE button's own label mid-commit is
    not a feature — the panels are instruments, not specimens, and they say
    so with the same attribute the picker exempts them by. */
const editable = (el: HTMLElement | null | undefined): el is HTMLElement =>
  !!el && !el.closest('[data-inspect-self]')

/** Give a node back: strip the editing affordance, keep what it knows. */
function uncapture(n: HTMLElement) {
  n.removeAttribute('contenteditable')
  n.removeAttribute('spellcheck')
}

export function useCopyEditing(active: boolean) {
  const skin = useSettings((s) => s.skin)

  const [phase, setPhase] = useState<CopyPhase>('checking')
  const [edits, setEdits] = useState<Record<string, CopyEdit>>({})
  const [baseSha, setBaseSha] = useState<string | null>(null)
  const [committing, setCommitting] = useState(false)
  const [status, setStatus] = useState<CopyStatus>(null)
  const [conflict, setConflict] = useState(false)
  const [tokenMissing, setTokenMissing] = useState(false)

  // the document-level handlers bind once per arming and read through refs
  const skinRef = useRef(skin)
  useEffect(() => {
    skinRef.current = skin
  }, [skin])

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

  /* ---- picking the tool up: reuse a cached key if there is one ---- */
  useEffect(() => {
    if (!active || phase !== 'checking') return
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
  }, [active, phase, loadBase])

  /* ---- key prompt submit. Returns false on a rejected key so the panel
     can say so; every other outcome is carried by `phase`. ---- */
  const authenticate = useCallback(
    async (entered: string): Promise<boolean> => {
      const verdict = await verifyEditKey(entered)
      if (verdict === 'unconfigured') {
        setPhase('unconfigured')
        return true
      }
      if (!verdict) return false
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

  /* ---- arm / stand down: document-level delegation ---- */
  useEffect(() => {
    if (!active || phase !== 'armed') return
    document.body.setAttribute('data-editmode', 'on')

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      const el = t?.closest<HTMLElement>('[data-copy-id]')
      if (!editable(el)) return
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
      if (editable(el)) commitEdit(el)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-copy-id]')
      if (!editable(el) || el.getAttribute('contenteditable') !== 'plaintext-only') return
      if (e.key === 'Escape') {
        // stop the host Window's Escape-to-close, and the tool's own
        // Escape ladder, from also firing (see InspectShell)
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
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.removeAttribute('data-editmode')
      /* Hand every captured node back. The TEXT stays where the visitor
         left it and so does the dirty mark: this runs on a tool switch as
         well as on the way out, and a pending edit is still pending. The
         unmount effect below is the one that puts the words back. */
      for (const n of document.querySelectorAll<HTMLElement>('[data-copy-id][contenteditable]')) {
        uncapture(n)
      }
    }
  }, [active, phase, commitEdit])

  /* ---- skin switch: re-rendered nodes get new text, so a stale editOld
     from the previous skin would corrupt old-values and Esc-revert. Drop
     capture state on clean nodes (they re-capture on next click); dirty
     rows keep the slot recorded at edit time. ---- */
  useEffect(() => {
    if (!active || phase !== 'armed') return
    for (const n of document.querySelectorAll<HTMLElement>('[data-copy-id]')) {
      if (n.dataset.editOld !== undefined && !n.getAttribute('data-edit-dirty')) {
        delete n.dataset.editOld
        uncapture(n)
      }
    }
  }, [skin, active, phase])

  /* ---- the mode is down: the desktop gets its words back ---- */
  useEffect(
    () => () => {
      document.body.removeAttribute('data-editmode')
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

  /* ---- DISARM: drop the key, put every word back, ask again next time ---- */
  const disarm = useCallback(() => {
    for (const n of document.querySelectorAll<HTMLElement>('[data-copy-id]')) {
      if (n.dataset.editOld !== undefined) {
        if (n.getAttribute('data-edit-dirty')) n.textContent = n.dataset.editOld
        delete n.dataset.editOld
        n.removeAttribute('data-edit-dirty')
        uncapture(n)
      }
    }
    setEdits({})
    setConflict(false)
    setStatus(null)
    setBaseSha(null)
    setPhase('locked')
    clearEditKey()
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
    committing,
    status,
    conflict,
    tokenMissing,
    canCommit: !!baseSha && !tokenMissing,
    authenticate,
    revert,
    disarm,
    commit,
  }
}
