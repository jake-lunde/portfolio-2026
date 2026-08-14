import Content from '@content/family-hub.mdx'
import { CaseIndex } from '@/components/case/CaseIndex'
import styles from '@/components/case/case.module.css'

export default function CaseFamilyHub() {
  return (
    <article className={`${styles.case} ${styles.hasRail}`}>
      <CaseIndex />
      <div className={styles.wrap}>
        <Content />
      </div>
    </article>
  )
}
