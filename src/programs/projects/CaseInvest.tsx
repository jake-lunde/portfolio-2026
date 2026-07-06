import Content from '@content/greenlight-invest.mdx'
import styles from '@/components/case/case.module.css'

export default function CaseInvest() {
  return (
    <article className={styles.case}>
      <div className={styles.wrap}>
        <Content />
      </div>
    </article>
  )
}
