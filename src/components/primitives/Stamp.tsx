import styles from './primitives.module.css'

/* No data-part here, and that is the whole anatomy: a stamp is one element.
   It wore a PINK marker for one round, back when STYLER read its layers off
   the token names and --stamp-pink-fg looked like a part. It was never one —
   the pink stamp is this same span with a second class on it — so the tree
   declares a single node (lib/stylerAnatomy.ts) and the pink rows sit on it
   beside the blue ones. data-component below is the marker the bench picks
   the root by. */
export function Stamp({
  children,
  tone = 'blue',
}: {
  children: React.ReactNode
  tone?: 'blue' | 'pink'
}) {
  return (
    <span
      className={`${styles.stamp} ${tone === 'pink' ? styles.stampPink : ''}`}
      data-component="stamp"
    >
      {children}
    </span>
  )
}
