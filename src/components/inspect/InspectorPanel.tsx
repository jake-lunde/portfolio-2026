'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
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
import { tabStep } from '@/lib/tabs'
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
   in one of them goes missing.

   ---- round 5, and the stack becomes three tabs ----

   Jake, post-s105: "inspect mode should collapse the sections (path,
   source, tokens) and/or turn like kinds into tabs. actually probably
   tabs, no more than 3 tabs with nested tabs for further delineation."

   Seven sections read as one long scroll with nothing to say where a
   reading ends and the next begins — the BAR treatment above answered
   that for the EYE, this answers it for the SCROLL. Three tabs, grouped
   by what kind of question they answer:

   · STRUCTURE — PATH and SOURCE. Both answer "where": where the pick
     sits in the tree, where its code lives on disk. Two short readings,
     so they stay stacked inside the one tab rather than splitting further.
   · STYLE — TOKENS, CONTRAST, TYPE, MOTION. All four answer "what does
     this look and move like" and TOKENS especially can run long, so this
     is the one tab that earns a nested row: the STYLE bar holds a second,
     smaller tablist instead of a single label, and its InfoTip note swaps
     with whichever of the four is showing.
   · COPY — the live rewrite block, only when the pick sits on a copy key.
     A question of its own ("what does this SAY", not "what is it built
     from or styled with"), and the one tab that is not always on offer.

   The OPEN COMPONENT door stays OUTSIDE every tab, immediately under the
   ident, because Jake's other standing rule is that the door back to
   STYLER must never be a click a visitor has to go hunting a tab for.
   PENDING and the token preview banner were already outside the section
   stack and stay there unchanged.

   Both tab rows share one keyboard rule (src/lib/tabs.ts) rather than two
   copies of it, and it is the WAI-ARIA tabs pattern with automatic
   activation: arrow keys move AND select, Home/End jump to the ends,
   clamped rather than wrapped — the same choice LayersPanel's tree walk
   already made. */

/* Constant ids, never useId: this panel mounts inside a tree that reshapes
   at the SSR handover, and a generated id mismatches across it (see memory).
   Both nodes are unique on the page — the mode is a singleton, and the key
   gate is ONE form serving both proposals, so it can hold a constant id. */
const KEY_ID = 'inspect-key'
const NOTE_ID = 'inspect-save-note'

/** The one file every string on the desktop that has a key comes from. */
const COPY_PATH = 'src/content/copy.json'

/* ---- the tab rows, generic over both the top three and STYLE's nested
   four ----

   A plain function component at module scope, never one declared inside
   InspectorPanel's body: a component type built fresh on every render is a
   component that unmounts and remounts on every render, and that is a
   focus loss waiting to happen the moment a visitor arrows through it
   (see useTokenSave.tsx's note on the same trap for the key gate).

   Jake, s107: the flat underlined row read badly and the row has to scroll
   sideways rather than wrap (.tabs in inspectShell.module.css) — a pill
   can end up off the edge of that scroller on either a click or an arrow
   step, so the active one is walked into view explicitly rather than
   trusting a focus call the button doesn't always get (Safari does not
   focus a plain button on click). `block: 'nearest'` and `inline: 'nearest'`
   keep the scroll local to the row — this must never drag the dock itself. */

type TabItem = { id: string; label: string }

function TabList({
  idPrefix,
  tabs,
  active,
  onSelect,
  ariaLabel,
}: {
  /** unique per tablist on the page, so two rows never collide on an id */
  idPrefix: string
  tabs: readonly TabItem[]
  active: string
  onSelect: (id: string) => void
  ariaLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>(`[data-tab-id="${active}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = tabs.findIndex((item) => item.id === active)
    const to = tabStep(at < 0 ? 0 : at, tabs.length, e.key)
    if (to === null) return
    e.preventDefault()
    const next = tabs[to]
    onSelect(next.id)
    // automatic activation moves the selection AND the focus together —
    // the button for the newly active tab already exists in the DOM
    // (every tab renders regardless of which is selected), so it can be
    // reached before React's own re-render lands
    e.currentTarget.querySelector<HTMLElement>(`[data-tab-id="${next.id}"]`)?.focus()
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      className={styles.tabs}
      onKeyDown={onKeyDown}
    >
      {tabs.map((item) => {
        const selected = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            data-tab-id={item.id}
            className={styles.tab}
            onClick={() => onSelect(item.id)}
          >
            <CopyText k={item.label} />
          </button>
        )
      })}
    </div>
  )
}

/* ---- the STYLER footer's link-out glyph ----

   The house's small-chrome stroke recipe (MenuBar.tsx's NoteGlyph / Sun /
   Moon): a 32-unit grid, round caps and joins, on currentColor so it always
   matches the chip's own ink, whichever ink that turns out to be. Module
   scope for the same reason TabList is: a component type rebuilt every
   render is a component that remounts every render.

   The width/height are literal pixels rather than an em box: at the
   micro type step (--type-micro-size) an em-sized glyph works out under
   8px, and a stroke icon that small stops reading as a shape. 11px is the
   smallest this glyph holds together at the 3px stroke weight the 32-grid
   wants once it is drawn this small — bumped up from the 1.5px MenuBar
   uses at 14px, or the line all but disappears. Decorative only; the
   button around it carries the aria-label. */
function LinkOutGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="11"
      height="11"
      className={styles.stylerChipIcon}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13 8H9a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-4" />
      <path d="M18 6h8v8" />
      <path d="M26 6 15 17" />
    </svg>
  )
}

const TOP_TABS_ID = 'inspect-tabs'
const STYLE_TABS_ID = 'inspect-style-tabs'

type TopTabId = 'structure' | 'style' | 'copy'
type StyleTabId = 'tokens' | 'contrast' | 'type' | 'motion'

const STYLE_TABS: { id: StyleTabId; label: string }[] = [
  { id: 'tokens', label: 'inspect.section.tokens' },
  { id: 'contrast', label: 'inspect.section.contrast' },
  { id: 'type', label: 'inspect.section.type' },
  { id: 'motion', label: 'inspect.section.motion' },
]

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

  /* ---- which tab is showing. Not reset on every pick: a visitor reading
     TOKENS across three picks in a row should not be thrown back to
     STRUCTURE each time, the same reason openVar and the tree's expanded
     set outlive a pick too. The one exception is COPY, which is not
     always on offer — see activeTab below. ---- */
  const [tab, setTab] = useState<TopTabId>('structure')
  const [styleTab, setStyleTab] = useState<StyleTabId>('tokens')

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

  /* A pick that lost its copy key (or never had one) cannot leave the
     visitor parked on an empty COPY tab — fall back to STRUCTURE for
     THIS render without touching the state, so a later pick that lands
     on copy again reopens where the visitor left it. */
  const activeTab: TopTabId = tab === 'copy' && !copyKey ? 'structure' : tab
  const topTabs: TabItem[] = [
    { id: 'structure', label: 'inspect.tab.structure' },
    { id: 'style', label: 'inspect.tab.style' },
    ...(copyKey ? [{ id: 'copy', label: 'inspect.section.copy' }] : []),
  ]

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

  /* Which components the pick belongs to. The whole component, from
     wherever inside it the visitor clicked: STYLER edits the tier, and the
     tier has no instances (StylerStage.tsx).

     Jake, s107, from a screenshot: picking a button inside a nav only
     offered that nav's own door, not the button's. `closest()` only ever
     found the nearest match, so a component nested inside another
     component lost its own door the moment its ancestor also happened to
     register one. The chain PATH already walks (lib/inspect.ts's
     ancestorChain, picked first) has every ancestor in it, so this walks
     the same list instead and keeps every stop that both carries
     `data-component` and has a stage spec to open, nearest first,
     deduped — the STYLER footer below turns each into its own chip. */
  const componentIds = (() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const entry of report?.chain ?? []) {
      const id = entry.el.dataset.component
      if (id && !seen.has(id) && specFor(id)) {
        seen.add(id)
        out.push(id)
      }
    }
    return out
  })()

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

            {/* ---- the top tabs: STRUCTURE / STYLE / COPY ----
                STYLER's door used to sit right here, immediately under the
                ident. Jake, s107: it now pins to the foot of the whole
                dock instead (see the STYLER footer below, outside
                .panelBody's scroll) so it stays reachable under every
                tab without a gap of raised ground announcing it — the
                same round flagged the ident's border-bottom running
                straight into a section head as noise, and losing this
                block's `.section` (which is what added the gap) fixes
                both at once. */}
            <div className={styles.bar}>
              <TabList
                idPrefix={TOP_TABS_ID}
                tabs={topTabs}
                active={activeTab}
                onSelect={(id) => setTab(id as TopTabId)}
                ariaLabel={t('inspect.tabs.group', skin)}
              />
            </div>

            {activeTab === 'structure' && (
              <div
                role="tabpanel"
                id={`${TOP_TABS_ID}-panel-structure`}
                aria-labelledby={`${TOP_TABS_ID}-tab-structure`}
                tabIndex={0}
              >
                {/* ---- PATH ----
                    First section under the tab row, so it takes
                    .sectionFlush: .section's usual margin-top is the right
                    call between two readings that both belong to this tab
                    (see SOURCE below), but between the tab row and the
                    first reading it was just a stray band of raised
                    ground, per the same s107 note as the STYLER footer. */}
                <section className={`${styles.section} ${styles.sectionFlush}`}>
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
                          <li
                            key={`gap${i}`}
                            className={styles.pathStep}
                            style={indentOf(row.depth)}
                          >
                            <span className={styles.pathGap}>
                              {row.count > 1 ? `… (${row.count})` : '…'}
                            </span>
                          </li>
                        ) : (
                          <li
                            key={`node${i}`}
                            className={styles.pathStep}
                            style={indentOf(row.depth)}
                          >
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
              </div>
            )}

            {activeTab === 'style' && (
              <div
                role="tabpanel"
                id={`${TOP_TABS_ID}-panel-style`}
                aria-labelledby={`${TOP_TABS_ID}-tab-style`}
                tabIndex={0}
              >
                {/* ---- STYLE: TOKENS, CONTRAST, TYPE, MOTION, nested ----
                    All four answer the same question — what does this look
                    and move like — and TOKENS especially can run to a dozen
                    rows, so this is the one tab that earns a second row of
                    tabs rather than staying stacked the way PATH and SOURCE
                    do. STYLE.tabs.style.group still exists as its own
                    aria-label rather than reusing the outer one.

                    The bar used to carry an InfoTip too, swapping its note
                    to whichever of the four was active. Jake, s107: the nested
                    row crowded the bar enough that the tip's own hover target
                    became unreachable — the note and the tab it explained sat
                    on top of each other. Removed rather than shrunk; nothing
                    else on this bar has a note to lose.

                    This section also takes .sectionFlush, the same as
                    PATH: it is the first (and only) reading under the top
                    tab row on this tab, so .section's default margin-top
                    would open the identical stray gap s107 flagged. */}
                <section className={`${styles.section} ${styles.sectionFlush}`}>
                  <div className={styles.bar}>
                    <TabList
                      idPrefix={STYLE_TABS_ID}
                      tabs={STYLE_TABS}
                      active={styleTab}
                      onSelect={(id) => setStyleTab(id as StyleTabId)}
                      ariaLabel={t('inspect.tabs.style.group', skin)}
                    />
                  </div>
                  <div
                    role="tabpanel"
                    id={`${STYLE_TABS_ID}-panel-${styleTab}`}
                    aria-labelledby={`${STYLE_TABS_ID}-tab-${styleTab}`}
                    tabIndex={0}
                    className={styles.sectionBody}
                  >
                    {/* ---- TOKENS ---- */}
                    {styleTab === 'tokens' &&
                      (report.tokens.length === 0 ? (
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
                                  const rawCore =
                                    r.tier === 'core' && !r.varName.startsWith('--spring-')
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
                                            const would = wouldGrade(
                                              c.hex,
                                              row.property,
                                              report.colors,
                                            )
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
                                                <span className={styles.candidateName}>
                                                  {c.token}
                                                </span>
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
                      ))}

                    {/* ---- CONTRAST ---- */}
                    {styleTab === 'contrast' && (
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
                    )}

                    {/* ---- TYPE ---- */}
                    {styleTab === 'type' && (
                      <>
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
                      </>
                    )}

                    {/* ---- MOTION ---- */}
                    {styleTab === 'motion' &&
                      (report.spring && springKey ? (
                        <>
                          <p className={styles.springLine}>
                            <span className={styles.springName}>
                              {report.spring.name.toUpperCase()}
                            </span>
                            <span className={styles.value}>
                              stiffness {report.spring.stiffness} · damping{' '}
                              {report.spring.damping}
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
                      ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'copy' && copyKey && (
              <div
                role="tabpanel"
                id={`${TOP_TABS_ID}-panel-copy`}
                aria-labelledby={`${TOP_TABS_ID}-tab-copy`}
                tabIndex={0}
              >
                {/* ---- COPY: the words themselves, editable in place ----
                    .sectionFlush for the same reason PATH and STYLE's
                    section take it: this is the only reading under COPY's
                    own top-tab row, so the default .section margin-top
                    would open the s107 gap here too. */}
                <section className={`${styles.section} ${styles.sectionFlush}`}>
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- STYLER: a door, not a workshop ----
          The five blocks stood here for one review. Jake's note: styling
          and inspecting are two experiences, and a panel showing TOKENS,
          CONTRAST, TYPE and MOTION around a set of styling controls is
          asking a person to do one job while looking at another. So the
          blocks moved to a stage of their own (StylerStage.tsx) and what
          is left in the reading is the way in.

          Round 6 (s107): two more rulings, both about this block staying
          reachable. First, one chip per styler-compatible component in
          the pick's WHOLE ancestor chain (componentIds above), not only
          the nearest — a button picked inside a nav inside a window
          used to offer only the nav's door. Second, the block itself
          moves outside .panelBody, as a sibling after it rather than a
          child inside it: `.panel` is already a flex column
          (panelHead flex:none, panelBody flex:1 auto scrolling), so a
          third flex item here pins to the foot of the dock the same way
          panelHead pins to the top, no position:fixed needed. Every tab
          scrolls behind it now, which is the whole point — the door back
          to STYLER must never be a click a visitor has to go hunting a
          tab, or a scroll position, for.

          Each chip IS the button now too: it used to be a stroked
          .roleChip (component id) beside a separate OPEN COMPONENT
          button, and Jake's read was that a stroked container next to
          its own trigger is one affordance drawn as two. The link-out
          glyph inside says "this opens something" without adding a
          second focus stop, and the chip keeps .roleChip's stroke
          treatment — accent border, accent ink, surface fill — since
          nothing about becoming clickable changes what it is reporting. */}
      {report && componentIds.length > 0 && (
        <div className={styles.stylerFoot}>
          <div className={styles.bar}>
            <h3 className={styles.head}>
              <CopyText k="styler.section" />
            </h3>
            <InfoTip k="styler.note" />
          </div>
          <div className={styles.stylerChips}>
            {componentIds.map((id) => (
              <button
                key={id}
                type="button"
                className={styles.stylerChip}
                onClick={() => setStage(id)}
                aria-label={`${t('styler.open', skin)} ${id.toUpperCase()} ${t('styler.instyler', skin)}`}
              >
                <span className={styles.stylerChipLabel}>{id}</span>
                <LinkOutGlyph />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
