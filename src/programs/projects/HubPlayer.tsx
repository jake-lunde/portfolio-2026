'use client'

import { useReducedMotion } from 'motion/react'
import { getCase } from '@/programs/projects/cases'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import styles from './player.module.css'

/* THE PLAYER — Family Hub's case study standing open on the desktop as a
   film loop, poolsuite.net's player translated into this machine (Jake's
   refresh pass, this session): the cover film running under a print
   treatment, a file strip naming the reel, and the overview below with
   one PLAY. It boots open BEHIND README (resolve.ts BOOT_WINDOWS) — the
   desk is set with the work already running on it.

   This is a TEASER SURFACE, so it is deliberately not gated the way the
   case window is: the sphere guards the full read, not the trailer.
   PLAY opens `case:family-hub` — the real, gated case study — through
   the same store path every other launcher uses.

   The screen treatment is a dot screen, not the booth's true dither:
   PhotoBooth's per-pixel canvas passes are priced for a still, and a
   60fps loop cannot pay per-frame ink. A printed halftone overlay plus a
   small contrast push reads as the same 1992 print language at zero
   per-frame cost (transform/opacity/filter-constant only). Ink derives
   from --content via color-mix — no minted color. Reduced motion mounts
   the poster under the same screen, the shelf's own law. */

const SLUG = 'family-hub'

export function HubPlayer() {
  const reduced = useReducedMotion()
  const open = useWindows((s) => s.open)
  const c = getCase(SLUG)
  const box = c?.box
  if (!c || !box) return null

  const play = () => {
    sfx.open()
    open(`case:${SLUG}`)
  }

  return (
    <div className={styles.player}>
      {/* the screen: film under the dot screen. aria-hidden — the info
          panel below carries every word a reader needs. */}
      <div className={styles.screen} aria-hidden="true">
        {box.video && !reduced ? (
          <video src={box.video} poster={box.art?.src} autoPlay muted loop playsInline />
        ) : (
          box.art && <img src={box.art.src} alt="" decoding="async" />
        )}
        <span className={styles.dots} />
      </div>

      {/* the file strip — the reel names itself the way a 1992 player
          window did. LOOP, not a resolution: the honest fact about this
          film is that it never ends. */}
      <div className={styles.strip} aria-hidden="true">
        <span>family-hub_26.avi</span>
        <span>LOOP</span>
      </div>

      <div className={styles.info}>
        <p className={styles.title}>
          {c.name}: SHIPPED <span className={styles.pip} aria-hidden="true" />
        </p>
        {box.thesis && <p className={styles.thesis}>{box.thesis}</p>}
        <div className={styles.foot}>
          <span className={styles.meta}>
            {c.no} · {c.org.toUpperCase()} · {c.year}
          </span>
          <button type="button" className={styles.play} onClick={play}>
            PLAY
          </button>
        </div>
      </div>
    </div>
  )
}

export default HubPlayer
