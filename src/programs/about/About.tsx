'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { sfx } from '@/lib/sound'
import { BASE } from '@/lib/base'
import { OS_VERSION } from '@/lib/version'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import styles from '../programs.module.css'

/* FOCUS runs longer than the label column leaves room for, and wrapping
   broke the list's grid. So it crawls, on the skills ticker's mechanic:
   a duplicated track sliding translateX(-50%) on a linear loop. Speed,
   not duration, is what matches — the menu-bar ticker walks its line at
   roughly 35px/s, so this one is timed off its measured width.
   It only engages when the text actually overflows its rail; reduced
   motion gets the ticker's static treatment (one line, ellipsis), with
   the whole string still in the DOM for screen readers and on hover. */

const CRAWL_PX_PER_SEC = 35
const CRAWL_GAP = '\u00a0\u00a0✦\u00a0\u00a0' // nbsp: the loop's seam must not collapse

function FocusLine() {
  const skin = useSettings((s) => s.skin)
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
  }, [skin])

  const crawl = over && !reduced
  const line = t('readme.focus', skin)

  return (
    <span
      ref={railRef}
      className={styles.focusRail}
      title={over && !crawl ? line : undefined}
    >
      <span
        className={
          crawl ? `${styles.focusTrack} ${styles.focusCrawl}` : styles.focusTrack
        }
        style={crawl ? { animationDuration: `${dur}s` } : undefined}
      >
        <span ref={halfRef} className={styles.focusHalf}>
          <Copy k="readme.focus" as="span" />
          {crawl ? <span aria-hidden="true">{CRAWL_GAP}</span> : null}
        </span>
        {/* the second copy is scenery: it closes the loop, and it is the
            same words, so it stays out of the accessibility tree */}
        {crawl ? (
          <span
            className={`${styles.focusHalf} ${styles.focusGhost}`}
            aria-hidden="true"
          >
            {line}
            {CRAWL_GAP}
          </span>
        ) : null}
      </span>
    </span>
  )
}

export default function About() {
  const open = useWindows((s) => s.open)

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
            DESIGN ENGINEER <span aria-hidden="true">設計技師</span>
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
        I&rsquo;m a product designer shipping production code — a design
        engineer. Over ten years of product work in consumer
        products, digital and physical, most recently leading design on
        Greenlight&rsquo;s{' '}
        <a href="https://greenlight.com/family-hub" target="_blank" rel="noreferrer">
          Family Hub
        </a>{' '}
        and our investing product for kids.
      </p>
      <p>
        This site is the argument: <span className="hl-pink">LUNDE&nbsp;OS</span>{' '}
        is a small operating system I will continue designing and orchestrating
        iteratively. I&rsquo;ve dreaded updating my website for years — new
        tools have truly made it a joy. I hope you like it. Open{' '}
        <a
          href={`${BASE}/cases`}
          onClick={(e) => {
            e.preventDefault()
            sfx.open()
            open('progress')
          }}
        >
          Case Studies
        </a>{' '}
        to read the work.
      </p>
      <ul className={styles.aboutList}>
        <li>
          <Copy k="readme.label.now" as="span" className={styles.k} />
          <Copy k="readme.now" as="span" />
        </li>
        <li className={styles.focusRow}>
          <Copy k="readme.label.focus" as="span" className={styles.k} />
          <FocusLine />
        </li>
        <li>
          <Copy k="readme.label.contact" as="span" className={styles.k} />
          <a href="mailto:jakelunde@me.com">jakelunde@me.com</a>
        </li>
        <li>
          <Copy k="readme.label.system" as="span" className={styles.k} />
          {/* version from the shared constant, stack list still editable —
              this line used to hardcode v0.1 while the menu bar said v0.2 */}
          <span>
            LUNDE OS {OS_VERSION} — <Copy k="readme.system" as="span" />
          </span>
        </li>
      </ul>
      {/* README used to end with CLAUDE introducing itself and an ASK MY AI
          bubble. Two other doors now lead to the same room — the ? in the
          menu bar and COMMAND.CTR's wire — so the window ends on the spec
          list, where a README should. */}
    </div>
  )
}
