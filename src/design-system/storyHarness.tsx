'use client'

import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Decorator } from '@storybook/react'
import { useSettings, type Skin } from '@/store/settings'
import { useWindows } from '@/store/windows'
import { useShelfMode } from '@/store/shelfMode'
import { useInspect, type InspectTool } from '@/store/inspect'

/* THE STORE HARNESS — one decorator that gives every story a machine that
   has just been switched on.
 *
 * Eight shell components (MenuBar, SkinSwitch, Wallpaper, DesktopIcons,
 * CommandWidget, AmbientAgents, ShelfBox, CaseFooter) read a zustand store
 * and take no prop for what they read. They were storyable all along — what
 * was missing was a way to say "this story runs with the sound off and two
 * windows open" without editing the component. That is all this file is.
 *
 * The stores are plain zustand singletons (create(...) at module scope, no
 * provider), so seeding one is `useStore.setState(...)` and nothing more.
 * The catch is that a singleton outlives the story: toggle the sound in
 * MenuBar and every story after it inherits a muted machine, and the settings
 * store writes some of that to localStorage on the way. So the harness resets
 * all four stores AND clears the keys they persist, on every story, before the
 * component renders.
 *
 * SKIN AND MODE COME FROM THE THEME TOOLBAR, not from a story arg. The theme
 * decorator in .storybook/preview.tsx already writes data-skin/data-theme onto
 * <html> for the CSS; this reads the same global so the STORE agrees with the
 * document. Components that branch on skin in JS (MenuBar hides the theme
 * button outside classic, ShelfBox and CommandWidget pick per-skin art) then
 * behave in the catalog exactly as they do on the desk. It also matches what
 * MenuBar's own hydrate() does on the real site: read the skin off the
 * document. Nothing here fakes a value the machine wouldn't have.
 *
 * Everything else is per-story, through `parameters.stores`:
 *
 *   export const Muted: Story = { parameters: { stores: { sound: false } } }
 *
 * Sound is left ON by default because that is the machine's own default and
 * because the note glyph in the menu bar is drawing that state. Stories click
 * and the catalog beeps, same as the desk does.
 */

export type StoreSeed = {
  /** Settings: the sound toggle MenuBar's note glyph draws. */
  sound?: boolean
  /** Settings: the saved wallpaper preference ('random' or a pattern id). */
  wallpaper?: string
  /** Settings: the pattern <Wallpaper> actually paints. Defaults to `wallpaper`
      when that names a real pattern, so one field usually does. */
  resolvedWallpaper?: string
  /** Windows: which programs are already open, back to front. */
  openWindows?: string[]
  /** SHELF.MODE: the shelf is up over the desk. */
  shelfMode?: boolean
  /** INSPECT.MODE: the tool is running, and which tool. */
  inspect?: boolean
  inspectTool?: InspectTool
}

/* Keys the four stores write behind their own backs. A story that leaves one
   of these set poisons the next one, so they go before every story rather
   than after — a story that crashes still can't leave a mess. */
const PERSISTED = [
  'lunde-sound',
  'lunde-wallpaper',
  'lunde-theme',
  'lunde-skin',
  'lunde-crew-met',
]
const SESSION_PERSISTED = ['lunde-build-a-skin']

function forget() {
  try {
    for (const k of PERSISTED) localStorage.removeItem(k)
    for (const k of SESSION_PERSISTED) sessionStorage.removeItem(k)
  } catch {
    /* private mode — nothing was stored, nothing to clear */
  }
}

/** 'classic-dark' → ['classic', 'dark']; 'medieval' → ['medieval', 'light']. */
export function readTheme(global: unknown): { skin: Skin; theme: 'light' | 'dark' } {
  const [skin, mode] = String(global ?? 'classic-light').split('-')
  return {
    skin: (['classic', 'medieval', 'underwater'].includes(skin) ? skin : 'classic') as Skin,
    theme: mode === 'dark' ? 'dark' : 'light',
  }
}

/** Put the machine back to a cold boot, then apply the story's seed. Exported
    so a play function or a docs page can call it directly. */
export function seedStores(skin: Skin, theme: 'light' | 'dark', seed: StoreSeed = {}) {
  forget()

  const wallpaper = seed.wallpaper ?? 'random'
  useSettings.setState({
    skin,
    theme,
    sound: seed.sound ?? true,
    wallpaper,
    /* 'random' is a preference, never a pattern — the store resolves it on
       hydrate. A story asking for random gets the store's own SSR fallback
       so the picture is the same on every run and Chromatic has nothing to
       flap about. */
    resolvedWallpaper: seed.resolvedWallpaper ?? (wallpaper === 'random' ? 'waves' : wallpaper),
  })

  /* Windows are set as data, not opened through open(): open() plays a sound,
     writes an analytics event and stacks z-indexes off whatever the last story
     left behind. A story wants the RESULT — these programs are up — so it says
     so directly. */
  const ids = seed.openWindows ?? []
  useWindows.setState({
    windows: ids.map((id, i) => ({ id, z: 10 + i })),
    zTop: 10 + ids.length,
    focused: ids[ids.length - 1] ?? null,
    sizes: {},
    holds: {},
    zoomed: {},
  })

  useShelfMode.setState({ on: seed.shelfMode ?? false })
  useInspect.setState({ on: seed.inspect ?? false, tool: seed.inspectTool ?? 'select' })
}

/**
 * The decorator. Composes with the theme decorator in .storybook/preview.tsx
 * by reading the same `theme` global rather than talking to it — order in the
 * `decorators` array doesn't matter, and neither one has to know the other
 * exists.
 *
 * The seed runs DURING render, not in an effect: the story's component
 * subscribes on its own first render, and an effect would hand it one frame of
 * the previous story's machine first. Nothing is subscribed yet at this point
 * in the tree, so there is no render to interrupt. The `key` on the wrapper
 * remounts the subtree whenever the theme or the seed changes, so a component
 * holding local state (SkinSwitch's open menu, ShelfBox's flip) starts from
 * the top on a theme flip instead of showing a state the new seed never asked
 * for.
 */
export const withStores: Decorator = (Story, context) => {
  const { skin, theme } = readTheme(context.globals.theme)
  const seed = (context.parameters.stores ?? {}) as StoreSeed
  const signature = `${context.id}|${skin}|${theme}|${JSON.stringify(seed)}`
  const applied = useRef<string | null>(null)

  if (applied.current !== signature) {
    applied.current = signature
    if (typeof document !== 'undefined') seedStores(skin, theme, seed)
  }

  return (
    <div key={signature}>
      <Story />
    </div>
  )
}

/* ── the desk ─────────────────────────────────────────────────────────────── */

/**
 * A DESK TO PUT THINGS ON. Four of the shell components are positioned
 * against the desktop rather than against themselves — the menu bar is
 * `fixed`, the wallpaper is `inset: 0`, the icon grid and the wandering agent
 * are `absolute` — so dropped into a story canvas they either pin themselves
 * to the Storybook chrome or collapse to nothing.
 *
 * The stage is a bounded box that a `fixed` layer can live inside: the
 * `translateZ(0)` makes it the containing block for fixed descendants, which
 * is the same trick ShelfMode.stories.tsx uses for the shelf's own fixed
 * layer, and it costs nothing but a compositor layer. Everything else here is
 * geometry: a size, a frame, the surface token underneath.
 *
 * It is a room, not a mock desktop. It draws no chrome of its own so the only
 * thing on screen is the component being catalogued.
 */
export function DeskStage({
  height = 420,
  width = '100%',
  padded = false,
  style,
  children,
}: {
  height?: number | string
  width?: number | string
  /** Leave room under the menu bar, for stages that draw one. */
  padded?: boolean
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        transform: 'translateZ(0)',
        overflow: 'hidden',
        border: 'var(--border-width-default) solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--content)',
        paddingTop: padded ? 'var(--menubar-h)' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
