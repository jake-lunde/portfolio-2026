import { Stamp } from '@/components/primitives/Stamp'
import styles from './trash.module.css'

/* The Trash — locked. Eventually it holds the killed ideas ("Grows with
   You" and friends), each with a memo on why it died. Until then:
   municipal notice. */

export default function Trash() {
  return (
    <div className={styles.trash}>
      <svg
        width="64"
        height="72"
        viewBox="0 0 32 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 12h16l-2 20H10z" />
        <path d="M6 8h20M13 8V5h6v3" />
        <path d="M13 16v10M19 16v10" />
        {/* padlock */}
        <rect x="20" y="24" width="11" height="9" rx="1.5" fill="var(--paper-2)" />
        <path d="M22.5 24v-3a3 3 0 0 1 6 0v3" fill="none" />
        <circle cx="25.5" cy="28.5" r="1.2" fill="currentColor" />
      </svg>
      <Stamp tone="pink">Locked</Stamp>
      <p className={styles.note}>
        The bin holds the ideas that didn&rsquo;t ship — and why. Sorting is in
        progress. <strong>Trash day is coming soon.</strong>
      </p>
    </div>
  )
}
