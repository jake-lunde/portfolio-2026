'use client'

import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { BASE } from '@/lib/base'
import { OS_VERSION } from '@/lib/version'
import { CopyText as Copy } from '@/content/CopyText'
import styles from '../programs.module.css'

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
        <li>
          <Copy k="readme.label.focus" as="span" className={styles.k} />
          <Copy k="readme.focus" as="span" />
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
    </div>
  )
}
