'use client'

import { useState } from 'react'
import { useSettings } from '@/store/settings'
import { useInspect } from '@/store/inspect'
import { resolveCopy, t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { getCase } from '@/programs/projects/cases'
import {
  labelFor,
  sourceText,
  type ChainEntry,
  type Inspection,
  type SourcePart,
} from '@/lib/inspect'
import { editUrl } from '@/lib/repo'
import type { useCopyEditing } from './useCopyEditing'
import { InfoTip } from './InfoTip'
import { useTokenSave } from './useTokenSave'
import { specFor } from './stageSpecs'
import { CANDIDATES, isNudged, nudge, reset, resetAll, wouldGrade } from '@/lib/tune'
import { resetAll as stylerResetAll } from '@/lib/stylerTune'
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
   CI's token doctor (--strict --parity) stays the real gate behind it.

   COPY is the second seam, and it arrived by demotion. EDIT.MODE was a
   program, then INSPECT's third tool, and Jake's call is that neither
   shape was right: you should not have to put a hand on before you can
   fix a word. So it is a block on the READING now. Pick anything; if the
   pick sits on a copy key, the block says which key, which slot the
   active skin renders from, and what it currently says, and EDIT drops
   the caret into that node out on the canvas. Anything that is not copy
   has no block at all — SOURCE already says where the words live, and for
   a case window that is an MDX file no amount of clicking will reach.

   Rewrites pile up in PENDING at the top of the panel, beside the token
   banner, because both are the same sentence: something on this desktop is
   changed and not saved yet. The two land differently — copy goes straight
   to main, a token re-cast goes to a PR — and the buttons say so.

   ---- round 3, and it is about scale ----

   Jake: "inspector and layers at the top feel good. Once we get into the
   middle it still feels muddy." Two things came out of that.

   Every section head is a BAR now: a raised fill running edge to edge of
   the dock with the label in ink, so the eye can find where one reading
   ends and the next begins without reading a word (inspectShell.module
   .css). The markup underneath it changed shape to allow it: bar, then a
   .sectionBody carrying the inset the panel body used to carry.

   And the notes moved. The sort, which is the rule from here on: prose
   that explains the TOOL hangs off the bar's info glyph and shows on
   hover or focus (InfoTip.tsx); readings that describe the PICK stay
   inline where they can be seen without asking. So SOURCE's "pointers to
   search for" is on hover and the core-primitive warning is not.

   ---- round 4, and STYLER leaves ----

   The component tier's five blocks shipped inside this panel for exactly
   one review. Jake: styling must not be conflated with inspecting, and the
   thing being styled has to come away from the site or you cannot see what
   you changed. Both notes point the same way, so the blocks became a room
   of their own (StylerStage.tsx) and what is left here is the door — one
   bar, the component's name, OPEN COMPONENT. The SAVE flow went into a
   hook on the way out (useTokenSave.tsx) rather than being copied, because
   two docks proposing the same edits by two code paths is how an AA refusal
   in one of them goes missing. */

/* Constant ids, never useId: this panel mounts inside a tree that reshapes
   at the SSR handover, and a generated id mismatches across it (see memory).
   Both nodes are unique on the page — the mode is a singleton, and the key
   gate is ONE form serving both proposals, so it can hold a constant id. */
const KEY_ID = 'inspect-key'
const NOTE_ID = 'inspect-save-note'

/** The one file every string on the desktop that has a key comes from. */
const COPY_PATH = 'src/content/copy.json'

/* ---- a SOURCE pointer, printed ----

   Round 1 shipped these as plain text and Jake said no links, because a
   pointer that cannot be resolved should not pretend to open anything.
   The pointers resolve now, and his editing loop is GitHub itself: open
   the file on main, type, and GitHub hands back a branch and a PR that
   Vercel builds a preview for. So the file half of every row is a link
   into that editor and the rest of the pointer stays plain text.

   Selectable either way. A path is still a thing to copy and paste into a
   repo search, and taking that away to gain a link would be a trade. */
function SourcePointer({ parts }: { parts: SourcePart[] }) {
  return (
    <span className={styles.sourcePath}>
      {parts.map((part, i) =>
        part.path ? (
          <a
            key={i}
            className={styles.sourceLink}
            href={editUrl(part.path)}
            target="_blank"
            rel="noreferrer"
            /* the visible text is a basename where the row prints one, so
               the name announced is the whole path it stands for */
            aria-label={part.text === part.path ? undefined : part.path}
          >
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  )
}

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

export function InspectorPanel({
  report,
  picked,
  copy,
  openVar,
  setOpenVar,
  onRefresh,
  onPick,
}: {
  report: Inspection | null
  /** the picked node itself — the reading is a snapshot, this is the thing */
  picked: HTMLElement | null
  /** the live copy editor, mounted for the whole mode (useCopyEditing) */
  copy: ReturnType<typeof useCopyEditing>
  /** which candidate palette is open, keyed `property|--var` */
  openVar: string | null
  setOpenVar: (v: string | null) => void
  onRefresh: () => void
  /** PATH rows re-pick through the same flow the canvas and the tree use */
  onPick: (el: HTMLElement) => void
}) {
  const skin = useSettings((s) => s.skin)
  const setStage = useInspect((s) => s.setStage)
  // tune.ts is module state, not a store — this is what re-reads it
  const [, bump] = useState(0)

  /* ---- what the pick means to the copy layer ----
     The key may sit on an ancestor: a copy string renders into one node
     and the visitor may well have picked a span inside it. That node is
     the one that takes the caret, and the row says VIA when it is not the
     pick itself — the same admission SOURCE makes. */
  const copyHost = picked?.closest<HTMLElement>('[data-copy-id]') ?? null
  const copyKey = copyHost?.dataset.copyId ?? null
  const copyVia = copyHost && copyHost !== picked ? labelFor(copyHost) : null
  const resolved = copyKey ? resolveCopy(copyKey, skin) : null
  const copyPending = copyKey ? copy.edits.find((e) => e.key === copyKey) : undefined
  /* A pending rewrite is what the desktop is SHOWING, so it is what the
     row reports. copy.json still says the old thing and PENDING prints
     both sides of that. */
  const copyValue = copyPending?.newValue ?? resolved?.value ?? ''
  const copySlot = copyPending?.slot ?? resolved?.slot ?? 'base'
  const editingHere = !!copyHost && copy.editing === copyHost

  /* The MDX behind the pick's window. Case prose is a file on disk, not
     copy.json, so no amount of clicking a paragraph will ever edit it —
     SOURCE says where it actually lives. The lookup sits here rather than
     in lib/inspect.ts on purpose: that engine is pure DOM and arithmetic,
     and importing the case registry (which pulls next/dynamic and every
     case component behind it) into it would end that. */
  const winId = picked?.closest<HTMLElement>('[data-window-id]')?.dataset.windowId
  const mdx = winId?.startsWith('case:') ? getCase(winId.slice(5))?.source : undefined
  /* The TEXT row matches a string against the build's index, and for case
     prose it lands on exactly the file the MDX row already names. Two rows,
     one file, so the matched one gives way to the one that knows. */
  const sourceRows = (report?.source ?? []).filter(
    (row) => !(row.kind === 'text' && !!mdx && sourceText(row) === `content/${mdx}`),
  )

  const springKey = report?.spring ? `inspect.spring.${report.spring.name}` : null

  /* Which component the pick belongs to. The whole component, from wherever
     inside it the visitor clicked: STYLER edits the tier, and the tier has
     no instances (StylerStage.tsx). */
  const componentId = picked?.closest<HTMLElement>('[data-component]')?.dataset.component ?? null

  /* The whole SAVE flow lives in one hook now, because the STYLER stage is a
     second dock that has to send exactly the same set the same way
     (useTokenSave.tsx). The gate's constant id is passed in from here, so the
     two docks can both be mounted without their inputs colliding. */
  const saver = useTokenSave({
    keyId: KEY_ID,
    noteId: NOTE_ID,
    authenticate: copy.authenticate,
    onCopyArmed: () => {
      if (copyHost) copy.beginEdit(copyHost)
    },
  })

  const after = () => {
    // a new pick makes any reported PR describe a different set — the
    // panel goes back to offering SAVE rather than quoting a stale number
    saver.setSave((s) => (s.k === 'done' || s.k === 'error' ? { k: 'idle' } : s))
    bump((n) => n + 1)
    onRefresh()
  }

  /* PENDING earns its place when there is something in it, or while a
     commit is in flight, or while it has an outcome to report. */
  const copyStatus = copy.status
  const showPending = copy.edits.length > 0 || copy.committing || !!copyStatus
  const copyFail = !!copyStatus && copyStatus.key !== 'inspect.edit.done'

  return (
    <>
      <h2 className={styles.panelHead}>
        <CopyText k="inspect.panel.inspector" />
      </h2>

      <div className={styles.panelBody}>
        {saver.anyLive && (
          <div className={styles.preview}>
            <div className={styles.previewTop} role="status">
              {/* the two states the visitor must be able to tell apart:
                  previewing an override, vs. that override sitting in a PR
                  waiting on review. Neither one is live. */}
              <CopyText
                k={saver.save.k === 'done' ? 'inspect.previewpr' : 'inspect.preview'}
                className={styles.previewText}
              />
              <span className={styles.previewActions}>
                {/* SAVE is present in every state — never unmounted
                    mid-interaction, or focus falls to <body> exactly when the
                    visitor is waiting to hear what happened. ARIA-disabled
                    rather than `disabled`, so the button keeps its place in
                    the tab order and its reason stays reachable. */}
                <button
                  type="button"
                  className={`${styles.resetAll} ${styles.save}`}
                  aria-disabled={saver.saveInert || undefined}
                  aria-describedby={saver.note ? NOTE_ID : undefined}
                  onClick={saver.requestSave}
                >
                  <CopyText k="inspect.save" />
                  {saver.target && (
                    <span className={styles.saveTarget}>{saver.target.toUpperCase()}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={styles.resetAll}
                  onClick={() => {
                    resetAll()
                    stylerResetAll()
                    setOpenVar(null)
                    saver.setSave({ k: 'idle' })
                    after()
                  }}
                >
                  <CopyText k="inspect.resetall" />
                </button>
              </span>
            </div>

            {saver.gate?.for === 'token' && saver.keyGate()}
            {saver.saveStatus()}
          </div>
        )}

        {/* ---- PENDING: rewritten copy, not saved yet ----
            The token banner above says the same thing about a re-cast, and
            these two sit together because a visitor who has done both has
            two unsaved things on one desktop. What separates them is where
            they land, and the buttons carry that: a token opens a PR, a
            copy edit goes to main. */}
        {showPending && (
          <section className={styles.pending}>
            {/* the count sits beside the heading rather than inside it: a
                heading takes its accessible name from its contents, and a
                bare number is not part of what this block is called */}
            <div className={styles.bar}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.pending" />
              </h3>
              <span className={styles.editCount}>{copy.edits.length}</span>
            </div>

            <div className={`${styles.sectionBody} ${styles.pendingBody}`}>
              <ul className={styles.rows}>
                {copy.edits.map((e) => (
                  <li key={e.key} className={styles.tokenRow}>
                    <div className={styles.editRowHead}>
                      <span className={styles.editKeyName} title={e.key}>
                        {e.key}
                      </span>
                      <span className={styles.editSlot}>{e.slot.toUpperCase()}</span>
                      <button
                        type="button"
                        className={styles.resetAll}
                        onClick={() => copy.revert(e.key)}
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

              {copy.tokenMissing && (
                <p className={styles.saveNote} data-fail="">
                  <CopyText k="inspect.edit.notoken" />
                </p>
              )}

              {/* mounted for the whole life of the block, empty or not — the
                  same rule the SAVE banner's region follows */}
              <div role="status">
                {copyStatus && (
                  <p className={styles.saveNote} data-fail={copyFail || undefined}>
                    <CopyText k={copyStatus.key} />
                    {copyStatus.count !== undefined ? ` ${copyStatus.count}` : ''}
                  </p>
                )}
            </div>

            <button
              type="button"
              className={styles.editCommit}
              onClick={() => void copy.commit()}
              disabled={copy.committing || copy.edits.length === 0 || !copy.canCommit}
            >
              <CopyText k={copy.committing ? 'inspect.edit.committing' : 'inspect.edit.commit'} />
            </button>

            {copy.edits.length > 0 && (
              <button
                type="button"
                className={`${styles.resetAll} ${styles.revertAll}`}
                onClick={() => copy.revertAll()}
              >
                <CopyText k="inspect.edit.revertall" />
              </button>
            )}
            </div>
          </section>
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
              <div className={styles.bar}>
                <h3 className={styles.head}>
                  <CopyText k="inspect.section.path" />
                </h3>
                <InfoTip k="inspect.path.note" />
              </div>
              <div className={styles.sectionBody}>
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
              </div>
            </section>

            {/* ---- SOURCE ---- */}
            {(sourceRows.length > 0 || mdx) && (
              <section className={styles.section}>
                <div className={styles.bar}>
                  <h3 className={styles.head}>
                    <CopyText k="inspect.section.source" />
                  </h3>
                  <InfoTip k="inspect.source.note" />
                </div>
                <div className={styles.sectionBody}>
                  <ul className={styles.sourceRows}>
                    {sourceRows.map((row) => (
                      <li key={`${row.kind}|${sourceText(row)}`} className={styles.sourceRow}>
                        <span className={styles.sourceKind}>
                          <CopyText k={`inspect.source.${row.kind}`} />
                        </span>
                        <SourcePointer parts={row.parts} />
                        {row.via && (
                          <span className={styles.sourceVia}>
                            <CopyText k="inspect.source.via" /> {row.via}
                          </span>
                        )}
                      </li>
                    ))}
                    {/* the prose in a case window is a file on disk, and the
                        COPY block will never offer to edit it */}
                    {mdx && (
                      <li className={styles.sourceRow}>
                        <span className={styles.sourceKind}>
                          <CopyText k="inspect.source.mdx" />
                        </span>
                        <SourcePointer
                          parts={[{ text: `content/${mdx}`, path: `content/${mdx}` }]}
                        />

                      </li>
                    )}
                  </ul>
                </div>
              </section>
            )}

            {/* ---- COPY: the words themselves, editable in place ---- */}
            {copyKey && (
              <section className={styles.section}>
                <div className={styles.bar}>
                  <h3 className={styles.head}>
                    <CopyText k="inspect.section.copy" />
                  </h3>
                  {/* the ESC/ENTER keys used to print under the caret while
                      it was in the line. They explain the tool, so they
                      moved in here with the rest of the section's note */}
                  <InfoTip k="inspect.copy.note" />
                </div>
                <div className={styles.sectionBody}>
                  <ul className={styles.sourceRows}>
                    <li className={styles.sourceRow}>
                      <span className={styles.sourceKind}>
                        <CopyText k="inspect.copy.key" />
                      </span>
                      {/* the file opens in the editor like any SOURCE row,
                          and the key beside it is the line to find in there */}
                      <SourcePointer
                        parts={[
                          { text: 'copy.json', path: COPY_PATH },
                          { text: ` › ${copyKey}`, path: null },
                        ]}
                      />
                      {copyVia && (
                        <span className={styles.sourceVia}>
                          <CopyText k="inspect.source.via" /> {copyVia}
                        </span>
                      )}
                    </li>
                    <li className={styles.sourceRow}>
                      <span className={styles.sourceKind}>
                        <CopyText k="inspect.copy.slot" />
                      </span>
                      <span className={styles.sourcePath}>{copySlot.toUpperCase()}</span>
                    </li>
                    <li className={styles.sourceRow}>
                      <span className={styles.sourceKind}>
                        <CopyText k="inspect.copy.value" />
                      </span>
                      <span className={styles.sourcePath}>{copyValue}</span>
                    </li>
                  </ul>

                  {copy.phase === 'checking' && (
                    <p className={styles.note}>
                      <CopyText k="inspect.edit.checking" />
                    </p>
                  )}

                  {copy.phase === 'unconfigured' && (
                    <p className={styles.editNotice}>
                      <CopyText k="inspect.edit.unconfigured" />
                    </p>
                  )}

                  {(copy.phase === 'locked' || copy.phase === 'armed') && (
                    <>
                      <button
                        type="button"
                        className={`${styles.resetAll} ${styles.copyEdit}`}
                        /* while the caret is in the node, the press that
                           reaches this button would blur it first and the
                           label would have flipped back to EDIT under the
                           pointer. Keeping the focus keeps the button the
                           one the visitor aimed at. */
                        onMouseDown={(e) => {
                          if (editingHere) e.preventDefault()
                        }}
                        onClick={() => {
                          if (editingHere) copy.endEdit()
                          else if (copy.phase === 'armed' && copyHost) copy.beginEdit(copyHost)
                          else saver.setGate({ for: 'copy' })
                        }}
                      >
                        <CopyText k={editingHere ? 'inspect.copy.done' : 'inspect.copy.edit'} />
                      </button>

                      {saver.gate?.for === 'copy' && saver.keyGate()}
                    </>
                  )}
                </div>
              </section>
            )}

            {/* ---- TOKENS ---- */}
            <section className={styles.section}>
              <div className={styles.bar}>
                <h3 className={styles.head}>
                  <CopyText k="inspect.section.tokens" />
                </h3>
                <InfoTip k="inspect.tokens.note" />
              </div>
              <div className={styles.sectionBody}>
                {/* a finding about the pick, not a footnote about the tool:
                    it stays on the panel where the rows would have been */}
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
              </div>
            </section>

            {/* ---- STYLER: a door, not a workshop ----
                The five blocks stood here for one review. Jake's note: styling
                and inspecting are two experiences, and a panel showing TOKENS,
                CONTRAST, TYPE and MOTION around a set of styling controls is
                asking a person to do one job while looking at another. So the
                blocks moved to a stage of their own (StylerStage.tsx) and what
                is left in the reading is the way in. */}
            {componentId && specFor(componentId) && (
              <section className={styles.section}>
                <div className={styles.bar}>
                  <h3 className={styles.head}>
                    <CopyText k="styler.section" />
                  </h3>
                  <span className={styles.roleChip}>{componentId}</span>
                  <button
                    type="button"
                    className={styles.resetAll}
                    onClick={() => setStage(componentId)}
                  >
                    <CopyText k="styler.open" />
                  </button>
                  <InfoTip k="styler.note" />
                </div>
              </section>
            )}

            {/* ---- CONTRAST ---- */}
            <section className={styles.section}>
              <div className={styles.bar}>
                <h3 className={styles.head}>
                  <CopyText k="inspect.section.contrast" />
                </h3>
                <InfoTip k="inspect.contrast.note" />
              </div>
              <div className={styles.sectionBody}>
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
              </div>
            </section>

            {/* ---- TYPE ---- */}
            <section className={styles.section}>
              <div className={styles.bar}>
                <h3 className={styles.head}>
                  <CopyText k="inspect.section.type" />
                </h3>
                <InfoTip k="inspect.type.note" />
              </div>
              <div className={styles.sectionBody}>
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
              </div>
            </section>

            {/* ---- MOTION ---- */}
            <section className={styles.section}>
              <div className={styles.bar}>
                <h3 className={styles.head}>
                  <CopyText k="inspect.section.motion" />
                </h3>
                <InfoTip k="inspect.motion.note" />
              </div>
              <div className={styles.sectionBody}>
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
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  )
}
