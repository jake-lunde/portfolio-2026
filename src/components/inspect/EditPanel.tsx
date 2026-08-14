'use client'

import { useState } from 'react'
import { useSettings } from '@/store/settings'
import { useWindows } from '@/store/windows'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { getCase } from '@/programs/projects/cases'
import type { useCopyEditing } from './useCopyEditing'
import styles from './inspectShell.module.css'

/* EDIT — the right dock while the third tool is in the hand.

   The engine is useCopyEditing.ts; this file is the face of it. Two things
   moved when EDIT.MODE folded into INSPECT and both are improvements:

   · SAVE.CHANGES was a floating panel portaled to <body>, because the
     editor was a window and its own frame was the wrong place for a list
     that describes the whole desktop. There is a dock now, so the list
     lives in it. Nothing floats over the canvas any more.
   · the key prompt is here rather than in a program window, which puts
     the gate in the same place as the thing it gates.

   SOURCE is new. Case-study prose is MDX on disk, not copy.json, so no
   amount of clicking a paragraph in a case window will ever edit it. The
   panel says where the words actually live and hands over a link. */

const REPO_EDIT = 'https://github.com/jake-lunde/portfolio-2026/edit/main/content/'

/* Constant ids, never useId: this panel mounts inside a tree that reshapes
   at the SSR handover, and a generated id mismatches across it (see memory).
   The mode is a singleton, so both nodes are unique on the page. */
const KEY_ID = 'inspect-edit-key'

type Engine = ReturnType<typeof useCopyEditing>

export function EditPanel({ engine }: { engine: Engine }) {
  const skin = useSettings((s) => s.skin)
  const focused = useWindows((s) => s.focused)
  const [keyInput, setKeyInput] = useState('')
  const [fail, setFail] = useState<'badkey' | 'throttled' | null>(null)

  const {
    phase,
    edits,
    committing,
    status,
    tokenMissing,
    canCommit,
    authenticate,
    revert,
    disarm,
    commit,
  } = engine

  /* The MDX behind the window in front. A case window is `case:<slug>`
     (see programs/resolve.ts) and the file it renders is declared on the
     case itself, so this stays one lookup rather than a naming convention
     nobody would remember to keep. */
  const source =
    phase === 'armed' && focused?.startsWith('case:')
      ? getCase(focused.slice(5))?.source
      : undefined

  const arm = async (e: React.FormEvent) => {
    e.preventDefault()
    const entered = keyInput
    setKeyInput('')
    setFail(null)
    const ok = await authenticate(entered)
    if (ok !== true) setFail(ok)
  }

  return (
    <>
      <h2 className={styles.panelHead}>
        <CopyText k="inspect.tool.edit" />
      </h2>

      <div className={styles.panelBody}>
        {phase === 'checking' && (
          <p className={styles.note}>
            <CopyText k="inspect.edit.checking" />
          </p>
        )}

        {phase === 'unconfigured' && (
          <p className={styles.editNotice}>
            <CopyText k="inspect.edit.unconfigured" />
          </p>
        )}

        {phase === 'locked' && (
          <form className={styles.editGate} onSubmit={arm}>
            <label className={styles.keyLabel} htmlFor={KEY_ID}>
              <CopyText k="inspect.edit.key" />
            </label>
            <input
              id={KEY_ID}
              className={styles.keyInput}
              type="password"
              autoComplete="off"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <button type="submit" className={styles.resetAll}>
              <CopyText k="inspect.edit.auth" />
            </button>
            {fail && (
              <p className={styles.saveNote} data-fail="" role="alert">
                <CopyText
                  k={
                    fail === 'throttled'
                      ? 'inspect.edit.throttled'
                      : 'inspect.edit.badkey'
                  }
                />
              </p>
            )}
          </form>
        )}

        {phase === 'armed' && (
          <>
            <p className={styles.editArmed}>
              <span className={styles.editDot} aria-hidden="true" />
              <CopyText k="inspect.edit.armed" />
            </p>
            <p className={styles.note}>
              <CopyText k="inspect.edit.writing" /> <span>{skin.toUpperCase()}</span>
            </p>
            <p className={styles.note}>
              <CopyText k="inspect.edit.hint" />
            </p>
            {tokenMissing && (
              <p className={styles.editNotice}>
                <CopyText k="inspect.edit.notoken" />
              </p>
            )}

            {source && (
              <section className={styles.section}>
                <h3 className={styles.head}>
                  <CopyText k="inspect.edit.source" />
                </h3>
                <p className={styles.note}>
                  <CopyText k="inspect.edit.sourcenote" />
                </p>
                <a
                  className={styles.sourceLink}
                  href={`${REPO_EDIT}${source}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {source.toUpperCase()}
                </a>
              </section>
            )}

            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.edit.save" />
                <span className={styles.editCount}>
                  {edits.length} <CopyText k="inspect.edit.pending" />
                </span>
              </h3>

              {edits.length === 0 ? (
                <p className={styles.note}>
                  <CopyText k="inspect.edit.empty" />
                </p>
              ) : (
                <ul className={styles.rows}>
                  {edits.map((e) => (
                    <li key={e.key} className={styles.tokenRow}>
                      <div className={styles.editRowHead}>
                        <span className={styles.editKeyName} title={e.key}>
                          {e.key}
                        </span>
                        <span className={styles.editSlot}>{e.slot.toUpperCase()}</span>
                        <button
                          type="button"
                          className={styles.resetAll}
                          onClick={() => revert(e.key)}
                          aria-label={`${t('inspect.revert', skin)} ${e.key}`}
                        >
                          <span aria-hidden="true">↺</span>
                        </button>
                      </div>
                      <div className={styles.editDiff}>
                        <span className={styles.editOld}>{e.oldValue || '∅'}</span>
                        <span className={styles.editArrow} aria-hidden="true">
                          →
                        </span>
                        <span className={styles.editNew}>{e.newValue || '∅'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* mounted for the whole life of the panel, empty or not: a
                  status region that appears with its text is announced
                  unreliably, because there was nothing to observe when the
                  text arrived (same rule the inspector's SAVE follows) */}
              <div role="status">
                {status && (
                  <p className={styles.saveNote}>
                    <CopyText k={status.key} />
                    {status.count !== undefined ? ` ${status.count}` : ''}
                  </p>
                )}
              </div>

              <button
                type="button"
                className={styles.editCommit}
                onClick={commit}
                disabled={committing || edits.length === 0 || !canCommit}
              >
                <CopyText k={committing ? 'inspect.edit.committing' : 'inspect.edit.commit'} />
              </button>
            </section>

            <button type="button" className={styles.resetAll} onClick={disarm}>
              <CopyText k="inspect.edit.disarm" />
            </button>
          </>
        )}
      </div>
    </>
  )
}
