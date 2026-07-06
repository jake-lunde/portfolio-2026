'use client'

import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { BASE } from '@/lib/base'
import styles from '../programs.module.css'

export default function About() {
  const open = useWindows((s) => s.open)

  return (
    <div className={styles.about}>
      <p className={styles.aboutEyebrow}>README — Start here</p>
      <h1 className={styles.aboutName}>Jake Lunde</h1>
      <p>
        I&rsquo;m a principal-level product designer who ships production code —
        a <strong>design engineer</strong>. Ten years of fintech and consumer
        product work, most recently leading design on Greenlight&rsquo;s
        investing product for kids, where the interaction I was told
        couldn&rsquo;t be built is the one I wrote in SwiftUI and shipped.
      </p>
      <p>
        This site is the argument: <span className="hl-pink">LUNDE&nbsp;OS</span>{' '}
        is a small operating system I designed and built by hand. Open{' '}
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
        to read the work; poke around the rest — it&rsquo;s growing.
      </p>
      <ul className={styles.aboutList}>
        <li>
          <span className={styles.k}>Now</span>
          Senior Design Lead, Greenlight — Invest
        </li>
        <li>
          <span className={styles.k}>Focus</span>
          Design systems · interaction code · AI-data products
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
