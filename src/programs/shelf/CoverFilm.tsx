'use client'

import { useState } from 'react'
import styles from './shelf.module.css'

/* THE COVER FILM, SELF-HOSTED (pass 10).

   This file used to be an apparatus: a lazy YouTube IFrame API script, a
   gate armed by playback transitions, a measured BURN_OFF_MS against the
   player's own furniture, an undocumented caption unload — several hundred
   lines, all of it existing to hide another player's chrome from a box
   cover that could never allow it (Jake: "it can't be seen, it's the
   signature cover"). Jake then downloaded the films, and the apparatus
   retires with the player it was built against: a native <video> paints no
   chrome, ever, and its `loop` seeks instead of restarting, so there is no
   boundary state to hide and nothing for a loader to fill (Jake: "we don't
   need the loading state anymore" — PlateLoader is gone with it).

   What remains is the seat and the fade. The film starts transparent and
   fades in on its first painted frame (`onPlaying` → data-clear, same CSS
   gate as before), with the printed art underneath as the poster — visible
   for the beat before that frame, and permanently if the file fails or
   autoplay is refused, which is exactly what a printed cover is for. A
   failure never paints broken-media furniture: the element simply never
   clears, and the art stays.

   Decorative and pointer-inert throughout: aria-hidden, no tab stop, no
   controls, muted (a requirement of autoplay, not just politeness).
   Reduced motion never mounts this component (ShelfBox drops `film`), so
   nothing here needs a motion query.

   The signal (s52 → s75): the tape look used to be a CSS leaf after the
   video — scanlines and a tracking roll, an approximation of the medium.
   Since s75 the artifacts are IN the file: `scripts/ntsc-bake.mjs` runs
   every frame of the source through ntsc-rs (the real NTSC/VHS signal
   model, compiled to wasm — src/lib/ntsc/ntsc.ts) and the shipped
   box-film.mp4 is the dub. Nothing to overlay, nothing to gate, no
   per-viewer cost; the printed art below is still never dressed as tape
   because the tape is the footage itself. Jake's vault task closed by it:
   "use this framework to make our videos look legit". */

export function CoverFilm({ src, title }: { src: string; title: string }) {
  /** the film has painted a frame — until then the art below is the face */
  const [clear, setClear] = useState(false)

  return (
    <span className={styles.filmWrap} aria-hidden="true">
      <video
        className={styles.coverFrame}
        data-clear={clear ? '' : undefined}
        src={src}
        title={title}
        muted
        loop
        autoPlay
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
        onPlaying={() => setClear(true)}
      />
    </span>
  )
}
