import type { Meta, StoryObj } from '@storybook/react'
import { DeskStage } from '@/design-system/storyHarness'
import { Wallpaper } from './Wallpaper'
import { WALLPAPERS, getWallpaper, wallpaperMask } from './wallpapers'
import styles from './shell.module.css'

/* THE DESKTOP PATTERN. Fifteen lines of component and one idea: the tile is
   an SVG mask, not a picture, so the pattern is painted in system ink and
   follows light and dark for free. Nothing about it is a colour choice —
   .wallpaper drops the layer to 0.07 (0.08 in dark) and the ink under the mask
   is whatever --content is worth in that skin and mode.

   It takes no props at all. Which pattern shows is `resolvedWallpaper` in the
   settings store, so these stories seed it through the harness
   (parameters.stores) rather than pass it — the same field Settings writes
   when a visitor picks a swatch.

   'plain' has no tile and the component returns null, which is why the plain
   desk in Settings is genuinely nothing rendered rather than a blank pattern.
   That is a state a catalog can otherwise never show, so it gets a story. */

const meta = {
  title: 'Shell/Wallpaper',
  component: Wallpaper,
  parameters: { layout: 'fullscreen', stores: { wallpaper: 'waves' } },
  render: () => (
    <DeskStage height={260}>
      <Wallpaper />
    </DeskStage>
  ),
} satisfies Meta<typeof Wallpaper>

export default meta
type Story = StoryObj<typeof meta>

/* The default desk. A first-time visitor gets 'random', which the store
   resolves to one of the seven tiles on hydrate; the harness pins the resolved
   pick so the picture is the same on every run and Chromatic has nothing to
   flap about. */
export const Waves: Story = {}

/* The heaviest tile in the set — the one that shows the opacity ceiling doing
   work. At 7% even this stays background. */
export const Diaper: Story = {
  parameters: { stores: { wallpaper: 'diaper' } },
}

/* No tile, no element. Settings' PLAIN swatch is this: the component bails
   before it renders anything, so the desk is the surface token and nothing
   else. */
export const Plain: Story = {
  parameters: { stores: { wallpaper: 'plain' } },
}

/* THE BOARD. Every tile the machine ships, on one screen. There is one store
   and eight desks here, so the board cannot seed its way through them — each
   cell calls the same two functions the component calls (getWallpaper,
   wallpaperMask) and wears the component's own `.wallpaper` class, so the
   opacity, the dark-mode step and the ink all come from the shipped rule
   rather than from a copy of it. Flip the theme toolbar and the whole board
   re-inks, which is the property the mask exists for. */
export const AllPatterns: Story = {
  name: 'All patterns',
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 'var(--spacing-component-md)',
      }}
    >
      {WALLPAPERS.map((wp) => (
        <div key={wp.id}>
          <DeskStage height={120} style={{ marginBottom: 'var(--spacing-component-xs)' }}>
            {wp.tile && (
              <div
                className={styles.wallpaper}
                style={wallpaperMask(getWallpaper(wp.id))}
                aria-hidden="true"
              />
            )}
          </DeskStage>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 'var(--type-micro-size)',
              letterSpacing: '0.1em',
              color: 'var(--content-muted)',
            }}
          >
            {wp.name.toUpperCase()}
            {wp.tile ? '' : ' · NO TILE'}
          </span>
        </div>
      ))}
    </div>
  ),
}
