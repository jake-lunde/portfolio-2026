import { Stamp } from '@/components/primitives/Stamp'
import styles from './fieldnotes.module.css'

/* RES-13, pre-release. The real dossier (FieldNotes.tsx) stays in the
   drawer until Jake clears it; visitors get the sealed envelope — same
   municipal-notice energy as the locked Trash. */

export default function Sealed() {
  return (
    <div className={styles.sealed}>
      <svg
        width="72"
        height="64"
        viewBox="0 0 36 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* dossier folder, string-tie closure */}
        <path d="M3 7h11l3 3h16v18H3z" />
        <path d="M3 13h30" />
        <circle cx="18" cy="20" r="2.6" />
        <circle cx="27" cy="20" r="2.6" />
        <path d="M20.6 20c2 1.6 4 1.6 3.8 0M16 22.5l-4 4" />
      </svg>
      <Stamp tone="pink">Sealed</Stamp>
      <p className={styles.sealedNote}>
        Document <strong>RES-13</strong> is with the review board. Contents:
        field research, verbatims, and what got built because of them.{' '}
        <strong>Declassification pending.</strong>
      </p>
    </div>
  )
}
