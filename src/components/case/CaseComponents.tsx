import styles from './case.module.css'

/* Static case-study vocabulary (§7 anatomy). Interactive islands live
   in their own 'use client' files. */

export function Hero({
  eyebrow,
  title,
  thesis,
  meta,
}: {
  eyebrow: string
  title: string
  thesis: React.ReactNode
  meta: Array<[string, string]>
}) {
  return (
    <header className={styles.hero}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.thesis}>{thesis}</p>
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
  fig,
  caption,
  children,
}: {
  cap: string
  fig: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <figure className={styles.figure}>
      <div className={styles.plate}>
        <div className={styles.plateCap}>
          <span>{cap}</span>
          <span className={styles.fig}>{fig}</span>
        </div>
        {children}
        <div className="halftone" aria-hidden="true" />
      </div>
      {caption && <figcaption className={styles.figcap}>{caption}</figcaption>}
    </figure>
  )
}

/* dashed placeholder — every image surface is swappable later (§11) */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return <div className={styles.placeholder}>{children}</div>
}

export function Moves({ children }: { children: React.ReactNode }) {
  return <div className={styles.moves}>{children}</div>
}

export function Move({
  n,
  title,
  children,
}: {
  n: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.move}>
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
