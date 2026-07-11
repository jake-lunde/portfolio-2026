'use client'

import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { BASE } from '@/lib/base'
import styles from '../programs.module.css'

export default function About() {
  const open = useWindows((s) => s.open)

  return (
    <div className={styles.about}>
      {/* the business card, issued as postage (Kyoto Forest format) */}
      <div className={styles.stampCard}>
        <span className={styles.stampPerf} aria-hidden="true" />
        <div className={styles.stampType}>
          <div className={styles.stampName}>
            JAKE
            <br />
            LUNDE
          </div>
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
      <p className={styles.aboutEyebrow}>README — Start here</p>
      <h1 className={styles.aboutName}>Jake Lunde</h1>
      <p>
        I&rsquo;m a principal-level product designer shipping production code —
        a design engineer. Over ten years of product work in consumer
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
          href={`${BASE}/projects`}
          onClick={(e) => {
            e.preventDefault()
            sfx.open()
            open('projects')
          }}
        >
          Projects
        </a>{' '}
        to read the work.
      </p>
      <ul className={styles.aboutList}>
        <li>
          <span className={styles.k}>Now</span>
          Staff Product Designer, Greenlight
        </li>
        <li>
          <span className={styles.k}>Focus</span>
          Design systems · AI-data products · Helping families work better
        </li>
        <li>
          <span className={styles.k}>Contact</span>
          <a href="mailto:jakelunde@me.com">jakelunde@me.com</a>
        </li>
        <li>
          <span className={styles.k}>System</span>
          LUNDE OS v0.1 — Next.js · Motion · MDX
        </li>
      </ul>
    </div>
  )
}
