'use client'

import { useState } from 'react'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { clearEditKey, readEditKey, verifyEditKey } from '@/lib/editKey'
import type { ChainEntry, Inspection } from '@/lib/inspect'
import { themeFor } from '@/lib/tokenEdit'
import {
  CANDIDATES,
  isNudged,
  nudge,
  overrides,
  pendingEdits,
  reset,
  resetAll,
  wouldGrade,
} from '@/lib/tune'
import styles from './inspectShell.module.css'

/* INSPECTOR — the right dock. Everything the window version reported,
   minus the two things the mode itself replaced: the LAYERS chain (the
   left panel is a real tree now) and the SCAN button (the mode IS the
   scanner — there is nothing to arm).

   One thing is new, and it is the first time this program writes anything:
   a semantic COLOR role can be re-cast to a core primitive and previewed
   live across the whole desktop. The claim the site keeps making —
   one token source, everything downstream follows — is finally something
   a visitor can pull on rather than read about. The write is inline
   custom properties on <html>, it is never saved, it never survives the
   mode, and a banner says so the whole time (src/lib/tune.ts).

   The AA gate is deliberately NOT a refusal. SKIN BUILDER refuses, because
   there the visitor is publishing a skin into the shipped system. Here
   they are looking, so a failing pick previews and the candidate wears its
   own failing grade. Driver's seat, with the instrument lit red.

   SAVE is the one exception, and it is the seam where looking becomes
   proposing. Armed with the edit key, Jake sends the pending re-casts to
   /api/token-commit, which re-aliases them in tokens/semantic/<theme>.json
   and opens a PULL REQUEST — never a push to main, because a token edit
   moves every skin downstream of it. There the instrument DOES refuse: a
   red PR is a wasted PR, so a set carrying a failing pick cannot be sent.
   CI's token doctor (--strict --parity) stays the real gate behind it. */

/* Constant ids, never useId: this panel mounts inside a tree that reshapes
   at the SSR handover, and a generated id mismatches across it (see memory).
   Both nodes are unique on the page — the mode is a singleton. */
const KEY_ID = 'inspect-save-key'
const NOTE_ID = 'inspect-save-note'

/* ---- PATH ----

   Jake's complaint, verbatim: pick a line of text inside something on the
   home page and there is no breakdown of the layers from the top. The
   chain was already being computed for every reading (lib/inspect.ts) and
   nothing rendered it — the left dock shows where a thing sits in the
   desktop, but only once you have found it there, and a pick that lands
   six levels inside a window told you nothing about the six.

   So: the whole chain, top-down, one row per level, every ancestor a
   button that re-picks it. The reading order is the DOM's own, which is
   the opposite of what the chain arrives in.

   The one judgement call is what to leave out. labelFor() gives a bare
   tag name to anything with no copy id, no module class and no window id
   — an anonymous wrapper, and a column of "div / div / div" is noise. But
   silently dropping them makes the path LIE about how deep a thing sits,
   so a run of them collapses into one dimmed step carrying its count
   instead. The pick's own row is always drawn, named or not: it is the
   terminus and it is the thing being reported on. */

const PATH_INDENT = 8
const PATH_INDENT_MAX = 10

type PathRow =
  | { kind: 'node'; el: HTMLElement; label: string; depth: number; here: boolean }
  /** `count` anonymous wrappers, folded into one step */
  | { kind: 'gap'; count: number; depth: number }

function pathRows(chain: ChainEntry[]): PathRow[] {
  const top = chain.slice().reverse()
  const out: PathRow[] = []
  let depth = 0
  let run = 0

  top.forEach((entry, i) => {
    const here = i === top.length - 1
    const named = entry.label !== entry.el.tagName.toLowerCase()
    if (!named && !here) {
      run += 1
      return
    }
    if (run > 0) {
      out.push({ kind: 'gap', count: run, depth })
      depth += 1
      run = 0
    }
    out.push({ kind: 'node', el: entry.el, label: entry.label, depth, here })
    depth += 1
  })

  return out
}

/** The indent is a depth counted at runtime, so it is an inline style —
    the same exemption the tree rows take (see inspectShell.module.css).
    Capped, or a deep pick walks the label off the dock. */
function indentOf(depth: number) {
  return {
    paddingLeft: `calc(var(--spacing-component-xs) + ${Math.min(depth, PATH_INDENT_MAX) * PATH_INDENT}px)`,
  }
}

type Save =
  /** nothing sent yet — the SAVE button is showing */
  | { k: 'idle' }
  /** the inline key prompt, armed against the same secret EDIT.MODE uses */
  | { k: 'key'; fail?: 'badkey' | 'throttled' }
  | { k: 'busy' }
  /** committed: the override is on a branch, awaiting review — NOT live */
  | { k: 'done'; number: number; url: string }
  /** terse and retryable; `msg` is a copy key */
  | { k: 'error'; msg: string }
  /** no EDIT_MODE_KEY or no commit token on this deployment */
  | { k: 'locked' }

export function InspectorPanel({
  report,
  openVar,
  setOpenVar,
  onRefresh,
  onPick,
}: {
  report: Inspection | null
  /** which candidate palette is open, keyed `property|--var` */
  openVar: string | null
  setOpenVar: (v: string | null) => void
  onRefresh: () => void
  /** PATH rows re-pick through the same flow the canvas and the tree use */
  onPick: (el: HTMLElement) => void
}) {
  const skin = useSettings((s) => s.skin)
  const theme = useSettings((s) => s.theme)
  // tune.ts is module state, not a store — this is what re-reads it
  const [, bump] = useState(0)
  const [save, setSave] = useState<Save>({ k: 'idle' })
  const [keyInput, setKeyInput] = useState('')
  const live = overrides()
  const anyLive = Object.keys(live).length > 0

  const springKey = report?.spring ? `inspect.spring.${report.spring.name}` : null

  /* Which token file the desktop on screen is actually reading. */
  const target = themeFor(skin, theme)
  const pending = pendingEdits()
  /* The two reasons SAVE is not offered. A failing pick still PREVIEWS —
     that is the driver's seat — but a PR that lands a AA failure is a PR
     CI will paint red, so it never leaves the panel. */
  const blocked = !target
    ? 'inspect.save.notheme'
    : pending.some((e) => e.fails)
      ? 'inspect.save.aafail'
      : null

  const after = () => {
    // a new pick makes any reported PR describe a different set — the
    // panel goes back to offering SAVE rather than quoting a stale number
    setSave((s) => (s.k === 'done' || s.k === 'error' ? { k: 'idle' } : s))
    bump((n) => n + 1)
    onRefresh()
  }

  /* ---- SAVE: read the file's sha, then post the re-casts as a PR ---- */
  const commit = async () => {
    if (!target || blocked) return
    const edits = pendingEdits().map((e) => ({ role: e.role, token: e.token }))
    if (edits.length === 0) return
    setSave({ k: 'busy' })
    try {
      const head = await fetch(`/api/token-commit?theme=${target}`, {
        headers: { 'x-edit-key': readEditKey() },
        cache: 'no-store',
      })
      if (head.status === 501) return setSave({ k: 'locked' })
      if (head.status === 401) {
        clearEditKey()
        return setSave({ k: 'key', fail: 'badkey' })
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

  const arm = async (e: React.FormEvent) => {
    e.preventDefault()
    const entered = keyInput
    setKeyInput('')
    const verdict = await verifyEditKey(entered)
    if (verdict === 'unconfigured') return setSave({ k: 'locked' })
    if (verdict !== true) return setSave({ k: 'key', fail: verdict })
    await commit()
  }

  /* The status line under the banner — one at a time, terse. */
  const note: { key: string; fail?: boolean } | null =
    save.k === 'busy'
      ? { key: 'inspect.save.saving' }
      : save.k === 'locked'
        ? { key: 'inspect.save.locked' }
        : save.k === 'error'
          ? { key: save.msg, fail: true }
          : save.k === 'key' && save.fail
            ? {
                key:
                  save.fail === 'throttled'
                    ? 'inspect.save.throttled'
                    : 'inspect.save.badkey',
                fail: true,
              }
            : blocked
              ? { key: blocked, fail: true }
              : null

  /* SAVE is present in every state — never unmounted mid-interaction, or
     focus falls to <body> exactly when the visitor is waiting to hear what
     happened. It goes ARIA-disabled rather than `disabled` for the same
     reason: a disabled control is dropped from the tab order and its
     aria-describedby reason becomes unreachable, so the button that refuses
     would also refuse to say why. The click handler enforces what the
     attribute only advertises. After a PR lands it re-arms, because a
     follow-up nudge now stacks onto that same open PR. */
  const saveInert = save.k === 'busy' || !!blocked

  return (
    <>
      <h2 className={styles.panelHead}>
        <CopyText k="inspect.panel.inspector" />
      </h2>

      <div className={styles.panelBody}>
        {anyLive && (
          <div className={styles.preview}>
            <div className={styles.previewTop} role="status">
              {/* the two states the visitor must be able to tell apart:
                  previewing an override, vs. that override sitting in a PR
                  waiting on review. Neither one is live. */}
              <CopyText
                k={save.k === 'done' ? 'inspect.previewpr' : 'inspect.preview'}
                className={styles.previewText}
              />
              <span className={styles.previewActions}>
                <button
                  type="button"
                  className={`${styles.resetAll} ${styles.save}`}
                  aria-disabled={saveInert || undefined}
                  aria-describedby={note ? NOTE_ID : undefined}
                  onClick={() => {
                    if (saveInert) return
                    if (readEditKey()) void commit()
                    else setSave({ k: 'key' })
                  }}
                >
                  <CopyText k="inspect.save" />
                  {target && <span className={styles.saveTarget}>{target.toUpperCase()}</span>}
                </button>
                <button
                  type="button"
                  className={styles.resetAll}
                  onClick={() => {
                    resetAll()
                    setOpenVar(null)
                    setSave({ k: 'idle' })
                    after()
                  }}
                >
                  <CopyText k="inspect.resetall" />
                </button>
              </span>
            </div>

            {save.k === 'key' && (
              <form className={styles.keyRow} onSubmit={arm}>
                <label className={styles.keyLabel} htmlFor={KEY_ID}>
                  <CopyText k="inspect.save.key" />
                </label>
                <input
                  id={KEY_ID}
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
            )}

            {/* The live region is mounted for the whole life of the banner,
                empty or not: a role="status" node that appears at the same
                moment as its text is announced unreliably, because there was
                no region to observe when the text arrived. */}
            <div className={styles.saveStatus} role="status">
              {save.k === 'done' ? (
                <p className={styles.saveNote} id={NOTE_ID}>
                  <CopyText k="inspect.save.done" />{' '}
                  <a
                    className={styles.prLink}
                    href={save.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {/* fragment + number, the same composition
                        `inspect.on` uses between two value spans */}
                    <CopyText k="inspect.save.pr" />
                    {save.number}
                  </a>
                </p>
              ) : note ? (
                <p className={styles.saveNote} id={NOTE_ID} data-fail={note.fail || undefined}>
                  <CopyText k={note.key} />
                </p>
              ) : null}
            </div>
          </div>
        )}

        {!report ? (
          <div className={styles.emptyState}>
            <p className={styles.empty}>
              <CopyText k="inspect.empty" />
            </p>
            <CopyText k="inspect.hint" as="p" className={styles.hint} />
          </div>
        ) : (
          <div role="region" aria-label={t('inspect.region', skin)}>
            <div className={styles.ident}>
              <span className={styles.identLabel}>
                <CopyText k="inspect.ident" />
              </span>
              <span className={styles.identName}>{report.label}</span>
            </div>
            {report.reskinned && (
              <p className={styles.reskin}>
                <CopyText k="inspect.reskinned" />
              </p>
            )}

            {/* ---- PATH ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.path" />
              </h3>
              <ol className={styles.path}>
                {pathRows(report.chain).map((row, i) =>
                  row.kind === 'gap' ? (
                    <li key={`gap${i}`} className={styles.pathStep} style={indentOf(row.depth)}>
                      <span className={styles.pathGap}>
                        {row.count > 1 ? `… (${row.count})` : '…'}
                      </span>
                    </li>
                  ) : (
                    <li key={`node${i}`} className={styles.pathStep} style={indentOf(row.depth)}>
                      {row.here ? (
                        // the terminus is the reading itself, so it is a
                        // label rather than a control: re-picking what is
                        // already picked is a button that does nothing
                        <span className={styles.pathHere} aria-current="true">
                          {row.label}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={styles.pathBtn}
                          onClick={() => onPick(row.el)}
                        >
                          {row.label}
                        </button>
                      )}
                    </li>
                  ),
                )}
              </ol>
            </section>

            {/* ---- SOURCE ---- */}
            {report.source.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.head}>
                  <CopyText k="inspect.section.source" />
                </h3>
                <ul className={styles.sourceRows}>
                  {report.source.map((row) => (
                    <li key={`${row.kind}|${row.text}`} className={styles.sourceRow}>
                      <span className={styles.sourceKind}>
                        <CopyText k={`inspect.source.${row.kind}`} />
                      </span>
                      <span className={styles.sourcePath}>{row.text}</span>
                      {row.via && (
                        <span className={styles.sourceVia}>
                          <CopyText k="inspect.source.via" /> {row.via}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <CopyText k="inspect.source.note" as="p" className={styles.sourceNote} />
              </section>
            )}

            {/* ---- TOKENS ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.tokens" />
              </h3>
              {report.tokens.length === 0 ? (
                <p className={styles.note}>
                  <CopyText k="inspect.inherited" />
                </p>
              ) : (
                <ul className={styles.rows}>
                  {report.tokens.map((row) => (
                    <li key={row.property} className={styles.tokenRow}>
                      <span className={styles.prop}>{row.property}</span>
                      <ul className={styles.vars}>
                        {row.resolved.map((r) => {
                          // springs are core BY DESIGN — motion has no
                          // semantic tier, so they are not a violation
                          const rawCore = r.tier === 'core' && !r.varName.startsWith('--spring-')
                          // a semantic role that resolves to a colour is
                          // the one thing here that can be re-cast
                          const tunable = r.tier === 'semantic' && !!r.rgb
                          const key = `${row.property}|${r.varName}`
                          const open = openVar === key
                          const held = isNudged(r.varName)
                          return (
                            <li
                              key={r.varName}
                              className={styles.var}
                              data-warn={rawCore || undefined}
                              data-held={held || undefined}
                            >
                              <span className={styles.varName}>{r.varName}</span>
                              <span className={styles.tier} data-tier={r.tier}>
                                {r.tier.toUpperCase()}
                              </span>
                              {r.hex &&
                                (tunable ? (
                                  <button
                                    type="button"
                                    className={styles.swatchBtn}
                                    style={{ background: r.hex }}
                                    aria-expanded={open}
                                    aria-label={`${t('inspect.nudge', skin)} ${r.varName}`}
                                    onClick={() => setOpenVar(open ? null : key)}
                                  />
                                ) : (
                                  <span
                                    className={styles.swatch}
                                    style={{ background: r.hex }}
                                    aria-hidden="true"
                                  />
                                ))}
                              <span className={styles.value}>{r.value || '—'}</span>
                              {rawCore && (
                                <span className={styles.warnText}>
                                  <CopyText k="inspect.corewarn" />
                                </span>
                              )}

                              {open && (
                                <div
                                  className={styles.palette}
                                  role="group"
                                  aria-label={`${t('inspect.nudge', skin)} ${r.varName}`}
                                >
                                  {CANDIDATES.map((c) => {
                                    const would = wouldGrade(c.hex, row.property, report.colors)
                                    return (
                                      <button
                                        key={c.token}
                                        type="button"
                                        className={styles.candidate}
                                        data-fail={would?.fails || undefined}
                                        onClick={() => {
                                          // the verdict the row is showing
                                          // rides along — SAVE refuses on it
                                          nudge(r.varName, c, would)
                                          after()
                                        }}
                                      >
                                        <span
                                          className={styles.swatch}
                                          style={{ background: c.hex }}
                                          aria-hidden="true"
                                        />
                                        <span className={styles.candidateName}>{c.token}</span>
                                        {would && (
                                          <span className={styles.candidateGrade}>
                                            {would.grade}
                                          </span>
                                        )}
                                      </button>
                                    )
                                  })}
                                  {held && (
                                    <button
                                      type="button"
                                      className={styles.candidate}
                                      data-reset=""
                                      onClick={() => {
                                        reset(r.varName)
                                        after()
                                      }}
                                    >
                                      <CopyText k="inspect.revert" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ---- CONTRAST ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.contrast" />
              </h3>
              <div className={styles.contrast}>
                <span className={styles.pair}>
                  {report.colors.fgHex && (
                    <span
                      className={styles.swatch}
                      style={{ background: report.colors.fgHex }}
                      aria-hidden="true"
                    />
                  )}
                  <span className={styles.value}>{report.colors.fgHex ?? '—'}</span>
                </span>
                <CopyText k="inspect.on" className={styles.on} />
                <span className={styles.pair}>
                  {report.colors.bgHex && (
                    <span
                      className={styles.swatch}
                      style={{ background: report.colors.bgHex }}
                      aria-hidden="true"
                    />
                  )}
                  <span className={styles.value}>{report.colors.bgHex ?? '—'}</span>
                </span>
                {report.colors.ratio !== null && (
                  <span className={styles.ratio}>{report.colors.ratio.toFixed(2)}:1</span>
                )}
                {report.colors.grade && (
                  <span
                    className={styles.gradeChip}
                    data-fail={report.colors.grade === 'FAIL' || undefined}
                  >
                    {report.colors.grade}
                  </span>
                )}
              </div>
            </section>

            {/* ---- TYPE ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.type" />
              </h3>
              <dl className={styles.facts}>
                <dt>family</dt>
                <dd>{report.type.family}</dd>
                <dt>size</dt>
                <dd>{report.type.size}</dd>
                <dt>weight</dt>
                <dd>{report.type.weight}</dd>
                <dt>tracking</dt>
                <dd>{report.type.tracking}</dd>
                <dt>leading</dt>
                <dd>{report.type.leading}</dd>
              </dl>
              {report.typeVars.length > 0 && (
                <div className={styles.chips}>
                  {report.typeVars.map((name) => (
                    <span key={name} className={styles.roleChip}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* ---- MOTION ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.motion" />
              </h3>
              {report.spring && springKey ? (
                <>
                  <p className={styles.springLine}>
                    <span className={styles.springName}>{report.spring.name.toUpperCase()}</span>
                    <span className={styles.value}>
                      stiffness {report.spring.stiffness} · damping {report.spring.damping}
                      {report.spring.mass ? ` · mass ${report.spring.mass}` : ''}
                    </span>
                  </p>
                  <CopyText k={springKey} as="p" className={styles.note} />
                  {report.spring.inherited && (
                    <CopyText k="inspect.springvia" as="p" className={styles.note} />
                  )}
                </>
              ) : (
                <p className={styles.note}>
                  <CopyText k="inspect.nospring" />
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  )
}
