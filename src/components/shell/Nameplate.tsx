'use client'

import { useSettings } from '@/store/settings'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import styles from './shell.module.css'

/* ABOUT THIS MACHINE, the plaque.

   Who Jake is used to be one double-click deep: it lived inside README,
   on the stamp. A stranger who closed that window, or who arrived on a
   phone (the desk opens on the launcher with every window shut, see
   Desktop.tsx), got a desktop full of programs and no name on any of
   them. Jake's reference (s74) is Mac OS 9's About This Computer box:
   the mark and the name as a header band, then bold-label rows under a
   rule. This is that box, smaller, and it stays on the desk instead of
   hiding behind the Apple menu.

   Two layouts, one markup. On the desktop it is a narrow plaque sitting
   in the icon column right under README, 116px, a hair past the icons,
   so it reads as furniture of that column and not a widget set down on
   the desk. Narrow on purpose: README boots at x 140 (registry.tsx) and
   anything wider than that strip would slide under the window. Below
   720px the launcher has no windows, so the plaque opens out into the
   wide About box proper, full width above the grid.

   Every string is a copy key (nameplate.*), so EDIT.MODE can retitle the
   plaque like everything else. No skin slots: the medieval voice leaves
   proper nouns, job titles and addresses alone (knightspeak.ts says so
   by design), so the plaque reads the same in every skin. */

export function Nameplate() {
  const skin = useSettings((s) => s.skin)

  /* the mailto follows whatever the plaque shows, lowercased: the copy
     layer owns the caps register, the URL scheme wants the address */
  const email = t('nameplate.email', skin)

  /* the LinkedIn link renders only for an https URL: copy.json is
     committable from INSPECT's COPY block, and a copy field is no place
     for a javascript: URL. Blank the key and the row ends at the email. */
  const linkedin = t('nameplate.linkedinUrl', skin).trim()
  const hasLinkedin = linkedin.startsWith('https://')

  return (
    <aside className={styles.nameplate} aria-label="About this machine">
      <div className={styles.plateHead}>
        <span className={styles.plateMark} aria-hidden="true" />
        <Copy k="nameplate.name" as="div" className={styles.plateName} />
      </div>
      <dl className={styles.plateRows}>
        <Copy k="nameplate.label.role" as="dt" className={styles.plateLabel} />
        <Copy k="nameplate.role" as="dd" className={styles.plateValue} />
        <Copy k="nameplate.label.contact" as="dt" className={styles.plateLabel} />
        <dd className={styles.plateValue}>
          <a className={styles.plateLink} href={`mailto:${email.toLowerCase()}`}>
            <Copy k="nameplate.email" as="span" />
          </a>
          {hasLinkedin && (
            <>
              <span className={styles.plateSep} aria-hidden="true">
                {' · '}
              </span>
              <a className={styles.plateLink} href={linkedin} target="_blank" rel="noreferrer">
                <Copy k="nameplate.linkedin" as="span" />
                <span aria-hidden="true">{' ↗'}</span>
              </a>
            </>
          )}
        </dd>
      </dl>
    </aside>
  )
}
