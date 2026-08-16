'use client'

import { useReducedMotion } from 'motion/react'
import { Button } from '@/components/primitives/Button'
import { getCase } from '@/programs/projects/cases'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import styles from './player.module.css'

/* THE PLAYER — Family Hub's case study standing open on the desktop as a
   film loop, poolsuite.net's player translated into this machine (Jake's
   refresh pass + his Figma mirror pass): the cover film running under a
   print treatment, a file strip naming the reel, and the overview below
   with a CTA pair. It boots open BEHIND README (resolve.ts BOOT_WINDOWS) — the
   desk is set with the work already running on it.

   This is a TEASER SURFACE, so it is deliberately not gated the way the
   case window is: the sphere guards the full read, not the trailer.
   PLAY opens `case:family-hub` — the real, gated case study — through
   the same store path every other launcher uses.

   The screen carries no treatment of its own (s75, Jake: "remove the
   extra filter"). It used to wear a printed halftone dot screen and a
   small contrast push standing in for a per-frame pass the loop could
   not afford; since s75 the film file itself is the ntsc-rs dub
   (scripts/ntsc-bake.mjs), so the tape is in the pixels and anything
   layered over it read as a second filter. Reduced motion mounts the
   poster, bare, the shelf's own law. */

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
      {/* the screen: the baked film, bare. aria-hidden — the info panel
          below carries every word a reader needs. */}
      <div className={styles.screen} aria-hidden="true">
        {box.video && !reduced ? (
          <video src={box.video} poster={box.art?.src} autoPlay muted loop playsInline />
        ) : (
          box.art && <img src={box.art.src} alt="" decoding="async" />
        )}
      </div>

      {/* the file strip — the reel names itself the way a 1992 player
          window did. LOOP, not a resolution: the honest fact about this
          film is that it never ends. */}
      <div className={styles.strip} aria-hidden="true">
        <span>family-hub-26.avi</span>
        <span>LOOP</span>
      </div>

      {/* Jake's Figma pass (mirror round-trip, this session): the title
          takes the display face at heading-1 with a NEW pill (the
          expressive accent's marks-only license), and one PLAY becomes a
          CTA pair — VIEW SITE out to the live product, CASE STUDY into
          the gated read. Meta drops to the sill under both. */}
      <div className={styles.info}>
        <div className={styles.textBlock}>
          <p className={styles.title}>
            {c.name}
            <span className={styles.badge}>NEW</span>
          </p>
          {box.thesis && <p className={styles.thesis}>{box.thesis}</p>}
        </div>
        <div className={styles.foot}>
          <div className={styles.ctas}>
            <Button size="md" tone="system" href="https://greenlight.com/family-hub">
              VIEW SITE
            </Button>
            <Button size="md" tone="system" variant="solid" onClick={play}>
              CASE STUDY
            </Button>
          </div>
          <span className={styles.meta}>
            {c.no} · {c.org.toUpperCase()} · {c.year}
          </span>
        </div>
      </div>
    </div>
  )
}

export default HubPlayer
