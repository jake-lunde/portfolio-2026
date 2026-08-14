'use client'

import { CopyText as Copy } from '@/content/CopyText'
import { sfx } from '@/lib/sound'
import { useWindows } from '@/store/windows'
import styles from './CustomizeButton.module.css'

/* THE CUSTOMIZE BUTTON — one shared door to SKIN BUILDER, opened from
   Settings and SPEC.SHEET alike (round 4 made it a primitive; both
   windows render this exact control).

   ROUND 5 REDESIGN (Jake): the round-4 color strip scrolled but never
   DEMONSTRATED anything — "a weird scrolling color section that isn't
   actually updating". So the button is now the demonstration itself: a
   tiny abstracted OS window whose titlebar and dataviz re-ink through
   the skins' accent pairs, with CUSTOMIZE LUNDE OS as the dialog button
   at the foot of that nested window. What customization changes is what
   the control shows changing.

   THE COLOR CHANGE IS OPACITY, NOT PAINT. Motion law (CLAUDE.md §2) is
   transform/opacity only — so nothing here keyframes a background-color.
   The titlebar and the bar row are drawn once per palette as a stacked
   SCENE (absolute over the frame, same fixed geometry), and the scenes
   crossfade on one shared opacity keyframe staggered by delay, each
   holding a quarter of the 12s cycle. The base coat underneath is
   painted in scene 1's inks so the frame is never empty — first paint
   and the loop's wrap both rest on it. Reduced motion zeroes every
   scene and the base holds alone, static.

   PALETTES are sampled from src/styles/tokens.generated.css — classic
   --accent #2036c8 / --accent-expressive #f2a6c2, medieval --accent
   #9e2b1e / --accent-expressive #b8860b — each pair used both ways
   round: four looks from the two shipped skins. Underwater joins when
   its token set ships (Settings' swatch is still disabled for it).
   Hardcoded WITH this derivation per CLAUDE.md §5.

   The label chip never sits over any cycling ink — content on surface,
   always — so its AA holds by construction, not by auditing frames.
   Geometry the scenes must mirror lives in TWO css custom properties
   on .frame (--head-h, --viz-h); everything else is shared classes. */

const PALETTES = [
  { head: '#2036c8', bar: '#f2a6c2' }, // classic, as shipped
  { head: '#9e2b1e', bar: '#b8860b' }, // medieval, as shipped
  { head: '#f2a6c2', bar: '#2036c8' }, // classic, swapped
  { head: '#b8860b', bar: '#9e2b1e' }, // medieval, swapped
]

/* one silhouette, five bars — the same skyline in every ink, so the
   change reads as re-inking, never as new data */
const BARS = [10, 18, 8, 24, 14]

function VizRow({ color }: { color: string }) {
  return (
    <span className={styles.vizRow}>
      {BARS.map((h, i) => (
        <span key={i} className={styles.bar} style={{ height: h, background: color }} />
      ))}
    </span>
  )
}

export function CustomizeButton() {
  const openWindow = useWindows((s) => s.open)

  return (
    <button
      type="button"
      className={styles.customize}
      onClick={() => {
        sfx.open()
        openWindow('skinbuilder')
      }}
    >
      {/* the frame is NOT aria-hidden — it holds the label, the control's
          accessible name. Only the painted furniture hides. */}
      <span className={styles.frame}>
        {/* the base coat — scene 1's inks, in normal flow */}
        <span className={styles.head} style={{ background: PALETTES[0].head }} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
        <span className={styles.viz} aria-hidden="true">
          <VizRow color={PALETTES[0].bar} />
        </span>

        {/* the scenes — absolute over the frame, same head/viz geometry,
            other inks, crossfading on the shared staggered keyframe */}
        {PALETTES.map((p, i) => (
          <span
            key={i}
            className={styles.scene}
            style={{ animationDelay: `${i * 3}s` }}
            aria-hidden="true"
          >
            <span className={styles.headSkin} style={{ background: p.head }}>
              <span className={styles.dot} />
              <span className={styles.dot} />
            </span>
            <span className={styles.viz}>
              <VizRow color={p.bar} />
            </span>
          </span>
        ))}

        {/* the nested window's own dialog button — the one part that
            never changes ink, and the thing the words belong to */}
        <Copy k="settings.customize" as="span" className={styles.labelChip} />
      </span>
    </button>
  )
}
