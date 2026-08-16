'use client'

import { useSettings } from '@/store/settings'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import styles from './shell.module.css'

/* The machine's asset tag.

   Who Jake is used to be one double-click deep: it lived inside README,
   on the stamp. A stranger who closed that window, or who arrived on a
   phone (the desk opens on the launcher with every window shut, see
   Desktop.tsx), got a desktop full of programs and no name on any of
   them. Not a hero banner and not a bio: every real machine carries a
   little engraved plate on its bezel saying who it belongs to and where
   to write, so this one does too. Two lines, hairline frame, mono caps,
   flat on the desktop rather than raised like the print-shadowed
   widgets, because a plate is screwed to the case, not set on it.

   Every string is a copy key (nameplate.*), so EDIT.MODE can retitle the
   plate the same way it retitles everything else. No skin slots: the
   medieval voice leaves proper nouns, job titles and addresses alone
   (knightspeak.ts says so by design), so an asset tag reads the same in
   every skin, which is what an asset tag should do. */

export function Nameplate() {
  const skin = useSettings((s) => s.skin)

  /* the mailto follows whatever the plate shows, lowercased: the copy
     layer owns the caps register, the URL scheme wants the address. */
  const email = t('nameplate.email', skin)

  /* The LinkedIn link renders only for an https URL: copy.json is
     committable from INSPECT's COPY block, and a copy field is no place
     for a javascript: URL. Blank the key and line 2 ends at the email. */
  const linkedin = t('nameplate.linkedinUrl', skin).trim()
  const hasLinkedin = linkedin.startsWith('https://')

  return (
    <aside className={styles.nameplate} aria-label="Who this machine belongs to">
      <span className={styles.plateScrew} aria-hidden="true" />
      <div className={styles.plateLines}>
        <Copy k="nameplate.line1" as="div" className={styles.plateName} />
        <div className={styles.plateMeta}>
          <a className={styles.plateLink} href={`mailto:${email.toLowerCase()}`}>
            <Copy k="nameplate.email" as="span" />
          </a>
          {hasLinkedin && (
            <>
              <span aria-hidden="true">{' · '}</span>
              <a
                className={styles.plateLink}
                href={linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <Copy k="nameplate.linkedin" as="span" />
                <span aria-hidden="true">{' ↗'}</span>
              </a>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
