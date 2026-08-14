'use client'

import { CopyText as Copy } from '@/content/CopyText'
import { sfx } from '@/lib/sound'
import { useWindows } from '@/store/windows'
import styles from './CustomizeButton.module.css'

/* THE CUSTOMIZE BUTTON — one shared door to SKIN BUILDER, opened from
   Settings (below the wallpaper picker) and SPEC.SHEET (above the color
   section) alike. Both windows used to carry their own near-identical
   button (programs.module.css .customizeBtn, specsheet.module.css
   .customize) — retired here in favor of one primitive, full-width, so
   the two entry points are literally the same control now, not just
   styled to look like it.

   THE FUN: a thin color strip rides the button's bottom edge, cycling
   through the registered skins' two accents to demonstrate customization
   in the button itself. Motion law bans animating paint (CLAUDE.md §2,
   no background-color keyframes) — so the strip is real DOM (duplicated
   color blocks in a flex track), moved with `transform: translateX` only.
   The label sits in normal flow above the strip and never overlaps it —
   AA contrast for the text only ever has to hold against --surface
   (idle) / --content (hover), never against a saturated color chasing
   past underneath it, so it's correct at every frame by construction
   rather than by checking each stop along the loop.

   Hex literals in STRIP_COLORS are sampled from
   src/styles/tokens.generated.css: classic --accent (#2036c8) +
   --accent-expressive (#f2a6c2), medieval --accent (#9e2b1e) +
   --accent-expressive (#b8860b). Underwater has no token set yet
   (Settings.tsx's skin swatch is still disabled for it) — add its pair
   here once tokens/underwater ships. */

const STRIP_COLORS = ['#2036c8', '#f2a6c2', '#9e2b1e', '#b8860b']
// duplicated once so the loop can walk exactly one sequence's width and
// land back on its own start pixel — the wrap never shows
const STRIP_SEQUENCE = [...STRIP_COLORS, ...STRIP_COLORS]

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
      <Copy k="settings.customize" as="span" className={styles.label} />
      <span className={styles.strip} aria-hidden="true">
        <span className={styles.stripTrack}>
          {STRIP_SEQUENCE.map((hex, i) => (
            <span key={i} className={styles.stripBlock} style={{ background: hex }} />
          ))}
        </span>
      </span>
    </button>
  )
}
