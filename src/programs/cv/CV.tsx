'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/primitives/Button'
import { t } from '@/content/copy'
import { CONTACT, SUMMARY, ROLES, SKILLS, EDUCATION, COLOPHON } from '@/content/resume'
import { SPRINGS } from '@/lib/motion'
import { cvSfx, sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import styles from './cv.module.css'

/* CV.EXE — a dot-matrix printer as a program.
 *
 * The gag is the ritual; the substance is the download. What prints on
 * screen is a RENDER of src/content/resume.ts. What TEAR OFF hands over is
 * public/jake-lunde-resume.pdf, built from that same file by
 * scripts/build-cv.mjs, so the two can't disagree.
 *
 * The resume text is ALWAYS in the DOM. Unprinted passes are opacity 0,
 * which a screen reader still reads — deliberate. The feed animation is
 * decoration wrapped around text that is complete from first paint, so an
 * SR user (and reduced-motion) gets the whole document with zero theater.
 *
 * No useId here: programs are dynamic imports in a tree that reshapes at
 * SSR handover, so a generated id mismatches on hydration (see memory).
 * Constant ids instead.
 */

const PDF = '/jake-lunde-resume.pdf'
const STATUS_ID = 'cv-status'

/* One pass per printed group. 22 groups × 165ms ≈ 3.6s, which lands on the
 * plan's ~4s feel target without making a reader wait for their own resume. */
const PASS_MS = 165

type Phase = 'idle' | 'printing' | 'done' | 'tearing'

/* The printout, split into the passes a dot-matrix head would make. Order
 * matches the PDF exactly — same source, same sequence. */
function buildPasses(): ReactNode[] {
  const out: ReactNode[] = [
    <header className={styles.head} key="head">
      <h1 className={styles.name}>{CONTACT.name}</h1>
      <p className={styles.contact}>
        {[CONTACT.email, CONTACT.site, CONTACT.location].join('  ·  ')}
      </p>
    </header>,
    <p className={styles.summary} key="summary">
      {SUMMARY}
    </p>,
    <h2 className={styles.section} key="sec-exp">
      Experience
    </h2>,
  ]

  ROLES.forEach((r, i) => {
    out.push(
      <div className={styles.roleHead} key={`role-${i}`}>
        <span className={styles.roleTitle}>
          {r.title}
          {r.priorTitle ? <span className={styles.promoted}> (promoted from {r.priorTitle})</span> : null}
        </span>
        <span className={styles.roleDates}>{r.dates}</span>
        <span className={styles.roleOrg}>
          {r.org} · {r.location}
        </span>
      </div>,
    )
    r.bullets.forEach((b, j) => {
      out.push(
        <p className={styles.bullet} key={`role-${i}-b-${j}`}>
          {b}
        </p>,
      )
    })
  })

  out.push(
    <h2 className={styles.section} key="sec-skills">
      Skills
    </h2>,
  )
  SKILLS.forEach((g, i) => {
    out.push(
      <p className={styles.skill} key={`skill-${i}`}>
        <span className={styles.skillLabel}>{g.label}</span>
        {g.items.join(' · ')}
      </p>,
    )
  })

  out.push(
    <h2 className={styles.section} key="sec-edu">
      Education
    </h2>,
  )
  EDUCATION.forEach((e, i) => {
    out.push(
      <div className={styles.edu} key={`edu-${i}`}>
        <span className={styles.eduSchool}>{e.school}</span>
        <span className={styles.eduYear}>{e.year}</span>
        <span className={styles.eduDegree}>{e.degree}</span>
      </div>,
    )
  })

  out.push(
    <p className={styles.colophon} key="colophon">
      {COLOPHON}
    </p>,
  )
  return out
}

export default function CV() {
  const skin = useSettings((s) => s.skin)
  const reduced = useReducedMotion()
  const passes = useMemo(buildPasses, [])

  const [phase, setPhase] = useState<Phase>('idle')
  const [printed, setPrinted] = useState(0)
  const feedRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)

  /* Advance one pass at a time. Chatter fires per pass, not per character —
   * a real head prints a line in one sweep. */
  useEffect(() => {
    if (phase !== 'printing') return
    if (printed >= passes.length) {
      setPhase('done')
      return
    }
    const id = setTimeout(() => {
      setPrinted((n) => n + 1)
      cvSfx.chatter()
    }, PASS_MS)
    return () => clearTimeout(id)
  }, [phase, printed, passes.length])

  // the paper keeps moving, so the newest line stays at the platen
  useEffect(() => {
    if (phase !== 'printing') return
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [printed, phase])

  /* When the run finishes, hand the page back at the top. Following the head
     down is right while it prints, but leaving a reader parked on EDUCATION
     means they never see the name on their own resume — you pick a printout
     up and read it from the start. */
  useEffect(() => {
    if (phase !== 'done') return
    const el = feedRef.current
    if (el) el.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }, [phase, reduced])

  useEffect(() => {
    if (phase !== 'tearing') return
    const id = setTimeout(
      () => {
        setPhase('idle')
        setPrinted(0)
      },
      reduced ? 0 : 520,
    )
    return () => clearTimeout(id)
  }, [phase, reduced])

  const onPrint = useCallback(() => {
    // a second press mid-run is FEED: skip the theater, keep the paper
    if (phase === 'printing') {
      setPrinted(passes.length)
      setPhase('done')
      return
    }
    sfx.tap()
    if (reduced) {
      // same information, zero theater
      setPrinted(passes.length)
      setPhase('done')
      return
    }
    setPrinted(0)
    setPhase('printing')
  }, [phase, passes.length, reduced])

  const onTear = useCallback(() => {
    cvSfx.tear()
    linkRef.current?.click()
    setPhase('tearing')
  }, [])

  const status =
    phase === 'printing'
      ? t('cv.statusPrinting', skin)
      : phase === 'done'
        ? t('cv.statusDone', skin)
        : phase === 'tearing'
          ? t('cv.torn', skin)
          : t('cv.statusIdle', skin)

  return (
    <div className={styles.cv} data-phase={phase}>
      <div className={styles.printer}>
        <div className={styles.platen} aria-hidden="true">
          <span className={styles.printHead} />
        </div>
        <div className={styles.controls}>
          <Button size="md" tone="expressive" onClick={onPrint} aria-describedby={STATUS_ID}>
            {phase === 'printing' ? t('cv.feed', skin) : t('cv.print', skin)}
          </Button>
          {/* Always reachable, and ahead of TEAR OFF in tab order: nobody
              should have to operate a toy to get the document. */}
          <a className={styles.quietLink} href={PDF} download>
            {t('cv.download', skin)}
          </a>
          {phase === 'done' ? (
            <Button size="md" tone="system" onClick={onTear}>
              {t('cv.tearOff', skin)}
            </Button>
          ) : null}
        </div>
        <p className={styles.status} id={STATUS_ID} aria-live="polite">
          {status}
        </p>
      </div>

      <div className={styles.feed} ref={feedRef}>
        <span className={styles.sprocket} aria-hidden="true" />
        {/* data-no-translate is load-bearing, not decoration. KnightSpeakLayer
            walks the rendered DOM under the medieval skin and rewrites any
            text that isn't exempt — it was turning "kids" into "younglings"
            and "before" into "ere" inside the resume. A CV is fact, not
            costume, and the printout has to stay byte-identical to the PDF or
            the single-source-of-truth promise is a lie. The chrome around it
            (buttons, status) still translates: those go through copy keys. */}
        <motion.div
          data-no-translate=""
          className={styles.sheet}
          animate={phase === 'tearing' && !reduced ? { y: 24, opacity: 0 } : { y: 0, opacity: 1 }}
          transition={SPRINGS.rise}
        >
          {/* Reveal is CSS, not Motion, on purpose. Motion drives its values
              from rAF, which a hidden tab freezes — a visitor who printed and
              switched tabs would come back to a sheet that says "done" and
              shows nothing. A data attribute + transition is declarative in
              the DOM, so the printed state is correct even when no frame has
              run, and the fade stays on the compositor. */}
          {passes.map((node, i) => (
            <div key={i} className={styles.pass} data-printed={i < printed}>
              {node}
            </div>
          ))}
        </motion.div>
        <span className={styles.sprocket} aria-hidden="true" />
      </div>

      {/* the actual artifact; the button just clicks it */}
      <a ref={linkRef} href={PDF} download hidden aria-hidden="true" tabIndex={-1}>
        {t('cv.download', skin)}
      </a>
    </div>
  )
}
