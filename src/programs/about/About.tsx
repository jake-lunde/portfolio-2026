'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { sfx } from '@/lib/sound'
import { BASE } from '@/lib/base'
import { REPO_URL } from '@/lib/repo'
import { OS_VERSION } from '@/lib/version'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import styles from '../programs.module.css'

/* A data value runs longer than the label column leaves room for, and
   wrapping breaks the list's grid — the second line lands under the
   LABEL, which reads as a typo. So a value that outgrows its rail
   crawls instead, on the skills ticker's mechanic: a duplicated track
   sliding translateX(-50%) on a linear loop. Speed, not duration, is
   what matches — the menu-bar ticker walks its line at roughly 35px/s,
   so each rail is timed off its own measured width.
   Overflow is measured, never guessed at a breakpoint: on a phone most
   rows crawl, in a wide window only FOCUS does, and a resize re-decides.
   Reduced motion gets the ticker's static treatment (one line,
   ellipsis), with the whole string still in the DOM for screen readers
   and on hover. */

const CRAWL_PX_PER_SEC = 35
const CRAWL_GAP = '\u00a0\u00a0✦\u00a0\u00a0' // nbsp: the loop's seam must not collapse

/** One value cell. `ghost` is the same words as `children` in plain
    text — the loop's second copy, scenery only, so a link in the real
    half is never duplicated into the tab order. */
function DataValue({ children, ghost }: { children: ReactNode; ghost: string }) {
  const reduced = useReducedMotion()
  const railRef = useRef<HTMLSpanElement>(null)
  const halfRef = useRef<HTMLSpanElement>(null)
  const [over, setOver] = useState(false)
  const [dur, setDur] = useState(12)

  // the README window resizes, the skin swaps the string and the face:
  // re-measure on both ends of the rail rather than once on mount
  useEffect(() => {
    const rail = railRef.current
    const half = halfRef.current
    if (!rail || !half) return
    const measure = () => {
      const w = half.getBoundingClientRect().width
      setOver(w > rail.clientWidth + 1)
      setDur(Math.max(6, Math.round(w / CRAWL_PX_PER_SEC)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(rail)
    ro.observe(half)
    return () => ro.disconnect()
    // a skin swaps the words (this dep) and the face (the observer sees it)
  }, [ghost])

  const crawl = over && !reduced

  return (
    <span
      ref={railRef}
      className={styles.dataRail}
      title={over && !crawl ? ghost : undefined}
    >
      <span
        className={
          crawl ? `${styles.dataTrack} ${styles.dataCrawl}` : styles.dataTrack
        }
        style={crawl ? { animationDuration: `${dur}s` } : undefined}
      >
        <span ref={halfRef} className={styles.dataHalf}>
          {children}
          {crawl ? <span aria-hidden="true">{CRAWL_GAP}</span> : null}
        </span>
        {/* the second copy is scenery: it closes the loop, and it is the
            same words, so it stays out of the accessibility tree */}
        {crawl ? (
          <span
            className={`${styles.dataHalf} ${styles.dataGhost}`}
            aria-hidden="true"
          >
            {ghost}
            {CRAWL_GAP}
          </span>
        ) : null}
      </span>
    </span>
  )
}

const EMAIL = 'jakelunde@me.com'

export default function About() {
  const open = useWindows((s) => s.open)
  // the ghost copies are plain strings, so this reads the same skin the
  // copy layer does
  const skin = useSettings((s) => s.skin)

  return (
    <div className={styles.about}>
      {/* the business card, issued as postage (Kyoto Forest format) */}
      <div className={styles.stampCard}>
        <span className={styles.stampPerf} aria-hidden="true" />
        <div className={styles.stampType}>
          {/* the stamp IS the name — the old <h1> line under it was a
              second, redundant billing, so the heading lives here now */}
          <h1 className={styles.stampName}>
            JAKE
            <br />
            LUNDE
          </h1>
          <div className={styles.stampRole}>
            DESIGN ENGINEER <span aria-hidden="true">✂⌘✶☺</span>
          </div>
          <div className={styles.stampYear} aria-hidden="true">
            <span>19</span>
            <span>92</span>
          </div>
          <div className={styles.stampMeta}>
            STAFF PRODUCT DESIGNER · GREENLIGHT
            <br />
            SEATTLE, WA ·{' '}
            <a href="mailto:jakelunde@me.com">JAKELUNDE@ME.COM</a>
          </div>
        </div>
        <div className={styles.stampPlate} aria-hidden="true">
          <span className={styles.stampMark} />
        </div>
      </div>
      <Copy k="readme.eyebrow" as="p" className={styles.aboutEyebrow} />
      <p>
        I&rsquo;m Jake, and I&rsquo;ve been designing solutions for humans and businesses for over 10 years. Until recently design has contributed prototypes, flows and motion specs, but today we have the tools to take more ownership and sell the vision. That&rsquo;s what I&rsquo;m doing at Greenlight.</p>
       <p>As an AI native, I've finally stepped into a design
        engineer role, even shipping production code. Currently I&rsquo;m leading design on
        Greenlight&rsquo;s{' '}
        <a href="https://greenlight.com/family-hub" target="_blank" rel="noreferrer">
          Family Hub
        </a>{' '}
        and our investing product for kids.
      </p>
      <p>
        Not to be grandiose, but this site is my testament. It's a small operating system I will continue designing and orchestrating
        that will never be complete. I&rsquo;ve dreaded updating my website for years, but new
        tools have truly made it a joy. I hope you like it.
      </p>
      <ul className={styles.aboutList}>
        <li>
          <Copy k="readme.label.now" as="span" className={styles.k} />
          <DataValue ghost={t('readme.now', skin)}>
            <Copy k="readme.now" as="span" />
          </DataValue>
        </li>
        <li>
          <Copy k="readme.label.focus" as="span" className={styles.k} />
          <DataValue ghost={t('readme.focus', skin)}>
            <Copy k="readme.focus" as="span" />
          </DataValue>
        </li>
        <li>
          <Copy k="readme.label.contact" as="span" className={styles.k} />
          <DataValue ghost={EMAIL}>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </DataValue>
        </li>
        <li>
          <Copy k="readme.label.system" as="span" className={styles.k} />
          {/* version from the shared constant, stack list still editable —
              this line used to hardcode v0.1 while the menu bar said v0.2.
              The row ends on the repo, because a README that claims a stack
              should hand over the thing itself. The ghost copy is the same
              words in plain text (the link lives only in the real half, so
              the crawl never doubles it into the tab order). */}
          <DataValue
            ghost={`LUNDE OS ${OS_VERSION} · ${t('readme.system', skin)} · ${t('readme.source', skin)} ↗`}
          >
            LUNDE OS {OS_VERSION} · <Copy k="readme.system" as="span" /> ·{' '}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Copy k="readme.source" as="span" /> ↗
            </a>
          </DataValue>
        </li>
      </ul>
      {/* README used to end with CLAUDE introducing itself and an ASK MY AI
          bubble. Two other doors now lead to the same room — the ? in the
          menu bar and COMMAND.CTR's wire — so the window ends on the spec
          list, where a README should. */}
    </div>
  )
}
