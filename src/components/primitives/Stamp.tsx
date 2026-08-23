import styles from './primitives.module.css'

/* data-part on the pink stamp is STYLER's anatomy marker: the component's
   token names declare two layers, STAMP and PINK (lib/stylerBlocks.ts:
   layersFor), and a pink stamp IS the second one, so ⌘+click on the stage's
   bench lands on the rows that paint it. The blue stamp carries none — it is
   the root layer, which data-component already names. Button gets no markers
   at all for the reason this one does: its layers are SM · MD · SOLID ·
   SYSTEM · EXPRESSIVE and one button element is three of them at once, so
   there is no single honest answer to put in the attribute. */
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
      data-part={tone === 'pink' ? 'pink' : undefined}
    >
      {children}
    </span>
  )
}
