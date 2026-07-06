import { Stamp } from './Stamp'
import styles from './primitives.module.css'

export function UnderConstruction({ note }: { note: string }) {
  return (
    <div className={styles.uc}>
      <div className={styles.ucInner}>
        <span className={styles.ucGlyph} aria-hidden="true">
          工事中
        </span>
        <Stamp>Under construction</Stamp>
        <p className={styles.ucNote}>{note}</p>
      </div>
    </div>
  )
}
