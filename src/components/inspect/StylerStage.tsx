'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { useSettings, type Skin } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { registerHotkeys } from '@/lib/hotkeys'
import { themeFor } from '@/lib/tokenEdit'
import { layersFor, type StylerLayer } from '@/lib/stylerBlocks'
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
 * 244px layer panel on the left, a 304px paper dock on the right, the bench
 * between them — because a second visual language for the second half of one
 * tool would be a worse tool. That is INSPECT's own arrangement, panel for
 * panel and width for width, and it is Figma's: layers left, canvas centre,
 * properties right. Jake asked for it in those words ("put the layers in a
 * panel the left like figma so its closer to what im used to"). The inspect
 * frame is display:none'd underneath it (inspectShell.module.css reads the
 * body attribute this sets), so nothing of it is left in the tab order behind
 * an opaque cover.
 *
 * ONE THING ON THE BENCH (Jake, s105). The first cut drew everything at once:
 * every variant side by side, both other token sets as small tiles under
 * them, and all twenty of window's rows in one flat list on the right. Three
 * choices are now three controls. Two tab rows pick what stands on the bench,
 * one axis each — the VARIANT (active, resting, system, expressive) and the
 * TOKEN SET (classic, classic dark, medieval) — and the left panel's layer
 * list picks which part of the component the blocks are about. Nothing new is
 * being shown; the same three lists stopped being drawn simultaneously.
 *
 * THE SKINS, and the CSS finding behind them. The bench is a nested
 * `data-skin` wrapper, the way the desktop has always drawn a live skin
 * preview, and that is exactly where a component-tier preview would have
 * silently failed: tokens.generated.css declares every component property
 * inside `:root, [data-skin='classic']`, so a nested classic wrapper
 * re-declares all of them and an inline write on <html> never reaches inside.
 * The bench registers itself with stylerTune, which mirrors every rebind onto
 * it, so a rebind previewed on the medieval tab lands on the medieval bench
 * (lib/stylerTune.ts carries the finding in full). It registers on every tab,
 * classic included, because a rule that only applies to two of three sets is
 * a rule somebody removes.
 *
 * One honest limit, stated rather than hidden: a nested wrapper re-scopes
 * TOKENS, not JavaScript. MenuBar reads the skin from the settings store to
 * decide which controls it draws, so the medieval tab shows medieval's
 * colours and classic's control set. SkinSwitch's live previews have always
 * had the same edge.
 *
 * THE WIDE REVIEW (Jake, s107), which is three notes about room. He ran the
 * first live SAVE from here on a wide screen and everything he flagged was
 * something being squeezed: the send bar wrapped its own count onto two lines
 * and pushed the theme chip off the dock's edge, a row called TITLEBAR ACTIVE
 * BORDER COLOR dropped its binding to the next line, and the whole dock read
 * small. So the commit bar came out of the dock and became a band across the
 * bottom of the canvas ("put the commit buttons at the bottom center at the
 * bottom of the viewport fixed below the component"), both panels got a grip
 * on their inner edge, the dock opens 80px wider than the inspector's, and
 * everything in the room that was drawn at the micro step is drawn at the
 * control step instead. Nothing was added to the room; it was given room.
 */

/* Constant ids, never useId (the tree reshapes at the SSR handover). These
   are the STAGE's, deliberately different from the inspector's, because both
   docks are in the document at once even while only one is on screen. */
const KEY_ID = 'styler-stage-key'
const NOTE_ID = 'styler-stage-note'
const BENCH_ID = 'styler-stage-bench'
const LAYERS_ID = 'styler-stage-layers-panel'
const DOCK_ID = 'styler-stage-dock'

/** How far either wall may travel, and where it stands when the room opens.
 *
 *  LEFT is INSPECT's own panel width, and it stays that: two left panels
 *  doing the same job, one number (globals.css declares it, stylerStage
 *  .module.css reads it). The stage never writes this one until somebody
 *  drags it, so the default keeps coming from --inspect-left.
 *
 *  RIGHT is 80px wider than the inspector's 304px, and that is the whole
 *  point of the change: window's longest row label is TITLEBAR ACTIVE BORDER
 *  COLOR, which at the mono step needs about 190px, and the swatch, the gaps
 *  and a binding as long as "Content Muted" want another 110. 304 leaves 280
 *  of content and the row folds; 384 leaves 360 and it does not. The stops
 *  are the two panels that already exist either side of it — no narrower than
 *  the inspector's dock, no wider than the widest thing the blocks can use. */
const LEFT = { min: 180, def: 244, max: 420 }
const RIGHT = { min: 304, def: 384, max: 560 }

/** one arrow press, in pixels */
const STEP = 16

/** A tab's element id, so the bench can name itself after the two tabs that
    chose it. Derived from ids the specs already carry, which keeps it
    identical on the server and on the client. */
const tabId = (axis: 'variant' | 'set', id: string) => `styler-stage-tab-${axis}-${id}`

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

/** The bench a spec asked for, or none.
 *
 * Exported because the LIBRARY draws the same five samples at thumbnail size
 * (StylerLibrary.tsx) and a second bench with the same three cases in it
 * would be two places to fix the day a component changes what it needs to
 * stand on. */
export function Bench({ kind, children }: { kind: StageSpec['bench']; children: ReactNode }) {
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

/** One axis of the bench, as tabs.
 *
 * The WAI-ARIA tab pattern with automatic activation: arrow keys move the
 * caret and the choice together, because there is nothing to confirm — the
 * bench redraws either way, and asking for a second key to commit a preview
 * would be a step that exists only to exist. One tabindex in the row, so Tab
 * crosses the whole axis in one press and lands on the next thing. */
function TabRow({
  axis,
  name,
  tabs,
  value,
  onPick,
}: {
  axis: 'variant' | 'set'
  /** copy key for the axis name beside the row */
  name: string
  tabs: ReadonlyArray<{ id: string; label: string }>
  value: string
  onPick: (id: string) => void
}) {
  const skin = useSettings((s) => s.skin)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = tabs.findIndex((tab) => tab.id === value)
    if (at < 0) return
    const go = (to: number) => {
      e.preventDefault()
      const next = tabs[(to + tabs.length) % tabs.length]
      onPick(next.id)
      document.getElementById(tabId(axis, next.id))?.focus()
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(at + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(at - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(tabs.length - 1)
  }

  return (
    <div className={styles.axis}>
      <CopyText k={name} className={styles.axisName} />
      <div role="tablist" aria-label={t(name, skin)} className={styles.tabs} onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const on = tab.id === value
          return (
            <button
              key={tab.id}
              id={tabId(axis, tab.id)}
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={on}
              aria-controls={BENCH_ID}
              tabIndex={on ? 0 : -1}
              onClick={() => onPick(tab.id)}
            >
              <CopyText k={tab.label} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** THE GRIP — a wall you can move.
 *
 * Jake, on the wide review: "make the side panels resizable." So both panels
 * carry a strip on their inner edge, and it is a real separator rather than a
 * decorated border: role="separator" with a tabindex is the splitter pattern,
 * so it announces the width it is at and the two ends it can reach, arrows
 * step it, Home and End take it to its stops, and a double-click puts it back
 * where the room opened. A drag nobody can do with a keyboard is a drag half
 * the visitors do not have.
 *
 * Pointer capture, not window listeners: a fast drag leaves this 8px strip
 * immediately and the moves have to keep coming, and the release has to land
 * here even when the pointer is over the bench by then. The browser does both
 * once the strip owns the pointer.
 *
 * It writes a WIDTH, which every other file in this room would be wrong to
 * do. A drag is not an animation — nothing is tweening, there is no frame
 * budget being spent on a layout that repeats — and a wall that moved on a
 * transform would be a wall the panel beside it does not know about.
 *
 * The size is session-local and deliberately not stored. A panel width is
 * something you set for the row you are looking at, not a preference the
 * site should be holding on your behalf. */
function Grip({
  side,
  panelId,
  label,
  width,
  min,
  max,
  onSize,
  onReset,
}: {
  side: 'left' | 'right'
  /** the panel this edge sizes */
  panelId: string
  /** copy key for the separator's name */
  label: string
  width: number
  min: number
  max: number
  onSize: (px: number) => void
  onReset: () => void
}) {
  const skin = useSettings((s) => s.skin)
  const ref = useRef<HTMLDivElement>(null)
  /** the pointer that owns this grip, and where the drag started from */
  const drag = useRef<{ id: number; from: number; at: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const clamp = (px: number) => Math.max(min, Math.min(max, Math.round(px)))
  /* the edge follows the pointer, so on the right dock a move to the right
     makes the dock NARROWER. One sign, read by both the pointer and the keys,
     and neither of them has to think about which wall it is on. */
  const grow = (by: number) => (side === 'left' ? by : -by)

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    // no text selection dragged along behind the wall
    e.preventDefault()
    drag.current = { id: e.pointerId, from: width, at: e.clientX }
    setDragging(true)
    ref.current?.setPointerCapture(e.pointerId)
    // the arrows should carry on from where the drag stopped
    ref.current?.focus({ preventScroll: true })
  }

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const at = drag.current
    if (!at || at.id !== e.pointerId) return
    onSize(clamp(at.from + grow(e.clientX - at.at)))
  }

  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    setDragging(false)
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const by = e.key === 'ArrowRight' ? STEP : e.key === 'ArrowLeft' ? -STEP : 0
    if (by !== 0) {
      e.preventDefault()
      onSize(clamp(width + grow(by)))
      return
    }
    if (e.key === 'Home') {
      e.preventDefault()
      onSize(min)
    } else if (e.key === 'End') {
      e.preventDefault()
      onSize(max)
    }
  }

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-controls={panelId}
      aria-label={t(label, skin)}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      data-drag={dragging || undefined}
      className={`${styles.grip} ${side === 'left' ? styles.gripLeft : styles.gripRight}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
    />
  )
}

/** THE LEFT PANEL — the component's anatomy, two levels deep.
 *
 * INSPECT's LayersPanel is the precedent, and after Jake's second look it is
 * the precedent down to the wall it hangs on: same side, same width, same
 * head, same tree. Roving tabindex, arrows to walk, the picked row on the
 * accent fill. What it does NOT copy is that panel's Enter, which selects.
 * The s97 hotkey grammar reserves Enter for drilling into children and
 * Shift+Enter for the parent, so selection follows the caret here and Enter
 * means what the grammar says it means. Tab and Shift+Tab step siblings.
 *
 * Those four go through the shared registry rather than this element's own
 * onKeyDown, which is the whole reason the registry exists: it sits on
 * `window` in the capture phase and can take Tab before the browser moves the
 * focus. Every one of the four is guarded on the caret being INSIDE this
 * tree, and the sibling keys are guarded on there being a sibling that way —
 * so Tab off the last layer, and Shift+Tab off the first, fall through
 * untouched and the keyboard can always leave. A tree that ate Tab in both
 * directions would be a trap with a lid on it. */
function StageLayers({
  layers,
  value,
  onPick,
  grip,
}: {
  layers: StylerLayer[]
  value: string
  onPick: (id: string) => void
  /** the panel's own edge, hung inside it so it can sit on the border */
  grip: ReactNode
}) {
  const skin = useSettings((s) => s.skin)
  /** true when the caret should follow the choice — set by the keys, never
      by the pointer, because pulling focus on a click is a jump */
  const wantFocus = useRef(false)
  const treeRef = useRef<HTMLDivElement>(null)

  const select = (id: string, keyboard: boolean) => {
    wantFocus.current = keyboard
    onPick(id)
  }

  useEffect(() => {
    if (!wantFocus.current) return
    wantFocus.current = false
    treeRef.current
      ?.querySelector<HTMLElement>(`[data-layer-key="${CSS.escape(value)}"]`)
      ?.focus({ preventScroll: false })
  }, [value])

  /* The registry reads through a ref, the way every other scope on this
     desktop does: re-arming four bindings on each render would drop the
     scope for a frame every time a layer changed. */
  const act = useRef({ layers, value, select })
  act.current = { layers, value, select }

  useEffect(() => {
    const inTree = (): boolean => {
      const el = document.activeElement as HTMLElement | null
      return !!el?.closest?.('[data-styler-layers]')
    }
    /** the parts under the root, and where the caret sits among them */
    const parts = () => act.current.layers.slice(1)
    const at = () => parts().findIndex((layer) => layer.id === act.current.value)
    const onRoot = () => act.current.value === act.current.layers[0]?.id

    return registerHotkeys('styler-stage-layers', [
      {
        key: 'Enter',
        when: () => inTree() && onRoot() && parts().length > 0,
        run: () => act.current.select(parts()[0].id, true),
      },
      {
        key: 'Enter',
        shift: true,
        when: () => inTree() && !onRoot(),
        run: () => act.current.select(act.current.layers[0].id, true),
      },
      {
        key: 'Tab',
        when: () => inTree() && at() >= 0 && at() < parts().length - 1,
        run: () => act.current.select(parts()[at() + 1].id, true),
      },
      {
        key: 'Tab',
        shift: true,
        when: () => inTree() && at() > 0,
        run: () => act.current.select(parts()[at() - 1].id, true),
      },
    ])
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = layers.findIndex((layer) => layer.id === value)
    if (at < 0) return
    const move = (to: number) => {
      e.preventDefault()
      select(layers[Math.max(0, Math.min(layers.length - 1, to))].id, true)
    }
    switch (e.key) {
      case 'ArrowDown':
        move(at + 1)
        return
      case 'ArrowUp':
        move(at - 1)
        return
      case 'ArrowRight':
        if (at === 0) move(1)
        return
      case 'ArrowLeft':
        if (at > 0) move(0)
        return
      case 'Home':
        move(0)
        return
      case 'End':
        move(layers.length - 1)
        return
      default:
    }
  }

  return (
    <aside className={styles.layers} id={LAYERS_ID}>
      {/* the same head the right dock wears, and the same one INSPECT's own
          left panel wears: three panels, one heading treatment */}
      <h2 className={shell.panelHead}>
        <CopyText k="styler.layers" />
      </h2>
      <div className={`${shell.treeBody} ${styles.layerBody}`}>
        <div
          ref={treeRef}
          role="tree"
          data-styler-layers=""
          aria-label={t('styler.layers', skin)}
          className={shell.tree}
          onKeyDown={onKeyDown}
        >
          {layers.map((layer, n) => {
            const root = n === 0
            const on = layer.id === value
            return (
              <div
                key={layer.id}
                data-layer-key={layer.id}
                role="treeitem"
                tabIndex={on ? 0 : -1}
                aria-level={root ? 1 : 2}
                aria-posinset={root ? 1 : n}
                aria-setsize={root ? 1 : layers.length - 1}
                aria-selected={on}
                aria-expanded={root && layers.length > 1 ? true : undefined}
                className={shell.row}
                data-picked={on || undefined}
                style={{
                  paddingLeft: `calc(var(--spacing-component-xs) + ${root ? 0 : 12}px)`,
                }}
                onClick={() => select(layer.id, false)}
              >
                <span className={shell.chevron} aria-hidden="true" data-empty={!root || undefined}>
                  {root && layers.length > 1 ? '▾' : '·'}
                </span>
                <span className={shell.rowLabel}>{layer.label}</span>
                <span className={styles.layerCount}>{layer.rows.length}</span>
              </div>
            )
          })}
        </div>
      </div>
      {grip}
    </aside>
  )
}

export function StylerStage({
  componentId,
  copy,
  onClose,
  closeLabelKey = 'styler.close',
}: {
  componentId: string
  /** the copy engine, for the one thing the gate needs it for: arming */
  copy: ReturnType<typeof useCopyEditing>
  onClose: () => void
  /** What the door says, because the room now has two of them. In the OS the
      component came off the desktop and goes back on it; from the library it
      came off a shelf. Same button, same behaviour, and the only honest
      difference is where the exit lands, so it is one copy key rather than a
      second close path. */
  closeLabelKey?: string
}) {
  const skin = useSettings((s) => s.skin)
  const theme = useSettings((s) => s.theme)
  // stylerTune is module state, not a store — this is what re-reads it
  const [, bump] = useState(0)
  /** which row has its candidate list open. Local, not the shell's lifted
      state: the inspector's palette and this one are never on screen
      together, and Escape here is the stage's own ladder. */
  const [openRow, setOpenRow] = useState<string | null>(null)
  /* The three tab choices, all held as "what was asked for" rather than as
     "what is showing". A null is the default and a stale id is a miss, and
     both resolve to the same fallback below, so the stage can change
     component without an effect racing the render to clean up after it. */
  const [wantVariant, setWantVariant] = useState<string | null>(null)
  const [wantSet, setWantSet] = useState<string | null>(null)
  const [wantLayer, setWantLayer] = useState<string | null>(null)
  /* The two walls, held the same way the tabs are: null is "wherever the room
     opens it", a number is somebody having moved it. Null on the left is what
     keeps --inspect-left the default rather than a second copy of 244. */
  const [leftWidth, setLeftWidth] = useState<number | null>(null)
  const [rightWidth, setRightWidth] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const benchRef = useRef<HTMLDivElement>(null)

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

  /* The bench takes every rebind the document root takes. Registered once,
     for the life of the room: the wrapper element outlives every tab change
     and only its data-skin moves, so there is nothing here to re-run. */
  useEffect(() => {
    const el = benchRef.current
    if (!el) return
    addRoot(el)
    return () => removeRoot(el)
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

  /* What is actually on the bench. The set opens on the one the desktop is
     already wearing, so the room starts by showing what the visitor was just
     looking at rather than an arbitrary first tab. */
  const set =
    SKIN_SETS.find((s) => s.id === wantSet) ??
    SKIN_SETS.find((s) => s.id === active) ??
    SKIN_SETS[0]
  // the sample is built in the CHOSEN set's skin, so its copy speaks that
  // skin's voice on the bench that is about to draw it
  const variants = spec.variants(set.skin)
  const variant = variants.find((v) => v.id === wantVariant) ?? variants[0]
  const layers = layersFor(componentId)
  const layer = layers.find((l) => l.id === wantLayer) ?? layers[0]

  /* The two walls, written as custom properties on the room itself. The
     stylesheet declares both defaults on .stage and everything that has to
     line up with a wall reads them from there — the panels, and the commit
     band spanning the gap between them — so a dragged edge moves all three
     without a second number anywhere. Only a MOVED wall is written here; an
     untouched one leaves the sheet's default standing. */
  const walls = {
    ...(leftWidth !== null ? { '--styler-left': `${leftWidth}px` } : null),
    ...(rightWidth !== null ? { '--styler-right': `${rightWidth}px` } : null),
  } as CSSProperties

  return (
    <div
      className={styles.stage}
      data-inspect-self=""
      /* the one hook the shared dock stylesheet needs to know it is drawing
         inside this room and not inside the inspector (inspectShell.module
         .css, "THE STAGE READS ONE STEP UP") */
      data-styler-stage=""
      style={walls}
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
          aria-label={t(closeLabelKey, skin)}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <div className={styles.body}>
        <StageLayers
          layers={layers}
          value={layer.id}
          onPick={setWantLayer}
          grip={
            <Grip
              side="left"
              panelId={LAYERS_ID}
              label="styler.grip.layers"
              width={leftWidth ?? LEFT.def}
              min={LEFT.min}
              max={LEFT.max}
              onSize={setLeftWidth}
              onReset={() => setLeftWidth(null)}
            />
          }
        />

        <div className={styles.canvas}>
          {/* two axes, two rows, and the component names neither of them:
              the variants come from the spec and the sets from the commit
              route's own list */}
          <div className={styles.axes}>
            <TabRow
              axis="variant"
              name="styler.axis.variant"
              tabs={variants}
              value={variant?.id ?? ''}
              onPick={setWantVariant}
            />
            <TabRow
              axis="set"
              name="styler.axis.set"
              tabs={SKIN_SETS}
              value={set.id}
              onPick={setWantSet}
            />
          </div>

          <div
            id={BENCH_ID}
            ref={benchRef}
            className={styles.mount}
            role="tabpanel"
            /* named by both tabs that chose it, so a screen reader reads
               "ACTIVE CLASSIC DARK" rather than "region" */
            aria-labelledby={
              variant ? `${tabId('variant', variant.id)} ${tabId('set', set.id)}` : undefined
            }
            data-skin={set.skin}
            data-theme={set.theme}
          >
            <Bench kind={spec.bench}>{variant?.node}</Bench>
          </div>
        </div>

        <aside className={styles.dock} id={DOCK_ID}>
          <Grip
            side="right"
            panelId={DOCK_ID}
            label="styler.grip.dock"
            width={rightWidth ?? RIGHT.def}
            min={RIGHT.min}
            max={RIGHT.max}
            onSize={setRightWidth}
            onReset={() => setRightWidth(null)}
          />
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
              layer={layer.id}
              openVar={openRow}
              setOpenVar={setOpenRow}
              onChange={after}
              onSave={saver.requestSave}
              bare
            />
          </div>
        </aside>
      </div>

      {/* THE COMMIT BAND. It stood in the dock's foot until Jake looked at it
          on a wide screen: three things that each want a line of their own,
          in a 304px column, next to a canvas with the whole middle of the
          screen going spare. "Put the commit buttons at the bottom center at
          the bottom of the viewport fixed below the component now that we
          have the whole canvas with the localized components." So it spans
          the gap between the two walls and sits on the floor, under the thing
          it is about to propose a change to.

          Nothing about the flow moved with it. It is still the same count,
          the same revert, the same SAVE with its theme chip, and the same key
          gate underneath (useTokenSave) — the gate and the status line are
          the hook's own markup and they draw here now.

          Last in the document, which is also where the keyboard should reach
          it: layers, bench, blocks, then the button that sends them. */}
      <div className={styles.commit}>
        <div className={styles.commitBar}>
          <div className={styles.commitRow}>
            <span className={shell.previewText}>
              <CopyText k={held > 0 ? 'styler.pending' : 'styler.clean'} />
              {held > 0 ? ` ${held}` : ''}
            </span>
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
          </div>

          {saver.gate?.for === 'token' && saver.keyGate()}
          {saver.saveStatus()}
        </div>
      </div>
    </div>
  )
}
