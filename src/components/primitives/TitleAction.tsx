import { Icon, type IconName } from '@/components/shell/Icon'
import styles from './TitleAction.module.css'

/* THE TITLEBAR ACTION — the meta slot's third occupant, alongside the
   doc-id (.titleMeta) and the "what is this" explainer (.explainer), both
   defined in shell.module.css. This one lives here instead, as its own
   primitive: Window.tsx (src/components/shell/Window.tsx) owns the slot's
   layout but not that stylesheet this round, so a program that registers
   `titleAction` (see registry.tsx) gets a real <a> — a resume download is
   a navigation, not a dialog — styled to the explainer button's own
   footprint (mono caption, hairline box that inks in on hover) so it
   reads as the same weight of chrome control, just doing a different job.

   The titlebar is a drag handle and double-click zooms the window; this
   link stops both from firing on it, same as the explainer wrapper does. */

export function TitleAction({
  icon,
  label,
  href,
  download,
}: {
  icon: IconName
  label: string
  href: string
  download?: boolean
}) {
  return (
    <a
      href={href}
      download={download || undefined}
      className={styles.titleAction}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Icon name={icon} size={14} />
      <span>{label}</span>
    </a>
  )
}
