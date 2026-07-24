import { CopyText as Copy } from '@/content/CopyText'
import styles from './machine.module.css'

/* About This Machine — the About-This-Mac window, except the machine is
   Jake. Specs up top, then an honest appraisal written by the AI that
   spent three days inside his design system. Sources: LinkedIn, his
   2024/2025 Lattice reviews (manager + peer), and verbatim user research
   from the Invest study. Written by Claude and signed as such — Jake
   asked for honest, so it is. */

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
  return (
    <div className={styles.machine}>
      <Copy k="machine.eyebrow" as="p" className={styles.eyebrow} />

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
    </div>
  )
}
