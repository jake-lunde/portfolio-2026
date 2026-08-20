import Content from '@content/family-hub.mdx'
import { CaseIndex } from '@/components/case/CaseIndex'
import { FidelitySwitch } from '@/components/case/FidelitySwitch'
import styles from '@/components/case/case.module.css'

export default function CaseFamilyHub() {
  return (
    /* hasFid: the read-o-meter cedes its left end to FIDELITY.SW */
    <article className={`${styles.case} ${styles.hasRail} ${styles.hasFid}`}>
      <CaseIndex />
      <FidelitySwitch />
      <div className={styles.wrap}>
        <Content />
      </div>
    </article>
  )
}
