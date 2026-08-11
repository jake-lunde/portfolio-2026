import type { Meta, StoryObj } from '@storybook/react'
import type { ReactNode } from 'react'
import { CoverFilm } from './CoverFilm'
import styles from './shelf.module.css'

/* CoverFilm is decorative and pointer-inert — it only ever sits inside a
   box cover's `.plate` (ShelfBox.tsx), stacked over the printed art. It has
   no poster of its own: the "poster" is a sibling <img> one level up in
   ShelfBox, so these stories reuse `.composed` — the shelf's own fallback
   swatch (shelf.module.css) — as the fixed-ratio placeholder cover CoverFilm
   sits over, per house law (images are swappable placeholders, never block
   on assets).

   The wrapping box below is sized off `--box-w`/`--plate-h`, the same
   arithmetic `.plate` uses in shelf.module.css — full box-cover width, a
   16:9-ish plate a fifth taller (the extra height pays for the plate's own
   mask elsewhere; CoverFilm itself is agnostic to the mask). */

const PLATE_W = 246
const PLATE_H = (PLATE_W * 9) / 16 * 1.2

function PlaceholderCover({ children }: { children?: ReactNode }) {
  return (
    <div style={{ position: 'relative', width: PLATE_W, height: PLATE_H, overflow: 'hidden' }}>
      <span className={styles.composed} />
      {children}
    </div>
  )
}

const meta = {
  title: 'Shelf/CoverFilm',
} satisfies Meta

export default meta
type Story = StoryObj

/* The resting state every box is actually in until a frame paints (or
   forever, on a failed/blocked autoplay): the video is mounted but its
   opacity stays 0 (no `data-clear`), so only the placeholder cover shows
   through. Deterministic — no real asset load, nothing to flake in visual
   regression. An invalid src reproduces this reliably. */
export const OverPlaceholder: Story = {
  render: () => (
    <PlaceholderCover>
      <CoverFilm src="/case/does-not-exist/box-film.mp4" title="Case Study — cover film" />
    </PlaceholderCover>
  ),
}

/* A real, committed asset (public/case/family-hub/box-film.mp4, served by
   Storybook's staticDirs) — the actual integration point. Once the browser
   paints its first frame, `onPlaying` sets `data-clear` and the film
   crossfades in over the placeholder cover, exactly as it does over the
   real printed art in ShelfBox. Autoplay/timing is environment-dependent,
   so this story is for checking the wiring, not for pixel-diffing. */
export const Playing: Story = {
  render: () => (
    <PlaceholderCover>
      <CoverFilm src="/case/family-hub/box-film.mp4" title="Family Hub — cover film" />
    </PlaceholderCover>
  ),
  parameters: {
    chromatic: { disableSnapshot: true },
  },
}
