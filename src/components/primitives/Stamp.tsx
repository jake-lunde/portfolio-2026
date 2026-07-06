import styles from './primitives.module.css'

export function Stamp({
  children,
  tone = 'blue',
}: {
  children: React.ReactNode
  tone?: 'blue' | 'pink'
}) {
  return (
    <span className={`${styles.stamp} ${tone === 'pink' ? styles.stampPink : ''}`}>
      {children}
    </span>
  )
}
