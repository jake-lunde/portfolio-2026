'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { useSettings, type Skin } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { registerHotkeys } from '@/lib/hotkeys'
import { sfx } from '@/lib/sound'
import { themeFor } from '@/lib/tokenEdit'
import { flattenLayers, layersFor, type StylerLayer } from '@/lib/stylerBlocks'
import { addRoot, clearHistory, count, removeRoot, resetAll } from '@/lib/stylerTune'
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
 * choices are now three controls: which VARIANT stands on the bench, which
 * TOKEN SET it is wearing, and which part of it the blocks are about. Nothing
 * new is being shown; the same three lists stopped being drawn
 * simultaneously.
 *
 * THE MODIFIERS (Jake, s111): "make all of the modifiers be elements in the
 * styler panel on the right (desktop, mobile + default, hover, etc + classic,
 * medieval + variant active, resting)." They were scattered — VARIANT was a
 * tab row over the bench, TOKEN SET was a flyout in the crown — and two of
 * them did not exist at all. All four are one block now, at the head of the
 * right dock, one row per axis and every row the same segmented control:
 *
 * · VIEWPORT — DESKTOP or MOBILE, which sizes the bench rather than the
 *   screen. See THE MOBILE VIEW below.
 * · STATE — DEFAULT or HOVER, and only where the component's own tokens
 *   declare a hover (stageSpecs.tsx carries the list). The bench writes the
 *   state onto itself and the components' hover rules answer to it.
 * · TOKEN SET — the three files SAVE can commit to. Same three, same
 *   consequence, and it is still the settings store it writes; only the
 *   control moved.
 * · VARIANT — from the spec, as before.
 *
 * So the canvas holds the component and nothing else, and every question the
 * room asks is asked in the same column, in the same shape, next to the
 * answers those questions change. The crown keeps the title, the component's
 * name and the way out.
 *
 * WHY THE TOKEN SET IS NOT ITS OWN THING. It was a tab row under the bench
 * once, held in this component's own state, while SAVE committed to whatever
 * the DESKTOP was wearing (useTokenSave reads the settings store). So a
 * visitor could preview a rebind on the MEDIEVAL tab, press the button and
 * land a commit in classic-light. Two answers to one question, and the fix
 * was to stop asking it twice: the control writes the settings store, the
 * bench reads the store back, and the button that sends it reads the same
 * store. Picking a set restyles the desktop under the room, which is the
 * honest consequence of one source of truth rather than a side effect to
 * hide. Picking MEDIEVAL settles the appearance on light, so a visitor who
 * goes back to CLASSIC lands on classic light: the set you chose last is the
 * set you get. It spent one review as a flyout in the crown (s110) and came
 * down here with the rest of them, because a modifier in the chrome is a
 * modifier nobody counts.
 *
 * THE MOBILE VIEW (Jake, s111): "I feel like I'm not able to manipulate the
 * mobile view." He was right, and the reason was in the stylesheets rather
 * than in this room: every small-screen rule on the pilot components was a
 * `@media` query, and a media query asks the SCREEN. A 360px bench inside a
 * 1440px room is not a 360px screen, so the tool could show you every colour
 * a titlebar is made of and never the shape it takes on a phone. Those rules
 * are `@container viewport` now — the same 720px, measured against a named
 * box instead of the window. `body` declares that name on the real desktop
 * (globals.css) and the bench declares it again, closer in, so the nearest
 * container wins and MOBILE genuinely narrows the component. Nothing about
 * the site's own layout moved: body is the screen.
 *
 * DIRECT SELECT (Jake): "wire up the figma hotkeys, I'm very interested in
 * having direct select available to select individual elements instead of
 * having to drill down in the layers on the left." So the bench is a picking
 * surface with Figma's grammar on it. A plain click takes the whole component
 * — the root layer, which is what a click on a group means everywhere — and
 * ⌘+click or a double-click takes the deepest part under the pointer. The
 * parts are the same ones the left panel lists, because they are the same
 * fact: a `data-part` attribute on the component itself, named after the layer
 * the token names already declare (lib/stylerBlocks.ts). While ⌘ is down, the
 * part under the pointer draws a line around itself, so a click is never a
 * guess. The picked part keeps a heavier line, so the list and the bench are
 * always saying the same thing.
 *
 * ONE gesture is swallowed and the other is not. ⌘+click is the tool's, so it
 * is stopped in the capture phase before the sample sees it: a command-click
 * on the window sample's close control would otherwise close a window that
 * is not there. A plain click is the sample's — press the sample button and
 * it should press — so the root pick rides along in the capture phase and
 * lets the event carry on.
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
 * bottom of the canvas, both panels got a grip on their inner edge, the dock
 * opens 80px wider than the inspector's, and everything in the room that was
 * drawn at the micro step is drawn at the control step instead. Nothing was
 * added to the room; it was given room. The band has since gone back into the
 * dock (Jake, s111) — the 80px it was moved out to escape is the 80px that
 * now holds it. THE COMMIT FOOT, at the foot of this file, has the rest.
 */

/* Constant ids, never useId (the tree reshapes at the SSR handover). These
   are the STAGE's, deliberately different from the inspector's, because both
   docks are in the document at once even while only one is on screen. */
const KEY_ID = 'styler-stage-key'
const NOTE_ID = 'styler-stage-note'
const BENCH_ID = 'styler-stage-bench'
const LAYERS_ID = 'styler-stage-layers-panel'
const DOCK_ID = 'styler-stage-dock'
const MODS_ID = 'styler-stage-modifiers'

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

/* THE MOBILE WIDTH is 360px and it is written in the stylesheet, not here
   (stylerStage.module.css, .mountMobile): a container query can only be
   answered by a box the browser lays out, so the number has to be a CSS
   width. 360 is the site's own floor — the width every layout in this
   codebase is built down to — so MOBILE is not a guess at "small", it is the
   number the rest of the work already answers to. */

/** An item's element id, so the bench can name itself after the controls that
    chose it. Derived from ids the specs already carry, which keeps it
    identical on the server and on the client. */
const itemId = (axis: string, id: string) => `styler-stage-${axis}-${id}`

/** The three token sets a component can be seen in — the same three
    /api/token-commit will commit to (tokenEdit's TOKEN_THEMES), which is why
    the row offers these three and not "every skin": underwater has no token
    file yet, so there is nothing to show and nowhere to send it. */
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

/** The two widths the bench can be. Not "every breakpoint the site has": the
    shell declares one, at 720px, and a control offering sizes that change
    nothing would be a control inviting you to look for a difference that is
    not there. */
const VIEWPORTS = [
  { id: 'desktop', label: 'styler.viewport.desktop' },
  { id: 'mobile', label: 'styler.viewport.mobile' },
] as const

/** Every state the row can offer, in the order a person meets them. Which of
    them a given component actually gets is the spec's call (stageSpecs.tsx,
    `states`), and a component with one state draws no row at all. */
const STATES = [
  { id: 'default', label: 'styler.state.default' },
  { id: 'hover', label: 'styler.state.hover' },
] as const

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

/** ONE AXIS, ONE ROW: the name on the left, the choices beside it.
 *
 * Four modifiers, one control. It began as the variant tab row over the
 * bench and it is the whole MODIFIERS block now (Jake, s111), which is the
 * argument for generalising it rather than writing three more: four segmented
 * controls that only mostly matched would be four keyboards to get right and
 * four places to fix a focus bug.
 *
 * TABS OR RADIOS, and the difference is real rather than decorative. VARIANT
 * chooses which of several things the bench is SHOWING, so the bench is its
 * tabpanel and the row is a tablist — the relationship a screen reader can
 * follow from either end. The other three do not swap panels; they change a
 * setting that the one panel then obeys, which is what a radio group is. Both
 * shapes take the same arrow keys, the same roving tabindex and the same
 * pills, so the difference is only ever heard, never seen.
 *
 * Automatic activation either way: arrows move the caret and the choice
 * together, because there is nothing to confirm — the bench redraws on every
 * press, and asking for a second key to commit a preview would be a step that
 * exists only to exist. One tabindex in the row, so Tab crosses the whole axis
 * in one press and lands on the next thing. */
function AxisRow({
  axis,
  name,
  items,
  value,
  tabs,
  onPick,
}: {
  /** the axis's own slug, which is half of every item's element id */
  axis: string
  /** copy key for the axis name beside the row */
  name: string
  items: ReadonlyArray<{ id: string; label: string }>
  value: string
  /** true when this row picks what the bench SHOWS rather than how it is set */
  tabs?: boolean
  onPick: (id: string) => void
}) {
  const skin = useSettings((s) => s.skin)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = items.findIndex((item) => item.id === value)
    if (at < 0) return
    const go = (to: number) => {
      e.preventDefault()
      const next = items[(to + items.length) % items.length]
      onPick(next.id)
      document.getElementById(itemId(axis, next.id))?.focus()
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(at + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(at - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
  }

  return (
    <div className={styles.axis}>
      <CopyText k={name} className={styles.axisName} />
      <div
        role={tabs ? 'tablist' : 'radiogroup'}
        aria-label={t(name, skin)}
        className={styles.tabs}
        onKeyDown={onKeyDown}
      >
        {items.map((item) => {
          const on = item.id === value
          return (
            <button
              key={item.id}
              id={itemId(axis, item.id)}
              type="button"
              role={tabs ? 'tab' : 'radio'}
              className={styles.tab}
              aria-selected={tabs ? on : undefined}
              aria-checked={tabs ? undefined : on}
              aria-controls={BENCH_ID}
              tabIndex={on ? 0 : -1}
              onClick={() => onPick(item.id)}
            >
              <CopyText k={item.label} />
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

/** The marker the bench should answer with for an element under the pointer:
    the NEAREST `[data-part]` ancestor whose value is a node of the tree on
    screen, walking on up past the ones that are not.

    Not just `closest`, because a marker is only a layer of THIS component. A
    window sample holds a whole program's markup, another pilot can be nested
    inside a bench, and a `data-part` from either would otherwise stop the walk
    and hand back a part the panel has never heard of. The answer is checked
    back against the mount on every step too: closest can climb out of the
    bench and keep going. */
function nearestPart(
  mount: HTMLElement,
  from: Element,
  layers: readonly StylerLayer[],
): HTMLElement | null {
  if (!mount.contains(from)) return null
  let found = from.closest<HTMLElement>('[data-part]')
  while (found && mount.contains(found)) {
    const part = found.dataset.part
    if (part && layers.some((l) => l.id === part)) return found
    found = found.parentElement?.closest<HTMLElement>('[data-part]') ?? null
  }
  return null
}

/** THE LEFT PANEL — the component's anatomy, as deep as the component goes.
 *
 * INSPECT's LayersPanel is the precedent, and after Jake's second look it is
 * the precedent down to the wall it hangs on: same side, same width, same
 * head, same tree, same recursive rows drawn from one pre-order list with the
 * indent coming off the depth. Roving tabindex, arrows to walk, the picked row
 * on the accent fill. What it does NOT copy is that panel's Enter, which
 * selects. The s97 hotkey grammar reserves Enter for drilling into children
 * and Shift+Enter for the parent, so selection follows the caret here and
 * Enter means what the grammar says it means. Tab and Shift+Tab step siblings.
 *
 * Those four go through the shared registry rather than this element's own
 * onKeyDown, which is the whole reason the registry exists: it sits on
 * `window` in the capture phase and can take Tab before the browser moves the
 * focus. Every one of the four is guarded on the caret being INSIDE this
 * tree, and the sibling keys are guarded on there being a sibling that way —
 * so Tab off the last layer, and Shift+Tab off the first, fall through
 * untouched and the keyboard can always leave. A tree that ate Tab in both
 * directions would be a trap with a lid on it.
 *
 * EVERY NODE IS OPEN. There is no collapse state and no key to make one: the
 * biggest of the five anatomies is eleven rows, a panel that fits on screen
 * whole has nothing to gain by hiding half of it, and a collapsed branch is
 * one more place a pick can be while you cannot see it. The chevron says
 * "this one has children" and nothing else.
 *
 * THE TAIL COUNT is the rows the node takes ITSELF. A node that takes none and
 * has children that do wears its subtree's count in brackets instead, which is
 * the same thing the dock does one panel over when you open it — it draws what
 * the children take and says so. Brackets rather than a dimmed number because
 * the picked row draws on the accent flood and anything faded there falls
 * under AA. */
function StageLayers({
  layers,
  value,
  onPick,
  grip,
}: {
  /** the anatomy, pre-order: the order it draws and the order arrows walk */
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
    /** the node the caret is on, and the row it sits in among its siblings */
    const here = () => act.current.layers.find((l) => l.id === act.current.value) ?? null
    const siblings = (node: StylerLayer) =>
      act.current.layers.filter((l) => l.parent === node.parent)
    const step = (by: number) => () => {
      const node = here()
      if (!node) return
      const row = siblings(node)
      const at = row.findIndex((l) => l.id === node.id)
      act.current.select(row[at + by].id, true)
    }
    const canStep = (by: number) => () => {
      if (!inTree()) return false
      const node = here()
      if (!node) return false
      const row = siblings(node)
      const at = row.findIndex((l) => l.id === node.id)
      return at >= 0 && at + by >= 0 && at + by < row.length
    }

    return registerHotkeys('styler-stage-layers', [
      {
        key: 'Enter',
        when: () => inTree() && (here()?.children.length ?? 0) > 0,
        run: () => act.current.select(here()!.children[0].id, true),
      },
      {
        key: 'Enter',
        shift: true,
        when: () => inTree() && !!here()?.parent,
        run: () => act.current.select(here()!.parent!, true),
      },
      { key: 'Tab', when: canStep(1), run: step(1) },
      { key: 'Tab', shift: true, when: canStep(-1), run: step(-1) },
    ])
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = layers.findIndex((layer) => layer.id === value)
    if (at < 0) return
    const node = layers[at]
    const move = (to: number) => {
      e.preventDefault()
      select(layers[Math.max(0, Math.min(layers.length - 1, to))].id, true)
    }
    const go = (id: string | null | undefined) => {
      if (!id) return
      e.preventDefault()
      select(id, true)
    }
    switch (e.key) {
      case 'ArrowDown':
        move(at + 1)
        return
      case 'ArrowUp':
        move(at - 1)
        return
      case 'ArrowRight':
        // every node is open, so the first child is always the next row down
        go(node.children[0]?.id)
        return
      case 'ArrowLeft':
        go(node.parent)
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
          {layers.map((layer) => {
            const on = layer.id === value
            const row = layers.filter((l) => l.parent === layer.parent)
            const own = layer.rows.length
            const under = layer.subtreeRows.length
            return (
              <div
                key={layer.id}
                data-layer-key={layer.id}
                role="treeitem"
                tabIndex={on ? 0 : -1}
                aria-level={layer.depth + 1}
                aria-posinset={row.findIndex((l) => l.id === layer.id) + 1}
                aria-setsize={row.length}
                aria-selected={on}
                aria-expanded={layer.children.length > 0 ? true : undefined}
                className={shell.row}
                data-picked={on || undefined}
                style={{
                  paddingLeft: `calc(var(--spacing-component-xs) + ${layer.depth * 12}px)`,
                }}
                onClick={() => select(layer.id, false)}
              >
                <span
                  className={shell.chevron}
                  aria-hidden="true"
                  data-empty={layer.children.length === 0 || undefined}
                >
                  {layer.children.length > 0 ? '▾' : '·'}
                </span>
                <span className={shell.rowLabel}>{t(layer.name, skin)}</span>
                <span className={styles.layerCount}>
                  {own > 0 ? own : under > 0 ? `(${under})` : ''}
                </span>
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
  const setSkin = useSettings((s) => s.setSkin)
  const setTheme = useSettings((s) => s.setTheme)
  // stylerTune is module state, not a store — this is what re-reads it
  const [, bump] = useState(0)
  /** which row has its candidate list open. Local, not the shell's lifted
      state: the inspector's palette and this one are never on screen
      together, and Escape here is the stage's own ladder. */
  const [openRow, setOpenRow] = useState<string | null>(null)
  /* The choices this room holds itself, all of them as "what was asked for"
     rather than as "what is showing". A null is the default and a stale id is
     a miss, and both resolve to the same fallback below, so the stage can
     change component without an effect racing the render to clean up after
     it. That matters most for STATE: a component with no hover is one HOVER
     pick away from a modifier row it does not have, and the fallback answers
     it without a cleanup effect. The one choice NOT held here is the token
     set, which is the SETTINGS STORE's — see the header. */
  const [wantVariant, setWantVariant] = useState<string | null>(null)
  const [wantLayer, setWantLayer] = useState<string | null>(null)
  const [wantViewport, setWantViewport] = useState<string | null>(null)
  const [wantState, setWantState] = useState<string | null>(null)
  /* The two walls, held the same way the tabs are: null is "wherever the room
     opens it", a number is somebody having moved it. Null on the left is what
     keeps --inspect-left the default rather than a second copy of 244. */
  const [leftWidth, setLeftWidth] = useState<number | null>(null)
  const [rightWidth, setRightWidth] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const benchRef = useRef<HTMLDivElement>(null)
  /* What the bench's own listeners need to know, read through a ref: they arm
     once for the life of the room and everything they ask about — which
     component, which layers, which one is picked — changes underneath them. */
  const bench = useRef<{
    componentId: string
    layers: StylerLayer[]
    root: string
    picked: string
  }>({ componentId, layers: [], root: '', picked: '' })

  const saver = useTokenSave({
    keyId: KEY_ID,
    noteId: NOTE_ID,
    authenticate: copy.authenticate,
  })

  const spec = specFor(componentId)
  const held = count()

  /* WHAT IS ON THE BENCH, read off the settings store rather than held here.
     themeFor is the same call useTokenSave makes to decide which file SAVE
     writes, so the bench and the button cannot disagree. A skin with no token
     set (underwater) resolves to null there and falls back to the first set
     here: the bench has to draw something, and SAVE already refuses with
     "this skin has no token file to commit to yet". */
  const set = SKIN_SETS.find((s) => s.id === themeFor(skin, theme)) ?? SKIN_SETS[0]

  /* Both halves of the set, always, and never half of one: medieval carries
     its own appearance, so picking it while the desktop is in dark would
     otherwise leave data-theme='dark' on <html> under a skin whose selector
     wins over it — a document telling two stories. */
  const pickSet = (id: string) => {
    const next = SKIN_SETS.find((s) => s.id === id)
    if (!next) return
    sfx.tap()
    if (next.skin !== skin) setSkin(next.skin)
    if (next.theme !== theme) setTheme(next.theme)
  }

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
     and only its data-skin moves, so there is nothing here to re-run.

     The history is dropped on the way IN rather than on the way out, and that
     is the only order that holds: stylerTune outlives this room, the teardown
     that drops a pending set (InspectShell, StylerLibrary) runs after the room
     is gone and records a move of its own, and ⌘Z in a fresh room would
     otherwise undo its way back into somebody else's session. */
  useEffect(() => {
    clearHistory()
    const el = benchRef.current
    if (!el) return
    addRoot(el)
    return () => removeRoot(el)
  }, [])

  /* THE ⌘ HOVER. While the command key is down and the pointer is over the
     bench, the part under it wears a line, so a direct select is never a
     guess about what is under the cursor.

     Listeners rather than React handlers, because two of the three events are
     not the bench's: the modifier can go down and come up with the pointer
     perfectly still, and the window can lose focus mid-hold with the key
     never coming back up. So the pointer's position and the modifier's state
     are tracked separately and the outline is whatever the two of them say
     together. `over` is only ever read back through `mount.contains`, which
     is also what makes it safe to hold across a re-render: a node the bench
     has since replaced fails the test and the outline goes. */
  useEffect(() => {
    const mount = benchRef.current
    if (!mount) return
    /** the element the pointer is over, marker or not */
    let over: Element | null = null
    /** the marker currently wearing the line */
    let marked: HTMLElement | null = null

    const markerFor = (el: Element | null): HTMLElement | null => {
      if (!el || !mount.contains(el)) return null
      return nearestPart(mount, el, bench.current.layers)
    }

    const show = (el: HTMLElement | null) => {
      if (el === marked) return
      marked?.removeAttribute('data-styler-hover')
      marked = el
      marked?.setAttribute('data-styler-hover', '')
    }

    const sync = (down: boolean) => show(down ? markerFor(over) : null)
    const onMove = (e: globalThis.PointerEvent) => {
      over = e.target as Element
      sync(e.metaKey || e.ctrlKey)
    }
    const onLeave = () => {
      over = null
      show(null)
    }
    // globalThis, because the React types shadow both of the DOM's own names
    // for these events at the top of this file
    const onKey = (e: globalThis.KeyboardEvent) => sync(e.metaKey || e.ctrlKey)

    mount.addEventListener('pointermove', onMove)
    mount.addEventListener('pointerleave', onLeave)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onLeave)
    return () => {
      mount.removeEventListener('pointermove', onMove)
      mount.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onLeave)
      show(null)
    }
  }, [])

  /* THE PICKED LINE, so the left panel and the bench are never telling two
     stories about what is selected. No dependency list on purpose: the bench
     redraws when the variant changes, when the set changes and when the skin
     under it changes, and every one of those hands back different elements.
     A cleanup that runs on every render and a query that costs one
     querySelectorAll is cheaper than a list of dependencies that is right
     today and silently wrong the next time the bench learns a new axis.

     Every element carrying the marker takes the line, not the first one: CTRL
     is both window controls and ICON is every icon in the grid, and a layer
     is the part wherever it appears. */
  useEffect(() => {
    const mount = benchRef.current
    if (!mount) return
    const { picked, root, componentId: id } = bench.current
    if (!picked) return
    const marked = Array.from(
      mount.querySelectorAll<HTMLElement>(
        picked === root
          ? `[data-component="${CSS.escape(id)}"]`
          : `[data-part="${CSS.escape(picked)}"]`,
      ),
    )
    for (const el of marked) el.setAttribute('data-styler-picked', '')
    return () => {
      for (const el of marked) el.removeAttribute('data-styler-picked')
    }
  })

  /* ESCAPE, and why it is here rather than in the shell's ladder. The
     registry sits on `window` in the capture phase and the ladder sits on
     `document`, so this runs first and stops the event — the ladder never
     sees it and never deselects the pick underneath. Two rungs, in the
     ladder's own order: an open candidate list closes first, then the room.
     There were three while the token set was a flyout in the crown; the
     modifiers are all rows on the panel now and a row has nothing to close.
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

  // the sample is built in the CHOSEN set's skin, so its copy speaks that
  // skin's voice on the bench that is about to draw it
  const variants = spec.variants(set.skin)
  const variant = variants.find((v) => v.id === wantVariant) ?? variants[0]
  /* The declared anatomy, walked flat: the panel draws this list in this
     order, the bench's two gestures answer out of it, and the dock takes one
     node id off it. One tree, three readers, no second list to keep in step. */
  const layers = flattenLayers(layersFor(componentId))
  const layer = layers.find((l) => l.id === wantLayer) ?? layers[0]
  bench.current = { componentId, layers, root: layers[0].id, picked: layer.id }

  /* The two modifiers the SPEC has a say in, resolved the same way every
     other want in this room is: the ask, checked against what is actually on
     offer, falling through to the first. `states` is a component fact and the
     row is drawn only when there are two of them, so a spec with one state
     can never leave a stale HOVER on the bench. */
  const viewport = VIEWPORTS.find((v) => v.id === wantViewport) ?? VIEWPORTS[0]
  const states = STATES.filter((s) => spec.states.includes(s.id))
  const state = states.find((s) => s.id === wantState) ?? states[0]

  /** The deepest layer marker under a pointer, or null when the pointer is
      not on one. nearestPart is the shared walk — see its note for why the
      nearest marker is not always the answer. */
  const partAt = (target: EventTarget | null): string | null => {
    const mount = benchRef.current
    const el = target instanceof Element ? target : null
    if (!mount || !el) return null
    return nearestPart(mount, el, layers)?.dataset.part ?? null
  }

  /** Figma's two gestures. Deep takes the part under the pointer and falls
      back to the root, which is also what a click on the bench's own air
      means: there is no part there, so the answer is the whole component. */
  const pickAt = (e: MouseEvent<HTMLDivElement>, deep: boolean) => {
    setWantLayer((deep ? partAt(e.target) : null) ?? layers[0].id)
  }

  /* The two walls, written as custom properties on the room itself. The
     stylesheet declares both defaults on .stage and both panels read them
     from there, so a dragged edge moves the layout without a second number
     anywhere. Only a MOVED wall is written here; an untouched one leaves the
     sheet's default standing. */
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

        {/* THE CANVAS holds the component and nothing else now. The variant
            tabs stood across the top of it until the modifiers were gathered
            into one block in the dock (Jake, s111), and a strip of controls
            over the bench was the last thing in the room competing with the
            thing the room is for. */}
        <div className={styles.canvas}>
          <div
            id={BENCH_ID}
            ref={benchRef}
            className={`${styles.mount} ${viewport.id === 'mobile' ? styles.mountMobile : ''}`}
            role="tabpanel"
            /* named by the two controls that chose it — the variant pill and
               the token set's — so a screen reader reads "ACTIVE CLASSIC
               DARK" rather than "region" */
            aria-labelledby={
              variant
                ? `${itemId('variant', variant.id)} ${itemId('set', set.id)}`
                : itemId('set', set.id)
            }
            data-skin={set.skin}
            data-theme={set.theme}
            /* THE FORCED STATE. There is no way to hover a sample on somebody
               else's behalf, so the bench declares the state instead and every
               pilot hover rule answers to this as well as to the pointer
               (shell.module.css carries the note, on .iconBtn). It is written
               on every render, DEFAULT included, because an attribute that
               only appears sometimes is an attribute somebody debugs later. */
            data-styler-state={state?.id ?? 'default'}
            data-styler-viewport={viewport.id}
            /* CAPTURE, so the pick is made before the sample handles its own
               click, and swallowed only for ⌘: a plain click has to reach the
               sample button underneath and still leave the root selected
               behind it (see DIRECT SELECT in the header) */
            onClickCapture={(e) => {
              const direct = e.metaKey || e.ctrlKey
              pickAt(e, direct)
              if (direct) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
            onDoubleClickCapture={(e) => pickAt(e, true)}
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

          {/* THE MODIFIERS, all four of them, at the head of the column that
              answers them (Jake, s111). One heading, one row per axis, and
              every row the same segmented control — see AxisRow above for why
              one of them is a tablist and the other three are radio groups. */}
          <h2 className={`${shell.panelHead} ${styles.modsHead}`} id={MODS_ID}>
            <CopyText k="styler.modifiers" />
          </h2>
          <div className={styles.mods} role="group" aria-labelledby={MODS_ID}>
            <AxisRow
              axis="viewport"
              name="styler.axis.viewport"
              items={VIEWPORTS}
              value={viewport.id}
              onPick={setWantViewport}
            />
            {/* a component with one state has nothing to ask about: the row
                is drawn when the spec offers a choice and not otherwise */}
            {states.length > 1 && state && (
              <AxisRow
                axis="state"
                name="styler.axis.state"
                items={states}
                value={state.id}
                onPick={setWantState}
              />
            )}
            <AxisRow
              axis="set"
              name="styler.axis.set"
              items={SKIN_SETS}
              value={set.id}
              onPick={pickSet}
            />
            {/* the component does not name its own variants: the spec does */}
            <AxisRow
              axis="variant"
              name="styler.axis.variant"
              items={variants}
              value={variant?.id ?? ''}
              tabs
              onPick={setWantVariant}
            />
          </div>

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

          {/* THE COMMIT FOOT, and why it came back.

              It stood here once. Jake looked at it on a wide screen in s107
              and everything he flagged was something being squeezed: the
              count broke onto two lines, the theme chip on SAVE ran off the
              edge. So it left the dock and became a band across the bottom of
              the canvas, and the dock got 80px wider in the same pass.

              That extra 80px is what brings it back (Jake, s111: "fix the
              export options to the bottom of that panel"). A 384px column
              holds the row the 304px one folded, the chip it was carrying is
              gone with the crown's old switch, and a band floating over the
              canvas was a second thing in the middle of the room competing
              with the component. The dock is a column of three now — the
              modifiers, the blocks that scroll, and this, which does not.

              Nothing about the flow moved either way. It is still the same
              count, the same revert, the same button and the same key gate
              underneath (useTokenSave) — the gate and the status line are the
              hook's own markup and they draw here.

              THE BUTTON SAYS WHAT IT DOES: OPEN PR. It said SAVE → PR and
              wore a chip naming the theme it was about to write, which was
              honest back when the set on the bench and the set being
              committed to could disagree. They cannot now — the TOKEN SET row
              is the only thing that sets either (see the header) — so the
              chip was repeating a control one panel above it. The inspector
              keeps its own SAVE → PR: that panel has no modifier block to
              read the destination off.

              Last in the dock, which is also where the keyboard should reach
              it: modifiers, blocks, then the button that sends them. */}
          <div className={styles.commit}>
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
                <CopyText k="styler.save" />
              </button>
            </div>

            {saver.gate?.for === 'token' && saver.keyGate()}
            {saver.saveStatus()}
          </div>
        </aside>
      </div>
    </div>
  )
}
