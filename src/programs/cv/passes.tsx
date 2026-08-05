import type { ReactNode } from 'react'
import { CONTACT, SUMMARY, ROLES, SKILLS, EDUCATION, COLOPHON } from '@/content/resume'
import styles from './cv.module.css'

/* The typeset resume, flattened into the passes a dot-matrix head would
   make. Pure function of src/content/resume.ts — the window renders these
   nodes and scripts/build-cv.mjs renders the same data to the PDF, so the
   two can never drift. Order matches the PDF exactly.

   Kept separate from CV.tsx so any future surface (the desk scene's
   physical printer, a case-study plate) can print the same document. */

export function buildPasses(): ReactNode[] {
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
