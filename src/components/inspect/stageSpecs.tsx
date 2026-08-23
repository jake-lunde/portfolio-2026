'use client'

import { useRef, type ReactNode } from 'react'
import type { Skin } from '@/store/settings'
import { t } from '@/content/copy'
import { Button } from '@/components/primitives/Button'
import { Stamp } from '@/components/primitives/Stamp'
import { MenuBar } from '@/components/shell/MenuBar'
import { DesktopIcons } from '@/components/shell/DesktopIcons'
import { Window } from '@/components/shell/Window'
import type { ResolvedWindow } from '@/programs/resolve'
import { CopyText } from '@/content/CopyText'
import styles from './stylerStage.module.css'

/* WHAT THE STAGE PUTS ON THE BENCH.
 *
 * One spec per pilot component: the variants worth seeing side by side, and
 * what kind of bench each one needs to stand up on its own.
 *
 * EVERY VARIANT IS THE REAL COMPONENT. That is the stage's whole claim — you
 * are styling the thing itself, not a picture of it — so nothing here is a
 * div wearing the right class. The recipes come from the Storybook stories
 * that already render these five in isolation for the Figma mirror
 * (Button.stories.tsx's TokenBoard, Stamp.stories.tsx's BothTones,
 * MenuBar.stories.tsx and DesktopIcons.stories.tsx on the harness's
 * DeskStage), because those recipes are already reviewed and already the
 * arguments the catalog trusts.
 *
 * THREE OF THE FIVE DO NOT STAND UP BY THEMSELVES, and the bench is how that
 * is handled without editing any of them:
 *
 * · MenuBar is `position: fixed`. A `transform` on an ancestor makes that
 *   ancestor the containing block, so the bar lays itself across the bench
 *   instead of across the viewport — the same trick storyHarness's DeskStage
 *   uses, and the same one ShelfMode's story uses for the shelf.
 * · DesktopIcons is `position: absolute` against the desktop. The bench is
 *   the relative box it measures itself from.
 * · Window is bound to the windows store, to motion drag, and to a program
 *   registry entry. It gets a hand-built ResolvedWindow with a one-line body
 *   — the CHROME is what --window-* paints, and the chrome here is the real
 *   Window's own, titlebar controls and resize grip included.
 *
 * The stage renders one bar of these per skin (StylerStage.tsx), so a spec
 * must be cheap enough to draw four times.
 */

export type StageVariant = {
  id: string
  /** copy key for the micro-caps label under the sample */
  label: string
  node: ReactNode
}

/** A pointer state the STATE modifier can hold down. DEFAULT is every
    component's, so it is the one no spec has to earn. */
export type StageState = 'default' | 'hover'

export type StageSpec = {
  /** which bench this component needs to stand on */
  bench: 'plain' | 'chrome' | 'desk'
  /** WHAT THE STATE ROW MAY OFFER, declared rather than guessed.
   *
   *  The stage can hold hover down on the bench (the sample wears
   *  `data-styler-state` and the component's hover rules answer to it as
   *  well as to the pointer — shell.module.css carries the note), but only
   *  three of the five have anything to show for it: window's controls,
   *  the desktop icons and the button's two tones are the components whose
   *  token files declare a `-hover-` row. A HOVER pill on a menu bar that
   *  paints nothing under it would be a control that lies about the
   *  component, so the panel reads this list and draws the row only when
   *  there is more than one thing in it.
   *
   *  It lives here, beside the sample, because "does this component have a
   *  hover" is a fact about the component and the spec is where the stage
   *  keeps those. The token names are the check on it, not the source: the
   *  test asserts every spec that offers HOVER has a `-hover-` role and
   *  every component that has one offers it. */
  states: ReadonlyArray<StageState>
  variants: (skin: Skin) => StageVariant[]
}

/* The one window the stage draws. A real ResolvedWindow, hand-built rather
   than resolved: every program in the registry pulls a dynamic import and a
   store behind it, and a stage that booted PAINT to show you a titlebar would
   be paying for a program to look at its frame. The doc-id in the meta slot
   is a literal, the way every registry entry writes one, and it renders
   inside an aria-hidden span. */
function sampleWindow(skin: Skin): ResolvedWindow {
  return {
    id: 'styler-sample',
    name: t('styler.sample.window', skin),
    meta: 'STY-01',
    chrome: 'paper',
    component: WindowBody,
    size: { w: 300, h: 168 },
    pos: { x: 0, y: 0 },
    path: null,
  }
}

function WindowBody() {
  return <CopyText k="styler.sample.body" as="p" className={styles.sampleBody} />
}

/** The window sample, in its two states. Active is a class the real Window
    puts on itself from a prop, and three of window's own rows only paint
    under it (--window-titlebar-active-*), so both states are on the bench or
    a third of the Fill block would look inert. */
function WindowPair({ skin, active }: { skin: Skin; active: boolean }) {
  const bench = useRef<HTMLDivElement>(null)
  return (
    <div ref={bench} className={styles.windowBench}>
      <Window def={sampleWindow(skin)} z={1} active={active} desktopRef={bench} />
    </div>
  )
}

export const STAGE_SPECS: Record<string, StageSpec> = {
  button: {
    bench: 'plain',
    states: ['default', 'hover'],
    variants: (skin) => [
      {
        id: 'system',
        label: 'styler.variant.system',
        node: (
          <Button tone="system" size="md">
            {t('styler.sample.button', skin)}
          </Button>
        ),
      },
      {
        id: 'expressive',
        label: 'styler.variant.expressive',
        node: (
          <Button tone="expressive" size="md">
            {t('styler.sample.button', skin)}
          </Button>
        ),
      },
      {
        id: 'small',
        label: 'styler.variant.small',
        node: (
          <Button tone="system" size="sm">
            {t('styler.sample.button', skin)}
          </Button>
        ),
      },
    ],
  },

  stamp: {
    bench: 'plain',
    states: ['default'],
    variants: (skin) => [
      { id: 'blue', label: 'styler.variant.blue', node: <Stamp tone="blue">{t('styler.sample.stamp', skin)}</Stamp> },
      { id: 'pink', label: 'styler.variant.pink', node: <Stamp tone="pink">{t('styler.sample.stamp', skin)}</Stamp> },
    ],
  },

  menubar: {
    bench: 'chrome',
    states: ['default'],
    variants: () => [{ id: 'bar', label: 'styler.variant.bar', node: <MenuBar /> }],
  },

  'desktop-icons': {
    bench: 'desk',
    states: ['default', 'hover'],
    variants: () => [{ id: 'grid', label: 'styler.variant.grid', node: <DesktopIcons /> }],
  },

  window: {
    bench: 'plain',
    states: ['default', 'hover'],
    variants: (skin) => [
      { id: 'active', label: 'styler.variant.active', node: <WindowPair skin={skin} active /> },
      {
        id: 'resting',
        label: 'styler.variant.resting',
        node: <WindowPair skin={skin} active={false} />,
      },
    ],
  },
}

/** What the stage draws for a component, or nothing when the id is not one
    of the pilot five. The panel never offers OPEN COMPONENT without a spec,
    so a miss here is a programming error rather than a state to design for
    — the test asserts every pilot id has one. */
export function specFor(id: string): StageSpec | null {
  return STAGE_SPECS[id] ?? null
}
