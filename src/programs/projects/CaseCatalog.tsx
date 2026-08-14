'use client'

import { useReducedMotion } from 'motion/react'
import type { CaseDef } from '@/programs/projects/cases'
import styles from './catalog.module.css'

/* CASE OVERVIEW PAGE — MOCK, ROUND 2 (case-rail, unwired).

   Round 1 printed the literal box front above the back-panel copy and Jake
   struck it: "lets move away from the box metaphor... take the copy from
   the box front to the page using our type ramp... currently there are too
   many type styles and sizes in there."

   So round 2 is the reference portfolio's anatomy in our materials: the
   cover FILM full-bleed at the top (the one thing kept from the box — it
   keeps playing), then a single copy column on the page ground running
   eyebrow → display title → meta → OVERVIEW → quote → OUTCOME card → one
   action row. Every register maps to the token ramp and nothing else:
   label / display / body-lg / body / caption. No boxart faces, no
   width-derived sizes, no cover inks.

   Content is cases.ts data re-homed, nothing minted — with ONE flagged
   exception: the meta line's role. The reference sets "Web Designer & Art
   Director · 2025" there; our CaseDef carries no role field for this case,
   so the mock prints Jake's public title (Staff Product Designer — his
   ruling, 2026-06) as a PLACEHOLDER. Jake confirms or rewrites it before
   this graduates; if it stays, `role` becomes a CaseDef field.

   Still unwired and stringly on purpose: literals mirror copy.json values
   (PLAY is shelf.play); t()/Copy wiring happens only if this graduates to
   the case's opening screen (case:<slug> and /projects/<slug>). */

export function CaseCatalog({ c }: { c: CaseDef }) {
  const reduced = useReducedMotion()
  const box = c.box
  const art = box?.art
  /* the film, still playing at the top — Jake's one keep from the box.
     Reduced motion mounts the poster instead, same law as the shelf. */
  const film = box?.video && !reduced ? box.video : null

  return (
    <article className={styles.page}>
      <div className={styles.hero}>
        {film ? (
          <video
            src={film}
            poster={art?.src}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        ) : (
          art && (
            <img src={art.src} alt="" width={art.w} height={art.h} decoding="async" />
          )
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.eyebrow}>{c.org.toUpperCase()}</p>
        <h1 className={styles.title}>{c.name}</h1>
        {/* ⚠️ role is the flagged placeholder — see the header note */}
        <p className={styles.meta}>Staff Product Designer · {c.year}</p>

        <section className={styles.section}>
          <h2 className={styles.label}>OVERVIEW</h2>
          {box?.thesis && <p className={styles.lede}>{box.thesis}</p>}
        </section>

        {box?.blurb && (
          <blockquote className={styles.quote}>
            <p>&ldquo;{box.blurb.quote}&rdquo;</p>
            <footer>{box.blurb.source}</footer>
          </blockquote>
        )}

        {box?.requirements?.length ? (
          <section className={styles.outcome}>
            <h2 className={styles.label}>OUTCOME</h2>
            <dl className={styles.ledger}>
              {box.requirements.map((r) => (
                <div key={r.label}>
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <div className={styles.actions}>
          <button type="button" className={styles.primary}>
            PLAY
          </button>
          <button type="button" className={styles.secondary}>
            SEND EMAIL
          </button>
        </div>
      </div>
    </article>
  )
}
