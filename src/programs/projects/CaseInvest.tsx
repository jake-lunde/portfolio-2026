import Content from '@content/greenlight-invest.mdx'
import { CaseIndex } from '@/components/case/CaseIndex'
import styles from '@/components/case/case.module.css'

export default function CaseInvest() {
  return (
    <article className={styles.case}>
      <CaseIndex />
      <div className={styles.wrap}>
        <Content />
      </div>
    </article>
  )
}
