import Content from '@content/family-hub.mdx'
import styles from '@/components/case/case.module.css'

export default function CaseFamilyHub() {
  return (
    <article className={`${styles.case} ${styles.hasRail}`}>
      <div className={styles.wrap}>
        <Content />
      </div>
    </article>
  )
}
