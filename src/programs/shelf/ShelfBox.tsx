'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Stamp } from '@/components/primitives/Stamp'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import { SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import type { CaseDef, CoverVariant } from '@/programs/projects/cases'
import { useSettings } from '@/store/settings'
import { Box3D } from './Box3D'
import { CoverFilm } from './CoverFilm'
import { InstallBar } from './InstallBar'
import styles from './shelf.module.css'

/* One box on the shelf. Back is the panel every 1992 box had — a thesis,
   a review blurb, system requirements, and the button.

   PASS 5 EMPTIED THAT PANEL OUT. It had grown four data rows, three
   screenshot thumbs and a version line under a thesis and a quote, which
   on a 246px board is six registers of stacked text and no hierarchy at
   all — and the rows were long enough to wrap, so the "requirements" read
   as paragraphs. The thumbs went first: pass 4 gave the FRONT a moving
   cover, and a strip of stills on the back is the same promise made worse.
   Then the ledger was cut to exactly three rows and printed BIGGER — a box
   back is read at arm's length, and three lines you can read beat six you
   squint at. The one-line rule is structural (`nowrap` in the CSS, copy
   authored to fit in cases.ts), never a truncation.

   PASS 6 IS THE FRONTS. One composition in four moods was still one
   composition — Jake's read of the set was "they still feel kind of the same
   because they're using the same soft blur" — so three of the four covers
   now borrow their STRUCTURE from a real box off his reference board (COVER,
   below) and only family-hub keeps the comp he drew. Two smaller rulings
   landed with it: a turned box puts itself back when the pointer leaves the
   slot (`leave`), and the cover film may not be seen until it is genuinely
   playing (CoverFilm.tsx), because the one thing worse than a still cover is
   YouTube's play button printed on the artwork.

   PASS 8 PUTS THE PICTURES IN. Every cover carried a composed front — the
   shelf's index number printed big on a token ground — because there was no
   art to print. Jake's four covers land here, one per case, seated in each
   variant's own plate, and his note is the whole ruling: "the waiting to
   fade in is jarring because the placeholder is just a number." A number is
   a fine placeholder for a picture that doesn't exist and a terrible poster
   frame for a film that is about to roll. So the art IS the resting state on
   all four boxes, the film crossfades over it and back to it at every gate,
   and the composed front is demoted to what happens when a byte range fails
   — reachable, never designed for.

   PASS 10 BRINGS THE FILMS HOME AND THE STILLS BACK. Jake supplied the
   files (public/case/<slug>/box-film.mp4), which dissolved the problem
   passes 6–9 were managing: a native <video> has no chrome to hide and no
   loop boundary to cover, so the six-second gate windows the loader filled
   no longer exist and the loader went with them (Jake: "we don't need the
   loading state anymore"). The art is the poster under the film again —
   on screen for the beat before the first frame and on any failure — and
   the two boxes with no film keep their pictures exactly as pass 8 left
   them.

   THE FRONT IS JAKE'S BOX-ART TEMPLATE (pass 4), built from his Figma: a
   warm cream ground, product photography filling the upper two thirds and
   FEATHERING into the cream rather than stopping at a crop line, a small
   publisher mark at the top left, and a type block standing on the bottom
   left — eyebrow, then the title as large as the face will carry, then the
   promise in italics.

   Two things went in the bin to get there. The duotone is gone: passes 1–3
   put grayscale-under-accent over the art so it read as "treated", and
   Jake's answer was that a cover is a photograph. And the meta strip is
   gone — the name/org/version bar across the foot was the software
   apologising for its own artwork; the title IS the artwork now, and the
   version moved to a quiet line on the back panel where the rest of the
   data lives.

   The feather is a `mask-image` on the plate that holds the art. Mask is a
   grouping property, exactly like filter: it flattens the element it sits
   on. Inside a face — a leaf of the 3D tree — that costs nothing. On an
   ancestor of a face it would collapse the whole cuboid. Same law as the
   registry's `noRecede` (the shell's unfocused `filter: opacity()`) and
   medieval's #lunde-roughen: never a grouping property above a face.

   Pass 3 took the writing off the box; pass 4 moved the handle below it. A
   small tag hangs UNDER the box, outside the cuboid so it never turns with
   it, and it is the accessible control: the aria-expanded / aria-controls
   wiring lives there and focus returns to it. The front face is still a
   button (the whole cover is a hit target, which is what a pointer expects
   of a box you can pick up) but it is out of the tab order and carries no
   state — one control announcing the flip, not two.

   useId is unsafe in programs (dynamic imports rehydrate into a reshaped
   tree), so ids derive from the slug — stable across SSR and client. */

/** the year printed as a version number: 2024–25 → 2024.25 */
const version = (year: string) => year.replace(/[–—-]/g, '.')

/* COVER LAYOUT → CLASS, AND THE FURNITURE THAT COMES WITH IT.

   Four publishers, one shelf. Until pass 6 the four covers shared a single
   composition and disagreed only about lettering, which Jake read straight
   off the shelf as one template in four moods — "they still feel kind of the
   same because they're using the same soft blur". So each layout now borrows
   a real box off his reference board, and the parts that are STRUCTURAL
   rather than typographic are rendered here rather than hidden in CSS: a
   band exists on the cartridge cover and nowhere else, a keyline frame on
   the game cover and nowhere else. The rest of the composition — where the
   picture sits, what contains it, which ground it is printed on — is a set
   of custom properties in shelf.module.css.

   `foot` is the line printed at the bottom of the two covers that have one,
   and the two want different words: the application box prints a CATEGORY
   there (Photoshop's orange "graphic design" bar; ours takes the years, the
   only category a case study honestly has), the game box prints its
   PUBLISHER (Starflight's "ELECTRONIC ARTS"; ours takes the org, which is
   why that cover drops its eyebrow — the house name is not printed twice). */
const COVER: Record<
  CoverVariant,
  { className: string; band?: true; frame?: true; foot?: 'org' | 'year' }
> = {
  figma: { className: styles.vFigma },
  stripe: { className: styles.vStripe, band: true },
  catalog: { className: styles.vCatalog, foot: 'year' },
  nocturne: { className: styles.vNocturne, frame: true, foot: 'org' },
}

/* The tag's arrows are direction, not words: stripped from the accessible
   name so a screen reader says "FLIP — Greenlight Invest" rather than
   spelling out a glyph. The visible chip keeps them. */
const spoken = (s: string) => s.replace(/[←→]/g, '').trim()

export function ShelfBox({
  c,
  index,
  count,
  sent,
  busy,
  durable,
  error,
  fine,
  revealed,
  overlayOpen,
  onReveal,
  onNudge,
  onPlay,
}: {
  c: CaseDef
  index: number
  count: number
  sent: boolean
  busy: boolean
  durable: boolean
  /** this box's own nudge came back with a refusal — printed under the
      button that caused it, which is where pass 7 moved it from the shelf
      footer it used to share with a hint nobody needed */
  error: string | null
  /** hover-capable machine — measured once by the shelf */
  fine: boolean
  /** this box is the one whose tag is out */
  revealed: boolean
  /** the launch layer is up, covering the shelf — see `leave` below */
  overlayOpen: boolean
  onReveal: (slug: string) => void
  onNudge: (slug: string) => void
  onPlay: (slug: string, trigger: HTMLElement) => void
}) {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const [flipped, setFlipped] = useState(false)
  const [live, setLive] = useState(false)
  /** the key art did not load — the composed number takes the plate back */
  const [artFailed, setArtFailed] = useState(false)
  const tag = useRef<HTMLButtonElement>(null)
  const back = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLDivElement>(null)
  /** the value the focus effect last acted on — see the note there */
  const settled = useRef(flipped)
  /** this unflip was the pointer leaving, not a control being pressed */
  const walkedAway = useRef(false)

  const backId = `shelf-${c.slug}-back`
  const box = c.box
  const pct = c.progress?.pct ?? 0
  const shipped = c.status === 'live' && Boolean(c.component)

  /* The cover film mounts on the client only. The shelf window is on screen
     the moment this component exists, so there is nothing to wait for — but
     keeping the video out of the SSR payload keeps the shell lean and the
     first paint the printed art, which is the poster frame anyway. */
  useEffect(() => setLive(true), [])
  const film = shipped && box?.video && live && !reduced ? box.video : null

  /* WHAT THE PLATE PRINTS AT REST (pass 10): the art, on all four boxes.
     The self-hosted films made the pass-9 loader's job disappear — a native
     video fades in over the still within a beat and loops without ever
     dropping back — so the still is a true poster again rather than the
     lingering gap state Jake struck. Reduced motion mounts no film and
     keeps the art; `onError` still falls to the composed number, the last
     resort since pass 8. */
  const art = box?.art && !artFailed ? box.art : null

  /* focus follows the flip: into the back panel's first live control, and
     back to the tag that turned the box over.

     UNLESS THE POINTER SIMPLY LEFT. An auto-unflip (below) is not a request
     for focus — pulling it onto the tag of a box the reader has walked away
     from would steal it from wherever they were going and drag the row along
     with it. Focus still has to LEAVE, because the panel is about to go
     inert; it just goes nowhere rather than somewhere wrong.

     ⚠️ IT ONLY RUNS WHEN THE FLIP ACTUALLY CHANGED, AND THAT GUARD IS LOAD-
     BEARING (pass 7). It used to be a "have I mounted yet" flag, which is a
     different question and the wrong one: an effect can run a second time on
     the SAME value — StrictMode's mount/cleanup/mount is the everyday case —
     and the second run walked straight past the flag into `tag.focus()`.
     Four boxes did that in a row on window open, and focusing a control
     inside a horizontal scroller scrolls the scroller TO IT: the shelf
     opened parked at its right-hand stop with the first two boxes off frame
     (measured, scrollLeft 378 of a possible 378 — Jake's "it starts in the
     middle"). Comparing against the last value the effect acted on is the
     honest test, and it is immune to however many times React runs it.

     `preventScroll` is the structural half of the same fix. Every focus this
     effect performs is a focus onto a box the reader is already looking at —
     they just turned it over — so it has no business moving the row under
     them. Tabbing to a tag still scrolls it into view, because that is the
     browser's own doing and is what a keyboard reader wants. */
  useEffect(() => {
    if (settled.current === flipped) return
    settled.current = flipped
    if (flipped) {
      const first = back.current?.querySelector<HTMLElement>('button:not([disabled])')
      ;(first ?? back.current)?.focus({ preventScroll: true })
    } else if (walkedAway.current) {
      walkedAway.current = false
      const active = document.activeElement
      if (active instanceof HTMLElement && slot.current?.contains(active)) active.blur()
    } else {
      tag.current?.focus({ preventScroll: true })
    }
  }, [flipped])

  /* Rotation lives on the cuboid now (Box3D). All a face animates is
     opacity, and only under reduced motion — where the solid collapses to
     a flat stack and the two faces crossfade instead of turning. At full
     motion this resolves to a constant 1 and Motion writes nothing. */
  const faceFade = (isBack: boolean) => ({ opacity: reduced && flipped !== isBack ? 0 : 1 })

  const turn = (next: boolean, quiet = false) => {
    // an automatic flip-back is not a press: nothing was touched, so nothing
    // clicks. The tap belongs to the control, not to the state.
    if (!quiet) sfx.tap()
    setFlipped(next)
  }

  /* THE BOX PUTS ITSELF BACK WHEN YOU WALK AWAY (pass 6).

     A turned box that stays turned is a box the reader has to close, and a
     shelf where three of four are showing their small print is a filing
     cabinet. So leaving the slot turns it back over — the same gesture that
     pulled the tag out, run in reverse.

     THE ZONE IS THE WHOLE SLOT, box and tag together, which is the only
     reason this can work at all: `pointerleave` does not fire while the
     pointer is anywhere inside, so moving from the back panel DOWN to the
     tag — the single most likely path after reading a panel — never triggers
     it. Same reasoning that put `onPointerEnter` here in pass 4.

     Three refusals, each of them a way this would otherwise be wrong:

     · A KEYBOARD USER IS NOT A POINTER. If the focus inside the slot is
       VISIBLE focus, someone is working the panel with a keyboard and a
       mouse brushing past the box must not close it under them. `:focus-
       visible` is exactly the right question: the flip moves focus into the
       panel either way, but the browser only paints it — and only matches
       here — when the interaction that put it there was a keyboard one.
     · A FINGER CANNOT HOVER. Touch raises pointerleave the moment the
       pointer stops existing, which is immediately after the tap that
       flipped the box. Mouse only, on a fine-pointer machine only.
     · THE LAUNCH LAYER COVERS THE SHELF. Pressing PLAY puts an overlay over
       the box, and the pointer is then over the overlay rather than the
       slot — a leave event we must ignore, or the box the reader launched
       would be face-front behind it and cancelling would land them on a
       cover instead of the panel they came from. */
  const leave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!flipped || overlayOpen) return
    if (!fine || e.pointerType !== 'mouse') return
    const active = document.activeElement
    if (active instanceof HTMLElement && slot.current?.contains(active)) {
      // no :focus-visible support → assume the keyboard, and leave it alone
      let visible = true
      try {
        visible = active.matches(':focus-visible')
      } catch {}
      if (visible) return
    }
    walkedAway.current = true
    turn(false, true)
  }

  const tagKey = flipped ? 'shelf.tag.front' : 'shelf.tag.back'

  /* The tag is OUT when you have reached for this box, and it stays out
     until you reach for another one (Shelf.tsx owns that turn-taking).

     Two more ways in, both non-negotiable rather than nice:
     · `flipped` — a turned box must always offer the way back, even if the
       pointer has since wandered onto a neighbour and taken the reveal with
       it. The control that returns you cannot be the one that vanishes.
     · `!fine` — a finger cannot hover. On touch every tag is simply out;
       there is nothing to reveal and nothing to discover. */
  const show = revealed || flipped || !fine

  const cover = COVER[box?.coverVariant ?? 'figma']

  return (
    <div
      ref={slot}
      className={styles.boxSlot}
      // reaching for the box is what pulls its tag out. On the SLOT, not the
      // box: the tag is inside this element too, so moving the pointer from
      // box to tag never crosses a boundary that would hide the thing being
      // reached for. Touch raises pointerenter on tap as well, though `!fine`
      // has already shown every tag by then.
      onPointerEnter={() => onReveal(c.slug)}
      // and letting go of it is what turns it back over — see `leave`
      onPointerLeave={leave}
      // the a11y path: tab to the tag (or click into the box) and it is out
      // before it is needed. Focus events bubble; pointer ones here do not
      // interfere with it.
      onFocus={() => onReveal(c.slug)}
      // the Escape ladder: an open overlay eats the first one, a flipped
      // box the next, and only then does Window.tsx close the window. It
      // lives here rather than on the box because the tag — the control
      // that holds focus after an unflip — hangs outside the cuboid.
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !flipped) return
        e.stopPropagation()
        turn(false)
      }}
    >
      <Box3D
        flipped={flipped}
        fine={fine}
        front={
          <motion.button
            type="button"
            className={`${styles.face} ${styles.frontFace} ${cover.className}`}
            // the cover is a hit target, not a second announced control:
            // the tag owns the state and the tab stop
            tabIndex={-1}
            inert={flipped}
            onClick={() => turn(true)}
            initial={faceFade(false)}
            animate={faceFade(false)}
            transition={{ duration: reduced ? 0.14 : 0 }}
          >
            {/* THE PLATE — everything that counts as picture, in one node.
                On the figma comp that is what lets one mask feather still
                art, composed ground and cover film into the cream together;
                on the three structured covers it is what lets one clean
                rectangle contain them. It is also the only place a mask may
                live (grouping property, leaf of the 3D tree — see the note at
                the top of this file). */}
            <span className={styles.plate} aria-hidden="true">
              {art ? (
                /* THE PICTURE. Pass 8 put one on every cover; pass 9 leaves
                   it as the resting face of the two boxes that have no film
                   (tooling, interview-pipeline) and as the REDUCED-MOTION
                   face of the two that do. It takes the plate's own treatment
                   because it is a child of the plate: the blob mask and the
                   airbrush on figma, the printed border on the other three.

                   EAGER, and deliberately so. `loading="lazy"` is for pictures
                   below the fold; these four ARE the fold — the shelf window
                   opens with all four in frame — and a lazy cover would fade
                   in after the box it belongs to. Decoding is async because
                   nothing here blocks: the plate is fixed geometry, so an
                   image that arrives late arrives into a hole of exactly its
                   own size and shifts nothing.

                   The alt is written for the one place it can be read — a
                   reader with images off, where "Family Hub box art" is the
                   picture's name rather than a description of a thing that
                   isn't there. The plate stays aria-hidden: the tag below the
                   box is the announced control and it already carries the
                   case name, and a cover that names itself a second time is
                   two labels for one object. */
                <img
                  src={art.src}
                  alt={`${c.name} box art`}
                  width={art.w}
                  height={art.h}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  onError={() => setArtFailed(true)}
                />
              ) : (
                /* THE LAST RESORT — not a designed state since pass 8. A
                   number standing in for a picture is exactly what Jake
                   struck ("the placeholder is just a number"), so this is
                   what a broken byte range falls to and nothing else: the
                   box still prints something rather than a hole. */
                <span className={styles.composed}>
                  <span className={styles.bigNo}>{c.no}</span>
                </span>
              )}

              {/* The cover film: silent, chromeless because it is OURS now
                  (self-hosted, pass 10), pointer-inert, fading in over the
                  printed art on its first painted frame. CoverFilm.tsx has
                  the history of the apparatus this replaced. */}
              {film && <CoverFilm src={film} title={`${c.name} — cover film`} />}
            </span>

            {/* the game box's keyline: the art sits in a printed window
                rather than in the paper. Drawn from the plate's own
                parameters, so it can never come adrift of it. */}
            {cover.frame && <span className={styles.frame} aria-hidden="true" />}

            {/* the cartridge box's rainbow rules, sitting flush on the top
                edge of the picture — the one place on this shelf where ink is
                a literal rather than a token (see shelf.module.css) */}
            {cover.band && <span className={styles.band} aria-hidden="true" />}

            {/* the airbrush — Jake's Figma "Ellipse 2", a conic sweep blurred
                over the art at soft-light. Every 90s cover had one; pass 6
                leaves it to the cover it was drawn for and switches it off on
                the other three (CSS, so medieval can turn it back on). It
                sits AFTER the plate so it glows over the picture, and BEFORE
                the type so the lettering stays untouched on top of it. */}
            <span className={styles.wash} aria-hidden="true" />

            {/* the publisher's mark, top left. No asset, no slot: an empty
                frame where a logo goes is worse than no logo at all. */}
            {box?.mark && (
              <img
                className={styles.mark}
                src={box.mark}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
            )}

            {!shipped && (
              <>
                <span className={styles.sheen} aria-hidden="true" />
                <span className={styles.stampWrap}>
                  <Stamp tone="pink">
                    <Copy k="shelf.indev" as="span" />
                  </Stamp>
                </span>
              </>
            )}

            {/* The type block, standing on the bottom left of the cream —
                eyebrow, title, promise. It sits ON the artwork now instead of
                in a strip beneath it, which is the whole difference between a
                box and a card with a caption. */}
            <span className={styles.type}>
              <span className={styles.frontEyebrow}>{c.org}</span>
              <span className={styles.title}>{c.name}</span>
              {box?.tagline && <span className={styles.tagline}>{box.tagline}</span>}
            </span>

            {/* the line at the foot of the two covers that have one: a
                category bar on the application box, the publisher's
                signature on the game box. The game box hides its eyebrow to
                make room (CSS), so no cover ever prints its house twice. */}
            {cover.foot && (
              <span className={styles.footline}>
                {cover.foot === 'org' ? c.org : c.year}
              </span>
            )}
          </motion.button>
        }
        back={
          <motion.div
            ref={back}
            id={backId}
            className={`${styles.face} ${styles.backFace}`}
            tabIndex={-1}
            inert={!flipped}
            initial={faceFade(true)}
            animate={faceFade(true)}
            transition={{ duration: reduced ? 0.14 : 0 }}
          >
            <div className={styles.backInner}>
              <p className={styles.backTitle}>
                <span className={styles.backNo}>{c.no}</span> {c.name}
              </p>

              {/* the version, rehoused. It used to be printed on the front,
                  under the name — pass 4's box art has no room for a serial
                  number and no reason to carry one, so it moved here, where
                  the rest of the box's small print already lives. */}
              <p className={styles.backVersion}>
                <Copy k="shelf.versionLabel" as="span" /> {version(c.year)}
              </p>

              {box?.thesis && <p className={styles.thesis}>{box.thesis}</p>}

              {box?.requirements?.length ? (
                <>
                  <Copy k="shelf.requirements" as="h4" className={styles.backHead} />
                  {/* Each row is its own element (dl > div > dt+dd is valid
                      HTML and keeps the description-list semantics). It has
                      to be: a shared grid column is sized to the WIDEST
                      label in the set, so one long row used to eat width
                      from every other row and the values wrapped. Row by
                      row, each line only has to clear the panel on its own
                      — which is what makes the one-line rule keepable. */}
                  <dl className={styles.reqs}>
                    {box.requirements.map((r) => (
                      <div key={r.label}>
                        <dt>{r.label}</dt>
                        <dd>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : null}

              {box?.blurb && (
                <blockquote className={styles.blurb}>
                  <p>&ldquo;{box.blurb.quote}&rdquo;</p>
                  <footer>{box.blurb.source}</footer>
                </blockquote>
              )}

              {/* an unshipped box has no hero act to offer, so the nudge
                  stays down here in the body with the thing it's about — the
                  progress meter — rather than pretending to be PLAY */}
              {!shipped && (
                <div className={styles.meter}>
                  <p className={styles.phase}>{c.progress?.phase}</p>
                  <InstallBar
                    pct={pct}
                    role="meter"
                    label={`${c.name}: ${pct}% — ${c.progress?.phase ?? ''}`}
                    delay={0.05 * (index + 1)}
                  />
                  <Copy k="shelf.wrappedHint" as="p" className={styles.wrappedHint} />
                  <div className={styles.nudgeRow}>
                    <button
                      type="button"
                      className={styles.nudgeBtn}
                      onClick={() => onNudge(c.slug)}
                      disabled={!durable || sent || busy}
                      aria-label={`Encourage Jake to work on ${c.name}`}
                    >
                      {sent ? (
                        <Copy k="progress.nudged" as="span" />
                      ) : (
                        <Copy k="progress.nudge" as="span" />
                      )}
                    </button>
                    {count > 0 && (
                      <span className={styles.count} aria-label={`${count} nudges so far`}>
                        · {count}
                      </span>
                    )}
                  </div>
                  {/* the refusal, printed with the button that earned it.
                      Pass 7 deleted the shelf footer this used to live in —
                      an error about ONE box announced under FOUR of them was
                      the whole reason it needed a footer at all. */}
                  {error && (
                    <p className={styles.nudgeError} role="alert">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* PLAY is the whole reason the box turns over: full width, its
                own register at the foot of the panel, nothing sharing the
                row with it — and now nothing beneath it either. */}
            {shipped && (
              <div className={styles.heroAction}>
                <button
                  type="button"
                  className={styles.playBtn}
                  onClick={(e) => onPlay(c.slug, e.currentTarget)}
                >
                  <Copy k="shelf.play" as="span" />
                </button>
              </div>
            )}
          </motion.div>
        }
      />

      {/* THE FLIP TAG, now UNDER the box and hidden until you reach for it.

          Under, because the Figma's box art stands on the shelf and anything
          floating above it competed with the title for the top of the
          silhouette. Hidden, because four permanent chips on a shelf of four
          boxes is four labels; one that arrives when you reach is a handle.

          The band is RESERVED height either way — the tag animates on
          transform and opacity only, so the shelf's layout is identical
          revealed or not, and nothing on this row can ever shift.

          `pointer-events: none` while hidden keeps a tag nobody can see from
          eating a click meant for the box. It stays in the tab order on
          purpose: focus reveals it on the way in, which is the standard
          skip-link bargain and strictly better than a control that keyboard
          users cannot reach at all. */}
      <motion.div
        className={styles.tagRow}
        initial={false}
        animate={{ opacity: show ? 1 : 0, y: show ? 0 : -6 }}
        transition={reduced ? { duration: 0 } : SPRINGS.window}
        style={{ pointerEvents: show ? 'auto' : 'none' }}
      >
        <button
          ref={tag}
          type="button"
          className={styles.tag}
          aria-expanded={flipped}
          aria-controls={backId}
          aria-label={`${spoken(t(tagKey, skin))} — ${c.name}`}
          onClick={() => turn(!flipped)}
        >
          <Copy k={tagKey} as="span" />
        </button>
      </motion.div>
    </div>
  )
}
