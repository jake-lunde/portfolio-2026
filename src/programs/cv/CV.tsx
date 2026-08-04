'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/primitives/Button'
import { useWindowChrome } from '@/components/shell/windowChrome'
import { t } from '@/content/copy'
import { CONTACT, SUMMARY, ROLES, SKILLS, EDUCATION, COLOPHON } from '@/content/resume'
import { SPRINGS } from '@/lib/motion'
import { cvSfx, sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import styles from './cv.module.css'

/* CV.EXE — a dot-matrix printer that sits ON the desk, not in a window.
 *
 * chrome: 'bare' (like the iPod): this component IS the machine. The paper
 * rises out of the platen above the device; the device body is the drag
 * handle. Open by default on desktop (windowsForPath) — furniture, not an
 * app. The gag is the ritual; the substance is the download: the printout
 * is a RENDER of src/content/resume.ts and TEAR OFF hands over
 * public/jake-lunde-resume.pdf, built from the same file, so they can't
 * drift.
 *
 * Mobile (≤720px) is deliberately simpler: no device, no ritual — the page
 * arrives printed with a download bar. A phone gets the document, the desk
 * gets the machine.
 *
 * The resume text is ALWAYS in the DOM (unprinted passes are opacity 0),
 * so screen readers and reduced-motion get the whole document with zero
 * theater. Reveal is CSS (data-printed + transition), never Motion: rAF
 * freezes in hidden tabs and the printed state must survive that.
 *
 * No useId (programs are dynamic imports; generated ids mismatch at SSR
 * handover — see memory). Constant ids instead.
 */

const PDF = '/jake-lunde-resume.pdf'
const STATUS_ID = 'cv-status'

/* One pass per printed group; 22 groups × 165ms ≈ 3.6s of ritual. */
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
          {r.priorTitle ? (
            <span className={styles.promoted}> (promoted from {r.priorTitle})</span>
          ) : null}
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
  const { startDrag } = useWindowChrome()
  const passes = useMemo(buildPasses, [])

  const [phase, setPhase] = useState<Phase>('idle')
  const [printed, setPrinted] = useState(0)
  const paperRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)

  /* Mobile gets the document, not the machine: arrive printed. Decided
   * once on mount — the shell swaps layouts at the same 720px line. */
  useEffect(() => {
    if (window.matchMedia('(max-width: 720px)').matches) {
      setPrinted(passes.length)
      setPhase('done')
    }
  }, [passes.length])

  /* Advance one pass at a time; chatter per pass, not per character — a
   * real head prints a line in one sweep. */
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
    const el = paperRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [printed, phase])

  /* Hand the finished page back at the top — you pick a printout up and
   * read it from the start, not from EDUCATION. */
  useEffect(() => {
    if (phase !== 'done') return
    const el = paperRef.current
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

  /* The device body is the drag handle (bare chrome owns its own frame).
   * Controls opt out — a button press is not a drag. */
  const onDeviceDown = useCallback(
    (e: React.PointerEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.closest('button, a')) return
      startDrag(e)
    },
    [startDrag],
  )

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
      {/* the paper, rising out of the platen. data-no-translate is
          load-bearing: KnightSpeakLayer rewrites untranslated DOM text under
          the medieval skin, and a CV is fact, not costume — the printout
          must stay byte-identical to the PDF. The chrome below still
          translates (SCRIBE / REND) via copy keys. */}
      <div className={styles.paperZone} ref={paperRef}>
        {/* paperLift is the feed mechanic: at idle only a blank leading edge
            pokes out of the platen (translateY in CSS — Motion owns the
            inner element's transform for the tear, so the lift needs its own
            box). Press PRINT and the page rises out of the machine. */}
        <div className={styles.paperLift}>
          <motion.div
            data-no-translate=""
            className={styles.paper}
            animate={phase === 'tearing' && !reduced ? { y: 36, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={SPRINGS.rise}
          >
            <span className={styles.sprocket} aria-hidden="true" />
            <div className={styles.sheet}>
              {passes.map((node, i) => (
                <div key={i} className={styles.pass} data-printed={i < printed}>
                  {node}
                </div>
              ))}
            </div>
            <span className={styles.sprocket} aria-hidden="true" />
          </motion.div>
        </div>
      </div>

      {/* the machine */}
      <div className={styles.device} onPointerDown={onDeviceDown}>
        <div className={styles.deck} aria-hidden="true">
          <span className={styles.knob} />
          <span className={styles.platen}>
            <span className={styles.printHead} />
          </span>
          <span className={styles.knob} />
        </div>
        <div className={styles.body}>
          <div className={styles.brandRow} aria-hidden="true">
            <span className={styles.brand}>LUNDE 1200·D</span>
            <span className={styles.brandSub}>9 PIN · EST. 1992</span>
            <span className={styles.vents} />
          </div>
          <div className={styles.controls}>
            <Button size="md" tone="expressive" onClick={onPrint} aria-describedby={STATUS_ID}>
              {phase === 'printing' ? t('cv.feed', skin) : t('cv.print', skin)}
            </Button>
            {phase === 'done' ? (
              <Button size="md" tone="system" onClick={onTear}>
                {t('cv.tearOff', skin)}
              </Button>
            ) : null}
            {/* always reachable, ahead of TEAR OFF in tab order: nobody
                should have to operate a toy to get the document */}
            <a className={styles.quietLink} href={PDF} download>
              {t('cv.download', skin)}
            </a>
            <span className={styles.leds} aria-hidden="true">
              <span className={styles.ledPower} />
              <span className={styles.ledBusy} />
            </span>
          </div>
          <p className={styles.lcd} id={STATUS_ID} aria-live="polite">
            {status}
          </p>
        </div>
      </div>

      {/* mobile front door: no machine, just the document */}
      <div className={styles.mobileBar}>
        <a className={styles.mobileDownload} href={PDF} download>
          {t('cv.download', skin)}
        </a>
      </div>

      {/* the actual artifact; TEAR OFF just clicks it */}
      <a ref={linkRef} href={PDF} download hidden aria-hidden="true" tabIndex={-1}>
        {t('cv.download', skin)}
      </a>
    </div>
  )
}
