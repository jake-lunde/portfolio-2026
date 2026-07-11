import { Stamp } from '@/components/primitives/Stamp'
import styles from './fieldnotes.module.css'

/* FIELD.NOTES — user-research dossier for the Greenlight Invest study.
   MVP with placeholder-shaped content: the verbatims marked "real" are
   genuine study quotes; participant rows and one card are SAMPLE slots
   Jake will swap for live, anonymized notes later. No invented metrics —
   this is Invest work, 2024–2025, moderated remote sessions. */

type Participant = {
  id: string
  pair: string
  device: string
  tenure: string
}

// SAMPLE — swap for real anonymized ledger. No PII, ever.
const PARTICIPANTS: Participant[] = [
  { id: 'P01', pair: 'PARENT + KID (13)', device: 'PROTOTYPE · IN HAND', tenure: 'EXISTING' },
  { id: 'P02', pair: 'PARENT + KID (11)', device: 'PROTOTYPE · IN HAND', tenure: 'EXISTING' },
  { id: 'P03', pair: 'PARENT + KID (15)', device: 'PROTOTYPE · IN HAND', tenure: 'NEW' },
  { id: 'P04', pair: 'PARENT + KID (9)', device: 'PROTOTYPE · IN HAND', tenure: 'EXISTING' },
  { id: 'P05', pair: 'PARENT + KID (14)', device: 'PROTOTYPE · IN HAND', tenure: 'NEW' },
  { id: 'P06', pair: 'PARENT + KID (12)', device: 'PROTOTYPE · IN HAND', tenure: 'EXISTING' },
]

type Verbatim = {
  quote: string
  who: string
  pending?: boolean
  founding?: boolean
}

const VERBATIMS: Verbatim[] = [
  { quote: 'The numbers meant nothing to me.', who: 'Kid, 13', founding: true },
  { quote: 'It encouraged conversation.', who: 'Parent, user research' },
  { quote: '', who: '', pending: true },
]

// insight → design move. One line pair each.
const SYNTHESIS: Array<[string, string]> = [
  ['Kids read context, not numbers', 'Plain-language detail screens'],
  ['Kids decide socially, with family', 'Economic Moat map'],
  ['Families talk when they get curious', 'Help-Me-Decide flow'],
]

export default function FieldNotes() {
  return (
    <div className={styles.notes}>
      {/* ---------- header ---------- */}
      <p className={styles.eyebrow}>Study 01 — Invest Detail Screens</p>
      <h1 className={styles.question}>
        Can a kid decide anything from a balance sheet?
      </h1>

      <div className={styles.methodRow}>
        <div className={styles.method}>
          <span className={styles.methodK}>Method</span>
          <span className={styles.methodV}>
            Moderated remote sessions · parent + kid pairs · prototype in hand
          </span>
        </div>
        <div className={styles.stampSlot}>
          <Stamp>Dates Redacted</Stamp>
        </div>
      </div>

      <hr className={styles.rule} />

      {/* ---------- participant ledger ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>01 —</span>
        <span className={styles.secLabel}>Participant Ledger</span>
        <span className={styles.sampleStamp}>Sample · Live Notes Pending</span>
      </div>

      <div className={styles.ledger}>
        <div className={`${styles.ledgerRow} ${styles.ledgerHead}`}>
          <span>ID</span>
          <span>PAIR</span>
          <span>SETUP</span>
          <span>ACCT</span>
        </div>
        {PARTICIPANTS.map((p) => (
          <div key={p.id} className={styles.ledgerRow}>
            <span className={styles.ledgerId}>{p.id}</span>
            <span>{p.pair}</span>
            <span className={styles.ledgerDim}>{p.device}</span>
            <span className={styles.ledgerDim}>{p.tenure}</span>
          </div>
        ))}
      </div>

      <hr className={styles.rule} />

      {/* ---------- verbatim wall ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>02 —</span>
        <span className={styles.secLabel}>Verbatim Wall</span>
      </div>

      <div className={styles.cards}>
        {VERBATIMS.map((v, i) => (
          <figure
            key={i}
            className={`${styles.card} ${v.pending ? styles.cardPending : ''} ${
              v.founding ? styles.cardFounding : ''
            }`}
          >
            {v.pending ? (
              <div className={styles.pendingInner}>
                <Stamp tone="pink">Pending</Stamp>
                <span className={styles.pendingNote}>Verbatim slot reserved</span>
              </div>
            ) : (
              <>
                {v.founding && (
                  <span className={styles.foundingTag}>Founding quote</span>
                )}
                <blockquote className={styles.quote}>
                  &ldquo;{v.quote}&rdquo;
                </blockquote>
                <figcaption className={styles.cite}>— {v.who}</figcaption>
              </>
            )}
          </figure>
        ))}
      </div>

      <hr className={styles.rule} />

      {/* ---------- synthesis ---------- */}
      <div className={styles.sectionHead}>
        <span className={styles.secNo}>03 —</span>
        <span className={styles.secLabel}>What We Heard → What We Built</span>
      </div>

      <div className={styles.synth}>
        {SYNTHESIS.map(([heard, built], i) => (
          <div key={i} className={styles.synthRow}>
            <span className={styles.synthHeard}>{heard}</span>
            <span className={styles.synthArrow} aria-hidden="true">
              →
            </span>
            <span className={styles.synthBuilt}>{built}</span>
          </div>
        ))}
      </div>

      <p className={styles.foot}>
        Greenlight Invest · user research · 2024–2025 · verbatims real, ledger
        sampled for display
      </p>
    </div>
  )
}
