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

   Layout is Jake's mockup (s74): his portrait on the left, dithered in
   the system accent and framed in it, then JAKE LUNDE in the display
   face with the ROLE and CONTACT rows under it. It sits in the DEAD
   CENTRE of the desk (Jake, s77) — the spot every window covers, so the
   card is what a visitor finds when they put the desk away, and it
   recedes with the rest of the desk's contents while anything is open
   (shell.module.css: .nameplate, then .deskObject). Below 720px the same
   card runs full width above the launcher grid, where no window opens.

   The portrait is /plaque-portrait.png, an alpha mask cut from Jake's
   /nameplate.png dither (blue pixels opaque, paper transparent), painted
   in --accent through mask-image so it takes theme and skin for free,
   the same trick as the house mark. Re-cut it from a new dither with
   scripts/plaque-portrait.py if the photo ever changes.

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
    <aside
      className={`${styles.nameplate} ${styles.deskObject}`}
      aria-label="About this machine"
    >
      <div className={styles.plateHead}>
        {/* decorative: the card names him in text right beside it */}
        <span className={styles.platePortrait} aria-hidden="true" />
      </div>
      <div className={styles.plateBody}>
      <Copy k="nameplate.name" as="div" className={styles.plateName} />
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
              <span aria-hidden="true">{' · '}</span>
              <a className={styles.plateLink} href={linkedin} target="_blank" rel="noreferrer">
                <Copy k="nameplate.linkedin" as="span" />
                <span aria-hidden="true">{' ↗'}</span>
              </a>
            </>
          )}
        </dd>
      </dl>
      </div>
    </aside>
  )
}
