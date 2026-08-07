'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Stamp } from '@/components/primitives/Stamp'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import { sfx } from '@/lib/sound'
import type { CaseDef } from '@/programs/projects/cases'
import { useSettings } from '@/store/settings'
import { Box3D } from './Box3D'
import { InstallBar } from './InstallBar'
import styles from './shelf.module.css'

/* One box on the shelf. Front is key art (or a front composed from tokens
   when the case has no assets yet); back is the panel every 1992 box had —
   system requirements, a review blurb, screenshots, and the button.

   Pass 2 gave the box real thickness: the two faces are now the front and
   back of a Box3D cuboid (see Box3D.tsx), and the flip is one rotateY on
   the whole solid rather than two faces faking their own perspective.

   That needs a live 3D context, which `filter` flattens — so the shelf's
   registry entry carries `noRecede` (the shell's unfocused-window
   `filter: opacity()` is skipped for this window) and medieval's
   #lunde-roughen stays on descendants of a face (the bar track) and never
   on an ancestor. Never put a filter on an ancestor of a face.

   useId is unsafe in programs (dynamic imports rehydrate into a reshaped
   tree), so ids derive from the slug — stable across SSR and client. */

/** the year printed as a version number: 2024–25 → 2024.25 */
const version = (year: string) => year.replace(/[–—-]/g, '.')

export function ShelfBox({
  c,
  index,
  count,
  sent,
  busy,
  durable,
  onNudge,
  onPlay,
}: {
  c: CaseDef
  index: number
  count: number
  sent: boolean
  busy: boolean
  durable: boolean
  onNudge: (slug: string) => void
  onPlay: (slug: string, trigger: HTMLElement) => void
}) {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const [flipped, setFlipped] = useState(false)
  const front = useRef<HTMLButtonElement>(null)
  const back = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  const backId = `shelf-${c.slug}-back`
  const box = c.box
  const pct = c.progress?.pct ?? 0
  const shipped = c.status === 'live' && Boolean(c.component)

  /* focus follows the flip: into the back panel's first live control, and
     back to the button that turned the box over */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (flipped) {
      const first = back.current?.querySelector<HTMLElement>('button:not([disabled])')
      ;(first ?? back.current)?.focus()
    } else {
      front.current?.focus()
    }
  }, [flipped])

  /* Rotation lives on the cuboid now (Box3D). All a face animates is
     opacity, and only under reduced motion — where the solid collapses to
     a flat stack and the two faces crossfade instead of turning. At full
     motion this resolves to a constant 1 and Motion writes nothing. */
  const faceFade = (isBack: boolean) => ({ opacity: reduced && flipped !== isBack ? 0 : 1 })

  return (
    <Box3D
      flipped={flipped}
      // the Escape ladder: an open overlay eats the first one, a flipped
      // box the next, and only then does Window.tsx close the window
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !flipped) return
        e.stopPropagation()
        setFlipped(false)
      }}
      front={
        <motion.button
          ref={front}
          type="button"
          className={`${styles.face} ${styles.frontFace}`}
          aria-expanded={flipped}
          aria-controls={backId}
          inert={flipped}
          onClick={() => {
            sfx.tap()
            setFlipped(true)
          }}
          initial={faceFade(false)}
          animate={faceFade(false)}
          transition={{ duration: reduced ? 0.14 : 0 }}
        >
          {box?.art ? (
            <span className={styles.art} aria-hidden="true">
              {/* duotone in CSS, not a pipeline: grayscale + an accent
                  multiply/screen layer, so it re-skins for free */}
              <img src={box.art} alt="" width={600} height={800} draggable={false} />
            </span>
          ) : (
            <span className={styles.composed} aria-hidden="true">
              <span className={styles.bigNo}>{c.no}</span>
            </span>
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

          <span className={styles.frontMeta}>
            <span className={styles.boxName}>{c.name}</span>
            <span className={styles.badge}>{c.org}</span>
            <span className={styles.version}>
              <Copy k="shelf.versionLabel" as="span" /> {version(c.year)}
            </span>
          </span>
          <span className={styles.frontHint}>
            <Copy k="shelf.flip" as="span" />
          </span>
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

            {box?.thesis && <p className={styles.thesis}>{box.thesis}</p>}

            {box?.requirements?.length ? (
              <>
                <Copy k="shelf.requirements" as="h4" className={styles.backHead} />
                <dl className={styles.reqs}>
                  {box.requirements.map((r) => (
                    <Fragment key={r.label}>
                      <dt>{r.label}</dt>
                      <dd>{r.value}</dd>
                    </Fragment>
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

            {box?.shots?.length ? (
              <ul className={styles.shots}>
                {box.shots.map((src) => (
                  <li key={src}>
                    {/* fixed 16/9 frames, object-fit: cover — the slot is
                        the same size before and after the bytes land */}
                    <img src={src} alt="" width={160} height={90} draggable={false} />
                  </li>
                ))}
              </ul>
            ) : null}

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
              </div>
            )}
          </div>

          {/* PLAY is the whole reason the box turns over: full width, its
              own register above the fold of the panel, nothing sharing the
              row with it. */}
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

          {/* the mirror of `.frontHint`: the front's bottom bar turns the
              box over, and so does the back's. Same geometry, quieter fill
              — two accent slabs stacked would flatten PLAY's primacy. */}
          <button
            type="button"
            className={styles.flipBackBar}
            onClick={() => setFlipped(false)}
            aria-label={`${t('shelf.flipBack', skin)} — ${c.name}`}
          >
            <Copy k="shelf.flipBack" as="span" />
          </button>
        </motion.div>
      }
    />
  )
}
