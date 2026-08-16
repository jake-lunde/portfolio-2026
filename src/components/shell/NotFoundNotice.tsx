import { CopyText } from '@/content/CopyText'
import styles from './shell.module.css'

/* The 404, said in the machine's own register. A missing URL does not get
   an error page here: the desk boots as it always does with README open,
   and this one line in the corner is the only thing that tells you the
   path was wrong (src/app/not-found.tsx).

   The line itself comes through the copy layer, so it resolves per skin
   (the medieval desk says it in knight-speak) and INSPECT can pick it like
   any other string. `role="status"` puts it after the desk in the reading
   order rather than losing it among the windows. */
export function NotFoundNotice() {
  return (
    <p className={styles.notFound} role="status">
      <CopyText k="notfound.line" />
    </p>
  )
}
