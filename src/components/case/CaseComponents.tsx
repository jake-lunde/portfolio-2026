import styles from './case.module.css'
import { CopyText } from '@/content/CopyText'

/* Static case-study vocabulary (§7 anatomy). Interactive islands live
   in their own 'use client' files. */

export function Hero({
  eyebrow,
  title,
  thesis,
  meta,
  art,
}: {
  eyebrow: string
  title: string
  thesis: React.ReactNode
  meta: Array<[string, string]>
  /** header artwork riding beside the thesis (family-hub's living
      sketch, s94b) — the hero owns the slot, the case brings the art */
  art?: React.ReactNode
}) {
  return (
    <header className={styles.hero} data-art={art ? 'true' : undefined}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.thesis}>{thesis}</p>
      {art}
      <div className={styles.meta}>
        {meta.map(([k, v]) => (
          <div key={k}>
            <span className={styles.k}>{k}</span>
            {v}
          </div>
        ))}
      </div>
    </header>
  )
}

export function Section({
  no,
  label,
  title,
  children,
}: {
  no: string
  label: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className={styles.section}>
      <p className={styles.secNo}>
        {no} — {label}
      </p>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

/* lead paragraph — a div so MDX's markdown <p> can nest inside */
export function Lead({ children }: { children: React.ReactNode }) {
  return <div className={styles.lead}>{children}</div>
}

export function Plate({
  cap,
  tag,
  caption,
  children,
}: {
  cap?: React.ReactNode /* filled plates drop their "Plate NN" label (Jake's s55 rule); placeholders keep it, and live plates may put dynamic text here */
  tag?: string /* right-hand cap slot: a date, a ticker, a technique. The FIG. specimen letters came off in s89 — plates are numbered by their cap, if at all */
  caption?: string
  children: React.ReactNode
}) {
  return (
    <figure className={styles.figure}>
      <div className={styles.plate}>
        {(cap || tag) && (
          <div className={styles.plateCap}>
            {cap && (typeof cap === 'string' ? <span>{cap}</span> : cap)}
            {tag && <span className={styles.tag}>{tag}</span>}
          </div>
        )}
        {children}
        <div className="halftone" aria-hidden="true" />
      </div>
      {caption && <figcaption className={styles.figcap}>{caption}</figcaption>}
    </figure>
  )
}

/* dashed placeholder: every image surface is swappable later (§11).
   The status line is a copy key (case.placeholder.pending) so it reads
   in the machine's voice per skin. CopyText is a client island, which is
   how CaseIndex reads copy from these server-rendered files too. */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.placeholder}>
      <div>{children}</div>
      <CopyText k="case.placeholder.pending" as="div" className={styles.placeholderStatus} />
    </div>
  )
}

export function Moves({ children }: { children: React.ReactNode }) {
  return <div className={styles.moves}>{children}</div>
}

export function Move({
  n,
  title,
  img,
  imgAlt,
  children,
}: {
  n: string
  title: string
  img?: string
  imgAlt?: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.move}>
      {img && (
        <img
          className={styles.moveArt}
          src={img}
          alt={imgAlt ?? ''}
          width={1200}
          height={675}
          loading="lazy"
          draggable={false}
        />
      )}
      <div className={styles.n}>Move {n}</div>
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export function Decide({
  cap,
  questions,
}: {
  cap: string
  questions: Array<{ n: string; q: string; tag: string }>
}) {
  return (
    <div className={styles.decide}>
      <p className={styles.decideCap}>{cap}</p>
      {questions.map((item) => (
        <div key={item.n} className={styles.q}>
          <span className={styles.qn}>{item.n}</span>
          <span className={styles.qt}>{item.q}</span>
          <span className={styles.qtag}>{item.tag}</span>
        </div>
      ))}
    </div>
  )
}

/* interstitial display statement — one beat of the argument, oversized */
export function Claim({ children }: { children: React.ReactNode }) {
  return <p className={styles.claim}>{children}</p>
}

/* mono spec-sheet — terse facts instead of paragraphs */
export function Ledger({
  cap,
  rows,
}: {
  cap: string
  rows: Array<[string, React.ReactNode]>
}) {
  return (
    <div className={styles.ledger}>
      <p className={styles.ledgerCap}>{cap}</p>
      {rows.map(([k, v]) => (
        <div key={k} className={styles.ledgerRow}>
          <span className={styles.ledgerKey}>{k}</span>
          <span className={styles.ledgerVal}>{v}</span>
        </div>
      ))}
    </div>
  )
}

export function PullQuote({ children, cite }: { children: React.ReactNode; cite: string }) {
  return (
    <blockquote className={styles.quote}>
      {children}
      <cite>— {cite}</cite>
    </blockquote>
  )
}

export function Metrics({ children }: { children: React.ReactNode }) {
  return <div className={styles.metrics}>{children}</div>
}

export function Stat({
  big,
  label,
  secondary,
}: {
  big: React.ReactNode
  label: string
  secondary?: boolean
}) {
  return (
    <div>
      <div className={`${styles.statBig} ${secondary ? styles.secondary : ''}`}>{big}</div>
      <div className={styles.statLab}>{label}</div>
    </div>
  )
}
