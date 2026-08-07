'use client'

import { CopyText as Copy } from '@/content/CopyText'
import styles from './shelf.module.css'

/* THE PLATE LOADER — what a box with a film prints while it is tuning in.

   PASS 9, Jake's note: "throw a loader in there — something fun, maybe
   related to our data viz." The two shipped boxes carried a still product
   shot in the plate for the six-plus seconds the film's gate holds
   (CoverFilm.tsx), and again on every loop boundary. A still that is
   replaced by a moving picture is a poster frame, and pass 8 already
   established what Jake thinks of poster frames — so the plate now shows
   the box doing something instead: a row of bars pulsing under a line in
   the loading register.

   THE IDIOM IS THE SITE'S OWN. Frequency bars are Invest's signature motif
   (`components/case/FrequencyBars.tsx` — hairline verticals, one expressive
   peak) and the visualisers' CRT plates run the same vocabulary. This is
   that motif at box scale, which is why it reads as part of the work rather
   than as a spinner someone dropped in.

   IT IS CSS, NOT A LOOP. Every bar is one `scaleY` keyframe animation with
   its own delay and its own period — transform-only, compositor-only, no
   rAF, no state, no React render for the life of the box. The second beat
   (a soft sweep crossing the field) is one more transform. Two films on
   screen cost twenty-two composited bars and nothing on the main thread.

   IT IS NOT AN ERROR STATE. `data-clear` crossfades it out under the film
   on exactly the same 0.5s the film fades in on, and the gate shutting —
   a loop, a stall, a seek — brings it straight back. The box is tuning,
   not failing; the composed number (ShelfBox) is still the only thing that
   means something broke.

   REDUCED MOTION NEVER SEES IT. No film mounts there, so a loader would be
   a permanent bar chart captioned "TUNING SIGNAL…" that never resolves —
   which reads as broken, the one thing this may not be. ShelfBox keeps the
   still art as the resting face on that path; see the note there.

   Decorative throughout: the plate is `aria-hidden` already, the caption is
   flavour, and nothing here announces a state change on a loop that runs
   every forty-odd seconds. */

/** eleven, not the case-study motif's twenty-two: the plate is 246px wide at
    most and half of it is margin, so the bars have to stay hairlines you can
    still count. Heights and delays are nth-child rules in shelf.module.css —
    the drawing lives in CSS, exactly like the four cover compositions. */
const BARS = 11

export function PlateLoader({ clear }: { clear: boolean }) {
  return (
    <span
      className={styles.plateLoader}
      // the gate, read by CSS — written by the same player state that opens
      // the film (ShelfBox holds it, CoverFilm reports it)
      data-clear={clear ? '' : undefined}
      aria-hidden="true"
    >
      <span className={styles.loaderBars}>
        {Array.from({ length: BARS }, (_, i) => (
          <span key={i} className={styles.loaderBar} />
        ))}
        {/* the second beat: one soft band crossing the field, slower than
            any bar, so the row reads as a signal being swept rather than a
            set of meters bouncing on their own */}
        <span className={styles.loaderSweep} />
      </span>
      <Copy k="shelf.plateLoading" as="span" className={styles.loaderCaption} />
    </span>
  )
}
