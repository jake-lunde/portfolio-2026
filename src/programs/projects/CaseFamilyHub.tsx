import Content from '@content/family-hub.mdx'
import { CaseIndex } from '@/components/case/CaseIndex'
import styles from '@/components/case/case.module.css'

/* FIDELITY.SW lives in the window bar, not here — the case registers
   it as its titleWidget (projects/cases.ts). */
export default function CaseFamilyHub() {
  return (
    <article className={styles.case}>
      <CaseIndex />
      <div className={styles.wrap}>
        <Content />
      </div>
    </article>
  )
}
