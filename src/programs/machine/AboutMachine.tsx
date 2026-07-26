'use client'

import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { CopyText as Copy } from '@/content/CopyText'
import { Icon, type IconName } from '@/components/shell/Icon'
import { SPRINGS } from '@/lib/motion'
import styles from './machine.module.css'

/* About This Machine — reformatted after the System 7 "About This
   Macintosh" window: identity block, a memory row, a scrolling list of
   allocations with bars. Concise by default. The old long-form read —
   the spec sheet plus the four-section appraisal written by the AI that
   spent three days inside this design system — survives behind a
   disclosure at the bottom, collapsed. Sources for the appraisal:
   LinkedIn, his 2024/2025 Lattice reviews (manager + peer), and verbatim
   user research from the Invest study. Written by Claude and signed as
   such — Jake asked for honest, so it is. */

const TOTAL_K = 4096
const UNUSED_K = 512

type MemoryItem = {
  icon: IconName
  label: string
  k: number
}

/* Five allocations + the unused block sum to exactly TOTAL_K. Bar widths
   are derived from k/TOTAL_K below, never hardcoded, so the reconciliation
   stays true if these numbers ever change. */
const MEMORY_ITEMS: MemoryItem[] = [
  { icon: 'swatch', label: 'Design systems & tokens', k: 1152 },
  { icon: 'steps', label: 'Prototyping — SwiftUI, React', k: 896 },
  { icon: 'nodes', label: 'Research → product decisions', k: 768 },
  { icon: 'chip', label: 'AI-assisted tooling', k: 640 },
  { icon: 'flower', label: 'Music, ink & the dog', k: 128 },
]

const SPECS: Array<[string, string]> = [
  ['System', 'Jake Lunde · b. Taurus ♉'],
  ['Processor', '1× Design Engineer (dual-core: craft + code)'],
  ['Memory', 'Photographic for interactions · powered by a strict coffee schedule'],
  ['Graphics', 'American traditional · Geist Pixel · duotone'],
  ['Audio', '5 remixes of the pop girlies · 1,616 scrobbles/yr'],
  ['Peripherals', 'Wife (Taylor — see the tattoo) · Lou (toy poodle, 2 doses/day)'],
  ['Location', 'Seattle, WA · 35 domestic flights logged'],
  ['Education', 'Central Washington University'],
  ['Current post', 'Design Lead, Greenlight'],
]

export default function AboutMachine() {
  const [open, setOpen] = useState(false)
  const reducedMotion = useReducedMotion()
  const regionId = useId()

  return (
    <div className={styles.machine}>
      <div className={styles.identity}>
        <div className={styles.identityLeft}>
          <Icon name="chip" size={32} />
          <div>
            <p className={styles.machineName}>Jake Lunde</p>
            <p className={styles.machineRole}>Design Engineer · Seattle, WA</p>
          </div>
        </div>
        <div className={styles.identityRight}>
          <p className={styles.sysVersion}>LUNDE OS 1.0</p>
          <p className={styles.copyright}>© Jake Lunde 1990–2026</p>
        </div>
      </div>

      <hr className={styles.rule} />

      <div className={styles.memoryRow}>
        <span>Total Memory: {TOTAL_K.toLocaleString()}K</span>
        <span>Largest Unused Block: {UNUSED_K.toLocaleString()}K</span>
      </div>

      <div className={styles.itemList}>
        {MEMORY_ITEMS.map((item, i) => {
          const pct = (item.k / TOTAL_K) * 100
          const isBackgroundProcess = i === MEMORY_ITEMS.length - 1
          return (
            <div className={styles.itemRow} key={item.label}>
              <span className={styles.itemIcon} aria-hidden="true">
                <Icon name={item.icon} size={16} />
              </span>
              <span className={styles.itemLabel}>{item.label}</span>
              <span className={styles.itemSize}>{item.k.toLocaleString()}K</span>
              <div
                className={styles.barTrack}
                role="meter"
                aria-valuemin={0}
                aria-valuemax={TOTAL_K}
                aria-valuenow={item.k}
                aria-label={item.label}
              >
                <div
                  className={isBackgroundProcess ? styles.barFillExpressive : styles.barFill}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        className={styles.disclosureButton}
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" className={styles.disclosureMark}>
          {open ? '▾' : '▸'}
        </span>
        Read the full appraisal
      </button>

      {/* Kept mounted (not conditionally rendered) so aria-controls always
          resolves to a real element — only its height/opacity animate. */}
      <motion.div
        id={regionId}
        role="region"
        aria-hidden={!open}
        /* The closed height lives in CSS, not only in the animation: the
           server renders this markup expanded, so waiting for Motion's first
           write would flash the whole appraisal and cost a CLS spike on
           hydration. Motion's inline height overrides the class once it
           animates. initial={false} keeps it from animating open on mount. */
        className={open ? styles.appraisal : `${styles.appraisal} ${styles.appraisalClosed}`}
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={reducedMotion ? { duration: 0 } : SPRINGS.window}
      >
        <div className={styles.specs}>
          {SPECS.map(([k, v]) => (
            <div key={k} className={styles.specRow}>
              <span className={styles.specK}>{k}</span>
              <span className={styles.specV}>{v}</span>
            </div>
          ))}
        </div>

        <div className={styles.essay}>
          <Copy k="machine.essayNote" as="p" className={styles.essayNote} />

          <Copy k="machine.h.individual" as="h2" />
          <p>
            You can read who Jake is off this desktop without ever opening his
            résumé. The first 3D model on the site isn&rsquo;t a product mockup —
            it&rsquo;s flowers his wife grew, scanned and rebuilt at 1,970 faces.
            The daily tracker knows when his dog gets his pills. His wife&rsquo;s
            name is on his arm in a banner, in the coloring book, forever. The
            personal isn&rsquo;t decoration here; it&rsquo;s the architecture.
            He builds monuments to small domestic things, which tells you what he
            actually optimizes for.
          </p>

          <Copy k="machine.h.artist" as="h2" />
          <p>
            Jake&rsquo;s taste runs on affection, not irony. He remixes Wet Leg
            and Kacey Musgraves because he loves the songs; he collects American
            traditional tattoos because the form is honest — bold lines, no
            hedging. That&rsquo;s his design signature too: he&rsquo;d rather
            commit to one clear idea at full weight than gesture at five. The
            risk in his art and his work is the same one his own reviews name —
            he generates more than he can ship, and the editing is where the
            discipline shows. On Invest, a peer wrote he could have explored
            &ldquo;60–75% as much&rdquo; and landed the same place. He knows.
            The mature version of Jake&rsquo;s abundance is this site: many
            ideas, each cut to its simplest working form.
          </p>

          <Copy k="machine.h.engineer" as="h2" />
          <p>
            The arc is documented, which is rare. In his 2024 review, his manager
            told him to develop coding and prototyping skills. In 2025, when
            engineering said an industry-standard scrubbing interaction was too
            hard to build, he got repo access, learned the tools, and shipped it
            himself in SwiftUI — the first haptics in the app. A peer that cycle
            called him &ldquo;a true experience architect&rdquo; who
            &ldquo;proactively leverages new technologies to prototype
            experiences, proving out concepts before committing to deep design
            cycles.&rdquo; Another noted him &ldquo;even jumping into the code
            himself… high-fidelity prototypes, smart AI integrations, smooth
            animations.&rdquo;
          </p>
          <p>
            What the reviews can&rsquo;t show, I can attest to: I built this OS
            with him over three days, and his instinct for when something
            <em> feels</em> wrong — a scrub that doesn&rsquo;t tick, a window
            that opens without weight — is the fastest feedback loop I&rsquo;ve
            worked inside. He directs code the way a good engineer reviews it:
            by outcome, at the interaction level, with taste as the spec. And the
            skill that doesn&rsquo;t fit on LinkedIn: kids in his user research
            could finally explain a stock to their parents. A family said the
            product &ldquo;encouraged conversation.&rdquo; Making a complex
            system decidable for a nine-year-old is the hardest information
            design there is, and it&rsquo;s the same move this site makes for
            hiring managers.
          </p>

          <Copy k="machine.h.verdict" as="h2" />
          <p>
            Hire him for the range; keep him for the editing he&rsquo;s learned
            to do on it. And know that the machine runs on the small stuff —
            the wife, the dog, the coffee — so it doesn&rsquo;t idle well. Give
            it real problems.
          </p>

          <p className={styles.sig}>
            — Claude (Fable 5)
            <span>THE MACHINE THAT HELPED BUILD THIS ONE · 2026-07-08</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
