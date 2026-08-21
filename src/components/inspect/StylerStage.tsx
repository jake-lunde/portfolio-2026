'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSettings, type Skin } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { registerHotkeys } from '@/lib/hotkeys'
import { themeFor } from '@/lib/tokenEdit'
import { addRoot, count, removeRoot, resetAll } from '@/lib/stylerTune'
import type { useCopyEditing } from './useCopyEditing'
import { InfoTip } from './InfoTip'
import { StylerBlocks } from './StylerBlocks'
import { specFor, type StageSpec } from './stageSpecs'
import { useTokenSave } from './useTokenSave'
import shell from './inspectShell.module.css'
import styles from './stylerStage.module.css'

/* THE STAGE — one component, on its own, with the knobs beside it.
 *
 * Jake's two notes on the first cut of STYLER, both of them the same note
 * from different ends: styling is not inspecting, so the tool should not be
 * showing TOKENS and CONTRAST and MOTION while you are choosing a radius; and
 * the component has to come away from the site or you cannot see what you
 * just changed. The blocks lived in the inspector for one review and they
 * live here now. The inspector kept the door (OPEN COMPONENT) and nothing
 * else.
 *
 * It is a room built out of the tool's own parts — crown across the top, a
 * 304px paper dock on the right, the bench between them — because a second
 * visual language for the second half of one tool would be a worse tool. The
 * inspect frame is display:none'd underneath it (inspectShell.module.css
 * reads the body attribute this sets), so nothing of it is left in the tab
 * order behind an opaque cover.
 *
 * THE SKINS ROW, and the CSS finding behind it. The bench shows the active
 * skin big, and underneath it the other two token sets side by side, each in
 * a nested `data-skin` wrapper — the way the desktop has always drawn a live
 * skin preview. That is exactly where a component-tier preview would have
 * silently failed: tokens.generated.css declares every component property
 * inside `:root, [data-skin='classic']`, so a nested classic wrapper
 * re-declares all of them and an inline write on <html> never reaches inside.
 * Each tile registers itself with stylerTune, which mirrors every rebind onto
 * it (lib/stylerTune.ts carries the finding in full).
 *
 * One honest limit, stated rather than hidden: a nested wrapper re-scopes
 * TOKENS, not JavaScript. MenuBar reads the skin from the settings store to
 * decide which controls it draws, so the medieval tile shows medieval's
 * colours and classic's control set. SkinSwitch's live previews have always
 * had the same edge; the tile is a token preview and says so by being small.
 */

/* Constant ids, never useId (the tree reshapes at the SSR handover). These
   two are the STAGE's, deliberately different from the inspector's, because
   both docks are in the document at once even while only one is on screen. */
const KEY_ID = 'styler-stage-key'
const NOTE_ID = 'styler-stage-note'

/** The three token sets a component can be seen in — the same three
    /api/token-commit will commit to (tokenEdit's TOKEN_THEMES), which is why
    the row is these three and not "every skin": underwater has no token file
    yet, so there is nothing to show. */
const SKIN_SETS: ReadonlyArray<{
  id: string
  skin: Skin
  theme: 'light' | 'dark'
  label: string
}> = [
  { id: 'classic-light', skin: 'classic', theme: 'light', label: 'styler.skin.classic' },
  { id: 'classic-dark', skin: 'classic', theme: 'dark', label: 'styler.skin.classicDark' },
  { id: 'medieval', skin: 'medieval', theme: 'light', label: 'styler.skin.medieval' },
]

/** A sample under its label. */
function Variant({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.variant}>
      {children}
      <CopyText k={label} className={styles.label} />
    </div>
  )
}

/** The bench a spec asked for, or none. */
function Bench({ kind, children }: { kind: StageSpec['bench']; children: ReactNode }) {
  if (kind === 'plain') return <>{children}</>
  const size = kind === 'chrome' ? styles.benchChrome : styles.benchDesk
  /* the marker is what lets shell.module.css make its one exception: the
     menubar hides itself while the tool is up, and the sample on the bench
     is the same bar */
  return (
    <div className={`${styles.bench} ${size}`} data-styler-bench="">
      {children}
    </div>
  )
}

/** One skin's take on the component, in its own token scope — and registered
    with stylerTune so the rebinds reach inside it. */
function SkinTile({
  set,
  spec,
}: {
  set: (typeof SKIN_SETS)[number]
  spec: StageSpec
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    addRoot(el)
    return () => removeRoot(el)
  }, [])

  const first = spec.variants(set.skin)[0]
  return (
    <div ref={ref} className={styles.tile} data-skin={set.skin} data-theme={set.theme}>
      <Bench kind={spec.bench}>{first?.node}</Bench>
      <CopyText k={set.label} className={styles.label} />
    </div>
  )
}

export function StylerStage({
  componentId,
  copy,
  onClose,
}: {
  componentId: string
  /** the copy engine, for the one thing the gate needs it for: arming */
  copy: ReturnType<typeof useCopyEditing>
  onClose: () => void
}) {
  const skin = useSettings((s) => s.skin)
  const theme = useSettings((s) => s.theme)
  // stylerTune is module state, not a store — this is what re-reads it
  const [, bump] = useState(0)
  /** which row has its candidate list open. Local, not the shell's lifted
      state: the inspector's palette and this one are never on screen
      together, and Escape here is the stage's own ladder. */
  const [openRow, setOpenRow] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const saver = useTokenSave({
    keyId: KEY_ID,
    noteId: NOTE_ID,
    authenticate: copy.authenticate,
  })

  const spec = specFor(componentId)
  const held = count()
  const active = themeFor(skin, theme)

  const after = () => {
    saver.setSave((s) => (s.k === 'done' || s.k === 'error' ? { k: 'idle' } : s))
    bump((n) => n + 1)
  }

  /* Focus lands on the way out, which is the honest place for it: the room
     just took the whole screen and the first thing a keyboard visitor needs
     is the door. It also has to run AFTER the sample's own mount effects —
     the window sample focuses itself when it is the active one — and a
     parent's effect runs after its children's, so this is already last. */
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  /* ESCAPE, and why it is here rather than in the shell's ladder. The
     registry sits on `window` in the capture phase and the ladder sits on
     `document`, so this runs first and stops the event — the ladder never
     sees it and never deselects the pick underneath. Two rungs, in the
     ladder's own order: an open candidate list closes first, then the room.
     Nothing about InspectShell changed to make this work. */
  const act = useRef({ onClose, openRow })
  act.current = { onClose, openRow }

  useEffect(
    () =>
      registerHotkeys('styler-stage', [
        {
          key: 'Escape',
          run: () => {
            if (act.current.openRow) setOpenRow(null)
            else act.current.onClose()
          },
        },
      ]),
    [],
  )

  if (!spec) return null

  const variants = spec.variants(skin)
  const others = SKIN_SETS.filter((set) => set.id !== active)

  return (
    <div
      className={styles.stage}
      data-inspect-self=""
      role="region"
      aria-label={t('styler.region', skin)}
    >
      <header className={styles.crown}>
        <span className={shell.crownTitle}>{t('styler.title', skin)}</span>
        <span className={styles.crownChip}>{componentId}</span>
        <button
          type="button"
          className={shell.crownBtn}
          ref={closeRef}
          onClick={onClose}
          aria-label={t('styler.close', skin)}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <div className={styles.body}>
        <div className={styles.canvas}>
          <div className={styles.spread}>
            {variants.map((variant) => (
              <Variant key={variant.id} label={variant.label}>
                <Bench kind={spec.bench}>{variant.node}</Bench>
              </Variant>
            ))}
          </div>

          {/* the other two token sets, small, underneath: the same rebind
              seen in the skins it is about to be committed for */}
          <div className={styles.skins}>
            {others.map((set) => (
              <SkinTile key={set.id} set={set} spec={spec} />
            ))}
          </div>
        </div>

        <aside className={styles.dock}>
          {/* the note glyph is a SIBLING of the heading, never inside it: a
              heading takes its accessible name from its contents, and the
              whole tip would be read out as part of the name (InfoTip.tsx) */}
          <div className={`${shell.panelHead} ${styles.dockHead}`}>
            <h2 className={styles.dockTitle}>
              <CopyText k="styler.section" />
            </h2>
            <InfoTip k="styler.note" />
          </div>

          <div className={styles.dockBody}>
            <StylerBlocks
              componentId={componentId}
              openVar={openRow}
              setOpenVar={setOpenRow}
              onChange={after}
              onSave={saver.requestSave}
              bare
            />
          </div>

          <div className={styles.send}>
            <div className={styles.sendTop}>
              <span className={shell.previewText}>
                <CopyText k={held > 0 ? 'styler.pending' : 'styler.clean'} />
                {held > 0 ? ` ${held}` : ''}
              </span>
              <span className={styles.sendActions}>
                {held > 0 && (
                  <button
                    type="button"
                    className={shell.resetAll}
                    onClick={() => {
                      resetAll()
                      setOpenRow(null)
                      after()
                    }}
                  >
                    <CopyText k="styler.resetall" />
                  </button>
                )}
                <button
                  type="button"
                  className={`${shell.resetAll} ${shell.save}`}
                  aria-disabled={saver.saveInert || undefined}
                  aria-describedby={saver.note ? NOTE_ID : undefined}
                  onClick={saver.requestSave}
                >
                  <CopyText k="inspect.save" />
                  {saver.target && (
                    <span className={shell.saveTarget}>{saver.target.toUpperCase()}</span>
                  )}
                </button>
              </span>
            </div>

            {saver.gate?.for === 'token' && saver.keyGate()}
            {saver.saveStatus()}
          </div>
        </aside>
      </div>
    </div>
  )
}
