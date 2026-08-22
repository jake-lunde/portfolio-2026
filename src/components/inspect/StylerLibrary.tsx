'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { SPRINGS } from '@/lib/motion'
import { libraryEntries } from '@/lib/stylerLibrary'
import { resetAll as stylerResetAll } from '@/lib/stylerTune'
import { specFor } from './stageSpecs'
import { Bench, StylerStage } from './StylerStage'
import { useCopyEditing } from './useCopyEditing'
import styles from './stylerLibrary.module.css'

/* THE SHELF — STYLER's second door, and the one you take when you already
 * know what you want to style.
 *
 * The first door is a pick: arm INSPECT, find a stamp on the desktop, take
 * the chip in the inspector's foot. It is the right door when the component
 * is in front of you and the wrong one every other time, because it makes
 * "show me the stamp" into "go find a stamp". This route answers the other
 * question. Every promoted component on one page, each card the real thing
 * at reading size, one click onto the stage.
 *
 * IT IS NOT A SECOND STAGE. The cards open the same StylerStage the OS
 * opens, with the same blocks, the same three token sets and the same
 * commit band. What this page adds is the host the shell used to be: the
 * body flag, the copy engine's arming, and the teardown that keeps a
 * preview from outliving the room it was made in.
 *
 * NO OS AROUND IT, on purpose. The stage takes the whole viewport anyway
 * and a desktop underneath it would be a desktop nobody sees, paying for a
 * boot sequence, a wallpaper and every widget on it. The skin still lands:
 * the root layout's pre-paint script writes data-skin and data-theme on
 * <html> before anything renders, so the tokens here are the tokens the
 * visitor was last wearing, and hydrate() below tells the store what the
 * document already knows.
 *
 * THE GRID WAITS FOR THE CLIENT. Every thumbnail is a live component and
 * three of them carry buttons of their own, which cannot be server-rendered
 * inside the card's own button without the browser's parser rearranging the
 * markup out from under React. So the shelf draws after mount. Nothing is
 * lost by it — the page has no content a crawler wants, and the narrow
 * check below has to measure the viewport anyway.
 */

/** The floor, and it is the stage's own (InspectShell.tsx's FLOOR, and the
    breakpoint stylerStage.module.css stacks at). A 244px panel and a 384px
    dock either side of a component do not fit under it, and a shelf that
    handed a phone a door into a room it cannot stand up in would be a shelf
    lying about what it has. */
const FLOOR = '(max-width: 900px)'

function Card({
  id,
  layers,
  tokens,
  variant,
  onOpen,
  register,
}: {
  id: string
  layers: number
  tokens: number
  variant: number
  onOpen: (id: string) => void
  register: (id: string, el: HTMLButtonElement | null) => void
}) {
  const skin = useSettings((s) => s.skin)
  const reduced = useReducedMotion()
  const [focused, setFocused] = useState(false)
  const spec = specFor(id)
  if (!spec) return null

  const node = spec.variants(skin)[variant]?.node ?? null

  return (
    <motion.div
      className={styles.card}
      animate={{ y: focused && !reduced ? -3 : 0 }}
      whileHover={reduced ? undefined : { y: -3 }}
      transition={SPRINGS.widget}
    >
      {/* THE PICTURE. `inert` and aria-hidden together, because the two
          jobs are different: aria-hidden takes the sample's own words out
          of the reading (a menubar reads as eight menus otherwise, none of
          which do anything here) and inert takes its buttons out of the tab
          order. Neither is decoration — the sample IS the component — but
          on this page it is a picture of one, and the hit target below is
          the only thing on the card a person can operate.

          The scale lives on .thumbInner and it is doing a second job: a
          transform makes its element the containing block for a `position:
          fixed` descendant, which is the only reason a MenuBar lays itself
          across a 320px card instead of across the viewport. The stage
          leans on the same trick (stageSpecs.tsx). */}
      <span className={styles.thumb} data-thumb={id} aria-hidden="true" inert>
        <span className={styles.thumbInner}>
          <Bench kind={spec.bench}>{node}</Bench>
        </span>
      </span>

      <span className={styles.name}>{id}</span>
      <span className={styles.counts}>
        {layers} {t('styler.layers', skin)} · {tokens} {t('inspect.section.tokens', skin)}
      </span>

      {/* The whole card is the button, drawn as an overlay rather than as a
          wrapper: a <button> may not contain a <button>, and four of the
          five samples have one inside them. One focus stop, the full card
          as the hit area, and the markup stays legal. */}
      <button
        type="button"
        className={styles.hit}
        ref={(el) => register(id, el)}
        onClick={() => onOpen(id)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={`${t('styler.open', skin)} ${id.toUpperCase()} ${t('styler.instyler', skin)}`}
      />
    </motion.div>
  )
}

export function StylerLibrary() {
  const hydrate = useSettings((s) => s.hydrate)
  const router = useRouter()
  const params = useSearchParams()
  const copy = useCopyEditing()
  const [mounted, setMounted] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const cards = useRef(new Map<string, HTMLButtonElement>())

  /* The store reads the document, and on this route nothing else does it:
     MenuBar owns that call on the desktop and there is no MenuBar here
     except the one standing on a card. */
  useEffect(() => {
    hydrate()
    setMounted(true)
  }, [hydrate])

  useEffect(() => {
    const mq = window.matchMedia(FLOOR)
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* WHAT IS OPEN IS WHAT THE URL SAYS. Not a piece of state the URL is kept
     in step with: one truth, read on every render, so a pasted link and a
     click land in exactly the same place and there is no third state where
     the address bar and the screen disagree. `replace` rather than `push`
     because opening a component is not a page, and a visitor who walked six
     cards should get one press of Back out of here, not seven.

     The floor is the one place the param outlives the room, and deliberately:
     under 900px there is no shelf either, so `?c=window` is a request the
     page is holding rather than a claim about what is on screen, and turning
     a phone sideways gives it back. */
  const asked = params.get('c')
  const open = asked && specFor(asked) && !narrow ? asked : null

  const entries = libraryEntries()

  /* Focus goes back to the card that opened the room. The stage drops it on
     its own close button on the way in, so without this a keyboard visitor
     comes out at the top of the document and walks the shelf again. */
  const wasOpen = useRef<string | null>(null)
  useEffect(() => {
    const last = wasOpen.current
    wasOpen.current = open
    if (open || !last) return
    cards.current.get(last)?.focus({ preventScroll: true })
  }, [open])

  /* THE BODY FLAG, written here for the reason InspectShell writes it there:
     the component that decides to draw the room is the one that says so, so
     the flag and the state cannot disagree, and the cleanup runs on every
     exit including a navigation away mid-session. */
  useEffect(() => {
    if (!open) return
    document.body.setAttribute('data-stylerstage', 'on')
    return () => document.body.removeAttribute('data-stylerstage')
  }, [open])

  /* TEARDOWN, the same promise the tool makes on the desktop: a preview
     never outlives the room that made it. Every rebind on the stage is a
     live write to the document root (lib/stylerTune.ts) and the thumbnails
     on this page read that same root, so a stage closed with four pending
     rebinds would hand the shelf four components wearing them. */
  useEffect(() => {
    if (!open) return
    return () => stylerResetAll()
  }, [open])

  const go = (id: string | null) => {
    router.replace(id ? `/styler?c=${id}` : '/styler', { scroll: false })
  }

  return (
    <div className={styles.library}>
      <header className={styles.head}>
        <h1 className={styles.title}>
          <CopyText k="styler.library.title" />
        </h1>
        <p className={styles.sub}>
          <CopyText k="styler.library.sub" />
        </p>
      </header>

      {mounted &&
        (narrow ? (
          <p className={styles.narrow}>
            <CopyText k="styler.library.narrow" />
          </p>
        ) : (
          <div className={styles.grid}>
            {entries.map((entry) => (
              <Card
                key={entry.id}
                id={entry.id}
                layers={entry.layers}
                tokens={entry.tokens}
                variant={entry.variant}
                onOpen={go}
                register={(id, el) => {
                  if (el) cards.current.set(id, el)
                  else cards.current.delete(id)
                }}
              />
            ))}
          </div>
        ))}

      {open && (
        <StylerStage
          componentId={open}
          copy={copy}
          onClose={() => go(null)}
          closeLabelKey="styler.close.library"
        />
      )}
    </div>
  )
}
