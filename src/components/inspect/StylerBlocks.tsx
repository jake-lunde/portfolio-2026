'use client'

import { useEffect, useRef } from 'react'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { registerHotkeys } from '@/lib/hotkeys'
import { candidatesFor, CANDIDATES_BY_FAMILY, type StyleCandidate } from '@/lib/styleCandidates'
import { blocksFor, fillStrokePair, type StylerRow } from '@/lib/stylerBlocks'
import {
  canRedo,
  canUndo,
  count,
  heldToken,
  isRebound,
  readValue,
  rebind,
  redo,
  resetAll,
  resetRole,
  undo,
} from '@/lib/stylerTune'
import { InfoTip } from './InfoTip'
import styles from './inspectShell.module.css'

/* STYLER — the component tier, in five blocks.
 *
 * TOKENS above reports what the PICK reads. This reports what the COMPONENT
 * under the pick is made of, and offers to change it. The two are different
 * questions and the panel used to answer only the first: a visitor could see
 * that a button's corner comes from --button-radius and had nowhere to go
 * with that. Now the whole set is on the panel — every property the component
 * files declare, grouped Fill · Stroke · Radius · Typography · Spacing, which
 * is Figma's order because that is the panel this visitor already knows.
 *
 * COMPONENT-LEVEL, ALWAYS. Pick the label inside a desktop icon and these
 * blocks still list desktop-icons' whole set, because that is what the tier
 * means: restyling the button restyles every button (Jake, s99). A panel
 * scoped to the picked node would be describing an instance, and the token
 * system has no such thing.
 *
 * ONE LAYER AT A TIME, when the stage asks for one. Window declares twenty
 * rows and the first cut drew all twenty in a column, which is a column
 * nobody reads (Jake, s105). The stage's layer list names a part of the
 * component's anatomy and passes it down here; these blocks then draw that
 * part's rows and no others. Nothing is hidden that was not already three
 * scrolls away, and the tier has not moved: TITLEBAR is still window's
 * titlebar everywhere on the desktop, not this window's.
 *
 * A row is a name, its current binding, and a list of what it may become
 * (styleCandidates.ts is the law; blocksFor is the grouping). Choosing writes
 * a REFERENCE on <html> and every instance on the desktop moves at once
 * (stylerTune.ts). Choosing the binding a row already has puts it back.
 *
 * NO AA VERDICT ON THESE ROWS, and that is not an omission. A semantic nudge
 * writes a colour and can be judged against the ink beside it there and then.
 * A component rebind names a ROLE — --button-bg becomes "Surface" — and what
 * Surface grades at against Content is a question about the semantic tier,
 * asked per theme, answered by the token doctor in CI. Grading it here would
 * be inventing a pair the row does not have. The swatch shows the colour that
 * lands, which is the honest half.
 *
 * THE KEYS. Arrow up and down step the ramp on a focused row, one token at a
 * time; Shift takes it to the ends; X swaps a fill with its stroke; Cmd+Z and
 * Cmd+Shift+Z walk the pending set backwards and forwards (the history lives
 * in stylerTune, so one stack covers this panel, the stage and the bench);
 * Cmd+S opens the pull request. They are a registry rather than a ladder
 * (lib/hotkeys.ts) — the first shared keyboard infrastructure on the desktop,
 * sitting on `window` in the capture phase, above INSPECT's Escape ladder and
 * deliberately not owning Escape. Escape belongs to the ladder, and the open
 * candidate list is a rung on it already: this panel holds its open row in
 * the same lifted `openVar` state the TOKENS palette uses, so closing it came
 * free. */

/** The lifted key for an open candidate list, kept apart from the TOKENS
    palette's `property|--var` shape so the two can never collide. */
const openKeyFor = (role: string) => `styler|${role}`

/** THE LOCK, on the three rows that have no ramp.
 *
 * It was the word LOCKED in a chip, which read as one more binding in a
 * column of bindings: --window-ctrl-size said LOCKED where the row above it
 * said Surface, and the eye had to read the word to learn that one of them is
 * not an offer. A padlock says it at a glance and says it in a shape no
 * binding can be mistaken for.
 *
 * The house's small-chrome recipe, the same one InspectorPanel's LinkOutGlyph
 * and MenuBar's glyphs use: a 32-unit grid, round caps and joins, no fill and
 * currentColor, so it takes whatever ink the chip around it is printed in. 12
 * pixels rather than an em box, because the chip draws at the control step and
 * an em glyph there works out under 10px, where a 3px stroke stops reading as
 * a shape. Two shapes only — a shackle and a body — and no keyhole: a third
 * mark at this size is a smudge.
 *
 * aria-hidden, and the chip around it carries the name (see the row below).
 * Module scope so it is one component rather than a new one every render. */
function LockGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="12"
      height="12"
      className={styles.stylerChipIcon}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 14V9a6 6 0 0 1 12 0v5" />
      <rect x="6" y="14" width="20" height="13" />
    </svg>
  )
}

/** The candidate a row is bound to right now, pending edits on top of the
    token file. Null when the file wrote a literal (OFF-GRID) — there is a
    value on screen and no token that names it. */
function boundCandidate(row: StylerRow): StyleCandidate | null {
  const token = heldToken(row.role) ?? row.ref
  if (!token) return null
  return candidatesFor(row.role).find((c) => c.token === token) ?? null
}

export function StylerBlocks({
  componentId,
  layer,
  openVar,
  setOpenVar,
  onChange,
  onSave,
  bare,
}: {
  /** the `data-component` of the root the pick sits inside */
  componentId: string
  /** one layer of the component's anatomy, or every row when it is absent.
      The stage always names one (Jake, s105: evaluate at the layer, not at
      twenty rows); the flat panel is what the inspector used to draw. */
  layer?: string | null
  openVar: string | null
  setOpenVar: (v: string | null) => void
  /** re-read the pick and re-render the panel — the same after() SAVE uses */
  onChange: () => void
  /** what the SAVE button does, for Cmd+S to do the same thing */
  onSave: () => void
  /** blocks only. The stage's dock names itself in its own head and carries
      the count and the reset in its send bar, so this drops the section bar
      and the footer rather than saying either thing twice. */
  bare?: boolean
}) {
  const skin = useSettings((s) => s.skin)
  const blocks = blocksFor(componentId, layer)
  const held = count()

  const choose = (row: StylerRow, candidate: StyleCandidate) => {
    // picking the binding a row already has is how you put it back: the
    // palette needs no separate revert row, and the gesture is reversible
    // with the same click that made it
    if (boundCandidate(row)?.token === candidate.token) resetRole(row.role)
    else rebind(row.role, candidate)
    onChange()
  }

  /* ---- the keys ----
     Registered once and read through a ref, the way the shell's own
     listeners are: re-binding four handlers on every render would drop the
     scope for a frame every time a row changed. */
  const act = useRef({ choose, onSave, onChange, componentId })
  act.current = { choose, onSave, onChange, componentId }

  useEffect(() => {
    /** the row under the caret, if the caret is on one */
    const focusedRole = (): string | null => {
      const el = document.activeElement as HTMLElement | null
      return el?.closest<HTMLElement>('[data-styler-row]')?.dataset.stylerRow ?? null
    }

    /** Is the caret in something that takes typing? A bare letter must never
        be a command there — X belongs to the panel, and it also belongs in
        the middle of the word somebody is putting into the EDIT KEY field. */
    const typing = (): boolean => {
      const el = document.activeElement as HTMLElement | null
      if (!el) return false
      if (el.isContentEditable) return true
      return /^(input|textarea|select)$/i.test(el.tagName)
    }

    /* The whole component, not the drawn layer. A row can only have the
       caret if it is on screen, so the layer has already done the narrowing
       and asking for it again would only give the lookup a way to disagree
       with what the visitor is pointing at. */
    const rowOf = (role: string): StylerRow | null => {
      for (const group of blocksFor(act.current.componentId)) {
        const row = group.rows.find((r) => r.role === role)
        if (row) return row
      }
      return null
    }

    /** step the ramp by `by`, or to an end when `end` is set */
    const step = (by: number, end: boolean) => {
      const role = focusedRole()
      if (!role) return
      const row = rowOf(role)
      if (!row || row.locked) return
      const ramp = candidatesFor(row.role)
      if (ramp.length === 0) return
      const at = ramp.findIndex((c) => c.token === boundCandidate(row)?.token)
      const to = end
        ? by < 0
          ? 0
          : ramp.length - 1
        : Math.min(ramp.length - 1, Math.max(0, (at < 0 ? 0 : at) + by))
      act.current.choose(row, ramp[to])
    }

    /* X, the way Figma means it: the fill's binding goes to the stroke and
       the stroke's to the fill. The focused row's own pair, or the
       component's first one when the caret is on a row that is in none. */
    const pairNow = () => {
      const role = focusedRole()
      if (!role || typing()) return null
      return fillStrokePair(act.current.componentId, role)
    }

    /* Both halves must name a token — a literal has nothing to hand over —
       and both are colours by construction, so one ramp resolves both. */
    const swap = () => {
      const pair = pairNow()
      if (!pair) return
      const [fill, stroke] = pair
      const fillNow = boundCandidate(fill)
      const strokeNow = boundCandidate(stroke)
      if (!fillNow || !strokeNow || fillNow.token === strokeNow.token) return
      const colors = CANDIDATES_BY_FAMILY.color
      const toFill = colors.find((c) => c.token === strokeNow.token)
      const toStroke = colors.find((c) => c.token === fillNow.token)
      if (!toFill || !toStroke) return
      rebind(fill.role, toFill)
      rebind(stroke.role, toStroke)
      act.current.onChange()
    }

    /* Every binding but Cmd+S carries a guard, and the guards are the whole
       reason the registry has them. The arrows belong to the LAYERS tree
       when the caret is over there; a key claimed and then found to have
       nothing to do would already have been swallowed by the time the
       handler shrugged, and the tree would stop walking. So a binding that
       cannot act does not match, and the key falls through untouched. */
    const onRow = () => !!focusedRole()

    /* UNDO, on the key every other tool on a designer's machine uses for it.
       Guarded on there being something to undo rather than shrugging inside
       the handler: an empty stack should hand ⌘Z back to the browser, which
       is what the visitor means by it in a text field on the page. The
       history is stylerTune's — one stack for the panel, the stage and the
       bench, because they are all writing the same pending set. */
    const stepBack = (back: boolean) => {
      if (!(back ? undo() : redo())) return
      act.current.onChange()
    }

    return registerHotkeys('styler', [
      { key: 'ArrowUp', when: onRow, run: () => step(-1, false) },
      { key: 'ArrowDown', when: onRow, run: () => step(1, false) },
      { key: 'ArrowUp', shift: true, when: onRow, run: () => step(-1, true) },
      { key: 'ArrowDown', shift: true, when: onRow, run: () => step(1, true) },
      { key: 'x', when: () => !!pairNow(), run: swap },
      { key: 'z', meta: true, when: canUndo, run: () => stepBack(true) },
      { key: 'z', meta: true, shift: true, when: canRedo, run: () => stepBack(false) },
      // the browser's save dialog is worth taking while the tool is up: the
      // thing on screen that can be saved is this panel's pending set
      { key: 's', meta: true, run: () => act.current.onSave() },
    ])
    // everything the handlers need is read through the ref, so the scope
    // arms once for the life of the panel and never blinks out mid-render
  }, [])

  return (
    <section className={styles.styler}>
      {!bare && (
        <div className={styles.bar}>
          <h3 className={styles.head}>
            <CopyText k="styler.section" />
          </h3>
          <span className={styles.roleChip}>{componentId}</span>
          <InfoTip k="styler.note" />
        </div>
      )}

      {blocks.map(({ block, rows }) => (
        <div key={block}>
          <div className={styles.bar} data-styler-block="">
            <h4 className={styles.head}>
              <CopyText k={`styler.block.${block}`} />
            </h4>
          </div>
          <div className={styles.sectionBody}>
            <ul className={styles.vars}>
              {rows.map((row) => {
                const bound = boundCandidate(row)
                const open = openVar === openKeyFor(row.role)
                const pending = isRebound(row.role)
                const ramp = candidatesFor(row.role)
                const swatch = row.family === 'color'
                return (
                  <li
                    key={row.role}
                    className={styles.var}
                    /* the row's name, on the row itself: the keys read it
                       off whatever inside it has the caret, so an open
                       candidate list steps the same ramp its row does */
                    data-styler-row={row.role}
                    data-held={pending || undefined}
                  >
                    <span className={styles.varName} title={`--${row.role}`}>
                      {row.label}
                    </span>
                    {swatch && (
                      <span
                        className={styles.swatch}
                        /* the row's own property, so the chip is what the
                           desktop is painting — pending rebind included */
                        style={{ background: `var(--${row.role})` }}
                        aria-hidden="true"
                      />
                    )}
                    {row.locked ? (
                      <>
                        {/* the chip is the label: role="img" with a name
                            keeps LOCKED in the accessibility tree and off
                            the screen, so the column reads as bindings and
                            a screen reader still hears which rows are not
                            one. Same copy key the word used. */}
                        <span
                          className={styles.tier}
                          data-tier="locked"
                          role="img"
                          aria-label={t('styler.locked', skin)}
                        >
                          <LockGlyph />
                        </span>
                        {/* readValue reads computed CSS, which the server
                            does not have: it renders the dash and the client
                            renders the pixel value. That is the span's job,
                            not a mismatch to repair, so hydration is told
                            so — the stage opens straight from ?c= on the
                            server (s108) and without this every locked or
                            off-grid row in the first layer tripped the
                            overlay. */}
                        <span className={styles.value} suppressHydrationWarning>
                          {readValue(`--${row.role}`) || '—'}
                        </span>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={styles.bind}
                        data-offgrid={!bound || undefined}
                        aria-expanded={open}
                        aria-label={`${t('styler.rebind', skin)} --${row.role}`}
                        onClick={() => setOpenVar(open ? null : openKeyFor(row.role))}
                      >
                        {bound ? (
                          bound.name
                        ) : (
                          <>
                            <CopyText k="styler.offgrid" />{' '}
                            <span className={styles.value} suppressHydrationWarning>
                              {readValue(`--${row.role}`)}
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    {open && (
                      <div
                        className={styles.palette}
                        role="group"
                        aria-label={`${t('styler.rebind', skin)} --${row.role}`}
                      >
                        {ramp.map((candidate) => (
                          <button
                            key={candidate.token}
                            type="button"
                            className={styles.candidate}
                            /* the binding it has now, marked — and the click
                               that lands on it puts a pending row back */
                            aria-current={bound?.token === candidate.token || undefined}
                            onClick={() => choose(row, candidate)}
                          >
                            {swatch && (
                              <span
                                className={styles.swatch}
                                style={{ background: `var(${candidate.varName})` }}
                                aria-hidden="true"
                              />
                            )}
                            <span className={styles.candidateName}>{candidate.name}</span>
                            {!swatch && (
                              <span className={styles.candidateGrade}>
                                {readValue(candidate.varName) || '—'}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ))}

      {held > 0 && !bare && (
        <div className={styles.sectionBody}>
          <p className={styles.note}>
            <CopyText k="styler.pending" /> {held}
          </p>
          <button
            type="button"
            className={styles.resetAll}
            onClick={() => {
              resetAll()
              setOpenVar(null)
              onChange()
            }}
          >
            <CopyText k="styler.resetall" />
          </button>
        </div>
      )}
    </section>
  )
}
